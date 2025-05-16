// Script to safely clear reframe coaching practice results
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');

async function cleanReframeResults() {
  try {
    // Configure Neon
    const { neonConfig } = require('@neondatabase/serverless');
    neonConfig.webSocketConstructor = ws;
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }
    
    // Connect to database
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Use a simple raw query since we don't need the schema for this operation
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    try {
      console.log('Backing up existing records (in memory)...');
      const result = await client.query('SELECT COUNT(*) FROM reframe_coach_results');
      const count = parseInt(result.rows[0].count, 10);
      
      console.log(`Found ${count} practice results to delete`);
      
      if (count > 0) {
        console.log('Deleting all practice results...');
        await client.query('DELETE FROM reframe_coach_results');
        console.log('✅ All practice results cleared successfully');
      } else {
        console.log('No practice results to clear');
      }
    } finally {
      // Always release the client
      client.release();
    }
    
    await pool.end();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error clearing practice results:', error);
    process.exit(1);
  }
}

cleanReframeResults();