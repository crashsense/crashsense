# React API

The `@crashsense/react` package provides React-specific crash detection with components, hooks, and automatic framework instrumentation.

**Requirements**: React >= 16.8 (hooks support), `@crashsense/core` as peer dependency.

## CrashSenseProvider

A React component that initializes CrashSense and provides context to child components. It also acts as a React Error Boundary, catching rendering errors automatically.

```tsx
import { CrashSenseProvider } from '@crashsense/react';

function App() {
  return (
    <CrashSenseProvider
      config={{ appId: 'my-app', debug: true }}
      onCrash={(report) => console.log('Crash:', report)}
      fallback={<div>Something went wrong.</div>}
    >
      <YourApp />
    </CrashSenseProvider>
  );
}
```

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `config` | `CrashSenseConfig` | Yes | Configuration object (same as `createCrashSense` options) |
| `onCrash` | `(report) => void` | No | Callback when a crash is detected |
| `fallback` | `ReactNode` | No | Fallback UI to render when an error is caught by the Error Boundary |
| `children` | `ReactNode` | Yes | Your application tree |

## useCrashSense

Hook that provides access to CrashSense methods from any child component of `CrashSenseProvider`.

```tsx
import { useCrashSense } from '@crashsense/react';

function MyComponent() {
  const { captureException, addBreadcrumb, core } = useCrashSense();

  const handleClick = async () => {
    addBreadcrumb({ type: 'click', message: 'User clicked action' });
    try {
      await doSomething();
    } catch (err) {
      captureException(err, { action: 'my-action' });
    }
  };

  return <button onClick={handleClick}>Do Something</button>;
}
```

### Return Value

| Property | Type | Description |
|---|---|---|
| `captureException` | `(error, context?) => void` | Manually capture an error with optional context |
| `addBreadcrumb` | `(breadcrumb) => void` | Add a custom breadcrumb to the trail |
| `core` | `CrashSenseCore \| null` | Direct access to the CrashSense core instance |

## useRenderTracker

Hook that monitors render frequency for a component. If the component renders more than 50 times per second, CrashSense flags it as a potential infinite re-render loop.

```tsx
import { useRenderTracker } from '@crashsense/react';

function ProductList() {
  useRenderTracker('ProductList');
  // ... component logic
}
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `componentName` | `string` | Name of the component (used in crash reports) |

## Automatic Detection

The React adapter automatically detects these framework-specific crash patterns without any additional configuration:

### Hydration Mismatches

When React hydrates server-rendered HTML and finds a mismatch between server and client content, CrashSense captures the mismatch details, including which element and attribute differ.

### Infinite Re-Render Loops

Tracks render count per component per second. Components exceeding the threshold are flagged with the component name and props/state diff between renders.

### Hook Ordering Violations

Monitors React's hook ordering warnings and captures the component name and hook call pattern.

### Lifecycle Errors

All errors caught by the Error Boundary include the component tree context — which component crashed, its position in the tree, and the lifecycle stage at the time of the crash.
