import { Component } from 'react';
import { RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="text-center max-w-sm mx-4">
            <div className="w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h2 className="text-lg font-semibold mb-2">页面出了点问题</h2>
            <p className="text-sm text-text-secondary mb-6">
              {this.state.error?.message || '发生了未知错误'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              <RefreshCw size={14} />
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
