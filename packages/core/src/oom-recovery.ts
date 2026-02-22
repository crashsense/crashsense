import type {
  OOMRecoveryReport,
  OOMSignal,
  EventBus,
  ResolvedConfig,
} from '@crashsense/types';
import { generateId, collectDeviceInfo } from '@crashsense/utils';
import { readCheckpoint, clearCheckpoint } from './checkpoint-manager';

/**
 * OOM Recovery Detection
 *
 * On mobile browsers, when memory pressure exceeds OS thresholds, the browser
 * kills the tab WITHOUT firing any JavaScript events (no beforeunload, no pagehide).
 * All in-memory data is lost.
 *
 * This module detects OOM kills by:
 * 1. Reading the last checkpoint from sessionStorage (written by checkpoint-manager)
 * 2. Analyzing signals: time since checkpoint, document.wasDiscarded, navigation type,
 *    memory trend, pre-crash warnings
 * 3. Computing an OOM probability score
 * 4. If probability exceeds threshold, emitting an OOM recovery report
 *
 * This runs ONCE at SDK initialization, before any other monitoring starts.
 */

interface WasDiscardedDocument extends Document {
  wasDiscarded?: boolean;
}

function getNavigationType(): string {
  try {
    if (typeof performance === 'undefined') return 'unknown';
    const entries = performance.getEntriesByType('navigation');
    if (entries.length > 0) {
      return (entries[0] as PerformanceNavigationTiming).type || 'unknown';
    }
  } catch {
    // Ignore
  }
  return 'unknown';
}

function getWasDiscarded(): boolean | undefined {
  try {
    const doc = document as WasDiscardedDocument;
    if ('wasDiscarded' in doc) {
      return doc.wasDiscarded;
    }
  } catch {
    // Ignore
  }
  return undefined;
}

