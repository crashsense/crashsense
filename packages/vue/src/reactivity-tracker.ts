import { watch, onUnmounted, type WatchSource } from 'vue';
import { useCrashSense } from './composables';

const DEFAULT_THRESHOLD = 100;
const WINDOW_MS = 1000;

export function useReactivityTracker(
  watchTargets: Record<string, WatchSource>,
  threshold: number = DEFAULT_THRESHOLD,
): void {
  const { captureMessage } = useCrashSense();
  const changeCounts = new Map<string, number[]>();
  const stopHandles: Array<() => void> = [];

  for (const [name, source] of Object.entries(watchTargets)) {
    changeCounts.set(name, []);

    const stop = watch(source, () => {
      const now = Date.now();
      const timestamps = changeCounts.get(name)!;
      timestamps.push(now);

      const cutoff = now - WINDOW_MS;
      const filtered = timestamps.filter((t) => t > cutoff);
      changeCounts.set(name, filtered);

      if (filtered.length > threshold) {
        captureMessage(
          `Potential reactivity loop detected for "${name}": ${filtered.length} changes in ${WINDOW_MS}ms`,
          'warning',
        );
        changeCounts.set(name, []);
      }
    }, { deep: true });

    stopHandles.push(stop);
  }

  onUnmounted(() => {
    for (const stop of stopHandles) {
      stop();
    }
    changeCounts.clear();
  });
}
