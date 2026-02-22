import { useContext } from 'react';
import type { CrashSenseCore, Breadcrumb, CrashSeverity } from '@crashsense/types';
import { CrashSenseContext } from './provider';

export function useCrashSense(): {
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, severity?: CrashSeverity) => void;
  addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => void;
  core: CrashSenseCore | null;
} {
  const core = useContext(CrashSenseContext);

  return {
    captureException: (error: unknown, context?: Record<string, unknown>) => {
      core?.captureException(error, context);
    },
    captureMessage: (message: string, severity?: CrashSeverity) => {
      core?.captureMessage(message, severity);
    },
    addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
      core?.addBreadcrumb(breadcrumb);
    },
    core,
  };
}
