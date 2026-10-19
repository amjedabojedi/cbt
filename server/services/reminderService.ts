import { sendEmail } from './email';
import { createNotification } from './notificationService';
import { engagementDays, getAdminClientEngagement } from './adminEngagement';
import { AdminRepository } from '../repositories/admin.repository';

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
    <p style="color: #4b5563; font-size: 16px;">It's been a while since you saved an emotion record on ResilienceHub™. If you haven't saved one yet, this is a reminder to get started when you're ready.</p>
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
 * Use the same eligible accounts, saved dates, grace period, and inclusive
 * full-day cutoff as the admin report. Other tools do not reset this clock.
 */
export async function findInactiveClients(days: number) {
  const clients = await getAdminClientEngagement(engagementDays(days));
  return clients.filter(client => client.inactive).map(client => ({
    ...client,
    lastActivity: client.lastEmotionAt ?? client.createdAt,
  }));
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
    const appUrl = process.env.APP_URL || 'https://resiliencehub.replit.app';
    
    // Send email reminder if configured
    if (config.sendEmails) {
      const emailContent = REMINDER_EMAIL_TEMPLATE.replace('{{loginUrl}}', `${appUrl}`);
      
      const emailResult = await sendEmail({
        to: clientEmail,
        subject: 'ResilienceHub™ - Activity Reminder',
        html: emailContent
      });
      
      if (!emailResult) {
        console.warn(`Failed to send reminder email to client ${clientId}`);
        success = false;
      }
    }
    
    // Create in-app notification if configured
    if (config.createNotifications) {
      try {
        await createNotification({
          userId: clientId,
          title: 'ResilienceHub™ Activity Reminder',
          body: `You haven't saved an emotion record in at least ${config.inactivityThreshold} days, or haven't saved your first one yet. You can record how you're feeling when you're ready.`,
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
export async function processInactivityReminders(config?: ReminderConfig): Promise<{ sent: number, failed: number }> {
  // Scheduled runs (including the admin scheduler trigger) use persisted settings.
  // Explicit configs are reserved for callers intentionally choosing a threshold.
  if (!config) {
    const settings = await new AdminRepository().getEngagementSettings();
    if (settings?.reminderEnabled === false) return { sent: 0, failed: 0 };
    config = {
      inactivityThreshold: engagementDays(settings?.reminderDays),
      sendEmails: true,
      createNotifications: true,
    };
  }
  config = { ...config, inactivityThreshold: engagementDays(config.inactivityThreshold) };
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
        console.log(`Successfully sent reminder to client ${client.id}`);
      } else {
        failed++;
        console.warn(`Failed to send reminder to client ${client.id}`);
      }
    }
    
    console.log(`[${new Date().toISOString()}] Completed inactivity reminder process`);
    console.log(`Results: ${sent} sent, ${failed} failed`);
    
    return { sent, failed };
  } catch (error) {
    console.error('Error processing inactivity reminders:', error);
    throw error;
  }
}