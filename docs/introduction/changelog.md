# Changelog


## v1.1.0 (2026) <Badge type="tip" text="NEW" />

- **OOM Recovery Detection** — detect when the browser OOM-kills a tab and recover crash context on reload <Badge type="tip" text="NEW" />
- Checkpoint manager: periodic `sessionStorage` snapshots of system state, breadcrumbs, and pre-crash warnings <Badge type="tip" text="NEW" />
- 6-signal OOM analysis: `document.wasDiscarded`, navigation type, memory trend, pre-crash warnings, memory utilization, device characteristics <Badge type="tip" text="NEW" />
- Lifecycle flush: emergency data persistence on `visibilitychange`/`pagehide`/`freeze` with `sendBeacon` support <Badge type="tip" text="NEW" />
- New config: `enableOOMRecovery`, `checkpointInterval`, `oomRecoveryThreshold`, `flushEndpoint`, `onOOMRecovery` <Badge type="tip" text="NEW" />
- New types: `CheckpointData`, `OOMRecoveryReport`, `OOMSignal` <Badge type="tip" text="NEW" />
- New events: `oom_recovery`, `checkpoint_written`, `lifecycle_flush` <Badge type="tip" text="NEW" />

## v1.0.7 (2026)

- Published to npm and GitHub Packages
- README included in all npm packages
- Updated repository URLs to `crashsense/crashsense` organization

## v1.0.0 (2026)

- Initial public release
- 7 crash categories with confidence scoring and contributing factors
- React and Vue framework adapters
- AI-powered root cause analysis (OpenAI, Anthropic, Google, custom endpoints)
- Iframe tracking via MutationObserver
- Pre-crash warning system with 3-tier escalation
- Plugin system for extensibility
- PII scrubbing (emails, IPs, tokens, credit cards)
- Zero runtime dependencies in all browser packages
