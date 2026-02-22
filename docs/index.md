---
layout: home
hero:
  name: CrashSense
  text: Crash Diagnosis SDK
  tagline: Error monitoring tells you WHAT crashed. CrashSense tells you WHY — and how to fix it.
  actions:
    - theme: brand
      text: What is CrashSense?
      link: /introduction/what-is-crashsense
    - theme: alt
      text: Quick Start
      link: /introduction/quick-start
    - theme: alt
      text: GitHub
      link: https://github.com/crashsense/crashsense
features:
  - title: OOM Recovery Detection
    details: Detect when the OS kills a tab due to memory exhaustion and recover full crash context — checkpoints, breadcrumbs, and pre-crash warnings — on the next page load.
    link: /api/configuration#oom-recovery
    linkText: Learn more
  - title: 7 Crash Categories
    details: Memory issues, event loop blocking, React/Vue framework errors, network failures, iframe overload, and runtime errors — each with confidence scoring.
  - title: AI-Powered Fix Suggestions
    details: Bring your own LLM (OpenAI, Anthropic, Google, or any compatible endpoint) for root cause analysis and fix code generation.
  - title: ~7KB Gzipped Core
    details: Zero runtime dependencies. Tree-shakeable ESM + CJS. SSR-safe. Never crashes the host application.
  - title: Privacy-First
    details: Emails, IPs, auth tokens, and credit card numbers are auto-scrubbed at the SDK level before any data leaves the browser.
  - title: React & Vue Adapters
    details: Hydration mismatch detection, infinite re-render tracking, reactivity loop detection — framework-aware crash diagnosis.
  - title: Pre-Crash Warnings
    details: 3-tier escalating alerts (elevated, critical, imminent) detect memory pressure and system degradation before the tab dies.
---
