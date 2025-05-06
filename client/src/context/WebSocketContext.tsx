import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

// Define the context shape
interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (message: any) => void;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
});

// Provider component
export function WebSocketProvider({ children }: { children: ReactNode }) {
  // Use our WebSocket hook
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  
  // Context value
  const value = {
    isConnected,
    lastMessage,
    sendMessage,
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
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