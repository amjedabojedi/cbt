import { Router } from "express";
import { authenticate, checkUserAccess, isClientOrAdmin } from "../middleware/auth";
import {
  updateGoalStatusBasedOnMilestones,
  createGoal,
  getGoals,
  getAllMilestones,
  updateGoalStatus,
  createGoalMilestone,
  getGoalMilestones,
  updateMilestoneCompletion
} from "../controllers/goals.controller";

const router = Router({ mergeParams: true });

// Re-export helper for admin.routes.ts or other dependencies
export { updateGoalStatusBasedOnMilestones };

// Goals routes - only clients can create goals
router.post("/", authenticate, checkUserAccess, isClientOrAdmin, createGoal);

// Get all goals for a user
router.get("/", authenticate, checkUserAccess, getGoals);

// Get all milestones for all of a user's goals
router.get("/milestones", authenticate, checkUserAccess, getAllMilestones);

// Update goal status
router.patch("/goals/:id/status", authenticate, updateGoalStatus);

// Goal milestones routes
router.post("/goals/:goalId/milestones", authenticate, createGoalMilestone);
router.get("/goals/:goalId/milestones", authenticate, getGoalMilestones);

// Update milestone completion status
router.patch("/milestones/:id/completion", authenticate, updateMilestoneCompletion);

export default router;
