import { inject } from 'vue';
import type { CrashSenseCore, Breadcrumb, CrashSeverity } from '@crashsense/types';
import { CRASHSENSE_INJECTION_KEY } from './plugin';

export function useCrashSense(): {
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, severity?: CrashSeverity) => void;
  addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => void;
  core: CrashSenseCore;
} {
  const core = inject<CrashSenseCore>(CRASHSENSE_INJECTION_KEY);

  if (!core) {
    throw new Error(
      '[CrashSense] useCrashSense() called outside of crashSensePlugin. ' +
      'Make sure to call app.use(crashSensePlugin, config) before using this composable.',
    );
  }

  return {
    captureException: (error: unknown, context?: Record<string, unknown>) => {
      core.captureException(error, context);
    },
    captureMessage: (message: string, severity?: CrashSeverity) => {
      core.captureMessage(message, severity);
    },
    addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
      core.addBreadcrumb(breadcrumb);
    },
    core,
  };
}
