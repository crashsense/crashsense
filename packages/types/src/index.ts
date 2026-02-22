// ============================================================
// @crashsense/types — Shared type definitions for CrashSense
// ============================================================

// ---------------------
// Crash Categories
// ---------------------

/**
 * Classification category for detected crash events.
 *
 * CrashSense classifies every crash into one of these categories based on
 * system state, error characteristics, and contributing factors.
 *
 * - `runtime_error` -- Standard JavaScript errors (TypeError, ReferenceError, etc.)
 * - `memory_issue` -- Memory leaks, heap pressure, or out-of-memory conditions
 * - `event_loop_blocking` -- Long tasks, frozen UI, or infinite loops
 * - `framework_react` -- React-specific issues (hydration mismatches, infinite re-renders, hook violations)
 * - `framework_vue` -- Vue-specific issues (reactivity loops, lifecycle errors, watcher cascades)
 * - `network_induced` -- Crashes caused by network failures, timeouts, or CORS blocks
 * - `iframe_overload` -- Excessive iframes exhausting browser resources
 * - `rendering` -- Rendering pipeline failures
 * - `mobile_device` -- Mobile-specific resource constraints
 * - `resource_exhaustion` -- General resource exhaustion (CPU, memory, file handles)
 * - `browser_compatibility` -- Browser-specific incompatibilities or missing APIs
 */
export type CrashCategory =
  | 'runtime_error'
  | 'memory_issue'
  | 'event_loop_blocking'
  | 'framework_react'
  | 'framework_vue'
  | 'network_induced'
  | 'iframe_overload'
  | 'rendering'
  | 'mobile_device'
  | 'resource_exhaustion'
  | 'browser_compatibility';

/**
 * Severity level of a crash event, from most to least severe.
 *
 * - `critical` -- Application is unusable or data loss is likely
 * - `error` -- A significant failure that affects functionality
 * - `warning` -- A potential issue that may degrade experience
 * - `info` -- Informational event captured for diagnostic context
 */
export type CrashSeverity = 'critical' | 'error' | 'warning' | 'info';

// ---------------------
// Stack Frame
// ---------------------

/**
 * A single frame in a parsed stack trace.
 *
 * Stack frames are extracted from the raw error stack and normalized
 * into a structured format for classification and display.
 */
export interface StackFrame {
  /** Absolute or relative path to the source file. */
  filename: string;
  /** Name of the function where the error occurred. */
  function: string;
  /** Line number in the source file. */
  lineno: number;
  /** Column number in the source file. */
  colno: number;
  /** Whether this frame belongs to application code (true) or a library/vendor (false). */
  inApp: boolean;
  /** Surrounding source lines for context, if available. */
  context?: string[];
}

// ---------------------
// Breadcrumb
// ---------------------

/**
 * Category of a breadcrumb event.
 *
 * - `click` -- User click interaction
 * - `navigation` -- Page or route navigation
 * - `network` -- HTTP request or response
 * - `console` -- Console log, warn, or error output
 * - `state` -- Application state change
 * - `custom` -- Developer-defined breadcrumb
 */
export type BreadcrumbType = 'click' | 'navigation' | 'network' | 'console' | 'state' | 'custom';

/**
 * A timestamped event in the trail leading up to a crash.
 *
 * Breadcrumbs are automatically collected (clicks, navigation, network, console)
 * and can also be added manually via `addBreadcrumb()`. They provide the
 * sequential context needed to understand what the user did before a crash.
 */
export interface Breadcrumb {
  /** Category of this breadcrumb event. */
  type: BreadcrumbType;
  /** Unix timestamp in milliseconds when this event occurred. */
  timestamp: number;
  /** Human-readable description of the event. */
  message: string;
  /** Optional structured data associated with this breadcrumb. */
  data?: Record<string, unknown>;
}

// ---------------------
// System State
// ---------------------

/**
 * Direction of memory usage over a recent time window.
 *
 * - `stable` -- Heap usage is relatively constant
 * - `growing` -- Heap usage is increasing (potential leak)
 * - `shrinking` -- Heap usage is decreasing (GC reclaiming)
 * - `spike` -- Sudden sharp increase in heap usage
 */
export type MemoryTrend = 'stable' | 'growing' | 'shrinking' | 'spike';

/**
 * Current memory state of the JavaScript heap.
 *
 * Values are sourced from `performance.memory` (Chrome-only).
 * In browsers that do not support this API, numeric fields will be null.
 */
export interface MemoryState {
  /** Bytes of heap currently in use. Null if unsupported. */
  usedJSHeapSize: number | null;
  /** Total bytes allocated for the heap. Null if unsupported. */
  totalJSHeapSize: number | null;
  /** Maximum heap size the browser will allocate. Null if unsupported. */
  heapSizeLimit: number | null;
  /** Direction of memory usage over the recent sampling window. */
  trend: MemoryTrend;
  /** Percentage of heap limit currently in use (0-100). Null if unsupported. */
  utilizationPercent: number | null;
}

