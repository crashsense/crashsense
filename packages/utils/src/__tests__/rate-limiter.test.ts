import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from '../rate-limiter';

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows events up to the limit', () => {
    const rl = createRateLimiter(5);
    for (let i = 0; i < 5; i++) {
      expect(rl.tryAcquire()).toBe(true);
    }
  });

  it('rejects events beyond the limit', () => {
    const rl = createRateLimiter(3);
    rl.tryAcquire();
    rl.tryAcquire();
    rl.tryAcquire();
    expect(rl.tryAcquire()).toBe(false);
  });

  it('refills tokens over time', () => {
    const rl = createRateLimiter(60); // 60 per minute = 1 per second
    // Exhaust all tokens
    for (let i = 0; i < 60; i++) {
      rl.tryAcquire();
    }
    expect(rl.tryAcquire()).toBe(false);

    // Advance 30 seconds = 30 tokens refilled
    vi.advanceTimersByTime(30_000);
    expect(rl.tryAcquire()).toBe(true);
  });

  it('reset restores all tokens', () => {
    const rl = createRateLimiter(5);
    for (let i = 0; i < 5; i++) {
      rl.tryAcquire();
    }
    expect(rl.tryAcquire()).toBe(false);
    rl.reset();
    expect(rl.tryAcquire()).toBe(true);
  });

  it('does not exceed max tokens on refill', () => {
    const rl = createRateLimiter(3);
    // Advance a lot of time without consuming
    vi.advanceTimersByTime(120_000);
    // Should still only have 3 tokens max
    expect(rl.tryAcquire()).toBe(true);
    expect(rl.tryAcquire()).toBe(true);
    expect(rl.tryAcquire()).toBe(true);
    expect(rl.tryAcquire()).toBe(false);
  });
});
