import type { Breadcrumb, EventBus } from '@crashsense/types';
import { RingBuffer } from '@crashsense/utils';

const BUFFER_SIZE = 50;

export function createBreadcrumbTracker(bus: EventBus) {
  const buffer = new RingBuffer<Breadcrumb>(BUFFER_SIZE);
  let clickHandler: ((e: MouseEvent) => void) | null = null;
  let originalPushState: typeof history.pushState | null = null;
  let originalReplaceState: typeof history.replaceState | null = null;

  function addBreadcrumb(bc: Omit<Breadcrumb, 'timestamp'>): void {
    const crumb: Breadcrumb = {
      ...bc,
      timestamp: performance.now() + performance.timeOrigin,
    };
    buffer.push(crumb);
    bus.emit('breadcrumb', crumb);
  }

  function getElementDescription(target: EventTarget | null): string {
    if (!target || !(target instanceof Element)) return 'unknown';
    const tag = target.tagName.toLowerCase();
    const id = target.id ? `#${target.id}` : '';
    const cls = target.className && typeof target.className === 'string'
      ? `.${target.className.split(' ').slice(0, 2).join('.')}`
      : '';
    const text = target.textContent?.trim().slice(0, 30) ?? '';
    return `${tag}${id}${cls}${text ? ` "${text}"` : ''}`;
  }

  return {
    install(): void {
      if (typeof window === 'undefined') return;

      clickHandler = (e: MouseEvent) => {
        addBreadcrumb({
          type: 'click',
          message: `Click on ${getElementDescription(e.target)}`,
        });
      };
      document.addEventListener('click', clickHandler, { capture: true, passive: true });

      originalPushState = history.pushState;
      history.pushState = function (...args) {
        addBreadcrumb({
          type: 'navigation',
          message: `pushState to ${String(args[2] ?? '')}`,
        });
        return originalPushState!.apply(this, args);
      };

      originalReplaceState = history.replaceState;
      history.replaceState = function (...args) {
        addBreadcrumb({
          type: 'navigation',
          message: `replaceState to ${String(args[2] ?? '')}`,
        });
        return originalReplaceState!.apply(this, args);
      };

      bus.on('error', (data) => {
        addBreadcrumb({
          type: 'console',
          message: `Error: ${data.error.message}`,
        });
      });

      bus.on('network_failure', (data) => {
        addBreadcrumb({
          type: 'network',
          message: `Network failure: ${data.url} (${data.error})`,
        });
      });
    },

    uninstall(): void {
      if (typeof window === 'undefined') return;
      if (clickHandler) {
        document.removeEventListener('click', clickHandler, { capture: true } as EventListenerOptions);
        clickHandler = null;
      }
      if (originalPushState) {
        history.pushState = originalPushState;
        originalPushState = null;
      }
      if (originalReplaceState) {
        history.replaceState = originalReplaceState;
        originalReplaceState = null;
      }
    },

    getBreadcrumbs(): Breadcrumb[] {
      return buffer.drain();
    },

    addBreadcrumb,
  };
}
