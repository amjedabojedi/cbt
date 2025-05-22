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
    
    // We need to handle two cases:
    // 1. Clients who have emotion records but none since the cutoff date
    // 2. Clients who have never recorded emotions and have been registered for more than 'days' days
    
    // First, build our base query for finding clients
    let query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.therapist_id as "therapistId",
        u.created_at as "createdAt",
        (
          SELECT MAX(e.timestamp) 
          FROM emotion_records e 
          WHERE e.user_id = u.id
        ) as "lastActivity"
      FROM users u
      WHERE 
        u.role = 'client' AND 
        u.status = 'active'
    `;
    
    // Add therapist filter if specified
    const queryParams = [cutoffDate.toISOString()];
    if (therapistId) {
      query += ` AND u.therapist_id = $2`;
      queryParams.push(therapistId.toString());
    }
    
    // Now add our condition to identify inactive clients
    query += `
      AND (
        -- Case 1: Has emotion records but none since cutoff date
        (
          EXISTS (SELECT 1 FROM emotion_records e WHERE e.user_id = u.id) AND
          NOT EXISTS (
            SELECT 1 FROM emotion_records e 
            WHERE e.user_id = u.id AND e.timestamp > $1
          )
        )
        -- Case 2: Has never recorded emotions but registered more than 'days' days ago
        OR (
          NOT EXISTS (SELECT 1 FROM emotion_records e WHERE e.user_id = u.id) AND
          u.created_at < $1
        )
      )
    `;
    
    // Add sorting to show most inactive clients first
    // For clients who never recorded emotions, order by their registration date
    query += ` 
      ORDER BY 
        CASE WHEN "lastActivity" IS NULL THEN u.created_at ELSE "lastActivity" END ASC
    `;
    
    const result = await pool.query(query, queryParams);
    
    // Format the result to ensure consistent format
    return result.rows.map(client => ({
      ...client,
      lastActivity: client.lastActivity || 'Never recorded'
    }));
  } catch (error) {
    console.error('Error finding inactive clients:', error);
    return [];
  }
}

/**
 * Create in-app notification for a client
 */
export async function createInactivityNotification(userId: number, customMessage?: string): Promise<boolean> {
  try {
    // Use notifications table
    const notificationData = {
      user_id: userId,
      title: "Emotion Tracking Reminder",
      body: customMessage || "It's been a while since you last recorded your emotions. Regular tracking helps build self-awareness and improve therapy outcomes.",
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
    
    // Check if we should only send to therapist's clients
    let therapistId = undefined;
    if (req.body.therapistOnly === true && req.user && req.user.role === 'therapist') {
      therapistId = req.user.id;
      console.log(`Filtering to only clients of therapist ${therapistId}`);
    }
    
    // Check if specific client IDs were provided
    const specificClientIds: number[] = req.body.clientIds || [];
    let clientsToProcess: any[] = [];
    
    if (specificClientIds.length > 0) {
      console.log(`Sending reminders to specifically selected clients: ${specificClientIds.join(', ')}`);
      
      // If specific clients are selected, we need to fetch their details
      const query = `
        SELECT u.id, u.name, u.email, u.therapist_id as "therapistId" 
        FROM users u
        WHERE u.id = ANY($1)
        ${therapistId ? 'AND u.therapist_id = $2' : ''}
      `;
      
      const params = [specificClientIds];
      if (therapistId) {
        params.push(therapistId);
      }
      
      const result = await pool.query(query, params);
      clientsToProcess = result.rows;
      console.log(`Found ${clientsToProcess.length} specific clients to send reminders to`);
    } else {
      // Otherwise get all inactive clients based on the days threshold
      clientsToProcess = await findInactiveClients(daysThreshold, therapistId);
      console.log(`Found ${clientsToProcess.length} inactive clients to send reminders to`);
    }
    
    // Send notifications
    let notificationsSent = 0;
    let emailsSent = 0;
    const emailsEnabled = isEmailEnabled();
    
    for (const client of clientsToProcess) {
      // Create in-app notification
      const notificationCreated = await createInactivityNotification(client.id);
      if (notificationCreated) notificationsSent++;
      
      // Send email if SparkPost is configured
      if (emailsEnabled) {
        const emailSent = await sendEmotionTrackingReminder(client.email, client.name);
        if (emailSent) emailsSent++;
      }
    }
    
    return res.status(200).json({
      success: true,
      processedClients: clientsToProcess.length,
      notificationsSent,
      emailsSent,
      emailsEnabled,
      message: `Sent ${notificationsSent} in-app notifications and ${emailsSent} emails to ${specificClientIds.length > 0 ? 'selected' : 'inactive'} clients`
    });
  } catch (error) {
    console.error("Error sending inactivity reminders:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error sending inactivity reminders" 
    });
  }
}