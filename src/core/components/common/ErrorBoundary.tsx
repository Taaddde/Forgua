import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  inline?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[Forgua] Uncaught error:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    if (this.props.inline) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-950/30 border border-red-800/50">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-300">Something went wrong loading this section.</p>
            <p className="text-xs text-red-400/70 mt-1 truncate">{this.state.error?.message}</p>
          </div>
          <button onClick={this.handleReset} className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-800/50 text-red-200 hover:bg-red-800/70 transition-colors">
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-950/50 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-400 mb-1 max-w-md">An unexpected error occurred.</p>
        <p className="text-xs text-slate-500 mb-8 font-mono max-w-lg truncate">{this.state.error?.message}</p>
        <div className="flex gap-3">
          <button onClick={this.handleReset} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
          <button onClick={this.handleGoHome} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm font-medium">
            <Home className="w-4 h-4" /> Dashboard
          </button>
        </div>
        {this.state.errorInfo && (
          <details className="mt-8 w-full max-w-2xl text-left">
            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">Technical details</summary>
            <pre className="mt-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto max-h-48">
              {this.state.error?.stack}{'\n\nComponent stack:'}{this.state.errorInfo.componentStack}
            </pre>
          </details>
        )}
      </div>
    );
  }
}
