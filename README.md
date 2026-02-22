<p align="center">
  <img src="https://img.shields.io/badge/🔍-CrashSense-000000?style=for-the-badge&labelColor=000000" alt="CrashSense" height="60">
</p>

<h1 align="center">CrashSense</h1>

<p align="center">
  <strong>Error monitoring tells you WHAT crashed.<br>CrashSense tells you WHY — and how to fix it.</strong>
</p>

<p align="center">
  Intelligent crash diagnosis for JavaScript, React & Vue — root cause classification, not just stack traces.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@crashsense/core"><img src="https://img.shields.io/npm/v/@crashsense/core?style=flat-square&color=cb0000&label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@crashsense/core"><img src="https://img.shields.io/npm/dw/@crashsense/core?style=flat-square&color=cb0000&label=downloads" alt="npm downloads"></a>
  <a href="https://github.com/hoainho/crashsense"><img src="https://img.shields.io/github/stars/hoainho/crashsense?style=flat-square&color=yellow" alt="GitHub stars"></a>
  <a href="https://bundlephobia.com/package/@crashsense/core"><img src="https://img.shields.io/bundlephobia/minzip/@crashsense/core?style=flat-square&color=49a057&label=bundle" alt="bundle size"></a>
  <img src="https://img.shields.io/badge/dependencies-0-49a057?style=flat-square" alt="zero dependencies">
  <img src="https://img.shields.io/badge/TypeScript-first-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <a href="https://github.com/hoainho/crashsense/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT license"></a>
</p>

<br>

## The Problem

You see this in your error dashboard:

```
TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (UserList.tsx:42)
    at renderWithHooks (react-dom.development.js:14985)
    at mountIndeterminateComponent (react-dom.development.js:17811)
```

Cool. Now what? Is it a race condition? A failed API call? A memory leak? A hydration mismatch? You have no idea. Enjoy your next 3 hours of debugging.

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
    // ... full trail leading to crash
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

---

## Features

🔍 **7 crash categories** with confidence scoring — `memory_issue`, `event_loop_blocking`, `framework_react`, `framework_vue`, `network_induced`, `iframe_overload`, `runtime_error`

🧠 **AI-powered fix suggestions** — bring your own LLM (OpenAI, Anthropic, Google, or any compatible endpoint)

⚡ **~7KB gzipped core** — zero runtime dependencies in all browser packages

🛡️ **Privacy-first** — emails, IPs, tokens, and credit card numbers auto-scrubbed at the SDK level

⚛️ **React & Vue adapters** — hydration mismatch detection, infinite re-render tracking, reactivity loop detection

🚨 **Pre-crash warnings** — 3-tier escalating alerts detect memory pressure *before* the tab dies

🔌 **Plugin system** — intercept, enrich, or drop crash events with custom plugins

📦 **TypeScript-first** — full type definitions, tree-shakeable ESM + CJS, SSR-safe

🍞 **Breadcrumb trail** — clicks, navigation, network requests, console output, state changes — automatic

---

## Install

```bash
npm install @crashsense/core
# or
yarn add @crashsense/core
# or
pnpm add @crashsense/core
# or
bun add @crashsense/core
```

```ts
import { createCrashSense } from '@crashsense/core';

const cs = createCrashSense({
  appId: 'my-app',
  debug: true,
  onCrash: (report) => {
    console.log(report.event.category);     // "memory_issue"
    console.log(report.event.confidence);   // 0.87
    console.log(report.event.contributingFactors);
  },
});
```

That's it. CrashSense is now monitoring memory, event loop, network, and capturing every crash with full system state.

<details>
<summary><strong>⚛️ React — 3 lines to add crash diagnosis</strong></summary>

```bash
npm install @crashsense/core @crashsense/react
# or
yarn add @crashsense/core @crashsense/react
# or
pnpm add @crashsense/core @crashsense/react
# or
bun add @crashsense/core @crashsense/react
```

```tsx
import { CrashSenseProvider } from '@crashsense/react';

function App() {
  return (
    <CrashSenseProvider
      config={{ appId: 'my-app', debug: true }}
      onCrash={(report) => console.log('Crash:', report)}
    >
      <YourApp />
    </CrashSenseProvider>
  );
}
```

Automatically captures React-specific crashes: hydration mismatches, infinite re-render loops, hook ordering violations, and lifecycle errors.

#### Hooks

```tsx
import { useCrashSense, useRenderTracker } from '@crashsense/react';

function Checkout() {
  const { captureException, addBreadcrumb } = useCrashSense();
  useRenderTracker('Checkout'); // tracks excessive re-renders

  const handlePay = async () => {
    addBreadcrumb({ type: 'click', message: 'User clicked pay' });
    try {
      await processPayment();
    } catch (err) {
      captureException(err, { action: 'payment' });
    }
  };

  return <button onClick={handlePay}>Pay Now</button>;
}
```

