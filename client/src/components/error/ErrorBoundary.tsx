import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
  name?: string; // Optional name for the error boundary for logging purposes
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the component tree
 * and display a fallback UI instead of crashing the entire application
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console or error tracking service
    console.error(`Error in ${this.props.name || 'component'}:`, error);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, name } = this.props;

    if (hasError) {
      // Render custom fallback UI or default error message
      if (fallback) {
        return fallback;
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

    // When there's no error, render children normally
    return children;
  }
}

export default ErrorBoundary;