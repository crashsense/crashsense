import { describe, it, expect } from 'vitest';
import { resolveConfig } from '../config';

describe('resolveConfig', () => {
  it('applies default values', () => {
    const config = resolveConfig({ appId: 'test-app' });
    expect(config.appId).toBe('test-app');
    expect(config.environment).toBe('production');
    expect(config.release).toBe('');
    expect(config.sampleRate).toBe(1.0);
    expect(config.maxEventsPerMinute).toBe(30);
    expect(config.enableMemoryMonitoring).toBe(true);
    expect(config.enableLongTaskMonitoring).toBe(true);
    expect(config.enableNetworkMonitoring).toBe(true);
    expect(config.enableIframeTracking).toBe(true);
    expect(config.enablePreCrashWarning).toBe(true);
    expect(config.preCrashMemoryThreshold).toBe(0.80);
    expect(config.piiScrubbing).toBe(true);
    expect(config.debug).toBe(false);
    expect(config.onCrash).toBeNull();
  });

  it('respects user-provided values', () => {
    const onCrash = () => {};
    const config = resolveConfig({
      appId: 'my-app',
      environment: 'staging',
      release: 'v1.2.3',
      sampleRate: 0.5,
      maxEventsPerMinute: 10,
      enableMemoryMonitoring: false,
      enableLongTaskMonitoring: false,
      enableNetworkMonitoring: false,
      piiScrubbing: false,
      enableIframeTracking: false,
      enablePreCrashWarning: false,
      preCrashMemoryThreshold: 0.70,
      debug: true,
      onCrash,
    });
    expect(config.environment).toBe('staging');
    expect(config.release).toBe('v1.2.3');
    expect(config.sampleRate).toBe(0.5);
    expect(config.maxEventsPerMinute).toBe(10);
    expect(config.enableMemoryMonitoring).toBe(false);
    expect(config.enableLongTaskMonitoring).toBe(false);
    expect(config.enableNetworkMonitoring).toBe(false);
    expect(config.piiScrubbing).toBe(false);
    expect(config.enableIframeTracking).toBe(false);
    expect(config.enablePreCrashWarning).toBe(false);
    expect(config.preCrashMemoryThreshold).toBe(0.70);
    expect(config.debug).toBe(true);
    expect(config.onCrash).toBe(onCrash);
  });

  it('throws if appId is missing', () => {
    expect(() => resolveConfig({ appId: '' })).toThrow('appId is required');
  });

  it('throws for invalid sampleRate (> 1)', () => {
    expect(() => resolveConfig({ appId: 'a', sampleRate: 1.5 })).toThrow(
      'sampleRate must be between 0 and 1',
    );
  });

  it('throws for invalid sampleRate (< 0)', () => {
    expect(() => resolveConfig({ appId: 'a', sampleRate: -0.1 })).toThrow(
      'sampleRate must be between 0 and 1',
    );
  });

  it('throws for non-positive maxEventsPerMinute', () => {
    expect(() =>
      resolveConfig({ appId: 'a', maxEventsPerMinute: 0 }),
    ).toThrow('maxEventsPerMinute must be positive');
    expect(() =>
      resolveConfig({ appId: 'a', maxEventsPerMinute: -5 }),
    ).toThrow('maxEventsPerMinute must be positive');
  });

  it('allows sampleRate of 0', () => {
    const config = resolveConfig({ appId: 'a', sampleRate: 0 });
    expect(config.sampleRate).toBe(0);
  });

  it('allows sampleRate of 1', () => {
    const config = resolveConfig({ appId: 'a', sampleRate: 1 });
    expect(config.sampleRate).toBe(1);
  });
});
