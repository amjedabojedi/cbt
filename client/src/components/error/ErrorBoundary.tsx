import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isChunkError: boolean;
}

function isChunkLoadError(error: Error): boolean {
  const msg = error?.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    error?.name === 'ChunkLoadError'
  );
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const chunkError = isChunkLoadError(error);
    if (chunkError) {
      // Auto-reload once for chunk errors — clear reload guard after 10s
      const reloadKey = 'chunk_reload_at';
      const last = Number(sessionStorage.getItem(reloadKey) || 0);
      const now = Date.now();
      if (now - last > 10_000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
      }
    }
    return { hasError: true, error, errorInfo: null, isChunkError: chunkError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Error in ${this.props.name || 'component'}:`, error);
    console.error('Component stack:', errorInfo.componentStack);
    this.setState({ error, errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null, isChunkError: false });
  };

  handleReload = (): void => {
    sessionStorage.removeItem('chunk_reload_at');
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error, isChunkError } = this.state;
    const { children, fallback, name } = this.props;

    if (hasError) {
      if (fallback) return fallback;

      if (isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
              <RefreshCw className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold mb-2">App Updated</h2>
              <p className="text-muted-foreground mb-4">
                A new version of ResilienceHub was deployed. Reloading to get the latest version…
              </p>
              <Button onClick={this.handleReload}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Now
              </Button>
            </div>
          </div>
        );
      }

      return (
        <Alert variant="destructive" className="my-4 max-w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {name ? `Error in ${name}` : 'Something went wrong'}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm mb-2">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
