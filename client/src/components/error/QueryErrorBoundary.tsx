import React from 'react';
import { 
  QueryErrorResetBoundary, 
  useQueryErrorResetBoundary 
} from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import ApiErrorFallback from './ApiErrorFallback';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * Specialized error boundary for React Query errors
 * Provides retry capabilities specific to React Query
 */
export function QueryErrorBoundary({ 
  children, 
  title,
  description 
}: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ApiErrorFallback
              error={error}
              resetError={resetErrorBoundary}
              title={title}
              description={description}
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export default QueryErrorBoundary;