</details>

<details>
<summary><strong>💚 Vue — plugin + composables</strong></summary>

```bash
npm install @crashsense/core @crashsense/vue
# or
yarn add @crashsense/core @crashsense/vue
# or
pnpm add @crashsense/core @crashsense/vue
# or
bun add @crashsense/core @crashsense/vue
```

```ts
import { createApp } from 'vue';
import { crashSensePlugin } from '@crashsense/vue';

const app = createApp(App);
app.use(crashSensePlugin, { appId: 'my-app', debug: true });
app.mount('#app');
```

Catches Vue-specific crashes: reactivity loops, lifecycle errors, component-level failures via `app.config.errorHandler`.

#### Composables

```ts
import { useCrashSense, useReactivityTracker } from '@crashsense/vue';

const { captureException, addBreadcrumb } = useCrashSense();

// Track reactive state for anomaly detection
useReactivityTracker({
  cartItems: () => store.state.cartItems,
  userProfile: () => store.state.userProfile,
});
```

</details>

<details>
<summary><strong>🧠 AI Integration — bring your own LLM</strong></summary>

```bash
npm install @crashsense/ai
# or
yarn add @crashsense/ai
# or
pnpm add @crashsense/ai
# or
bun add @crashsense/ai
```

```ts
import { createAIClient } from '@crashsense/ai';

const ai = createAIClient({
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',
});

const analysis = await ai.analyze(report.event);
if (analysis) {
  console.log('Root cause:', analysis.rootCause);
  console.log('Explanation:', analysis.explanation);
  console.log('Fix:', analysis.fix?.code);
  console.log('Prevention:', analysis.prevention);
}
```

Supports OpenAI, Anthropic, Google, or any OpenAI-compatible endpoint. The AI client sends a structured, token-optimized crash payload and returns parsed, validated analysis.

</details>

---

## CrashSense vs. The Rest

| Capability | CrashSense | Sentry | LogRocket | Bugsnag |
|---|:---:|:---:|:---:|:---:|
| **Root cause classification** | ✅ 7 categories + confidence | ❌ Stack trace only | ❌ | ❌ Basic grouping |
| **Memory leak detection** | ✅ Trends + utilization | ❌ | ❌ | ❌ |
| **Event loop blocking** | ✅ Long Task monitoring | ❌ | ❌ | ❌ |
| **React crash detection** | ✅ Hydration, re-renders, hooks | ⚠️ ErrorBoundary only | ⚠️ Partial | ⚠️ Partial |
| **Vue crash detection** | ✅ Reactivity loops, lifecycle | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial |
| **Pre-crash warnings** | ✅ 3-tier escalation | ❌ | ❌ | ❌ |
| **AI fix suggestions** | ✅ Bring your own LLM | ❌ | ❌ | ❌ |
| **PII auto-scrubbing** | ✅ SDK-level | ⚠️ Server-side | ❌ | ⚠️ Limited |
| **Bundle size (gzipped)** | **~7KB** | ~30KB | ~80KB | ~15KB |
| **Runtime dependencies** | **0** | Multiple | Multiple | Multiple |
| **Open source** | ✅ MIT | ✅ BSL | ❌ Proprietary | ❌ Proprietary |
| **Pricing** | **Free** | Free tier (5K events) | $99/mo | $59/mo |

---

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

Each crash report includes a **confidence score** (0.0–1.0) and **contributing factors** with evidence strings, so you know exactly why the classifier made its decision.

---

## Packages

