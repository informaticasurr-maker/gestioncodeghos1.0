import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TechFix App Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Ocurrió un inconveniente visual
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                La aplicación detectó un detalle al renderizar la vista. Tus datos guardados en la base de datos están seguros.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-lg text-left text-[11px] font-mono text-rose-300 overflow-x-auto max-h-24 border border-rose-900/40">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition"
              >
                <Home className="w-4 h-4" />
                <span>Volver al Inicio</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Aplicación</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
