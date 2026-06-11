import { 
  notifications, type Notification, type InsertNotification,
  notificationPreferences, type NotificationPreferences, type InsertNotificationPreferences
} from "@shared/schema";
import { db, pool } from "../db";
import { eq, desc } from "drizzle-orm";

export class NotificationsRepository {
  // Notification management
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    
    return newNotification;
  }
  
  async getNotificationsByUser(userId: number, limit: number = 20): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }
  
  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    console.log(`STORAGE FIX: Fetching unread notifications for user ${userId}`);
    
    // CRITICAL FIX: Use direct database pool to prevent data multiplication
    const result = await pool.query(`
      SELECT id, user_id as "userId", title, body, type, is_read as "isRead", 
             created_at as "createdAt", expires_at as "expiresAt", metadata, link_path as "linkPath", link
      FROM notifications 
      WHERE user_id = $1 
        AND is_read = false 
        AND (expires_at IS NULL OR expires_at >= NOW())
      ORDER BY created_at DESC
    `, [userId]);
    
    const notifs = result.rows || [];
    console.log(`STORAGE FIX: Found exactly ${notifs.length} unread notifications for user ${userId} (data integrity restored)`);
    
    return notifs as Notification[];
  }
  
  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    
    return notification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
  
  async deleteNotification(id: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }

  async clearAllNotifications(userId: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));
  }
  
  // Notification preferences
  async getNotificationPreferences(userId: number): Promise<NotificationPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    
    return preferences;
  }
  
  async createNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const [newPreferences] = await db
      .insert(notificationPreferences)
      .values(preferences)
      .returning();
    
    return newPreferences;
  }
  
  async updateNotificationPreferences(userId: number, preferences: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences> {
    const [updatedPreferences] = await db
      .update(notificationPreferences)
      .set({
        ...preferences,
        updatedAt: new Date()
      })
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    
    return updatedPreferences;
  }
}
