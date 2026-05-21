import { Request, Response } from "express";
import { storage } from "../storage";
import { pool, withRetry } from "../db";
import { sendNotificationToUser } from "../services/websocket";

// Cache unread notifications count for performance
const notificationCache = new Map<number, { notifications: any[]; expires: number }>();
const NOTIFICATION_CACHE_DURATION = 30000; // 30 seconds

// Get all notifications for user
export async function getUserNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const notifications = await withRetry(async () => {
      return await storage.getNotificationsByUser(userId, limit);
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
}

// Get unread notifications for user
export async function getUnreadNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const cached = notificationCache.get(userId);
    if (cached && Date.now() < cached.expires) {
      return res.status(200).json(cached.notifications);
    }

    const result = await pool.query(`
      SELECT id, user_id as "userId", title, body, type, is_read as "isRead", 
             created_at as "createdAt", expires_at as "expiresAt", metadata, link_path as "linkPath", link
      FROM notifications 
      WHERE user_id = $1
        AND is_read = false 
        AND (expires_at IS NULL OR expires_at >= NOW())
      ORDER BY created_at DESC
    `, [userId]);

    const notifications = result.rows || [];
    
    notificationCache.set(userId, {
      notifications,
      expires: Date.now() + NOTIFICATION_CACHE_DURATION
    });

    // Cleanup expired entries from cache
    const now = Date.now();
    const keysToDelete: number[] = [];
    notificationCache.forEach((value, key) => {
      if (now > value.expires) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => notificationCache.delete(key));

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("X-Direct-Query", "true");
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ message: "Failed to fetch unread notifications" });
  }
}

// Mark notification as read
export async function markNotificationRead(req: Request, res: Response) {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = await storage.getNotificationById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ message: "You don't have permission to modify this notification" });
    }
    const updatedNotification = await storage.markNotificationAsRead(notificationId);
    
    // Invalidate cache
    notificationCache.delete(req.user!.id);
    
    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
}

// Mark all notifications as read
export async function markAllNotificationsRead(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    console.log(`EMERGENCY NOTIFICATION RESET for user ${userId}`);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    try {
      await pool.query(`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1
      `, [userId]);
      console.log(`Successfully marked all notifications as read for user ${userId}`);
    } catch (sqlError) {
      console.error("Critical error with notification reset:", sqlError);
      throw sqlError;
    }
    
    // Invalidate cache
    notificationCache.delete(userId);

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      timestamp: Date.now()
    });
  }
}

// Delete notification
export async function deleteNotification(req: Request, res: Response) {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = await storage.getNotificationById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ message: "You don't have permission to delete this notification" });
    }
    await storage.deleteNotification(notificationId);
    
    // Invalidate cache
    notificationCache.delete(req.user!.id);
    
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
}

// Generate a test notification
export async function createTestNotification(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const testNotification = await storage.createNotification({
      userId,
      title: "Test Notification",
      body: "This is a test notification to verify functionality.",
      type: "system",
      isRead: false
    });
    sendNotificationToUser(userId, testNotification);
    
    // Invalidate cache
    notificationCache.delete(userId);
    
    res.status(201).json(testNotification);
  } catch (error) {
    console.error("Error creating test notification:", error);
    res.status(500).json({ message: "Failed to create test notification" });
  }
}
