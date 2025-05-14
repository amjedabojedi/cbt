const crypto = require('crypto');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { eq } = require('drizzle-orm');
const fs = require('fs');
const ws = require('ws');

// Configure neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Scrypt password hashing function
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function resetPassword() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Initialize database connection
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  const email = 'amjadabu@hotmail.com';
  const newPassword = '123456';
  
  try {
    console.log(`Resetting password for user with email: ${email}`);
    
    // First, get the user by email
    const { rows: users } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
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
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
      [hashedPassword, user.id]
    );
    
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