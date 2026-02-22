# Plugins

CrashSense provides a plugin system that lets you intercept, enrich, filter, or drop crash events before they reach your `onCrash` callback.

## Plugin Interface

Every plugin implements the `CrashSensePlugin` interface:

```ts
import type { CrashSensePlugin, CrashEvent, CrashSenseCore } from '@crashsense/core';

const myPlugin: CrashSensePlugin = {
  name: 'my-plugin',

  setup(core: CrashSenseCore) {
    // Called when the plugin is registered via cs.use()
    // Access core instance for configuration, user context, etc.
  },

  teardown() {
    // Called when cs.destroy() is invoked
    // Clean up any resources (timers, listeners, connections)
  },

  onCrashEvent(event: CrashEvent): CrashEvent | null {
    // Called on every crash event
    // Return the event (optionally modified) to pass it through
    // Return null to drop the event entirely
    return event;
  },
};
```

## Registering Plugins

Register plugins using the `use` method on your CrashSense instance:

```ts
import { createCrashSense } from '@crashsense/core';

const cs = createCrashSense({ appId: 'my-app' });
cs.use(myPlugin);
```

Plugins are called in the order they are registered. Each plugin receives the output of the previous plugin, forming a processing pipeline.

## Plugin Lifecycle

| Phase | Method | When |
|---|---|---|
| Registration | `setup(core)` | Immediately when `cs.use(plugin)` is called |
| Processing | `onCrashEvent(event)` | On every crash event, in registration order |
| Teardown | `teardown()` | When `cs.destroy()` is called |

## Example: Backend Reporter

A plugin that sends crash reports to your backend API:

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

    return event; // pass through to next plugin / onCrash callback
  },
};

const cs = createCrashSense({ appId: 'my-app' });
cs.use(backendReporter);
```

## Example: Severity Filter

A plugin that drops low-severity events:

```ts
import type { CrashSensePlugin, CrashEvent } from '@crashsense/core';

const severityFilter: CrashSensePlugin = {
  name: 'severity-filter',

  setup() {},
  teardown() {},

  onCrashEvent(event: CrashEvent) {
    // Only pass through error and critical severity events
    if (event.severity === 'info' || event.severity === 'warning') {
      return null; // drop the event
    }
    return event;
  },
};
```

## Example: Custom Enrichment

A plugin that adds custom metadata to every crash event:

```ts
import type { CrashSensePlugin, CrashEvent } from '@crashsense/core';

const enricher: CrashSensePlugin = {
  name: 'custom-enricher',

  setup() {},
  teardown() {},

  onCrashEvent(event: CrashEvent) {
    // Add deployment information
    event.meta.tags['deployment'] = 'canary-v2';
    event.meta.tags['region'] = 'us-east-1';
    return event;
  },
};
```

## Combining Plugins

Plugins compose naturally. Register them in the order you want them to execute:

```ts
const cs = createCrashSense({ appId: 'my-app' });

// 1. Enrich events first
cs.use(enricher);

// 2. Filter out low-severity
cs.use(severityFilter);

// 3. Send remaining events to backend
cs.use(backendReporter);
```

::: tip
If a plugin returns `null`, the event is dropped and subsequent plugins in the chain will not receive it.
:::
