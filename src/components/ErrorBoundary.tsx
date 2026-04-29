import React, { type ErrorInfo, type ReactNode } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { STORAGE_KEY, createInitialAppStoreData, useStore } from '@/store';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isClearConfirmOpen: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public declare setState: React.Component<Props, State>['setState'];

  public state: State = {
    hasError: false,
    error: null,
    isClearConfirmOpen: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isClearConfirmOpen: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      isClearConfirmOpen: false,
    });
  };

  private handleClearState = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    useStore.getState().hydrateAppStoreData(createInitialAppStoreData());
    this.setState({
      hasError: false,
      error: null,
      isClearConfirmOpen: false,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <>
          <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#080B11] px-6 text-center text-white">
            <div className="rounded-[2.5rem] border border-red-500/20 bg-red-500/10 p-8 shadow-2xl shadow-red-500/5">
              <h1 className="text-2xl font-black tracking-tight text-red-400">Algo falló al renderizar la app</h1>
              <p className="mt-4 max-w-sm text-sm text-zinc-400">
                Puede venir de un bug inesperado o de estado local corrupto. Primero intentamos recuperar sin recargar toda la app.
              </p>
              
              <div className="mt-6 space-y-3">
                <Button
                  className="w-full h-14 rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
                  onClick={this.handleRetry}
                >
                  Reintentar vista
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full h-14 rounded-[1.75rem] border-white/10 bg-transparent text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 hover:bg-white/5 hover:text-white"
                  onClick={() => this.setState((current) => ({ ...current, isClearConfirmOpen: true }))}
                >
                  Limpiar datos locales
                </Button>
              </div>
              
              {this.state.error && (
                <div className="mt-8 overflow-hidden rounded-xl bg-black/50 p-4 text-left">
                  <p className="font-mono text-xs break-words text-red-300">{this.state.error.message}</p>
                </div>
              )}
            </div>
          </div>

          <ConfirmDialog
            open={this.state.isClearConfirmOpen}
            onOpenChange={(open) => this.setState((current) => ({ ...current, isClearConfirmOpen: open }))}
            title="Borrar estado local"
            description="Esto eliminará entrenamientos, historial y preferencias guardadas en este dispositivo para volver a un estado limpio."
            confirmLabel="Limpiar y reiniciar"
            tone="danger"
            onConfirm={this.handleClearState}
          />
        </>
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this as any).props.children;
  }
}