/**
 * CPU and main-thread performance metrics.
 *
 * Derived from the Long Task API and PerformanceObserver.
 */
export interface CpuState {
  /** Number of long tasks (>50ms) detected in the last 30 seconds. */
  longTasksLast30s: number;
  /** Average duration in milliseconds of long tasks in the last 30 seconds. */
  avgLongTaskDuration: number;
  /** Maximum duration in milliseconds of a single long task in the last 30 seconds. */
  maxLongTaskDuration: number;
  /** Total estimated blocking time in milliseconds from all long tasks. */
  estimatedBlockingTime: number;
}

/**
 * Current state of the browser event loop.
 */
export interface EventLoopState {
  /** Whether the event loop is currently blocked by a long-running task. */
  isBlocked: boolean;
  /** Duration in milliseconds of the current block, or null if not blocked. */
  blockDuration: number | null;
  /** Estimated frames per second based on requestAnimationFrame timing. */
  fps: number;
}

/**
 * Network connectivity and request health metrics.
 */
export interface NetworkState {
  /** Number of in-flight HTTP requests. */
  pendingRequests: number;
  /** Number of failed HTTP requests in the last 60 seconds. */
  failedRequestsLast60s: number;
  /** Average response latency in milliseconds over the last 60 seconds. */
  avgLatencyLast60s: number;
  /** Network connection type from the Network Information API, or null if unavailable. */
  connectionType: string | null;
  /** Whether the browser reports an active network connection. */
  isOnline: boolean;
}

/**
 * State of iframe elements in the document.
 *
 * Tracked via MutationObserver when `enableIframeTracking` is enabled.
 * Excessive iframes (ads, widgets, payment forms) can exhaust memory.
 */
export interface IframeState {
  /** Total number of iframe elements currently in the DOM. */
  totalCount: number;
  /** Number of iframes added in the last 60 seconds. */
  addedLast60s: number;
  /** Number of iframes removed in the last 60 seconds. */
  removedLast60s: number;
  /** List of unique origin URLs from iframe src attributes. */
  origins: string[];
  /** Number of iframes with a different origin than the host page. */
  crossOriginCount: number;
}

/**
 * Complete snapshot of system state at the time of a crash.
 *
 * Captured automatically by CrashSense monitors and included in every crash event.
 */
export interface SystemState {
  /** JavaScript heap memory metrics. */
  memory: MemoryState;
  /** Main-thread CPU and long task metrics. */
  cpu: CpuState;
  /** Event loop responsiveness metrics. */
  eventLoop: EventLoopState;
  /** Network connectivity and request health. */
  network: NetworkState;
  /** Iframe tracking state. Present only when `enableIframeTracking` is enabled. */
  iframe?: IframeState;
}

// ---------------------
// Device Information
// ---------------------

/**
 * Information about the user device and browser environment.
 *
 * Collected once at SDK initialization and included in every crash report.
 * PII-sensitive fields (userAgent) are scrubbed when `piiScrubbing` is enabled.
 */
export interface DeviceInfo {
  /** Full user agent string from `navigator.userAgent`. */
  userAgent: string;
  /** Operating system platform from `navigator.platform`. */
  platform: string;
  /** Browser vendor from `navigator.vendor`. */
  vendor: string;
  /** Device memory in gigabytes from `navigator.deviceMemory`, or null if unsupported. */
  deviceMemory: number | null;
  /** Number of logical CPU cores from `navigator.hardwareConcurrency`, or null if unsupported. */
  hardwareConcurrency: number | null;
  /** Current viewport dimensions in pixels. */
  viewport: { width: number; height: number };
  /** Device pixel ratio (e.g., 2 for Retina displays). */
  devicePixelRatio: number;
  /** Whether the device supports touch input. */
  touchSupport: boolean;
  /** User preferred color scheme. */
  colorScheme: 'light' | 'dark';
  /** Whether the user prefers reduced motion. */
  reducedMotion: boolean;
  /** Browser language from `navigator.language`. */
  language: string;
  /** IANA timezone string from `Intl.DateTimeFormat`. */
  timezone: string;
}

// ---------------------
// Framework Context
// ---------------------

/**
 * Framework-specific context attached to crash events.
 *
 * Populated automatically by framework adapters (@crashsense/react, @crashsense/vue)
 * or set to default vanilla values when no adapter is active.
 */
