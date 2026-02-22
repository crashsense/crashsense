import { describe, it, expect } from 'vitest';
import { classifyCrash } from '../crash-classifier';
import type { RawCrashEvent } from '@crashsense/types';

function makeRawEvent(overrides: Partial<RawCrashEvent> = {}): RawCrashEvent {
  return {
    id: 'test-id',
    timestamp: Date.now(),
    sessionId: 'sess-1',
    error: {
      type: 'Error',
      message: 'test error',
      stack: [],
      raw: '',
    },
    system: {},
    device: {
      userAgent: 'test',
      platform: 'test',
      vendor: '',
      deviceMemory: null,
      hardwareConcurrency: null,
      viewport: { width: 1024, height: 768 },
      devicePixelRatio: 1,
      touchSupport: false,
      colorScheme: 'light',
      reducedMotion: false,
      language: 'en',
      timezone: 'UTC',
    },
    framework: {},
    breadcrumbs: [],
    meta: {
      appId: 'test',
      environment: 'test',
      tags: {},
      sdkVersion: '0.1.0',
    },
    ...overrides,
  };
}

describe('classifyCrash', () => {
  describe('runtime_error classification', () => {
    it('classifies TypeError with high confidence', () => {
      const event = makeRawEvent({
        error: { type: 'TypeError', message: 'x is not a function', stack: [], raw: '' },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('runtime_error');
      expect(result.subcategory).toBe('typeerror');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('classifies ReferenceError', () => {
      const event = makeRawEvent({
        error: { type: 'ReferenceError', message: 'x is not defined', stack: [], raw: '' },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('runtime_error');
      expect(result.subcategory).toBe('referenceerror');
    });

    it('classifies unknown error types with lower confidence', () => {
      const event = makeRawEvent({
        error: { type: 'CustomError', message: 'something failed', stack: [], raw: '' },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('runtime_error');
      expect(result.subcategory).toBe('custom_error');
      expect(result.confidence).toBeLessThan(0.9);
    });
  });

  describe('memory_issue classification', () => {
    it('classifies high memory utilization', () => {
      const event = makeRawEvent({
        error: { type: 'Error', message: 'out of memory', stack: [], raw: '' },
        system: {
          memory: {
            usedJSHeapSize: 900,
            totalJSHeapSize: 1000,
            heapSizeLimit: 1000,
            trend: 'growing',
            utilizationPercent: 90,
          },
        },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('memory_issue');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('detects memory leak subcategory from growing trend', () => {
      const event = makeRawEvent({
        error: { type: 'Error', message: 'allocation failed', stack: [], raw: '' },
        system: {
          memory: {
            usedJSHeapSize: 900,
            totalJSHeapSize: 1000,
            heapSizeLimit: 1000,
            trend: 'growing',
            utilizationPercent: 95,
          },
        },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('memory_issue');
      expect(result.subcategory).toBe('memory_leak');
    });
  });

  describe('event_loop_blocking classification', () => {
    it('classifies critical blocking tasks', () => {
      const event = makeRawEvent({
        system: {
          cpu: {
            longTasksLast30s: 15,
            avgLongTaskDuration: 500,
            maxLongTaskDuration: 2000,
            estimatedBlockingTime: 7000,
          },
        },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('event_loop_blocking');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('framework_react classification', () => {
    it('classifies hydration mismatch', () => {
      const event = makeRawEvent({
        error: { type: 'Error', message: 'Hydration failed because the server rendered...', stack: [], raw: '' },
        framework: { name: 'react', version: '18.2.0' },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('framework_react');
      expect(result.subcategory).toBe('hydration_mismatch');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('classifies infinite re-render', () => {
      const event = makeRawEvent({
        error: { type: 'Error', message: 'Too many re-renders. React limits...', stack: [], raw: '' },
        framework: { name: 'react', version: '18.2.0' },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('framework_react');
      expect(result.subcategory).toBe('infinite_rerender');
    });

    it('classifies hook violation', () => {
      const event = makeRawEvent({
        error: { type: 'Error', message: 'Rendered fewer hooks than expected', stack: [], raw: '' },
        framework: { name: 'react', version: '18.2.0' },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('framework_react');
      expect(result.subcategory).toBe('hook_violation');
    });

    it('does not classify as react if framework is not react', () => {
      const event = makeRawEvent({
        error: { type: 'Error', message: 'Hydration failed', stack: [], raw: '' },
        framework: { name: 'vue' },
      });
      const result = classifyCrash(event);
      expect(result.category).not.toBe('framework_react');
    });
  });

  describe('framework_vue classification', () => {
    it('classifies reactivity loop', () => {
      const event = makeRawEvent({
        error: { type: 'Error', message: 'Maximum recursive updates exceeded', stack: [], raw: '' },
        framework: { name: 'vue', version: '3.3.0' },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('framework_vue');
      expect(result.subcategory).toBe('reactivity_loop');
    });

    it('classifies vue lifecycle error', () => {
      const event = makeRawEvent({
        error: { type: 'Error', message: 'some error', stack: [], raw: '' },
        framework: { name: 'vue', version: '3.3.0', lifecycleStage: 'mounted' },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('framework_vue');
      expect(result.subcategory).toBe('lifecycle_error_mounted');
    });
  });

  describe('network_induced classification', () => {
    it('classifies network-related errors', () => {
      const event = makeRawEvent({
        error: { type: 'Error', message: 'NetworkError: Failed to fetch', stack: [], raw: '' },
        system: {
          network: {
            pendingRequests: 3,
            failedRequestsLast60s: 5,
            avgLatencyLast60s: 1000,
            connectionType: '4g',
            isOnline: false,
          },
        },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('network_induced');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('classifies offline as network issue', () => {
      const event = makeRawEvent({
        error: { type: 'Error', message: 'Network request failed', stack: [], raw: '' },
        system: {
          network: {
            pendingRequests: 0,
            failedRequestsLast60s: 3,
            avgLatencyLast60s: 0,
            connectionType: null,
            isOnline: false,
          },
        },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('network_induced');
      expect(result.subcategory).toBe('offline');
    });
  });

  describe('iframe_overload classification', () => {
    it('classifies excessive iframes with high memory as iframe_overload', () => {
      const event = makeRawEvent({
        system: {
          memory: {
            usedJSHeapSize: 800,
            totalJSHeapSize: 1000,
            heapSizeLimit: 1000,
            trend: 'growing',
            utilizationPercent: 80,
          },
          iframe: {
            totalCount: 12,
            addedLast60s: 8,
            removedLast60s: 0,
            origins: ['https://a.com', 'https://b.com', 'https://c.com', 'https://d.com'],
            crossOriginCount: 4,
          },
        },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('iframe_overload');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('classifies rapid iframe creation', () => {
      const event = makeRawEvent({
        error: { type: 'Error', message: '', stack: [], raw: '' },
        system: {
          iframe: {
            totalCount: 12,
            addedLast60s: 7,
            removedLast60s: 1,
            origins: ['https://ads.com', 'https://tracker.com', 'https://widget.com', 'https://embed.com'],
            crossOriginCount: 4,
          },
        },
      });
      const result = classifyCrash(event);
      expect(result.category).toBe('iframe_overload');
      expect(result.subcategory).toBe('rapid_creation');
    });

    it('returns zero confidence when no iframe data present', () => {
      const event = makeRawEvent({ system: {} });
      const result = classifyCrash(event);
      expect(result.category).not.toBe('iframe_overload');
    });

    it('detects cross-origin overload', () => {
      const event = makeRawEvent({
        system: {
          iframe: {
            totalCount: 6,
            addedLast60s: 2,
            removedLast60s: 0,
            origins: ['https://a.com', 'https://b.com', 'https://c.com', 'https://d.com'],
            crossOriginCount: 4,
          },
        },
      });
      const result = classifyCrash(event);
      expect(result.contributingFactors.some((f) => f.factor === 'cross_origin_iframes')).toBe(true);
    });

    it('correlates iframes with memory pressure', () => {
      const event = makeRawEvent({
        system: {
          memory: {
            usedJSHeapSize: 800,
            totalJSHeapSize: 1000,
            heapSizeLimit: 1000,
            trend: 'growing',
            utilizationPercent: 75,
          },
          iframe: {
            totalCount: 12,
            addedLast60s: 3,
            removedLast60s: 0,
            origins: ['https://a.com'],
            crossOriginCount: 1,
          },
        },
      });
      const result = classifyCrash(event);
      expect(result.contributingFactors.some((f) => f.factor === 'iframe_memory_correlation')).toBe(true);
    });
  });

  it('always returns contributing factors from all evaluators', () => {
    const event = makeRawEvent({
      error: { type: 'TypeError', message: 'fetch failed', stack: [], raw: '' },
      system: {
        network: {
          pendingRequests: 0,
          failedRequestsLast60s: 2,
          avgLatencyLast60s: 500,
          connectionType: '4g',
          isOnline: true,
        },
      },
    });
    const result = classifyCrash(event);
    expect(result.contributingFactors.length).toBeGreaterThan(0);
  });
});
