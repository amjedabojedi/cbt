import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Notification } from '@shared/schema';
import { URL } from 'url';

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  isAlive: boolean;
  connectionId: string;
  lastActivity: number;
}

const connectedClients = new Map<number, ExtendedWebSocket[]>();

const connectionStats = {
  activeConnections: 0,
  totalConnections: 0,
  connectionErrors: 0,
  lastConnectionError: null as Error | null
};

function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Initialize WebSocket server
export function initializeWebSocketServer(httpServer: Server) {
  console.log("EMERGENCY: WebSocket server disabled to fix notification data integrity issue");
  return; // Completely disable WebSocket server
}

export function sendNotificationToUser(userId: number, notification: Notification) {
  console.log("EMERGENCY: WebSocket notifications disabled");
  return;
}

export function sendNotificationToUsers(userIds: number[], notification: Notification) {
  console.log("EMERGENCY: WebSocket notifications disabled");
  return;
}

export function getConnectedClientsCount(): number {
  return 0; // WebSocket disabled
}