export interface FrameworkContext {
  /** Framework identifier. Set by the active adapter or defaults to `'vanilla'`. */
  name: 'react' | 'vue' | 'vanilla' | string;
  /** Framework version string (e.g., `'18.2.0'`). */
  version: string;
  /** Name of the CrashSense adapter package (e.g., `'@crashsense/react'`). */
  adapter: string;
  /** Component hierarchy from root to the component where the crash occurred. */
  componentTree?: string[];
  /** Current route path at the time of the crash. */
  currentRoute?: string;
  /** Snapshot of relevant application store state. */
  storeState?: Record<string, unknown>;
  /** Framework lifecycle stage when the crash occurred (e.g., `'render'`, `'mounted'`). */
  lifecycleStage?: string;
  /** Number of component renders since the last navigation. */
  renderCount?: number;
}

// ---------------------
// Contributing Factor
// ---------------------

/**
 * A single factor that contributed to the crash classification decision.
 *
 * Each crash event includes an array of contributing factors with weights
 * and evidence strings, so consumers can understand why the classifier
 * chose a specific category and confidence score.
 */
export interface ContributingFactor {
  /** Machine-readable identifier for this factor (e.g., `'high_memory_utilization'`). */
  factor: string;
  /** Relative weight of this factor in the classification (0.0 to 1.0). */
  weight: number;
  /** Human-readable evidence string explaining the observation. */
  evidence: string;
}

// ---------------------
// Crash Event (Core)
// ---------------------

/**
 * A fully classified crash event -- the primary output of the CrashSense SDK.
 *
 * Contains the error details, system state snapshot, device information,
 * framework context, breadcrumb trail, classification result, and metadata.
 * This is the object passed to plugins and included in CrashReport.
 */
export interface CrashEvent {
  // Identity
  /** Unique identifier for this crash event (UUID v4). */
  id: string;
  /** Deterministic fingerprint for deduplication and grouping of similar crashes. */
  fingerprint: string;
  /** Unix timestamp in milliseconds when the crash was detected. */
  timestamp: number;
  /** Session identifier linking this crash to a user session. */
  sessionId: string;

  // Classification
  /** Primary crash category determined by the classifier. */
  category: CrashCategory;
  /** More specific sub-classification within the category (e.g., `'memory_leak'`, `'api_failure'`). */
  subcategory: string;
  /** Severity level of this crash event. */
  severity: CrashSeverity;
  /** Classifier confidence score for the assigned category (0.0 to 1.0). */
  confidence: number;

  // Error Details
  /** Structured error information extracted from the original exception. */
  error: {
    /** Error constructor name (e.g., `'TypeError'`, `'RangeError'`). */
    type: string;
    /** Error message string. */
    message: string;
    /** Parsed and normalized stack trace frames. */
    stack: StackFrame[];
    /** Original raw stack trace string. */
    raw: string;
  };

  // System State at Crash Time
  /** Complete system state snapshot captured at the moment of the crash. */
  system: SystemState;

  // Device Information
  /** Device and browser environment information. */
  device: DeviceInfo;

  // Framework Context
  /** Framework-specific context from the active adapter. */
  framework: FrameworkContext;

  // Breadcrumbs
  /** Ordered trail of events leading up to the crash (most recent last). */
  breadcrumbs: Breadcrumb[];

  // Contributing Factors
  /** Factors that contributed to the crash classification with weights and evidence. */
  contributingFactors: ContributingFactor[];

  // Metadata
  /** Application and SDK metadata for this crash event. */
  meta: CrashEventMeta;
}

/**
 * Metadata associated with a crash event.
 *
 * Contains application identifiers, environment info, user context,
 * custom tags, and SDK version for filtering and grouping.
 */
export interface CrashEventMeta {
  /** Application identifier from CrashSense configuration. */
  appId: string;
  /** Environment name (e.g., `'production'`, `'staging'`). */
  environment: string;
  /** Application release or version tag, if configured. */
  release?: string;
  /** User identifier set via `setUser()`, if available. */
  userId?: string;
  /** Custom key-value tags for filtering and grouping crash events. */
  tags: Record<string, string>;
  /** Version of the CrashSense SDK that generated this event. */
  sdkVersion: string;
}

// ---------------------
// Partial Crash Event (pre-classification)
// ---------------------

/**
 * A raw crash event before classification.
 *
 * Built internally by CrashSense when an error is captured. Contains
 * partial system state and framework context that will be completed
 * during the classification pipeline before producing a full CrashEvent.
 */
export interface RawCrashEvent {
  /** Unique identifier for this event (UUID v4). */
  id: string;
  /** Unix timestamp in milliseconds when the error was captured. */
  timestamp: number;
  /** Session identifier for the current user session. */
  sessionId: string;
  /** Error details extracted from the captured exception. */
  error: {
    /** Error constructor name. */
    type: string;
    /** Error message string. */
    message: string;
    /** Parsed stack trace frames. */
    stack: StackFrame[];
    /** Original raw stack trace string. */
    raw: string;
  };
  /** Partial system state snapshot (may be incomplete before classification). */
  system: Partial<SystemState>;
  /** Device information. */
  device: DeviceInfo;
  /** Partial framework context (completed during classification). */
  framework: Partial<FrameworkContext>;
  /** Breadcrumb trail collected up to the point of capture. */
  breadcrumbs: Breadcrumb[];
  /** Event metadata including app ID, environment, and tags. */
  meta: CrashEventMeta;
}

