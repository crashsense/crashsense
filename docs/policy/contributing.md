# Contributing

Contributions to CrashSense are welcome — bug reports, feature requests, documentation improvements, and pull requests.

## Development Setup

```bash
git clone https://github.com/crashsense/crashsense.git
cd crashsense
npm install
npm run build
npm test
```

## Project Structure

CrashSense is a monorepo using npm workspaces:

```
crashsense/
  packages/
    types/     # Shared TypeScript types
    utils/     # Ring buffer, event bus, fingerprint, PII scrubber
    core/      # Crash detection engine, classifiers, monitors
    react/     # ErrorBoundary, hooks, hydration detector
    vue/       # Plugin, composables, reactivity tracker
    ai/        # LLM client, payload builder, response parser
  examples/
    react-ecommerce/
  docs/        # This documentation site (VitePress)
```

Each package builds with [tsup](https://tsup.egoist.dev/) producing ESM, CJS, and TypeScript declaration files.

## Code Style

- **TypeScript-first** — all source code is TypeScript
- **Zero dependencies** — browser packages must have zero runtime dependencies
- **Defensive coding** — SDK errors must never crash the host application
- **Tree-shakeable** — exports should be individually importable

## Pull Request Guidelines

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feat/your-feature`
3. **Make your changes** — one feature or fix per PR
4. **Run tests**: `npm test`
5. **Build**: `npm run build`
6. **Commit** with a descriptive message: `git commit -m 'Add amazing feature'`
7. **Push** to your fork: `git push origin feat/your-feature`
8. **Open a Pull Request** against `main`

## Bug Reports

Use [GitHub Issues](https://github.com/crashsense/crashsense/issues) with the following information:

- CrashSense version
- Browser and version
- Framework (React/Vue/vanilla) and version
- Steps to reproduce
- Expected vs actual behavior
- Error messages or crash reports (if applicable)

## Feature Requests

Open a [GitHub Issue](https://github.com/crashsense/crashsense/issues) with the `feature` label. Describe:

- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](/policy/license).
