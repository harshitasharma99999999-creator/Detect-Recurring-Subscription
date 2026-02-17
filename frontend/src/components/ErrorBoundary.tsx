import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-[#1a1d24] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-xl bg-[#22262e] border border-red-500/50 p-6 text-left">
            <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
            <p className="text-red-300 text-sm font-mono break-all">{this.state.error.message}</p>
            <p className="text-gray-500 text-xs mt-4">
              Check the browser console and ensure Vercel env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL) are set.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
