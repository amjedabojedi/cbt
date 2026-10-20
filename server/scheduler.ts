import { processInactivityReminders } from './services/reminderService';
import { AdminRepository } from './repositories/admin.repository';
import { weeklyDigestSlot } from '../scripts/weekly_digest_schedule.cjs';

/**
 * Automatic engagement reminder scheduler
 * Runs daily to check for inactive clients and send reminders
 */

export class EngagementScheduler {
  private dailyReminderTimeout: NodeJS.Timeout | null = null;

  private weeklyDigestInterval: NodeJS.Timeout | null = null;

  private running = false;

  private generation = 0;

  private dailyCheckInFlight = false;

  private lastDailyAttemptDate: string | null = null;

  start() {
    if (this.running) return;
    this.running = true;
    this.generation++;
    console.log('[Scheduler] Starting automatic engagement reminder system...');
    
    // Saved daily time is UTC, independent of the host timezone and DST.
    this.scheduleDailyReminders();
    
    // Weekly progress digests use saved settings, refreshed every minute.
    this.scheduleWeeklyDigests();
    
    console.log('[Scheduler] Engagement reminder system started successfully');
  }

  stop() {
    this.running = false;
    this.generation++;
    if (this.dailyReminderTimeout) {
      clearTimeout(this.dailyReminderTimeout);
      this.dailyReminderTimeout = null;
    }
    
    if (this.weeklyDigestInterval) {
      clearInterval(this.weeklyDigestInterval);
      this.weeklyDigestInterval = null;
    }
    
    console.log('[Scheduler] Engagement reminder system stopped');
  }

  private scheduleDailyReminders() {
    const generation = this.generation;
    const check = () => {
      if (!this.running || generation !== this.generation) return;
      // Align to wall-clock minute boundaries, not the process startup minute.
      this.dailyReminderTimeout = setTimeout(check, 60_000 - (Date.now() % 60_000));
      void this.checkDailyReminderTime(generation);
    };
    check();
  }

  private async checkDailyReminderTime(generation: number) {
    if (this.dailyCheckInFlight) return;
    this.dailyCheckInFlight = true;
    try {
      const settings = await new AdminRepository().getEngagementSettings();
      if (!this.running || generation !== this.generation) return;
      if (settings?.reminderEnabled === false) return;
      // Only a missing settings row uses defaults; corrupt saved times fail closed.
      const time = settings ? settings.reminderTime : '09:00';
      if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        console.error('[Scheduler] Invalid saved daily reminder time; skipping');
        return;
      }
      // Use the clock after the settings read, so a slow read cannot send stale work.
      const now = new Date().toISOString();
      const date = now.slice(0, 10);
      if (now.slice(11, 16) !== time || this.lastDailyAttemptDate === date) return;
      // Process-local guard only. Durable retry/deduplication is a separate concern.
      this.lastDailyAttemptDate = date;
      await this.runDailyReminders();
    } catch {
      console.error('[Scheduler] Unable to read daily reminder settings; skipping');
    } finally {
      this.dailyCheckInFlight = false;
    }
  }

  private scheduleWeeklyDigests() {
    this.weeklyDigestInterval = setInterval(() => {
      void this.checkWeeklyDigests();
    }, 60 * 1000);
    void this.checkWeeklyDigests();
  }

  private async runDailyReminders() {
    try {
      console.log('[Scheduler] Running daily inactivity reminders...');
      
      // The service reads the saved enabled flag and inactivity threshold.
      const results = await processInactivityReminders();
      
      console.log(`[Scheduler] Daily reminders completed: ${results.sent} sent, ${results.failed} failed`);
    } catch (error) {
      console.error('[Scheduler] Error running daily reminders:', error);
    }
  }

  private async runWeeklyDigests(scheduled = true) {
    try {
      console.log('[Scheduler] Running weekly progress digests...');
      
      // Import and run the weekly digest processor
      // @ts-ignore -- CommonJS entry point shared with standalone cron
      const { createWeeklyDigestProcessor } = await import('../scripts/send_weekly_digests.cjs');
      const { pool } = await import('./db');
      const { sendEmail } = await import('./services/email');
      const { processWeeklyDigests } = createWeeklyDigestProcessor({ pool, sendEmail });
      const results = await processWeeklyDigests({ scheduled });
      
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
    // Explicit admin trigger bypasses timing, never the saved enabled switch.
    await this.runWeeklyDigests(false);
  }

  private lastWeeklySlot: string | null = null;

  private weeklyRunning = false;

  private async checkWeeklyDigests() {
    if (this.weeklyRunning) return;
    this.weeklyRunning = true;
    try {
      const settings = await new AdminRepository().getEngagementSettings();
      const slot = weeklyDigestSlot(settings && {
        weekly_digest_enabled: settings.weeklyDigestEnabled,
        weekly_digest_day: settings.weeklyDigestDay,
        weekly_digest_time: settings.weeklyDigestTime,
      });
      if (!slot || slot === this.lastWeeklySlot) return;
      this.lastWeeklySlot = slot;
      await this.runWeeklyDigests();
    } catch {
      console.error('[Scheduler] Weekly digest settings unavailable or invalid; delivery skipped');
    } finally {
      this.weeklyRunning = false;
    }
  }
}

export const engagementScheduler = new EngagementScheduler();
