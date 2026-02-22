import type { EventBus, CpuState, EventLoopState, ResolvedConfig } from '@crashsense/types';
import { RingBuffer } from '@crashsense/utils';

interface LongTaskEntry {
  duration: number;
  startTime: number;
}

const LONG_TASK_THRESHOLD = 100;
const HISTORY_SIZE = 200;

export function createEventLoopMonitor(bus: EventBus, _config: ResolvedConfig) {
  const taskHistory = new RingBuffer<LongTaskEntry>(HISTORY_SIZE);
  let observer: PerformanceObserver | null = null;
  let rafId: number | null = null;
  let lastFrameTime = 0;
  let fps = 60;

  function supportsLongTasks(): boolean {
    if (typeof PerformanceObserver === 'undefined') return false;
    try {
      const supported = PerformanceObserver.supportedEntryTypes;
      return Array.isArray(supported) && supported.includes('longtask');
    } catch {
      return false;
    }
  }

  function measureFps(timestamp: number): void {
    if (lastFrameTime > 0) {
      const delta = timestamp - lastFrameTime;
      if (delta > 0) {
        const instantFps = 1000 / delta;
        fps = fps * 0.9 + instantFps * 0.1;
      }
    }
    lastFrameTime = timestamp;
    rafId = requestAnimationFrame(measureFps);
  }

  return {
    start(): void {
      if (typeof window === 'undefined') return;

      if (supportsLongTasks()) {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const task: LongTaskEntry = {
              duration: entry.duration,
              startTime: entry.startTime,
            };
            taskHistory.push(task);

            if (entry.duration > LONG_TASK_THRESHOLD) {
              bus.emit('long_task', {
                duration: entry.duration,
                startTime: entry.startTime,
                timestamp: performance.now() + performance.timeOrigin,
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      }

      if (typeof requestAnimationFrame !== 'undefined') {
        rafId = requestAnimationFrame(measureFps);
      }
    },

    stop(): void {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },

    getCpuSnapshot(): CpuState {
      const now = performance.now();
      const tasks = taskHistory.drain();
      const recentTasks = tasks.filter((t) => now - t.startTime < 30000);

      const durations = recentTasks.map((t) => t.duration);
      const totalBlocking = durations
        .filter((d) => d > 50)
        .reduce((sum, d) => sum + (d - 50), 0);

      return {
        longTasksLast30s: recentTasks.length,
        avgLongTaskDuration: durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0,
        maxLongTaskDuration: durations.length > 0
          ? Math.max(...durations)
          : 0,
        estimatedBlockingTime: totalBlocking,
      };
    },

    getEventLoopSnapshot(): EventLoopState {
      const cpuState = this.getCpuSnapshot();
      return {
        isBlocked: cpuState.maxLongTaskDuration > 1000,
        blockDuration: cpuState.maxLongTaskDuration > 0 ? cpuState.maxLongTaskDuration : null,
        fps: Math.round(fps),
      };
    },
  };
}
