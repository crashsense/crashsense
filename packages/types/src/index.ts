// ============================================================
// @crashsense/types — Shared type definitions for CrashSense
// ============================================================

// ---------------------
// Crash Categories
// ---------------------

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

export type CrashSeverity = 'critical' | 'error' | 'warning' | 'info';

// ---------------------
// Stack Frame
// ---------------------

export interface StackFrame {
  filename: string;
  function: string;
  lineno: number;
  colno: number;
  inApp: boolean;
  context?: string[];
}

// ---------------------
// Breadcrumb
// ---------------------

export type BreadcrumbType = 'click' | 'navigation' | 'network' | 'console' | 'state' | 'custom';

export interface Breadcrumb {
  type: BreadcrumbType;
  timestamp: number;
  message: string;
  data?: Record<string, unknown>;
}

// ---------------------
// System State
// ---------------------

export type MemoryTrend = 'stable' | 'growing' | 'shrinking' | 'spike';

export interface MemoryState {
  usedJSHeapSize: number | null;
  totalJSHeapSize: number | null;
  heapSizeLimit: number | null;
  trend: MemoryTrend;
  utilizationPercent: number | null;
}

export interface CpuState {
  longTasksLast30s: number;
  avgLongTaskDuration: number;
  maxLongTaskDuration: number;
  estimatedBlockingTime: number;
}

export interface EventLoopState {
  isBlocked: boolean;
  blockDuration: number | null;
  fps: number;
}

export interface NetworkState {
  pendingRequests: number;
  failedRequestsLast60s: number;
  avgLatencyLast60s: number;
  connectionType: string | null;
  isOnline: boolean;
}

export interface IframeState {
  totalCount: number;
  addedLast60s: number;
  removedLast60s: number;
  origins: string[];
  crossOriginCount: number;
}

export interface SystemState {
  memory: MemoryState;
  cpu: CpuState;
  eventLoop: EventLoopState;
  network: NetworkState;
  iframe?: IframeState;
}

// ---------------------
// Device Information
// ---------------------

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  vendor: string;
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
  viewport: { width: number; height: number };
  devicePixelRatio: number;
  touchSupport: boolean;
  colorScheme: 'light' | 'dark';
  reducedMotion: boolean;
  language: string;
  timezone: string;
}

// ---------------------
// Framework Context
// ---------------------

export interface FrameworkContext {
  name: 'react' | 'vue' | 'vanilla' | string;
  version: string;
  adapter: string;
  componentTree?: string[];
  currentRoute?: string;
  storeState?: Record<string, unknown>;
  lifecycleStage?: string;
  renderCount?: number;
}

// ---------------------
// Contributing Factor
// ---------------------

export interface ContributingFactor {
  factor: string;
  weight: number;
  evidence: string;
}

// ---------------------
// Crash Event (Core)
// ---------------------

export interface CrashEvent {
  // Identity
  id: string;
  fingerprint: string;
  timestamp: number;
  sessionId: string;

  // Classification
  category: CrashCategory;
  subcategory: string;
  severity: CrashSeverity;
  confidence: number;

  // Error Details
  error: {
    type: string;
    message: string;
    stack: StackFrame[];
    raw: string;
  };

  // System State at Crash Time
  system: SystemState;

  // Device Information
  device: DeviceInfo;

  // Framework Context
  framework: FrameworkContext;

  // Breadcrumbs
  breadcrumbs: Breadcrumb[];

  // Contributing Factors
  contributingFactors: ContributingFactor[];

  // Metadata
  meta: CrashEventMeta;
}

export interface CrashEventMeta {
  appId: string;
  environment: string;
  release?: string;
  userId?: string;
  tags: Record<string, string>;
  sdkVersion: string;
}

// ---------------------
// Partial Crash Event (pre-classification)
// ---------------------

export interface RawCrashEvent {
  id: string;
  timestamp: number;
  sessionId: string;
  error: {
    type: string;
    message: string;
    stack: StackFrame[];
    raw: string;
  };
  system: Partial<SystemState>;
  device: DeviceInfo;
  framework: Partial<FrameworkContext>;
  breadcrumbs: Breadcrumb[];
  meta: CrashEventMeta;
}

// ---------------------
// Configuration
// ---------------------

export interface CrashSenseConfig {
  appId: string;
  environment?: string;
  release?: string;
  sampleRate?: number;
  maxEventsPerMinute?: number;
  enableMemoryMonitoring?: boolean;
  enableLongTaskMonitoring?: boolean;
  enableNetworkMonitoring?: boolean;
  enableIframeTracking?: boolean;
  enablePreCrashWarning?: boolean;
  preCrashMemoryThreshold?: number;
  piiScrubbing?: boolean;
  debug?: boolean;
  onCrash?: (report: CrashReport) => void;
  onOOMRecovery?: (report: OOMRecoveryReport) => void;
  enableOOMRecovery?: boolean;
  checkpointInterval?: number;
  oomRecoveryThreshold?: number;
  flushEndpoint?: string;
}

