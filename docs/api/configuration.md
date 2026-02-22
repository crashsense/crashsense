# Configuration

Pass a configuration object to `createCrashSense()` to customize CrashSense behavior.

```ts
import { createCrashSense } from '@crashsense/core';

const cs = createCrashSense({
  appId: 'my-app',
  // ... options
});
```

## Required Options

| Option | Type | Description |
|---|---|---|
| `appId` | `string` | Your application identifier. Used to group crash events. |

## Environment

| Option | Type | Default | Description |
|---|---|---|---|
| `environment` | `string` | `'production'` | Environment name (e.g., `'staging'`, `'development'`) |
| `release` | `string` | `''` | Release or version tag for filtering crashes by deploy |

## Monitoring

| Option | Type | Default | Description |
|---|---|---|---|
| `enableMemoryMonitoring` | `boolean` | `true` | Monitor memory usage and trends via `performance.memory` |
| `enableLongTaskMonitoring` | `boolean` | `true` | Monitor event loop blocking via Long Task API |
| `enableNetworkMonitoring` | `boolean` | `true` | Monitor network failures, timeouts, and CORS errors |
| `enableIframeTracking` | `boolean` | `false` | Track iframe additions/removals via MutationObserver |
| `enablePreCrashWarning` | `boolean` | `false` | Enable 3-tier pre-crash warning system |

## Rate Limiting

| Option | Type | Default | Description |
|---|---|---|---|
| `sampleRate` | `number` | `1.0` | Event sampling rate (0–1). `1.0` captures everything, `0.1` captures 10% |
| `maxEventsPerMinute` | `number` | `30` | Maximum crash events per minute. Prevents event storms. |

## Privacy

| Option | Type | Default | Description |
|---|---|---|---|
| `piiScrubbing` | `boolean` | `true` | Auto-scrub emails, IP addresses, auth tokens, and credit card numbers from crash payloads |

## Thresholds

| Option | Type | Default | Description |
|---|---|---|---|
| `preCrashMemoryThreshold` | `number` | `0.85` | Memory utilization threshold (0–1) for critical pre-crash warnings |

## Callbacks

| Option | Type | Default | Description |
|---|---|---|---|
| `onCrash` | `(report) => void` | `undefined` | Called when a crash is detected. Receives the full crash report. |

## Debug

| Option | Type | Default | Description |
|---|---|---|---|
| `debug` | `boolean` | `false` | Log crash reports to the browser console |

## Full Example

```ts
import { createCrashSense } from '@crashsense/core';

const cs = createCrashSense({
  // Required
  appId: 'my-ecommerce-app',

  // Environment
  environment: 'production',
  release: '2.3.1',

  // Monitoring
  enableMemoryMonitoring: true,
  enableLongTaskMonitoring: true,
  enableNetworkMonitoring: true,
  enableIframeTracking: true,
  enablePreCrashWarning: true,

  // Rate limiting
  sampleRate: 1.0,
  maxEventsPerMinute: 30,

  // Privacy
  piiScrubbing: true,

  // Thresholds
  preCrashMemoryThreshold: 0.85,

  // Debug
  debug: false,

  // Callbacks
  onCrash: async (report) => {
    await fetch('/api/crashes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
  },
});
```
