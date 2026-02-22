import type { App, Plugin } from 'vue';
import type { CrashSenseConfig, CrashSenseCore } from '@crashsense/types';
import { createCrashSense } from '@crashsense/core';

export const CRASHSENSE_INJECTION_KEY = Symbol('crashsense');

let coreInstance: CrashSenseCore | null = null;

export const crashSensePlugin: Plugin = {
  install(app: App, options: CrashSenseConfig) {
    coreInstance = createCrashSense(options);

    const previousErrorHandler = app.config.errorHandler;

    app.config.errorHandler = (err, instance, info) => {
      const error = err instanceof Error ? err : new Error(String(err));

      let componentName = 'Unknown';
      if (instance && '$options' in instance) {
        componentName = (instance.$options as { name?: string }).name ?? (instance.$options as { __name?: string }).__name ?? 'Anonymous';
      }

      coreInstance!.captureException(error, {
        framework: 'vue',
        componentName,
        lifecycleInfo: info,
        lifecycleStage: info,
      });

      if (previousErrorHandler) {
        previousErrorHandler(err, instance, info);
      }
    };

    app.provide(CRASHSENSE_INJECTION_KEY, coreInstance);

    app.config.globalProperties.$crashsense = coreInstance;
  },
};

export function getCoreInstance(): CrashSenseCore | null {
  return coreInstance;
}
