import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

interface ApiErrorFallbackProps {
  error: Error | string;
  resetError: () => void;
  title?: string;
  description?: string;
}

/**
 * Reusable error fallback component for API errors
 * This component displays a user-friendly error message and a retry button
 */
const ApiErrorFallback: React.FC<ApiErrorFallbackProps> = ({
  error,
  resetError,
  title = "Something went wrong",
  description = "There was a problem loading this data"
}) => {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'An unknown error occurred';

  return (
    <Card className="w-full shadow-md bg-background border-destructive/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground mb-1">
          {description}
        </p>
        {process.env.NODE_ENV !== 'production' && (
          <p className="text-xs text-destructive/80 max-w-full break-words font-mono mt-2">
            {errorMessage}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          size="sm"
          onClick={resetError}
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiErrorFallback;