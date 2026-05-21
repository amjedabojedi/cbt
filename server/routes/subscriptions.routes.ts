import { Router } from "express";
import { authenticate, isAdmin, ensureAuthenticated } from "../middleware/auth";
import {
  getSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  setDefaultSubscriptionPlan,
  deactivateSubscriptionPlan,
  getUserSubscription
} from "../controllers/subscriptions.controller";

const router = Router();

// Get all subscription plans
router.get("/subscription-plans", getSubscriptionPlans);

// Get subscription plan by ID
router.get("/subscription-plans/:id", getSubscriptionPlanById);

// Create a new subscription plan (admin only)
router.post("/subscription-plans", authenticate, isAdmin, createSubscriptionPlan);

// Update a subscription plan (admin only)
router.patch("/subscription-plans/:id", authenticate, isAdmin, updateSubscriptionPlan);

// Set default subscription plan (admin only)
router.post("/subscription-plans/:id/set-default", authenticate, isAdmin, setDefaultSubscriptionPlan);

// Deactivate a subscription plan (admin only)
router.post("/subscription-plans/:id/deactivate", authenticate, isAdmin, deactivateSubscriptionPlan);

// Get current subscription info of authenticated user
router.get("/subscription", authenticate, ensureAuthenticated, getUserSubscription);

export default router;
