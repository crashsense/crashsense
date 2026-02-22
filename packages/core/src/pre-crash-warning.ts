import type { EventBus, PreCrashLevel, ResolvedConfig } from '@crashsense/types';

interface MemoryReading {
  utilization: number;
  timestamp: number;
}

const CHECK_INTERVAL = 3000;
const TREND_WINDOW = 5;

export function createPreCrashWarning(
  bus: EventBus,
  config: ResolvedConfig,
  memoryMonitor: { getSnapshot(): { utilizationPercent: number | null } },
  iframeTracker: { getSnapshot(): { totalCount: number; addedLast60s: number; crossOriginCount: number } },
) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let lastLevel: PreCrashLevel | null = null;
  const recentReadings: MemoryReading[] = [];

  function getMemoryUtilization(): number | null {
    const snap = memoryMonitor.getSnapshot();
    return snap.utilizationPercent !== null ? snap.utilizationPercent / 100 : null;
  }

  function isGrowingTrend(): boolean {
    if (recentReadings.length < 3) return false;
    const recent = recentReadings.slice(-TREND_WINDOW);
    let increases = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].utilization > recent[i - 1].utilization) increases++;
    }
    return increases >= Math.floor(recent.length * 0.6);
  }

  function computeLevel(memUtil: number | null, iframeCount: number): { level: PreCrashLevel; reason: string } | null {
    const threshold = config.preCrashMemoryThreshold;

    // Imminent: memory > 95% OR (memory > threshold + 15% AND growing trend)
    if (memUtil !== null && memUtil > 0.95) {
      return { level: 'imminent', reason: `Memory at ${(memUtil * 100).toFixed(0)}% — crash likely` };
    }

    if (memUtil !== null && memUtil > threshold + 0.15 && isGrowingTrend()) {
      return { level: 'imminent', reason: `Memory at ${(memUtil * 100).toFixed(0)}% with growing trend` };
    }

    // Critical: memory > threshold + 5% AND (growing trend OR iframes > 5)
    if (memUtil !== null && memUtil > threshold + 0.05) {
      if (isGrowingTrend()) {
        return { level: 'critical', reason: `Memory at ${(memUtil * 100).toFixed(0)}% with growing trend` };
      }
      if (iframeCount > 5) {
        return { level: 'critical', reason: `Memory at ${(memUtil * 100).toFixed(0)}% with ${iframeCount} iframes` };
      }
    }

    // Elevated: memory > threshold AND iframes > 3
    if (memUtil !== null && memUtil > threshold && iframeCount > 3) {
      return { level: 'elevated', reason: `Memory at ${(memUtil * 100).toFixed(0)}% with ${iframeCount} iframes` };
    }

    // Elevated: memory > threshold AND growing trend
    if (memUtil !== null && memUtil > threshold && isGrowingTrend()) {
      return { level: 'elevated', reason: `Memory at ${(memUtil * 100).toFixed(0)}% with growing trend` };
    }

    return null;
  }

  const LEVEL_SEVERITY: Record<PreCrashLevel, number> = {
    elevated: 1,
    critical: 2,
    imminent: 3,
  };

  function check(): void {
    const memUtil = getMemoryUtilization();
    if (memUtil !== null) {
      recentReadings.push({ utilization: memUtil, timestamp: Date.now() });
      // Keep only recent readings
      while (recentReadings.length > TREND_WINDOW * 2) {
        recentReadings.shift();
      }
    }

    const iframeSnap = iframeTracker.getSnapshot();
    const result = computeLevel(memUtil, iframeSnap.totalCount);

    if (!result) {
      // Conditions cleared — reset so we can warn again if things deteriorate
      lastLevel = null;
      return;
    }

    // Only emit if severity increased or this is the first warning
    if (lastLevel === null || LEVEL_SEVERITY[result.level] > LEVEL_SEVERITY[lastLevel]) {
      lastLevel = result.level;

      bus.emit('pre_crash_warning', {
        level: result.level,
        memoryUtilization: memUtil,
        iframeCount: iframeSnap.totalCount,
        reason: result.reason,
        timestamp: performance.now() + performance.timeOrigin,
      });
    }
  }

  return {
    start(): void {
      if (typeof window === 'undefined') return;
      check();
      intervalId = setInterval(check, CHECK_INTERVAL);
    },

    stop(): void {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      lastLevel = null;
      recentReadings.length = 0;
    },
  };
}
