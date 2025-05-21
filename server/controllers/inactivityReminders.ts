import { pool } from '../db';
import { sendEmotionTrackingReminder, isEmailEnabled } from '../services/email';
import { sendNotificationToUser } from '../services/websocket';
import { Request, Response } from 'express';

/**
 * Find clients who haven't recorded emotions in the specified number of days
 */
export async function findInactiveClients(days: number = 3, therapistId?: number): Promise<any[]> {
  try {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Base query to find clients who haven't recorded emotions since the cutoff date
    let query = `
      SELECT u.id, u.name, u.email, u.therapist_id as "therapistId", 
             COALESCE(
               (SELECT MAX(e.timestamp) FROM emotion_records e WHERE e.user_id = u.id),
               'Never'
             ) as "lastActivity"
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
    
    // Add therapist filter if specified
    const queryParams = [cutoffDate.toISOString()];
    if (therapistId) {
      query += ` AND u.therapist_id = $2`;
      queryParams.push(therapistId);
    }
    
    // Add sorting to show most inactive clients first
    query += ` ORDER BY "lastActivity" ASC`;
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error finding inactive clients:', error);
    return [];
  }
}

/**
 * Create in-app notification for a client
 */
export async function createInactivityNotification(userId: number): Promise<boolean> {
  try {
    // Use notifications table
    const notificationData = {
      user_id: userId,
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
      notificationData.user_id,
      notificationData.title,
      notificationData.body,
      notificationData.type,
      notificationData.is_read,
      notificationData.created_at
    ]);
    
    // Try to send real-time notification through WebSocket if available
    try {
      sendNotificationToUser(userId, result.rows[0]);
    } catch (wsError) {
      console.log('WebSocket notification sending failed (not critical):', wsError);
    }
    
    return true;
  } catch (error) {
    console.error(`Error creating inactivity notification for user ${userId}:`, error);
    return false;
  }
}

/**
 * Controller function to check for inactive clients without sending reminders
 */
export async function checkInactiveClients(req: Request, res: Response) {
  try {
    const daysThreshold = Number(req.query.days) || 3;
    
    // Check if we should filter by therapist
    let therapistId = undefined;
    if (req.query.therapistOnly === 'true' && req.user && req.user.role === 'therapist') {
      therapistId = req.user.id;
    }
    
    const inactiveClients = await findInactiveClients(daysThreshold, therapistId);
    
    return res.status(200).json({
      success: true,
      count: inactiveClients.length,
      threshold: daysThreshold,
      clients: inactiveClients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        therapistId: c.therapistId,
        lastActivity: c.lastActivity
      }))
    });
  } catch (error) {
    console.error("Error checking inactive clients:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error checking inactive clients" 
    });
  }
}

/**
 * Controller function to send inactivity reminders
 */
export async function sendInactivityReminders(req: Request, res: Response) {
  try {
    const daysThreshold = req.body.days || 3; // Default to 3 days
    console.log(`Looking for clients inactive for ${daysThreshold} days...`);
    
    // Find inactive clients
    const inactiveClients = await findInactiveClients(daysThreshold);
    console.log(`Found ${inactiveClients.length} inactive clients`);
    
    // Send notifications
    let notificationsSent = 0;
    let emailsSent = 0;
    
    for (const client of inactiveClients) {
      // Create in-app notification
      const notificationCreated = await createInactivityNotification(client.id);
      if (notificationCreated) notificationsSent++;
      
      // Send email if SparkPost is configured
      if (isEmailEnabled()) {
        const emailSent = await sendEmotionTrackingReminder(client.email, client.name);
        if (emailSent) emailsSent++;
      }
    }
    
    return res.status(200).json({
      success: true,
      inactiveClients: inactiveClients.length,
      notificationsSent,
      emailsSent,
      message: `Sent ${notificationsSent} in-app notifications and ${emailsSent} emails to inactive clients`
    });
  } catch (error) {
    console.error("Error sending inactivity reminders:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error sending inactivity reminders" 
    });
  }
}