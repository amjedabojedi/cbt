import { Request, Response } from "express";
import { storage } from "../storage";
import { insertSubscriptionPlanSchema } from "@shared/schema";
import { z } from "zod";
import { stripeService } from "../services/stripe";

// Get all subscription plans
export async function getSubscriptionPlans(req: Request, res: Response) {
  try {
    // Non-authenticated users can see active plans only
    const activeOnly = !req.headers.authorization;
    const plans = await storage.getSubscriptionPlans(activeOnly);
    res.status(200).json(plans);
  } catch (error) {
    console.error("Get subscription plans error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get subscription plan by ID
export async function getSubscriptionPlanById(req: Request, res: Response) {
  try {
    const planId = Number(req.params.id);
    if (isNaN(planId)) {
      return res.status(400).json({ message: "Invalid plan ID" });
    }
    
    const plan = await storage.getSubscriptionPlanById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    
    res.status(200).json(plan);
  } catch (error) {
    console.error("Get subscription plan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Create a new subscription plan (admin only)
export async function createSubscriptionPlan(req: Request, res: Response) {
  try {
    const validatedData = insertSubscriptionPlanSchema.parse(req.body);
    const newPlan = await storage.createSubscriptionPlan(validatedData);
    res.status(201).json(newPlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create subscription plan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update a subscription plan (admin only)
export async function updateSubscriptionPlan(req: Request, res: Response) {
  try {
    const planId = Number(req.params.id);
    if (isNaN(planId)) {
      return res.status(400).json({ message: "Invalid plan ID" });
    }
    
    const plan = await storage.getSubscriptionPlanById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    
    const validatedData = insertSubscriptionPlanSchema.partial().parse(req.body);
    const updatedPlan = await storage.updateSubscriptionPlan(planId, validatedData);
    res.status(200).json(updatedPlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Update subscription plan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Set default subscription plan (admin only)
export async function setDefaultSubscriptionPlan(req: Request, res: Response) {
  try {
    const planId = Number(req.params.id);
    if (isNaN(planId)) {
      return res.status(400).json({ message: "Invalid plan ID" });
    }
    
    const plan = await storage.getSubscriptionPlanById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    
    if (!plan.isActive) {
      return res.status(400).json({ message: "Cannot set an inactive plan as default" });
    }
    
    const defaultPlan = await storage.setDefaultSubscriptionPlan(planId);
    res.status(200).json(defaultPlan);
  } catch (error) {
    console.error("Set default subscription plan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Deactivate a subscription plan (admin only)
export async function deactivateSubscriptionPlan(req: Request, res: Response) {
  try {
    const planId = Number(req.params.id);
    if (isNaN(planId)) {
      return res.status(400).json({ message: "Invalid plan ID" });
    }
    
    const plan = await storage.getSubscriptionPlanById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    
    if (plan.isDefault) {
      return res.status(400).json({ message: "Cannot deactivate the default plan" });
    }
    
    const deactivatedPlan = await storage.deactivateSubscriptionPlan(planId);
    res.status(200).json(deactivatedPlan);
  } catch (error) {
    console.error("Deactivate subscription plan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get current subscription info of authenticated user
export async function getUserSubscription(req: Request, res: Response) {
  try {
    const user = req.user!;
    
    let plan = null;
    if (user.subscriptionPlanId) {
      plan = await storage.getSubscriptionPlanById(user.subscriptionPlanId);
    }
    
    let stripeSubscription = null;
    if (stripeService.isStripeEnabled() && user.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripeService.retrieveSubscription(user.stripeSubscriptionId);
      } catch (stripeError) {
        console.error("Stripe subscription retrieval error:", stripeError);
      }
    }
    
    res.status(200).json({
      plan,
      status: user.subscriptionStatus,
      endDate: user.subscriptionEndDate,
      stripeSubscription: stripeSubscription ? {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
      } : null
    });
  } catch (error) {
    console.error("Get subscription info error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
