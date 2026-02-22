# Quick Start

## Core

Install the core package:

```bash
npm install @crashsense/core
```

Initialize CrashSense in your application:

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

## React

Install the React adapter alongside core:

```bash
npm install @crashsense/core @crashsense/react
```

Wrap your application with `CrashSenseProvider`:

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

This automatically captures React-specific crashes: hydration mismatches, infinite re-render loops, hook ordering violations, and lifecycle errors.

### Hooks

Use the `useCrashSense` hook for manual error capture and breadcrumbs, and `useRenderTracker` to detect excessive re-renders:

```tsx
import { useCrashSense, useRenderTracker } from '@crashsense/react';

function Checkout() {
  const { captureException, addBreadcrumb } = useCrashSense();
  useRenderTracker('Checkout');

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

## Vue

Install the Vue adapter alongside core:

```bash
npm install @crashsense/core @crashsense/vue
```

Register the plugin with your Vue app:

```ts
import { createApp } from 'vue';
import { crashSensePlugin } from '@crashsense/vue';

const app = createApp(App);
app.use(crashSensePlugin, { appId: 'my-app', debug: true });
app.mount('#app');
```

This catches Vue-specific crashes: reactivity loops, lifecycle errors, and component-level failures via `app.config.errorHandler`.

### Composables

Use the `useCrashSense` composable for manual capture and `useReactivityTracker` for reactive state monitoring:

```ts
import { useCrashSense, useReactivityTracker } from '@crashsense/vue';

const { captureException, addBreadcrumb } = useCrashSense();

useReactivityTracker({
  cartItems: () => store.state.cartItems,
  userProfile: () => store.state.userProfile,
});
```

## AI Integration

Install the AI package:

```bash
npm install @crashsense/ai
```

Create an AI client and analyze crash events:

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

::: tip
All examples are in TypeScript, but CrashSense works with plain JavaScript too — just omit the type annotations.
:::