// ---------------------
// Configuration
// ---------------------

/**
 * User-facing configuration options for initializing CrashSense.
 *
 * Only `appId` is required. All other fields have sensible defaults
 * and are resolved into a complete ResolvedConfig internally.
 */
export interface CrashSenseConfig {
  /** Unique identifier for your application. Used in crash event metadata. */
  appId: string;
  /**
   * Environment name for filtering crash events.
   * @default 'production'
   */
  environment?: string;
  /**
   * Application release or version tag included in crash metadata.
   * @default ''
   */
  release?: string;
  /**
   * Event sampling rate. Set to 0.5 to capture ~50% of events, 1.0 for all.
   * @default 1.0
   */
  sampleRate?: number;
  /**
   * Maximum number of crash events processed per minute. Prevents event storms.
   * @default 30
   */
  maxEventsPerMinute?: number;
  /**
   * Enable monitoring of JavaScript heap memory usage and trends.
   * Requires `performance.memory` (Chrome-only; gracefully degrades elsewhere).
   * @default true
   */
  enableMemoryMonitoring?: boolean;
  /**
   * Enable monitoring of long tasks (>50ms) on the main thread via the Long Task API.
   * @default true
   */
  enableLongTaskMonitoring?: boolean;
  /**
   * Enable monitoring of network request failures and latency.
   * @default true
   */
  enableNetworkMonitoring?: boolean;
  /**
   * Enable tracking of iframe additions and removals via MutationObserver.
   * Useful for detecting iframe-induced resource exhaustion from ads or widgets.
   * @default false
   */
  enableIframeTracking?: boolean;
  /**
   * Enable the 3-tier pre-crash warning system that detects dangerous
   * memory or iframe conditions before the browser tab crashes.
   * @default false
   */
  enablePreCrashWarning?: boolean;
  /**
   * Memory utilization threshold (0.0 to 1.0) for triggering critical pre-crash warnings.
   * Only used when `enablePreCrashWarning` is true.
   * @default 0.85
   */
  preCrashMemoryThreshold?: number;
  /**
   * Enable automatic scrubbing of PII (emails, IPs, tokens, credit card numbers)
   * from error messages and breadcrumbs before events leave the SDK.
   * @default true
   */
  piiScrubbing?: boolean;
  /**
   * Enable debug mode. When true, crash reports are logged to the console.
   * @default false
   */
  debug?: boolean;
  /**
   * Callback invoked when a crash is detected and fully classified.
   * Receives the complete CrashReport including the event and optional AI analysis.
   * @default null
   */
  onCrash?: (report: CrashReport) => void;
  /**
   * Callback invoked when a potential OOM recovery is detected on page reload.
   * Only called when `enableOOMRecovery` is true and OOM signals are found.
   * @default null
   */
  onOOMRecovery?: (report: OOMRecoveryReport) => void;
  /**
   * Enable OOM (Out-of-Memory) crash recovery detection.
   * When enabled, CrashSense periodically checkpoints system state to sessionStorage
   * and analyzes signals on page reload to determine if the previous session was OOM-killed.
   * @default false
   */
  enableOOMRecovery?: boolean;
  /**
   * Interval in milliseconds between checkpoint writes to sessionStorage.
   * Only used when `enableOOMRecovery` is true.
   * @default 10000
   */
  checkpointInterval?: number;
  /**
   * Minimum OOM probability threshold (0.0 to 1.0) required to trigger
   * the `onOOMRecovery` callback. Lower values increase sensitivity.
   * @default 0.3
   */
  oomRecoveryThreshold?: number;
  /**
   * URL endpoint for emergency data flushing via `navigator.sendBeacon()`
   * during page lifecycle events (visibilitychange, pagehide, freeze).
   * When null, lifecycle flush is disabled.
   * @default null
   */
  flushEndpoint?: string;
}

/**
 * Fully resolved configuration with all defaults applied.
 *
 * This is the internal configuration object used throughout the SDK.
 * All optional fields from CrashSenseConfig are resolved to concrete values.
 */
