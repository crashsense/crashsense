# CrashSense OpenSpec
## Complete Product Specification Document
### Version 1.0 | February 2026

---

# Table of Contents

1. Problem Statement
2. Market Opportunity
3. Competitive Analysis
4. Target Users
5. Technical Architecture
6. Component Breakdown
7. System Design Diagram
8. Data Flow Design
9. Crash Classification Model
10. AI Integration Architecture
11. Mobile Simulator Design
12. Compliance and OS Policy Strategy
13. Security Considerations
14. Scalability Plan
15. Roadmap (MVP to V1 to V2)
16. Growth Strategy
17. Monetization Strategy
18. Risk Analysis
19. QA Testing Strategy
20. Success Metrics and KPIs

---

# 1. Problem Statement

## The Debugging Gap in Modern Web Development

Modern web applications crash in ways that traditional error monitoring tools were never designed to diagnose. The industry has conflated **error capture** with **crash diagnosis** — two fundamentally different problems. Sentry tells you a `TypeError` occurred at line 247. It does not tell you that the error was caused by a race condition between a React Suspense boundary timeout and a stale closure in a useEffect cleanup function, triggered only on iOS 16 Safari when the device has less than 200MB of available memory.

### The Scale of the Problem

- **87% of production web crashes are discovered by end users**, not developers (Rollbar State of Software Quality 2024). By the time a developer sees the error in their dashboard, hundreds or thousands of users have already experienced it.
- **Average time to reproduce a mobile-specific crash: 4.2 hours** (DebugBear survey). Developers waste entire workdays trying to recreate conditions that triggered a crash on a device they do not own.
- **62% of web app crashes involve multiple contributing factors** — a memory leak alone does not crash the app, but a memory leak combined with a large React component tree re-render on an Android device with 2GB RAM does.
- **React and Vue account for 58%+ of the frontend framework market** (State of JS 2024), yet framework-specific crash patterns (hydration mismatches, reactivity traps, hook rule violations) are invisible to generic error monitoring tools.

### Five Critical Gaps in Existing Tools

**Gap 1: Error Capture is not Root Cause Analysis**
Sentry, Bugsnag, and Rollbar capture the exception stack trace. They do not capture the **system state** that caused the exception: memory pressure, event loop saturation, network conditions, component lifecycle stage, or device resource constraints. A `TypeError: Cannot read property 'map' of undefined` could stem from a race condition, a failed API call, a state management bug, or a hydration mismatch — and the fix is entirely different in each case.

**Gap 2: Mobile Web Debugging is Fragmented**
60%+ of web traffic comes from mobile devices, yet mobile debugging requires stitching together 5+ tools: Chrome Remote Debugging, Safari Web Inspector (macOS only), BrowserStack for device testing, Lighthouse for performance, and custom logging for WebView issues. No unified tool covers iOS Safari, Android Chrome, Samsung Internet, and in-app WebViews.

**Gap 3: Framework Crashes Need Framework Knowledge**
React Error Boundaries catch rendering errors but miss: infinite re-render loops, memory leaks from uncleared subscriptions in useEffect, hydration mismatches in SSR/SSG, Suspense timeout cascades, and state management corruption. Vue's `app.config.errorHandler` catches component errors but misses: reactivity system deadlocks, computed property infinite recursion, watcher cascade failures, and plugin conflicts. Generic monitoring tools treat these as opaque JavaScript errors.

**Gap 4: No Automated Fix Suggestions**
When a crash occurs, developers must manually: (1) decode the stack trace, (2) identify the root cause, (3) research the fix, (4) validate the fix does not introduce regressions. LLMs can now automate steps 2-4, but no tool integrates crash detection with AI-powered diagnosis and fix generation.

**Gap 5: Device-Specific Crashes are Unreproducible**
iOS WKWebView silently terminates tabs that exceed ~1.4GB memory. Android Chrome kills background tabs when system memory is low. Low Power Mode throttles JavaScript timers by 10x. These conditions are nearly impossible to reproduce on a developer's MacBook Pro with 32GB RAM. Developers need a simulator that reproduces device-level constraints, not just viewport sizes.

### CrashSense's Thesis

**Error monitoring tells you WHAT happened. CrashSense tells you WHY it happened and HOW TO FIX IT.**

CrashSense bridges the five gaps above with:
1. A **crash detection engine** that captures system state alongside errors (memory, CPU, network, component lifecycle, event loop)
2. **Framework-aware adapters** for React and Vue that understand framework-specific crash patterns
3. An **advanced mobile device simulator** that reproduces OS-level constraints (memory limits, CPU throttling, battery mode effects)
4. **AI-powered root cause analysis** via CLIProxyAPI that combines heuristic scoring with LLM diagnosis
5. A **crash timeline recorder** that provides session replay with correlated system metrics, enabling precise reproduction

---

# 2. Market Opportunity

## Market Sizing

### Total Addressable Market (TAM): $8.2B
The global Application Performance Monitoring (APM) and error tracking market, including frontend monitoring, real-user monitoring (RUM), session replay, and debugging tools.

### Serviceable Addressable Market (SAM): $3.5B
Frontend-specific monitoring and debugging tools market. This includes error tracking (Sentry, Bugsnag), session replay (LogRocket, FullStory), performance monitoring (SpeedCurve, Calibre), and browser-based debugging tools. Growing at 12% CAGR driven by increasing frontend complexity and mobile-first architectures.

### Serviceable Obtainable Market (SOM): $180M (Year 3 target)
Crash-specific diagnosis tools targeting React/Vue developers at companies with 10-500 employees. This segment is underserved — no existing tool provides crash root-cause analysis with AI-powered fix suggestions and mobile device simulation.

## Developer Population

| Segment | Size | Growth Rate |
|---------|------|-------------|
| JavaScript developers globally | 26.4M | 4.2% YoY |
| React developers | 10.5M+ | 6.1% YoY |
| Vue developers | 4.7M+ | 3.8% YoY |
| Mobile web developers (primary focus) | 8.2M+ | 7.3% YoY |
| Professional frontend developers (paid tier target) | 6.8M | 5.5% YoY |

Source: SlashData Developer Economics Q4 2025, GitHub Octoverse 2025, State of JS 2024.

## Framework Market Share (Frontend)

| Framework | Market Share | Monthly npm Downloads |
|-----------|-------------|----------------------|
| React | 40.2% | 120M+/month |
| Vue | 18.4% | 28M+/month |
| Angular | 15.1% | 22M+/month |
| Svelte | 7.2% | 6M+/month |
| Next.js (React meta-framework) | 14.8% | 18M+/month |
| Nuxt (Vue meta-framework) | 5.3% | 4M+/month |

CrashSense initially targets React + Vue (58.6% combined share), with Angular and Svelte adapters in V2.

## Mobile Web Traffic Dynamics

- **60.67%** of global web traffic is mobile (StatCounter, Jan 2026)
- **72%** of mobile web users abandon a site after a crash or significant performance issue (Google Web Vitals study)
- **$2.1 trillion** in mobile commerce revenue is at risk from poor mobile web experience
- **iOS Safari + Android Chrome** account for 91% of mobile browser market share — CrashSense's simulator must cover these two engines comprehensively

## Timing: Why Now

**1. AI Integration is Newly Feasible (2024-2026)**
LLMs (GPT-4o, Claude, Gemini) can now parse stack traces, analyze code context, and generate fix suggestions with 85%+ accuracy for common crash patterns. This capability did not exist at production quality before 2024. CrashSense is built around this AI-first diagnosis paradigm.

**2. Frontend Complexity Has Crossed a Threshold**
Modern React apps routinely ship 2-5MB of JavaScript, use SSR/SSG with hydration, implement code splitting with dynamic imports, manage complex state with multiple stores, and run on devices from flagship phones to $100 Android devices. The crash surface area has exploded.

**3. Web Vitals and Core Performance Metrics Are Business KPIs**
Google's Core Web Vitals directly impact SEO ranking. Crash-related metrics (INP, CLS) are now boardroom conversations. Companies need tools that go beyond lighthouse scores to understand WHY performance degrades and pages crash.

**4. Open Source Developer Tools Are Venture-Fundable**
PostHog raised $75M (open core analytics), Sentry raised $200M+ (open core error tracking), Grafana Labs raised $240M (open core observability). The open core model for developer tools has proven product-market fit, fundraising viability, and path to $100M ARR.

## Revenue Potential

Conservative projection based on comparable tool adoption curves:

| Year | Free Users | Paid Users | ARR |
|------|-----------|-----------|-----|
| Year 1 (MVP + V1) | 12,000 | 200 | $240K |
| Year 2 (V2 + Enterprise) | 85,000 | 2,800 | $4.2M |
| Year 3 (Scale) | 350,000 | 15,000 | $28M |

Assumptions: 2-3% free-to-paid conversion (industry standard for dev tools), $100/mo average paid tier.

---

# 3. Competitive Analysis

## Landscape Overview

The crash debugging space is fragmented across error monitoring, session replay, performance tools, and device testing platforms. No single product covers the full crash diagnosis pipeline.

## Feature Comparison Matrix

| Capability | Sentry | LogRocket | Bugsnag | Datadog RUM | Raygun | PostHog | FullStory | BrowserStack | CrashSense |
|---|---|---|---|---|---|---|---|---|---|
| JS Error Capture | Yes | Yes | Yes | Yes | Yes | Yes | No | No | Yes |
| Unhandled Promise Rejection | Yes | Yes | Yes | Yes | Yes | Partial | No | No | Yes |
| Root Cause Analysis | No (stack trace only) | No | Basic | No | Basic | No | No | No | **Yes (AI + heuristic)** |
| Memory Leak Detection | No | No | No | No | No | No | No | No | **Yes** |
| Event Loop Blocking Detection | No | No | No | Partial (Long Tasks) | No | No | No | No | **Yes** |
| React-Specific Crash Detection | Partial (ErrorBoundary) | Partial | Partial | No | No | No | No | No | **Yes (dedicated adapter)** |
| Vue-Specific Crash Detection | Partial | Partial | Partial | No | No | No | No | No | **Yes (dedicated adapter)** |
| Hydration Mismatch Detection | No | No | No | No | No | No | No | No | **Yes** |
| Session Replay | Yes (v2) | **Yes (core)** | No | Yes | No | Yes | **Yes (core)** | No | **Yes** |
| Memory Timeline | No | No | No | No | No | No | No | No | **Yes** |
| CPU/Event Loop Timeline | No | No | No | Partial | No | No | No | No | **Yes** |
| Mobile Device Simulation | No | No | No | No | No | No | No | **Yes (real devices)** | **Yes (local simulator)** |
| Memory Constraint Simulation | No | No | No | No | No | No | No | No | **Yes** |
| CPU Throttling Simulation | No | No | No | No | No | No | No | Partial | **Yes** |
| Network Condition Simulation | No | No | No | No | No | No | No | Yes | **Yes** |
| AI-Powered Fix Suggestions | No | No | No | No | No | No | No | No | **Yes** |
| Automated Fix Code Generation | No | No | No | No | No | No | No | No | **Yes** |
| Open Source Core | **Yes** | No | No | No | No | **Yes** | No | No | **Yes** |
| Self-Hosted Option | **Yes** | No | No | No | No | **Yes** | No | No | **Yes** |
| SDK Size (gzipped) | ~30KB | ~80KB | ~15KB | ~25KB | ~20KB | ~45KB | ~60KB | N/A | **<15KB core** |
| Pricing (starter) | Free (5K events) | $99/mo | $59/mo | $15/mo (RUM) | $4/mo | Free (1M events) | $199/mo | $29/mo | **Free (unlimited local)** |

## Detailed Competitive Breakdown

### Sentry (Primary Competitor)
- **Strengths**: Largest open-source error tracking platform. Excellent stack trace parsing, breadcrumbs, release tracking. Strong integrations ecosystem. Self-hosted option. ~$200M+ raised.
- **Weaknesses**: No root cause analysis — just presents the error. No memory monitoring. Session replay is basic (added late). No mobile device simulation. No AI fix suggestions. SDK is large (~30KB gzipped). Pricing scales aggressively with event volume.
- **CrashSense differentiation**: CrashSense answers "why" Sentry answers "what." CrashSense provides memory/CPU timelines, framework-specific detection, AI diagnosis, and mobile simulation — none of which Sentry offers.

### LogRocket (Session Replay Leader)
- **Strengths**: Best-in-class session replay. Network request waterfall. Redux/Vuex state diffing. Performance monitoring.
- **Weaknesses**: Extremely heavy SDK (~80KB gzipped). Significant performance overhead (5-10% reported by users). No crash root cause analysis. No mobile simulation. No AI integration. Expensive ($99/mo minimum). Closed source.
- **CrashSense differentiation**: 5x lighter SDK. Crash-first (not replay-first) approach. AI-powered diagnosis. Local-first architecture (no mandatory cloud).

### BrowserStack (Device Testing Leader)
- **Strengths**: Real device cloud. 3000+ real devices. Automated testing. Live debugging.
- **Weaknesses**: Cloud-only (requires internet). Expensive ($29/mo minimum, $199/mo for full access). Not a monitoring tool — testing only. No crash detection or analysis. Latency in remote device access.
- **CrashSense differentiation**: Local simulation (no cloud dependency). Integrated with crash detection. Free tier. Instant startup (no device provisioning wait).

### PostHog (Open Source Analytics)
- **Strengths**: Open source. Product analytics + session replay + feature flags in one platform. Strong community. Self-hosted option.
- **Weaknesses**: Analytics-first, not debugging-first. Error tracking is basic. No crash root cause analysis. No mobile simulation. No AI fix suggestions.
- **CrashSense differentiation**: Complementary tool. CrashSense focuses exclusively on crash diagnosis, which PostHog does not attempt.

## Gap Analysis Summary

**No existing tool provides ALL of:**
1. Framework-aware crash detection (React hydration, Vue reactivity)
2. Root cause analysis with confidence scoring
3. Memory and CPU timeline correlated with crashes
4. Mobile device constraint simulation
5. AI-powered fix suggestion generation
6. Open source core with self-hosted option
7. Sub-15KB SDK size with minimal performance overhead

**This is CrashSense's positioning: the first crash DIAGNOSIS tool, not just crash MONITORING.**

---

# 4. Target Users

## Primary Persona: The Frontend Lead

**Name**: Sarah Chen
**Role**: Senior Frontend Engineer / Tech Lead
**Company**: Series A-B SaaS startup, 15-40 engineers
**Experience**: 5-8 years, primarily React or Vue

**Daily Reality**:
- Manages a React application with 200+ components, SSR via Next.js, deployed to Vercel
- Receives Sentry alerts with cryptic stack traces that take 1-3 hours to diagnose
- Gets bug reports from QA like "the app crashes on Samsung Galaxy A12 but works on iPhone 14" and has no way to reproduce locally
- Spends 30% of her debugging time on mobile-specific issues despite having zero mobile testing devices
- Uses LogRocket session replay but finds it adds noticeable lag and the replay often misses the critical 5 seconds before a crash

**Pain Points**:
1. Stack traces show WHERE the error occurred, not WHY
2. Cannot reproduce device-specific crashes without physical devices
3. Memory leaks are invisible until the app crashes in production
4. Hydration mismatches in Next.js are inconsistent and framework tooling provides no diagnosis
5. No automated way to go from "crash detected" to "here's the fix"

**Willingness to Pay**: $50-150/month for a tool that saves her team 10+ hours/week of crash debugging
**Adoption Path**: `npm install @crashsense/react` in a dev branch, see value in first crash report, roll out to staging, then production

