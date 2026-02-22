# CrashSense

**Crash diagnosis for React, Vue & mobile web -- root cause analysis, not just error capture.**

![npm version](https://img.shields.io/npm/v/@crashsense/core)
![license](https://img.shields.io/badge/license-MIT-blue)
![bundle size](https://img.shields.io/bundlephobia/minzip/@crashsense/core)

## What is CrashSense?

CrashSense is an open-source crash diagnosis SDK that goes beyond error capture. It monitors system state (memory, CPU, network, event loop), classifies crashes into 6 diagnostic categories, and optionally generates AI-powered fix suggestions using your own LLM endpoint. Zero runtime dependencies. TypeScript-first.

## Features

- **6 crash categories**: Runtime errors, memory issues, event loop blocking, React-specific, Vue-specific, network-induced
- **Real-time system monitoring**: Memory trends, long task detection, FPS tracking, network health
- **Breadcrumb trail**: Clicks, navigation, network requests, console output, state changes
- **AI-powered root cause analysis**: Bring your own LLM (OpenAI, Anthropic, or any compatible endpoint)
- **Zero runtime dependencies** in all browser packages
- **Small footprint**: Core is ~7KB gzipped
- **TypeScript-first**: Full type definitions, tree-shakeable ESM + CJS output
- **PII scrubbing**: Emails, IPs, bearer tokens, and credit card numbers stripped automatically
- **Plugin system**: Extend crash detection with custom plugins
- **SSR-safe**: All browser APIs are guarded with environment checks

## Quick Start -- React

```bash
npm install @crashsense/core @crashsense/react
```

```tsx
import { CrashSenseProvider } from '@crashsense/react';

function App() {
  return (
    <CrashSenseProvider
      config={{ appId: 'my-app', debug: true }}
      onCrash={(report) => console.log('Crash detected:', report)}
    >
      <YourApp />
    </CrashSenseProvider>
  );
}
```

The `CrashSenseProvider` wraps your app in an ErrorBoundary that automatically captures React-specific crashes, hydration mismatches, and infinite re-render loops.

### Hooks

```tsx
import { useCrashSense, useRenderTracker } from '@crashsense/react';

function MyComponent() {
  const { captureException, captureMessage, addBreadcrumb } = useCrashSense();

  useRenderTracker('MyComponent');

  const handleClick = () => {
    addBreadcrumb({ type: 'click', message: 'User clicked submit' });
    try {
      riskyOperation();
    } catch (err) {
      captureException(err, { action: 'submit' });
    }
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

## Quick Start -- Vue

```bash
npm install @crashsense/core @crashsense/vue
```

```ts
import { createApp } from 'vue';
import { crashSensePlugin } from '@crashsense/vue';
import App from './App.vue';

const app = createApp(App);
app.use(crashSensePlugin, { appId: 'my-app', debug: true });
app.mount('#app');
```

### Composables

```ts
import { useCrashSense, useReactivityTracker } from '@crashsense/vue';

const { captureException, captureMessage, addBreadcrumb } = useCrashSense();

useReactivityTracker({
  cartItems: () => store.state.cartItems,
  userProfile: () => store.state.userProfile,
});
```

## Quick Start -- Vanilla JS

```bash
npm install @crashsense/core
```

```ts
import { createCrashSense } from '@crashsense/core';

const cs = createCrashSense({
  appId: 'my-app',
  debug: true,
  onCrash: (report) => {
    console.log('Category:', report.event.category);
    console.log('Subcategory:', report.event.subcategory);
    console.log('Confidence:', report.event.confidence);
    console.log('Factors:', report.event.contributingFactors);
  },
});

cs.captureException(new Error('manual capture'), { page: '/checkout' });

cs.addBreadcrumb({ type: 'navigation', message: 'User navigated to /checkout' });

cs.destroy();
```

## AI Integration (Optional)

```bash
npm install @crashsense/ai
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

The AI client sends a structured crash payload to your LLM endpoint and returns parsed, validated analysis with root cause, fix suggestion, and prevention tips.

## Packages

| Package | Description | Gzipped |
|---------|-------------|---------|
| `@crashsense/core` | Core crash detection engine | ~7KB |
| `@crashsense/react` | React ErrorBoundary + hooks | ~1.3KB |
| `@crashsense/vue` | Vue plugin + composables | ~1.2KB |
| `@crashsense/ai` | AI analysis client | ~3.1KB |
| `@crashsense/types` | Shared TypeScript types | types only |
| `@crashsense/utils` | Internal utilities | ~2.5KB |

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appId` | `string` | *required* | Your application identifier |
| `environment` | `string` | `'production'` | Environment name |
| `release` | `string` | `''` | Release/version tag |
| `sampleRate` | `number` | `1.0` | Event sampling rate (0 to 1) |
| `maxEventsPerMinute` | `number` | `30` | Rate limit for crash events |
| `enableMemoryMonitoring` | `boolean` | `true` | Monitor memory usage and trends |
| `enableLongTaskMonitoring` | `boolean` | `true` | Monitor event loop blocking |
| `enableNetworkMonitoring` | `boolean` | `true` | Monitor network failures |
| `piiScrubbing` | `boolean` | `true` | Auto-scrub emails, IPs, tokens, card numbers |
| `debug` | `boolean` | `false` | Log crash reports to console |
| `onCrash` | `(report) => void` | `null` | Callback when a crash is detected |

## Crash Categories

**runtime_error** -- Standard JavaScript errors (TypeError, ReferenceError, RangeError, etc.). Classified by error type with high confidence.

**memory_issue** -- Detected via heap utilization monitoring and memory trend analysis. Subcategories: memory_leak (growing trend), heap_spike, heap_overflow, memory_pressure.

**event_loop_blocking** -- Identified through Long Task API observation. Subcategories: infinite_loop (>5s), critical_blocking (>1s), frequent_blocking (>10 tasks/30s), long_task.

**framework_react** -- React-specific crashes including hydration mismatches, infinite re-render loops, hook ordering violations, and lifecycle errors.

**framework_vue** -- Vue-specific crashes including reactivity loops, lifecycle errors, and component-level failures caught via `app.config.errorHandler`.

**network_induced** -- Network-related failures detected through failed request counting, offline detection, and error message analysis. Subcategories: offline, cors_block, timeout, failed_request.

## Development

```bash
git clone https://github.com/hoainho/crashsense.git
cd crashsense
npm install
npm run build
npm test
```

The project uses npm workspaces with 6 packages. Each package builds independently with tsup (ESM + CJS + DTS).

## License

MIT