export interface ResolvedConfig {
  /** Application identifier. */
  appId: string;
  /**
   * Resolved environment name.
   * @default 'production'
   */
  environment: string;
  /**
   * Resolved release tag.
   * @default ''
   */
  release: string;
  /**
   * Resolved sampling rate.
   * @default 1.0
   */
  sampleRate: number;
  /**
   * Resolved max events per minute.
   * @default 30
   */
  maxEventsPerMinute: number;
  /**
   * Whether memory monitoring is enabled.
   * @default true
   */
  enableMemoryMonitoring: boolean;
  /**
   * Whether long task monitoring is enabled.
   * @default true
   */
  enableLongTaskMonitoring: boolean;
  /**
   * Whether network monitoring is enabled.
   * @default true
   */
  enableNetworkMonitoring: boolean;
  /**
   * Whether iframe tracking is enabled.
   * @default false
   */
  enableIframeTracking: boolean;
  /**
   * Whether the pre-crash warning system is enabled.
   * @default false
   */
  enablePreCrashWarning: boolean;
  /**
   * Memory utilization threshold for critical pre-crash warnings.
   * @default 0.85
   */
  preCrashMemoryThreshold: number;
  /**
   * Whether PII scrubbing is enabled.
   * @default true
   */
  piiScrubbing: boolean;
  /**
   * Whether debug logging is enabled.
   * @default false
   */
  debug: boolean;
  /**
   * Crash callback, or null if not configured.
   * @default null
   */
  onCrash: ((report: CrashReport) => void) | null;
  /**
   * Whether OOM recovery detection is enabled.
   * @default false
   */
  enableOOMRecovery: boolean;
  /**
   * Checkpoint write interval in milliseconds.
   * @default 10000
   */
  checkpointInterval: number;
  /**
   * Minimum OOM probability threshold.
   * @default 0.3
   */
  oomRecoveryThreshold: number;
  /**
   * Lifecycle flush endpoint URL, or null if disabled.
   * @default null
   */
  flushEndpoint: string | null;
  /**
   * OOM recovery callback, or null if not configured.
   * @default null
   */
  onOOMRecovery: ((report: OOMRecoveryReport) => void) | null;
}

// ---------------------
// Plugin System
// ---------------------

/**
 * Interface for CrashSense plugins.
 *
 * Plugins intercept, enrich, or drop crash events before they reach
 * the `onCrash` callback. They receive the core instance during setup
 * for access to configuration and SDK methods.
 */
export interface CrashSensePlugin {
  /** Unique name identifying this plugin. */
  name: string;
  /**
   * Called when the plugin is registered via `core.use()`.
   * @param core - The CrashSense core instance.
   */
  setup(core: CrashSenseCore): void;
  /** Called when the CrashSense instance is destroyed. Clean up resources here. */
  teardown(): void;
  /**
   * Called for each crash event before it reaches the `onCrash` callback.
   * Return the event (optionally modified) to pass it through, or null to drop it.
   * @param event - The classified crash event.
   * @returns The event to pass through, or null to suppress it.
   */
  onCrashEvent?(event: CrashEvent): CrashEvent | null;
}

// ---------------------
// Core Interface (for plugin registration)
// ---------------------

/**
 * Public interface of the CrashSense core instance.
 *
 * This is the main object returned by `createCrashSense()` and provided
 * to plugins and framework adapters. It exposes methods for error capture,
 * breadcrumb management, user context, and system state access.
 */
export interface CrashSenseCore {
  /** The fully resolved SDK configuration. */
  readonly config: ResolvedConfig;
  /** Unique session identifier for the current CrashSense instance. */
  readonly sessionId: string;

  /**
   * Register a plugin to intercept crash events.
   * @param plugin - The plugin to register.
   */
  use(plugin: CrashSensePlugin): void;
  /**
   * Manually capture an exception with optional context.
   * The error is classified and processed through the full crash pipeline.
   * @param error - The error to capture. Can be an Error instance, string, or any value.
   * @param context - Optional key-value context merged into event metadata.
   */
  captureException(error: unknown, context?: Record<string, unknown>): void;
  /**
   * Capture a message as a crash event with the specified severity.
   * @param message - The message to capture.
   * @param severity - Severity level. Defaults to `'info'`.
   */
  captureMessage(message: string, severity?: CrashSeverity): void;
  /**
   * Add a breadcrumb to the trail. Timestamp is set automatically.
   * @param breadcrumb - The breadcrumb data (type and message required).
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
  /**
   * Set user context for crash reports. The `id` field is required;
   * additional fields are included as user metadata.
   * @param user - User object with at minimum an `id` field.
   */
  setUser(user: { id: string; [key: string]: unknown }): void;
  /**
   * Set a named context object. Context values are included in crash event tags.
   * @param key - Context name.
   * @param value - Context data as key-value pairs.
   */
  setContext(key: string, value: Record<string, unknown>): void;
  /**
   * Get a snapshot of the current system state (memory, CPU, event loop, network, iframes).
   * @returns Current system state.
   */
  getSystemState(): SystemState;
  /**
   * Get device and browser environment information.
   * @returns Device information collected at initialization.
   */
  getDeviceInfo(): DeviceInfo;
  /**
   * Destroy the CrashSense instance. Stops all monitors, removes event listeners,
   * tears down plugins, and releases resources.
   */
  destroy(): void;

