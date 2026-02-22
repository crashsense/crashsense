import { useRef, useEffect } from 'react';
import { useCrashSense } from './hooks';

const DEFAULT_THRESHOLD = 50;
const WINDOW_MS = 1000;

export function useRenderTracker(
  componentName: string,
  threshold: number = DEFAULT_THRESHOLD,
): void {
  const renderTimestamps = useRef<number[]>([]);
  const warned = useRef(false);
  const { captureMessage } = useCrashSense();

  const now = Date.now();
  renderTimestamps.current.push(now);

  const cutoff = now - WINDOW_MS;
  renderTimestamps.current = renderTimestamps.current.filter((t) => t > cutoff);

  if (renderTimestamps.current.length > threshold && !warned.current) {
    warned.current = true;
    captureMessage(
      `Potential infinite re-render detected in ${componentName}: ${renderTimestamps.current.length} renders in ${WINDOW_MS}ms`,
      'warning',
    );
  }

  useEffect(() => {
    return () => {
      renderTimestamps.current = [];
      warned.current = false;
    };
  }, []);
}
