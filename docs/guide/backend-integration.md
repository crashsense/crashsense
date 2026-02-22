# Sending Crash Reports to Your Backend

CrashSense runs entirely in the browser. To persist crash data, you need to send reports to your own backend.

## Using the onCrash Callback

The simplest approach is the `onCrash` callback:

```ts
import { createCrashSense } from '@crashsense/core';

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

## What's in the Report

Each report includes the full crash event with:

- **Classification** — category, subcategory, confidence score, severity
- **Error details** — type, message, parsed stack frames
- **System state** — memory usage and trends, CPU/long task metrics, network status
- **Device info** — user agent, viewport, device memory, hardware concurrency
- **Breadcrumbs** — last N user interactions, navigation, network requests, console messages
- **Contributing factors** — weighted factors with human-readable evidence strings

PII (emails, IPs, auth tokens, credit card numbers) is auto-scrubbed **before** the report reaches your callback.

## Using a Plugin

For more complex integrations, use the [plugin system](/guide/plugins):

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

    return event;
  },
};

const cs = createCrashSense({ appId: 'my-app' });
cs.use(backendReporter);
```

## Tips

### Error Handling

Always handle network errors in your crash reporting callback. A crash reporter that itself throws errors defeats the purpose:

```ts
onCrash: async (report) => {
  try {
    await fetch('/api/crashes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
  } catch (err) {
    // Log locally but never throw
    console.warn('Failed to report crash:', err);
  }
},
```

### Batching

For high-traffic applications, consider batching crash reports instead of sending each one individually:

```ts
const crashBuffer: unknown[] = [];

const cs = createCrashSense({
  appId: 'my-app',
  onCrash: (report) => {
    crashBuffer.push(report);

    if (crashBuffer.length >= 10) {
      const batch = crashBuffer.splice(0, 10);
      fetch('/api/crashes/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      }).catch(() => {});
    }
  },
});
```

### Sending on Page Unload

Use `navigator.sendBeacon` to reliably send data when the page is closing:

```ts
window.addEventListener('beforeunload', () => {
  if (crashBuffer.length > 0) {
    navigator.sendBeacon(
      '/api/crashes/batch',
      JSON.stringify(crashBuffer),
    );
  }
});
```
