import React from 'react';
import type { CrashSenseConfig, CrashSenseCore, CrashReport } from '@crashsense/types';
import { createCrashSense } from '@crashsense/core';

export const CrashSenseContext = React.createContext<CrashSenseCore | null>(null);

interface CrashSenseProviderProps {
  config: CrashSenseConfig;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onCrash?: (report: CrashReport) => void;
}

interface CrashSenseProviderState {
  hasError: boolean;
}

export class CrashSenseProvider extends React.Component<
  CrashSenseProviderProps,
  CrashSenseProviderState
> {
  private core: CrashSenseCore | null = null;

  constructor(props: CrashSenseProviderProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): CrashSenseProviderState {
    return { hasError: true };
  }

  componentDidMount(): void {
    const enrichedConfig: CrashSenseConfig = {
      ...this.props.config,
      onCrash: (report: CrashReport) => {
        this.props.onCrash?.(report);
        this.props.config.onCrash?.(report);
      },
    };

    this.core = createCrashSense(enrichedConfig);
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (!this.core) return;

    this.core.captureException(error, {
      componentStack: errorInfo.componentStack ?? '',
      framework: 'react',
      lifecycleStage: 'rendering',
    });
  }

  componentWillUnmount(): void {
    this.core?.destroy();
    this.core = null;
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.props.fallback !== undefined) {
      return React.createElement(
        CrashSenseContext.Provider,
        { value: this.core },
        this.props.fallback,
      );
    }

    return React.createElement(
      CrashSenseContext.Provider,
      { value: this.core },
      this.props.children,
    );
  }
}
