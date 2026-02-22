import type { EventBus, ResolvedConfig, Breadcrumb, SystemState } from '@crashsense/types';

/**
 * Lifecycle Flush — Emergency data persistence on page lifecycle events
 *
 * On mobile browsers, the OS may give a brief grace period before killing a tab.
 * During this window, certain events may fire:
 *
 * - `visibilitychange` → `hidden`: Fires on Android Chrome when user switches apps.
 *   Often precedes OS tab kill by a few seconds.
 *
 * - `pagehide`: Fires on iOS Safari when tab is backgrounded.
 *   May fire before OOM kill (not guaranteed).
 *
 * - `freeze` (Page Lifecycle API, Chrome only): Fires when OS freezes the page.
 *   The page may be discarded (killed) after freeze without further events.
 *
 * This module:
 * 1. Listens for these lifecycle events
 * 2. On event: writes an emergency checkpoint + optionally sends data via sendBeacon
 * 3. sendBeacon is used because the browser guarantees delivery even after page unload
 */
export function createLifecycleFlush(
  bus: EventBus,
  config: ResolvedConfig,
  sessionId: string,
  getSystemState: () => Partial<SystemState>,
  getBreadcrumbs: () => Breadcrumb[],
  flushCheckpoint: () => void,
) {
  let installed = false;

  function buildFlushPayload(reason: string): string {
    return JSON.stringify({
      type: 'lifecycle_flush',
      reason,
      timestamp: Date.now(),
      sessionId,
      appId: config.appId,
      url: typeof location !== 'undefined' ? location.href : '',
      breadcrumbs: getBreadcrumbs().slice(-10),
      systemState: getSystemState(),
    });
  }

  function flush(reason: string): void {
    // 1. Write checkpoint to sessionStorage (synchronous, instant)
    flushCheckpoint();

    // 2. Optionally send data via sendBeacon to remote endpoint
    if (config.flushEndpoint && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const payload = buildFlushPayload(reason);
        navigator.sendBeacon(config.flushEndpoint, payload);
      } catch {
        // sendBeacon can fail silently — nothing we can do
      }
    }

    // 3. Emit event for any listeners
    bus.emit('lifecycle_flush', { reason, timestamp: Date.now() });
  }

  function handleVisibilityChange(): void {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      flush('visibilitychange_hidden');
    }
  }

  function handlePageHide(): void {
    flush('pagehide');
  }

  function handleFreeze(): void {
    flush('freeze');
  }

  return {
    install(): void {
      if (typeof window === 'undefined') return;
      if (installed) return;
      installed = true;

      // visibilitychange: most widely supported, fires on Android when switching apps
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // pagehide: fires on iOS Safari when tab is backgrounded
      // Use { capture: true } to ensure we get it before anything else
      window.addEventListener('pagehide', handlePageHide, { capture: true });

      // freeze: Page Lifecycle API (Chrome 68+)
      // Fires when the page is frozen by the OS — may be followed by discard
      if ('onfreeze' in document) {
        document.addEventListener('freeze', handleFreeze);
      }
    },

    uninstall(): void {
      if (typeof window === 'undefined') return;
      if (!installed) return;
      installed = false;

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide, { capture: true } as EventListenerOptions);

      if ('onfreeze' in document) {
        document.removeEventListener('freeze', handleFreeze);
      }
    },
  };
}
