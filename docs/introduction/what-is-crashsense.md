# What is CrashSense?

CrashSense is an intelligent crash diagnosis SDK for JavaScript, React, and Vue applications. It goes beyond traditional error monitoring by capturing **system state** alongside errors — memory pressure, event loop saturation, network conditions, and framework-specific context — to tell you **why** your app crashed, not just **what** threw an exception.

## The Problem

Traditional error monitoring shows you this:

```
TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (UserList.tsx:42)
    at renderWithHooks (react-dom.development.js:14985)
    at mountIndeterminateComponent (react-dom.development.js:17811)
```

Now what? Is it a race condition? A failed API call? A memory leak? A hydration mismatch? You have no idea. Enjoy your next 3 hours of debugging.

## The Solution

With CrashSense, the same crash gives you this:

```js
{
  category: "memory_issue",
  subcategory: "memory_leak",
  confidence: 0.87,
  severity: "critical",

  contributingFactors: [
    { factor: "high_memory_utilization", weight: 0.9, evidence: "Heap at 92% (487MB / 528MB)" },
    { factor: "memory_growing_trend",   weight: 0.8, evidence: "Heap growing at 2.3MB/s over 60s" },
    { factor: "high_long_task_count",   weight: 0.6, evidence: "4 long tasks in last 30s (avg 340ms)" },
  ],

  system: {
    memory: { trend: "growing", utilizationPercent: 92.2 },
    cpu: { longTasksLast30s: 4, estimatedBlockingTime: 1360 },
    network: { failedRequestsLast60s: 0, isOnline: true },
  },

  breadcrumbs: [
    { type: "navigation", message: "User navigated to /checkout" },
    { type: "click",      message: "User clicked 'Add to Cart'" },
    { type: "network",    message: "POST /api/cart → 200 (142ms)" },
    { type: "console",    message: "Warning: memory pressure elevated" },
  ],

  // With @crashsense/ai:
  aiAnalysis: {
    rootCause: "Memory leak in useEffect — event listener not cleaned up",
    fix: { code: "return () => window.removeEventListener('resize', handler);" },
    prevention: "Always return cleanup functions from useEffect with side effects",
  }
}
```

**Root cause identified. Fix suggested. Time saved: 3 hours.**

## Key Features

### Crash Classification with Confidence Scoring

Every crash is classified into one of 7 categories with a confidence score (0.0–1.0) and a list of contributing factors with evidence strings.

### AI-Powered Fix Suggestions

Bring your own LLM (OpenAI, Anthropic, Google, or any OpenAI-compatible endpoint). CrashSense sends a structured, token-optimized crash payload to your AI and returns a parsed root cause analysis with fix code.

### Pre-Crash Warning System

3-tier escalating alerts detect dangerous system conditions **before** the browser tab crashes: elevated, critical, and imminent warnings based on memory pressure and iframe count.

### Plugin System

Intercept, enrich, or drop crash events with custom plugins. Build backend reporters, filters, or custom enrichment logic.

### Breadcrumb Trail

Automatic capture of clicks, navigation, network requests, console output, and state changes — the full trail leading to every crash.

### Privacy-First

Emails, IPs, auth tokens, and credit card numbers are auto-scrubbed at the SDK level before any data leaves the browser.

## CrashSense vs. The Rest

| Capability | CrashSense | Sentry | LogRocket | Bugsnag |
|---|:---:|:---:|:---:|:---:|
| **Root cause classification** | 7 categories + confidence | Stack trace only | No | Basic grouping |
| **Memory leak detection** | Trends + utilization | No | No | No |
| **Event loop blocking** | Long Task monitoring | No | No | No |
| **React crash detection** | Hydration, re-renders, hooks | ErrorBoundary only | Partial | Partial |
| **Vue crash detection** | Reactivity loops, lifecycle | Partial | Partial | Partial |
| **Pre-crash warnings** | 3-tier escalation | No | No | No |
| **AI fix suggestions** | Bring your own LLM | No | No | No |
| **PII auto-scrubbing** | SDK-level | Server-side | No | Limited |
| **Bundle size (gzipped)** | **~7KB** | ~30KB | ~80KB | ~15KB |
| **Runtime dependencies** | **0** | Multiple | Multiple | Multiple |
| **Open source** | MIT | BSL | Proprietary | Proprietary |
| **Pricing** | **Free** | Free tier (5K events) | $99/mo | $59/mo |

## Crash Categories

| Category | What It Detects | How |
|---|---|---|
| `runtime_error` | TypeError, ReferenceError, RangeError, etc. | Error type analysis |
| `memory_issue` | Memory leaks, heap spikes, memory pressure | `performance.memory` + trend analysis |
| `event_loop_blocking` | Infinite loops, long tasks, frozen UI | Long Task API + frame timing |
| `framework_react` | Hydration mismatches, infinite re-renders, hook violations | React adapter instrumentation |
| `framework_vue` | Reactivity loops, lifecycle errors, watcher cascades | Vue adapter instrumentation |
| `network_induced` | Offline crashes, CORS blocks, timeouts, failed requests | Network monitoring + error analysis |
| `iframe_overload` | Excessive iframes exhausting memory | MutationObserver + memory correlation |

## Packages

| Package | Description | Size |
|---|---|---|
| [`@crashsense/core`](https://www.npmjs.com/package/@crashsense/core) | Crash detection engine — monitors, classifiers, event bus | ~7KB |
| [`@crashsense/react`](https://www.npmjs.com/package/@crashsense/react) | React ErrorBoundary + hooks + hydration detector | ~1.3KB |
| [`@crashsense/vue`](https://www.npmjs.com/package/@crashsense/vue) | Vue plugin + composables + reactivity tracker | ~1.2KB |
| [`@crashsense/ai`](https://www.npmjs.com/package/@crashsense/ai) | AI analysis client — any LLM endpoint | ~3.1KB |
| [`@crashsense/types`](https://www.npmjs.com/package/@crashsense/types) | Shared TypeScript types | types only |
| [`@crashsense/utils`](https://www.npmjs.com/package/@crashsense/utils) | Internal utilities | ~2.5KB |

## Performance Budget

| Metric | Budget |
|---|---|
| CPU overhead | < 2% |
| Memory footprint | < 5MB |
| Core bundle (gzipped) | < 15KB |
| SDK errors | **Never** crash the host app |

All monitoring uses passive browser APIs (`PerformanceObserver`, `MutationObserver`). Zero monkey-patching by default.

## Browser Support

| Browser | Version |
|---|---|
| Chrome | 80+ |
| Firefox | 80+ |
| Safari | 14+ |
| Edge | 80+ |
| Node.js | 18+ |

::: tip
`performance.memory` is Chrome-only. Memory monitoring gracefully degrades in other browsers. All other features work cross-browser.
:::