| Package | Description | Size |
|---|---|---|
| [`@crashsense/core`](https://www.npmjs.com/package/@crashsense/core) | Crash detection engine — monitors, classifiers, event bus | ~7KB |
| [`@crashsense/react`](https://www.npmjs.com/package/@crashsense/react) | React ErrorBoundary + hooks + hydration detector | ~1.3KB |
| [`@crashsense/vue`](https://www.npmjs.com/package/@crashsense/vue) | Vue plugin + composables + reactivity tracker | ~1.2KB |
| [`@crashsense/ai`](https://www.npmjs.com/package/@crashsense/ai) | AI analysis client — any LLM endpoint | ~3.1KB |
| [`@crashsense/types`](https://www.npmjs.com/package/@crashsense/types) | Shared TypeScript types | types only |
| [`@crashsense/utils`](https://www.npmjs.com/package/@crashsense/utils) | Internal utilities | ~2.5KB |

---

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `appId` | `string` | *required* | Your application identifier |
| `environment` | `string` | `'production'` | Environment name |
| `release` | `string` | `''` | Release/version tag |
| `sampleRate` | `number` | `1.0` | Event sampling rate (0–1) |
| `maxEventsPerMinute` | `number` | `30` | Rate limit for crash events |
| `enableMemoryMonitoring` | `boolean` | `true` | Monitor memory usage and trends |
| `enableLongTaskMonitoring` | `boolean` | `true` | Monitor event loop blocking |
| `enableNetworkMonitoring` | `boolean` | `true` | Monitor network failures |
| `enableIframeTracking` | `boolean` | `false` | Track iframe additions/removals |
| `enablePreCrashWarning` | `boolean` | `false` | Enable 3-tier pre-crash warning system |
| `preCrashMemoryThreshold` | `number` | `0.85` | Memory threshold for critical warnings |
| `piiScrubbing` | `boolean` | `true` | Auto-scrub emails, IPs, tokens, card numbers |
| `debug` | `boolean` | `false` | Log crash reports to console |
| `onCrash` | `(report) => void` | — | Callback when a crash is detected |

---

<details>
<summary><strong>🚨 Pre-Crash Warning System</strong></summary>

CrashSense detects dangerous system conditions **before** the browser tab crashes:

| Level | Memory Trigger | Iframe Trigger | Meaning |
|---|---|---|---|
| `elevated` | > 70% heap | > 5 iframes | System under pressure |
| `critical` | > 85% heap | > 10 iframes | High risk — take action |
| `imminent` | > 95% heap | > 15 iframes | Crash likely seconds away |

```ts
const cs = createCrashSense({
  appId: 'my-app',
  enablePreCrashWarning: true,
  enableIframeTracking: true,
  enableMemoryMonitoring: true,
});
```

Warnings are automatically recorded as breadcrumbs. When a crash occurs, the trail shows the full escalation path.

</details>

<details>
<summary><strong>📡 Iframe Tracking</strong></summary>

Uncontrolled iframe loading (ads, widgets, payment forms) can exhaust memory and crash the tab. CrashSense monitors iframe mutations in real-time:

```ts
const cs = createCrashSense({
  appId: 'my-app',
  enableIframeTracking: true,
});

const state = cs.getSystemState();
console.log('Total iframes:', state.iframe?.totalCount);
console.log('Cross-origin:', state.iframe?.crossOriginCount);
console.log('Origins:', state.iframe?.origins);
```

</details>

<details>
<summary><strong>🔌 Custom Plugins</strong></summary>

Plugins intercept, enrich, or drop crash events before they reach your `onCrash` callback:

```ts
import type { CrashSensePlugin, CrashEvent, CrashSenseCore } from '@crashsense/core';

const backendReporter: CrashSensePlugin = {
  name: 'backend-reporter',

  setup(core: CrashSenseCore) {
    console.log('Reporter initialized for', core.config.appId);
  },

  teardown() {},

  onCrashEvent(event: CrashEvent) {
    fetch('/api/crashes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: event.category,
        subcategory: event.subcategory,
        severity: event.severity,
        message: event.error.message,
        fingerprint: event.fingerprint,
      }),
    }).catch(() => {});

    return event; // return null to drop the event
  },
};

const cs = createCrashSense({ appId: 'my-app' });
cs.use(backendReporter);
```

</details>

<details>
<summary><strong>📤 Sending Reports to Your Backend</strong></summary>

```ts
const cs = createCrashSense({
  appId: 'my-app',
  onCrash: async (report) => {
    await fetch('https://your-api.com/crashes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
  },
});
```

Each report includes the full `CrashEvent` with system state, breadcrumbs, device info, contributing factors, and classification. PII is auto-scrubbed before it reaches your callback.

</details>

<details>
<summary><strong>🛒 Full Example — React E-Commerce Checkout</strong></summary>

```tsx
import React, { useState, useEffect } from 'react';
import { CrashSenseProvider, useCrashSense, useRenderTracker } from '@crashsense/react';
import { createAIClient } from '@crashsense/ai';

const aiClient = createAIClient({
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: process.env.REACT_APP_OPENAI_KEY!,
  model: 'gpt-4',
});

export function App() {
  return (
    <CrashSenseProvider
      config={{
        appId: 'ecommerce-app',
        environment: process.env.NODE_ENV,
        release: '2.3.1',
        enableIframeTracking: true,
        enablePreCrashWarning: true,
        onCrash: async (report) => {
          await fetch('/api/crashes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report),
          });
          if (report.event.severity === 'critical') {
            const analysis = await aiClient.analyze(report.event);
            console.log('AI fix:', analysis?.fix?.code);
          }
        },
      }}
    >
      <Checkout />
    </CrashSenseProvider>
  );
}

function Checkout() {
  const { captureException, addBreadcrumb, core } = useCrashSense();
  useRenderTracker('Checkout');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) core?.setUser({ id: user.id, plan: user.plan });
  }, [core]);

  async function handleCheckout() {
    addBreadcrumb({ type: 'click', message: 'User clicked checkout' });
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
      });
      if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
    } catch (error) {
      captureException(error, { action: 'checkout', cartSize: String(cart.length) });
    }
  }

  return <button onClick={handleCheckout}>Complete Purchase</button>;
}
```

See full source: [`examples/react-ecommerce/`](./examples/react-ecommerce/)

</details>

---

## Performance Budget

| Metric | Budget |
|---|---|
| CPU overhead | < 2% |
| Memory footprint | < 5MB |
| Core bundle (gzipped) | < 15KB |
| SDK errors | **NEVER** crash the host app |

All monitoring uses passive browser APIs (`PerformanceObserver`, `MutationObserver`). Zero monkey-patching by default.

## Browser Support

| Browser | Version |
|---|---|
| Chrome | 80+ |
| Firefox | 80+ |
| Safari | 14+ |
| Edge | 80+ |
| Node.js | 18+ |

> `performance.memory` is Chrome-only. Memory monitoring gracefully degrades in other browsers. All other features work cross-browser.

---

## Development

```bash
git clone https://github.com/hoainho/crashsense.git
cd crashsense
npm install
npm run build
npm test
```

Monorepo with npm workspaces. Each package builds with [tsup](https://tsup.egoist.dev/) (ESM + CJS + DTS).

```
crashsense/
  packages/
    types/     # Shared TypeScript types
    utils/     # Ring buffer, event bus, fingerprint, PII scrubber
    core/      # Crash detection engine, classifiers, monitors
    react/     # ErrorBoundary, hooks, hydration detector
    vue/       # Plugin, composables, reactivity tracker
    ai/        # LLM client, payload builder, response parser
  examples/
    react-ecommerce/
```

---

## Contributing

Contributions are welcome. Whether it's a bug report, feature request, or pull request — all help is appreciated.

1. Fork the repo
2. Create your branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

See [open issues](https://github.com/hoainho/crashsense/issues) for ideas.

---

## Changelog


### v1.1.1 (2026)

- **Bug Fix**: `captureException` now correctly merges framework context (e.g., `framework: 'react'`) into `rawEvent.framework` instead of `meta.tags`, resolving an issue where crash reports always showed `framework.name: "vanilla"` even when using `@crashsense/react` or `@crashsense/vue`
- **DX Improvement**: Added comprehensive JSDoc comments to all exported types in `@crashsense/types`, providing inline IDE documentation for every interface, field, and configuration option with `@default` tags on config fields
- **Docs**: Added yarn, pnpm, and bun install commands alongside npm in all documentation

### v1.1.0 (2026)

- **OOM Recovery Detection** — detect when the browser OOM-kills a tab and recover crash context on reload
- Checkpoint manager: periodic `sessionStorage` snapshots of system state, breadcrumbs, and pre-crash warnings
- 6-signal OOM analysis: `document.wasDiscarded`, navigation type, memory trend, pre-crash warnings, memory utilization, device characteristics
- Lifecycle flush: emergency data persistence on `visibilitychange`/`pagehide`/`freeze` with `sendBeacon` support
- New config: `enableOOMRecovery`, `checkpointInterval`, `oomRecoveryThreshold`, `flushEndpoint`, `onOOMRecovery`
- New types: `CheckpointData`, `OOMRecoveryReport`, `OOMSignal`
- New events: `oom_recovery`, `checkpoint_written`, `lifecycle_flush`

### v1.0.0 (2026)

- Initial public release
- 7 crash categories with confidence scoring and contributing factors
- React and Vue framework adapters
- AI-powered root cause analysis (OpenAI, Anthropic, Google, custom endpoints)
- Iframe tracking via MutationObserver
- Pre-crash warning system with 3-tier escalation
- Plugin system for extensibility
- PII scrubbing (emails, IPs, tokens, credit cards)
- Zero runtime dependencies in all browser packages

---

## License

[MIT](./LICENSE) — Copyright (c) 2026 hoainho

## Author

**Hoai Nho** — [GitHub](https://github.com/hoainho) · [npm](https://www.npmjs.com/~nhonh) · hoainho.work@gmail.com

---

<p align="center">
  <strong>If CrashSense saves you debugging time, <a href="https://github.com/hoainho/crashsense">⭐ star the repo</a> — it helps others find it.</strong>
</p>
