import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

// Catches unexpected render/runtime errors anywhere below it and shows a
// recoverable screen instead of a blank white page. Data isn't lost — the
// underlying Supabase rows are intact; this just recovers the UI.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface it in the console for debugging; no external logging.
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  handleReload = () => {
    // A full reload re-fetches the latest bundle and re-reads state from Supabase.
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="app-bg flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl">
          😵‍💫
        </div>
        <div>
          <p className="text-lg font-black text-[var(--text)]">Something went wrong</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            The screen hit an unexpected error. Your logged data is safe — reloading usually fixes it.
          </p>
        </div>
        <button
          type="button"
          onClick={this.handleReload}
          className="rounded-2xl px-6 py-3 text-sm font-bold text-white"
          style={{ background: 'var(--accent-gradient)' }}
        >
          Reload the app
        </button>
      </div>
    );
  }
}
