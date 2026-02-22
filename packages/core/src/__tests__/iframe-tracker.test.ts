// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createIframeTracker } from '../iframe-tracker';
import type { EventBus, ResolvedConfig } from '@crashsense/types';

function createMockBus(): EventBus {
  const handlers: Record<string, Function[]> = {};
  return {
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
  } as unknown as EventBus;
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

describe('createIframeTracker', () => {
  let observeCallback: MutationCallback;
  let disconnectSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    disconnectSpy = vi.fn();
    vi.stubGlobal('MutationObserver', class {
      constructor(cb: MutationCallback) {
        observeCallback = cb;
      }
      observe = vi.fn();
      disconnect = disconnectSpy;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns zero counts when no iframes exist', () => {
    const bus = createMockBus();
    const tracker = createIframeTracker(bus, createMockConfig());
    const snap = tracker.getSnapshot();
    expect(snap.totalCount).toBe(0);
    expect(snap.addedLast60s).toBe(0);
    expect(snap.removedLast60s).toBe(0);
    expect(snap.origins).toEqual([]);
    expect(snap.crossOriginCount).toBe(0);
  });

  it('emits iframe_added when iframe node is added', () => {
    const bus = createMockBus();
    const emitSpy = vi.spyOn(bus, 'emit');
    const tracker = createIframeTracker(bus, createMockConfig());
    tracker.start();

    const iframe = document.createElement('iframe');
    iframe.src = 'https://example.com/embed';
    document.body.appendChild(iframe);

    const mutation = {
      addedNodes: [iframe] as unknown as NodeList,
      removedNodes: [] as unknown as NodeList,
      type: 'childList',
    } as MutationRecord;

    observeCallback([mutation], {} as MutationObserver);

    const addedCalls = emitSpy.mock.calls.filter(([event]) => event === 'iframe_added');
    expect(addedCalls.length).toBe(1);
    expect(addedCalls[0][1]).toMatchObject({
      src: 'https://example.com/embed',
      origin: 'https://example.com',
      crossOrigin: true,
    });

    document.body.removeChild(iframe);
    tracker.stop();
  });

  it('emits iframe_removed when iframe node is removed', () => {
    const bus = createMockBus();
    const emitSpy = vi.spyOn(bus, 'emit');
    const tracker = createIframeTracker(bus, createMockConfig());
    tracker.start();

    const iframe = document.createElement('iframe');
    iframe.src = 'https://example.com/embed';

    const removeMutation = {
      addedNodes: [] as unknown as NodeList,
      removedNodes: [iframe] as unknown as NodeList,
      type: 'childList',
    } as MutationRecord;

    observeCallback([removeMutation], {} as MutationObserver);

    const removedCalls = emitSpy.mock.calls.filter(([event]) => event === 'iframe_removed');
    expect(removedCalls.length).toBe(1);

    tracker.stop();
  });

  it('detects nested iframes inside added container', () => {
    const bus = createMockBus();
    const emitSpy = vi.spyOn(bus, 'emit');
    const tracker = createIframeTracker(bus, createMockConfig());
    tracker.start();

    const container = document.createElement('div');
    const iframe1 = document.createElement('iframe');
    iframe1.src = 'https://a.com';
    const iframe2 = document.createElement('iframe');
    iframe2.src = 'https://b.com';
    container.appendChild(iframe1);
    container.appendChild(iframe2);

    const mutation = {
      addedNodes: [container] as unknown as NodeList,
      removedNodes: [] as unknown as NodeList,
      type: 'childList',
    } as MutationRecord;

    observeCallback([mutation], {} as MutationObserver);

    const addedCalls = emitSpy.mock.calls.filter(([event]) => event === 'iframe_added');
    expect(addedCalls.length).toBe(2);

    tracker.stop();
  });

  it('disconnects observer on stop', () => {
    const bus = createMockBus();
    const tracker = createIframeTracker(bus, createMockConfig());
    tracker.start();
    tracker.stop();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('tracks addedLast60s in snapshot', () => {
    const bus = createMockBus();
    const tracker = createIframeTracker(bus, createMockConfig());
    tracker.start();

    const iframe = document.createElement('iframe');
    iframe.src = 'https://example.com';
    document.body.appendChild(iframe);

    const mutation = {
      addedNodes: [iframe] as unknown as NodeList,
      removedNodes: [] as unknown as NodeList,
      type: 'childList',
    } as MutationRecord;

    observeCallback([mutation], {} as MutationObserver);

    const snap = tracker.getSnapshot();
    expect(snap.addedLast60s).toBe(1);

    document.body.removeChild(iframe);
    tracker.stop();
  });
});
