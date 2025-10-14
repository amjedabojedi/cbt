/**
 * Send weekly progress digest emails to all users
 * 
 * This script is designed to be run by a cron job, e.g.:
 * 0 8 * * 1 /path/to/node /path/to/send_weekly_digests.cjs
 * (This would run every Monday at 8:00 AM)
 */

// Setup database connection
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get user activity summary for the past week
 */
async function getUserWeeklySummary(userId) {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Format dates for SQL query
    const startDate = formatDate(oneWeekAgo);
    const endDate = formatDate(now);
    
    // Get emotion records count
    const emotionQuery = `
      SELECT COUNT(*) as count 
      FROM emotion_records 
      WHERE user_id = $1 
      AND timestamp BETWEEN $2 AND $3
    `;
    const emotionResult = await pool.query(emotionQuery, [userId, startDate, endDate]);
    const emotionsTracked = parseInt(emotionResult.rows[0].count, 10);
    
    // Get journal entries count
    const journalQuery = `
      SELECT COUNT(*) as count 
      FROM journal_entries 
      WHERE user_id = $1 
      AND created_at BETWEEN $2 AND $3
    `;
    const journalResult = await pool.query(journalQuery, [userId, startDate, endDate]);
    const journalEntries = parseInt(journalResult.rows[0].count, 10);
    
    // Get thought records count
    const thoughtQuery = `
      SELECT COUNT(*) as count 
      FROM thought_records 
      WHERE user_id = $1 
      AND created_at BETWEEN $2 AND $3
    `;
    const thoughtResult = await pool.query(thoughtQuery, [userId, startDate, endDate]);
    const thoughtRecords = parseInt(thoughtResult.rows[0].count, 10);
    
    // Get goals progress
    const goalsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM goals
      WHERE user_id = $1
      AND (created_at BETWEEN $2 AND $3 OR updated_at BETWEEN $2 AND $3)
    `;
    const goalsResult = await pool.query(goalsQuery, [userId, startDate, endDate]);
    
    // Calculate percentage if there are goals
    let goalsProgress = 'No updates';
    if (goalsResult.rows[0].total > 0) {
      const percentage = Math.round((goalsResult.rows[0].completed / goalsResult.rows[0].total) * 100);
      goalsProgress = `${percentage}% (${goalsResult.rows[0].completed}/${goalsResult.rows[0].total})`;
    }
    
    // Get the most tracked emotion
    const mostTrackedEmotionQuery = `
      SELECT core_emotion as emotion, COUNT(*) as count
      FROM emotion_records
      WHERE user_id = $1
      AND timestamp BETWEEN $2 AND $3
      GROUP BY core_emotion
      ORDER BY count DESC
      LIMIT 1
    `;
    const emotionResult2 = await pool.query(mostTrackedEmotionQuery, [userId, startDate, endDate]);
    const mostTrackedEmotion = emotionResult2.rows.length > 0 
      ? emotionResult2.rows[0].emotion 
      : null;
    
    return {
      emotionsTracked,
      journalEntries,
      thoughtRecords,
      goalsProgress,
      mostTrackedEmotion,
      startDate,
      endDate
    };
  } catch (error) {
    console.error(`Error getting weekly summary for user ${userId}:`, error);
    return {
      emotionsTracked: 0,
      journalEntries: 0,
      thoughtRecords: 0,
      goalsProgress: 'Error getting data',
      mostTrackedEmotion: null,
      startDate: null,
      endDate: null
    };
  }
}

/**
 * Generate email content based on user activity
 */
function generateEmailContent(user, summary) {
  // Generate personalized insight based on activity
  let insight = '';
  const totalActivity = summary.emotionsTracked + summary.journalEntries + summary.thoughtRecords;
  
  if (totalActivity === 0) {
    insight = "We haven't seen much activity from you this week. Regular engagement with the app helps build emotional awareness and resilience. Even a quick check-in can make a difference!";
  } else if (summary.emotionsTracked > 0 && summary.thoughtRecords === 0) {
    insight = "Great job tracking your emotions! Consider adding thought records to help identify patterns in your thinking that might be affecting your emotions.";
  } else if (summary.mostTrackedEmotion) {
    insight = `We noticed that '${summary.mostTrackedEmotion}' was your most recorded emotion this week. Recognizing emotional patterns is a key step toward improved well-being.`;
  } else {
    insight = "Keep up the great work using ResilienceHub™ to support your mental health journey!";
  }
  
  return {
    subject: `Your Weekly Progress Report (${summary.startDate} to ${summary.endDate})`,
    text: `
Hello ${user.name},

Here's your weekly progress report from ResilienceHub™:

• Emotions tracked: ${summary.emotionsTracked}
• Journal entries: ${summary.journalEntries}
• Thought records completed: ${summary.thoughtRecords}
• Goals progress: ${summary.goalsProgress}

${insight}

Log in to your ResilienceHub™ account to see more detailed analytics and insights.

Wishing you continued growth,
Resilience Counseling Research and Consultation Team
`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4f46e5;">Hello ${user.name},</h2>
  
  <p>Here's your weekly progress report from ResilienceHub™:</p>
  
  <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Emotions tracked:</strong> ${summary.emotionsTracked}</p>
    <p><strong>Journal entries:</strong> ${summary.journalEntries}</p>
    <p><strong>Thought records completed:</strong> ${summary.thoughtRecords}</p>
    <p><strong>Goals progress:</strong> ${summary.goalsProgress}</p>
  </div>
  
  <p style="color: #4b5563; font-style: italic;">${insight}</p>
  
  <p><a href="${process.env.APP_URL || 'https://2afc12da-a46a-4189-baec-8b01e2d4ebaf-00-3h69oaxj28v0x.kirk.replit.dev'}/dashboard" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0;">View Detailed Analytics</a></p>
  
  <p>Wishing you continued growth,<br>
  Resilience Counseling Research and Consultation Team</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #666;">This email was sent as part of your therapy program with Resilience Counseling. If you believe you received this in error, please contact your therapist.</p>
</div>
`
  };
}

