import { Request, Response } from "express";
import { db, pool } from "../db";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { thoughtRecords, goals } from "@shared/schema";
import { storage } from "../storage";
import { sendNotificationToUser } from "../services/websocket";
import { isEmailEnabled, sendWeeklyProgressDigest, sendEmotionTrackingReminder } from "../services/email";
import { updateGoalStatusBasedOnMilestones } from "./goals.controller";
import { engagementDays, getAdminClientEngagement } from "../services/adminEngagement";
import type { ReminderDeliveryResult } from "@shared/reminderDelivery";

// Get admin statistics (admin only)
export async function getAdminStats(req: Request, res: Response) {
  try {
    // Fetch all users
    const users = await storage.getAllUsers();
    const clients = users.filter(u => u.role === 'client');
    const therapists = users.filter(u => u.role === 'therapist');
    
    // Get counts by user role
    const activeClients = clients.filter(c => c.status === 'active').length;
    
    // Calculate therapist-client relationships
    const clientsWithoutTherapist = clients.filter(c => !c.therapistId).length;
    const therapistsWithClients = new Set(
      clients
        .filter(c => c.therapistId)
        .map(c => c.therapistId)
    );
    const therapistsWithoutClients = therapists.filter(
      therapist => !therapistsWithClients.has(therapist.id)
    ).length;
    
    // Fetch emotion records
    const emotionRecords = await storage.getAllEmotionRecords();
    
    // Fetch thought records
    const thoughtRecordsResult = await storage.getAllThoughtRecords();
    
    // Fetch goals
    const goalsResult = await storage.getAllGoals();
    
    // Calculate clients with goals
    const goalOwnerIds = new Set(goalsResult.map(g => g.userId));
    const clientsWithGoals = clients.filter(client => goalOwnerIds.has(client.id)).length;
    
    // Calculate resource usage
    // Match the admin library, which includes unpublished resources.
    const resources = await storage.getAllResources(true);
    const resourceAssignments = await storage.getAllResourceAssignments();
    
    // Calculate averages
    const clientIds = new Set(clients.map(client => client.id));
    const clientGoalCount = goalsResult.filter(goal => clientIds.has(goal.userId)).length;
    const clientEmotionCount = emotionRecords.filter(emotion => clientIds.has(emotion.userId)).length;
    const avgGoalsPerClient = clients.length ? (clientGoalCount / clients.length) : 0;
    const avgEmotionsPerClient = clients.length ? (clientEmotionCount / clients.length) : 0;
    
    // Find most active therapist (therapist with most clients)
    const therapistClientCounts: Record<number, number> = {};
    clients.forEach((client: any) => {
      if (client.therapistId) {
        therapistClientCounts[client.therapistId] = (therapistClientCounts[client.therapistId] || 0) + 1;
      }
    });
    
    let mostActiveTherapistId: number | null = null;
    let maxClientCount = 0;
    
    Object.entries(therapistClientCounts).forEach(([therapistId, count]) => {
      if ((count as number) > maxClientCount) {
        mostActiveTherapistId = parseInt(therapistId);
        maxClientCount = count as number;
      }
    });
    
    const mostActiveTherapist = therapists.find((t: any) => t.id === mostActiveTherapistId)?.name || 'N/A';
    
    // Find most active client (client with most emotion records)
    const clientEmotionCounts: Record<number, number> = {};
    emotionRecords.forEach((emotion: any) => {
      if (clientIds.has(emotion.userId)) {
        clientEmotionCounts[emotion.userId] = (clientEmotionCounts[emotion.userId] || 0) + 1;
      }
    });
    
    let mostActiveClientId: number | null = null;
    let maxEmotionCount = 0;
    
    Object.entries(clientEmotionCounts).forEach(([clientId, count]) => {
      if ((count as number) > maxEmotionCount) {
        mostActiveClientId = parseInt(clientId);
        maxEmotionCount = count as number;
      }
    });
    
    const mostActiveClient = clients.find((c: any) => c.id === mostActiveClientId)?.name || 'N/A';
    
    // Find most used resource
    const resourceUsageCounts: Record<number, number> = {};
    resourceAssignments.forEach((assignment: any) => {
      resourceUsageCounts[assignment.resourceId] = (resourceUsageCounts[assignment.resourceId] || 0) + 1;
    });
    
    let mostUsedResourceId: number | null = null;
    let maxResourceCount = 0;
    
    Object.entries(resourceUsageCounts).forEach(([resourceId, count]) => {
      if ((count as number) > maxResourceCount) {
        mostUsedResourceId = parseInt(resourceId);
        maxResourceCount = count as number;
      }
    });
    
    const mostUsedResource = resources.find(r => r.id === mostUsedResourceId)?.title || 'N/A';
    
    // Get top 5 resources by usage
    const topResources = resources
      .map(resource => {
        const usageCount = resourceAssignments.filter(a => a.resourceId === resource.id).length;
        return {
          id: resource.id,
          title: resource.title,
          usageCount
        };
      })
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
    
    // Compile the stats
    const stats = {
      totalUsers: users.length,
      totalClients: clients.length,
      totalTherapists: therapists.length,
      totalEmotions: emotionRecords.length,
      totalThoughts: thoughtRecordsResult.length,
      totalGoals: goalsResult.length,
      totalResources: resources.length,
      activeClients,
      activeTherapists: therapists.length,
      resourceUsage: resourceAssignments.length,
      clientsWithoutTherapist,
      therapistsWithoutClients,
      clientsWithGoals,
      averageGoalsPerClient: Math.round(avgGoalsPerClient * 10) / 10,
      averageEmotionsPerClient: Math.round(avgEmotionsPerClient * 10) / 10,
      mostActiveTherapist,
      mostActiveClient,
      mostUsedResource,
      topResources
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Failed to retrieve admin statistics" });
  }
}

// Admin-specific viewing client endpoint (always returns null for admins)
export async function getAdminViewingClientStatus(req: Request, res: Response) {
  console.log("Admin viewing client status requested");
  return res.status(200).json({ viewingClient: null, success: true });
}

// Admin endpoint to recalculate all goal statuses
export async function recalculateGoalStatuses(req: Request, res: Response) {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // Get all goals with milestones
    const allGoals = await db.select().from(goals);
    let updatedCount = 0;
    
    for (const goal of allGoals) {
      await updateGoalStatusBasedOnMilestones(goal.id);
      updatedCount++;
    }
    
    res.status(200).json({ 
      message: `Successfully recalculated status for ${updatedCount} goals`,
      updatedCount 
    });
  } catch (error) {
    console.error("Recalculate goal statuses error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Scheduler trigger daily reminders
export async function triggerDailyReminders(req: Request, res: Response) {
  try {
    const { engagementScheduler } = await import('../scheduler');
    await engagementScheduler.triggerDailyReminders();
    res.json({ 
      success: true, 
      message: "Daily reminders triggered successfully" 
    });
  } catch (error) {
    console.error("Error triggering daily reminders:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to trigger daily reminders" 
    });
  }
}

// Scheduler trigger weekly digests
export async function triggerWeeklyDigests(req: Request, res: Response) {
  try {
    const { engagementScheduler } = await import('../scheduler');
    await engagementScheduler.triggerWeeklyDigests();
    res.json({ 
      success: true, 
      message: "Weekly digests triggered successfully" 
    });
  } catch (error) {
    console.error("Error triggering weekly digests:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to trigger weekly digests" 
    });
  }
}

// Admin endpoint to get all notifications
export async function getAdminNotifications(req: Request, res: Response) {
  try {
    const query = `
      SELECT 
        n.id, 
        n.title, 
        n.body, 
        n.type, 
        n.is_read as "isRead", 
        n.created_at as "createdAt",
        n.user_id as "userId",
        u.name as "userName",
        u.email as "userEmail"
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
}

// Admin endpoint to get system logs
export async function getAdminLogs(req: Request, res: Response) {
  try {
    const query = `
      SELECT 
        sl.id,
        sl.action,
        sl.action_type as "actionType",
        sl.level,
        sl.message,
        sl.user_id as "performedBy",
        sl.ip_address as "ipAddress",
        sl.user_agent as "userAgent",
        sl.created_at as "timestamp",
        u.username as "performerName",
        u.email as "performerEmail"
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ORDER BY sl.created_at DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching system logs:", error);
    res.status(500).json({ message: "Failed to fetch system logs" });
  }
}

// Admin endpoint to clear system logs
export async function clearSystemLogs(req: Request, res: Response) {
  try {
    await pool.query("DELETE FROM system_logs");
    res.status(200).json({ message: "System logs cleared successfully" });
  } catch (error) {
    console.error("Error clearing system logs:", error);
    res.status(500).json({ message: "Failed to clear system logs" });
  }
}

// Get admin engagement settings
export async function getEngagementSettings(req: Request, res: Response) {
  try {
    const settings = await storage.getEngagementSettings();
    
    // If no settings exist, return defaults
    if (!settings) {
      const defaultSettings = {
        reminderEnabled: true,
        reminderDays: 3,
        reminderTime: "09:00",
        weeklyDigestEnabled: true,
        weeklyDigestDay: 0, // Sunday
        weeklyDigestTime: "08:00",
        emailTemplate: "",
        reminderEmailSubject: "",
        reminderEmailTemplate: "",
        weeklyDigestSubject: "",
        weeklyDigestTemplate: "",
        escalationEnabled: false,
        escalationDays: [7, 14, 30],
        escalationTemplates: []
      };
      res.status(200).json(defaultSettings);
    } else {
      res.status(200).json(settings);
    }
  } catch (error) {
    console.error("Error fetching engagement settings:", error);
    res.status(500).json({ message: "Failed to fetch engagement settings" });
  }
}

// Save admin engagement settings
export async function updateEngagementSettings(req: Request, res: Response) {
  try {
    const { 
      reminderEnabled, 
      reminderDays, 
      reminderTime, 
      weeklyDigestEnabled, 
      weeklyDigestDay, 
      weeklyDigestTime,
      reminderEmailSubject,
      reminderEmailTemplate,
      weeklyDigestSubject,
      weeklyDigestTemplate,
      escalationEnabled,
      escalationDays,
      escalationTemplates
    } = req.body;

    if (reminderTime !== undefined && (
      typeof reminderTime !== "string" ||
      reminderTime.length !== 5 ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)
    )) {
      res.status(400).json({
        message: "reminderTime must be a valid 24-hour time in HH:mm format (00:00–23:59)",
      });
      return;
    }
    
    // Save settings to database
    const updatedSettings = await storage.updateEngagementSettings({
      reminderEnabled,
      reminderDays,
      reminderTime,
      weeklyDigestEnabled,
      weeklyDigestDay,
      weeklyDigestTime,
      reminderEmailSubject,
      reminderEmailTemplate,
      weeklyDigestSubject,
      weeklyDigestTemplate,
      escalationEnabled,
      escalationDays,
      escalationTemplates
    });
    
    console.log("Updated engagement settings:", updatedSettings);
    
    res.status(200).json({ message: "Settings updated successfully", settings: updatedSettings });
  } catch (error) {
    console.error("Error saving engagement settings:", error);
    res.status(500).json({ message: "Failed to save engagement settings" });
  }
}

