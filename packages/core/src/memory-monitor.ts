import type { EventBus, MemoryState, MemoryTrend, ResolvedConfig } from '@crashsense/types';
import { RingBuffer } from '@crashsense/utils';

interface MemorySample {
  used: number;
  total: number;
  limit: number;
  timestamp: number;
}

const SAMPLE_INTERVAL = 5000;
const HISTORY_SIZE = 12;
const WARNING_THRESHOLD = 0.85;

function computeTrend(samples: MemorySample[]): MemoryTrend {
  if (samples.length < 3) return 'stable';

  const recent = samples.slice(-6);
  const first = recent[0].used;
  const last = recent[recent.length - 1].used;
  const growthRate = (last - first) / first;

  if (growthRate > 0.2) return 'growing';
  if (growthRate < -0.2) return 'shrinking';

  const shortRecent = samples.slice(-3);
  const min = Math.min(...shortRecent.map((s) => s.used));
  const max = Math.max(...shortRecent.map((s) => s.used));
  if (max > 0 && (max - min) / max > 0.2) return 'spike';

  return 'stable';
}

export function createMemoryMonitor(bus: EventBus, _config: ResolvedConfig) {
  const history = new RingBuffer<MemorySample>(HISTORY_SIZE);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function hasPerformanceMemory(): boolean {
    return typeof performance !== 'undefined' &&
      'memory' in performance &&
      (performance as unknown as { memory: { usedJSHeapSize: number } }).memory !== undefined;
  }

  function sample(): void {
    if (!hasPerformanceMemory()) return;

    const mem = (performance as unknown as {
      memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
    }).memory;

    const s: MemorySample = {
      used: mem.usedJSHeapSize,
      total: mem.totalJSHeapSize,
      limit: mem.jsHeapSizeLimit,
      timestamp: Date.now(),
    };
    history.push(s);

    const utilization = s.limit > 0 ? s.used / s.limit : 0;
    if (utilization > WARNING_THRESHOLD) {
      const samples = history.drain();
      bus.emit('memory_warning', {
        utilization,
        trend: computeTrend(samples),
        timestamp: performance.now() + performance.timeOrigin,
      });
    }
  }

  return {
    start(): void {
      if (!hasPerformanceMemory()) return;
      sample();
      intervalId = setInterval(sample, SAMPLE_INTERVAL);
    },

    stop(): void {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },

    getSnapshot(): MemoryState {
      if (!hasPerformanceMemory()) {
        return {
          usedJSHeapSize: null,
          totalJSHeapSize: null,
          heapSizeLimit: null,
          trend: 'stable',
          utilizationPercent: null,
        };
      }

      const mem = (performance as unknown as {
        memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      }).memory;

      const samples = history.drain();
      const utilization = mem.jsHeapSizeLimit > 0
        ? mem.usedJSHeapSize / mem.jsHeapSizeLimit
        : null;

      return {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        heapSizeLimit: mem.jsHeapSizeLimit,
        trend: computeTrend(samples),
        utilizationPercent: utilization !== null ? Math.round(utilization * 100) : null,
      };
    },
  };
}
