import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

/**
 * Custom hook for WebSocket connections with enhanced error handling
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [connectionErrors, setConnectionErrors] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState(0);
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to reset connection errors after successful connection
  const resetConnectionErrors = useCallback(() => {
    setConnectionErrors(0);
    setLastErrorTime(0);
  }, []);

  // Enhanced connect function with better error handling
  const connect = useCallback(() => {
    // PERFORMANCE FIX: Disable WebSocket connections to stop constant reconnection attempts
    console.log('WebSocket disabled for performance - using HTTP polling instead');
    return;
    
    if (!user) return;
    
    // Don't attempt to reconnect if we already have an open connection
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }
    
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    try {
      // Determine protocol based on page protocol (ws for http, wss for https)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Use the current host which includes hostname and port
      const host = window.location.host;
      
      // Add user ID as a query parameter for authentication
      const authQuery = user?.id ? `?userId=${user.id}` : '';
      
      // Construct a safe WebSocket URL with authentication
      const wsUrl = `${protocol}//${host}/ws${authQuery}`;
      console.log('Connecting to WebSocket URL:', wsUrl);
      
      // Create WebSocket connection with timeout
      const socket = new WebSocket(wsUrl);
      
      // Add backup auth headers even for WebSocket connections
      if (user && user.id) {
        console.log('Adding backup auth headers:', { userId: user.id });
      }
      
      socketRef.current = socket;
      
      // Connection timeout (5 seconds)
      const connectionTimeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout');
          setIsConnected(false);
          socket.close();
          
          // Increment error count
          setConnectionErrors(prev => prev + 1);
          setLastErrorTime(Date.now());
          
          // Schedule a reconnection attempt with exponential backoff
          const backoffTime = Math.min(30000, 1000 * Math.pow(2, Math.min(connectionErrors, 5)));
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, backoffTime);
        }
      }, 5000);
      
      // Event listeners
      socket.addEventListener('open', () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connected');
        setIsConnected(true);
        resetConnectionErrors();
        
        // Send authentication message
        if (user && user.id) {
          try {
            socket.send(JSON.stringify({
              type: 'auth',
              userId: user.id
            }));
          } catch (error) {
            console.error('Error sending auth message:', error);
          }
        }
      });
      
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      socket.addEventListener('close', (event) => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        
        // Calculate backoff time based on connection errors
        // Exponential backoff with max of 30 seconds
        const backoffTime = Math.min(Math.pow(2, connectionErrors) * 1000, 30000);
        
        // Try to reconnect after a delay with exponential backoff
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          // Don't reconnect if user is no longer logged in
          if (user) {
            connect();
          }
        }, backoffTime);
      });
      
      socket.addEventListener('error', (event) => {
        // Don't log the entire error object as it can cause circular reference errors
        console.error('WebSocket error - will attempt reconnection soon');
        setIsConnected(false);
        setConnectionErrors(prev => prev + 1);
        setLastErrorTime(Date.now());
        
        // Schedule reconnection with backoff
        const backoffTime = Math.min(30000, 1000 * Math.pow(2, Math.min(connectionErrors, 5)));
        console.log(`Will attempt reconnection in ${backoffTime/1000} seconds`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          if (user) {
            connect();
          }
        }, backoffTime);
      });
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      setConnectionErrors(prev => prev + 1);
      setLastErrorTime(Date.now());
      
      // Attempt to reconnect after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, 5000);
    }
  }, [user, resetConnectionErrors]);
  
  // Gracefully disconnect WebSocket
  const disconnect = useCallback(() => {
    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close the socket if it's open
    if (socketRef.current) {
      try {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close(1000, 'User logged out');
        }
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      } finally {
        socketRef.current = null;
      }
    }
    
    setIsConnected(false);
  }, []);
  
  // Safer send message function with error handling
  const sendMessage = useCallback((message: any) => {
    if (!isConnected || !socketRef.current) {
      console.error('Cannot send message: WebSocket is not connected');
      return false;
    }
    
    try {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(message));
        return true;
      } else {
        console.error('WebSocket is not in OPEN state');
        
        // If socket is closing or closed, try to reconnect
        if (socketRef.current.readyState >= WebSocket.CLOSING) {
          connect();
        }
        return false;
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }, [isConnected, connect]);
  
  // Set up heartbeat to keep connection alive and detect connection issues
  useEffect(() => {
    if (!isConnected || !socketRef.current) return;
    
    // Two intervals: one for sending pings, one for checking responses
    let lastPingResponse = Date.now();
    
    // Send a ping every 25 seconds
    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Error sending ping:', error);
        }
      }
    }, 25000);
    
    // Listen for pong responses
    const pongHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
          lastPingResponse = Date.now();
        }
      } catch (e) {}
    };
    
    socketRef.current.addEventListener('message', pongHandler);
    
    // Check if we haven't received a pong in too long (60 seconds)
    const checkInterval = setInterval(() => {
      if (Date.now() - lastPingResponse > 60000) {
        console.warn('No ping response in 60 seconds, reconnecting...');
        // Force reconnection
        if (socketRef.current) {
          socketRef.current.close();
        }
      }
    }, 30000);
    
    return () => {
      clearInterval(pingInterval);
      clearInterval(checkInterval);
      socketRef.current?.removeEventListener('message', pongHandler);
    };
  }, [isConnected, connect]);

  // Connect on mount, reconnect when user changes
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);
  
  return {
    isConnected,
    lastMessage,
    sendMessage,
    connectionErrors,
    reconnect: connect // Expose reconnect function
  };
}