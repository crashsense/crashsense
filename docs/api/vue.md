# Vue API

The `@crashsense/vue` package provides Vue-specific crash detection with a plugin, composables, and automatic framework instrumentation.

**Requirements**: Vue >= 3.0, `@crashsense/core` as peer dependency.

## crashSensePlugin

A Vue plugin that initializes CrashSense and integrates with Vue's error handling system.

```ts
import { createApp } from 'vue';
import { crashSensePlugin } from '@crashsense/vue';

const app = createApp(App);
app.use(crashSensePlugin, { appId: 'my-app', debug: true });
app.mount('#app');
```

The second argument accepts the same configuration options as `createCrashSense()`. See [Configuration](/api/configuration) for all available options.

The plugin registers `app.config.errorHandler` to capture all component-level errors with component name, lifecycle hook, and props context.

## useCrashSense

Composable that provides access to CrashSense methods from any component in the application.

```ts
import { useCrashSense } from '@crashsense/vue';

const { captureException, addBreadcrumb } = useCrashSense();

async function handleSubmit() {
  addBreadcrumb({ type: 'click', message: 'User submitted form' });
  try {
    await submitForm();
  } catch (err) {
    captureException(err, { action: 'form-submit' });
  }
}
```

### Return Value

| Property | Type | Description |
|---|---|---|
| `captureException` | `(error, context?) => void` | Manually capture an error with optional context |
| `addBreadcrumb` | `(breadcrumb) => void` | Add a custom breadcrumb to the trail |

## useReactivityTracker

Composable that monitors reactive state for anomalies. Pass an object mapping names to getter functions that return reactive values.

```ts
import { useReactivityTracker } from '@crashsense/vue';

useReactivityTracker({
  cartItems: () => store.state.cartItems,
  userProfile: () => store.state.userProfile,
});
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `watchers` | `Record<string, () => unknown>` | Object mapping names to getter functions for reactive values to track |

The tracker monitors how frequently each reactive value changes. Abnormally rapid changes (indicating a potential reactivity loop) are flagged in crash reports.

## Automatic Detection

The Vue adapter automatically detects these framework-specific crash patterns:

### Reactivity Loops

Monitors reactive dependency tracking depth. If a computed property or watcher triggers excessive dependency re-evaluations in a single tick, it flags a potential reactivity loop.

### Watcher Cascades

Tracks watcher trigger chains. If watcher A triggers watcher B which triggers watcher C which triggers watcher A (circular dependency), the cycle is detected and reported.

### Lifecycle Errors

All errors caught via `app.config.errorHandler` include the component name, lifecycle hook (e.g., `mounted`, `updated`), and props context at the time of the error.

### Component-Level Failures

Errors that occur within individual components are captured with the full component context, making it straightforward to identify which component caused the crash and under what conditions.
