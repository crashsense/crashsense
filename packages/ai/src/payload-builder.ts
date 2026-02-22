import type { CrashEvent, AIPayload } from '@crashsense/types';

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

function formatRelativeTime(eventTimestamp: number, referenceTimestamp: number): string {
  const delta = (eventTimestamp - referenceTimestamp) / 1000;
  if (delta >= 0) return '0s';
  return `${delta.toFixed(1)}s`;
}

export function buildAIPayload(event: CrashEvent): AIPayload {
  const stackTop5 = event.error.stack.slice(0, 5).map(
    (f) => `at ${f.function} (${f.filename}:${f.lineno}:${f.colno})`,
  );

  const userCodeFrames = event.error.stack
    .filter((f) => f.inApp)
    .slice(0, 5)
    .map((f) => `at ${f.function} (${f.filename}:${f.lineno}:${f.colno})`);

  const memUtil = event.system.memory.utilizationPercent;
  const memUtilStr = memUtil !== null ? `${memUtil}%` : 'N/A';

  const last5Breadcrumbs = event.breadcrumbs.slice(-5).map((bc) => ({
    type: bc.type,
    message: truncate(bc.message, 100),
    time: formatRelativeTime(bc.timestamp, event.timestamp),
  }));

  return {
    crash_summary: {
      category: event.category,
      subcategory: event.subcategory,
      heuristic_confidence: event.confidence,
      severity: event.severity,
    },
    error: {
      type: event.error.type,
      message: truncate(event.error.message, 500),
      stack_top_5: stackTop5,
      user_code_frames: userCodeFrames,
    },
    system_state: {
      memory_utilization: memUtilStr,
      memory_trend: event.system.memory.trend,
      long_tasks_last_30s: event.system.cpu.longTasksLast30s,
      fps_at_crash: event.system.eventLoop.fps,
      pending_network_requests: event.system.network.pendingRequests,
      failed_requests_last_60s: event.system.network.failedRequestsLast60s,
    },
    device: {
      platform: truncate(event.device.userAgent, 80),
      memory: event.device.deviceMemory !== null ? `${event.device.deviceMemory}GB` : 'N/A',
      viewport: `${event.device.viewport.width}x${event.device.viewport.height}`,
      connection: event.system.network.connectionType ?? 'unknown',
    },
    framework: {
      name: event.framework.name,
      version: event.framework.version,
      lifecycle_stage: event.framework.lifecycleStage ?? 'unknown',
      component_path: event.framework.componentTree ?? [],
      render_count_since_nav: event.framework.renderCount ?? 0,
    },
    breadcrumbs_last_5: last5Breadcrumbs,
    contributing_factors: event.contributingFactors.map((f) => ({
      factor: f.factor,
      weight: f.weight,
      evidence: truncate(f.evidence, 150),
    })),
  };
}