/**
 * Send email to a user
 */
async function sendDigestEmail(user, summary) {
  try {
    // If we have SparkPost API key, use real email system from server
    if (process.env.SPARKPOST_API_KEY) {
      // Import actual email service
      const { sendEmail } = require('../server/services/email');
      const emailContent = generateEmailContent(user, summary);
      
      return await sendEmail({
        to: user.email,
        from: "reports@resiliencehub.app",
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });
    } else {
      // Log mock email for development
      console.log(`[MOCK EMAIL] Would send weekly digest to: ${user.name} <${user.email}>`);
      console.log(`Subject: Your Weekly Progress Report (${summary.startDate} to ${summary.endDate})`);
      console.log(`Body: Weekly summary with ${summary.emotionsTracked} emotions tracked, ${summary.journalEntries} journal entries, etc.`);
      return true;
    }
  } catch (error) {
    console.error(`Error sending digest email to ${user.email}:`, error);
    return false;
  }
}

/**
 * Create in-app notification for a user
 */
async function createDigestNotification(userId, summary) {
  try {
    // Format a short message about the weekly digest
    let message = `Your weekly progress report is ready. `;
    
    if (summary.emotionsTracked > 0 || summary.journalEntries > 0 || summary.thoughtRecords > 0) {
      message += `This week you tracked ${summary.emotionsTracked} emotions, wrote ${summary.journalEntries} journal entries, and completed ${summary.thoughtRecords} thought records.`;
    } else {
      message += `We haven't seen much activity from you this week. Regular tracking helps build awareness and resilience.`;
    }
    
    // Create notification in database
    const notificationData = {
      title: "Weekly Progress Report",
      body: message,
      type: "progress_update",
      is_read: false,
      created_at: new Date()
    };
    
    const query = `
      INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const result = await pool.query(query, [
      userId,
      notificationData.title,
      notificationData.body,
      notificationData.type,
      notificationData.is_read,
      notificationData.created_at
    ]);
    
    console.log(`Created weekly digest notification for user ${userId} with ID ${result.rows[0].id}`);
    return true;
  } catch (error) {
    console.error(`Error creating digest notification for user ${userId}:`, error);
    return false;
  }
}

/**
 * Main function to process weekly digests
 */
async function processWeeklyDigests() {
  try {
    console.log('Starting weekly digest process...');
    
    // Get all active users
    const usersQuery = `
      SELECT id, name, email, role
      FROM users
      WHERE status = 'active'
    `;
    const usersResult = await pool.query(usersQuery);
    const users = usersResult.rows;
    
    console.log(`Found ${users.length} active users`);
    
    // Process each user
    let notificationsSent = 0;
    let emailsSent = 0;
    
    for (const user of users) {
      console.log(`Processing weekly digest for: ${user.name} (ID: ${user.id})`);
      
      // Get user's weekly summary
      const summary = await getUserWeeklySummary(user.id);
      
      // Create in-app notification
      const notificationCreated = await createDigestNotification(user.id, summary);
      if (notificationCreated) notificationsSent++;
      
      // Send email digest
      const emailSent = await sendDigestEmail(user, summary);
      if (emailSent) emailsSent++;
    }
    
    console.log(`Weekly digest process complete. Sent ${notificationsSent} in-app notifications and ${emailsSent} emails.`);
    
    // Close the database connection
    await pool.end();
    
    return {
      totalUsers: users.length,
      notificationsSent,
      emailsSent
    };
  } catch (error) {
    console.error('Error processing weekly digests:', error);
    await pool.end();
    return { error: error.message };
  }
}

// If this script is run directly (not imported), execute the main function
if (require.main === module) {
  processWeeklyDigests()
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
  getUserWeeklySummary,
  generateEmailContent,
  sendDigestEmail,
  createDigestNotification,
  processWeeklyDigests
};


