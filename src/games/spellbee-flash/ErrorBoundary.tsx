import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    console.error("SpellBee Flash Trainer Error:", error, errorInfo);
    
    // Log to localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };
      localStorage.setItem(
        "spellbee-last-error",
        JSON.stringify(errorLog)
      );
    } catch (e) {
      console.warn("Failed to log error:", e);
    }
  }

  handleReset = (): void => {
    // Clear game state
    try {
      const keys = [
        "spellbee-progress-v1",
        "spellbee-mastery-v1",
        "spellbee-phonemes-v1",
        "spellbee-fixup-v1",
      ];
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.warn("Failed to clear state:", e);
    }
    
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md shadow-2xl text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-3xl font-black text-purple-600 mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              The game encountered an error. Don't worry, your progress is saved!
            </p>
            
            {this.state.error && (
              <details className="mb-6 text-left bg-gray-100 rounded-lg p-4">
                <summary className="cursor-pointer font-bold text-sm text-gray-700">
                  Technical details
                </summary>
                <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-400 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                🔄 Reload Game
              </button>
              
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-gradient-to-r from-orange-400 to-red-400 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                🗑️ Reset & Restart
              </button>
              
              <button
                onClick={() => (window.location.href = "/games")}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                ← Back to Games
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
