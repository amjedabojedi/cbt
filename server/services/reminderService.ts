import { db } from '../db';
import { sendEmail } from './email';
import { users, emotionRecords } from '@shared/schema';
import { eq, lt, and, sql, or } from 'drizzle-orm';
import { createNotification } from './notificationService';

/**
 * System for detecting client inactivity and sending reminders
 * Uses SparkPost for email delivery
 */

interface ReminderConfig {
  // Days of inactivity before sending a reminder
  inactivityThreshold: number;
  // Whether to send emails
  sendEmails: boolean;
  // Whether to create in-app notifications
  createNotifications: boolean;
}

// Reminder template for emails
const REMINDER_EMAIL_TEMPLATE = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #3b82f6; margin-bottom: 10px;">ResilienceHub™ Activity Reminder</h1>
    <p style="color: #4b5563; font-size: 16px;">We've noticed you haven't been active on ResilienceHub™ recently.</p>
  </div>
  
  <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
    <p style="color: #4b5563; font-size: 15px;">Regular tracking of your emotions, thoughts, and activities helps you:</p>
    <ul style="color: #4b5563;">
      <li>Recognize patterns in your emotional responses</li>
      <li>Develop greater self-awareness</li>
      <li>Improve your emotional regulation skills</li>
      <li>Track your progress toward personal goals</li>
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
export async function findInactiveClients(days: number): Promise<any[]> {
  try {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // First get clients who have at least one emotion record
    const activeUsersQuery = db.select({ userId: emotionRecords.userId })
      .from(emotionRecords)
      .groupBy(emotionRecords.userId);
    
    // Get the list of client IDs who have logged emotions before
    const activeUserResults = await activeUsersQuery;
    const activeUserIds = activeUserResults.map(result => result.userId);
    
    if (activeUserIds.length === 0) {
      return [];
    }
    
    // Find clients who haven't recorded emotions since the cutoff date
    const inactiveClientsQuery = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      therapistId: users.therapistId,
      lastActivity: sql<string>`MAX(${emotionRecords.timestamp})`.as('last_activity')
    })
    .from(users)
    .leftJoin(emotionRecords, eq(users.id, emotionRecords.userId))
    .where(
      and(
        eq(users.role, 'client'),
        eq(users.status, 'active'),
        sql`${users.id} IN (${activeUserIds.join(',')})`
      )
    )
    .groupBy(users.id)
    .having(
      or(
        sql`MAX(${emotionRecords.timestamp}) < ${cutoffDate.toISOString()}`,
        sql`MAX(${emotionRecords.timestamp}) IS NULL`
      )
    );
    
    const inactiveClients = await inactiveClientsQuery;
    return inactiveClients;
  } catch (error) {
    console.error('Error finding inactive clients:', error);
    return [];
  }
}

/**
 * Send email and in-app notifications to inactive clients
 */
export async function sendReminderToClient(
  clientId: number, 
  clientEmail: string, 
  clientName: string,
  config: ReminderConfig
): Promise<boolean> {
  try {
    let success = true;
    const appUrl = process.env.APP_URL || 'https://2afc12da-a46a-4189-baec-8b01e2d4ebaf-00-3h69oaxj28v0x.kirk.replit.dev';
    
    // Send email reminder if configured
    if (config.sendEmails) {
      const emailContent = REMINDER_EMAIL_TEMPLATE.replace('{{loginUrl}}', `${appUrl}/auth`);
      
      const emailResult = await sendEmail({
        to: clientEmail,
        subject: 'ResilienceHub™ - Activity Reminder',
        html: emailContent
      });
      
      if (!emailResult) {
        console.warn(`Failed to send reminder email to client ${clientId} (${clientEmail})`);
        success = false;
      }
    }
    
    // Create in-app notification if configured
    if (config.createNotifications) {
      try {
        await createNotification({
          userId: clientId,
          title: 'ResilienceHub™ Activity Reminder',
          body: `It's been ${config.inactivityThreshold} days since you last used ResilienceHub™. Regular tracking of emotions, thoughts, and activities helps build self-awareness and improve therapy outcomes.`,
          type: 'reminder',
          isRead: false
        });
      } catch (notifError) {
        console.error(`Failed to create reminder notification for client ${clientId}:`, notifError);
        success = false;
      }
    }
    
    return success;
  } catch (error) {
    console.error(`Error sending reminder to client ${clientId}:`, error);
    return false;
  }
}

/**
 * Main function to check for inactive clients and send reminders
 */
export async function processInactivityReminders(config: ReminderConfig = { 
  inactivityThreshold: 3, // Default: 3 days of inactivity 
  sendEmails: true,
  createNotifications: true
}): Promise<{ sent: number, failed: number }> {
  console.log(`[${new Date().toISOString()}] Starting inactivity reminder process`);
  console.log(`Checking for clients inactive for ${config.inactivityThreshold} days or more`);
  
  let sent = 0;
  let failed = 0;
  
  try {
    // Find clients who haven't tracked emotions recently
    const inactiveClients = await findInactiveClients(config.inactivityThreshold);
    console.log(`Found ${inactiveClients.length} inactive clients`);
    
    // Process each inactive client
    for (const client of inactiveClients) {
      const success = await sendReminderToClient(
        client.id,
        client.email,
        client.name,
        config
      );
      
      if (success) {
        sent++;
        console.log(`Successfully sent reminder to client ${client.id} (${client.email})`);
      } else {
        failed++;
        console.warn(`Failed to send reminder to client ${client.id} (${client.email})`);
      }
    }
    
    console.log(`[${new Date().toISOString()}] Completed inactivity reminder process`);
    console.log(`Results: ${sent} sent, ${failed} failed`);
    
    return { sent, failed };
  } catch (error) {
    console.error('Error processing inactivity reminders:', error);
    return { sent, failed };
  }
}