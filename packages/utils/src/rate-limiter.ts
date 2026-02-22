export interface RateLimiter {
  tryAcquire(): boolean;
  reset(): void;
}

export function createRateLimiter(maxPerMinute: number): RateLimiter {
  let tokens = maxPerMinute;
  let lastRefill = Date.now();

  function refill(): void {
    const now = Date.now();
    const elapsed = now - lastRefill;
    const newTokens = (elapsed / 60000) * maxPerMinute;
    tokens = Math.min(maxPerMinute, tokens + newTokens);
    lastRefill = now;
  }

  return {
    tryAcquire(): boolean {
      refill();
      if (tokens >= 1) {
        tokens -= 1;
        return true;
      }
      return false;
    },

    reset(): void {
      tokens = maxPerMinute;
      lastRefill = Date.now();
    },
  };
}
