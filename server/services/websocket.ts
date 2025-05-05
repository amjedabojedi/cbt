import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Notification } from '@shared/schema';

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  isAlive: boolean;
}

// Store connected clients by userId
const connectedClients: Map<number, ExtendedWebSocket[]> = new Map();

// Initialize WebSocket server
export function initializeWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  console.log("WebSocket server initialized at /ws");

  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.isAlive = true;
    
    // Handle pings to keep connection alive
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle authentication message
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === 'auth' && data.userId) {
          const userId = parseInt(data.userId);
          ws.userId = userId;
          
          // Store client connection
          if (!connectedClients.has(userId)) {
            connectedClients.set(userId, []);
          }
          connectedClients.get(userId)?.push(ws);
          
          console.log(`WebSocket client authenticated for user ${userId}`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      if (ws.userId) {
        // Remove client from connected clients
        const userConnections = connectedClients.get(ws.userId);
        if (userConnections) {
          const index = userConnections.indexOf(ws);
          if (index !== -1) {
            userConnections.splice(index, 1);
          }
          
          if (userConnections.length === 0) {
            connectedClients.delete(ws.userId);
          }
        }
      }
    });
  });
  
  // Ping all clients every 30 seconds to check if they're still alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
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