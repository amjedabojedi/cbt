import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon database
neonConfig.webSocketConstructor = ws;
// Adding additional options for better reliability
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = "password";

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with more resilient settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3, // reduce max connections to prevent overloading
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 15000, // increase connection timeout for slower connections
  maxUses: 5000, // close pool connections after fewer uses to prevent stale connections
  allowExitOnIdle: true, // allow the pool to exit when all clients have finished
});

// Log when a new connection is created
pool.on('connect', () => {
  console.log('New database connection established');
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Database connection error:', err.message);
});

// Initialize Drizzle ORM with our pool and schema
export const db = drizzle({ client: pool, schema });
