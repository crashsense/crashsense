import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCrashSense } from '../crashsense';
import type { CrashReport } from '@crashsense/types';

describe('captureException framework context merging', () => {
  let reports: CrashReport[];
  let cs: ReturnType<typeof createCrashSense>;

  beforeEach(() => {
    reports = [];
    cs = createCrashSense({
      appId: 'test-app',
      debug: false,
      sampleRate: 1.0,
      onCrash: (report) => reports.push(report),
    });
  });

  afterEach(() => {
    cs.destroy();
  });

  it('sets framework.name to "react" when context includes framework: "react"', () => {
    cs.captureException(new Error('test'), {
      framework: 'react',
      lifecycleStage: 'rendering',
    });

    expect(reports).toHaveLength(1);
    expect(reports[0].event.framework.name).toBe('react');
    expect(reports[0].event.framework.lifecycleStage).toBe('rendering');
  });

  it('sets framework.name to "vue" when context includes framework: "vue"', () => {
    cs.captureException(new Error('test'), {
      framework: 'vue',
      lifecycleStage: 'mounted',
      componentName: 'MyComponent',
    });

    expect(reports).toHaveLength(1);
    expect(reports[0].event.framework.name).toBe('vue');
    expect(reports[0].event.framework.lifecycleStage).toBe('mounted');
    // componentName goes to tags, not framework
    expect(reports[0].event.meta.tags.componentName).toBe('MyComponent');
  });

  it('defaults framework.name to "vanilla" when no framework context provided', () => {
    cs.captureException(new Error('test'), {
      action: 'checkout',
    });

    expect(reports).toHaveLength(1);
    expect(reports[0].event.framework.name).toBe('vanilla');
  });

  it('defaults framework.name to "vanilla" when no context at all', () => {
    cs.captureException(new Error('test'));

    expect(reports).toHaveLength(1);
    expect(reports[0].event.framework.name).toBe('vanilla');
  });

  it('merges componentStack into framework.componentTree', () => {
    cs.captureException(new Error('test'), {
      framework: 'react',
      componentStack: 'App > Layout > Page',
    });

    expect(reports).toHaveLength(1);
    expect(reports[0].event.framework.componentTree).toEqual(['App > Layout > Page']);
  });

  it('merges componentTree array into framework.componentTree', () => {
    cs.captureException(new Error('test'), {
      framework: 'react',
      componentTree: ['App', 'Layout', 'Page'],
    });

    expect(reports).toHaveLength(1);
    expect(reports[0].event.framework.componentTree).toEqual(['App', 'Layout', 'Page']);
  });

  it('merges currentRoute into framework.currentRoute', () => {
    cs.captureException(new Error('test'), {
      framework: 'react',
      currentRoute: '/checkout',
    });

    expect(reports).toHaveLength(1);
    expect(reports[0].event.framework.currentRoute).toBe('/checkout');
  });

  it('merges renderCount into framework.renderCount', () => {
    cs.captureException(new Error('test'), {
      framework: 'react',
      renderCount: 42,
    });

    expect(reports).toHaveLength(1);
    expect(reports[0].event.framework.renderCount).toBe(42);
  });

  it('puts non-framework keys into meta.tags', () => {
    cs.captureException(new Error('test'), {
      framework: 'react',
      action: 'payment',
      userId: '123',
    });

    expect(reports).toHaveLength(1);
    expect(reports[0].event.meta.tags.action).toBe('payment');
    expect(reports[0].event.meta.tags.userId).toBe('123');
    // framework should NOT appear in tags
    expect(reports[0].event.meta.tags.framework).toBeUndefined();
  });

  it('handles lifecycleInfo from Vue adapter (maps to lifecycleStage)', () => {
    cs.captureException(new Error('test'), {
      framework: 'vue',
      lifecycleInfo: 'setup function',
    });

    expect(reports).toHaveLength(1);
    expect(reports[0].event.framework.name).toBe('vue');
    expect(reports[0].event.framework.lifecycleStage).toBe('setup function');
  });
});