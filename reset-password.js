import crypto from 'crypto';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import fs from 'fs';

// Import schema from shared location
import * as schema from './shared/schema.js';

// Utility to hash passwords the same way our auth system does
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

// Reset password for a specific user
async function resetPassword() {
  // Initialize database connection
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  const email = 'amjadabu@hotmail.com';
  const newPassword = '123456';
  
  try {
    console.log(`Resetting password for user with email: ${email}`);
    
    // First, get the user
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
    
    if (!users || users.length === 0) {
      console.error('User not found');
      process.exit(1);
    }
    
    const user = users[0];
    console.log(`Found user: ${user.username} (ID: ${user.id})`);
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    console.log(`New password hash created: ${hashedPassword.substring(0, 20)}...`);
    
    // Update the user record
    const result = await db.update(schema.users)
      .set({ password: hashedPassword })
      .where(eq(schema.users.id, user.id))
      .returning();
    
    console.log(`Password reset successful for user ID ${user.id}`);
    console.log(`New login credentials: ${email} / ${newPassword}`);
    
    // Write success to a file for reference
    fs.writeFileSync('password-reset-result.log', 
      `Password reset successful for user: ${user.username} (${email})\n` +
      `Time: ${new Date().toISOString()}\n` +
      `New login credentials: ${email} / ${newPassword}\n`
    );
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await pool.end();
  }
}

resetPassword();