import { processInactivityReminders } from './services/reminderService';
import { processWeeklyDigests } from '../scripts/send_weekly_digests';

/**
 * Automatic engagement reminder scheduler
 * Runs daily to check for inactive clients and send reminders
 */

class EngagementScheduler {
  private dailyReminderInterval: NodeJS.Timeout | null = null;
  private weeklyDigestInterval: NodeJS.Timeout | null = null;

  start() {
    console.log('[Scheduler] Starting automatic engagement reminder system...');
    
    // Daily inactivity reminders at 9 AM
    this.scheduleDailyReminders();
    
    // Weekly progress digests on Sundays at 8 AM
    this.scheduleWeeklyDigests();
    
    console.log('[Scheduler] Engagement reminder system started successfully');
  }

  stop() {
    if (this.dailyReminderInterval) {
      clearInterval(this.dailyReminderInterval);
      this.dailyReminderInterval = null;
    }
    
    if (this.weeklyDigestInterval) {
      clearInterval(this.weeklyDigestInterval);
      this.weeklyDigestInterval = null;
    }
    
    console.log('[Scheduler] Engagement reminder system stopped');
  }

  private scheduleDailyReminders() {
    // Check every hour to see if it's time to send daily reminders
    this.dailyReminderInterval = setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Run daily reminders at 9 AM
      if (hour === 9) {
        await this.runDailyReminders();
      }
    }, 60 * 60 * 1000); // Check every hour

    // Also run immediately if it's currently 9 AM
    const now = new Date();
    if (now.getHours() === 9) {
      setTimeout(() => this.runDailyReminders(), 5000); // Run after 5 seconds
    }
  }

  private scheduleWeeklyDigests() {
    // Check every hour to see if it's time to send weekly digests
    this.weeklyDigestInterval = setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      
      // Run weekly digests on Sundays at 8 AM
      if (dayOfWeek === 0 && hour === 8) {
        await this.runWeeklyDigests();
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  private async runDailyReminders() {
    try {
      console.log('[Scheduler] Running daily inactivity reminders...');
      
      const results = await processInactivityReminders({
        inactivityThreshold: 3, // 3 days of inactivity
        sendEmails: true,
        createNotifications: true
      });
      
      console.log(`[Scheduler] Daily reminders completed: ${results.sent} sent, ${results.failed} failed`);
    } catch (error) {
      console.error('[Scheduler] Error running daily reminders:', error);
    }
  }

  private async runWeeklyDigests() {
    try {
      console.log('[Scheduler] Running weekly progress digests...');
      
      // Import and run the weekly digest processor
      const { processWeeklyDigests } = await import('../scripts/send_weekly_digests');
      const results = await processWeeklyDigests();
      
      console.log(`[Scheduler] Weekly digests completed:`, results);
    } catch (error) {
      console.error('[Scheduler] Error running weekly digests:', error);
    }
  }

  // Manual trigger methods for testing
  async triggerDailyReminders() {
    console.log('[Scheduler] Manually triggering daily reminders...');
    await this.runDailyReminders();
  }

  async triggerWeeklyDigests() {
    console.log('[Scheduler] Manually triggering weekly digests...');
    await this.runWeeklyDigests();
  }
}

export const engagementScheduler = new EngagementScheduler();