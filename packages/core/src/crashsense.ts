import type {
  CrashSenseConfig,
  CrashSenseCore,
  CrashSensePlugin,
  CrashEvent,
  CrashReport,
  RawCrashEvent,
  Breadcrumb,
  CrashSeverity,
  SystemState,
  DeviceInfo,
  EventBus,
  ResolvedConfig,
} from '@crashsense/types';
import {
  createEventBus,
  generateFingerprint,
  createRateLimiter,
  scrubPII,
  collectDeviceInfo,
  generateId,
  parseStackTrace,
} from '@crashsense/utils';
import { resolveConfig, SDK_VERSION } from './config';
import { createErrorInterceptor } from './error-interceptor';
import { createMemoryMonitor } from './memory-monitor';
import { createEventLoopMonitor } from './event-loop-monitor';
import { createNetworkMonitor } from './network-monitor';
import { createBreadcrumbTracker } from './breadcrumb-tracker';
import { createIframeTracker } from './iframe-tracker';
import { createPreCrashWarning } from './pre-crash-warning';
import { classifyCrash } from './crash-classifier';
import { createCheckpointManager } from './checkpoint-manager';
import { detectOOMRecovery } from './oom-recovery';
import { createLifecycleFlush } from './lifecycle-flush';

export function createCrashSense(userConfig: CrashSenseConfig): CrashSenseCore {
  const config = resolveConfig(userConfig);
  const bus = createEventBus();
  const sessionId = generateId();
  const rateLimiter = createRateLimiter(config.maxEventsPerMinute);
  const deviceInfo = collectDeviceInfo();

  const plugins: CrashSensePlugin[] = [];
  let userContext: Record<string, unknown> = {};
  const customContexts: Record<string, Record<string, unknown>> = {};
  let destroyed = false;

  const errorInterceptor = createErrorInterceptor(bus);
  const memoryMonitor = createMemoryMonitor(bus, config);
  const eventLoopMonitor = createEventLoopMonitor(bus, config);
  const networkMonitor = createNetworkMonitor(bus, config);
  const breadcrumbTracker = createBreadcrumbTracker(bus);
  const iframeTracker = createIframeTracker(bus, config);
  const preCrashWarning = createPreCrashWarning(bus, config, memoryMonitor, iframeTracker);

  // OOM Recovery: checkpoint manager
  const checkpointManager = createCheckpointManager(
    bus,
    config,
    sessionId,
    deviceInfo,
    () => ({
      memory: memoryMonitor.getSnapshot(),
      cpu: eventLoopMonitor.getCpuSnapshot(),
      eventLoop: eventLoopMonitor.getEventLoopSnapshot(),
      network: networkMonitor.getSnapshot(),
      iframe: config.enableIframeTracking ? iframeTracker.getSnapshot() : undefined,
    }),
    () => breadcrumbTracker.getBreadcrumbs(),
  );

  // OOM Recovery: lifecycle flush
  const lifecycleFlush = createLifecycleFlush(
    bus,
    config,
    sessionId,
    () => ({
      memory: memoryMonitor.getSnapshot(),
      cpu: eventLoopMonitor.getCpuSnapshot(),
      eventLoop: eventLoopMonitor.getEventLoopSnapshot(),
      network: networkMonitor.getSnapshot(),
      iframe: config.enableIframeTracking ? iframeTracker.getSnapshot() : undefined,
    }),
    () => breadcrumbTracker.getBreadcrumbs(),
    () => checkpointManager.flush(),
  );

  function buildRawEvent(error: Error, source: string): RawCrashEvent {
    const stack = error.stack ? parseStackTrace(error.stack) : [];

    return {
      id: generateId(),
      timestamp: performance.now() + performance.timeOrigin,
      sessionId,
      error: {
        type: error.constructor.name || error.name || 'Error',
        message: config.piiScrubbing ? scrubPII(error.message) : error.message,
        stack,
        raw: config.piiScrubbing ? scrubPII(error.stack || '') : (error.stack || ''),
      },
      system: {
        memory: memoryMonitor.getSnapshot(),
        cpu: eventLoopMonitor.getCpuSnapshot(),
        eventLoop: eventLoopMonitor.getEventLoopSnapshot(),
        network: networkMonitor.getSnapshot(),
        iframe: config.enableIframeTracking ? iframeTracker.getSnapshot() : undefined,
      },
      device: deviceInfo,
      framework: {},
      breadcrumbs: breadcrumbTracker.getBreadcrumbs(),
      meta: {
        appId: config.appId,
        environment: config.environment,
        release: config.release || undefined,
        userId: userContext.id as string | undefined,
        tags: { source },
        sdkVersion: SDK_VERSION,
      },
    };
  }

  function processRawEvent(rawEvent: RawCrashEvent): void {
    if (destroyed) return;
    if (Math.random() > config.sampleRate) return;
    if (!rateLimiter.tryAcquire()) return;

    const classification = classifyCrash(rawEvent);

    let crashEvent: CrashEvent = {
      id: rawEvent.id,
      fingerprint: generateFingerprint(
        rawEvent.error.type,
        rawEvent.error.message,
        rawEvent.error.stack,
      ),
      timestamp: rawEvent.timestamp,
      sessionId: rawEvent.sessionId,
      category: classification.category,
      subcategory: classification.subcategory,
      severity: classification.confidence > 0.8 ? 'critical' : 'error',
      confidence: classification.confidence,
      error: rawEvent.error,
      system: {
        memory: rawEvent.system.memory ?? memoryMonitor.getSnapshot(),
        cpu: rawEvent.system.cpu ?? eventLoopMonitor.getCpuSnapshot(),
        eventLoop: rawEvent.system.eventLoop ?? eventLoopMonitor.getEventLoopSnapshot(),
        network: rawEvent.system.network ?? networkMonitor.getSnapshot(),
        iframe: rawEvent.system.iframe ?? (config.enableIframeTracking ? iframeTracker.getSnapshot() : undefined),
      },
      device: rawEvent.device,
      framework: {
        name: (rawEvent.framework.name as 'react' | 'vue' | 'vanilla') ?? 'vanilla',
        version: rawEvent.framework.version ?? '',
        adapter: rawEvent.framework.adapter ?? SDK_VERSION,
        componentTree: rawEvent.framework.componentTree,
        currentRoute: rawEvent.framework.currentRoute,
        storeState: rawEvent.framework.storeState,
        lifecycleStage: rawEvent.framework.lifecycleStage,
        renderCount: rawEvent.framework.renderCount,
      },
      breadcrumbs: rawEvent.breadcrumbs,
      contributingFactors: classification.contributingFactors,
      meta: rawEvent.meta,
    };

    for (const plugin of plugins) {
      if (plugin.onCrashEvent) {
        const modified = plugin.onCrashEvent(crashEvent);
        if (modified === null) return;
        crashEvent = modified;
      }
    }

    const report: CrashReport = {
      event: crashEvent,
      analysis: null,
      timestamp: Date.now(),
    };

    bus.emit('crash_detected', { event: crashEvent });

    if (config.onCrash) {
      try {
        config.onCrash(report);
      } catch (_) {
        // onCrash callback errors must not propagate
      }
    }

    if (config.debug) {
      logCrashReport(report);
    }
  }

  function logCrashReport(report: CrashReport): void {
    const e = report.event;
    const header = `[CrashSense] ${e.category}/${e.subcategory} (confidence: ${(e.confidence * 100).toFixed(0)}%)`;
    const details = [
      `Error: ${e.error.type}: ${e.error.message}`,
      `Device: ${e.device.userAgent.slice(0, 80)}`,
      `Memory: ${e.system.memory.utilizationPercent ?? 'N/A'}% used`,
      `Long Tasks (30s): ${e.system.cpu.longTasksLast30s}`,
      `FPS: ${e.system.eventLoop.fps}`,
    ];

    if (typeof console !== 'undefined') {
      console.groupCollapsed?.(header) ?? console.log(header);
      for (const d of details) console.log(d);
      if (e.contributingFactors.length > 0) {
        console.log('Contributing factors:');
        for (const f of e.contributingFactors) {
          console.log(`  - ${f.factor} (${(f.weight * 100).toFixed(0)}%): ${f.evidence}`);
        }
      }
      console.groupEnd?.();
    }
  }

  bus.on('error', (data) => {
    const rawEvent = buildRawEvent(data.error, 'window.onerror');
    processRawEvent(rawEvent);
  });

  bus.on('unhandled_rejection', (data) => {
    const error = data.reason instanceof Error
      ? data.reason
      : new Error(String(data.reason));
    const rawEvent = buildRawEvent(error, 'unhandledrejection');
    processRawEvent(rawEvent);
  });

  bus.on('iframe_added', (data) => {
    breadcrumbTracker.addBreadcrumb({
      type: 'custom',
      message: `Iframe added: ${data.origin} (total: ${data.totalCount})`,
      data: { src: data.src, crossOrigin: data.crossOrigin },
    });
  });

  bus.on('iframe_removed', (data) => {
    breadcrumbTracker.addBreadcrumb({
      type: 'custom',
      message: `Iframe removed (total: ${data.totalCount})`,
      data: { src: data.src },
    });
  });

  bus.on('pre_crash_warning', (data) => {
    breadcrumbTracker.addBreadcrumb({
      type: 'custom',
      message: `Pre-crash warning [${data.level}]: ${data.reason}`,
      data: { level: data.level, memoryUtilization: data.memoryUtilization, iframeCount: data.iframeCount },
    });
  });

  // OOM Recovery: detect if previous session was OOM-killed
  // Must run BEFORE monitors start to read the checkpoint before it's overwritten
  if (config.enableOOMRecovery) {
    detectOOMRecovery(bus, config, sessionId);
  }

  errorInterceptor.install();
  breadcrumbTracker.install();
  if (config.enableMemoryMonitoring) memoryMonitor.start();
  if (config.enableLongTaskMonitoring) eventLoopMonitor.start();
  if (config.enableNetworkMonitoring) networkMonitor.start();
  if (config.enableIframeTracking) iframeTracker.start();
  if (config.enablePreCrashWarning) preCrashWarning.start();
  if (config.enableOOMRecovery) {
    checkpointManager.start();
    lifecycleFlush.install();
  }

  const core: CrashSenseCore = {
    get config(): ResolvedConfig {
      return config;
    },

    get sessionId(): string {
      return sessionId;
    },

    use(plugin: CrashSensePlugin): void {
      plugins.push(plugin);
      plugin.setup(core);
    },

    captureException(error: unknown, context?: Record<string, unknown>): void {
      const err = error instanceof Error ? error : new Error(String(error));
      const rawEvent = buildRawEvent(err, 'manual');
      if (context) {
        rawEvent.meta.tags = { ...rawEvent.meta.tags, ...Object.fromEntries(
          Object.entries(context).map(([k, v]) => [k, String(v)])
        )};
      }
      processRawEvent(rawEvent);
    },

    captureMessage(message: string, severity: CrashSeverity = 'info'): void {
      const rawEvent = buildRawEvent(new Error(message), 'message');
      rawEvent.error.type = 'Message';
      rawEvent.meta.tags.severity = severity;
      processRawEvent(rawEvent);
    },

    addBreadcrumb(bc: Omit<Breadcrumb, 'timestamp'>): void {
      breadcrumbTracker.addBreadcrumb(bc);
    },

    setUser(user: { id: string; [key: string]: unknown }): void {
      userContext = user;
    },

    setContext(key: string, value: Record<string, unknown>): void {
      customContexts[key] = value;
    },

    getSystemState(): SystemState {
      return {
        memory: memoryMonitor.getSnapshot(),
        cpu: eventLoopMonitor.getCpuSnapshot(),
        eventLoop: eventLoopMonitor.getEventLoopSnapshot(),
        network: networkMonitor.getSnapshot(),
        iframe: config.enableIframeTracking ? iframeTracker.getSnapshot() : undefined,
      };
    },

    getDeviceInfo(): DeviceInfo {
      return deviceInfo;
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      errorInterceptor.uninstall();
      breadcrumbTracker.uninstall();
      memoryMonitor.stop();
      eventLoopMonitor.stop();
      networkMonitor.stop();
      iframeTracker.stop();
      preCrashWarning.stop();
      checkpointManager.stop();
      checkpointManager.clearOnDestroy();
      lifecycleFlush.uninstall();
      for (const plugin of plugins) {
        plugin.teardown();
      }
    },

    _reportRawEvent(event: RawCrashEvent): void {
      processRawEvent(event);
    },

    _getEventBus(): EventBus {
      return bus;
    },
  };

  return core;
}
