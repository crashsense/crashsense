# Core API

The `@crashsense/core` package is the foundation of CrashSense. It provides crash detection, system monitoring, classification, and the plugin system.

## createCrashSense

Factory function that creates and initializes a CrashSense instance.

```ts
import { createCrashSense } from '@crashsense/core';

const cs = createCrashSense({
  appId: 'my-app',
  debug: true,
  onCrash: (report) => {
    console.log(report.event.category);
  },
});
```

See [Configuration](/api/configuration) for all available options.

## Instance Methods

### use(plugin)

Register a plugin. Plugins are called in registration order.

```ts
cs.use(myPlugin);
```

See [Plugins Guide](/guide/plugins) for details.

### captureException(error, context?)

Manually capture an error with optional context metadata.

```ts
try {
  await riskyOperation();
} catch (err) {
  cs.captureException(err, { action: 'checkout', userId: '123' });
}
```

### captureMessage(message)

Capture a non-error message (e.g., a warning or info-level event).

```ts
cs.captureMessage('User attempted checkout with empty cart');
```

### addBreadcrumb(breadcrumb)

Add a custom breadcrumb to the trail. Breadcrumbs are included in the next crash report.

```ts
cs.addBreadcrumb({
  type: 'click',
  message: 'User clicked checkout button',
});
```

Breadcrumb types: `'click'`, `'navigation'`, `'network'`, `'console'`, `'state'`, `'custom'`.

### setUser(user)

Set user context for crash reports. If PII scrubbing is enabled, sensitive fields are hashed.

```ts
cs.setUser({ id: 'user-123', plan: 'premium' });
```

### setContext(key, data)

Set custom context that will be attached to all subsequent crash reports.

```ts
cs.setContext('order', { orderId: 'ORD-456', itemCount: 3 });
```

### getSystemState()

Get the current system state snapshot (memory, CPU, network, iframe metrics).

```ts
const state = cs.getSystemState();

console.log(state.memory?.utilizationPercent);  // 67.3
console.log(state.cpu?.longTasksLast30s);       // 2
console.log(state.network?.isOnline);           // true
console.log(state.iframe?.totalCount);          // 4
```

### destroy()

Clean teardown. Removes all event listeners, stops all monitors, calls `teardown()` on all plugins.

```ts
cs.destroy();
```

## Crash Categories

Every crash is classified into one of these categories:

| Category | Description |
|---|---|
| `runtime_error` | TypeError, ReferenceError, RangeError, and other standard JavaScript errors |
| `memory_issue` | Memory leaks, heap spikes, memory pressure |
| `event_loop_blocking` | Infinite loops, long tasks, frozen UI |
| `framework_react` | React-specific: hydration mismatches, infinite re-renders, hook violations |
| `framework_vue` | Vue-specific: reactivity loops, lifecycle errors, watcher cascades |
| `network_induced` | Offline crashes, CORS blocks, timeouts, failed requests |
| `iframe_overload` | Excessive iframes exhausting memory |

## CrashEvent Interface

The core data structure for every crash:

```ts
interface CrashEvent {
  // Classification
  category: string;        // One of the crash categories above
  subcategory: string;     // Specific subcategory (e.g., "memory_leak")
  confidence: number;      // 0.0 – 1.0 classification confidence
  severity: 'critical' | 'error' | 'warning' | 'info';

  // Error
  error: {
    type: string;          // Error constructor name
    message: string;       // Error message (PII-scrubbed)
    stack: string;         // Stack trace
  };

  // System state at crash time
  system: {
    memory: {
      trend: 'stable' | 'growing' | 'shrinking' | 'spike';
      utilizationPercent: number | null;
    };
    cpu: {
      longTasksLast30s: number;
      estimatedBlockingTime: number;
    };
    network: {
      failedRequestsLast60s: number;
      isOnline: boolean;
    };
  };

  // Trail of events leading to the crash
  breadcrumbs: Array<{
    type: string;
    timestamp: number;
    message: string;
  }>;

  // Factors that contributed to the crash
  contributingFactors: Array<{
    factor: string;
    weight: number;        // 0.0 – 1.0
    evidence: string;      // Human-readable explanation
  }>;

  // Metadata
  fingerprint: string;     // Deduplication hash
  meta: {
    appId: string;
    environment: string;
    release?: string;
    sdkVersion: string;
    tags: Record<string, string>;
  };
}
```
