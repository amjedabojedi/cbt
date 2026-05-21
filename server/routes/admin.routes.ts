import { Router } from "express";
import { authenticate, isAdmin } from "../middleware/auth";
import {
  getAdminStats,
  getAdminViewingClientStatus,
  recalculateGoalStatuses,
  triggerDailyReminders,
  triggerWeeklyDigests,
  getAdminNotifications,
  getAdminLogs,
  clearSystemLogs,
  getEngagementSettings,
  updateEngagementSettings,
  getEngagementStats,
  checkInactiveClients,
  sendInactivityReminders,
  sendWeeklyDigests
} from "../controllers/admin.controller";

const router = Router({ mergeParams: true });

// Get admin statistics (admin only)
router.get("/admin/stats", authenticate, isAdmin, getAdminStats);

// Admin-specific viewing client endpoint (always returns null for admins)
router.get("/admin/viewing-client-status", authenticate, getAdminViewingClientStatus);

// Admin endpoint to recalculate all goal statuses
router.post("/admin/recalculate-goal-statuses", authenticate, recalculateGoalStatuses);

// Scheduler management endpoints
router.post("/admin/scheduler/trigger-daily-reminders", isAdmin, triggerDailyReminders);
router.post("/admin/scheduler/trigger-weekly-digests", isAdmin, triggerWeeklyDigests);

// Admin endpoint to get all notifications
router.get("/admin/notifications", authenticate, isAdmin, getAdminNotifications);

// Admin endpoint to get system logs
router.get("/admin/logs", authenticate, isAdmin, getAdminLogs);

// Admin endpoint to clear system logs
router.delete("/admin/logs", authenticate, isAdmin, clearSystemLogs);

// Admin engagement settings routes
router.get("/admin/engagement-settings", authenticate, isAdmin, getEngagementSettings);
router.post("/admin/engagement-settings", authenticate, isAdmin, updateEngagementSettings);
router.get("/admin/engagement-stats", authenticate, isAdmin, getEngagementStats);

// Admin section endpoints for client inactivity detection
router.get('/admin/inactivity/check', authenticate, checkInactiveClients);

// Endpoint to send reminders to inactive clients
router.post('/admin/inactivity/send-reminders', authenticate, sendInactivityReminders);

// Endpoint to trigger weekly digest creation and sending
router.post('/admin/weekly-digests/send', isAdmin, sendWeeklyDigests);

export default router;