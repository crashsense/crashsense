// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPreCrashWarning } from '../pre-crash-warning';
import type { EventBus, ResolvedConfig } from '@crashsense/types';

function createMockBus(): EventBus & { handlers: Record<string, Function[]> } {
  const handlers: Record<string, Function[]> = {};
  return {
    handlers,
    on(event: string, handler: Function) {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(handler);
    },
    off(event: string, handler: Function) {
      if (handlers[event]) {
        handlers[event] = handlers[event].filter((h) => h !== handler);
      }
    },
    emit(event: string, data: unknown) {
      if (handlers[event]) {
        for (const h of handlers[event]) h(data);
      }
    },
  } as unknown as EventBus & { handlers: Record<string, Function[]> };
}

function createMockConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    appId: 'test',
    environment: 'test',
    release: '',
    sampleRate: 1,
    maxEventsPerMinute: 30,
    enableMemoryMonitoring: true,
    enableLongTaskMonitoring: true,
    enableNetworkMonitoring: true,
    enableIframeTracking: true,
    enablePreCrashWarning: true,
    preCrashMemoryThreshold: 0.80,
    piiScrubbing: true,
    debug: false,
    onCrash: null,
    ...overrides,
  };
}

describe('createPreCrashWarning', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not emit when memory is below threshold', () => {
    const bus = createMockBus();
    const emitSpy = vi.spyOn(bus, 'emit');
    const memoryMonitor = { getSnapshot: () => ({ utilizationPercent: 50 }) };
    const iframeTracker = { getSnapshot: () => ({ totalCount: 0, addedLast60s: 0, crossOriginCount: 0 }) };

    const warning = createPreCrashWarning(bus, createMockConfig(), memoryMonitor, iframeTracker);
    warning.start();

    vi.advanceTimersByTime(10000);

    const warningCalls = emitSpy.mock.calls.filter(([event]) => event === 'pre_crash_warning');
    expect(warningCalls.length).toBe(0);

    warning.stop();
  });

  it('emits elevated warning when memory above threshold with iframes > 3', () => {
    const bus = createMockBus();
    const emitSpy = vi.spyOn(bus, 'emit');
    const memoryMonitor = { getSnapshot: () => ({ utilizationPercent: 82 }) };
    const iframeTracker = { getSnapshot: () => ({ totalCount: 5, addedLast60s: 2, crossOriginCount: 1 }) };

    const warning = createPreCrashWarning(bus, createMockConfig(), memoryMonitor, iframeTracker);
    warning.start();

    const warningCalls = emitSpy.mock.calls.filter(([event]) => event === 'pre_crash_warning');
    expect(warningCalls.length).toBe(1);
    expect(warningCalls[0][1]).toMatchObject({ level: 'elevated' });

    warning.stop();
  });

  it('emits imminent warning when memory > 95%', () => {
    const bus = createMockBus();
    const emitSpy = vi.spyOn(bus, 'emit');
    const memoryMonitor = { getSnapshot: () => ({ utilizationPercent: 97 }) };
    const iframeTracker = { getSnapshot: () => ({ totalCount: 1, addedLast60s: 0, crossOriginCount: 0 }) };

    const warning = createPreCrashWarning(bus, createMockConfig(), memoryMonitor, iframeTracker);
    warning.start();

    const warningCalls = emitSpy.mock.calls.filter(([event]) => event === 'pre_crash_warning');
    expect(warningCalls.length).toBe(1);
    expect(warningCalls[0][1]).toMatchObject({ level: 'imminent' });

    warning.stop();
  });

  it('does not re-emit same or lower severity level', () => {
    const bus = createMockBus();
    const emitSpy = vi.spyOn(bus, 'emit');
    const memoryMonitor = { getSnapshot: () => ({ utilizationPercent: 82 }) };
    const iframeTracker = { getSnapshot: () => ({ totalCount: 5, addedLast60s: 2, crossOriginCount: 1 }) };

    const warning = createPreCrashWarning(bus, createMockConfig(), memoryMonitor, iframeTracker);
    warning.start();

    vi.advanceTimersByTime(6000);

    const warningCalls = emitSpy.mock.calls.filter(([event]) => event === 'pre_crash_warning');
    expect(warningCalls.length).toBe(1);

    warning.stop();
  });

  it('escalates from elevated to critical when conditions worsen', () => {
    const bus = createMockBus();
    const emitSpy = vi.spyOn(bus, 'emit');
    let utilization = 82;
    const memoryMonitor = { getSnapshot: () => ({ utilizationPercent: utilization }) };
    const iframeTracker = { getSnapshot: () => ({ totalCount: 8, addedLast60s: 3, crossOriginCount: 2 }) };

    const warning = createPreCrashWarning(bus, createMockConfig(), memoryMonitor, iframeTracker);
    warning.start();

    utilization = 87;
    vi.advanceTimersByTime(3000);
    utilization = 88;
    vi.advanceTimersByTime(3000);
    utilization = 89;
    vi.advanceTimersByTime(3000);

    const warningCalls = emitSpy.mock.calls.filter(([event]) => event === 'pre_crash_warning');
    const levels = warningCalls.map(([, data]) => (data as { level: string }).level);

    expect(levels[0]).toBe('elevated');
    expect(levels.some((l) => l === 'critical')).toBe(true);

    warning.stop();
  });

  it('resets state on stop', () => {
    const bus = createMockBus();
    const memoryMonitor = { getSnapshot: () => ({ utilizationPercent: 97 }) };
    const iframeTracker = { getSnapshot: () => ({ totalCount: 1, addedLast60s: 0, crossOriginCount: 0 }) };

    const warning = createPreCrashWarning(bus, createMockConfig(), memoryMonitor, iframeTracker);
    warning.start();
    warning.stop();

    const emitSpy = vi.spyOn(bus, 'emit');
    warning.start();

    const warningCalls = emitSpy.mock.calls.filter(([event]) => event === 'pre_crash_warning');
    expect(warningCalls.length).toBe(1);

    warning.stop();
  });

  it('handles null memory gracefully', () => {
    const bus = createMockBus();
    const emitSpy = vi.spyOn(bus, 'emit');
    const memoryMonitor = { getSnapshot: () => ({ utilizationPercent: null }) };
    const iframeTracker = { getSnapshot: () => ({ totalCount: 10, addedLast60s: 5, crossOriginCount: 3 }) };

    const warning = createPreCrashWarning(bus, createMockConfig(), memoryMonitor, iframeTracker);
    warning.start();

    vi.advanceTimersByTime(10000);

    const warningCalls = emitSpy.mock.calls.filter(([event]) => event === 'pre_crash_warning');
    expect(warningCalls.length).toBe(0);

    warning.stop();
  });
});
