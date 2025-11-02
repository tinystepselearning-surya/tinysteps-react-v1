/**
 * Error Boundary for Balloon Pop IPA
 * 
 * Catches React errors and provides recovery UI.
 * Preserves saved mastery data while resetting transient UI state.
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { resetQuestionCounter } from './engine';
import { logErrorBoundary } from './telemetry';

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

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    logErrorBoundary(error, errorInfo);
  }

  handleReload = (): void => {
    // Reset transient state
    resetQuestionCounter();
    
    // Clear error state
    this.setState({
      hasError: false,
      error: null,
    });
    
    // Reload the page to fully reset
    window.location.reload();
  };

  handleRetry = (): void => {
    // Reset error state without full page reload
    resetQuestionCounter();
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-sky-300 to-blue-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-600">
                Don't worry, your progress is saved!
              </p>
            </div>

            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-mono text-red-800 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-400"
              >
                Reload Game
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
