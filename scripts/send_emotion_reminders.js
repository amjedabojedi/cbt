/**
 * Send emotion tracking reminders to users who haven't tracked in 2 days
 * 
 * This script is designed to be run by a cron job, e.g.:
 * 0 10 * * * /path/to/node /path/to/send_emotion_reminders.js
 * (This would run daily at 10:00 AM)
 */

require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { eq, and, sql, lt, gt } = require('drizzle-orm');
const SparkPost = require('sparkpost');

// Initialize SparkPost client
const sparkpost = process.env.SPARKPOST_API_KEY 
  ? new SparkPost(process.env.SPARKPOST_API_KEY)
  : null;

// Database connection
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

// Email templates
const reminderEmailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #3b82f6; margin-bottom: 10px;">Emotion Check-In Reminder</h1>
    <p style="color: #4b5563; font-size: 16px;">We've noticed you haven't recorded your emotions recently.</p>
  </div>
  
  <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
    <p style="color: #4b5563; font-size: 15px;">Regular emotion tracking helps you:</p>
    <ul style="color: #4b5563;">
      <li>Recognize patterns in your emotional responses</li>
      <li>Develop greater emotional awareness</li>
      <li>Improve your emotional regulation skills</li>
      <li>Provide valuable insights for your therapy journey</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin-top: 25px;">
    <a href="{{loginUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log In Now</a>
  </div>
  
  <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
    If you'd prefer not to receive these reminders, you can update your notification preferences in your account settings.
  </p>
</div>
`;

/**
 * Find clients who haven't recorded emotions in the specified number of days
 */
async function findInactiveClients(days) {
  try {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Find clients who have emotion records but haven't tracked since the cutoff date
    const query = `
      SELECT u.id, u.name, u.email, u.therapist_id
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
    
    const result = await pool.query(query, [cutoffDate]);
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
  if (!sparkpost) {
    console.warn('SparkPost API key not configured. Email not sent.');
    return false;
  }
  
  try {
    const appUrl = process.env.APP_URL || 'https://resilience-hub.replit.app';
    const loginUrl = `${appUrl}/login`;
    
    const emailContent = reminderEmailHtml.replace('{{loginUrl}}', loginUrl);
    
    const transmission = {
      content: {
        from: {
          name: "ResilienceHub™",
          email: "notifications@resilience-hub.com"
        },
        subject: "Emotion Tracking Reminder",
        html: emailContent
      },
      recipients: [
        { address: client.email }
      ]
    };
    
    const result = await sparkpost.transmissions.send(transmission);
    console.log(`Email sent to ${client.email}, result:`, result);
    return true;
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
    const notification = {
      user_id: clientId,
      title: "Emotion Tracking Reminder",
      body: "It's been a few days since you last recorded your emotions. Regular tracking helps build self-awareness and improve therapy outcomes.",
      type: "reminder",
      is_read: false
    };
    
    const query = `
      INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
    `;
    
    const result = await pool.query(query, [
      notification.user_id,
      notification.title,
      notification.body,
      notification.type,
      notification.is_read
    ]);
    
    console.log(`Created notification ${result.rows[0].id} for client ${clientId}`);
    return true;
  } catch (error) {
    console.error(`Error creating notification for client ${clientId}:`, error);
    return false;
  }
}

/**
 * Main function to process reminders
 */
async function processReminders() {
  console.log(`[${new Date().toISOString()}] Starting emotion tracking reminder process`);
  
  try {
    // Configuration
    const inactivityDays = 3; // Send reminders after 3 days of inactivity
    const sendEmails = true;
    const createNotifications = true;
    
    // Find inactive clients
    const inactiveClients = await findInactiveClients(inactivityDays);
    console.log(`Found ${inactiveClients.length} clients inactive for ${inactivityDays}+ days`);
    
    // Process each client
    let emailsSent = 0;
    let notificationsCreated = 0;
    
    for (const client of inactiveClients) {
      console.log(`Processing client ${client.id} (${client.name})`);
      
      // Send email reminder
      if (sendEmails) {
        const emailSent = await sendEmailReminder(client);
        if (emailSent) emailsSent++;
      }
      
      // Create in-app notification
      if (createNotifications) {
        const notificationCreated = await createNotification(client.id);
        if (notificationCreated) notificationsCreated++;
      }
    }
    
    console.log(`Reminder process complete. Results: ${emailsSent} emails sent, ${notificationsCreated} notifications created`);
  } catch (error) {
    console.error('Error processing reminders:', error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  processReminders()
    .then(() => console.log('Reminder process completed'))
    .catch(err => console.error('Error in reminder process:', err));
}

module.exports = { processReminders };