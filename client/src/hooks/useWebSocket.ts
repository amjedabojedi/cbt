import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

/**
 * Custom hook for WebSocket connections
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);

  // Connect to the WebSocket server
  const connect = useCallback(() => {
    if (!user) return;
    
    try {
      // Determine protocol based on page protocol (ws for http, wss for https)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      // Create WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Event listeners
      socket.addEventListener('open', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Send authentication message
        socket.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      });
      
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      socket.addEventListener('close', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Try to reconnect after a delay
        setTimeout(() => {
          if (socketRef.current?.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 5000);
      });
      
      socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      });
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
    }
  }, [user]);
  
  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
  }, []);
  
  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);
  
  // Connect on mount, reconnect when user changes
  useEffect(() => {
    if (user) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);
  
  return {
    isConnected,
    lastMessage,
    sendMessage
  };
}