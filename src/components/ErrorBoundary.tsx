import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { errorLog } from '../utils/debug';

/**
 * Error Boundary Component
 * Catches errors in child components and displays a fallback UI
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'app' | 'page' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    errorLog('Error caught by boundary:', error);
    errorLog('Error info:', errorInfo);

    // Store error info in state
    this.setState({
      errorInfo
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Here you could also send to error tracking service
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on error level
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          level={this.props.level || 'component'}
          onReset={this.handleReset}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  level: 'app' | 'page' | 'component';
  onReset: () => void;
  onReload: () => void;
  onGoHome: () => void;
}

function ErrorFallback({ 
  error, 
  errorInfo, 
  level,
  onReset,
  onReload,
  onGoHome 
}: ErrorFallbackProps) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Full page error for app-level
  if (level === 'app') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
            <CardDescription>
              We're sorry, but the application encountered an unexpected error.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isProduction && error && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-mono text-sm text-destructive mb-2">
                  {error.toString()}
                </p>
                {errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Component Stack
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={onReload} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={onGoHome} variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              If this problem persists, please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Inline error for component-level
  return (
    <div className="border border-destructive rounded-lg p-6 bg-destructive/5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-destructive">
            {level === 'page' ? 'Page Error' : 'Component Error'}
          </h3>
          <p className="text-sm text-muted-foreground">
            This {level === 'page' ? 'page' : 'component'} failed to load properly.
          </p>

          {!isProduction && error && (
            <div className="bg-muted p-3 rounded text-xs font-mono overflow-auto">
              {error.toString()}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={onReset} size="sm" variant="outline">
              <RefreshCw className="mr-2 h-3 w-3" />
              Try Again
            </Button>
            {level === 'page' && (
              <Button onClick={onGoHome} size="sm" variant="ghost">
                <Home className="mr-2 h-3 w-3" />
                Go Home
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for manually triggering error boundary
 * Useful for async errors that can't be caught by error boundary
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    throw error;
  }

  return (error: Error) => {
    setError(error);
  };
}
