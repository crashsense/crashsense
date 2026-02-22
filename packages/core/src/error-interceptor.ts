import type { EventBus } from '@crashsense/types';

const IGNORED_MESSAGES = [
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
];

function isIgnoredError(message: string, filename?: string): boolean {
  if (IGNORED_MESSAGES.some((m) => message.includes(m))) return true;
  if (filename?.startsWith('chrome-extension://')) return true;
  if (filename?.startsWith('moz-extension://')) return true;
  if (message === 'Script error.' || message === 'Script error') return true;
  return false;
}

export function createErrorInterceptor(bus: EventBus) {
  let errorHandler: ((event: ErrorEvent) => void) | null = null;
  let rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  return {
    install(): void {
      if (typeof window === 'undefined') return;

      errorHandler = (event: ErrorEvent) => {
        if (isIgnoredError(event.message, event.filename)) return;

        const error = event.error instanceof Error
          ? event.error
          : new Error(event.message);

        bus.emit('error', {
          error,
          timestamp: performance.now() + performance.timeOrigin,
        });
      };

      rejectionHandler = (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        bus.emit('unhandled_rejection', {
          reason,
          timestamp: performance.now() + performance.timeOrigin,
        });
      };

      window.addEventListener('error', errorHandler);
      window.addEventListener('unhandledrejection', rejectionHandler);
    },

    uninstall(): void {
      if (typeof window === 'undefined') return;
      if (errorHandler) window.removeEventListener('error', errorHandler);
      if (rejectionHandler) window.removeEventListener('unhandledrejection', rejectionHandler);
      errorHandler = null;
      rejectionHandler = null;
    },
  };
}
