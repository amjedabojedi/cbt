import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';

// Define the context shape
interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (message: any) => void;
  connectionAttempts: number;
  reconnect: () => void;
  hasConnectionError: boolean;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
  connectionAttempts: 0,
  reconnect: () => {},
  hasConnectionError: false
});

// Connection error fallback component
const ConnectionErrorFallback = ({ onRetry }: { onRetry: () => void }) => (
  <Alert variant="destructive" className="my-4">
    <WifiOff className="h-4 w-4 mr-2" />
    <AlertTitle>Connection issue</AlertTitle>
    <AlertDescription className="mt-2">
      Unable to establish a real-time connection. Some features may not work correctly.
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRetry}
        className="mt-2"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Reconnect
      </Button>
    </AlertDescription>
  </Alert>
);

// Provider component with enhanced error handling
export function WebSocketProvider({ children }: { children: ReactNode }) {
  // Get user information for authentication
  const { user } = useAuth();
  
  // Track connection attempts for better error handling
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const [showErrorPrompt, setShowErrorPrompt] = useState(false);
  
  // Use our WebSocket hook with authentication info
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  
  // Handle authentication change - trigger reconnect when user changes
  useEffect(() => {
    if (user && !isConnected && connectionAttempts < 3) {
      // If user is logged in but WebSocket isn't connected, try to reconnect
      setConnectionAttempts(prev => prev + 1);
    }
  }, [user, isConnected, connectionAttempts]);
  
  // Reset connection error when successfully connected
  useEffect(() => {
    if (isConnected) {
      setHasConnectionError(false);
      setShowErrorPrompt(false);
    } else if (connectionAttempts > 5) {
      // After 5 failed attempts, consider it a connection error
      setHasConnectionError(true);
      
      // Only show error prompt to user after significant retry attempts
      if (connectionAttempts > 8) {
        setShowErrorPrompt(true);
      }
    }
  }, [isConnected, connectionAttempts]);
  
  // Function to trigger a reconnection with debounce
  const reconnect = useCallback(() => {
    setConnectionAttempts(prev => prev + 1);
    // Hide error prompt while attempting to reconnect
    setShowErrorPrompt(false);
  }, []);
  
  // Context value with enhanced properties
  const value = {
    isConnected,
    lastMessage,
    sendMessage,
    connectionAttempts,
    reconnect,
    hasConnectionError
  };
  
  return (
    <ErrorBoundary name="WebSocket Provider">
      <WebSocketContext.Provider value={value}>
        {showErrorPrompt && hasConnectionError && <ConnectionErrorFallback onRetry={reconnect} />}
        {children}
      </WebSocketContext.Provider>
    </ErrorBoundary>
  );
}

// Custom hook to use the WebSocket context
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}