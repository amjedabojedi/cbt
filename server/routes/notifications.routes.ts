import { Router } from "express";
import { authenticate, isAdmin } from "../middleware/auth";
import {
  getUserNotifications,
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createTestNotification
} from "../controllers/notifications.controller";

const router = Router();

// GET /api/notifications - Get all notifications for user
router.get("/", authenticate, getUserNotifications);

// GET /api/notifications/unread - Get unread notifications for user
router.get("/unread", authenticate, getUnreadNotifications);

// POST /api/notifications/read/:id - Mark notification as read
router.post("/read/:id", authenticate, markNotificationRead);

// POST /api/notifications/read-all - Mark all notifications as read
router.post("/read-all", authenticate, markAllNotificationsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", authenticate, deleteNotification);

// POST /api/notifications/test - Generate a test notification
router.post("/test", authenticate, isAdmin, createTestNotification);

export default router;
