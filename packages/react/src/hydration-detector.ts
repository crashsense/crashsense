import type { CrashSenseCore } from '@crashsense/types';

export function createHydrationDetector(core: CrashSenseCore) {
  let originalConsoleError: typeof console.error | null = null;

  return {
    install(): void {
      if (typeof console === 'undefined') return;

      originalConsoleError = console.error;

      console.error = (...args: unknown[]) => {
        originalConsoleError!.apply(console, args);

        const message = args.map(String).join(' ');
        if (/hydrat/i.test(message)) {
          core.captureException(
            new Error(`Hydration mismatch: ${message.slice(0, 200)}`),
            {
              source: 'hydration_detector',
              framework: 'react',
              lifecycleStage: 'hydrating',
            },
          );
        }
      };
    },

    uninstall(): void {
      if (originalConsoleError) {
        console.error = originalConsoleError;
        originalConsoleError = null;
      }
    },
  };
}