  /**
   * Internal: Used by monitors to report raw crash events into the classification pipeline.
   * @internal
   */
  _reportRawEvent(event: RawCrashEvent): void;
  /**
   * Internal: Access the event bus for subscribing to SDK events.
   * @internal
   */
  _getEventBus(): EventBus;
}

// ---------------------
// Event Bus
// ---------------------

/**
 * Map of all event types emitted by the CrashSense internal event bus.
 *
 * Monitors emit events when they detect notable conditions. Plugins and
 * internal components subscribe to these events for coordination.
 *
 * - `error` -- A caught JavaScript error
 * - `unhandled_rejection` -- An unhandled Promise rejection
 * - `memory_warning` -- Memory utilization crossed a warning threshold
 * - `long_task` -- A long task (>50ms) was detected on the main thread
 * - `network_failure` -- An HTTP request failed
 * - `crash_detected` -- A crash event was fully classified
 * - `iframe_added` -- An iframe was added to the DOM
 * - `iframe_removed` -- An iframe was removed from the DOM
 * - `pre_crash_warning` -- A pre-crash warning was escalated
 * - `breadcrumb` -- A new breadcrumb was recorded
 * - `oom_recovery` -- An OOM recovery was detected on page reload
 * - `checkpoint_written` -- A checkpoint was persisted to sessionStorage
 * - `lifecycle_flush` -- Data was flushed during a page lifecycle event
 */
export type EventBusEventMap = {
  'error': { error: Error; timestamp: number };
  'unhandled_rejection': { reason: unknown; timestamp: number };
  'memory_warning': { utilization: number; trend: MemoryTrend; timestamp: number };
  'long_task': { duration: number; startTime: number; timestamp: number };
  'network_failure': { url: string; status: number; error: string; timestamp: number };
  'crash_detected': { event: CrashEvent };
  'iframe_added': { src: string; origin: string; crossOrigin: boolean; totalCount: number; timestamp: number };
  'iframe_removed': { src: string; totalCount: number; timestamp: number };
  'pre_crash_warning': { level: PreCrashLevel; memoryUtilization: number | null; iframeCount: number; reason: string; timestamp: number };
  'breadcrumb': Breadcrumb;
  'oom_recovery': { report: OOMRecoveryReport };
  'checkpoint_written': { timestamp: number; sessionId: string };
  'lifecycle_flush': { reason: string; timestamp: number };
};

/**
 * Severity level of a pre-crash warning.
 *
 * Warnings escalate through three tiers as system conditions deteriorate:
 * - `elevated` -- System under pressure (>70% memory or >5 iframes)
 * - `critical` -- High risk of crash (>85% memory or >10 iframes)
 * - `imminent` -- Crash likely within seconds (>95% memory or >15 iframes)
 */
export type PreCrashLevel = 'elevated' | 'critical' | 'imminent';

/**
 * Typed event bus for internal CrashSense event communication.
 *
 * Used by monitors, classifiers, and plugins to subscribe to and emit
 * SDK events in a type-safe manner.
 */
export interface EventBus {
  /**
   * Subscribe to an event.
   * @param event - Event name to listen for.
   * @param handler - Callback invoked when the event is emitted.
   */
  on<K extends keyof EventBusEventMap>(event: K, handler: (data: EventBusEventMap[K]) => void): void;
  /**
   * Unsubscribe from an event.
   * @param event - Event name to stop listening for.
   * @param handler - The same handler function that was passed to `on()`.
   */
  off<K extends keyof EventBusEventMap>(event: K, handler: (data: EventBusEventMap[K]) => void): void;
  /**
   * Emit an event to all registered handlers.
   * @param event - Event name to emit.
   * @param data - Event payload matching the EventBusEventMap type.
   */
  emit<K extends keyof EventBusEventMap>(event: K, data: EventBusEventMap[K]): void;
}

// ---------------------
// Crash Report (final output)
// ---------------------

/**
 * The final output delivered to the `onCrash` callback.
 *
 * Contains the fully classified crash event and an optional AI analysis
 * (null unless an AI client is configured and analysis succeeds).
 */
export interface CrashReport {
  /** The fully classified crash event. */
  event: CrashEvent;
  /** AI-generated crash analysis, or null if AI is not configured or analysis failed. */
  analysis: CrashAnalysis | null;
  /** Unix timestamp in milliseconds when this report was generated. */
  timestamp: number;
}

/**
 * AI-generated analysis of a crash event.
 *
 * Produced by the @crashsense/ai package when configured with an LLM endpoint.
 * Contains the root cause assessment, suggested fix, prevention advice,
 * and alternative causes ranked by likelihood.
 */
