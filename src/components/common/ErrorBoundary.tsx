import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getTranslation } from '../../i18n';
import { useBacktestStore } from '../../store/backtestStore';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      const language = useBacktestStore.getState().language;
      const t = getTranslation(language);

      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0e121b] text-slate-300 p-6 select-none">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 mb-1">
            {this.props.fallbackTitle || t.errorBoundaryDefaultTitle}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm text-center mb-4">
            {t.chartRenderErrorDesc}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.reloadChartBtn}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