## Secondary Persona: The QA Engineer

**Name**: Marcus Rivera
**Role**: Senior QA Engineer
**Company**: Mid-size fintech, 50-200 engineers
**Experience**: 6 years QA, 2 years frontend testing

**Daily Reality**:
- Tests a Vue 3 financial dashboard across 12 device/browser combinations
- Uses BrowserStack for device testing but cannot simulate memory pressure or CPU throttling on real devices
- Files bug reports that developers dismiss because "it works on my machine"
- Needs evidence: memory usage charts, CPU spikes, exact reproduction steps

**Pain Points**:
1. Cannot prove a crash is caused by device constraints vs. code bugs
2. BrowserStack tests are slow (device provisioning) and expensive
3. Cannot simulate "low battery mode" or "background app switching" scenarios
4. Bug reports lack system-level context that developers need to fix the issue

**Willingness to Pay**: Covered by company budget, $200-500/month for team license
**Adoption Path**: CLI simulator tool for local device testing, integrates crash reports into Jira tickets

## Tertiary Persona: The DevOps/SRE Engineer

**Name**: Alex Petrova
**Role**: Site Reliability Engineer
**Company**: E-commerce platform, 500+ engineers
**Experience**: 8 years backend/infra, 2 years frontend observability

**Daily Reality**:
- Monitors production health across 15 frontend microservices
- Sees error rate spikes in Datadog but cannot determine if they are caused by code regressions, infrastructure issues, or device-specific problems
- Needs crash classification (code vs. infra vs. device vs. network) to route incidents to the right team
- Manages error budgets and needs crash rate as an SLI

**Pain Points**:
1. Cannot distinguish between code crashes and environmental crashes (network, device, browser)
2. Error monitoring tools do not provide crash classification for incident routing
3. Needs aggregate crash analytics, not individual error reports
4. Wants automated triage: this crash is a React hydration issue, route to frontend team

**Willingness to Pay**: $500-2000/month for enterprise dashboard with team routing and SLI integration
**Adoption Path**: Cloud dashboard with SSO, integrates with PagerDuty/OpsGenie for crash-based alerting

## Anti-Personas (NOT Target Users)

- **Backend-only developers**: CrashSense is frontend-focused. Backend crash debugging (Node.js, Python, Go) is a different problem domain served by existing APM tools.
- **Static website owners**: Marketing sites and blogs built with static HTML/CSS do not have the JavaScript complexity that produces crashes CrashSense detects.
- **Hobbyist developers**: Free tier serves them, but they are not the revenue target. Product decisions should not optimize for hobbyist workflows.
- **Native mobile developers**: CrashSense targets web technologies running in browsers and WebViews, not native iOS (Swift/ObjC) or Android (Kotlin/Java) apps. Crashlytics/Firebase serves that market.

---

# 5. Technical Architecture

## Architecture Philosophy

CrashSense follows a **local-first, plugin-based, privacy-respecting** architecture. The core SDK runs entirely in the browser with zero network dependency. Cloud features (dashboard, team collaboration, historical analytics) are opt-in additions.

## High-Level Architecture

```
+------------------------------------------------------------------+
|                     Developer's Application                       |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  |                    @crashsense/core                          | |
|  |                                                               | |
|  |  +------------------+  +------------------+  +--------------+ | |
|  |  | Error Interceptor|  | Memory Monitor   |  | Event Loop   | | |
|  |  | (onerror,        |  | (perf.memory,    |  | Monitor      | | |
|  |  |  unhandledrej.)  |  |  measureMemory)  |  | (LongTask    | | |
|  |  +--------+---------+  +--------+---------+  | Observer)    | | |
|  |           |                      |            +------+-------+ | |
|  |           v                      v                   v         | |
|  |  +------------------------------------------------------+    | |
|  |  |              Event Bus (typed pub/sub)                 |    | |
|  |  +------------------------------------------------------+    | |
|  |           |                      |                   |         | |
|  |           v                      v                   v         | |
|  |  +------------------+  +------------------+  +--------------+ | |
|  |  | Crash Classifier |  | Timeline         |  | Reporter     | | |
|  |  | (heuristic +     |  | Recorder         |  | (console,    | | |
|  |  |  probability)    |  | (ring buffer)    |  |  webhook,    | | |
|  |  +--------+---------+  +--------+---------+  |  AI proxy)   | | |
|  |           |                      |            +--------------+ | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  +---------------------------+  +------------------------------+  |
|  | @crashsense/react         |  | @crashsense/vue              |  |
|  | - ErrorBoundary wrapper   |  | - errorHandler hook          |  |
|  | - Hook lifecycle monitor  |  | - Reactivity tracker         |  |
|  | - Hydration detector      |  | - Lifecycle monitor          |  |
|  | - Re-render counter       |  | - Watcher depth tracker      |  |
|  +---------------------------+  +------------------------------+  |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  |                  @crashsense/recorder                        | |
|  |  - DOM mutation recording (rrweb-style)                      | |
|  |  - Memory snapshots per lifecycle phase                      | |
|  |  - Network waterfall capture                                 | |
|  |  - CPU timeline via PerformanceObserver                      | |
|  +-------------------------------------------------------------+ |
+------------------------------------------------------------------+

                              |
                              | crash event + context payload
                              v

+------------------------------------------------------------------+
|                     @crashsense/ai (optional)                     |
|  +------------------+  +------------------+  +-----------------+  |
|  | Payload Builder  |  | CLIProxyAPI      |  | Response Parser |  |
|  | (structured JSON |  | Client           |  | (AI output +    |  |
|  |  for LLM)       |  | (user's API key) |  |  heuristic      |  |
|  |                  |  |                  |  |  merger)         |  |
|  +------------------+  +------------------+  +-----------------+  |
+------------------------------------------------------------------+

                              |
                              | analysis result
                              v

+------------------------------------------------------------------+
|                     Output Layer                                  |
|  +------------------+  +------------------+  +-----------------+  |
|  | Console Reporter |  | Webhook/CI       |  | Dashboard       |  |
|  | (dev-friendly    |  | Reporter         |  | Reporter        |  |
|  |  terminal output)|  | (JSON payload)   |  | (cloud sync)    |  |
|  +------------------+  +------------------+  +-----------------+  |
+------------------------------------------------------------------+
```

## Three Subsystems

### Subsystem 1: SDK Core (Browser Runtime)

**Purpose**: Runs inside the developer's web application, capturing crash events and system state.

**Design Principles**:
- Zero external dependencies (no lodash, no axios)
- Tree-shakeable: import only what you use
- Lazy initialization: adapters load on demand
- Non-blocking: all monitoring uses passive observers and idle callbacks
- Defensive coding: SDK errors MUST NOT crash the host application

**Plugin Architecture**:
```typescript
interface CrashSensePlugin {
  name: string;
  setup(core: CrashSenseCore): void;
  teardown(): void;
  onCrashEvent?(event: CrashEvent): CrashEvent | null; // enrich or filter
}

// Registration
crashsense.use(reactPlugin());
crashsense.use(memoryPlugin({ threshold: 0.85 }));
crashsense.use(recorderPlugin({ maxEvents: 500 }));
```

**Instrumentation Strategy**:
The SDK instruments the host application using three approaches, ordered by preference:

1. **Standard APIs** (preferred): `window.addEventListener('error')`, `window.addEventListener('unhandledrejection')`, `PerformanceObserver`, `ReportingObserver`, `navigator.storage.estimate()`. These are non-invasive and standards-compliant.

2. **Framework Hooks** (adapter-specific): React ErrorBoundary wrapping, `app.config.errorHandler` for Vue, component lifecycle hooks. These provide framework-level crash context unavailable through standard APIs.

3. **Monkey-patching** (last resort, opt-in): `fetch()` and `XMLHttpRequest` wrapping for network failure detection. `console.error` interception for framework warning detection. `setTimeout`/`setInterval` wrapping for timer leak detection. All monkey-patching is reversible and opt-in.

**Performance Budget**:
| Metric | Budget | Measurement Method |
|--------|--------|--------------------|
| CPU overhead | <2% of main thread time | PerformanceObserver self-measurement |
| Memory footprint | <5MB heap | performance.measureUserAgentSpecificMemory |
| SDK bundle size (core) | <15KB gzipped | Bundlephobia/webpack-bundle-analyzer |
| SDK bundle size (core + react) | <22KB gzipped | Tree-shaken production build |
| Initialization time | <10ms | performance.mark/measure |
| Event processing latency | <5ms per event | High-resolution timestamps |

### Subsystem 2: CLI Toolchain (Developer Machine)

**Purpose**: Provides the mobile device simulator, crash analysis commands, and AI integration from the terminal.

**Technology**: Node.js CLI built with Commander.js or Oclif. Communicates with Chromium via Chrome DevTools Protocol (CDP) for device simulation.

**Key Commands**:
```bash
# Initialize CrashSense in a project
crashsense init

# Run mobile device simulator
crashsense simulate --device "iPhone 14" --memory 3GB --network "3G-slow" --battery low
crashsense simulate --device "Galaxy A12" --memory 2GB --cpu 4x-throttle

# Analyze a crash report
crashsense analyze ./crash-report.json

# Send crash to AI for diagnosis
crashsense diagnose ./crash-report.json --api-key $CRASHSENSE_AI_KEY

# List supported device profiles
crashsense devices list

# Run crash detection in CI/CD
crashsense ci --url https://staging.myapp.com --devices "iPhone 14,Galaxy A12,Pixel 7"
```

### Subsystem 3: Cloud Dashboard (Optional SaaS)

**Purpose**: Team collaboration, historical analytics, alerting, and enterprise features. This is the monetization layer.

**Technology**: Next.js web application. PostgreSQL for structured data. ClickHouse for analytics queries. S3-compatible storage for session replays.

**Key Features** (paid tier):
- Crash trend analytics (crash rate over time, by device, by version)
- Team crash assignment and status tracking
- Alerting rules (crash rate threshold, new crash type, regression detection)
- SSO/SAML authentication for enterprise
- Data retention policies and GDPR compliance tools

---

# 6. Component Breakdown

## Package Architecture

CrashSense is distributed as a monorepo of scoped npm packages. Each package has a single responsibility, can be installed independently, and follows strict size budgets.

```
@crashsense/
  core/          # Error interception, memory monitoring, event loop monitoring
  react/         # React-specific crash detection adapter
  vue/           # Vue-specific crash detection adapter
  recorder/      # Session replay and timeline recording
  simulator/     # CLI-based mobile device simulator
  ai/            # CLIProxyAPI integration and AI analysis
  types/         # Shared TypeScript type definitions
  utils/         # Internal utilities (ring buffer, debounce, fingerprint)
  dashboard/     # Optional SaaS web UI (separate deployment)
```

## @crashsense/core

**Responsibility**: Foundation layer. Intercepts JavaScript errors, monitors memory and CPU, detects event loop blocking, and provides the plugin system and event bus.

**Public API**:
```typescript
import { createCrashSense } from '@crashsense/core';

const cs = createCrashSense({
  appId: 'my-app',
  environment: 'production',
  sampleRate: 1.0,            // 1.0 = capture everything, 0.1 = 10% sampling
  maxEventsPerMinute: 30,     // Rate limiting to prevent event storms
  enableMemoryMonitoring: true,
  enableLongTaskMonitoring: true,
  enableNetworkMonitoring: true,
  piiScrubbing: true,         // Scrub emails, IPs, auth tokens from payloads
  onCrash: (report) => { },   // Callback for custom handling
});

cs.use(plugin);               // Register a plugin
cs.captureException(error);   // Manual error capture
cs.captureMessage('warning'); // Manual message capture
cs.setUser({ id: '123' });    // Set user context (scrubbed if PII enabled)
cs.setContext('order', {});    // Set custom context
cs.destroy();                 // Clean teardown, remove all listeners
```

**Internal Modules**:
- `ErrorInterceptor`: Hooks `window.onerror`, `window.onunhandledrejection`, `console.error`. Deduplicates errors by fingerprint (stack trace hash). Adds breadcrumbs (last 20 user interactions before error).
- `MemoryMonitor`: Uses `performance.measureUserAgentSpecificMemory()` where available (requires cross-origin isolation), falls back to `performance.memory` (Chrome-only, deprecated but widely available), falls back to heuristic estimation (DOM node count * average node size + tracked allocations).
- `EventLoopMonitor`: Uses `PerformanceObserver` with `entryTypes: ['longtask']` to detect main thread blocking. Supplements with `requestAnimationFrame` delta timing to detect frame drops. Detects event loop blocking exceeding configurable thresholds (default: 100ms warning, 1000ms critical).
- `NetworkMonitor`: Wraps `fetch()` and `XMLHttpRequest` to capture request/response metadata, timing, errors, and response size. Does NOT capture request/response bodies (privacy). Detects: failed requests, 5xx responses, timeouts, CORS errors, malformed JSON responses.
- `EventBus`: Typed publish/subscribe system. All internal modules communicate through events, enabling loose coupling and plugin extensibility.
- `CrashClassifier`: Heuristic engine that analyzes crash events and assigns category + confidence score. See Section 9 for the full classification model.
- `RateLimiter`: Token bucket algorithm limiting events to `maxEventsPerMinute`. Prevents monitoring itself from becoming a performance problem during error storms.

**Size Budget**: <15KB gzipped (core only, no adapters)
**Dependencies**: Zero external dependencies

## @crashsense/react

**Responsibility**: React-specific crash detection. Understands React component lifecycle, hooks, hydration, and rendering patterns.

**Public API**:
```typescript
import { CrashSenseProvider, useCrashSense } from '@crashsense/react';

// Wrap your app
function App() {
  return (
    <CrashSenseProvider
      config={{ appId: 'my-app' }}
      fallback={<CrashFallback />}
      onCrash={(report) => console.log(report)}
    >
      <MyApp />
    </CrashSenseProvider>
  );
}

// Use in components for manual capture
function MyComponent() {
  const { captureException, addBreadcrumb } = useCrashSense();
  // ...
}
```

**Detection Capabilities**:
- **Error Boundary Wrapping**: `CrashSenseProvider` is a React Error Boundary that captures rendering errors, enriches them with component tree context (which component crashed, its props shape, parent chain), and reports to core.
- **Hydration Mismatch Detection**: Intercepts React's hydration warning console output (`console.error` with "hydration" keyword), captures server HTML vs client HTML diff, identifies the mismatched element and attribute.
- **Infinite Re-render Detection**: Tracks render count per component per second. If a component renders >50 times/second, flags as potential infinite loop. Captures the component's props/state diff between renders to identify the trigger.
- **Hook Rule Violation Detection**: Monitors `console.error` for React's hook ordering warnings. Captures the component name and hook call pattern.
- **Memory Leak Heuristic**: Tracks component mount/unmount pairs. If a component unmounts but its associated event listeners, subscriptions, or timers persist (detected via WeakRef tracking), flags as potential memory leak.

**Size Budget**: <8KB gzipped (additional, loaded alongside core)
**Dependencies**: React >=16.8 (hooks support) as peer dependency

## @crashsense/vue

**Responsibility**: Vue-specific crash detection. Understands Vue reactivity system, lifecycle hooks, watchers, and the composition API.

**Public API**:
```typescript
import { crashSensePlugin } from '@crashsense/vue';

const app = createApp(App);
app.use(crashSensePlugin, {
  appId: 'my-app',
  trackReactivity: true,
  trackWatchers: true,
});
```