export interface CrashAnalysis {
  /** Primary root cause of the crash as determined by the AI. */
  rootCause: string;
  /** Detailed explanation of why the crash occurred. */
  explanation: string;
  /** Suggested code fix, or null if no specific fix can be recommended. */
  fix: {
    /** Human-readable description of what the fix does. */
    description: string;
    /** Suggested code snippet to resolve the issue. */
    code: string;
    /** File path where the fix should be applied. */
    filename: string;
  } | null;
  /** List of preventive measures to avoid similar crashes. */
  prevention: string[];
  /** AI confidence score for this analysis (0.0 to 1.0). */
  confidence: number;
  /** Alternative possible causes ranked by likelihood. */
  alternativeCauses: Array<{ cause: string; likelihood: number }>;
  /** Source of the analysis: heuristic (rules only), ai (LLM only), or hybrid (both). */
  source: 'heuristic' | 'ai' | 'hybrid';
}

// ---------------------
// AI Integration Types
// ---------------------

/**
 * Configuration for the AI analysis client (@crashsense/ai).
 *
 * Supports OpenAI, Anthropic, Google, or any OpenAI-compatible endpoint.
 */
export interface AIConfig {
  /** URL of the LLM API endpoint (e.g., `'https://api.openai.com/v1/chat/completions'`). */
  endpoint: string;
  /** API key for authenticating with the LLM provider. */
  apiKey: string;
  /** Model identifier (e.g., `'gpt-4'`, `'claude-3-opus'`). Provider-specific. */
  model?: string;
  /** Maximum tokens for the AI response. */
  maxTokens?: number;
  /** Sampling temperature (0.0 to 2.0). Lower values produce more deterministic output. */
  temperature?: number;
  /** Request timeout in milliseconds. */
  timeout?: number;
  /** Number of retry attempts on transient failures. */
  retries?: number;
  /** LLM provider hint for request formatting. Defaults to auto-detection from endpoint URL. */
  provider?: 'openai' | 'anthropic' | 'google' | 'custom';
}

/**
 * Token-optimized payload sent to the LLM endpoint for crash analysis.
 *
 * Built internally by the AI client from a CrashEvent. Contains only the
 * fields most relevant for root cause analysis, compressed for token efficiency.
 */
export interface AIPayload {
  /** Summary of the crash classification. */
  crash_summary: {
    /** Crash category. */
    category: CrashCategory;
    /** Crash subcategory. */
    subcategory: string;
    /** Heuristic classifier confidence score. */
    heuristic_confidence: number;
    /** Crash severity level. */
    severity: CrashSeverity;
  };
  /** Compressed error information. */
  error: {
    /** Error constructor name. */
    type: string;
    /** Error message. */
    message: string;
    /** Top 5 stack frames as formatted strings. */
    stack_top_5: string[];
    /** Stack frames identified as user application code. */
    user_code_frames: string[];
  };
  /** System state metrics at crash time. */
  system_state: {
    /** Memory utilization as a formatted string. */
    memory_utilization: string;
    /** Memory usage trend direction. */
    memory_trend: MemoryTrend;
    /** Number of long tasks in the last 30 seconds. */
    long_tasks_last_30s: number;
    /** Estimated FPS at the time of crash. */
    fps_at_crash: number;
    /** Number of pending HTTP requests. */
    pending_network_requests: number;
    /** Number of failed HTTP requests in the last 60 seconds. */
    failed_requests_last_60s: number;
  };
  /** Compressed device information. */
  device: {
    /** OS platform. */
    platform: string;
    /** Device memory as a formatted string. */
    memory: string;
    /** Viewport dimensions as a formatted string. */
    viewport: string;
    /** Network connection type. */
    connection: string;
  };
  /** Framework context summary. */
  framework: {
    /** Framework name. */
    name: string;
    /** Framework version. */
    version: string;
    /** Lifecycle stage at crash time. */
    lifecycle_stage: string;
    /** Component tree path from root to crash site. */
    component_path: string[];
    /** Number of renders since the last navigation. */
    render_count_since_nav: number;
  };
  /** Last 5 breadcrumbs before the crash. */
  breadcrumbs_last_5: Array<{
    /** Breadcrumb type. */
    type: BreadcrumbType;
    /** Breadcrumb message. */
    message: string;
    /** Relative time before crash as a formatted string. */
    time: string;
  }>;
  /** Contributing factors from the heuristic classifier. */
  contributing_factors: Array<{
    /** Factor identifier. */
    factor: string;
    /** Factor weight. */
    weight: number;
    /** Evidence string. */
    evidence: string;
  }>;
}

/**
 * Structured response from the LLM after analyzing a crash.
 *
 * Parsed and validated by the AI client before being wrapped
 * into a CrashAnalysis object.
 */
export interface AIResponse {
  /** Primary root cause of the crash. */
  rootCause: string;
  /** Detailed explanation of why the crash occurred. */
  explanation: string;
  /** Suggested code fix. */
  fix: {
    /** Description of what the fix does. */
    description: string;
    /** Code snippet to resolve the issue. */
    code: string;
    /** Target file path for the fix. */
    filename: string;
  };
  /** Preventive measures to avoid recurrence. */
  prevention: string[];
  /** AI confidence in this analysis (0.0 to 1.0). */
  confidence: number;
  /** Alternative possible causes ranked by likelihood. */
  alternativeCauses: Array<{ cause: string; likelihood: number }>;
}

