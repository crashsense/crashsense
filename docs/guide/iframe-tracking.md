# Iframe Tracking

Uncontrolled iframe loading — ads, widgets, payment forms, embedded content — can exhaust browser memory and crash the tab. CrashSense monitors iframe mutations in real-time to detect and report iframe-related resource exhaustion.

## Enabling Iframe Tracking

```ts
import { createCrashSense } from '@crashsense/core';

const cs = createCrashSense({
  appId: 'my-app',
  enableIframeTracking: true,
});
```

## How It Works

When `enableIframeTracking` is enabled, CrashSense uses a `MutationObserver` to watch the DOM for iframe additions and removals. It tracks:

- **Total iframe count** — all iframes currently in the DOM
- **Cross-origin iframe count** — iframes pointing to different origins (higher resource cost)
- **Iframe origins** — list of unique origins across all iframes

## Reading Iframe State

Use `getSystemState()` to access current iframe metrics:

```ts
const state = cs.getSystemState();

console.log('Total iframes:', state.iframe?.totalCount);
console.log('Cross-origin:', state.iframe?.crossOriginCount);
console.log('Origins:', state.iframe?.origins);
```

## Integration with Pre-Crash Warnings

When both `enableIframeTracking` and `enablePreCrashWarning` are enabled, iframe count contributes to warning levels:

| Warning Level | Iframe Trigger |
|---|---|
| `elevated` | > 5 iframes |
| `critical` | > 10 iframes |
| `imminent` | > 15 iframes |

```ts
const cs = createCrashSense({
  appId: 'my-app',
  enableIframeTracking: true,
  enablePreCrashWarning: true,
  enableMemoryMonitoring: true,
});
```

## Crash Classification

When a crash occurs and iframe count is abnormally high, CrashSense may classify the crash as `iframe_overload` with contributing factors that include iframe count and memory correlation:

```js
{
  category: "iframe_overload",
  confidence: 0.82,
  contributingFactors: [
    { factor: "high_iframe_count", weight: 0.9, evidence: "18 iframes detected (12 cross-origin)" },
    { factor: "high_memory_utilization", weight: 0.7, evidence: "Heap at 89% (470MB / 528MB)" },
  ]
}
```

## Common Scenarios

- **Ad-heavy pages**: Third-party ad scripts that inject multiple iframes over time
- **Embedded widgets**: Chat widgets, social media embeds, video players
- **Payment forms**: Stripe, PayPal, and other payment processors use iframes
- **SPA route changes**: iframes from previous routes that are not properly cleaned up

::: tip
Iframe tracking has minimal overhead — it uses a single `MutationObserver` on the document body and only processes `IFRAME` element mutations.
:::