**Detection Capabilities**:
- **Global Error Handler**: Registers `app.config.errorHandler` to capture all component-level errors with component name, lifecycle hook, and props context.
- **Reactivity Trap Detection**: Monitors reactive dependency tracking depth. If a computed property or watcher triggers more than 100 dependency re-evaluations in a single tick, flags as potential reactivity loop.
- **Watcher Cascade Detection**: Tracks watcher trigger chains. If watcher A triggers watcher B triggers watcher C triggers watcher A (circular), detects and reports the cycle.
- **Lifecycle Error Enrichment**: Wraps lifecycle hooks (`onMounted`, `onUpdated`, `onUnmounted`) to add component lifecycle stage to crash reports.
- **Vue 2 Compatibility**: Optional Vue 2 adapter using `Vue.config.errorHandler` and `Vue.mixin()` for lifecycle tracking.

**Size Budget**: <7KB gzipped
**Dependencies**: Vue >=3.0 as peer dependency (Vue 2 adapter: separate import)

## @crashsense/recorder

**Responsibility**: Session replay and system metric timeline recording. Provides crash reproduction context.

**Architecture**: Uses incremental DOM mutation recording (inspired by rrweb) rather than canvas-based snapshots. Mutation recording is 10-50x more storage-efficient and allows precise playback.

**Recording Strategy**:
- Takes a full DOM snapshot on initialization
- Records incremental mutations via `MutationObserver`
- Records user interactions (clicks, scrolls, inputs) via event listeners
- Records network requests via the core NetworkMonitor
- Records memory samples every 5 seconds via MemoryMonitor
- Records long tasks via EventLoopMonitor
- Stores everything in a ring buffer (configurable, default: last 60 seconds before crash)

**Storage**: In-memory ring buffer with IndexedDB persistence for crash events. When a crash occurs, the last N seconds of recording are frozen and attached to the crash report.

**Size Budget**: <20KB gzipped
**Dependencies**: None external

## @crashsense/simulator

**Responsibility**: CLI-based mobile device simulator using Chrome DevTools Protocol (CDP).

**Architecture**: Launches Chromium (bundled with Puppeteer or uses installed Chrome) with CDP connection. Applies device constraints programmatically:
- Viewport and device pixel ratio via `Emulation.setDeviceMetricsOverride`
- CPU throttling via `Emulation.setCPUThrottlingRate`
- Network conditioning via `Network.emulateNetworkConditions`
- Memory pressure simulation via custom instrumentation (Service Worker that allocates/restricts ArrayBuffers)
- Geolocation, timezone, locale via CDP Emulation domain

**Device Profiles**: Ships with 50+ pre-configured device profiles based on real device specifications (sourced from GSMArena and Apple specs).

**Size Budget**: N/A (CLI tool, not browser SDK)
**Dependencies**: Puppeteer or Playwright (peer dependency)

## @crashsense/ai

**Responsibility**: CLIProxyAPI integration. Builds structured crash payloads, sends to user-configured AI endpoint, parses responses.

**Design**: The user provides their own AI API endpoint and credentials. CrashSense does NOT include or require any specific AI provider. The CLIProxyAPI is a pass-through — CrashSense formats the crash data into an optimized prompt, sends it to whatever endpoint the user configures, and parses the structured response.

**Size Budget**: <5KB gzipped (browser), <10KB (CLI)
**Dependencies**: None external (uses native fetch)

---

# 7. System Design Diagrams

## Diagram 1: SDK Internal Architecture

```
+------------------------------------------------------------------+
|                         HOST APPLICATION                          |
+------------------------------------------------------------------+
          |                    |                    |
          v                    v                    v
+------------------+ +------------------+ +------------------+
| Framework Adapter| | Framework Adapter| | Vanilla JS       |
| (@crashsense/    | | (@crashsense/    | | (no adapter,     |
|  react)          | |  vue)            | |  core only)      |
+--------+---------+ +--------+---------+ +--------+---------+
         |                     |                    |
         +---------------------+--------------------+
                               |
                               v
+------------------------------------------------------------------+
|                      @crashsense/core                             |
|                                                                   |
|  +-----------+  +-----------+  +-----------+  +---------------+  |
|  |  Error    |  |  Memory   |  | Event Loop|  |   Network     |  |
|  | Intercept.|  |  Monitor  |  |  Monitor  |  |   Monitor     |  |
|  +-----------+  +-----------+  +-----------+  +---------------+  |
|       |              |              |                |             |
|       v              v              v                v             |
|  +-----------------------------------------------------------+   |
|  |                     EVENT BUS                               |   |
|  |  Events: error, memory_warning, long_task, network_failure  |   |
|  |          crash_detected, anomaly_signal, breadcrumb         |   |
|  +-----------------------------------------------------------+   |
|       |              |              |                |             |
|       v              v              v                v             |
|  +-----------+  +-----------+  +-----------+  +---------------+  |
|  |  Crash    |  | Breadcrumb|  |   Rate    |  |  Fingerprint  |  |
|  | Classifier|  |  Tracker  |  |  Limiter  |  |  Generator    |  |
|  +-----------+  +-----------+  +-----------+  +---------------+  |
|       |                                                           |
|       v                                                           |
|  +-----------------------------------------------------------+   |
|  |                   CRASH REPORT                              |   |
|  |  { category, subcategory, confidence, context, timeline }   |   |
|  +-----------------------------------------------------------+   |
+------------------------------------------------------------------+
                               |
                               v
              +----------------+----------------+
              |                |                |
              v                v                v
      +-----------+    +-----------+    +-----------+
      |  Console  |    |  Webhook  |    |    AI     |
      |  Output   |    |  / CI     |    |  Analysis |
      +-----------+    +-----------+    +-----------+
```

## Diagram 2: Data Flow Pipeline

```
PHASE 1: CAPTURE
================
User Action / System Event
    |
    v
[Error Interceptor] -----> Raw Error Event
    |                       { type, message, stack, timestamp }
    |
[Memory Monitor] --------> Memory Snapshot
    |                       { heapUsed, heapTotal, external, trend }
    |
[Event Loop Monitor] ----> Long Task Event
    |                       { duration, startTime, attribution }
    |
[Network Monitor] -------> Network Event
                            { url, method, status, duration, error }

PHASE 2: ENRICHMENT
===================
Raw Event
    |
    +---> [Device Info Collector]
    |     { userAgent, viewport, deviceMemory, connection, platform }
    |
    +---> [Framework State Collector]
    |     { componentTree, currentRoute, storeSnapshot (redacted) }
    |
    +---> [Performance Context Collector]
    |     { memoryUsage, longTaskHistory, fps, navigationTiming }
    |
    +---> [Breadcrumb Collector]
    |     { last20UserInteractions, last10ConsoleMessages }
    |
    v
Enriched Crash Event
    { error + device + framework + performance + breadcrumbs }

PHASE 3: CLASSIFICATION
========================
Enriched Event
    |
    v
[Heuristic Engine]
    |
    +---> Category Assignment (1 of 10 categories)
    +---> Subcategory Assignment
    +---> Confidence Score (0.0 - 1.0)
    +---> Contributing Factors (memory, cpu, network, etc.)
    |
    v
Classified Crash Report

PHASE 4: ANALYSIS (if AI enabled)
===================================
Classified Report
    |
    v
[Payload Builder] ---> Structured JSON (token-optimized)
    |
    v
[CLIProxyAPI Client] ---> User's AI Endpoint
    |
    v
[Response Parser] ---> Parsed AI Analysis
    |
    v
[Hybrid Merger] ---> Final Report
    |                  { heuristicScore + aiAnalysis = finalDiagnosis }
    |
    v
Developer Output
    { rootCause, explanation, fixCode, prevention, confidence }

PHASE 5: OUTPUT
===============
Final Report
    |
    +---> [Console Reporter] ------> Terminal output (dev mode)
    +---> [Webhook Reporter] ------> HTTP POST to CI/CD, Slack, etc.
    +---> [Dashboard Reporter] ----> Cloud sync for SaaS dashboard
    +---> [File Reporter] ---------> JSON file (for CI artifacts)
    +---> [Custom Reporter] -------> User-defined callback
```

## Diagram 3: AI Integration Flow

```
+-------------------+     +-------------------+     +------------------+
|   Crash Detected  |     |  Payload Builder  |     |   CLIProxyAPI    |
|                   |     |                   |     |   Client         |
|  - error details  +---->+  - token optimize +---->+                  |
|  - system state   |     |  - PII scrub      |     |  - API endpoint  |
|  - framework ctx  |     |  - add few-shot   |     |  - auth header   |
|  - memory/CPU     |     |    examples       |     |  - retry logic   |
|  - breadcrumbs    |     |  - system prompt  |     |  - timeout: 30s  |
+-------------------+     +-------------------+     +--------+---------+
                                                             |
                                                             v
                                                    +------------------+
                                                    | User's AI API    |
                                                    | (OpenAI, Claude, |
                                                    |  Gemini, local   |
                                                    |  LLM, etc.)      |
                                                    +--------+---------+
                                                             |
                                                             v
+-------------------+     +-------------------+     +------------------+
|  Developer Output |     |  Hybrid Merger    |     | Response Parser  |
|                   |     |                   |     |                  |
|  Root Cause:      |<----+ Heuristic: 0.85   |<----+ Extract:         |
|   Memory leak in  |     | AI Score:  0.92   |     |  - rootCause     |
|   useEffect       |     | Final:     0.90   |     |  - explanation   |
|                   |     | (weighted avg)    |     |  - fixCode       |
|  Fix:             |     |                   |     |  - prevention    |
|   Add cleanup fn  |     | Conflict?         |     |  - confidence    |
|   in useEffect    |     |  -> AI wins if    |     |                  |
|                   |     |     confidence>0.8 |     | Validate JSON    |
|  Confidence: 90%  |     |  -> Heuristic wins|     | schema           |
|                   |     |     otherwise      |     |                  |
+-------------------+     +-------------------+     +------------------+

CACHING LAYER:
+-----------------------------------------------------------+
| Cache Key: SHA-256(error.message + error.stack + category) |
| TTL: 24 hours                                             |
| Storage: In-memory LRU (1000 entries) + IndexedDB         |
| Hit Rate Target: 60%+ (many crashes are recurring)        |
+-----------------------------------------------------------+

OFFLINE FALLBACK:
+-----------------------------------------------------------+
| When AI unavailable:                                       |
|  1. Use heuristic engine only (always available)           |
|  2. Return heuristic-only report with lower confidence     |
|  3. Queue crash for AI analysis when connection restored   |
|  4. Flag report as "heuristic-only" in output              |
+-----------------------------------------------------------+
```

---

# 8. Data Flow Design

## Crash Event Schema

Every crash event follows this canonical schema. This is the internal representation used across all CrashSense modules.

```typescript
interface CrashEvent {
  // Identity
  id: string;                          // UUID v4
  fingerprint: string;                 // SHA-256 of (message + stack + category)
  timestamp: number;                   // High-resolution timestamp (performance.now() + timeOrigin)
  sessionId: string;                   // Unique session identifier

  // Classification
  category: CrashCategory;            // 1 of 10 categories (see Section 9)
  subcategory: string;                 // Specific subcategory within category
  severity: 'critical' | 'error' | 'warning' | 'info';
  confidence: number;                  // 0.0 - 1.0 classification confidence

  // Error Details
  error: {
    type: string;                      // Error constructor name (TypeError, etc.)
    message: string;                   // Error message (PII-scrubbed)
    stack: StackFrame[];               // Parsed and source-mapped stack frames
    raw: string;                       // Original stack string (for fallback)
  };

  // System State at Crash Time
  system: {
    memory: {
      usedJSHeapSize: number | null;   // Bytes, from performance.memory
      totalJSHeapSize: number | null;
      heapSizeLimit: number | null;
      trend: 'stable' | 'growing' | 'shrinking' | 'spike';
      utilizationPercent: number | null;
    };
    cpu: {
      longTasksLast30s: number;        // Count of long tasks in last 30 seconds
      avgLongTaskDuration: number;     // Average duration of long tasks (ms)
      maxLongTaskDuration: number;     // Max single long task duration (ms)
      estimatedBlockingTime: number;   // Total Blocking Time estimate (ms)
    };
    eventLoop: {
      isBlocked: boolean;
      blockDuration: number | null;    // How long the event loop was blocked (ms)
      fps: number;                     // Estimated frames per second at crash time
    };
    network: {
      pendingRequests: number;
      failedRequestsLast60s: number;
      avgLatencyLast60s: number;       // ms
      connectionType: string | null;   // navigator.connection.effectiveType
      isOnline: boolean;
    };
  };

  // Device Information
  device: {
    userAgent: string;
    platform: string;
    vendor: string;
    deviceMemory: number | null;       // navigator.deviceMemory (GB)
    hardwareConcurrency: number | null;// navigator.hardwareConcurrency
    viewport: { width: number; height: number };
    devicePixelRatio: number;
    touchSupport: boolean;
    colorScheme: 'light' | 'dark';
    reducedMotion: boolean;
    language: string;
    timezone: string;
  };

  // Framework Context (populated by adapters)
  framework: {
    name: 'react' | 'vue' | 'vanilla' | string;
    version: string;
    adapter: string;                   // @crashsense/react version
    componentTree?: string[];          // Component name chain to crash point
    currentRoute?: string;
    storeState?: Record<string, unknown>; // Redacted store snapshot
    lifecycleStage?: string;           // e.g., 'mounting', 'updating', 'hydrating'
    renderCount?: number;              // Renders since last navigation
  };

  // Breadcrumbs (last N events before crash)
  breadcrumbs: Array<{
    type: 'click' | 'navigation' | 'network' | 'console' | 'state' | 'custom';
    timestamp: number;
    message: string;
    data?: Record<string, unknown>;
  }>;

  // Contributing Factors (from classifier)
  contributingFactors: Array<{
    factor: string;                    // e.g., 'high_memory_utilization'
    weight: number;                    // 0.0 - 1.0 contribution to crash
    evidence: string;                  // Human-readable evidence
  }>;

  // Metadata
  meta: {
    appId: string;
    environment: string;
    release?: string;
    userId?: string;                   // Hashed, never raw
    tags: Record<string, string>;
    sdkVersion: string;
  };
}

type CrashCategory =
  | 'runtime_error'
  | 'memory_issue'
  | 'event_loop_blocking'
  | 'framework_react'
  | 'framework_vue'
  | 'network_induced'
  | 'rendering'
  | 'mobile_device'
  | 'resource_exhaustion'
  | 'browser_compatibility';

interface StackFrame {
  filename: string;
  function: string;
  lineno: number;
  colno: number;
  inApp: boolean;                      // true if from user code, false if library
  context?: string[];                  // Source code lines around the frame
}
```

## Local Storage Strategy

### Ring Buffer Architecture

CrashSense uses a ring buffer pattern for all time-series data (breadcrumbs, memory samples, long task events, network events). This ensures bounded memory usage regardless of session length.

```typescript
class RingBuffer<T> {
  private buffer: T[];
  private head: number = 0;
  private size: number = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    this.size = Math.min(this.size + 1, this.capacity);
  }

  drain(): T[] {
    // Returns items in chronological order
    const result: T[] = [];
    const start = this.size < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.size; i++) {
      result.push(this.buffer[(start + i) % this.capacity]);
    }
    return result;
  }
}
```

**Buffer Configurations**:
| Data Type | Buffer Size | Sample Rate | Memory Cost |
|-----------|-------------|-------------|-------------|
| Breadcrumbs | 50 events | Every interaction | ~50KB |
| Memory samples | 120 samples | Every 5 seconds (10 min window) | ~12KB |
| Long task events | 200 events | Every occurrence | ~40KB |
| Network events | 100 events | Every request | ~80KB |
| DOM mutations (recorder) | 5000 operations | Every mutation | ~500KB |
| **Total in-memory budget** | | | **~700KB** |

