import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { extractFriendlyErrorMessage } from '../../services/firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: extractFriendlyErrorMessage(
        error,
        'An unexpected error occurred while rendering this page.'
      )
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#FCFBFA] text-[#18181B] flex items-center justify-center px-4 py-10">
        <div className="ivory-card max-w-md w-full p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FFEBE6] border border-[#FAD5CB] text-[#C94A35] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display text-xl font-extrabold text-[#18181B]">
              Something went wrong
            </h1>
            <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed break-words">
              {this.state.message}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="h-10 px-5 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="h-10 px-5 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