export interface ResolvedConfig {
  appId: string;
  environment: string;
  release: string;
  sampleRate: number;
  maxEventsPerMinute: number;
  enableMemoryMonitoring: boolean;
  enableLongTaskMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  enableIframeTracking: boolean;
  enablePreCrashWarning: boolean;
  preCrashMemoryThreshold: number;
  piiScrubbing: boolean;
  debug: boolean;
  onCrash: ((report: CrashReport) => void) | null;
  enableOOMRecovery: boolean;
  checkpointInterval: number;
  oomRecoveryThreshold: number;
  flushEndpoint: string | null;
  onOOMRecovery: ((report: OOMRecoveryReport) => void) | null;
}

// ---------------------
// Plugin System
// ---------------------

export interface CrashSensePlugin {
  name: string;
  setup(core: CrashSenseCore): void;
  teardown(): void;
  onCrashEvent?(event: CrashEvent): CrashEvent | null;
}

// ---------------------
// Core Interface (for plugin registration)
// ---------------------

export interface CrashSenseCore {
  readonly config: ResolvedConfig;
  readonly sessionId: string;

  use(plugin: CrashSensePlugin): void;
  captureException(error: unknown, context?: Record<string, unknown>): void;
  captureMessage(message: string, severity?: CrashSeverity): void;
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
  setUser(user: { id: string; [key: string]: unknown }): void;
  setContext(key: string, value: Record<string, unknown>): void;
  getSystemState(): SystemState;
  getDeviceInfo(): DeviceInfo;
  destroy(): void;

  // Internal: for monitors to report events
  _reportRawEvent(event: RawCrashEvent): void;
  _getEventBus(): EventBus;
}

// ---------------------
// Event Bus
// ---------------------

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

export type PreCrashLevel = 'elevated' | 'critical' | 'imminent';

export interface EventBus {
  on<K extends keyof EventBusEventMap>(event: K, handler: (data: EventBusEventMap[K]) => void): void;
  off<K extends keyof EventBusEventMap>(event: K, handler: (data: EventBusEventMap[K]) => void): void;
  emit<K extends keyof EventBusEventMap>(event: K, data: EventBusEventMap[K]): void;
}

// ---------------------
// Crash Report (final output)
// ---------------------

export interface CrashReport {
  event: CrashEvent;
  analysis: CrashAnalysis | null;
  timestamp: number;
}

export interface CrashAnalysis {
  rootCause: string;
  explanation: string;
  fix: {
    description: string;
    code: string;
    filename: string;
  } | null;
  prevention: string[];
  confidence: number;
  alternativeCauses: Array<{ cause: string; likelihood: number }>;
  source: 'heuristic' | 'ai' | 'hybrid';
}

// ---------------------
// AI Integration Types
// ---------------------

export interface AIConfig {
  endpoint: string;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  retries?: number;
  provider?: 'openai' | 'anthropic' | 'google' | 'custom';
}

export interface AIPayload {
  crash_summary: {
    category: CrashCategory;
    subcategory: string;
    heuristic_confidence: number;
    severity: CrashSeverity;
  };
  error: {
    type: string;
    message: string;
    stack_top_5: string[];
    user_code_frames: string[];
  };
  system_state: {
    memory_utilization: string;
    memory_trend: MemoryTrend;
    long_tasks_last_30s: number;
    fps_at_crash: number;
    pending_network_requests: number;
    failed_requests_last_60s: number;
  };
  device: {
    platform: string;
    memory: string;
    viewport: string;
    connection: string;
  };
  framework: {
    name: string;
    version: string;
    lifecycle_stage: string;
    component_path: string[];
    render_count_since_nav: number;
  };
  breadcrumbs_last_5: Array<{
    type: BreadcrumbType;
    message: string;
    time: string;
  }>;
  contributing_factors: Array<{
    factor: string;
    weight: number;
    evidence: string;
  }>;
}

export interface AIResponse {
  rootCause: string;
  explanation: string;
  fix: {
    description: string;
    code: string;
    filename: string;
  };
  prevention: string[];
  confidence: number;
  alternativeCauses: Array<{ cause: string; likelihood: number }>;
}

// ---------------------
// Network Monitor Types
// ---------------------

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration: number;
  startTime: number;
  error: string | null;
  responseSize: number | null;
}

// ---------------------
// Classification Result
// ---------------------

export interface ClassificationResult {
  category: CrashCategory;
  subcategory: string;
  confidence: number;
  contributingFactors: ContributingFactor[];
}

// ---------------------
// OOM Recovery Types
// ---------------------

export interface CheckpointData {
  version: number;
  timestamp: number;
  sessionId: string;
  appId: string;
  url: string;
  breadcrumbs: Breadcrumb[];
  systemState: Partial<SystemState>;
  device: DeviceInfo;
  preCrashWarnings: Array<{
    level: PreCrashLevel;
    reason: string;
    timestamp: number;
  }>;
  memoryTrend: MemoryTrend | null;
  checkpointCount: number;
}

export interface OOMRecoveryReport {
  id: string;
  type: 'oom_recovery';
  timestamp: number;
  probability: number;
  sessionId: string;
  previousSessionId: string;
  timeSinceLastCheckpoint: number;
  wasDiscarded: boolean | undefined;
  navigationType: string;
  lastCheckpoint: CheckpointData;
  device: DeviceInfo;
  signals: OOMSignal[];
}

export interface OOMSignal {
  signal: string;
  weight: number;
  evidence: string;
}
