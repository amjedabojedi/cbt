import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Notification } from '@shared/schema';
import { URL } from 'url';

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  isAlive: boolean;
  connectionId: string; // Unique identifier for each connection
  lastActivity: number; // Timestamp of last activity
}

// Store connected clients by userId
const connectedClients: Map<number, ExtendedWebSocket[]> = new Map();

// Connection tracking statistics
const connectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  connectionErrors: 0,
  lastConnectionError: null as Error | null,
};

// Generate a unique connection ID
function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Initialize WebSocket server
export function initializeWebSocketServer(httpServer: Server) {
  console.log("EMERGENCY: WebSocket server disabled to fix notification data integrity issue");
  return; // Completely disable WebSocket server
    
    // Handle pings to keep connection alive
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle authentication message
    ws.on('message', (message: string) => {
      try {
        // Update last activity timestamp
        ws.lastActivity = Date.now();
        
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === 'auth' && data.userId) {
          const userId = parseInt(data.userId);
          
          // Only process if not already authenticated or if userId is different
          if (!ws.userId || ws.userId !== userId) {
            ws.userId = userId;
            
            // Store client connection with proper error handling
            try {
              if (!connectedClients.has(userId)) {
                connectedClients.set(userId, []);
              }
              
              // Add connection to the user's connections list
              const userConnections = connectedClients.get(userId);
              if (userConnections) {
                // Check if this connection is already in the array before adding
                if (!userConnections.some(conn => conn.connectionId === ws.connectionId)) {
                  userConnections.push(ws);
                  console.log(`WebSocket client authenticated for user ${userId} (connection: ${ws.connectionId})`);
                }
              }
            } catch (mapError) {
              console.error(`Error storing WebSocket connection for user ${userId}:`, mapError);
            }
          }
        }
        
        // Handle client ping messages (heartbeat)
        else if (data.type === 'ping') {
          ws.isAlive = true;
          // Send a pong response to confirm connection is alive
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ 
                type: 'pong',
                timestamp: Date.now(),
                connectionId: ws.connectionId
              }));
            } catch (sendError) {
              console.error(`Error sending pong to connection ${ws.connectionId}:`, sendError);
            }
          }
        }
      } catch (error) {
        console.error(`WebSocket message error (connection ${ws.connectionId}):`, error);
      }
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error on connection ${ws.connectionId}:`, error);
      connectionStats.connectionErrors++;
      connectionStats.lastConnectionError = error;
    });
    
    // Handle disconnection
    ws.on('close', (code, reason) => {
      // Update connection statistics
      connectionStats.activeConnections--;
      
      // Log the disconnection with the close code
      console.log(`WebSocket connection closed: ${ws.connectionId}, code: ${code}, reason: ${reason || 'No reason provided'}`);
      
      if (ws.userId) {
        try {
          // Remove client from connected clients
          const userConnections = connectedClients.get(ws.userId);
          if (userConnections) {
            // Find by connection ID for more reliable cleanup
            const index = userConnections.findIndex(conn => conn.connectionId === ws.connectionId);
            if (index !== -1) {
              userConnections.splice(index, 1);
              console.log(`Removed connection ${ws.connectionId} for user ${ws.userId}, ${userConnections.length} connections remaining`);
            }
            
            if (userConnections.length === 0) {
              connectedClients.delete(ws.userId);
              console.log(`User ${ws.userId} has no remaining connections`);
            }
          }
        } catch (cleanupError) {
          console.error(`Error cleaning up WebSocket connection ${ws.connectionId}:`, cleanupError);
        }
      }
    });
  });
  
  // Ping all clients every 30 seconds to check if they're still alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtendedWebSocket;
      
      // Check if connection is inactive for too long (5 minutes)
      const inactivityTime = Date.now() - extWs.lastActivity;
      if (inactivityTime > 5 * 60 * 1000) {
        console.log(`Terminating inactive connection ${extWs.connectionId} (inactive for ${Math.round(inactivityTime/1000)}s)`);
        return extWs.terminate();
      }
      
      // Terminate connections that didn't respond to previous ping
      if (!extWs.isAlive) {
        console.log(`Terminating unresponsive connection ${extWs.connectionId}`);
        return extWs.terminate();
      }
      
      // Mark as not alive until pong is received
      extWs.isAlive = false;
      
      // Send ping with error handling
      try {
        extWs.ping();
      } catch (pingError) {
        console.error(`Error sending ping to connection ${extWs.connectionId}:`, pingError);
        extWs.terminate();
      }
    });
    
    // Log connection statistics periodically
    console.log(`WebSocket stats: ${connectionStats.activeConnections} active connections, ${connectionStats.totalConnections} total connections, ${connectionStats.connectionErrors} errors`);
  }, 30000);
  
  // Clear the interval when the server is closed
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  return wss;
}

// Send notification to a specific user
export function sendNotificationToUser(userId: number, notification: Notification) {
  const userConnections = connectedClients.get(userId);
  
  if (userConnections && userConnections.length > 0) {
    const message = JSON.stringify({
      type: 'notification',
      data: notification
    });
    
    userConnections.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Send notification to multiple users
export function sendNotificationToUsers(userIds: number[], notification: Notification) {
  userIds.forEach(userId => {
    sendNotificationToUser(userId, notification);
  });
}

// Get number of connected clients
export function getConnectedClientsCount(): number {
  return connectedClients.size;
}