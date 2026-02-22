import type { DeviceInfo } from '@crashsense/types';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export function collectDeviceInfo(): DeviceInfo {
  if (!isBrowser) {
    return {
      userAgent: 'node',
      platform: typeof process !== 'undefined' ? process.platform : 'unknown',
      vendor: '',
      deviceMemory: null,
      hardwareConcurrency: null,
      viewport: { width: 0, height: 0 },
      devicePixelRatio: 1,
      touchSupport: false,
      colorScheme: 'light',
      reducedMotion: false,
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
  };

  return {
    userAgent: nav.userAgent,
    platform: nav.platform,
    vendor: nav.vendor || '',
    deviceMemory: nav.deviceMemory ?? null,
    hardwareConcurrency: nav.hardwareConcurrency ?? null,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    devicePixelRatio: window.devicePixelRatio || 1,
    touchSupport: 'ontouchstart' in window || nav.maxTouchPoints > 0,
    colorScheme: window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    language: nav.language || 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
