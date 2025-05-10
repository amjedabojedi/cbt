import React from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useTheme } from 'next-themes';

interface ConnectionErrorFallbackProps {
  error: Error | string;
  resetError?: () => void;
  title?: string;
  description?: string;
}

/**
 * Specialized error fallback component for connection-related errors
 * This component provides a more visually prominent error message for connectivity issues
 */
const ConnectionErrorFallback: React.FC<ConnectionErrorFallbackProps> = ({
  error,
  resetError,
  title = "Connection Error",
  description = "There was a problem connecting to the server"
}) => {
  const { theme } = useTheme();
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Unable to connect to the server';
  const isAuthError = errorMessage.includes('401') || 
                      errorMessage.toLowerCase().includes('unauthorized') || 
                      errorMessage.toLowerCase().includes('invalid credentials');

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-destructive/30 animate-in fade-in-50 duration-300">
      <CardHeader className="pb-2 bg-destructive/10">
        <CardTitle className="flex items-center text-lg gap-2">
          {isAuthError ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <WifiOff className="h-5 w-5 text-destructive" />
          )}
          {isAuthError ? 'Authentication Error' : title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 pt-4">
        <p className="text-sm text-foreground mb-3">
          {isAuthError 
            ? 'Your login credentials appear to be incorrect.' 
            : description}
        </p>
        
        {isAuthError && (
          <div className="bg-muted p-3 rounded-md text-xs mb-3">
            <p className="font-semibold mb-1">Please try these credentials:</p>
            <p>• Admin: username: <span className="font-mono">admin</span>, password: <span className="font-mono">123456</span></p>
            <p>• Therapist: username: <span className="font-mono">lcanady</span>, password: <span className="font-mono">123456</span></p>
          </div>
        )}
        
        {process.env.NODE_ENV !== 'production' && !isAuthError && (
          <p className="text-xs text-destructive/80 max-w-full break-words font-mono mt-2 bg-muted p-2 rounded">
            {errorMessage}
          </p>
        )}
        
        {!navigator.onLine && (
          <div className="flex items-center gap-2 mt-3 p-3 bg-amber-100 dark:bg-amber-950/30 rounded-md">
            <Wifi className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Your device appears to be offline. Please check your internet connection.
            </p>
          </div>
        )}
      </CardContent>
      {resetError && (
        <CardFooter className="pt-0">
          <Button 
            variant="default" 
            size="sm"
            onClick={resetError}
            className="w-full"
          >
            {isAuthError ? 'Try Again' : 'Retry Connection'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ConnectionErrorFallback;