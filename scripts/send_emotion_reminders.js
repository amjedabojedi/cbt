/**
 * Send emotion tracking reminders to users who haven't tracked in 2 days
 * 
 * This script is designed to be run by a cron job, e.g.:
 * 0 10 * * * /path/to/node /path/to/send_emotion_reminders.js
 * (This would run daily at 10:00 AM)
 */

// Setup database connection
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Find clients who haven't recorded emotions in the specified number of days
 */
async function findInactiveClients(days) {
  try {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Find clients who haven't recorded emotions since the cutoff date
    const query = `
      SELECT u.id, u.name, u.email, u.therapist_id as "therapistId"
      FROM users u
      WHERE u.role = 'client' 
        AND u.status = 'active'
        AND (
          -- Has tracked emotions before
          EXISTS (SELECT 1 FROM emotion_records e WHERE e.user_id = u.id)
          -- But not since cutoff date
          AND NOT EXISTS (
            SELECT 1 FROM emotion_records e 
            WHERE e.user_id = u.id 
            AND e.timestamp > $1
          )
        )
    `;
    
    const result = await pool.query(query, [cutoffDate.toISOString()]);
    return result.rows;
  } catch (error) {
    console.error('Error finding inactive clients:', error);
    return [];
  }
}

/**
 * Send email reminder to a client
 */
async function sendEmailReminder(client) {
  try {
    // If we have SparkPost API key, use real email system from server
    if (process.env.SPARKPOST_API_KEY) {
      // Import actual email service
      const { sendEmotionTrackingReminder } = require('../server/services/email');
      return await sendEmotionTrackingReminder(client.email, client.name);
    } else {
      // Log mock email for development
      console.log(`[MOCK EMAIL] Would send reminder to: ${client.name} <${client.email}>`);
      console.log(`Subject: Reminder: Track Your Emotions with ResilienceHub™`);
      console.log(`Body: Regular emotion tracking helps build self-awareness and can lead to better therapy outcomes...`);
      return true;
    }
  } catch (error) {
    console.error(`Error sending email to ${client.email}:`, error);
    return false;
  }
}

/**
 * Create in-app notification for a client
 */
async function createNotification(clientId) {
  try {
    // Create notification in database
    const notificationData = {
      title: "Emotion Tracking Reminder",
      body: "It's been a while since you last recorded your emotions. Regular tracking helps build self-awareness and improve therapy outcomes.",
      type: "reminder",
      is_read: false,
      created_at: new Date()
    };
    
    const query = `
      INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const result = await pool.query(query, [
      clientId,
      notificationData.title,
      notificationData.body,
      notificationData.type,
      notificationData.is_read,
      notificationData.created_at
    ]);
    
    console.log(`Created notification for user ${clientId} with ID ${result.rows[0].id}`);
    return true;
  } catch (error) {
    console.error(`Error creating notification for user ${clientId}:`, error);
    return false;
  }
}

/**
 * Main function to process reminders
 */
async function processReminders() {
  try {
    console.log('Starting emotion tracking reminder process...');
    
    // Find clients who haven't tracked emotions in the last 2 days
    const daysThreshold = 2;
    const inactiveClients = await findInactiveClients(daysThreshold);
    console.log(`Found ${inactiveClients.length} clients who haven't tracked emotions in ${daysThreshold} days`);
    
    // Process each inactive client
    let notificationsSent = 0;
    let emailsSent = 0;
    
    for (const client of inactiveClients) {
      console.log(`Processing client: ${client.name} (ID: ${client.id})`);
      
      // Create in-app notification
      const notificationCreated = await createNotification(client.id);
      if (notificationCreated) notificationsSent++;
      
      // Send email reminder
      const emailSent = await sendEmailReminder(client);
      if (emailSent) emailsSent++;
    }
    
    console.log(`Reminder process complete. Sent ${notificationsSent} in-app notifications and ${emailsSent} emails.`);
    
    // Close the database connection
    await pool.end();
    
    return {
      inactiveClients: inactiveClients.length,
      notificationsSent,
      emailsSent
    };
  } catch (error) {
    console.error('Error processing reminders:', error);
    await pool.end();
    return { error: error.message };
  }
}

// If this script is run directly (not imported), execute the main function
if (require.main === module) {
  processReminders()
    .then(result => {
      console.log('Process completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Process failed:', error);
      process.exit(1);
    });
}

// Export functions for use in other scripts or tests
module.exports = {
  findInactiveClients,
  sendEmailReminder,
  createNotification,
  processReminders
};