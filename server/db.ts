import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon database
neonConfig.webSocketConstructor = ws;
// Adding additional options for better reliability
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = "password";
// Set longer read timeout
neonConfig.readTimeoutMillis = 60000;

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with optimized settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Increase pool size for better concurrency
  min: 2, // Keep minimum connections alive
  idleTimeoutMillis: 60000, // Longer idle timeout
  connectionTimeoutMillis: 10000, // Faster connection timeout
  maxUses: 7500, // More uses before recycling
  allowExitOnIdle: false, // Keep pool alive
});

// Add retry mechanism for database operations
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Helper function to retry database operations
export async function withRetry<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`Database operation failed, retrying in ${RETRY_DELAY_MS}ms... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    return withRetry(operation, retries - 1);
  }
}

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
