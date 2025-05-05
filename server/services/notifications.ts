import { WebSocket } from 'ws';
import { storage } from '../storage';
import { InsertNotification } from '@shared/schema';

/**
 * Map of user IDs to WebSocket connections
 * Each user can have multiple active connections (different devices/tabs)
 */
const userConnections = new Map<number, Set<WebSocket>>();

/**
 * Register a user's websocket connection
 */
export function registerConnection(userId: number, ws: WebSocket): void {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  
  userConnections.get(userId)?.add(ws);
  console.log(`User ${userId} connected. Active connections: ${userConnections.get(userId)?.size}`);
}

/**
 * Unregister a user's websocket connection
 */
export function unregisterConnection(userId: number, ws: WebSocket): void {
  const connections = userConnections.get(userId);
  
  if (connections) {
    connections.delete(ws);
    console.log(`User ${userId} disconnected. Remaining connections: ${connections.size}`);
    
    // Clean up if no connections remain
    if (connections.size === 0) {
      userConnections.delete(userId);
    }
  }
}

/**
 * Send a notification to a specific user
 */
export async function sendNotification(userId: number, notification: InsertNotification): Promise<void> {
  // Store notification in database first
  const createdNotification = await storage.createNotification(notification);
  
  // Then send real-time notification if user is connected
  const connections = userConnections.get(userId);
  
  if (connections && connections.size > 0) {
    // Format notification message
    const message = JSON.stringify({
      type: 'notification',
      data: createdNotification
    });
    
    // Send to all user connections
    connections.forEach(connection => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(message);
      }
    });
    
    console.log(`Real-time notification sent to user ${userId}`);
  } else {
    console.log(`User ${userId} not connected. Notification saved for later retrieval.`);
  }
}

/**
 * Helper function for creating system notifications (e.g., reminders)
 */
export async function createSystemNotification(
  userId: number, 
  title: string, 
  body: string, 
  link?: string
): Promise<void> {
  const notification: InsertNotification = {
    userId,
    type: 'system',
    title,
    body,
    link,
    isRead: false,
    createdAt: new Date()
  };
  
  await sendNotification(userId, notification);
}

/**
 * Helper function for creating journal comment notifications
 */
export async function createJournalCommentNotification(
  userId: number,
  therapistName: string,
  journalEntryId: number,
  journalTitle: string
): Promise<void> {
  const notification: InsertNotification = {
    userId,
    type: 'comment',
    title: `New comment from ${therapistName}`,
    body: `${therapistName} commented on your journal entry "${journalTitle}"`,
    link: `/journal/${journalEntryId}`,
    isRead: false,
    createdAt: new Date(),
    metadata: {
      journalEntryId,
      therapistName
    }
  };
  
  await sendNotification(userId, notification);
}

/**
 * Helper function for creating resource assignment notifications
 */
export async function createResourceAssignmentNotification(
  userId: number,
  therapistName: string,
  resourceId: number,
  resourceName: string
): Promise<void> {
  const notification: InsertNotification = {
    userId,
    type: 'resource',
    title: `New resource from ${therapistName}`,
    body: `${therapistName} assigned the resource "${resourceName}" to you`,
    link: `/resources/${resourceId}`,
    isRead: false,
    createdAt: new Date(),
    metadata: {
      resourceId,
      therapistName
    }
  };
  
  await sendNotification(userId, notification);
}

/**
 * Helper function for creating goal approval notifications
 */
export async function createGoalStatusNotification(
  userId: number,
  therapistName: string,
  goalId: number,
  goalTitle: string,
  status: string
): Promise<void> {
  const statusText = status === 'approved' ? 'approved' : 
                    status === 'in-progress' ? 'updated' : 
                    status === 'completed' ? 'marked as completed' : 
                    'updated';
  
  const notification: InsertNotification = {
    userId,
    type: 'goal',
    title: `Goal ${statusText}`,
    body: `${therapistName} has ${statusText} your goal "${goalTitle}"`,
    link: `/goals/${goalId}`,
    isRead: false,
    createdAt: new Date(),
    metadata: {
      goalId,
      therapistName,
      status
    }
  };
  
  await sendNotification(userId, notification);
}

/**
 * Create a reminder notification for emotion tracking
 */
export async function createEmotionTrackingReminder(userId: number): Promise<void> {
  // Check user preferences before sending
  const preferences = await storage.getNotificationPreferences(userId);
  
  if (preferences?.emotionReminders === false) {
    return;
  }
  
  await createSystemNotification(
    userId,
    'Emotion Check-In Reminder',
    'Taking a moment to track your emotions can help you understand your patterns better.',
    '/emotions'
  );
}

/**
 * Create a reminder notification for journal writing
 */
export async function createJournalReminderNotification(userId: number): Promise<void> {
  // Check user preferences before sending
  const preferences = await storage.getNotificationPreferences(userId);
  
  if (preferences?.journalReminders === false) {
    return;
  }
  
  await createSystemNotification(
    userId,
    'Journal Reminder',
    'Regular journaling can help process thoughts and emotions. Take a moment to write today.',
    '/journal'
  );
}

/**
 * Create a weekly progress notification
 */
export async function createWeeklyProgressNotification(userId: number): Promise<void> {
  // Check user preferences before sending
  const preferences = await storage.getNotificationPreferences(userId);
  
  if (preferences?.progressSummaries === false) {
    return;
  }
  
  await createSystemNotification(
    userId,
    'Weekly Progress Update',
    'Your weekly progress report is ready. Check out your insights and patterns.',
    '/dashboard'
  );
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number): Promise<void> {
  await storage.updateNotification(notificationId, { isRead: true });
}

/**
 * Mark all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  await storage.markAllNotificationsAsRead(userId);
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadNotificationsCount(userId: number): Promise<number> {
  return storage.getUnreadNotificationsCount(userId);
}

/**
 * Get recent notifications for a user
 */
export async function getRecentNotifications(userId: number, limit: number = 10): Promise<any[]> {
  return storage.getRecentNotifications(userId, limit);
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number): Promise<void> {
  await storage.deleteNotification(notificationId);
}

/**
 * Update or create notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: number, 
  preferences: any
): Promise<any> {
  // Check if preferences exist
  const existingPreferences = await storage.getNotificationPreferences(userId);
  
  if (existingPreferences) {
    // Update existing preferences
    return storage.updateNotificationPreferences(userId, preferences);
  } else {
    // Create new preferences
    return storage.createNotificationPreferences({
      userId,
      ...preferences
    });
  }
}