import type { CrashSenseConfig, ResolvedConfig, OOMRecoveryReport } from '@crashsense/types';

const SDK_VERSION = '0.1.0';

export function resolveConfig(userConfig: CrashSenseConfig): ResolvedConfig {
  if (!userConfig.appId) {
    throw new Error('[CrashSense] appId is required');
  }

  const sampleRate = userConfig.sampleRate ?? 1.0;
  if (sampleRate < 0 || sampleRate > 1) {
    throw new Error('[CrashSense] sampleRate must be between 0 and 1');
  }

  const maxEventsPerMinute = userConfig.maxEventsPerMinute ?? 30;
  if (maxEventsPerMinute <= 0) {
    throw new Error('[CrashSense] maxEventsPerMinute must be positive');
  }

  return {
    appId: userConfig.appId,
    environment: userConfig.environment ?? 'production',
    release: userConfig.release ?? '',
    sampleRate,
    maxEventsPerMinute,
    enableMemoryMonitoring: userConfig.enableMemoryMonitoring ?? true,
    enableLongTaskMonitoring: userConfig.enableLongTaskMonitoring ?? true,
    enableNetworkMonitoring: userConfig.enableNetworkMonitoring ?? true,
    enableIframeTracking: userConfig.enableIframeTracking ?? true,
    enablePreCrashWarning: userConfig.enablePreCrashWarning ?? true,
    preCrashMemoryThreshold: userConfig.preCrashMemoryThreshold ?? 0.80,
    piiScrubbing: userConfig.piiScrubbing ?? true,
    debug: userConfig.debug ?? false,
    onCrash: userConfig.onCrash ?? null,
    enableOOMRecovery: userConfig.enableOOMRecovery ?? false,
    checkpointInterval: userConfig.checkpointInterval ?? 10000,
    oomRecoveryThreshold: userConfig.oomRecoveryThreshold ?? 0.3,
    flushEndpoint: userConfig.flushEndpoint ?? null,
    onOOMRecovery: userConfig.onOOMRecovery ?? null,
  };
}

export { SDK_VERSION };
