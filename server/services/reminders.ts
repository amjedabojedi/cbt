import { storage } from '../storage';
import { 
  createEmotionTrackingReminder, 
  createJournalReminderNotification, 
  createWeeklyProgressNotification 
} from './notifications';
import { User } from '@shared/schema';

// Schedule for different reminder types
const reminderFrequencies = {
  daily: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  weekly: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
  biweekly: 14 * 24 * 60 * 60 * 1000, // 2 weeks in milliseconds
  monthly: 30 * 24 * 60 * 60 * 1000 // approximately 1 month in milliseconds
};

// Track last reminders sent
const lastReminders: Record<string, Record<number, Date>> = {
  emotion: {},
  journal: {},
  progress: {}
};

/**
 * Send emotion tracking reminders to users
 */
export async function sendEmotionTrackingReminders(): Promise<void> {
  try {
    const users = await storage.getAllUsers();
    
    for (const user of users) {
      if (user.role !== 'client') continue;
      
      // Get user preferences
      const preferences = await storage.getNotificationPreferences(user.id);
      
      // Skip if reminders are disabled
      if (preferences?.emotionReminders === false) continue;
      
      // Determine frequency (default to daily if not set)
      const frequency = preferences?.reminderFrequency || 'daily';
      const interval = reminderFrequencies[frequency];
      
      // Check if it's time to send a reminder
      const now = new Date();
      const lastReminder = lastReminders.emotion[user.id] || new Date(0);
      
      if (now.getTime() - lastReminder.getTime() >= interval) {
        await createEmotionTrackingReminder(user.id);
        lastReminders.emotion[user.id] = now;
        console.log(`Sent emotion tracking reminder to user ${user.id}`);
      }
    }
  } catch (error) {
    console.error('Error sending emotion tracking reminders:', error);
  }
}

/**
 * Send journal reminders to users
 */
export async function sendJournalReminders(): Promise<void> {
  try {
    const users = await storage.getAllUsers();
    
    for (const user of users) {
      if (user.role !== 'client') continue;
      
      // Get user preferences
      const preferences = await storage.getNotificationPreferences(user.id);
      
      // Skip if reminders are disabled
      if (preferences?.journalReminders === false) continue;
      
      // Determine frequency (default to daily if not set)
      const frequency = preferences?.reminderFrequency || 'daily';
      const interval = reminderFrequencies[frequency];
      
      // Check if it's time to send a reminder
      const now = new Date();
      const lastReminder = lastReminders.journal[user.id] || new Date(0);
      
      if (now.getTime() - lastReminder.getTime() >= interval) {
        await createJournalReminderNotification(user.id);
        lastReminders.journal[user.id] = now;
        console.log(`Sent journal reminder to user ${user.id}`);
      }
    }
  } catch (error) {
    console.error('Error sending journal reminders:', error);
  }
}

/**
 * Send weekly progress digests to users
 */
export async function sendWeeklyProgressDigests(): Promise<void> {
  try {
    const users = await storage.getAllUsers();
    
    for (const user of users) {
      if (user.role !== 'client') continue;
      
      // Get user preferences
      const preferences = await storage.getNotificationPreferences(user.id);
      
      // Skip if progress summaries are disabled
      if (preferences?.progressSummaries === false) continue;
      
      // Weekly interval for progress digests
      const interval = reminderFrequencies.weekly;
      
      // Check if it's time to send a digest
      const now = new Date();
      const lastDigest = lastReminders.progress[user.id] || new Date(0);
      
      if (now.getTime() - lastDigest.getTime() >= interval) {
        await createWeeklyProgressNotification(user.id);
        lastReminders.progress[user.id] = now;
        console.log(`Sent weekly progress digest to user ${user.id}`);
      }
    }
  } catch (error) {
    console.error('Error sending weekly progress digests:', error);
  }
}

/**
 * Initialize the reminder system
 */
export function initializeReminderSystem(): void {
  console.log('Initializing reminder system');
  
  // Schedule emotion tracking reminders every 12 hours
  setInterval(sendEmotionTrackingReminders, 12 * 60 * 60 * 1000);
  
  // Schedule journal reminders every 24 hours
  setInterval(sendJournalReminders, 24 * 60 * 60 * 1000);
  
  // Schedule weekly progress digests every 3.5 days (to vary the time)
  setInterval(sendWeeklyProgressDigests, 3.5 * 24 * 60 * 60 * 1000);
  
  // Also run immediately to populate initial reminders
  setTimeout(() => {
    sendEmotionTrackingReminders();
    sendJournalReminders();
    sendWeeklyProgressDigests();
  }, 60 * 1000); // Wait 1 minute after server startup
}