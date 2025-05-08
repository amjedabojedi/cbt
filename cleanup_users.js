// Script to delete all users except the admin
const { db } = require('./server/db');
const { eq, ne } = require('drizzle-orm');
const { users } = require('./shared/schema');
const { storage } = require('./server/storage');

async function cleanupUsers() {
  try {
    // Get all users except admin
    const allUsers = await db.select().from(users).where(ne(users.role, 'admin'));
    
    console.log(`Found ${allUsers.length} non-admin users to delete`);
    
    // Delete each user
    for (const user of allUsers) {
      console.log(`Deleting user ${user.id}: ${user.username} (${user.role})`);
      
      try {
        // Use the enhanced deleteUser method with admin ID 1 for proper logging
        await storage.deleteUser(user.id, 1);
        console.log(`Deleted user ${user.id} successfully`);
      } catch (error) {
        console.error(`Error deleting user ${user.id}:`, error);
      }
    }
    
    console.log('User cleanup completed');
  } catch (error) {
    console.error('Error in cleanup script:', error);
  } finally {
    process.exit(0);
  }
}

cleanupUsers();
