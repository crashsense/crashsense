import type { EventBus, NetworkState, NetworkRequest, ResolvedConfig } from '@crashsense/types';
import { RingBuffer } from '@crashsense/utils';

const HISTORY_SIZE = 100;

export function createNetworkMonitor(bus: EventBus, _config: ResolvedConfig) {
  const history = new RingBuffer<NetworkRequest>(HISTORY_SIZE);
  let originalFetch: typeof fetch | null = null;
  let pendingCount = 0;

  function wrapFetch(): void {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;

    originalFetch = window.fetch;

    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
      const method = init?.method ?? 'GET';
      const startTime = performance.now();

      pendingCount++;

      try {
        const response = await originalFetch!.call(window, input, init);
        const duration = performance.now() - startTime;
        pendingCount--;

        const request: NetworkRequest = {
          url,
          method,
          status: response.status,
          duration,
          startTime,
          error: null,
          responseSize: null,
        };
        history.push(request);

        if (response.status >= 500 || response.status === 0) {
          bus.emit('network_failure', {
            url,
            status: response.status,
            error: `HTTP ${response.status}`,
            timestamp: performance.now() + performance.timeOrigin,
          });
        }

        return response;
      } catch (err) {
        const duration = performance.now() - startTime;
        pendingCount--;

        const errorMsg = err instanceof Error ? err.message : String(err);
        const request: NetworkRequest = {
          url,
          method,
          status: 0,
          duration,
          startTime,
          error: errorMsg,
          responseSize: null,
        };
        history.push(request);

        bus.emit('network_failure', {
          url,
          status: 0,
          error: errorMsg,
          timestamp: performance.now() + performance.timeOrigin,
        });

        throw err;
      }
    };
  }

  return {
    start(): void {
      wrapFetch();
    },

    stop(): void {
      if (originalFetch && typeof window !== 'undefined') {
        window.fetch = originalFetch;
        originalFetch = null;
      }
    },

    getSnapshot(): NetworkState {
      const now = performance.now();
      const requests = history.drain();
      const recentRequests = requests.filter((r) => now - r.startTime < 60000);

      const failedCount = recentRequests.filter(
        (r) => r.status === 0 || r.status >= 500 || r.error !== null,
      ).length;

      const latencies = recentRequests
        .filter((r) => r.error === null)
        .map((r) => r.duration);
      const avgLatency = latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0;

      let connectionType: string | null = null;
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
        connectionType = conn?.effectiveType ?? null;
      }

      return {
        pendingRequests: pendingCount,
        failedRequestsLast60s: failedCount,
        avgLatencyLast60s: Math.round(avgLatency),
        connectionType,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      };
    },
  };
}
