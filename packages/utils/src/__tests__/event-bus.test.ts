import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../event-bus';

describe('createEventBus', () => {
  it('delivers events to registered handlers', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on('error', handler);
    bus.emit('error', { error: new Error('test'), timestamp: Date.now() });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].error.message).toBe('test');
  });

  it('supports multiple handlers for same event', () => {
    const bus = createEventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('error', h1);
    bus.on('error', h2);
    bus.emit('error', { error: new Error('x'), timestamp: 0 });
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('removes handler with off', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on('error', handler);
    bus.off('error', handler);
    bus.emit('error', { error: new Error('x'), timestamp: 0 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not throw when emitting event with no handlers', () => {
    const bus = createEventBus();
    expect(() => {
      bus.emit('error', { error: new Error('x'), timestamp: 0 });
    }).not.toThrow();
  });

  it('swallows handler errors', () => {
    const bus = createEventBus();
    const badHandler = vi.fn(() => {
      throw new Error('handler crash');
    });
    const goodHandler = vi.fn();
    bus.on('error', badHandler);
    bus.on('error', goodHandler);
    expect(() => {
      bus.emit('error', { error: new Error('x'), timestamp: 0 });
    }).not.toThrow();
    expect(badHandler).toHaveBeenCalledOnce();
    expect(goodHandler).toHaveBeenCalledOnce();
  });

  it('handles different event types independently', () => {
    const bus = createEventBus();
    const errorHandler = vi.fn();
    const breadcrumbHandler = vi.fn();
    bus.on('error', errorHandler);
    bus.on('breadcrumb', breadcrumbHandler);
    bus.emit('error', { error: new Error('x'), timestamp: 0 });
    expect(errorHandler).toHaveBeenCalledOnce();
    expect(breadcrumbHandler).not.toHaveBeenCalled();
  });
});
