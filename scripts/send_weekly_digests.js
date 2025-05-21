/**
 * Send weekly progress digest emails to all users
 * 
 * This script is designed to be run by a cron job, e.g.:
 * 0 8 * * 1 /path/to/node /path/to/send_weekly_digests.js
 * (This would run every Monday at 8:00 AM)
 */

require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const SparkPost = require('sparkpost');
const path = require('path');

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

// Date formatting helper
function formatDate(date) {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Get user activity summary for the past week
 */
async function getUserWeeklySummary(userId) {
  try {
    // Get time range for the past week
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get emotion records count
    const emotionsQuery = `
      SELECT COUNT(*) as count,
             json_agg(DISTINCT core_emotion) as emotions
      FROM emotion_records
      WHERE user_id = $1
        AND timestamp >= $2
    `;
    const emotionsResult = await pool.query(emotionsQuery, [userId, oneWeekAgo]);
    const emotionCount = parseInt(emotionsResult.rows[0].count, 10) || 0;
    const emotions = emotionsResult.rows[0].emotions || [];
    
    // Get thought record count
    const thoughtsQuery = `
      SELECT COUNT(*) as count
      FROM thought_records
      WHERE user_id = $1
        AND created_at >= $2
    `;
    const thoughtsResult = await pool.query(thoughtsQuery, [userId, oneWeekAgo]);
    const thoughtCount = parseInt(thoughtsResult.rows[0].count, 10) || 0;
    
    // Get journal entries count
    const journalsQuery = `
      SELECT COUNT(*) as count
      FROM journal_entries
      WHERE user_id = $1
        AND created_at >= $2
    `;
    const journalsResult = await pool.query(journalsQuery, [userId, oneWeekAgo]);
    const journalCount = parseInt(journalsResult.rows[0].count, 10) || 0;
    
    // Most frequently recorded emotion
    let topEmotion = null;
    if (emotionCount > 0) {
      const topEmotionQuery = `
        SELECT core_emotion, COUNT(*) as count
        FROM emotion_records
        WHERE user_id = $1
          AND timestamp >= $2
        GROUP BY core_emotion
        ORDER BY count DESC
        LIMIT 1
      `;
      const topEmotionResult = await pool.query(topEmotionQuery, [userId, oneWeekAgo]);
      if (topEmotionResult.rows.length > 0) {
        topEmotion = topEmotionResult.rows[0].core_emotion;
      }
    }
    
    // Return the summary
    return {
      emotionCount,
      thoughtCount,
      journalCount,
      topEmotion,
      emotions: emotions.filter(e => e !== null),
      timeRange: {
        start: formatDate(oneWeekAgo),
        end: formatDate(now)
      }
    };
  } catch (error) {
    console.error(`Error getting weekly summary for user ${userId}:`, error);
    return {
      emotionCount: 0,
      thoughtCount: 0,
      journalCount: 0,
      topEmotion: null,
      emotions: [],
      timeRange: {
        start: formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        end: formatDate(new Date())
      }
    };
  }
}

/**
 * Generate email content based on user activity
 */
function generateEmailContent(user, summary) {
  // Emotion color map
  const emotionColors = {
    'Joy': '#FFD700',
    'Sadness': '#4682B4',
    'Anger': '#FF6347',
    'Fear': '#9370DB',
    'Disgust': '#32CD32',
    'Surprise': '#FF69B4',
    'Trust': '#40E0D0',
    'Anticipation': '#FFA500'
  };
  
  const totalEntries = summary.emotionCount + summary.thoughtCount + summary.journalCount;
  const hasActivity = totalEntries > 0;
  
  // Progress section
  let progressSection = '';
  if (hasActivity) {
    progressSection = `
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #3b82f6; margin-top: 0;">Your Activity Summary</h2>
        <p style="color: #4b5563;">Here's what you've accomplished from ${summary.timeRange.start} to ${summary.timeRange.end}:</p>
        
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; margin-top: 15px;">
          <div style="flex: 1; min-width: 120px; background-color: white; border-radius: 6px; padding: 15px; margin: 5px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${summary.emotionCount}</div>
            <div style="color: #6b7280;">Emotions Tracked</div>
          </div>
          
          <div style="flex: 1; min-width: 120px; background-color: white; border-radius: 6px; padding: 15px; margin: 5px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${summary.thoughtCount}</div>
            <div style="color: #6b7280;">Thought Records</div>
          </div>
          
          <div style="flex: 1; min-width: 120px; background-color: white; border-radius: 6px; padding: 15px; margin: 5px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${summary.journalCount}</div>
            <div style="color: #6b7280;">Journal Entries</div>
          </div>
        </div>
        
        ${summary.topEmotion ? `
          <div style="margin-top: 20px;">
            <p style="color: #4b5563;">Your most frequently recorded emotion was <strong style="color: ${emotionColors[summary.topEmotion] || '#3b82f6'}">${summary.topEmotion}</strong>.</p>
          </div>
        ` : ''}
      </div>
    `;
  } else {
    progressSection = `
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #3b82f6; margin-top: 0;">No Activity This Week</h2>
        <p style="color: #4b5563;">We noticed you haven't recorded any activity in ResilienceHub™ this past week.</p>
        <p style="color: #4b5563;">Regular tracking helps build emotional awareness and provides valuable insights for your therapy journey.</p>
      </div>
    `;
  }
  
  // Main email template
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3b82f6; margin-bottom: 10px;">Your Weekly Progress Report</h1>
        <p style="color: #4b5563; font-size: 16px;">Hello ${user.name},</p>
        <p style="color: #4b5563; font-size: 16px;">Here's your weekly summary from ResilienceHub™.</p>
      </div>
      
      ${progressSection}
      
      <div style="background-color: #eef2ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #3b82f6; margin-top: 0;">This Week's Tip</h2>
        <p style="color: #4b5563;">Regular emotional tracking is essential for building self-awareness. Try to notice and record your emotions at different times throughout the day, especially during challenging moments.</p>
      </div>
      
      <div style="text-align: center; margin-top: 25px;">
        <a href="{{loginUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Full Progress</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
        This email was sent by ResilienceHub™, a service of Resilience Counseling Research and Consultation.
        <br>If you'd prefer not to receive these weekly updates, you can update your notification preferences in your account settings.
      </p>
    </div>
  `;
}

/**
 * Send email to a user
 */
async function sendDigestEmail(user, summary) {
  if (!sparkpost) {
    console.warn('SparkPost API key not configured. Email not sent.');
    return false;
  }
  
  try {
    const appUrl = process.env.APP_URL || 'https://resilience-hub.replit.app';
    const loginUrl = `${appUrl}/login`;
    
    let emailContent = generateEmailContent(user, summary);
    emailContent = emailContent.replace('{{loginUrl}}', loginUrl);
    
    const transmission = {
      content: {
        from: {
          name: "ResilienceHub™",
          email: "notifications@resilience-hub.com"
        },
        subject: "Your Weekly Progress Report",
        html: emailContent
      },
      recipients: [
        { address: user.email }
      ]
    };
    
    const result = await sparkpost.transmissions.send(transmission);
    console.log(`Weekly digest email sent to ${user.email}, result:`, result);
    return true;
  } catch (error) {
    console.error(`Error sending weekly digest email to ${user.email}:`, error);
    return false;
  }
}

/**
 * Create in-app notification for a user
 */
async function createDigestNotification(userId, summary) {
  try {
    const totalEntries = summary.emotionCount + summary.thoughtCount + summary.journalCount;
    const hasActivity = totalEntries > 0;
    
    let notificationBody = hasActivity
      ? `Your weekly summary: ${summary.emotionCount} emotions tracked, ${summary.thoughtCount} thought records, and ${summary.journalCount} journal entries. Keep up the good work!`
      : `We missed your activity this week. Regular tracking helps build emotional awareness and provides valuable insights.`;
    
    const notification = {
      user_id: userId,
      title: "Weekly Progress Report",
      body: notificationBody,
      type: "progress_update",
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
    
    console.log(`Created digest notification ${result.rows[0].id} for user ${userId}`);
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
  console.log(`[${new Date().toISOString()}] Starting weekly digest process`);
  
  try {
    // Get all active users
    const usersQuery = `
      SELECT id, name, email, role
      FROM users
      WHERE status = 'active'
        AND role = 'client'
    `;
    
    const usersResult = await pool.query(usersQuery);
    const users = usersResult.rows;
    
    console.log(`Found ${users.length} active users to process`);
    
    // Process each user
    let emailsSent = 0;
    let notificationsCreated = 0;
    
    for (const user of users) {
      console.log(`Processing user ${user.id} (${user.name})`);
      
      // Get user's weekly summary
      const summary = await getUserWeeklySummary(user.id);
      
      // Send email digest
      const emailSent = await sendDigestEmail(user, summary);
      if (emailSent) emailsSent++;
      
      // Create in-app notification
      const notificationCreated = await createDigestNotification(user.id, summary);
      if (notificationCreated) notificationsCreated++;
    }
    
    console.log(`Weekly digest process complete. Results: ${emailsSent} emails sent, ${notificationsCreated} notifications created`);
  } catch (error) {
    console.error('Error processing weekly digests:', error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  processWeeklyDigests()
    .then(() => console.log('Weekly digest process completed'))
    .catch(err => console.error('Error in weekly digest process:', err));
}

module.exports = { processWeeklyDigests };