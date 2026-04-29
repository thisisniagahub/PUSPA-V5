'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  pluginId: string;
  slotName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PluginErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Plugin Error [${this.props.pluginId} @ ${this.props.slotName}]:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 my-2 border border-red-500/50 bg-red-500/10 rounded-xl flex items-start gap-3 text-red-500 text-xs">
          <div className="shrink-0 p-1 bg-red-500/20 rounded">⚠️</div>
          <div>
            <p className="font-bold">Plugin Crash: {this.props.pluginId}</p>
            <p className="opacity-80 mt-0.5">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