export function detectOOMRecovery(
  bus: EventBus,
  config: ResolvedConfig,
  currentSessionId: string,
): OOMRecoveryReport | null {
  if (typeof window === 'undefined') return null;

  const checkpoint = readCheckpoint();
  if (!checkpoint) return null;

  // Clear the checkpoint immediately to prevent re-reporting
  clearCheckpoint();

  const now = Date.now();
  const timeSinceCheckpoint = now - checkpoint.timestamp;

  // If checkpoint is older than 5 minutes, this is likely a manual reload/navigation,
  // not an OOM kill. OOM kills happen while the page is active — the checkpoint
  // would be at most ~checkpointInterval + a few seconds old.
  const MAX_OOM_AGE = 5 * 60 * 1000; // 5 minutes
  if (timeSinceCheckpoint > MAX_OOM_AGE) return null;

  // Verify this checkpoint belongs to the same app
  if (checkpoint.appId !== config.appId) return null;

  const wasDiscarded = getWasDiscarded();
  const navigationType = getNavigationType();
  const deviceInfo = collectDeviceInfo();

  // ---- Signal Analysis ----
  const signals: OOMSignal[] = [];
  let probability = 0;

  // Signal 1: document.wasDiscarded (Chrome 68+, Android)
  // Most reliable signal — OS confirmed it discarded the page
  if (wasDiscarded === true) {
    probability += 0.45;
    signals.push({
      signal: 'document_was_discarded',
      weight: 0.45,
      evidence: 'document.wasDiscarded is true — OS confirmed tab discard',
    });
  }

  // Signal 2: Navigation type + recency
  // OOM kills result in 'reload' navigation type.
  // If checkpoint is < 30s old AND nav type is reload → very likely OOM
  if (navigationType === 'reload' && timeSinceCheckpoint < 30_000) {
    probability += 0.25;
    signals.push({
      signal: 'recent_reload',
      weight: 0.25,
      evidence: `Page reloaded ${Math.round(timeSinceCheckpoint / 1000)}s after last checkpoint`,
    });
  } else if (navigationType === 'reload' && timeSinceCheckpoint < 60_000) {
    probability += 0.15;
    signals.push({
      signal: 'moderate_reload',
      weight: 0.15,
      evidence: `Page reloaded ${Math.round(timeSinceCheckpoint / 1000)}s after last checkpoint`,
    });
  }

  // Signal 3: Memory trend was growing
  if (checkpoint.memoryTrend === 'growing') {
    probability += 0.10;
    signals.push({
      signal: 'memory_growing_trend',
      weight: 0.10,
      evidence: 'Memory was in growing trend before tab died',
    });
  } else if (checkpoint.memoryTrend === 'spike') {
    probability += 0.08;
    signals.push({
      signal: 'memory_spike',
      weight: 0.08,
      evidence: 'Memory was spiking before tab died',
    });
  }

  // Signal 4: Pre-crash warnings were active
  if (checkpoint.preCrashWarnings.length > 0) {
    const highestLevel = checkpoint.preCrashWarnings.reduce((max, w) => {
      const severity = { elevated: 1, critical: 2, imminent: 3 } as Record<string, number>;
      return (severity[w.level] || 0) > (severity[max.level] || 0) ? w : max;
    }, checkpoint.preCrashWarnings[0]);

    if (highestLevel.level === 'imminent') {
      probability += 0.15;
      signals.push({
        signal: 'pre_crash_warning_imminent',
        weight: 0.15,
        evidence: `Pre-crash warning at IMMINENT level: ${highestLevel.reason}`,
      });
    } else if (highestLevel.level === 'critical') {
      probability += 0.10;
      signals.push({
        signal: 'pre_crash_warning_critical',
        weight: 0.10,
        evidence: `Pre-crash warning at CRITICAL level: ${highestLevel.reason}`,
      });
    } else {
      probability += 0.05;
      signals.push({
        signal: 'pre_crash_warning_elevated',
        weight: 0.05,
        evidence: `Pre-crash warning at ELEVATED level: ${highestLevel.reason}`,
      });
    }
  }

  // Signal 5: High memory utilization in last checkpoint
  const memUtil = checkpoint.systemState?.memory?.utilizationPercent;
  if (memUtil !== undefined && memUtil !== null && memUtil > 85) {
    probability += 0.10;
    signals.push({
      signal: 'high_memory_at_checkpoint',
      weight: 0.10,
      evidence: `Memory was at ${memUtil}% utilization at last checkpoint`,
    });
  }

  // Signal 6: Touch device (mobile indicator — OOM more common on mobile)
  if (checkpoint.device.touchSupport && checkpoint.device.deviceMemory !== null && checkpoint.device.deviceMemory <= 4) {
    probability += 0.05;
    signals.push({
      signal: 'mobile_low_memory_device',
      weight: 0.05,
      evidence: `Touch device with ${checkpoint.device.deviceMemory}GB RAM — higher OOM risk`,
    });
  }

  // Cap probability at 1.0
  probability = Math.min(probability, 1.0);

  // If probability is below threshold, this isn't an OOM
  if (probability < config.oomRecoveryThreshold) return null;

  const report: OOMRecoveryReport = {
    id: generateId(),
    type: 'oom_recovery',
    timestamp: now,
    probability,
    sessionId: currentSessionId,
    previousSessionId: checkpoint.sessionId,
    timeSinceLastCheckpoint: timeSinceCheckpoint,
    wasDiscarded,
    navigationType,
    lastCheckpoint: checkpoint,
    device: deviceInfo,
    signals,
  };

  // Emit event
  bus.emit('oom_recovery', { report });

  // Call user callback
  if (config.onOOMRecovery) {
    try {
      config.onOOMRecovery(report);
    } catch {
      // User callback errors must not propagate
    }
  }

  // Debug logging
  if (config.debug) {
    logOOMRecovery(report);
  }

  return report;
}

function logOOMRecovery(report: OOMRecoveryReport): void {
  if (typeof console === 'undefined') return;

  const header = `[CrashSense] OOM Recovery Detected (${(report.probability * 100).toFixed(0)}% confidence)`;
  const details = [
    `Previous session: ${report.previousSessionId}`,
    `Time since last checkpoint: ${Math.round(report.timeSinceLastCheckpoint / 1000)}s`,
    `Navigation type: ${report.navigationType}`,
    `document.wasDiscarded: ${report.wasDiscarded}`,
    `Last URL: ${report.lastCheckpoint.url}`,
    `Memory trend: ${report.lastCheckpoint.memoryTrend || 'unknown'}`,
    `Pre-crash warnings: ${report.lastCheckpoint.preCrashWarnings.length}`,
    `Breadcrumbs recovered: ${report.lastCheckpoint.breadcrumbs.length}`,
  ];

  console.groupCollapsed?.(header) ?? console.log(header);
  for (const d of details) console.log(d);
  if (report.signals.length > 0) {
    console.log('Signals:');
    for (const s of report.signals) {
      console.log(`  - ${s.signal} (${(s.weight * 100).toFixed(0)}%): ${s.evidence}`);
    }
  }
  console.groupEnd?.();
}
