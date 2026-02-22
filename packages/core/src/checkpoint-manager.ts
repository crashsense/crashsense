import type {
  CheckpointData,
  Breadcrumb,
  EventBus,
  ResolvedConfig,
  SystemState,
  DeviceInfo,
  PreCrashLevel,
  MemoryTrend,
} from '@crashsense/types';

const CHECKPOINT_KEY = '__crashsense_checkpoint';
const CHECKPOINT_VERSION = 1;

/**
 * Periodically writes system state checkpoints to sessionStorage.
 *
 * When the browser OOM-kills a tab, all in-memory data is lost.
 * By writing snapshots every N seconds, we preserve the last known
 * state so the next page load can detect and report the OOM crash.
 *
 * Uses sessionStorage because:
 * - Survives tab reload (same browsing context)
 * - Does NOT survive manual tab close (correct behavior — avoids stale data)
 * - Synchronous API — guaranteed to complete before tab is killed
 * - ~5MB per origin — more than enough for checkpoint data
 */
export function createCheckpointManager(
  bus: EventBus,
  config: ResolvedConfig,
  sessionId: string,
  deviceInfo: DeviceInfo,
  getSystemState: () => Partial<SystemState>,
  getBreadcrumbs: () => Breadcrumb[],
) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let checkpointCount = 0;
  const preCrashWarnings: Array<{ level: PreCrashLevel; reason: string; timestamp: number }> = [];
  let lastMemoryTrend: MemoryTrend | null = null;

  function hasSessionStorage(): boolean {
    try {
      return typeof sessionStorage !== 'undefined' && sessionStorage !== null;
    } catch {
      // SecurityError: access denied in some contexts (cross-origin iframes, etc.)
      return false;
    }
  }

  function writeCheckpoint(): void {
    if (!hasSessionStorage()) return;

    checkpointCount++;

    const systemState = getSystemState();
    if (systemState.memory?.trend) {
      lastMemoryTrend = systemState.memory.trend;
    }

    const checkpoint: CheckpointData = {
      version: CHECKPOINT_VERSION,
      timestamp: Date.now(),
      sessionId,
      appId: config.appId,
      url: typeof location !== 'undefined' ? location.href : '',
      breadcrumbs: getBreadcrumbs().slice(-20),
      systemState,
      device: deviceInfo,
      preCrashWarnings: preCrashWarnings.slice(-5),
      memoryTrend: lastMemoryTrend,
      checkpointCount,
    };

    try {
      sessionStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoint));
      bus.emit('checkpoint_written', { timestamp: checkpoint.timestamp, sessionId });
    } catch {
      // sessionStorage full or write failed — attempt to write minimal checkpoint
      try {
        const minimal: CheckpointData = {
          ...checkpoint,
          breadcrumbs: checkpoint.breadcrumbs.slice(-5),
          systemState: { memory: systemState.memory },
        };
        sessionStorage.setItem(CHECKPOINT_KEY, JSON.stringify(minimal));
      } catch {
        // Storage completely inaccessible — nothing we can do
      }
    }
  }

  // Listen for pre-crash warnings to include in checkpoints
  bus.on('pre_crash_warning', (data) => {
    preCrashWarnings.push({
      level: data.level,
      reason: data.reason,
      timestamp: data.timestamp,
    });
    // Keep only last 10 warnings
    while (preCrashWarnings.length > 10) {
      preCrashWarnings.shift();
    }
    // Write an immediate checkpoint when pre-crash warning fires
    // This maximizes data survival when OOM is imminent
    writeCheckpoint();
  });

  // Write checkpoint on every crash detection (the callback may not complete before OOM)
  bus.on('crash_detected', () => {
    writeCheckpoint();
  });

  return {
    start(): void {
      if (typeof window === 'undefined') return;
      if (!hasSessionStorage()) return;

      // Write initial checkpoint immediately
      writeCheckpoint();

      // Then write periodically
      intervalId = setInterval(writeCheckpoint, config.checkpointInterval);
    },

    stop(): void {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },

    /** Force an immediate checkpoint write (used by lifecycle flush) */
    flush(): void {
      writeCheckpoint();
    },

    /** Read and remove the stored checkpoint (used by OOM recovery on next load) */
    static: {
      readCheckpoint(): CheckpointData | null {
        try {
          if (typeof sessionStorage === 'undefined') return null;
          const raw = sessionStorage.getItem(CHECKPOINT_KEY);
          if (!raw) return null;
          const data = JSON.parse(raw) as CheckpointData;
          if (data.version !== CHECKPOINT_VERSION) return null;
          return data;
        } catch {
          return null;
        }
      },

      clearCheckpoint(): void {
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(CHECKPOINT_KEY);
          }
        } catch {
          // Ignore
        }
      },
    },

    /** Clear checkpoint on clean shutdown (destroy) */
    clearOnDestroy(): void {
      try {
        if (hasSessionStorage()) {
          sessionStorage.removeItem(CHECKPOINT_KEY);
        }
      } catch {
        // Ignore
      }
    },
  };
}

// Static helpers exported separately for use by oom-recovery before CrashSense init
export function readCheckpoint(): CheckpointData | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(CHECKPOINT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CheckpointData;
    if (data.version !== CHECKPOINT_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearCheckpoint(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(CHECKPOINT_KEY);
    }
  } catch {
    // Ignore
  }
}
