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

## OOM Recovery <Badge type="tip" text="v1.1.0" />

Detect when the OS kills a tab due to memory exhaustion (OOM) and recover crash context on the next page load. When enabled, CrashSense periodically snapshots system state to `sessionStorage` and analyzes 6 signals on reload to determine if the previous session ended in an OOM kill.

| Option | Type | Default | Description |
|---|---|---|---|
| `enableOOMRecovery` | `boolean` | `false` | Enable OOM recovery detection. When `true`, checkpoints are written to `sessionStorage` and analyzed on reload. |
| `checkpointInterval` | `number` | `10000` | Interval in milliseconds between checkpoint writes. Lower values capture more context but increase storage I/O. |
| `oomRecoveryThreshold` | `number` | `0.3` | Minimum probability (0–1) to classify a reload as an OOM recovery. Lower values are more sensitive (more false positives). |
| `flushEndpoint` | `string` | `null` | URL to send emergency data via `navigator.sendBeacon()` on `visibilitychange`/`pagehide`/`freeze`. If `null`, data is only persisted to `sessionStorage`. |

### How It Works

1. **Checkpoint Manager** — Periodically writes system state, breadcrumbs, and pre-crash warnings to `sessionStorage`
2. **Lifecycle Flush** — On `visibilitychange`, `pagehide`, or `freeze`, immediately persists current state and optionally beacons to `flushEndpoint`
3. **OOM Detection** — On next page load (before monitors start), analyzes 6 signals:
   - `document.wasDiscarded` — browser explicitly reports tab discard
   - Navigation type — `back_forward` or `reload` suggests recovery
   - Memory trend — was memory growing before the kill?
   - Pre-crash warnings — were elevated/critical/imminent warnings recorded?
   - Memory utilization — was heap usage dangerously high?
   - Device characteristics — low-memory devices are more susceptible

### Usage

```ts
const cs = createCrashSense({
  appId: 'my-app',
  enableOOMRecovery: true,
  checkpointInterval: 5000,
  oomRecoveryThreshold: 0.3,
  flushEndpoint: '/api/crash-beacon',
  onOOMRecovery: (report) => {
    console.log('OOM detected!', report.probability);
    console.log('Signals:', report.signals);
    console.log('Last checkpoint:', report.lastCheckpoint);
  },
});
```

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
| `onOOMRecovery` | `(report) => void` | `undefined` | Called when an OOM recovery is detected on page load. Receives an `OOMRecoveryReport` with probability, signals, and last checkpoint data. |

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
  enableOOMRecovery: true,
  checkpointInterval: 5000,
  oomRecoveryThreshold: 0.3,
  flushEndpoint: '/api/crash-beacon',
  sampleRate: 1.0,
  maxEventsPerMinute: 30,
  // Privacy
  piiScrubbing: true,
  preCrashMemoryThreshold: 0.85,
  debug: false,
  onCrash: async (report) => {
    await fetch('/api/crashes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
  },
  onOOMRecovery: (report) => {
    console.log('Tab was OOM-killed! Probability:', report.probability);
    console.log('Signals:', report.signals);
  },
});
```
