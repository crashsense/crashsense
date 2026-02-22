# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in CrashSense, please report it responsibly.

**Email**: [hoainho.work@gmail.com](mailto:hoainho.work@gmail.com)

**Subject line**: `Security: CrashSense — [brief description]`

### Response Timeline

| Phase | Timeline |
|---|---|
| Acknowledgment | Within 48 hours |
| Assessment | Within 7 days |
| Fix (if confirmed) | Depends on severity |
| Disclosure | Coordinated with reporter |

Please do not open public GitHub issues for security vulnerabilities.

## SDK Security Design

### Zero External Dependencies

All browser packages (`@crashsense/core`, `@crashsense/react`, `@crashsense/vue`, `@crashsense/ai`) have **zero runtime dependencies**. This eliminates supply chain risk from transitive dependencies — there are none.

### PII Scrubbing

Enabled by default. Emails, IP addresses, auth tokens, and credit card numbers are automatically scrubbed from crash payloads before they reach any callback or plugin. See the [Privacy Policy](/policy/privacy) for details.

### Defensive Coding

The SDK is designed to **never crash the host application**. All internal operations are wrapped in try/catch blocks. If the SDK encounters an internal error, it fails silently rather than propagating the error to your application.

### No Network Calls by Default

CrashSense does not make any network requests unless you explicitly configure it to (via `onCrash` callback, plugins, or the AI package). The SDK runs entirely in-browser with no phone-home behavior.

### Content Security Policy (CSP)

CrashSense is CSP-compatible. It does not use `eval()`, `new Function()`, inline scripts, or any other CSP-restricted APIs.

## Supported Versions

| Version | Security Updates |
|---|---|
| 1.x | Active support |

## Contact

Security inquiries: [hoainho.work@gmail.com](mailto:hoainho.work@gmail.com)