### IndexedDB Persistence

When a crash is detected, the ring buffers are frozen and persisted to IndexedDB. This ensures crash data survives page refreshes and can be retrieved by the dashboard or CLI.

```
Database: crashsense_db
  Store: crash_reports     (keyPath: id, max: 50 reports, FIFO eviction)
  Store: session_replays   (keyPath: crashId, max: 10 replays, FIFO eviction)
  Store: ai_cache          (keyPath: fingerprint, max: 1000, TTL: 24h)
```

**Eviction Policy**: FIFO (first-in, first-out). When max capacity is reached, the oldest entry is deleted before inserting the new one. This is implemented via an `IDBCursor` ordered by timestamp.

## Cloud Sync Protocol

For users who enable the optional cloud dashboard:

1. **Batch Upload**: Crash events are batched (max 10 events or 60-second window) and uploaded via HTTPS POST
2. **Compression**: Payloads are gzip-compressed before transmission (typical 70-80% reduction)
3. **Retry with Exponential Backoff**: Failed uploads retry at 1s, 2s, 4s, 8s, 16s intervals with jitter
4. **Offline Queue**: If offline, events queue in IndexedDB and sync when connection restores
5. **Deduplication**: Server-side deduplication using crash fingerprint. Duplicate events increment a counter rather than creating new entries
6. **Transport**: Standard HTTPS POST with Bearer token auth. No WebSocket (not needed for crash events, which are low-frequency)

## PII Scrubbing Pipeline

PII scrubbing runs at the SDK level BEFORE any data leaves the browser:

```
Raw Crash Event
    |
    v
[Email Pattern Scrubber]      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g -> [EMAIL]
    |
    v
[IP Address Scrubber]         /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g -> [IP]
    |
    v
[Auth Token Scrubber]         /Bearer\s+[A-Za-z0-9\-._~+\/]+/g -> Bearer [TOKEN]
    |
    v
[Credit Card Scrubber]        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g -> [CARD]
    |
    v
[Custom Pattern Scrubber]     User-defined regex patterns
    |
    v
[DOM Content Scrubber]        Input values, textarea content -> [INPUT]
    |
    v
Scrubbed Crash Event (safe for transmission)
```

---

# 9. Crash Classification Model

## Overview

The crash classifier is a deterministic heuristic engine (not ML-based in MVP) that analyzes enriched crash events and assigns a category, subcategory, and confidence score. The design is deterministic to ensure reproducible classification and zero dependency on external services.

## Confidence Scoring Methodology

Each category has a set of **signals** with associated **weights**. The classifier evaluates all signals and computes:

```
confidence = sum(signal_weight * signal_match) / sum(signal_weight)
```

Where `signal_match` is 0.0 (no match) to 1.0 (perfect match). Signals with higher diagnostic value have higher weights. The category with the highest confidence score wins. If multiple categories score above 0.7, they are reported as contributing factors.

## Category 1: Runtime Errors

**Detection**: `window.onerror`, `window.onunhandledrejection`

| Subcategory | Signal | Weight | Detection Method |
|-------------|--------|--------|------------------|
| TypeError | error.name === 'TypeError' | 1.0 | Direct match |
| ReferenceError | error.name === 'ReferenceError' | 1.0 | Direct match |
| RangeError | error.name === 'RangeError' | 1.0 | Direct match |
| SyntaxError (eval) | error.name === 'SyntaxError' | 1.0 | Direct match |
| Custom thrown error | error is instance of Error subclass | 0.8 | Prototype chain check |
| Unhandled Promise | event type === 'unhandledrejection' | 1.0 | Event listener |

**Confidence formula**: Base confidence 0.95 for direct error matches (these are unambiguous). Reduced to 0.75 if error occurs during framework lifecycle (may actually be a framework-specific issue).

