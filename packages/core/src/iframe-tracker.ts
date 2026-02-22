import type { EventBus, IframeState, ResolvedConfig } from '@crashsense/types';

interface IframeEvent {
  src: string;
  origin: string;
  crossOrigin: boolean;
  timestamp: number;
  action: 'added' | 'removed';
}

const HISTORY_WINDOW = 60_000;

function extractOrigin(src: string): string {
  try {
    return new URL(src, location.href).origin;
  } catch {
    return 'unknown';
  }
}

function isCrossOrigin(origin: string): boolean {
  if (typeof location === 'undefined') return false;
  return origin !== 'unknown' && origin !== location.origin;
}

export function createIframeTracker(bus: EventBus, _config: ResolvedConfig) {
  const events: IframeEvent[] = [];
  let observer: MutationObserver | null = null;
  let currentCount = 0;

  function pruneOldEvents(): void {
    const cutoff = Date.now() - HISTORY_WINDOW;
    while (events.length > 0 && events[0].timestamp < cutoff) {
      events.shift();
    }
  }

  function countCurrentIframes(): number {
    if (typeof document === 'undefined') return 0;
    return document.querySelectorAll('iframe').length;
  }

  function handleAddedIframe(iframe: HTMLIFrameElement): void {
    const src = iframe.src || iframe.getAttribute('src') || '';
    const origin = extractOrigin(src);
    const crossOrigin = isCrossOrigin(origin);
    currentCount = countCurrentIframes();

    const now = Date.now();
    events.push({ src, origin, crossOrigin, timestamp: now, action: 'added' });

    bus.emit('iframe_added', {
      src,
      origin,
      crossOrigin,
      totalCount: currentCount,
      timestamp: performance.now() + performance.timeOrigin,
    });
  }

  function handleRemovedIframe(iframe: HTMLIFrameElement): void {
    const src = iframe.src || iframe.getAttribute('src') || '';
    currentCount = countCurrentIframes();

    events.push({ src, origin: extractOrigin(src), crossOrigin: false, timestamp: Date.now(), action: 'removed' });

    bus.emit('iframe_removed', {
      src,
      totalCount: currentCount,
      timestamp: performance.now() + performance.timeOrigin,
    });
  }

  function processNodes(nodes: NodeList, action: 'added' | 'removed'): void {
    for (const node of Array.from(nodes)) {
      if (node instanceof HTMLIFrameElement) {
        if (action === 'added') handleAddedIframe(node);
        else handleRemovedIframe(node);
      }
      if (node instanceof Element) {
        const nested = node.querySelectorAll('iframe');
        for (const iframe of Array.from(nested)) {
          if (action === 'added') handleAddedIframe(iframe);
          else handleRemovedIframe(iframe);
        }
      }
    }
  }

  return {
    start(): void {
      if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;

      currentCount = countCurrentIframes();

      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length > 0) processNodes(mutation.addedNodes, 'added');
          if (mutation.removedNodes.length > 0) processNodes(mutation.removedNodes, 'removed');
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    },

    stop(): void {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    },

    getSnapshot(): IframeState {
      pruneOldEvents();

      const addedLast60s = events.filter((e) => e.action === 'added').length;
      const removedLast60s = events.filter((e) => e.action === 'removed').length;

      const originsSet = new Set<string>();
      let crossOriginCount = 0;

      if (typeof document !== 'undefined') {
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of Array.from(iframes)) {
          const src = iframe.src || iframe.getAttribute('src') || '';
          const origin = extractOrigin(src);
          originsSet.add(origin);
          if (isCrossOrigin(origin)) crossOriginCount++;
        }
      }

      return {
        totalCount: currentCount,
        addedLast60s,
        removedLast60s,
        origins: Array.from(originsSet),
        crossOriginCount,
      };
    },
  };
}
