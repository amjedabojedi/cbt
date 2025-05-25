import { db } from '../db';
import { notifications, type InsertNotification } from '@shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { sendNotificationToUser } from './websocket';

/**
 * Create a new notification for a user
 */
export async function createNotification(data: InsertNotification) {
  try {
    const [notification] = await db.insert(notifications)
      .values(data)
      .returning();
    
    // Send real-time notification via WebSocket if available
    try {
      sendNotificationToUser(data.userId, notification);
    } catch (wsError) {
      console.warn(`Failed to send WebSocket notification to user ${data.userId}:`, wsError);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get notifications for a user with optional limit
 */
export async function getNotificationsByUser(userId: number, limit?: number) {
  try {
    let query = db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    
    if (limit && limit > 0) {
      query = query.limit(limit);
    }
    
    return await query;
  } catch (error) {
    console.error(`Error fetching notifications for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotificationsByUser(userId: number) {
  try {
    // Direct SQL query to avoid any ORM issues
    const result = await db.execute(sql`
      SELECT id, user_id as "userId", title, body, type, is_read as "isRead", 
             created_at as "createdAt", expires_at as "expiresAt", metadata, link_path as "linkPath", link
      FROM notifications 
      WHERE user_id = ${userId}
        AND is_read = false 
        AND (expires_at IS NULL OR expires_at >= NOW())
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${result.rows?.length || 0} unread notifications for user ${userId}`);
    return result.rows || [];
  } catch (error) {
    console.error(`Error fetching unread notifications for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    const [notification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    
    return notification;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
}

/**
 * Mark all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId: number) {
  try {
    await db.update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    
    return true;
  } catch (error) {
    console.error(`Error marking all notifications as read for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get notification by ID
 */
export async function getNotificationById(notificationId: number) {
  try {
    const [notification] = await db.select()
      .from(notifications)
      .where(eq(notifications.id, notificationId));
    
    return notification;
  } catch (error) {
    console.error(`Error fetching notification ${notificationId}:`, error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number) {
  try {
    await db.delete(notifications)
      .where(eq(notifications.id, notificationId));
    
    return true;
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error);
    throw error;
  }
}