// Get admin engagement stats
export async function getEngagementStats(req: Request, res: Response) {
  try {
    const days = engagementDays(req.query?.days);
    const clients = await getAdminClientEngagement(days);
    const inactiveClients = clients.filter(client => client.inactive).length;
    const activeClients = clients.length - inactiveClients;
    
    const stats = {
      lastRunTime: null, // Would track this in database
      totalEmailsSent: 0, // Would track this in database
      totalNotificationsSent: 0, // Would track this in database
      activeClients,
      inactiveClients
    };
    
    res.status(200).json(stats);
  } catch (error) {
    if (error instanceof RangeError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error fetching engagement stats:", error);
    res.status(500).json({ message: "Failed to fetch engagement stats" });
  }
}

// Client inactivity check
export async function checkInactiveClients(req: Request, res: Response) {
  try {
    const daysThreshold = engagementDays(req.query?.days);
    const clients = await getAdminClientEngagement(daysThreshold);
    const inactiveClients = clients.filter(client => client.inactive);
    
    return res.status(200).json({
      success: true,
      count: inactiveClients.length,
      clients: inactiveClients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        therapistId: c.therapistId
      })),
      threshold: daysThreshold
    });
  } catch (error) {
    if (error instanceof RangeError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error checking inactive clients:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error checking inactive clients" 
    });
  }
}