// ---------------------
// Network Monitor Types
// ---------------------

/**
 * Record of a single HTTP request captured by the network monitor.
 */
export interface NetworkRequest {
  /** Request URL. */
  url: string;
  /** HTTP method (GET, POST, etc.). */
  method: string;
  /** HTTP response status code (0 if the request failed before receiving a response). */
  status: number;
  /** Total request duration in milliseconds. */
  duration: number;
  /** Unix timestamp in milliseconds when the request started. */
  startTime: number;
  /** Error message if the request failed, or null on success. */
  error: string | null;
  /** Response body size in bytes, or null if unavailable. */
  responseSize: number | null;
}

// ---------------------
// Classification Result
// ---------------------

/**
 * Output of the crash classifier.
 *
 * Contains the assigned category, subcategory, confidence score,
 * and the contributing factors that led to the classification.
 */
export interface ClassificationResult {
  /** Assigned crash category. */
  category: CrashCategory;
  /** Specific subcategory within the category. */
  subcategory: string;
  /** Classifier confidence score (0.0 to 1.0). */
  confidence: number;
  /** Factors that contributed to this classification. */
  contributingFactors: ContributingFactor[];
}

// ---------------------
// OOM Recovery Types
// ---------------------

/**
 * Snapshot of SDK state periodically written to sessionStorage.
 *
 * Used by the OOM recovery system to preserve context across
 * browser tab crashes. When the page reloads, the last checkpoint
 * is analyzed alongside OOM signals to determine if an OOM kill occurred.
 */
export interface CheckpointData {
  /** Schema version for forward compatibility. */
  version: number;
  /** Unix timestamp in milliseconds when this checkpoint was written. */
  timestamp: number;
  /** Session identifier at the time of the checkpoint. */
  sessionId: string;
  /** Application identifier from configuration. */
  appId: string;
  /** Page URL at the time of the checkpoint. */
  url: string;
  /** Breadcrumb trail at the time of the checkpoint. */
  breadcrumbs: Breadcrumb[];
  /** Partial system state snapshot. */
  systemState: Partial<SystemState>;
  /** Device information. */
  device: DeviceInfo;
  /** Pre-crash warnings that were active before the checkpoint. */
  preCrashWarnings: Array<{
    /** Warning severity level. */
    level: PreCrashLevel;
    /** Reason for the warning. */
    reason: string;
    /** When the warning was issued. */
    timestamp: number;
  }>;
  /** Memory trend direction at checkpoint time, or null if memory monitoring is disabled. */
  memoryTrend: MemoryTrend | null;
  /** Number of checkpoints written in this session. */
  checkpointCount: number;
}

/**
 * Report generated when CrashSense detects a likely OOM kill from a previous session.
 *
 * Delivered to the `onOOMRecovery` callback with full context from the last
 * checkpoint and the OOM signals that triggered the detection.
 */
export interface OOMRecoveryReport {
  /** Unique identifier for this recovery report (UUID v4). */
  id: string;
  /** Report type discriminator. Always `'oom_recovery'`. */
  type: 'oom_recovery';
  /** Unix timestamp in milliseconds when the recovery was detected. */
  timestamp: number;
  /** Estimated probability (0.0 to 1.0) that the previous session ended due to OOM. */
  probability: number;
  /** Session identifier for the current (recovered) session. */
  sessionId: string;
  /** Session identifier from the crashed session. */
  previousSessionId: string;
  /** Milliseconds between the last checkpoint and the current page load. */
  timeSinceLastCheckpoint: number;
  /** Whether `document.wasDiscarded` was true, indicating browser-initiated discard. Undefined if API unavailable. */
  wasDiscarded: boolean | undefined;
  /** Navigation type from `performance.getEntriesByType('navigation')`. */
  navigationType: string;
  /** Last checkpoint data from the previous session. */
  lastCheckpoint: CheckpointData;
  /** Device information from the current session. */
  device: DeviceInfo;
  /** Individual OOM signals that contributed to the probability score. */
  signals: OOMSignal[];
}

/**
 * A single signal used in OOM probability calculation.
 *
 * The OOM recovery system evaluates multiple signals (document.wasDiscarded,
 * navigation type, memory trends, etc.) and combines their weighted scores
 * to produce the overall OOM probability.
 */
export interface OOMSignal {
  /** Machine-readable signal identifier (e.g., `'was_discarded'`, `'memory_trend'`). */
  signal: string;
  /** Weight of this signal in the probability calculation (0.0 to 1.0). */
  weight: number;
  /** Human-readable evidence explaining what was observed. */
  evidence: string;
}
