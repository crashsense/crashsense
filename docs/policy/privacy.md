# Privacy Policy

## Overview

CrashSense is a client-side SDK that runs entirely in the browser. There are no CrashSense servers. All crash data stays under your control — it goes wherever you configure it to go (your own backend, your own AI endpoint, or nowhere at all).

## What CrashSense Collects

When a crash occurs, CrashSense captures the following data:

- **Error details** — error type, message, and stack trace
- **System state** — memory usage and trends, CPU/long task metrics, network status
- **Device information** — user agent, viewport dimensions, device memory, hardware concurrency, platform
- **Breadcrumbs** — recent user interactions (clicks, navigation), network requests (URL and status only), console messages
- **Framework context** — component tree (names only), current route, lifecycle stage

## What CrashSense Does NOT Collect

- Request or response bodies
- Form input values or user-entered text
- Screenshots or visual recordings
- Session recordings (unless the optional recorder package is explicitly installed)
- Cookies, localStorage, or sessionStorage contents
- Authentication tokens or credentials in their original form

## PII Scrubbing

PII scrubbing is **enabled by default** (`piiScrubbing: true`). Before any crash data reaches your `onCrash` callback or any plugin, CrashSense automatically scrubs:

- **Email addresses** — detected via regex pattern matching
- **IP addresses** — both IPv4 and IPv6
- **Authentication tokens** — Bearer tokens, API keys, JWT tokens
- **Credit card numbers** — common card number patterns

Scrubbed values are replaced with `[REDACTED]`.

To disable PII scrubbing (not recommended):

```ts
const cs = createCrashSense({
  appId: 'my-app',
  piiScrubbing: false, // Not recommended
});
```

## Data Flow

```
Browser → CrashSense SDK (in-browser) → Your onCrash callback → Your backend
                                       → Your AI endpoint (if configured)
```

CrashSense never sends data to any third-party server. The SDK processes everything locally in the browser and passes the result to your configured callbacks and plugins.

## Open Source Transparency

CrashSense is fully open source under the MIT license. You can audit exactly what data is collected and how it is processed:

- [GitHub Repository](https://github.com/crashsense/crashsense)
- [Core Source Code](https://github.com/crashsense/crashsense/tree/main/packages/core)

## Contact

For privacy-related questions: [hoainho.work@gmail.com](mailto:hoainho.work@gmail.com)