// Send reminders to inactive clients
export async function sendInactivityReminders(req: Request, res: Response) {
  let daysThreshold: number;
  try {
    daysThreshold = engagementDays(req.body?.days);
  } catch {
    return res.status(400).json({ success: false, message: "Days must be a whole number between 1 and 365" });
  }
  try {
    console.log(`Looking for clients inactive for ${daysThreshold} days...`);
    
    const clients = await getAdminClientEngagement(daysThreshold);
    const inactiveClients = clients.filter(client => client.inactive);
    console.log(`Found ${inactiveClients.length} inactive clients`);
    
    // Send notifications and emails
    let notificationsSent = 0;
    let notificationsFailed = 0;
    let emailsSent = 0;
    let emailsFailed = 0;
    const emailsEnabled = isEmailEnabled();
    
    for (const client of inactiveClients) {
       // Create notification in database
      const notificationData = {
        user_id: client.id,
        title: "Emotion Tracking Reminder",
        body: "It's been a while since you last recorded your emotions. Regular tracking helps build self-awareness and improve therapy outcomes.",
        type: "reminder",
        is_read: false,
        created_at: new Date()
      };
      
      const notificationQuery = `
        INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      try {
        const notificationResult = await pool.query(notificationQuery, [
          notificationData.user_id,
          notificationData.title,
          notificationData.body,
          notificationData.type,
          notificationData.is_read,
          notificationData.created_at
        ]);
        
        // Try to send real-time notification through WebSocket if available
        try {
          sendNotificationToUser(client.id, notificationResult.rows[0]);
        } catch {
          // The saved in-app notification is still available without live delivery.
          console.log("Live reminder update unavailable; in-app notification saved.");
        }
        
        notificationsSent++;
      } catch {
        notificationsFailed++;
        console.error("In-app reminder could not be saved.");
      }
      
      // Send email if SparkPost is configured
      if (emailsEnabled) {
        try {
          const emailSent = await sendEmotionTrackingReminder(client.email, client.name);
          if (emailSent) emailsSent++;
          else emailsFailed++;
        } catch {
          emailsFailed++;
          console.error("Reminder email delivery failed.");
        }
      }
    }
    
    const hasFailures = notificationsFailed + emailsFailed > 0;
    const result: ReminderDeliveryResult = {
      success: true,
      inactiveClients: inactiveClients.length,
      notificationsSent,
      notificationsFailed,
      emailsSent,
      emailsFailed,
      emailsEnabled,
      hasFailures,
      message: `In-app notifications: ${notificationsSent} sent, ${notificationsFailed} failed. Emails: ${emailsSent} sent, ${emailsFailed} failed.${emailsEnabled ? "" : " Email delivery is disabled."}`
    };
    return res.status(200).json(result);
  } catch {
    console.error("Inactivity reminder request failed.");
    return res.status(500).json({ 
      success: false, 
      message: "Error sending inactivity reminders" 
    });
  }
}

// Send weekly progress digests manually
export async function sendWeeklyDigests(req: Request, res: Response) {
  try {
    // Get all active users
    const usersQuery = `
      SELECT id, name, email, role
      FROM users
      WHERE status = 'active'
      ${req.body.userId ? 'AND id = $1' : ''}
    `;
    
    const usersResult = req.body.userId
      ? await pool.query(usersQuery, [req.body.userId])
      : await pool.query(usersQuery);
      
    const users = usersResult.rows;
    console.log(`Processing weekly digests for ${users.length} users`);
    
    // Process each user
    let notificationsSent = 0;
    let emailsSent = 0;
    const processedUsers = [];
    
    for (const user of users) {
      console.log(`Processing weekly digest for user ID: ${user.id}`);
      
      // Get user's weekly summary
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Format dates for SQL query
      const startDate = oneWeekAgo.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];
      
      // Get emotion records count
      const emotionQuery = `
        SELECT COUNT(*) as count 
        FROM emotion_records 
        WHERE user_id = $1 
        AND timestamp BETWEEN $2 AND $3
      `;
      const emotionResult = await pool.query(emotionQuery, [user.id, startDate, endDate]);
      const emotionsTracked = parseInt(emotionResult.rows[0].count, 10);
      
      // Get journal entries count
      const journalQuery = `
        SELECT COUNT(*) as count 
        FROM journal_entries 
        WHERE user_id = $1 
        AND created_at BETWEEN $2 AND $3
      `;
      const journalResult = await pool.query(journalQuery, [user.id, startDate, endDate]);
      const journalEntries = parseInt(journalResult.rows[0].count, 10);
      
      // Get thought records count
      const thoughtQuery = `
        SELECT COUNT(*) as count 
        FROM thought_records 
        WHERE user_id = $1 
        AND created_at BETWEEN $2 AND $3
      `;
      const thoughtResult = await pool.query(thoughtQuery, [user.id, startDate, endDate]);
      const thoughtRecordsCount = parseInt(thoughtResult.rows[0].count, 10);
      
      const summary = {
        emotionsTracked,
        journalEntries,
        thoughtRecords: thoughtRecordsCount,
        goalsProgress: 'No updates',
        startDate,
        endDate
      };
      
      // Create digest notification
      const message = `Your weekly progress report is ready. This week you tracked ${summary.emotionsTracked} emotions, wrote ${summary.journalEntries} journal entries, and completed ${summary.thoughtRecords} thought records.`;
      
      const notificationData = {
        title: "Weekly Progress Report",
        body: message,
        type: "progress_update",
        is_read: false,
        created_at: new Date()
      };
      
      try {
        const notificationQuery = `
          INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        
        const notificationResult = await pool.query(notificationQuery, [
          user.id,
          notificationData.title,
          notificationData.body,
          notificationData.type,
          notificationData.is_read,
          notificationData.created_at
        ]);
        
        // Try to send real-time notification through WebSocket if available
        try {
          sendNotificationToUser(user.id, notificationResult.rows[0]);
        } catch (wsError) {
          console.log('WebSocket notification sending failed (not critical):', wsError);
        }
        
        notificationsSent++;
      } catch (notificationError) {
        console.error(`Error creating digest notification for user ${user.id}:`, notificationError);
      }
      
      // Send email if SparkPost is configured
      if (isEmailEnabled()) {
        try {
          const emailSent = await sendWeeklyProgressDigest(user.email, user.name, summary);
          if (emailSent) emailsSent++;
        } catch (emailError) {
          console.error(`Error sending digest email to user ${user.id}:`, emailError);
        }
      }
      
      processedUsers.push({
        id: user.id,
        name: user.name,
        stats: summary
      });
    }
    
    return res.status(200).json({
      success: true,
      totalUsers: users.length,
      notificationsSent,
      emailsSent,
      emailsEnabled: isEmailEnabled(),
      processedUsers,
      message: `Sent ${notificationsSent} in-app notifications and ${emailsSent} weekly digest emails`
    });
  } catch (error) {
    console.error("Error sending weekly digests:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error sending weekly digests" 
    });
  }
}
