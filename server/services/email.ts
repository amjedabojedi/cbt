/**
 * Email service for ResilienceHub
 * 
 * This simplified version logs email attempts without actually sending them,
 * to allow the rest of the application to function while we implement the email integration.
 */

// Email sending functions
export async function sendEmail(options: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}): Promise<boolean> {
  console.log(`[EMAIL SERVICE] Would send email to ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`From: ${options.from || 'notifications@resilience-hub.com'}`);
  
  // In a real implementation, this would connect to SparkPost or another email provider
  console.log('Email content was logged but not sent (SparkPost integration pending)');
  
  // For testing purposes, we'll return success
  return true;
}

/**
 * Send emotion tracking reminder email
 */
export async function sendEmotionTrackingReminder(email: string, name: string): Promise<boolean> {
  console.log(`[EMAIL SERVICE] Would send emotion tracking reminder to ${email} (${name})`);
  
  // In a real implementation, this would send an email through SparkPost
  return true;
}

/**
 * Send weekly progress digest email
 */
export async function sendWeeklyProgressDigest(
  email: string,
  name: string,
  summary: string,
  completedGoals: number,
  trackedEmotions: number,
  completedThoughts: number
): Promise<boolean> {
  console.log(`[EMAIL SERVICE] Would send weekly progress digest to ${email} (${name})`);
  
  // In a real implementation, this would send an email through SparkPost
  return true;
}

/**
 * Check if email functionality is available
 */
export function isEmailEnabled(): boolean {
  // We'll return false since we don't have actual email capability yet
  return false;
}