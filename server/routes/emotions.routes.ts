import { Router } from "express";
import { authenticate, checkUserAccess, isClientOrAdmin } from "../middleware/auth";
import {
  getEmotionsCount,
  createEmotionRecord,
  getEmotions,
  deleteEmotionRecord,
  getEmotionStats,
  updateEmotionRecord
} from "../controllers/emotions.controller";

const router = Router({ mergeParams: true }); // Important: mergeParams needed if mounted at /api/users/:userId/emotions

// Get emotions count
router.get("/count", authenticate, checkUserAccess, getEmotionsCount);

// Create new emotion record
router.post("/", authenticate, checkUserAccess, isClientOrAdmin, createEmotionRecord);

// Update emotion record
router.patch("/:emotionId", authenticate, checkUserAccess, updateEmotionRecord);

// Get all emotions for a user
router.get("/", authenticate, checkUserAccess, getEmotions);

// Delete an emotion record
router.delete("/:emotionId", authenticate, checkUserAccess, deleteEmotionRecord);

// Get emotion statistics
router.get("/stats", authenticate, checkUserAccess, getEmotionStats);

export default router;
