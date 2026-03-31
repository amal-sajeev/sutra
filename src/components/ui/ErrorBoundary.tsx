import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '16px',
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent-primary)' }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.6 }}>
            An unexpected error occurred. Your data is safe in IndexedDB.
            Try refreshing the page.
          </p>
          <pre style={{
            fontSize: '0.8rem',
            padding: '12px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--divider)',
            borderRadius: '6px',
            maxWidth: '500px',
            overflow: 'auto',
            color: '#e55',
          }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              fontSize: '0.9rem',
              fontWeight: 600,
              border: '1px solid var(--border-active)',
              borderRadius: '6px',
              cursor: 'pointer',
              background: 'transparent',
              color: 'var(--accent-primary)',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
