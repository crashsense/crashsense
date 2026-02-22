import type { EventBus, EventBusEventMap } from '@crashsense/types';

type Handler<T> = (data: T) => void;

export function createEventBus(): EventBus {
  const handlers = new Map<string, Set<Handler<unknown>>>();

  return {
    on<K extends keyof EventBusEventMap>(
      event: K,
      handler: (data: EventBusEventMap[K]) => void,
    ): void {
      if (!handlers.has(event as string)) {
        handlers.set(event as string, new Set());
      }
      handlers.get(event as string)!.add(handler as Handler<unknown>);
    },

    off<K extends keyof EventBusEventMap>(
      event: K,
      handler: (data: EventBusEventMap[K]) => void,
    ): void {
      const set = handlers.get(event as string);
      if (set) {
        set.delete(handler as Handler<unknown>);
      }
    },

    emit<K extends keyof EventBusEventMap>(
      event: K,
      data: EventBusEventMap[K],
    ): void {
      const set = handlers.get(event as string);
      if (set) {
        for (const handler of set) {
          try {
            handler(data);
          } catch (_) {
            // SDK errors must never crash the host application
          }
        }
      }
    },
  };
}
