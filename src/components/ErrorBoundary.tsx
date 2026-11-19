import React from 'react';
import { RotateCcw } from 'lucide-react';

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

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-[#0b1917] text-slate-100 flex items-center justify-center p-6">
          <div className="pixel-panel max-w-md w-full p-6 flex flex-col gap-4 border-rose-500/70">
            <h2 className="font-pixel text-xl text-rose-400">CONNECTION OR DATA ERROR</h2>
            <p className="text-xs text-slate-300 leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="pixel-btn bg-sky-600 hover:bg-sky-500 px-4 py-2.5 font-pixel text-xs text-white flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RELOAD GAME</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
