export { crashSensePlugin, CRASHSENSE_INJECTION_KEY } from './plugin';
export { useCrashSense } from './composables';
export { useReactivityTracker } from './reactivity-tracker';
export { createCrashSense } from '@crashsense/core';
export type {
  CrashSenseConfig,
  CrashReport,
  CrashEvent,
  CrashAnalysis,
} from '@crashsense/types';
