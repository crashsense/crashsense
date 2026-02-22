# Pre-Crash Warnings

CrashSense can detect dangerous system conditions **before** the browser tab crashes. The pre-crash warning system provides 3-tier escalating alerts based on memory pressure and iframe count.

## Warning Levels

| Level | Memory Trigger | Iframe Trigger | Meaning |
|---|---|---|---|
| `elevated` | > 70% heap | > 5 iframes | System under pressure |
| `critical` | > 85% heap | > 10 iframes | High risk — take action |
| `imminent` | > 95% heap | > 15 iframes | Crash likely seconds away |

## Enabling Pre-Crash Warnings

Enable the warning system in your CrashSense configuration:

```ts
import { createCrashSense } from '@crashsense/core';

const cs = createCrashSense({
  appId: 'my-app',
  enablePreCrashWarning: true,
  enableMemoryMonitoring: true,
  enableIframeTracking: true,  // optional, enables iframe-based triggers
});
```

Both `enablePreCrashWarning` and `enableMemoryMonitoring` must be `true` for memory-based warnings. Add `enableIframeTracking: true` if you also want iframe-based triggers.

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `enablePreCrashWarning` | `boolean` | `false` | Enable the pre-crash warning system |
| `preCrashMemoryThreshold` | `number` | `0.85` | Memory utilization threshold for critical warnings (0–1) |

## How It Works

When enabled, CrashSense continuously monitors:

1. **Memory utilization** — Tracks `performance.memory` (Chrome) or falls back to heuristic estimation. Compares current heap usage against heap size limit to calculate utilization percentage.

2. **Iframe count** — Uses `MutationObserver` to track iframe additions and removals in the DOM. Counts total iframes and cross-origin iframes separately.

When thresholds are crossed, warnings are emitted through the internal event bus. Each warning is automatically recorded as a **breadcrumb**, so when a crash eventually occurs, the trail shows the full escalation path:

```
breadcrumbs: [
  { type: "console", message: "Pre-crash warning: elevated — memory at 72%" },
  { type: "console", message: "Pre-crash warning: critical — memory at 87%" },
  { type: "console", message: "Pre-crash warning: imminent — memory at 96%" },
  // ... crash occurs
]
```

## Use Cases

- **Proactive user experience**: Show users a "your session may be unstable" message before a crash occurs
- **Automated recovery**: Trigger garbage collection, clear caches, or navigate to a lighter page when warnings escalate
- **Monitoring dashboards**: Track pre-crash warning frequency as a leading indicator of application health
- **Debug context**: The escalation trail in breadcrumbs makes it clear whether a crash was preceded by gradual memory pressure or a sudden spike

::: warning
`performance.memory` is Chrome-only. In other browsers, memory-based warnings rely on heuristic estimation and may be less accurate. Iframe-based warnings work in all browsers.
:::
