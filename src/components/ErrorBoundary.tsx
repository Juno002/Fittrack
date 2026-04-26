import React, { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#080B11] px-6 text-center text-white">
          <div className="rounded-[2.5rem] border border-red-500/20 bg-red-500/10 p-8 shadow-2xl shadow-red-500/5">
            <h1 className="text-2xl font-black tracking-tight text-red-500">Something went wrong</h1>
            <p className="mt-4 max-w-sm text-sm text-zinc-400">
              A critical error occurred while rendering the application. This is usually caused by corrupted local state or an unexpected bug.
            </p>
            
            <div className="mt-6 space-y-3">
              <Button
                className="w-full h-14 rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
                onClick={() => window.location.reload()}
              >
                Reload app
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-14 rounded-[1.75rem] border-white/10 bg-transparent text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 hover:bg-white/5 hover:text-white"
                onClick={() => {
                  if (window.confirm('WARNING: This will delete ALL your saved data, workouts, and history. Are you sure you want to proceed?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
              >
                Clear state & restart
              </Button>
            </div>
            
            {this.state.error && (
              <div className="mt-8 overflow-hidden rounded-xl bg-black/50 p-4 text-left">
                <p className="font-mono text-xs text-red-400 break-words">{this.state.error.message}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this as any).props.children;
  }
}
