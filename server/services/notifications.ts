import { WebSocket } from 'ws';
import { storage } from '../storage';
import { Notification, InsertNotification, NotificationPreference } from '@shared/schema';

// WebSocket connections organized by user ID
const activeConnections = new Map<number, Set<WebSocket>>();

/**
 * Register a user's websocket connection
 */
export function registerConnection(userId: number, ws: WebSocket): void {
  if (!activeConnections.has(userId)) {
    activeConnections.set(userId, new Set());
  }
  
  activeConnections.get(userId)?.add(ws);
  
  console.log(`WebSocket connection registered for user ${userId}`);
  console.log(`Active connections: ${Array.from(activeConnections.keys()).join(', ')}`);
}

/**
 * Unregister a user's websocket connection
 */
export function unregisterConnection(userId: number, ws: WebSocket): void {
  if (activeConnections.has(userId)) {
    activeConnections.get(userId)?.delete(ws);
    
    // Clean up if no more connections
    if (activeConnections.get(userId)?.size === 0) {
      activeConnections.delete(userId);
    }
    
    console.log(`WebSocket connection unregistered for user ${userId}`);
  }
}

/**
 * Send a notification to a specific user
 */
export async function sendNotification(userId: number, notification: InsertNotification): Promise<Notification | undefined> {
  try {
    // First, store the notification in the database
    const savedNotification = await storage.createNotification(notification);
    
    // Then, send it through WebSocket if the user is connected
    if (activeConnections.has(userId)) {
      const sockets = activeConnections.get(userId);
      if (sockets && sockets.size > 0) {
        const message = JSON.stringify({
          type: 'notification',
          data: savedNotification
        });
        
        // Send to all active connections for this user
        sockets.forEach(socket => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
          }
        });
      }
    }
    
    return savedNotification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return undefined;
  }
}

/**
 * Helper function for creating system notifications (e.g., reminders)
 */
export async function createSystemNotification(
  userId: number, 
  title: string, 
  content: string, 
  linkPath?: string
): Promise<Notification | undefined> {
  const notification: InsertNotification = {
    userId,
    type: 'system',
    title,
    content,
    linkPath: linkPath || null,
    isRead: false
  };
  
  return sendNotification(userId, notification);
}

/**
 * Helper function for creating journal comment notifications
 */
export async function createJournalCommentNotification(
  userId: number,
  commenterId: number,
  commenterName: string,
  entryId: number,
  entryTitle: string
): Promise<Notification | undefined> {
  const notification: InsertNotification = {
    userId,
    type: 'journal_comment',
    title: 'New Journal Comment',
    content: `${commenterName} commented on your journal entry "${entryTitle}"`,
    linkPath: `/journal/${entryId}`,
    isRead: false
  };
  
  return sendNotification(userId, notification);
}

/**
 * Helper function for creating resource assignment notifications
 */
export async function createResourceAssignmentNotification(
  userId: number,
  therapistName: string,
  resourceId: number,
  resourceTitle: string
): Promise<Notification | undefined> {
  const notification: InsertNotification = {
    userId,
    type: 'resource_assignment',
    title: 'New Resource Assigned',
    content: `${therapistName} has assigned you a new resource: "${resourceTitle}"`,
    linkPath: `/resources/${resourceId}`,
    isRead: false
  };
  
  return sendNotification(userId, notification);
}

/**
 * Helper function for creating goal approval notifications
 */
export async function createGoalStatusNotification(
  userId: number,
  goalId: number,
  goalTitle: string,
  newStatus: string,
  therapistName: string
): Promise<Notification | undefined> {
  let title: string;
  let content: string;
  
  switch (newStatus) {
    case 'approved':
      title = 'Goal Approved';
      content = `${therapistName} has approved your goal: "${goalTitle}"`;
      break;
    case 'in-progress':
      title = 'Goal Status Updated';
      content = `${therapistName} has marked your goal "${goalTitle}" as in progress`;
      break;
    case 'completed':
      title = 'Goal Completed';
      content = `Your goal "${goalTitle}" has been marked as completed`;
      break;
    default:
      title = 'Goal Status Updated';
      content = `The status of your goal "${goalTitle}" has been updated to ${newStatus}`;
  }
  
  const notification: InsertNotification = {
    userId,
    type: 'goal_status',
    title,
    content,
    linkPath: `/goals/${goalId}`,
    isRead: false
  };
  
  return sendNotification(userId, notification);
}

/**
 * Create a reminder notification for emotion tracking
 */
export async function createEmotionTrackingReminder(userId: number): Promise<Notification | undefined> {
  const userPreferences = await storage.getNotificationPreferences(userId);
  
  // Respect user preferences
  if (userPreferences?.emotionReminders === false) {
    return undefined;
  }
  
  return createSystemNotification(
    userId,
    'Emotion Tracking Reminder',
    'Remember to track your emotions today. Regular tracking helps identify patterns and improve emotional awareness.',
    '/emotions'
  );
}

/**
 * Create a reminder notification for journal writing
 */
export async function createJournalReminderNotification(userId: number): Promise<Notification | undefined> {
  const userPreferences = await storage.getNotificationPreferences(userId);
  
  // Respect user preferences
  if (userPreferences?.journalReminders === false) {
    return undefined;
  }
  
  return createSystemNotification(
    userId,
    'Journal Writing Reminder',
    'Take a moment to reflect and write in your journal today. Regular journaling can help process emotions and gain insights.',
    '/journal'
  );
}

/**
 * Create a weekly progress notification
 */
export async function createWeeklyProgressNotification(userId: number): Promise<Notification | undefined> {
  const userPreferences = await storage.getNotificationPreferences(userId);
  
  // Respect user preferences
  if (userPreferences?.progressSummaries === false) {
    return undefined;
  }
  
  return createSystemNotification(
    userId,
    'Weekly Progress Summary',
    'Your weekly progress summary is ready. Check your dashboard to see how you\'ve been doing.',
    '/dashboard'
  );
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number): Promise<Notification | undefined> {
  return storage.updateNotification(notificationId, { isRead: true });
}

/**
 * Mark all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  return storage.markAllNotificationsAsRead(userId);
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
export async function getRecentNotifications(userId: number, limit: number = 10): Promise<Notification[]> {
  return storage.getRecentNotifications(userId, limit);
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number): Promise<void> {
  return storage.deleteNotification(notificationId);
}

/**
 * Update or create notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: number, 
  preferences: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  // Check if preferences already exist
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