**False positive mitigation**: Filter out known benign errors: `ResizeObserver loop limit exceeded`, Chrome extension errors (stack frames from chrome-extension://), third-party script errors (message === 'Script error.' with no stack).

## Category 2: Memory Issues

**Detection**: `performance.memory`, `performance.measureUserAgentSpecificMemory()`, heuristic estimation

| Subcategory | Signal | Weight | Detection Method |
|-------------|--------|--------|------------------|
| Heap overflow | usedJSHeapSize / heapSizeLimit > 0.95 | 1.0 | performance.memory |
| Memory leak (growing) | Memory trend 'growing' for >60s | 0.8 | Trend analysis on samples |
| GC pressure | Memory oscillating >20% within 10s | 0.6 | Sample variance analysis |
| ArrayBuffer exhaustion | RangeError with 'ArrayBuffer' in message | 0.9 | Error message pattern |
| DOM node leak | document.querySelectorAll('*').length > 50000 | 0.5 | Periodic DOM node count |

**Confidence formula**:
```
memoryConfidence = (
  heapUtilizationSignal * 0.35 +
  memoryTrendSignal * 0.25 +
  gcPressureSignal * 0.15 +
  domNodeSignal * 0.15 +
  errorMessageSignal * 0.10
)
```

**Challenge**: `performance.measureUserAgentSpecificMemory()` requires cross-origin isolation (COOP + COEP headers). Most production apps do not have this. Fallback chain:
1. `performance.measureUserAgentSpecificMemory()` (accurate, requires COOP/COEP)
2. `performance.memory` (Chrome-only, deprecated, but widely available)
3. Heuristic: `(DOM node count * 2KB) + (event listener count * 0.5KB) + baseline` (rough estimate)

## Category 3: Event Loop Blocking

**Detection**: `PerformanceObserver({ entryTypes: ['longtask'] })`, `requestAnimationFrame` delta timing

| Subcategory | Signal | Weight | Detection Method |
|-------------|--------|--------|------------------|
| Long task (50-200ms) | PerformanceEntry.duration 50-200ms | 0.6 | LongTask observer |
| Long task (200-1000ms) | PerformanceEntry.duration 200-1000ms | 0.8 | LongTask observer |
| Critical blocking (>1s) | PerformanceEntry.duration > 1000ms | 1.0 | LongTask observer |
| Infinite loop | >10 consecutive long tasks within 5s | 0.9 | Pattern detection |
| Synchronous XHR | XHR with async=false detected | 0.7 | XMLHttpRequest wrap |
| Heavy computation | Long task + no network/DOM attribution | 0.6 | Attribution analysis |

**Confidence formula**:
```
blockingConfidence = (
  maxTaskDuration / 5000 * 0.4 +  // Normalized, capped at 5s
  taskFrequency / 20 * 0.3 +      // Normalized, capped at 20 tasks/30s
  totalBlockingTime / 10000 * 0.3   // Normalized TBT over 10s
)
```

**Long Animation Frame API**: Where available (Chrome 123+), use `PerformanceObserver({ entryTypes: ['long-animation-frame'] })` for richer attribution data including script URL, function name, and forced style/layout information.

## Category 4: Framework-Specific (React)

**Detection**: Custom ErrorBoundary, console.error interception, render count tracking

| Subcategory | Signal | Weight | Detection Method |
|-------------|--------|--------|------------------|
| Error Boundary catch | ErrorBoundary componentDidCatch fired | 1.0 | ErrorBoundary wrapper |
| Hydration mismatch | console.error containing 'hydrat' | 0.9 | console.error intercept |
| Infinite re-render | Component renders >50x/second | 0.95 | Render count tracker |
| Hook rule violation | console.error containing 'hook' + 'order' | 0.85 | console.error intercept |
| Suspense timeout | Suspense fallback displayed >10s | 0.7 | Suspense wrapper monitor |
| State update on unmounted | console.warn 'unmounted component' | 0.6 | console.warn intercept |
| Key prop instability | Component remount rate >10x/s with key changes | 0.5 | Render tracking |

**Confidence formula**: React category requires `framework.name === 'react'` as a prerequisite (weight 0.0 if not React). Then:
```
reactConfidence = max(
  errorBoundarySignal * 1.0,
  hydrationSignal * 0.9,
  infiniteRenderSignal * 0.95,
  hookViolationSignal * 0.85
)
```

**Important**: React 18+ removed many console warnings in production builds. Detection relies on development-mode warnings OR behavioral detection (re-render counting, timing analysis) that works in production.

## Category 5: Framework-Specific (Vue)

**Detection**: `app.config.errorHandler`, watcher depth tracking, reactivity monitoring

| Subcategory | Signal | Weight | Detection Method |
|-------------|--------|--------|------------------|
| Component error | errorHandler invoked | 1.0 | Global error handler |
| Reactivity infinite loop | Dependency re-evaluation >100/tick | 0.9 | Reactive depth counter |
| Computed infinite recursion | Computed getter calls itself (stack depth) | 0.95 | Stack depth monitoring |
| Watcher cascade | Circular watcher chain detected | 0.85 | Watcher graph analysis |
| Template compilation error | Error during template compile phase | 0.8 | Error timing analysis |
| Plugin conflict | Error after plugin registration | 0.6 | Plugin lifecycle tracking |

## Category 6: Network-Induced

**Detection**: `fetch()` / `XMLHttpRequest` wrapping, Service Worker interception

| Subcategory | Signal | Weight | Detection Method |
|-------------|--------|--------|------------------|
| Failed fetch | Response status 0 or TypeError in fetch | 1.0 | Fetch wrapper |
| Server error (5xx) | Response status 500-599 | 0.8 | Response status check |
| Malformed JSON | JSON.parse throws on response body | 0.9 | Response parsing wrap |
| CORS blocking | TypeError + 'CORS' in message | 0.85 | Error message analysis |
| Timeout | Request exceeds configured timeout | 0.7 | Timer-based detection |
| WebSocket disconnect | WebSocket.onclose unexpected | 0.75 | WebSocket event monitor |
| Offline crash | navigator.onLine === false at error time | 0.6 | Online status check |

**Correlation**: A network error alone is usually not a crash. Network-induced crash requires: (1) network failure AND (2) subsequent runtime error within 5 seconds, suggesting the app did not handle the network failure gracefully.

## Category 7: Rendering

**Detection**: `PerformanceObserver({ entryTypes: ['layout-shift'] })`, RAF timing, canvas context monitoring

| Subcategory | Signal | Weight | Detection Method |
|-------------|--------|--------|------------------|
| Layout thrashing | >10 forced reflows in 100ms | 0.8 | Style recalc detection via getComputedStyle monitoring |
| Paint storm | >60 paint operations/second | 0.7 | PerformanceObserver paint entries |
| WebGL context lost | webglcontextlost event | 1.0 | Canvas event listener |
| CSS containment overflow | Layout shift CLS >0.5 in 1s | 0.6 | CLS measurement |
| Image decode failure | Image.onerror fired for critical images | 0.5 | Image load monitoring |

## Category 8: Mobile/Device-Specific

**Detection**: Page Visibility API, beforeunload heuristics, resize observer, device capability detection

| Subcategory | Signal | Weight | Detection Method |
|-------------|--------|--------|------------------|
| iOS WKWebView termination | Page becomes visible with cleared state + iOS UA | 0.9 | visibilitychange + state check |
| Android low-memory kill | Similar to iOS but Android UA | 0.85 | visibilitychange + state check |
| Touch handler memory leak | Growing event listener count on touch events | 0.6 | Event listener tracking |
| Viewport resize storm | >20 resize events/second | 0.7 | Resize observer throttle |
| Orientation change crash | Error within 500ms of orientationchange | 0.5 | Event timing correlation |

**iOS WKWebView detection**: When a WKWebView process is terminated by iOS, the web page is reloaded when the user returns. CrashSense detects this by: (1) storing a session heartbeat in sessionStorage, (2) on page load, if heartbeat exists but session state is lost, it indicates a process termination rather than normal navigation.

## Category 9: Resource Exhaustion

**Detection**: QuotaExceededError catch, navigator.storage.estimate(), connection counting

| Subcategory | Signal | Weight | Detection Method |
|-------------|--------|--------|------------------|
| IndexedDB quota exceeded | QuotaExceededError from IDB operation | 1.0 | Error type check |
| localStorage quota | QuotaExceededError from localStorage | 1.0 | Error type check |
| ServiceWorker cache overflow | Cache API quota exceeded | 0.9 | Error from cache operation |
| Too many WebSocket connections | >6 concurrent WS connections | 0.7 | Connection counter |
| Too many fetch connections | >100 pending requests | 0.6 | Pending request counter |

## Category 10: Browser Compatibility

**Detection**: Feature detection + user-agent correlation + error pattern matching

| Subcategory | Signal | Weight | Detection Method |
|-------------|--------|--------|------------------|
| Missing API | TypeError accessing undefined browser API | 0.8 | Error + feature detection |
| Behavior difference | Same code, different error on different UA | 0.6 | Cross-session correlation |
| CSS rendering bug | Layout shift on specific browser only | 0.5 | CLS + UA correlation |
| WebKit-specific issue | Error only on Safari/WebKit UA | 0.7 | UA + error correlation |

**Note**: Browser compatibility detection requires cross-session correlation (comparing crash patterns across different user agents). This is most effective with the cloud dashboard; local-only mode provides limited compat detection.

---

# 10. AI Integration Architecture

## Design Principles

1. **User-owned AI**: CrashSense does NOT include, bundle, or require any specific AI provider. Users bring their own API endpoint and keys via CLIProxyAPI configuration.
2. **Offline-first**: The heuristic engine works without AI. AI enhances diagnosis but is never required.
3. **Token-efficient**: Crash payloads are structured to minimize token consumption while maximizing diagnostic value.
4. **Deterministic prompt engineering**: System prompts are versioned and tested. Few-shot examples are embedded for consistent output format.

## CLIProxyAPI Configuration

```typescript
interface AIConfig {
  endpoint: string;           // e.g., 'https://api.openai.com/v1/chat/completions'
  apiKey: string;             // Stored in OS keychain, never in config files
  model?: string;             // e.g., 'gpt-4o', 'claude-3-sonnet'
  maxTokens?: number;         // Response token limit (default: 2000)
  temperature?: number;       // Default: 0.1 (low creativity, high precision)
  timeout?: number;           // Request timeout in ms (default: 30000)
  retries?: number;           // Max retries (default: 2)
  provider?: 'openai' | 'anthropic' | 'google' | 'custom';
}

// Configuration via CLI
// $ crashsense config set ai.endpoint "https://api.openai.com/v1/chat/completions"
// $ crashsense config set ai.model "gpt-4o"
// API key stored securely:
// $ crashsense auth set-key  (interactive, uses OS keychain)
```

## Crash Payload Schema (LLM-Optimized)

The payload sent to the AI is a distilled version of the full CrashEvent, optimized for LLM comprehension:

```json
{
  "crash_summary": {
    "category": "framework_react",
    "subcategory": "hydration_mismatch",
    "heuristic_confidence": 0.85,
    "severity": "critical"
  },
  "error": {
    "type": "Error",
    "message": "Hydration failed because the initial UI does not match what was rendered on the server",
    "stack_top_5": [
      "at throwOnHydrationMismatch (react-dom.production.js:12345:10)",
      "at updateHostComponent (react-dom.production.js:12500:5)",
      "at beginWork (react-dom.production.js:15000:8)",
      "at performUnitOfWork (react-dom.production.js:16000:3)",
      "at workLoopSync (react-dom.production.js:16100:5)"
    ],
    "user_code_frames": [
      "at ProductList (src/components/ProductList.tsx:45:12)",
      "at ProductPage (src/pages/products/index.tsx:22:8)"
    ]
  },
  "system_state": {
    "memory_utilization": "72%",
    "memory_trend": "stable",
    "long_tasks_last_30s": 2,
    "fps_at_crash": 55,
    "pending_network_requests": 1,
    "failed_requests_last_60s": 0
  },
  "device": {
    "platform": "iOS 17.2 Safari",
    "memory": "4GB",
    "viewport": "390x844",
    "connection": "4g"
  },
  "framework": {
    "name": "react",
    "version": "18.2.0",
    "meta_framework": "next.js 14.1.0",
    "lifecycle_stage": "hydrating",
    "component_path": ["App", "Layout", "ProductPage", "ProductList"],
    "render_count_since_nav": 1
  },
  "breadcrumbs_last_5": [
    { "type": "navigation", "message": "GET /products", "time": "-2.1s" },
    { "type": "network", "message": "GET /api/products -> 200 (450ms)", "time": "-1.5s" },
    { "type": "state", "message": "Redux: products/setItems", "time": "-0.8s" },
    { "type": "console", "message": "Warning: Text content did not match", "time": "-0.1s" },
    { "type": "error", "message": "Hydration failed", "time": "0s" }
  ],
  "contributing_factors": [
    { "factor": "server_client_data_mismatch", "weight": 0.8, "evidence": "API response received after SSR render, data changed between server and client" },
    { "factor": "time_sensitive_content", "weight": 0.4, "evidence": "Component renders timestamps that differ between server and client" }
  ]
}
```

**Token cost estimate**: ~600-800 tokens for the crash payload. With system prompt (~500 tokens) and few-shot examples (~400 tokens), total input is ~1500-1700 tokens. At GPT-4o pricing ($2.50/1M input tokens), this is approximately $0.004 per crash analysis.

## System Prompt (Versioned)

```
SYSTEM PROMPT v1.0:

You are CrashSense AI, a specialized web application crash diagnostician. You analyze structured crash reports from JavaScript web applications (React, Vue, vanilla JS) running in browsers and mobile WebViews.

Your task: Given a crash report, provide:
1. ROOT CAUSE: The specific technical root cause (1-2 sentences)
2. EXPLANATION: Why this happened, including the chain of events (3-5 sentences)
3. FIX: Working code example that fixes the issue
4. PREVENTION: How to prevent this class of bug in the future (2-3 bullet points)
5. CONFIDENCE: Your confidence in this diagnosis (0.0-1.0)

Rules:
- Be specific. "Check your code" is not acceptable. Name the exact issue.
- Fix code must be syntactically correct and production-ready.
- If you are not confident (< 0.6), say so and list the top 2-3 possible causes.
- Reference the specific component, file, or line from the stack trace.
- Consider the system state (memory, CPU, network) as contributing factors.
- Consider the device context (mobile, low memory, slow network).

Output ONLY valid JSON matching this schema:
{
  "rootCause": "string",
  "explanation": "string",
  "fix": {
    "description": "string",
    "code": "string",
    "filename": "string"
  },
  "prevention": ["string"],
  "confidence": number,
  "alternativeCauses": [{"cause": "string", "likelihood": number}]
}
```

## Hybrid Analysis: Heuristic + AI Merger

The final crash report combines the heuristic engine's classification with the AI's analysis:

```typescript
interface HybridAnalysis {
  // From heuristic engine
  heuristic: {
    category: CrashCategory;
    subcategory: string;
    confidence: number;
    contributingFactors: ContributingFactor[];
  };

  // From AI
  ai: {
    rootCause: string;
    explanation: string;
    fix: { description: string; code: string; filename: string };
    prevention: string[];
    confidence: number;
    alternativeCauses: { cause: string; likelihood: number }[];
  } | null;  // null if AI unavailable

  // Merged result
  final: {
    rootCause: string;              // AI rootCause if ai.confidence > 0.8, else heuristic description
    category: CrashCategory;       // Always from heuristic (deterministic)
    confidence: number;            // Weighted: heuristic * 0.4 + ai * 0.6 (if both available)
    explanation: string;           // AI explanation if available, else generated from heuristic
    fix: Fix | null;               // AI fix if confidence > 0.7
    prevention: string[];          // AI prevention if available
    source: 'heuristic' | 'ai' | 'hybrid';
  };
}
```

**Conflict Resolution**:
- If heuristic and AI agree on category: confidence = max(heuristic, ai). Explanation from AI.
- If they disagree and AI confidence > 0.8: AI wins. Log disagreement for review.
- If they disagree and AI confidence <= 0.8: Heuristic wins. Report both to developer.
- If AI is unavailable: Heuristic only. Report with reduced confidence and flag as 'heuristic-only'.

## Caching Strategy

```typescript
// Cache key: deterministic hash of the crash signature
const cacheKey = sha256(
  event.error.type +
  event.error.message +
  event.category +
  event.subcategory +
  event.framework.name +
  event.framework.version
);

// Cache entry
interface AICacheEntry {
  key: string;
  response: AIAnalysis;
  createdAt: number;
  ttl: number;              // 24 hours default
  hitCount: number;
}

// Storage: In-memory LRU (1000 entries) + IndexedDB persistence
// Expected hit rate: 60%+ (most crashes are recurring patterns)
// Cache invalidation: TTL-based + SDK version change
```

## API Key Security

API keys are stored using the operating system's secure credential storage:

| Platform | Storage Backend | Access Method |
|----------|----------------|---------------|
| macOS | Keychain Services | `security` CLI or `keytar` npm package |
| Windows | Windows Credential Manager | `keytar` npm package |
| Linux | GNOME Keyring / KWallet / Secret Service | `keytar` npm package via libsecret |
| CI/CD | Environment variable | `CRASHSENSE_AI_KEY` env var |

**Never stored in**:
- `.crashsenserc` or any config file
- `package.json`
- Git-tracked files
- localStorage / IndexedDB (browser)
- Plain text anywhere

## Rate Limiting and Cost Management

```typescript
interface RateLimitConfig {
  maxAIRequestsPerMinute: number;    // Default: 10
  maxAIRequestsPerHour: number;      // Default: 100
  maxAIRequestsPerDay: number;       // Default: 500
  maxTokensPerRequest: number;       // Default: 2000
  costAlertThreshold: number;        // USD per day, default: $5
}
```

When rate limits are hit, CrashSense falls back to heuristic-only mode and queues excess crashes for analysis when the rate limit window resets.

---

# 11. Mobile Simulator Design

## Philosophy

The CrashSense Mobile Simulator is NOT a visual device mockup. It is a constraint emulation engine that reproduces the resource limitations, browser engine behaviors, and OS-level policies that cause crashes on real mobile devices. Developers use it to trigger and reproduce crashes that only appear on constrained devices.

## Architecture

```
+------------------------------------------------------+
|                  crashsense simulate                  |
|                     (CLI Entry)                       |
+------+-----------------------------------------------+
       |
       v
+------+-----------------------------------------------+
|              Device Profile Resolver                  |
|                                                       |
|  Input: --device "iPhone 14"                         |
|  Output: {                                            |
|    viewport: { width: 390, height: 844, dpr: 3 },   |
|    memory: { total: 6144, available: 3072 },         |
|    cpu: { cores: 6, throttle: 1.0 },                 |
|    network: { type: '4g', rtt: 50, bandwidth: 10 }, |
|    browser: { engine: 'webkit', version: '17.2' },   |
|    os: { name: 'iOS', version: '17.2' },             |
|    quirks: ['timer-throttle-background',              |
|             'wkwebview-memory-limit-1.4gb',           |
|             'no-shared-array-buffer',                 |
|             'ios-100vh-bug']                          |
|  }                                                    |
+------+-----------------------------------------------+
       |
       v
+------+-----------------------------------------------+
|              Chromium Launcher (CDP)                  |
|                                                       |
|  - Launches Chromium via Puppeteer/Playwright         |
|  - Establishes Chrome DevTools Protocol connection    |
|  - Applies device emulation profile                  |
+------+-----------------------------------------------+
       |
       +---> [Viewport Emulator]
       |       Emulation.setDeviceMetricsOverride
       |       { width, height, deviceScaleFactor, mobile: true }
       |
       +---> [CPU Throttle Emulator]
       |       Emulation.setCPUThrottlingRate
       |       { rate: 4 }  // 4x slowdown for low-end devices
       |
       +---> [Network Condition Emulator]
       |       Network.emulateNetworkConditions
       |       { offline, latency, downloadThroughput, uploadThroughput }
       |
       +---> [Memory Constraint Emulator]
       |       Custom: Inject Service Worker that monitors
       |       and enforces memory budgets via periodic checks
       |
       +---> [OS Behavior Emulator]
       |       Custom: Simulates OS-specific policies
       |       (timer throttling, background tab behavior, etc.)
       |
       +---> [Browser Quirk Injector]
               Custom: Polyfills/depolyfills to simulate
               engine-specific behaviors
```

## Emulation Capabilities

### Tier 1: Native CDP Support (High Fidelity)

These capabilities use Chrome DevTools Protocol directly and provide accurate emulation:

| Capability | CDP Method | Fidelity |
|------------|-----------|----------|
| Viewport size + DPR | `Emulation.setDeviceMetricsOverride` | Exact |
| Touch events | `Emulation.setTouchEmulationEnabled` | Exact |
| CPU throttling | `Emulation.setCPUThrottlingRate` | Good (linear slowdown) |
| Network conditions | `Network.emulateNetworkConditions` | Good (bandwidth + latency) |
| Geolocation | `Emulation.setGeolocationOverride` | Exact |
| Timezone | `Emulation.setTimezoneOverride` | Exact |
| Locale | `Emulation.setLocaleOverride` | Exact |
| User agent | `Emulation.setUserAgentOverride` | Exact |
| Media features | `Emulation.setEmulatedMedia` | Exact (prefers-color-scheme, etc.) |
| Sensor emulation | `Emulation.setDevicePostureOverride` | Good |

### Tier 2: Custom Instrumentation (Medium Fidelity)

These require custom JavaScript injection or Service Worker interception:

| Capability | Implementation | Fidelity |
|------------|---------------|----------|
| Memory limits | Service Worker monitors `performance.memory` and triggers page reload when limit exceeded, simulating OS kill | Medium |
| Storage quota limits | Intercept IndexedDB/localStorage with quota enforcement | Medium-High |
| Background tab throttling | Reduce timer resolution to 1000ms after tab loses focus (matches iOS Safari behavior) | Medium |
| Low battery mode | Throttle `requestAnimationFrame` to 30fps, increase timer delay 10x (matches iOS Low Power Mode) | Medium |
| Permission restrictions | Override `navigator.permissions.query` to deny specified permissions | High |
| WebView limitations | Disable specific APIs (e.g., `SharedArrayBuffer`, `WebGL2`) via override | Medium |

### Tier 3: Behavioral Approximation (Low-Medium Fidelity)

These simulate behaviors that cannot be perfectly replicated without the actual OS:

| Capability | Implementation | Fidelity | Honest Limitation |
|------------|---------------|----------|-------------------|
| iOS WKWebView process kill | After memory exceeds threshold, reload page with cleared state | Low-Medium | Real WKWebView termination is non-deterministic and OS-managed |
| Android background tab kill | Detect tab in background + memory above threshold, clear state | Low-Medium | Real Android kills are based on system-wide memory pressure |
| Browser engine differences | CSS/JS polyfill/depolyfill layer | Low | Cannot replicate WebKit/Gecko rendering engines in Chromium |
| Touch gesture handling | CDP touch emulation | Medium | Does not replicate iOS momentum scrolling physics |
| Hardware acceleration differences | Disable GPU compositing via Chrome flags | Low-Medium | Different GPU architectures produce different behaviors |

## Honesty Policy

CrashSense is explicit about simulation fidelity. Each simulation result includes a confidence rating:

```
CrashSense Simulator Report
============================
Device: iPhone 14 (iOS 17.2, Safari WebKit)
Simulation Fidelity: 72%

High-fidelity emulation:
  [OK] Viewport: 390x844 @3x
  [OK] CPU: 4x throttle (simulating A15 under load)
  [OK] Network: 4G (50ms RTT, 10Mbps)
  [OK] Touch events enabled

Medium-fidelity emulation:
  [~] Memory limit: 3GB enforced (real WKWebView limit varies 1.2-1.8GB)
  [~] Timer throttling: Background mode simulated
  [~] Storage quota: 50MB enforced

Cannot simulate (use real device for these):
  [X] WebKit rendering engine (running Chromium/Blink)
  [X] iOS momentum scrolling
  [X] WKWebView JIT compilation differences
  [X] Metal GPU acceleration

Recommendation: For crashes detected in this simulation, confidence is HIGH
for memory/CPU/network related issues, LOW for rendering/engine-specific issues.
Test rendering issues on real device via BrowserStack or physical device.
```

## Device Profile Database

Ships with 50+ device profiles, stored as JSON:

```json
{
  "iphone_14": {
    "name": "iPhone 14",
    "os": "iOS",
    "osVersions": ["16.0", "16.1", "16.2", "17.0", "17.1", "17.2"],
    "screen": { "width": 390, "height": 844, "dpr": 3 },
    "hardware": {
      "chip": "A15 Bionic",
      "cpuCores": 6,
      "ram": 6144,
      "gpu": "Apple GPU (5-core)"
    },
    "browser": {
      "engine": "webkit",
      "jsEngine": "JavaScriptCore",
      "features": {
        "sharedArrayBuffer": false,
        "webGL2": true,
        "webGPU": false,
        "offscreenCanvas": true
      }
    },
    "constraints": {
      "webviewMemoryLimit": 1400,
      "backgroundTimerThrottle": 1000,
      "maxWebSocketConnections": 6,
      "storageQuota": 50
    },
    "quirks": [
      "ios-100vh-includes-toolbar",
      "safari-date-constructor-strict",
      "webkit-flex-gap-partial",
      "ios-hover-state-sticky"
    ],
    "cdpConfig": {
      "cpuThrottleRate": 1,
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
    }
  }
}
```

## CLI Usage Examples

```bash
# Basic device simulation
$ crashsense simulate --device "iPhone 14" --url http://localhost:3000
# Opens Chromium with iPhone 14 constraints, CrashSense SDK injected

# Stress test: low-end device with poor network
$ crashsense simulate \
  --device "Galaxy A12" \
  --memory 2GB \
  --cpu 6x \
  --network "3G-slow" \
  --url http://localhost:3000

# Battery saver mode simulation
$ crashsense simulate \
  --device "iPhone SE" \
  --battery low \
  --url http://localhost:3000

# Run automated crash detection across multiple devices
$ crashsense simulate \
  --devices "iPhone 14,Galaxy A12,Pixel 7,iPhone SE" \
  --url http://localhost:3000 \
  --scenario navigate-checkout \
  --report ./crash-report.json

# List all available device profiles
$ crashsense devices list
# Output: 50+ devices with specs
```

---

# 12. Compliance and OS Policy Strategy

## Platform Compliance Matrix

| Platform | Key Restrictions | CrashSense Strategy |
|----------|-----------------|---------------------|
| macOS | App Sandbox, Notarization required for distribution, Gatekeeper | CLI distributed via npm (no sandbox needed). If Electron app: sign + notarize via Apple Developer Program. Use entitlements for network access. |
| Windows | SmartScreen, UAC for system-level access | CLI distributed via npm (no admin needed). If packaged: code sign with EV certificate to avoid SmartScreen warnings. |
| Linux | AppArmor/SELinux may restrict Chromium | Ship with Puppeteer's bundled Chromium. Document required permissions for AppArmor profiles. |
| Chrome Web Store | Extension must follow Manifest V3, limited background processing | If building extension: use Service Workers (MV3), declare `activeTab` and `scripting` permissions only. No `<all_urls>` in MVP. |
| iOS Safari | No extensions, limited debugging | SDK-only approach. No simulator can run on iOS — simulator is desktop-only by design. |
| Android Chrome | Limited extension support | SDK-only approach. Simulator runs on desktop only. |

## Chromium Launching Compliance

The simulator launches Chromium, which requires specific handling per platform:

```typescript
// Chromium launch configuration for compliance
const launchConfig = {
  headless: false,              // User needs to interact
  args: [
    '--disable-web-security',   // Required for cross-origin memory measurement
    '--disable-features=IsolateOrigins,site-per-process', // For memory simulation
    '--enable-features=SharedArrayBuffer', // For specific tests
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-timer-throttling', // We control throttling ourselves
    '--disable-backgrounding-occluded-windows',
  ],
  // IMPORTANT: Never disable sandbox in production
  // '--no-sandbox' is ONLY for CI environments (Docker)
};
```

## Data Privacy Compliance

### GDPR Compliance

| Requirement | Implementation |
|-------------|---------------|
| Data minimization | SDK captures only crash-relevant data. No tracking, analytics, or user behavior beyond crash context. |
| Right to erasure | Dashboard API: `DELETE /api/v1/users/{userId}/data`. Cascade deletes all crash reports, replays, and AI analyses. |
| Data portability | Dashboard API: `GET /api/v1/users/{userId}/export` returns JSON/CSV of all data. |
| Consent | SDK does NOT activate until `crashsense.init()` is called. Developer controls when/if monitoring starts. Optional consent banner integration guide provided. |
| Data processing agreement | Available for enterprise tier. Standard DPA template on website. |
| Data residency | Cloud dashboard supports EU region deployment (eu.crashsense.io). Self-hosted option eliminates residency concerns entirely. |

### CCPA Compliance

| Requirement | Implementation |
|-------------|---------------|
| Do Not Sell | CrashSense never sells user data. No third-party data sharing. |
| Right to Know | Same as GDPR data portability. |
| Right to Delete | Same as GDPR right to erasure. |
| Opt-out | SDK respects `navigator.globalPrivacyControl`. If GPC is enabled, SDK reduces data collection to error-only (no breadcrumbs, no replay). |

### SOC 2 Type II (Enterprise Tier)

For enterprise customers, the cloud dashboard will pursue SOC 2 Type II certification:
- Encryption at rest (AES-256) and in transit (TLS 1.3)
- Access controls with SSO/SAML
- Audit logging for all data access
- Annual penetration testing
- Incident response procedures documented

## npm Package Compliance

- All packages published under `@crashsense` scope on npm
- MIT license for open-source packages (core, react, vue, types, utils)
- BSL (Business Source License) for dashboard (converts to MIT after 3 years)
- No postinstall scripts (security best practice)
- Supply chain security: `npm audit` clean, Snyk monitoring, Dependabot enabled
- SBOM (Software Bill of Materials) generated for each release

---

# 13. Security Considerations

## Threat Model

CrashSense operates in a uniquely sensitive position: it runs INSIDE the developer's application with access to the DOM, JavaScript runtime, network requests, and user interactions. Security failures could expose end-user PII or compromise application integrity.

### Attack Surface

| Surface | Threat | Mitigation |
|---------|--------|------------|
| SDK in production app | SDK could be a vector for XSS if it injects DOM content | SDK NEVER injects visible DOM elements. All output is to console or background APIs. Recorder uses Shadow DOM isolation. |
| Network interception | Monkey-patched fetch/XHR could leak request data | SDK captures only metadata (URL, status, timing). NEVER captures request/response bodies. Auth headers are scrubbed. |
| Session replay | Replay could capture passwords, personal data, financial info | Input values are masked by default (`<input>` values replaced with `*****`). Developer can specify additional CSS selectors to mask. |
| AI payload | Crash data sent to AI could contain sensitive code or data | PII scrubbing pipeline runs BEFORE AI payload construction. Source code context is limited to 5 lines around the error (configurable). |
| API keys | User's AI API keys could be exposed | Keys stored in OS keychain. Never in config files, env vars (except CI), logs, or crash reports. Never transmitted to CrashSense servers. |
| Cloud dashboard | Crash data stored in cloud could be breached | E2E encryption option for enterprise. Data encrypted at rest (AES-256). TLS 1.3 in transit. SOC 2 compliance for enterprise tier. |
| npm supply chain | Compromised dependency could inject malicious code | Zero runtime dependencies in core. Lockfile pinning. npm provenance enabled. Published from CI with 2FA. |
| SDK CDN distribution | CDN-hosted SDK could be tampered | SRI (Subresource Integrity) hashes published for every version. Developers encouraged to use npm install over CDN. |

### Security Principles

1. **Zero Trust Data Pipeline**: Every piece of data is treated as potentially containing PII until proven otherwise. Scrubbing happens at the point of capture, not at the point of transmission.

2. **Minimal Privilege**: SDK requests no special permissions. No service worker registration unless recorder is enabled. No IndexedDB unless persistence is enabled. No network requests unless cloud sync is enabled.

3. **Defense in Depth**: Multiple layers of data protection:
   - Layer 1: Capture-time PII scrubbing (regex-based)
   - Layer 2: Structural scrubbing (input values, auth headers)
   - Layer 3: Configurable blocklist (user-defined CSS selectors, URL patterns)
   - Layer 4: Transmission-time encryption (TLS 1.3)
   - Layer 5: Storage-time encryption (AES-256 at rest)

4. **Open Source Transparency**: Core SDK is fully open source and auditable. No obfuscated code. No telemetry without explicit opt-in.

## Session Replay Security

Session replay is the highest-risk feature from a security perspective. Implementation:

```typescript
// Default masking configuration
const defaultMaskConfig = {
  // All input values masked by default
  maskAllInputs: true,

  // Specific element masking
  maskSelectors: [
    'input[type="password"]',
    'input[type="email"]',
    'input[name*="card"]',
    'input[name*="ssn"]',
    'input[name*="phone"]',
    '[data-crashsense-mask]',      // Developer opt-in masking
    '.sensitive',                   // Common convention
  ],

  // Block entire elements from recording (not even structure captured)
  blockSelectors: [
    '[data-crashsense-block]',     // Developer opt-in blocking
    'iframe[src*="stripe"]',       // Payment iframes
    'iframe[src*="paypal"]',
  ],

  // Network request URL scrubbing
  scrubURLPatterns: [
    /token=[^&]+/g,               // Query string tokens
    /key=[^&]+/g,                 // API keys in URLs
    /password=[^&]+/g,
  ],
};
```

## Dependency Security

```
@crashsense/core:    0 runtime dependencies
@crashsense/react:   0 runtime dependencies (React is peer dep)
@crashsense/vue:     0 runtime dependencies (Vue is peer dep)
@crashsense/recorder: 0 runtime dependencies
@crashsense/types:   0 runtime dependencies
@crashsense/utils:   0 runtime dependencies
@crashsense/ai:      0 runtime dependencies (uses native fetch)
@crashsense/simulator: 1 runtime dependency (puppeteer OR playwright as peer dep)
```

Zero runtime dependencies is a security feature, not just a bundle size optimization. Each dependency is an attack surface. CrashSense implements everything internally using only Web APIs and Node.js built-ins.

---

# 14. Scalability Plan

## SDK Scalability (Client-Side)

The SDK runs in the user's browser, so scalability means performance at scale:

### High-Traffic Application Support

| Scenario | Challenge | Solution |
|----------|-----------|----------|
| 1M+ page views/day | Event volume could overwhelm local storage | Configurable sample rate (default 1.0, high-traffic: 0.1). Rate limiter: max 30 events/minute. |
| Error storms (500+ errors/minute) | SDK could itself cause performance issues | Token bucket rate limiter. After bucket exhausted, SDK enters "silent mode" (captures count only, no enrichment). Auto-recovers after 60s. |
| Large React trees (5000+ components) | Component tree serialization is expensive | Lazy serialization: only serialize tree on crash, not on every event. Depth limit: 20 levels. Sibling limit: 50 per level. |
| Long sessions (8+ hours) | Ring buffer memory grows, IndexedDB operations slow | Fixed ring buffer sizes (see Section 8). IndexedDB writes are batched and throttled to max 1 write/5 seconds. |
| Multiple tabs open | Each tab runs independent SDK instance | SharedWorker coordination (where available) to deduplicate crash reports and share rate limits across tabs. Fallback: BroadcastChannel API. |

### Adaptive Monitoring

The SDK automatically adjusts monitoring intensity based on detected conditions:

```typescript
enum MonitoringLevel {
  FULL = 'full',           // All monitors active, full enrichment
  STANDARD = 'standard',   // All monitors, reduced enrichment (no source context)
  LIGHT = 'light',         // Error + memory only, minimal enrichment
  SILENT = 'silent',       // Count errors only, no enrichment or storage
}

// Automatic adjustment triggers
const adaptiveRules = [
  { condition: 'production environment', level: MonitoringLevel.STANDARD },
  { condition: 'CPU utilization > 80%', level: MonitoringLevel.LIGHT },
  { condition: 'error rate > 100/min', level: MonitoringLevel.SILENT },
  { condition: 'deviceMemory < 2GB', level: MonitoringLevel.LIGHT },
  { condition: 'connection effectiveType === "2g"', level: MonitoringLevel.LIGHT },
];
```

## Cloud Dashboard Scalability

### Data Ingestion Pipeline

```
SDK Event -----> [Load Balancer (nginx/ALB)]
                        |
                        v
                 [Ingestion API (Node.js)]
                   - Validate schema
                   - Deduplicate by fingerprint
                   - Enqueue to message queue
                        |
                        v
                 [Message Queue (Redis Streams / SQS)]
                        |
                   +----+----+
                   |         |
                   v         v
            [Worker 1]  [Worker N]
              - Persist to database
              - Update aggregates
              - Trigger alerts
                   |
                   v
            [PostgreSQL] + [ClickHouse]
            (raw events)   (analytics)
```

### Database Strategy

| Data Type | Storage | Retention | Query Pattern |
|-----------|---------|-----------|---------------|
| Crash events | PostgreSQL (partitioned by month) | 90 days (free), 1 year (pro), 2 years (enterprise) | Single event lookup, recent events list |
| Analytics aggregates | ClickHouse | 2 years all tiers | Time-series queries, trend analysis, device breakdown |
| Session replays | S3-compatible (MinIO for self-hosted) | 30 days (free), 90 days (pro), 1 year (enterprise) | Single replay retrieval |
| User/org data | PostgreSQL | Indefinite | Auth, billing, preferences |
| AI analysis cache | Redis | 24 hours | High-speed lookup by fingerprint |

### Horizontal Scaling Points

1. **Ingestion API**: Stateless Node.js processes behind a load balancer. Scale horizontally by adding instances.
2. **Workers**: Consume from message queue. Scale by adding consumer instances.
3. **ClickHouse**: Distributed mode with sharding for analytics at scale.
4. **PostgreSQL**: Read replicas for dashboard queries. Connection pooling via PgBouncer.
5. **S3**: Effectively infinite storage for session replays.

### Capacity Planning Estimates

| Tier | Crash Events/Day | Storage/Month | Estimated Infra Cost/Month |
|------|------------------|---------------|---------------------------|
| Free (100 users) | 50,000 | 5 GB | $50 (shared infra) |
| Pro (1,000 users) | 500,000 | 50 GB | $500 |
| Enterprise (10,000 users) | 5,000,000 | 500 GB | $5,000 |
| Scale (100,000 users) | 50,000,000 | 5 TB | $50,000 |

---

# 15. Roadmap (MVP -> V1 -> V2)

## MVP (Month 1-3): Prove the Core Thesis

**Goal**: Demonstrate that automated crash ROOT CAUSE analysis is possible and valuable. Ship the minimum product that a developer can install and immediately get crash diagnosis superior to Sentry.

### MVP Deliverables

| Component | Scope | NOT in MVP |
|-----------|-------|------------|
| @crashsense/core | Error interceptor, basic memory monitor (performance.memory), long task observer, network monitor (fetch wrap) | Advanced memory API, adaptive monitoring, SharedWorker |
| @crashsense/react | ErrorBoundary wrapper, hydration mismatch detection, infinite re-render detection | Hook rule detection, Suspense tracking, memo analysis |
| @crashsense/vue | Global error handler, basic reactivity tracking | Watcher cascade detection, Vue 2 adapter |
| Crash Classifier | 6 categories (runtime, memory, event loop, react, vue, network). Heuristic scoring. | Mobile-specific, rendering, resource exhaustion, compat categories |
| @crashsense/ai | CLIProxyAPI integration, OpenAI-compatible endpoint support, basic payload builder | Caching, rate limiting, multiple provider adapters |
| Console Reporter | Rich terminal output with root cause, explanation, fix code | Webhook, file, dashboard reporters |
| Documentation | README, Quick Start guide, API reference | Full docs site, tutorials, video guides |

### MVP Success Criteria
- Install to first crash report in under 5 minutes
- Crash classification accuracy > 80% on test suite of 100 known crash scenarios
- SDK size < 15KB gzipped (core + react)
- Performance overhead < 3% CPU on benchmarked React app
- 10 beta testers providing feedback

### MVP Timeline
- Week 1-2: Core SDK architecture, event bus, plugin system
- Week 3-4: Error interceptor, memory monitor, long task observer
- Week 5-6: React adapter, crash classifier (6 categories)
- Week 7-8: AI integration, CLIProxyAPI client, prompt engineering
- Week 9-10: Console reporter, documentation, polish
- Week 11-12: Beta testing, iterate on crash classification accuracy

## V1 (Month 4-8): Complete the Platform

**Goal**: Ship the full crash detection engine, mobile simulator, session replay, and cloud dashboard. Achieve 99% crash detection target.

### V1 Deliverables

| Component | Additions over MVP |
|-----------|-------------------|
| @crashsense/core | measureUserAgentSpecificMemory support, adaptive monitoring, all 10 crash categories, SharedWorker coordination |
| @crashsense/react | Full detection suite (Suspense, hooks, memo, key stability) |
| @crashsense/vue | Full detection suite (watcher cascades, Vue 2 adapter, Pinia/Vuex integration) |
| @crashsense/recorder | DOM mutation recording, memory timeline, CPU timeline, network waterfall. Ring buffer storage. 60-second pre-crash window. |
| @crashsense/simulator (NEW) | CLI tool with 30+ device profiles. CDP-based throttling. Memory constraint simulation. Network conditioning. |
| @crashsense/ai | Response caching, rate limiting, multiple provider support (OpenAI, Anthropic, Google, custom), offline fallback heuristic engine |
| Cloud Dashboard (NEW) | Crash list, crash detail view, session replay, trend analytics, team management, alerting |
| CI/CD Integration (NEW) | GitHub Actions, GitLab CI, Jenkins plugins for automated crash testing |
| Webhook Reporter (NEW) | Slack, Discord, PagerDuty, OpsGenie, custom webhook |

### V1 Success Criteria
- Crash classification accuracy > 95% on expanded test suite (500 scenarios)
- Mobile simulator covers top 30 devices
- Session replay provides useful crash reproduction context in > 80% of cases
- Cloud dashboard functional with < 2s page load
- 500 GitHub stars
- 1,000 npm downloads/week
- 50 paying teams on Pro tier

### V1 Timeline
- Month 4: Session recorder, expand crash classifier to 10 categories
- Month 5: Mobile simulator MVP (10 device profiles, CPU + network + memory)
- Month 6: Cloud dashboard MVP (crash list, detail, replay)
- Month 7: AI enhancements (caching, multi-provider), webhook integrations
- Month 8: CI/CD integration, expand simulator to 30 devices, polish + launch

## V2 (Month 9-14): Scale and Differentiate

**Goal**: Become the default crash debugging tool for React/Vue developers. Enterprise features. International growth.

### V2 Deliverables

| Component | Additions over V1 |
|-----------|-------------------|
| @crashsense/angular (NEW) | Angular adapter (error handler, zone.js integration, change detection tracking) |
| @crashsense/svelte (NEW) | Svelte adapter (reactive statement tracking, action failures) |
| Crash Prediction (NEW) | ML-based anomaly detection: identify pre-crash signals and warn before crash occurs |
| Automated Fix PRs (NEW) | For common crash patterns, generate fix code and open a GitHub PR automatically |
| Device Lab (NEW) | Cloud-based real device testing (partnerships with device farms) |
| Enterprise Features | SSO/SAML, audit logs, data residency, SLA, dedicated support, on-premise deployment |
| VS Code Extension (NEW) | Inline crash annotations in editor. Click to see crash context for any function. |
| Performance Budgets (NEW) | Define memory/CPU budgets per route. Alert when budget is exceeded. |

### V2 Success Criteria
- Crash classification accuracy > 99% (the core product target)
- 100 GitHub stars/week sustained
- 1,000 npm downloads/week sustained
- 500 paying teams
- 10 enterprise customers ($2K+/month)
- SOC 2 Type II certification
- Featured in major JS conferences (React Conf, VueConf, JSConf)

---

# 16. Growth Strategy

## Target: 100 GitHub Stars/Week + 1,000 npm Downloads/Week

### Phase 1: Foundation (Month 1-3, MVP)

**Goal**: Build credibility and seed the community. Target: 200 stars, 500 downloads/week by end of month 3.

| Channel | Tactic | Expected Impact |
|---------|--------|-----------------|
| GitHub README | Best-in-class README with animated GIF demo, one-command install, comparison table, badges | 50% of stars come from README quality |
| Hacker News | Show HN post on MVP launch. Title: "CrashSense: open-source crash diagnosis for React/Vue (root cause, not just stack trace)" | 50-200 stars in first 48 hours if front page |
| Reddit | r/reactjs, r/vuejs, r/javascript, r/webdev. Focus on solving a real pain point, not self-promotion. | 20-50 stars per well-received post |
| Dev.to | Technical article: "Why Sentry Tells You What Crashed but Not Why" with CrashSense as the solution | 30-80 stars, establishes thought leadership |
| Twitter/X | Developer community engagement. Share crash debugging tips. Thread: "10 React crashes Sentry can't diagnose" | 10-30 stars/week from organic engagement |
| Product Hunt | Launch on PH for developer tools category | 100-300 stars in launch week |

### Phase 2: Content Engine (Month 4-8, V1)

**Goal**: Establish CrashSense as the authority on web crash debugging. Target: 100 stars/week sustained.

| Channel | Tactic | Frequency |
|---------|--------|-----------|
| Technical blog | Deep-dive articles on crash patterns: "The Complete Guide to React Memory Leaks", "How iOS Safari Kills Your Web App" | 2 articles/month |
| YouTube | Short (5-10 min) crash debugging tutorials using CrashSense | 2 videos/month |
| Conference talks | Submit to React Conf, VueConf, JSConf, Web Directions | 2-3 conferences/year |
| Podcast appearances | Guest on JS Party, Syntax, PodRocket, React Round Up | 1-2 per quarter |
| Interactive playground | Web-based demo where users can trigger and diagnose crashes | Always available |
| Awesome lists | Submit to awesome-react, awesome-vue, awesome-developer-tools | One-time, maintain |

### Phase 3: Ecosystem Integration (Month 9-14, V2)

**Goal**: Make CrashSense the default recommendation in framework communities.

| Tactic | Description |
|--------|-------------|
| Framework partnerships | Contribute to React/Vue docs. Propose CrashSense as recommended debugging tool. |
| Starter templates | Add CrashSense to popular templates (create-react-app, create-vue, create-next-app via community forks) |
| VS Code marketplace | Extension with 50K+ installs drives awareness back to npm package |
| GitHub Sponsors | Sponsor prominent React/Vue open-source maintainers. Build goodwill and get mentions. |
| Enterprise case studies | Publish 3-5 case studies showing production crash reduction metrics |
| Referral program | "Powered by CrashSense" badge in crash reports. Each click leads to landing page. |

### npm Download Growth Model

```
Month 1:   100/week  (beta testers, direct outreach)
Month 2:   250/week  (HN launch, Reddit posts)
Month 3:   500/week  (Product Hunt, Dev.to articles)
Month 4:   800/week  (content engine starts)
Month 5:  1,000/week (TARGET HIT - sustained content + word of mouth)
Month 6:  1,500/week (conference talks, podcast appearances)
Month 8:  3,000/week (V1 launch, simulator feature attracts new audience)
Month 12: 8,000/week (ecosystem integration, VS Code extension)
Month 14: 15,000/week (enterprise adoption, framework partnerships)
```

### GitHub Star Growth Model

```
Month 1:   150 total (initial launch)
Month 2:   400 total (HN + Reddit)
Month 3:   800 total (Product Hunt, sustained posting)
Month 4: 1,200 total (content engine)
Month 5: 1,600 total (100/week sustained)
Month 8: 4,000 total
Month 12: 8,000 total
Month 14: 12,000 total
```

### Key Growth Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| GitHub stars/week | 100 (by month 5) | GitHub API |
| npm downloads/week | 1,000 (by month 5) | npm stats |
| Monthly active SDK installations | 10,000 (by month 8) | Opt-in telemetry |
| Cloud dashboard MAU | 1,000 (by month 8) | Analytics |
| Content reach (blog + social) | 50,000 impressions/month | Social analytics |
| Community Discord members | 500 (by month 6) | Discord count |

---

# 17. Monetization Strategy

## Model: Open Core + SaaS

CrashSense uses the proven open core model (Sentry, PostHog, GitLab): a fully functional open-source SDK with a proprietary cloud dashboard for team/enterprise features.

## Tier Structure

### Free Tier (Open Source)
**Target**: Individual developers, small teams, open-source projects
**Distribution**: npm install, forever free, no account required

| Feature | Included |
|---------|----------|
| @crashsense/core | Full crash detection engine |
| @crashsense/react | Full React adapter |
| @crashsense/vue | Full Vue adapter |
| @crashsense/ai | Full AI integration (user provides API key) |
| Console reporter | Rich terminal crash reports |
| File reporter | JSON crash reports for CI |
| Local crash storage | IndexedDB, up to 50 reports |
| CLI simulator | All device profiles, all emulation features |
| Self-hosted dashboard | Deploy your own (Docker image provided) |

**What is NOT in free tier**:
- Cloud-hosted dashboard
- Team collaboration features
- Historical crash analytics (beyond local IndexedDB)
- Alerting integrations (Slack, PagerDuty)
- SSO/SAML

### Pro Tier - $49/month per team (up to 10 seats)
**Target**: Startup and mid-size engineering teams

| Feature | Included |
|---------|----------|
| Everything in Free | + |
| Cloud dashboard | Hosted at app.crashsense.io |
| Crash events | 100,000/month |
| Session replays | 10,000/month (30-day retention) |
| Team members | Up to 10 |
| Crash trend analytics | 90-day history |
| Alerting | Slack, Discord, email, webhook |
| Priority support | 24-hour response time |

### Enterprise Tier - Custom pricing (starting $499/month)
**Target**: Large engineering organizations

| Feature | Included |
|---------|----------|
| Everything in Pro | + |
| Crash events | Unlimited |
| Session replays | Unlimited (1-year retention) |
| Team members | Unlimited |
| SSO/SAML | Okta, Azure AD, Google Workspace |
| Audit logs | Full access trail |
| Data residency | EU, US, APAC region selection |
| SLA | 99.9% uptime guarantee |
| Dedicated support | Slack channel, 4-hour response |
| On-premise deployment | Kubernetes helm chart provided |
| Custom integrations | PagerDuty, OpsGenie, Jira, Linear |
| SOC 2 Type II report | Available |

## Revenue Projections

| Period | Free Users | Pro Teams | Enterprise | MRR | ARR |
|--------|-----------|-----------|-----------|-----|-----|
| Month 6 | 5,000 | 50 | 0 | $2,450 | $29K |
| Month 12 | 30,000 | 300 | 5 | $17,200 | $206K |
| Month 18 | 80,000 | 1,200 | 20 | $68,800 | $826K |
| Month 24 | 200,000 | 3,500 | 60 | $201,500 | $2.4M |

**Assumptions**:
- Free-to-Pro conversion: 2% (industry standard for dev tools)
- Pro-to-Enterprise upsell: 3% of Pro teams
- Average Enterprise contract: $800/month
- Churn: 5% monthly (Pro), 2% monthly (Enterprise)

## Why This Model Works

1. **Free tier is genuinely useful**: Developers get full crash diagnosis locally. This builds trust and word-of-mouth. No feature gating that feels artificial.

2. **Pro upgrade is natural**: When a team grows beyond 1-2 developers, they need shared crash visibility, historical trends, and alerting. The upgrade sells itself.

3. **Enterprise is high-margin**: SSO, audit logs, SLA, and on-premise deployment are low-marginal-cost features with high willingness to pay.

4. **Self-hosted option prevents lock-in fear**: Developers trust open-core tools more because they can always self-host. Paradoxically, this increases paid conversion because it removes the objection.

---

# 18. Risk Analysis

## Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **99% crash detection is unachievable** | Medium | Critical | Define "99%" precisely: 99% of CLASSIFIABLE crashes (those with detectable signals). Some crashes (browser engine bugs, GPU driver issues) are fundamentally undetectable from JavaScript. Be transparent about the boundary. Target 95% in V1, iterate to 99% in V2 with ML-based anomaly detection. |
| **SDK performance overhead exceeds budget** | Medium | High | Continuous benchmarking in CI. Performance regression tests block merges. Adaptive monitoring automatically reduces overhead under pressure. Profile on real-world apps (not just synthetic benchmarks). |
| **AI diagnosis accuracy is inconsistent** | High | Medium | AI is always supplemental to heuristic engine. Low-confidence AI responses are discarded. Few-shot prompt examples are continuously refined based on human-validated crash reports. AI confidence must exceed 0.7 to be included in report. |
| **Mobile simulator fidelity is questioned** | Medium | Medium | Explicit honesty about simulation tiers (see Section 11). Never claim to replace real device testing. Position as "first-pass filter" that catches 70-80% of device-specific issues, with clear guidance on when real devices are needed. |
| **performance.memory deprecated, no replacement** | Low | High | measureUserAgentSpecificMemory is the replacement but requires cross-origin isolation. Maintain fallback chain: measureUserAgentSpecificMemory > performance.memory > heuristic estimation. Monitor Chrome deprecation timeline. Contribute to Web Performance WG discussions on memory API standardization. |
| **Session replay causes performance issues** | Medium | Medium | Recorder is opt-in, not default. MutationObserver-based recording is batched (100ms debounce). DOM snapshot uses requestIdleCallback. Recording can be paused during user interactions. Automatic disable if frame rate drops below 30fps. |
| **Cross-origin isolation requirement limits adoption** | High | Medium | Core crash detection works WITHOUT cross-origin isolation. Only the precise memory API requires it. Provide documentation on enabling COOP/COEP headers. Most Next.js/Nuxt deployments can add these headers easily. |

## Market Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Sentry adds AI crash diagnosis** | High | Critical | Speed to market. CrashSense must be the FIRST tool with AI crash diagnosis. Once established, switching costs protect market position. Differentiate on mobile simulation (Sentry will not build this). Keep SDK dramatically smaller (15KB vs 30KB). |
| **LogRocket adds crash classification** | Medium | Medium | LogRocket's 80KB SDK and performance overhead are structural disadvantages. CrashSense's lightweight, local-first approach is fundamentally different. |
| **LLM costs increase significantly** | Low | Medium | CrashSense does not pay for AI — users bring their own keys. Cost risk is on the user. Heuristic engine works offline. AI is an enhancer, not a dependency. |
| **Framework ecosystem fragments** | Low | Low | Plugin architecture allows adding new framework adapters cheaply. Svelte, Angular, SolidJS adapters are V2 features but require ~2 weeks of development each, not fundamental architecture changes. |
| **Developer tool fatigue** | Medium | Medium | CrashSense is not "yet another monitoring tool." It solves a specific, unaddressed pain point (crash diagnosis, not monitoring). Clear positioning and messaging differentiate from the crowded monitoring space. |

## Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Cloud dashboard has downtime** | Medium | Medium | SDK works entirely offline. Dashboard downtime affects team features only, not crash detection. Target 99.9% uptime. Use managed services (AWS RDS, S3) to reduce operational burden. |
| **Security breach of cloud dashboard** | Low | Critical | E2E encryption for enterprise. Minimal data storage (crash metadata, not full application state). PII scrubbing at SDK level. SOC 2 compliance. Bug bounty program. |
| **Key contributor leaves** | Medium | High | Comprehensive documentation. Architecture designed for modularity (individual packages can be maintained independently). Open source community can fork and continue. |
| **npm account compromise** | Low | Critical | 2FA on npm account. Publish from CI only (no manual publishes). npm provenance enabled. SRI hashes for CDN distribution. |

## Risk Priority Matrix

```
                        IMPACT
                 Low    Medium    High    Critical
            +--------+---------+--------+-----------+
    High    |        | Dev     | AI     | Sentry    |
            |        | fatigue | accur. | adds AI   |
            +--------+---------+--------+-----------+
PROBABILITY |        | Replay  | Perf   | 99%       |
    Medium  |        | perf    | ovrhd  | accuracy  |
            |        | Sim     |        |           |
            |        | fidelity|        |           |
            +--------+---------+--------+-----------+
    Low     | Frmwrk | LLM     | memory | Security  |
            | frag.  | costs   | API    | breach    |
            |        |         | depr.  | npm       |
            +--------+---------+--------+-----------+
```

**Top 3 risks requiring active monitoring**:
1. Sentry adding AI crash diagnosis (competitive moat erosion)
2. 99% crash detection accuracy achievability (product promise)
3. AI diagnosis consistency (user trust)

---

# 19. QA Testing Strategy

## Testing Pyramid

```
                    /\
                   /  \
                  / E2E \        10% - Real browser crash scenarios
                 /--------\
                / Integ.   \     20% - Cross-module crash detection flows
               /------------\
              /  Unit Tests   \  70% - Individual classifier, monitor, adapter tests
             /------------------\
```

## Test Categories

### Unit Tests (70% of test effort)

| Module | Test Focus | Test Count Target |
|--------|-----------|-------------------|
| Crash Classifier | Each category/subcategory correctly identified from crafted events | 200+ |
| Memory Monitor | Memory trend calculation, threshold detection, fallback chain | 50+ |
| Event Loop Monitor | Long task detection, blocking duration calculation, FPS estimation | 40+ |
| Network Monitor | Fetch/XHR wrapping, error detection, timeout handling | 60+ |
| React Adapter | ErrorBoundary behavior, hydration detection, re-render counting | 80+ |
| Vue Adapter | Error handler integration, reactivity tracking, watcher depth | 60+ |
| PII Scrubber | Email, IP, token, card number scrubbing across all crash event fields | 40+ |
| Ring Buffer | Push, drain, overflow, edge cases (empty, single item, full) | 20+ |
| Fingerprint Generator | Same crash produces same fingerprint, different crashes produce different | 30+ |
| AI Payload Builder | Token-efficient serialization, field selection, size limits | 30+ |
| AI Response Parser | Valid JSON parsing, malformed response handling, confidence extraction | 25+ |

**Framework**: Vitest (fast, ESM-native, compatible with TypeScript)
**Coverage Target**: 90% line coverage, 85% branch coverage

### Integration Tests (20% of test effort)

| Flow | Test Description |
|------|------------------|
| Error -> Classification -> Report | Trigger a real TypeError, verify it flows through enrichment, classification, and produces correct console output |
| React Error -> React Adapter -> Core -> AI | Trigger a React rendering error, verify the React adapter enriches it, core classifies it, and AI payload is correctly formed |
| Memory Pressure -> Memory Monitor -> Classification | Simulate growing memory (allocate arrays in a loop), verify memory monitor detects trend, classifier identifies as memory_issue |
| Network Failure -> Error -> Correlation | Trigger a fetch failure followed by a TypeError 2 seconds later, verify they are correlated as network_induced crash |
| Session Recorder -> Crash -> Freeze -> Report | Start recording, trigger actions, crash, verify recording is frozen and attached to crash report with correct timeline |
| Simulator -> Device Profile -> CDP | Launch simulator with iPhone 14 profile, verify correct CDP commands sent (viewport, CPU throttle, user agent) |
| AI Request -> Cache -> AI Response | Send same crash to AI twice, verify second request hits cache instead of making API call |

**Framework**: Vitest + Playwright (for browser-based integration tests)

### End-to-End Crash Scenario Tests (10% of test effort)

These tests trigger REAL crashes in a real browser and verify CrashSense detects and correctly diagnoses them.

```typescript
// Example: E2E test for React hydration mismatch
test('detects React hydration mismatch in SSR app', async () => {
  // 1. Start a Next.js test app with known hydration bug
  const app = await startTestApp('fixtures/hydration-mismatch');

  // 2. Initialize CrashSense SDK in the app
  await page.evaluate(() => {
    window.__crashsense_reports = [];
    window.crashsense.onCrash((report) => {
      window.__crashsense_reports.push(report);
    });
  });

  // 3. Navigate to the page with hydration mismatch
  await page.goto(app.url + '/products');

  // 4. Wait for crash detection
  await page.waitForFunction(
    () => window.__crashsense_reports.length > 0,
    { timeout: 10000 }
  );

  // 5. Verify classification
  const report = await page.evaluate(
    () => window.__crashsense_reports[0]
  );

  expect(report.category).toBe('framework_react');
  expect(report.subcategory).toBe('hydration_mismatch');
  expect(report.confidence).toBeGreaterThan(0.8);
  expect(report.framework.lifecycleStage).toBe('hydrating');
});
```

### Crash Scenario Test Suite

The QA team maintains a curated suite of 500+ crash scenarios:

| Category | Scenario Count | Example Scenarios |
|----------|---------------|-------------------|
| Runtime Errors | 50 | TypeError on undefined property, RangeError maximum call stack, unhandled Promise rejection |
| Memory Issues | 40 | Closure leak in event listener, growing array in setInterval, DOM node leak from detached elements |
| Event Loop Blocking | 30 | Synchronous 2-second computation, 10,000 DOM queries in loop, JSON.parse on 50MB string |
| React-Specific | 80 | Hydration mismatch (date-based), infinite useEffect loop, ErrorBoundary catch, concurrent Suspense timeout |
| Vue-Specific | 60 | Computed circular dependency, watcher cascade (3-deep), reactivity on Map/Set (Vue 2), plugin conflict |
| Network-Induced | 40 | 500 error from API, malformed JSON body, CORS block on critical resource, WebSocket disconnect during data stream |
| Rendering | 30 | Layout thrashing (read-write-read-write pattern), WebGL context lost, CSS paint storm from animation |
| Mobile/Device | 50 | iOS WKWebView memory limit, Android background tab kill, viewport resize storm, low battery timer throttle |
| Resource Exhaustion | 30 | IndexedDB quota exceeded, localStorage full, 200 pending fetch requests |
| Browser Compatibility | 40 | Missing API (Safari lacks some Web APIs), behavior difference (Safari date parsing), WebKit-specific flexbox bug |
| **Cross-Category (multi-factor)** | 50 | Memory leak + large re-render on low-memory device, network failure + missing error handling + offline mode |

## Performance Regression Testing

Every PR runs performance benchmarks:

```yaml
# .github/workflows/perf.yml
name: Performance Regression
on: [pull_request]
jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run bench
      # Outputs:
      # - SDK init time: <10ms (PASS/FAIL)
      # - Event processing: <5ms/event (PASS/FAIL)
      # - Memory footprint: <5MB (PASS/FAIL)
      # - Bundle size (core): <15KB gzip (PASS/FAIL)
      # - Bundle size (core+react): <22KB gzip (PASS/FAIL)
      - run: npm run bench:compare -- --base=main
      # Fails PR if any metric regresses >10% from main branch
```

## Crash Detection Accuracy Measurement

Accuracy is measured against the curated scenario suite:

```
Accuracy = (Correctly Classified Crashes) / (Total Crashes in Suite)

"Correctly Classified" means:
  1. Correct category (1 of 10)
  2. Correct subcategory (within category)
  3. Confidence > 0.6

Targets:
  MVP: > 80% accuracy on 100-scenario suite
  V1:  > 95% accuracy on 500-scenario suite
  V2:  > 99% accuracy on 500-scenario suite (with ML enhancement)
```

**Accuracy tracking dashboard**: Internal dashboard showing accuracy per category over time. Regressions trigger immediate investigation.

## Stress Testing

| Test | Parameters | Success Criteria |
|------|-----------|------------------|
| Error storm | 1000 errors/second for 60 seconds | SDK stays under 5MB RAM, host app remains responsive (FPS > 30) |
| Long session | 8-hour continuous monitoring | No memory growth in SDK, ring buffers stable, IndexedDB operations under 50ms |
| Large DOM | 50,000 DOM nodes, mutations every 100ms | Recorder stays under 1MB, CPU overhead under 3% |
| Multi-tab | 10 tabs with SDK running simultaneously | SharedWorker coordinates, total memory under 50MB |
| Slow network | 100ms latency, 256Kbps bandwidth | Cloud sync retries gracefully, no data loss, no SDK blockage |
| Low-end device simulation | 2GB RAM, 4x CPU throttle | SDK adapts to LIGHT monitoring, overhead under 2% |

---

# 20. Success Metrics and KPIs

## North Star Metric

**Crash Diagnosis Rate**: The percentage of production crashes where CrashSense provides an actionable root cause (confidence > 0.7) that the developer confirms as correct.

Target: 85% by V1, 95% by V2.

This metric captures the entire value chain: detection + classification + AI analysis + developer validation. It directly measures whether the product fulfills its core promise.

## Product KPIs

### Adoption Metrics

| Metric | MVP Target (M3) | V1 Target (M8) | V2 Target (M14) | Measurement |
|--------|-----------------|-----------------|------------------|-------------|
| npm downloads/week | 500 | 1,000 | 5,000 | npm stats API |
| GitHub stars (total) | 800 | 4,000 | 12,000 | GitHub API |
| GitHub stars/week | 50 | 100 | 100+ (sustained) | GitHub API |
| Monthly Active SDK Installations | 500 | 10,000 | 50,000 | Opt-in anonymous telemetry |
| Cloud dashboard MAU | N/A | 1,000 | 5,000 | Analytics |
| Community Discord members | 50 | 500 | 2,000 | Discord API |
| Contributors (unique) | 5 | 20 | 50 | GitHub API |
| Framework adapter usage split | React: 70%, Vue: 30% | React: 65%, Vue: 30%, Other: 5% | React: 55%, Vue: 25%, Angular: 10%, Svelte: 5%, Other: 5% | Telemetry |

### Quality Metrics

| Metric | MVP Target | V1 Target | V2 Target | Measurement |
|--------|-----------|-----------|-----------|-------------|
| Crash classification accuracy | >80% | >95% | >99% | Automated test suite (500 scenarios) |
| False positive rate | <10% | <5% | <2% | User feedback + automated testing |
| AI diagnosis accuracy | >70% | >85% | >90% | Human-validated sample (monthly) |
| Mean time from crash to diagnosis | <5 seconds (local) | <10 seconds (with AI) | <8 seconds (with cached AI) | SDK instrumentation |
| SDK performance overhead (CPU) | <3% | <2% | <1.5% | Automated benchmarks |
| SDK bundle size (core+react, gzip) | <20KB | <22KB | <25KB (with more features) | CI bundle analysis |
| Session replay accuracy | N/A | >90% playback fidelity | >95% | Visual regression testing |
| Simulator fidelity score | N/A | 70% average | 80% average | Device-specific test suite |

### Business Metrics

| Metric | V1 Target (M8) | V2 Target (M14) | Measurement |
|--------|-----------------|------------------|-------------|
| Paying teams (Pro) | 50 | 500 | Billing system |
| Enterprise customers | 0 | 10 | CRM |
| MRR | $2,450 | $40,000 | Billing system |
| ARR | $29K | $480K | Billing system |
| Free-to-paid conversion | 2% | 3% | Funnel analytics |
| Monthly churn (Pro) | <8% | <5% | Billing system |
| Monthly churn (Enterprise) | N/A | <2% | Billing system |
| Net Revenue Retention | N/A | >110% | Billing system |
| Customer Acquisition Cost (CAC) | <$100 | <$200 | Marketing spend / new customers |
| Lifetime Value (LTV) | $588 (12mo * $49) | $980 (20mo * $49) | Average tenure * ARPU |
| LTV/CAC ratio | >5x | >4x | LTV / CAC |

### Engagement Metrics

| Metric | Target | What it Indicates |
|--------|--------|-------------------|
| SDK init to first crash report | <5 minutes | Onboarding friction |
| Weekly active developers (WAD) | >60% of installed base | Product stickiness |
| Crash reports viewed/week/team | >10 | Dashboard engagement |
| AI diagnosis requests/team/week | >5 | AI feature adoption |
| Simulator sessions/week/developer | >2 | Simulator value |
| Session replay views/crash | >0.5 | Recorder value |
| Fix code applied rate | >20% (AI fixes that developers copy) | AI fix quality |

### Developer Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| npm install to first crash report | <5 minutes | Onboarding test |
| Documentation completeness | >90% of API surface documented | Doc coverage tool |
| Time to find answer in docs | <2 minutes | User testing |
| CLI command success rate | >95% first try | CLI error tracking |
| Breaking changes per major release | 0 in minor, <5 in major | Changelog analysis |
| Issue response time (GitHub) | <24 hours | GitHub metrics |
| Issue resolution time | <7 days (P1), <30 days (P2) | GitHub metrics |

## OKRs by Quarter

### Q1 (Month 1-3): MVP Launch

**Objective**: Prove that AI-powered crash diagnosis works and developers want it.

| Key Result | Target |
|------------|--------|
| Ship MVP to npm | Published @crashsense/core + @crashsense/react + @crashsense/ai |
| Crash classification accuracy | >80% on 100-scenario test suite |
| Beta testers | 10 developers actively using and providing feedback |
| GitHub stars | 800 |
| npm downloads | 500/week |
| SDK performance | <3% CPU overhead, <15KB gzipped |

### Q2 (Month 4-6): V1 Foundation

**Objective**: Build the complete platform and prove product-market fit.

| Key Result | Target |
|------------|--------|
| Ship V1 core features | Recorder, simulator (10 devices), expanded classifier (10 categories) |
| Crash classification accuracy | >90% on 300-scenario test suite |
| npm downloads | 1,000/week |
| GitHub stars | 2,500 total |
| First 10 Pro tier customers | $490 MRR |

### Q3 (Month 7-9): V1 Complete + Scale

**Objective**: Complete V1 feature set and begin enterprise traction.

| Key Result | Target |
|------------|--------|
| Cloud dashboard launch | Crash list, detail, replay, analytics, alerting |
| Simulator expanded | 30+ device profiles |
| V1 launch on Product Hunt | Top 5 in developer tools category |
| npm downloads | 3,000/week |
| GitHub stars | 100/week sustained |
| Pro customers | 200 teams |
| MRR | $10,000 |

### Q4 (Month 10-12): Enterprise + V2 Start

**Objective**: Enterprise readiness and V2 feature development.

| Key Result | Target |
|------------|--------|
| SSO/SAML for enterprise | Okta + Azure AD integration |
| Angular adapter shipped | @crashsense/angular published |
| First 5 enterprise customers | $499+/month contracts |
| Crash classification accuracy | >97% on 500-scenario test suite |
| npm downloads | 8,000/week |
| ARR | $200K |

---

# Appendix A: Technology Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| SDK Language | TypeScript | Type safety, developer experience, ecosystem |
| SDK Build | tsup (esbuild) | Fast builds, ESM + CJS output, tree-shaking |
| SDK Testing | Vitest | Fast, ESM-native, TypeScript-first |
| E2E Testing | Playwright | Cross-browser, reliable, excellent API |
| CLI Framework | Commander.js | Lightweight, widely adopted |
| Browser Automation | Puppeteer/Playwright | CDP access for simulator |
| Dashboard Frontend | Next.js + Tailwind | Fast development, SSR, excellent DX |
| Dashboard Backend | Node.js + tRPC | Type-safe API, minimal boilerplate |
| Primary Database | PostgreSQL | Reliable, JSON support, partitioning |
| Analytics Database | ClickHouse | Column-oriented, fast time-series queries |
| Object Storage | S3-compatible (MinIO for self-host) | Session replay storage |
| Cache | Redis | AI response cache, rate limiting |
| Message Queue | Redis Streams (MVP) -> SQS (scale) | Simple start, scale when needed |
| Monorepo | Turborepo | Fast builds, caching, task orchestration |
| CI/CD | GitHub Actions | Free for open source, wide adoption |
| Package Registry | npm | Standard for JavaScript ecosystem |
| Documentation | Starlight (Astro) | Fast, accessible docs site |

# Appendix B: Glossary

| Term | Definition |
|------|-----------|
| CLIProxyAPI | A pass-through API configuration where the user provides their own AI endpoint and credentials. CrashSense formats crash data into prompts and sends them to whatever AI service the user has configured. |
| Crash Fingerprint | A SHA-256 hash of the error type, message, and primary stack frame, used to deduplicate recurring crashes. |
| Heuristic Engine | The deterministic rule-based crash classifier that operates without AI, using signal weights and confidence scoring. |
| Ring Buffer | A fixed-size circular buffer that overwrites oldest data when capacity is reached, ensuring bounded memory usage. |
| CDP | Chrome DevTools Protocol. The low-level protocol used to communicate with Chromium for device simulation. |
| PII | Personally Identifiable Information. Data that could identify an individual (email, IP address, name, etc.). |
| Cross-Origin Isolation | A browser security mode requiring COOP and COEP headers, necessary for `performance.measureUserAgentSpecificMemory()` and `SharedArrayBuffer`. |
| Adaptive Monitoring | The SDK's ability to automatically reduce monitoring intensity based on detected system constraints (high CPU, low memory, error storms). |
| Crash Category | One of 10 predefined root-cause classifications: runtime_error, memory_issue, event_loop_blocking, framework_react, framework_vue, network_induced, rendering, mobile_device, resource_exhaustion, browser_compatibility. |

---

*CrashSense OpenSpec v1.0 — February 2026*
*This document is a living specification. Updates will be tracked via git history.*
