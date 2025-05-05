import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, isTherapist, isAdmin, checkUserAccess, isClientOrAdmin, checkResourceCreationPermission } from "./middleware/auth";
import { z } from "zod";
import * as bcrypt from "bcrypt";
import Stripe from "stripe";
import * as emotionMapping from "./services/emotionMapping";
import { 
  insertUserSchema, 
  insertEmotionRecordSchema,
  insertThoughtRecordSchema,
  insertProtectiveFactorSchema,
  insertProtectiveFactorUsageSchema,
  insertCopingStrategySchema,
  insertCopingStrategyUsageSchema,
  insertGoalSchema,
  insertGoalMilestoneSchema,
  insertActionSchema,
  insertSubscriptionPlanSchema,
  insertResourceSchema,
  insertResourceAssignmentSchema,
  insertResourceFeedbackSchema,
  insertJournalEntrySchema,
  insertJournalCommentSchema,
  insertCognitiveDistortionSchema,
  goals,
  goalMilestones,
  actions,
  protectiveFactors,
  protectiveFactorUsage,
  copingStrategies,
  copingStrategyUsage,
  subscriptionPlans,
  journalEntries,
  journalComments,
  cognitiveDistortions,
  thoughtRecords
} from "@shared/schema";
import cookieParser from "cookie-parser";
import { sendClientInvitation } from "./services/email";
import { sendEmotionTrackingReminders, sendWeeklyProgressDigests } from "./services/reminders";
import { analyzeJournalEntry, JournalAnalysisResult } from "./services/openai";
import { registerIntegrationRoutes } from "./services/integrationRoutes";
import { initializeWebSocketServer, sendNotificationToUser } from "./services/websocket";
import { db, pool } from "./db";
import { eq, or, isNull, desc, and } from "drizzle-orm";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set. Subscription functionality may be limited.");
}

// Use Type assertion for Stripe API version to avoid TypeScript errors
const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' as any }) : 
  null;

// Helper function to get emotion color by name
function getEmotionColor(emotion: string): string {
  // Use the centralized emotion mapping service
  return emotionMapping.getEmotionColor(emotion);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Use the pool from the imported db
  const { pool } = await import('./db');
  // Parse cookies
  app.use(cookieParser());
  
  // Register cross-component integration routes
  registerIntegrationRoutes(app);
  
  // Enhanced insights endpoint that uses the improved emotion mapping service
  app.get("/api/users/:userId/enhanced-insights", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      
      // Fetch emotion records
      const emotions = await storage.getEmotionRecordsByUser(userId);
      
      // Fetch journal entries
      const journals = await storage.getJournalEntriesByUser(userId);
      
      // Fetch thought records
      const thoughts = await storage.getThoughtRecordsByUser(userId);
      
      // Use enhanced component connections
      const connections = await emotionMapping.enhanceComponentConnections(
        emotions || [], 
        journals || [], 
        thoughts || []
      );
      
      // Generate data insights
      const insights = emotionMapping.generateDataInsights(connections);
      
      res.json({
        connections,
        insights,
        summary: {
          emotions: emotions?.length || 0,
          journals: journals?.length || 0,
          thoughts: thoughts?.length || 0
        }
      });
    } catch (error) {
      console.error("Error generating enhanced insights:", error);
      res.status(500).json({ message: "Error generating insights" });
    }
  });
  
  // Subscription Plan Routes
  
  // Get all subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      // Non-authenticated users can see active plans only
      const activeOnly = !req.headers.authorization;
      const plans = await storage.getSubscriptionPlans(activeOnly);
      res.status(200).json(plans);
    } catch (error) {
      console.error("Get subscription plans error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get subscription plan by ID
  app.get("/api/subscription-plans/:id", async (req, res) => {
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
  });
  
  // Create a new subscription plan (admin only)
  app.post("/api/subscription-plans", authenticate, isAdmin, async (req, res) => {
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
  });
  
  // Update a subscription plan (admin only)
  app.patch("/api/subscription-plans/:id", authenticate, isAdmin, async (req, res) => {
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
  });
  
  // Set default subscription plan (admin only)
  app.post("/api/subscription-plans/:id/set-default", authenticate, isAdmin, async (req, res) => {
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
  });
  
  // Deactivate a subscription plan (admin only)
  app.post("/api/subscription-plans/:id/deactivate", authenticate, isAdmin, async (req, res) => {
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
  });
  
  // Stripe Subscription Routes
  
  // Get current subscription info of authenticated user
  app.get("/api/subscription", authenticate, async (req, res) => {
    try {
      const user = req.user;
      
      // Make sure user is defined
      if (!user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Get subscription plan if user has one
      let plan = null;
      if (user.subscriptionPlanId) {
        plan = await storage.getSubscriptionPlanById(user.subscriptionPlanId);
      }
      
      // Get Stripe subscription details if available
      let stripeSubscription = null;
      if (stripe && user.stripeSubscriptionId) {
        try {
          stripeSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        } catch (stripeError) {
          console.error("Stripe subscription retrieval error:", stripeError);
          // Continue without Stripe data
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
  });
  
  // Create or update a subscription
  app.post("/api/subscription", authenticate, async (req, res) => {
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      const plan = await storage.getSubscriptionPlanById(Number(planId));
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      if (!plan.isActive) {
        return res.status(400).json({ message: "Plan is not active" });
      }
      
      // For free plans, just assign the plan to the user
      if (plan.price === 0) {
        const user = await storage.assignSubscriptionPlan(req.user.id, plan.id);
        await storage.updateSubscriptionStatus(req.user.id, "active");
        
        return res.status(200).json({
          success: true,
          message: "Free plan activated",
          plan
        });
      }
      
      // For paid plans, create a Stripe checkout session
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is not available" });
      }
      
      // Check if user already has a Stripe customer ID
      let customerId = req.user.stripeCustomerId;
      
      // If not, create a new customer
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.name,
          metadata: {
            userId: req.user.id.toString()
          }
        });
        
        customerId = customer.id;
        await storage.updateUserStripeInfo(req.user.id, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: "" // Will be updated after checkout
        });
      }
      
      // Create a checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: plan.name,
                description: plan.description
              },
              unit_amount: Math.round(plan.price * 100), // Convert to cents
              recurring: {
                interval: plan.interval
              }
            },
            quantity: 1
          }
        ],
        mode: "subscription",
        success_url: `${req.protocol}://${req.get("host")}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get("host")}/subscription/cancel`,
        metadata: {
          userId: req.user.id.toString(),
          planId: plan.id.toString()
        }
      });
      
      res.status(200).json({
        sessionId: session.id,
        url: session.url
      });
    } catch (error) {
      console.error("Create subscription error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Handle subscription webhook from Stripe
  app.post("/api/webhook/stripe", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is not available" });
    }
    
    let event;
    const signature = req.headers["stripe-signature"];
    
    // Verify webhook signature
    try {
      // Note: In production, we would use a webhook secret
      // event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
      event = stripe.webhooks.constructEvent(
        req.body,
        signature || "",
        process.env.STRIPE_WEBHOOK_SECRET || "whsec_test"
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return res.status(400).json({ message: "Webhook signature verification failed" });
    }
    
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          
          // Get the user and plan from metadata
          const userId = Number(session.metadata.userId);
          const planId = Number(session.metadata.planId);
          
          // Get subscription ID
          const subscriptionId = session.subscription;
          
          // Update user with subscription info
          await storage.updateUserStripeInfo(userId, {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId as string
          });
          
          await storage.assignSubscriptionPlan(userId, planId);
          await storage.updateSubscriptionStatus(userId, "active");
          
          break;
        }
        
        case "invoice.payment_succeeded": {
          // Update subscription status to active
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription;
          
          // Find user with this subscription
          const users = await db
            .select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, subscriptionId as string));
          
          if (users.length > 0) {
            await storage.updateSubscriptionStatus(users[0].id, "active");
          }
          
          break;
        }
        
        case "invoice.payment_failed": {
          // Update subscription status to past_due
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription;
          
          // Find user with this subscription
          const users = await db
            .select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, subscriptionId as string));
          
          if (users.length > 0) {
            await storage.updateSubscriptionStatus(users[0].id, "past_due");
          }
          
          break;
        }
        
        case "customer.subscription.updated": {
          const subscription = event.data.object;
          
          // Find user with this subscription
          const users = await db
            .select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, subscription.id));
          
          if (users.length > 0) {
            // Update status based on subscription status
            await storage.updateSubscriptionStatus(
              users[0].id,
              subscription.status,
              subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : undefined
            );
          }
          
          break;
        }
        
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          
          // Find user with this subscription
          const users = await db
            .select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, subscription.id));
          
          if (users.length > 0) {
            await storage.updateSubscriptionStatus(users[0].id, "canceled");
            
            // Check if there's a default plan to assign
            const defaultPlan = await storage.getDefaultSubscriptionPlan();
            if (defaultPlan && defaultPlan.price === 0) {
              await storage.assignSubscriptionPlan(users[0].id, defaultPlan.id);
            }
          }
          
          break;
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ message: "Webhook processing error" });
    }
  });
  
  // Cancel a subscription
  app.post("/api/subscription/cancel", authenticate, async (req, res) => {
    try {
      const user = req.user;
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }
      
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is not available" });
      }
      
      // Cancel at period end rather than immediately
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      
      res.status(200).json({
        success: true,
        message: "Subscription will be canceled at the end of the billing period"
      });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Check if Stripe is configured
  app.get("/api/stripe/status", authenticate, isAdmin, async (req, res) => {
    try {
      const configured = !!process.env.STRIPE_SECRET_KEY && !!process.env.VITE_STRIPE_PUBLIC_KEY;
      res.status(200).json({ configured });
    } catch (error) {
      console.error("Stripe status check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      // Create the user
      const user = await storage.createUser(validatedData);
      
      // Create a session
      const session = await storage.createSession(user.id);
      
      // Set the session cookie
      res.cookie("sessionId", session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      // Return the user (without password)
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt:", req.body);
      const { username, password } = req.body;
      
      if (!username || !password) {
        console.log("Missing username or password");
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Get the user
      console.log("Finding user with username:", username);
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log("User not found");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log("Found user:", user.id, user.username);
      console.log("User password hash:", user.password);
      
      // Check the password
      console.log("Comparing passwords");
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log("Password match result:", passwordMatch);
      
      if (!passwordMatch) {
        console.log("Password does not match");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create a session
      const session = await storage.createSession(user.id);
      
      // Set the session cookie
      res.cookie("sessionId", session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      // Return the user (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/logout", authenticate, async (req, res) => {
    try {
      await storage.deleteSession(req.session.id);
      res.clearCookie("sessionId");
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/auth/me", authenticate, (req, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.status(200).json(userWithoutPassword);
  });
  
  // User management routes
  // Get all users (admin only)
  app.get("/api/users", authenticate, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a user (admin only)
  app.delete("/api/users/:userId", authenticate, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Don't allow deleting your own account this way
      if (userId === req.user?.id) {
        return res.status(400).json({ message: "Cannot delete your own account through this endpoint" });
      }
      
      // Check if the user exists
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete the user and all related data
      await storage.deleteUser(userId);
      
      console.log(`User ${userId} deleted successfully by admin ${req.user?.id}`);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  
  // Unassign a client from a therapist (admin only)
  app.patch("/api/users/:userId/unassign-therapist", authenticate, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role !== "client") {
        return res.status(400).json({ message: "Only clients can be unassigned from therapists" });
      }
      
      if (!user.therapistId) {
        return res.status(400).json({ message: "This client is not assigned to any therapist" });
      }
      
      // Update the user to remove therapist assignment
      const updatedUser = await storage.updateUser(userId, { therapistId: null });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error unassigning therapist:", error);
      res.status(500).json({ message: "Failed to unassign therapist" });
    }
  });
  
  // Reset a user's password to default (admin only)
  app.post("/api/users/:userId/reset-password", authenticate, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Default password
      const defaultPassword = "123456";
      
      // Hash the default password
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      // Update the user with the new password
      await storage.updateUser(userId, { password: hashedPassword });
      
      res.status(200).json({ message: "Password reset successfully", defaultPassword });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  
  // Assign subscription plan to a therapist (admin only)
  app.post("/api/users/:userId/subscription-plan", authenticate, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { planId } = req.body;
      
      if (!planId || isNaN(planId)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }
      
      // Get the user to verify they are a therapist
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (userToUpdate.role !== "therapist") {
        return res.status(400).json({ message: "Subscription plans can only be assigned to therapists" });
      }
      
      // Get the plan to verify it exists
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Assign the plan to the therapist
      const updatedUser = await storage.assignSubscriptionPlan(userId, planId);
      
      // Update subscription status to active or trial based on the plan
      const status = plan.price === 0 ? "trial" : "active";
      await storage.updateSubscriptionStatus(userId, status);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error assigning subscription plan:", error);
      res.status(500).json({ message: "Failed to assign subscription plan" });
    }
  });
  
  // Get clients for a therapist
  app.get("/api/users/clients", authenticate, isTherapist, async (req, res) => {
    try {
      const clients = await storage.getClients(req.user.id);
      // Remove passwords
      const clientsWithoutPasswords = clients.map(client => {
        const { password, ...clientWithoutPassword } = client;
        return clientWithoutPassword;
      });
      res.status(200).json(clientsWithoutPasswords);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Set the current viewing client for a therapist or admin
  app.post("/api/users/current-viewing-client", authenticate, async (req, res) => {
    try {
      const { clientId } = req.body;
      console.log(`Setting current viewing client for user ${req.user.id} (${req.user.role}) to client ${clientId}`);
      
      if (clientId === null) {
        // Clear the currently viewing client
        const updatedUser = await storage.updateCurrentViewingClient(req.user.id, null);
        const { password, ...userWithoutPassword } = updatedUser;
        return res.json({ success: true, user: userWithoutPassword });
      }
      
      // For admin users, they can view any user's data
      if (req.user.role === "admin") {
        // Just verify the user exists
        const targetUser = await storage.getUser(clientId);
        if (!targetUser) {
          return res.status(404).json({ error: "User not found" });
        }
      } 
      // For therapists, verify the client belongs to them
      else if (req.user.role === "therapist") {
        const clients = await storage.getClients(req.user.id);
        const clientExists = clients.some(client => client.id === clientId);
        
        if (!clientExists) {
          return res.status(403).json({ 
            error: "Not authorized to view this client" 
          });
        }
      }
      // Other roles can't switch users
      else {
        return res.status(403).json({ error: "Permission denied" });
      }
      
      // Update the viewing client in the database
      const updatedUser = await storage.updateCurrentViewingClient(req.user.id, clientId);
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({ 
        success: true, 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Error setting viewing client:", error);
      res.status(500).json({ error: "Failed to update viewing client" });
    }
  });
  
  // Get the currently viewing client for a therapist or admin
  app.get("/api/users/current-viewing-client", authenticate, async (req, res) => {
    try {
      console.log(`Getting current viewing client for user ${req.user.id} (${req.user.role})`);
      
      // Only therapists and admins can view other users' data
      if (req.user.role !== "therapist" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Permission denied" });
      }
      
      const clientId = await storage.getCurrentViewingClient(req.user.id);
      
      if (!clientId) {
        return res.json({ viewingClient: null });
      }
      
      // Get the client details
      const client = await storage.getUser(clientId);
      
      if (!client) {
        return res.json({ viewingClient: null });
      }
      
      res.json({ 
        viewingClient: {
          id: client.id,
          name: client.name,
          username: client.username,
          role: client.role
        } 
      });
    } catch (error) {
      console.error("Error getting viewing client:", error);
      res.status(500).json({ error: "Failed to get viewing client" });
    }
  });
  
  // Client invitation endpoint
  app.post("/api/users/invite-client", authenticate, isTherapist, async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ message: "Email and name are required" });
      }
      
      // Check if email is already registered
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }
      
      // Generate a unique invite token (this would typically be stored in the database)
      const crypto = await import('crypto');
      const inviteToken = crypto.randomBytes(32).toString('hex');
      
      // Generate invite link with token
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl}/register?token=${inviteToken}&therapistId=${req.user.id}`;
      
      // Send the invitation email
      const emailSent = await sendClientInvitation(
        email,
        req.user.name,
        inviteLink
      );
      
      if (!emailSent) {
        return res.status(500).json({ 
          message: "Failed to send invitation email. Please check your SendGrid configuration." 
        });
      }
      
      // In a production app, you would store the invitation in the database
      // with the token, expiration date, etc.
      
      res.status(200).json({ 
        message: "Invitation sent successfully",
        email,
        name,
        inviteLink // In production, you might not want to return this
      });
    } catch (error) {
      console.error("Invite client error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Emotion tracking routes - only clients can create records
  app.post("/api/users/:userId/emotions", authenticate, checkUserAccess, isClientOrAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Prepare emotion data with properly typed timestamp
      const emotionData = { 
        userId,
        coreEmotion: req.body.coreEmotion,
        primaryEmotion: req.body.primaryEmotion,
        tertiaryEmotion: req.body.tertiaryEmotion,
        intensity: req.body.intensity,
        situation: req.body.situation,
        location: req.body.location || null,
        company: req.body.company || null,
        // Always convert timestamp to a Date object for database insertion
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date()
      };
      
      // Log the processed data for debugging
      console.log("Processing emotion record:", {
        originalTimestamp: req.body.timestamp,
        convertedTimestamp: emotionData.timestamp,
        isDateObject: emotionData.timestamp instanceof Date,
        validDate: !isNaN(emotionData.timestamp.getTime())
      });
      
      // Validate the data using our schema
      let validationResult = insertEmotionRecordSchema.safeParse(emotionData);
      if (!validationResult.success) {
        console.log("Validation error:", validationResult.error);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }
      
      // Create the emotion record with the processed data
      const emotionRecord = await storage.createEmotionRecord(emotionData);
      res.status(201).json(emotionRecord);
    } catch (error) {
      console.error("Create emotion record error:", error);
      res.status(500).json({ 
        message: "Failed to record emotion",
        error: error.message
      });
    }
  });
  
  app.get("/api/users/:userId/emotions", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // If the user is a therapist with a current viewing client, show that client's emotions
      if (req.user?.role === 'therapist' && req.user.currentViewingClientId) {
        console.log(`Therapist ${req.user.id} is viewing client ${req.user.currentViewingClientId}'s emotions`);
        const clientEmotions = await storage.getEmotionRecordsByUser(req.user.currentViewingClientId);
        return res.status(200).json(clientEmotions);
      }
      
      const emotions = await storage.getEmotionRecordsByUser(userId);
      res.status(200).json(emotions);
    } catch (error) {
      console.error("Get emotion records error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete an emotion record
  app.delete("/api/users/:userId/emotions/:emotionId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotionId = parseInt(req.params.emotionId);
      
      // Check if emotion exists and belongs to user
      const emotion = await storage.getEmotionRecordById(emotionId);
      if (!emotion) {
        return res.status(404).json({ message: 'Emotion record not found' });
      }
      
      if (emotion.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this record' });
      }
      
      // Delete associated thought records first
      const thoughts = await storage.getThoughtRecordsByEmotionId(emotionId);
      if (thoughts && thoughts.length > 0) {
        for (const thought of thoughts) {
          await storage.deleteThoughtRecord(thought.id);
        }
      }
      
      // Then delete the emotion record
      await storage.deleteEmotionRecord(emotionId);
      
      res.status(200).json({ message: 'Emotion record deleted successfully' });
    } catch (error) {
      console.error('Error deleting emotion record:', error);
      res.status(500).json({ message: 'Error deleting emotion record' });
    }
  });
  
  // Get emotion statistics for charts/trends
  app.get("/api/users/:userId/emotions/stats", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const days = parseInt(req.query.days as string) || 30;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get all emotions within date range
      const emotions = await storage.getEmotionRecordsByUser(userId);
      const filteredEmotions = emotions.filter(emotion => {
        const emotionDate = new Date(emotion.createdAt);
        return emotionDate >= startDate && emotionDate <= endDate;
      });
      
      // Count emotions by core emotion
      const emotionCounts: Record<string, number> = {};
      filteredEmotions.forEach(emotion => {
        const coreEmotion = emotion.coreEmotion;
        emotionCounts[coreEmotion] = (emotionCounts[coreEmotion] || 0) + 1;
      });
      
      // Format for chart display
      const result = Object.keys(emotionCounts).map(emotion => ({
        emotion,
        count: emotionCounts[emotion],
        color: getEmotionColor(emotion)
      }));
      
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching emotion statistics:", error);
      res.status(500).json({ message: "Failed to fetch emotion statistics" });
    }
  });
  
  app.get("/api/emotions/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const emotion = await storage.getEmotionRecordById(id);
      
      if (!emotion) {
        return res.status(404).json({ message: "Emotion record not found" });
      }
      
      // Check if the user has access to this emotion record
      if (emotion.userId !== req.user.id) {
        // If it's a therapist, check if the emotion belongs to their client
        if (req.user.role === 'therapist') {
          const client = await storage.getUser(emotion.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== 'admin') {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.status(200).json(emotion);
    } catch (error) {
      console.error("Get emotion record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Thought record routes - only clients can create records
  app.post("/api/users/:userId/thoughts", authenticate, checkUserAccess, isClientOrAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertThoughtRecordSchema.parse({
        ...req.body,
        userId
      });
      
      const thoughtRecord = await storage.createThoughtRecord(validatedData);
      res.status(201).json(thoughtRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create thought record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/:userId/thoughts", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotionRecordId = req.query.emotionRecordId 
        ? parseInt(req.query.emotionRecordId as string) 
        : undefined;
      
      // If the user is a therapist with a current viewing client, show that client's thoughts
      if (req.user?.role === 'therapist' && req.user.currentViewingClientId) {
        console.log(`Therapist ${req.user.id} is viewing client ${req.user.currentViewingClientId}'s thoughts`);
        const clientThoughts = await storage.getThoughtRecordsByUser(req.user.currentViewingClientId);
        
        // Filter by emotion record ID if provided
        const filteredClientThoughts = emotionRecordId
          ? clientThoughts.filter(t => t.emotionRecordId === emotionRecordId)
          : clientThoughts;
          
        return res.status(200).json(filteredClientThoughts);
      }
      
      // Get all thoughts for this user
      const thoughts = await storage.getThoughtRecordsByUser(userId);
      
      // Filter by emotion record ID if provided
      const filteredThoughts = emotionRecordId
        ? thoughts.filter(t => t.emotionRecordId === emotionRecordId)
        : thoughts;
        
      res.status(200).json(filteredThoughts);
    } catch (error) {
      console.error("Get thought records error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a thought record
  app.delete("/api/users/:userId/thoughts/:thoughtId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const thoughtId = parseInt(req.params.thoughtId);
      
      // Check if thought exists and belongs to user
      const thought = await storage.getThoughtRecordById(thoughtId);
      if (!thought) {
        return res.status(404).json({ message: 'Thought record not found' });
      }
      
      if (thought.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this record' });
      }
      
      // Delete the thought record
      await storage.deleteThoughtRecord(thoughtId);
      
      res.status(200).json({ message: 'Thought record deleted successfully' });
    } catch (error) {
      console.error('Error deleting thought record:', error);
      res.status(500).json({ message: 'Error deleting thought record' });
    }
  });
  
  // Get thought record ratings for trends/charts
  app.get("/api/users/:userId/thoughts/ratings", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const days = parseInt(req.query.days as string) || 30;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get all thought records within date range
      const thoughts = await storage.getThoughtRecordsByUser(userId);
      const filteredThoughts = thoughts.filter(thought => {
        const thoughtDate = new Date(thought.createdAt);
        return thoughtDate >= startDate && thoughtDate <= endDate && thought.reflectionRating != null;
      });
      
      // Format data for time series chart
      const ratingsByDate: Record<string, number[]> = {};
      
      filteredThoughts.forEach(thought => {
        const date = new Date(thought.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
        if (!ratingsByDate[date]) {
          ratingsByDate[date] = [];
        }
        ratingsByDate[date].push(thought.reflectionRating);
      });
      
      // Calculate average rating per day
      const result = Object.keys(ratingsByDate).map(date => ({
        date,
        rating: Math.round(
          ratingsByDate[date].reduce((sum, val) => sum + val, 0) / ratingsByDate[date].length * 10
        ) / 10 // Round to 1 decimal place
      }));
      
      // Sort by date
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching thought record ratings:", error);
      res.status(500).json({ message: "Failed to fetch thought record ratings" });
    }
  });
  
  app.get("/api/thoughts/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const thought = await storage.getThoughtRecordById(id);
      
      if (!thought) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      
      // Check if the user has access to this thought record
      if (thought.userId !== req.user.id) {
        // If it's a therapist, check if the thought belongs to their client
        if (req.user.role === 'therapist') {
          const client = await storage.getUser(thought.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== 'admin') {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.status(200).json(thought);
    } catch (error) {
      console.error("Get thought record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Protective factors routes
  app.post("/api/users/:userId/protective-factors", authenticate, checkUserAccess, checkResourceCreationPermission, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertProtectiveFactorSchema.parse({
        ...req.body,
        userId
      });
      
      const factor = await storage.createProtectiveFactor(validatedData);
      res.status(201).json(factor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create protective factor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/:userId/protective-factors", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const includeGlobal = req.query.includeGlobal !== 'false';
      const factors = await storage.getProtectiveFactorsByUser(userId, includeGlobal);
      res.status(200).json(factors);
    } catch (error) {
      console.error("Get protective factors error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/users/:userId/protective-factors/:factorId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const factorId = parseInt(req.params.factorId);
      
      // Check if the factor exists
      const factor = await storage.getProtectiveFactorById(factorId);
      
      if (!factor) {
        return res.status(404).json({ message: "Protective factor not found" });
      }
      
      // Check if the user has access to the factor
      if (factor.userId !== userId && factor.userId !== null) {
        // Allow therapists to update factors for their clients
        if (req.user.role === 'therapist') {
          const client = await storage.getUser(factor.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== 'admin') {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      // Validate the update data
      const validatedData = insertProtectiveFactorSchema.partial().parse(req.body);
      
      // Prevent changes to userId field
      delete validatedData.userId;
      
      // Update the factor
      const updatedFactor = await storage.updateProtectiveFactor(factorId, validatedData);
      res.status(200).json(updatedFactor);
    } catch (error) {
      console.error("Update protective factor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/users/:userId/protective-factors/:factorId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const factorId = parseInt(req.params.factorId);
      
      // Check if the factor exists
      const factor = await storage.getProtectiveFactorById(factorId);
      
      if (!factor) {
        return res.status(404).json({ message: "Protective factor not found" });
      }
      
      // Check if the user has access to the factor
      if (factor.userId !== userId && factor.userId !== null) {
        // Allow therapists to delete factors for their clients
        if (req.user.role === 'therapist') {
          const client = await storage.getUser(factor.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== 'admin') {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      await storage.deleteProtectiveFactor(factorId);
      res.status(200).json({ message: "Protective factor deleted successfully" });
    } catch (error) {
      console.error("Delete protective factor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/users/:userId/protective-factor-usage", authenticate, checkUserAccess, checkResourceCreationPermission, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertProtectiveFactorUsageSchema.parse({
        ...req.body,
        userId
      });
      
      const usage = await storage.addProtectiveFactorUsage(validatedData);
      res.status(201).json(usage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Add protective factor usage error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Coping strategies routes
  app.post("/api/users/:userId/coping-strategies", authenticate, checkUserAccess, checkResourceCreationPermission, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertCopingStrategySchema.parse({
        ...req.body,
        userId
      });
      
      const strategy = await storage.createCopingStrategy(validatedData);
      res.status(201).json(strategy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create coping strategy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/:userId/coping-strategies", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const includeGlobal = req.query.includeGlobal !== 'false';
      const strategies = await storage.getCopingStrategiesByUser(userId, includeGlobal);
      res.status(200).json(strategies);
    } catch (error) {
      console.error("Get coping strategies error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/users/:userId/coping-strategies/:strategyId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const strategyId = parseInt(req.params.strategyId);
      
      // Check if the strategy exists
      const strategy = await storage.getCopingStrategyById(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: "Coping strategy not found" });
      }
      
      // Check if the user has access to the strategy
      if (strategy.userId !== userId && strategy.userId !== null) {
        // Allow therapists to update strategies for their clients
        if (req.user.role === 'therapist') {
          const client = await storage.getUser(strategy.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== 'admin') {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      // Validate the update data
      const validatedData = insertCopingStrategySchema.partial().parse(req.body);
      
      // Prevent changes to userId field
      delete validatedData.userId;
      
      // Update the strategy
      const updatedStrategy = await storage.updateCopingStrategy(strategyId, validatedData);
      res.status(200).json(updatedStrategy);
    } catch (error) {
      console.error("Update coping strategy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/users/:userId/coping-strategies/:strategyId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const strategyId = parseInt(req.params.strategyId);
      
      // Check if the strategy exists
      const strategy = await storage.getCopingStrategyById(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: "Coping strategy not found" });
      }
      
      // Check if the user has access to the strategy
      if (strategy.userId !== userId && strategy.userId !== null) {
        // Allow therapists to delete strategies for their clients
        if (req.user.role === 'therapist') {
          const client = await storage.getUser(strategy.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== 'admin') {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      await storage.deleteCopingStrategy(strategyId);
      res.status(200).json({ message: "Coping strategy deleted successfully" });
    } catch (error) {
      console.error("Delete coping strategy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/users/:userId/coping-strategy-usage", authenticate, checkUserAccess, checkResourceCreationPermission, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertCopingStrategyUsageSchema.parse({
        ...req.body,
        userId
      });
      
      const usage = await storage.addCopingStrategyUsage(validatedData);
      res.status(201).json(usage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Add coping strategy usage error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Goals routes - only clients can create goals
  app.post("/api/users/:userId/goals", authenticate, checkUserAccess, isClientOrAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log("Creating goal with data:", JSON.stringify(req.body));
      
      // Create a new object with all the goal data
      let updatedBody = { ...req.body, userId };
      
      // Convert deadline string to a Date object if it exists
      if (updatedBody.deadline && typeof updatedBody.deadline === 'string') {
        try {
          updatedBody.deadline = new Date(updatedBody.deadline);
        } catch (dateError) {
          console.error("Date conversion error:", dateError);
          // If date parsing fails, set to null
          updatedBody.deadline = null;
        }
      }
      
      const validatedData = insertGoalSchema.parse(updatedBody);
      console.log("Validated goal data:", JSON.stringify(validatedData));
      
      const goal = await storage.createGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Goal validation error:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create goal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/:userId/goals", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // If the user is a therapist with a current viewing client, show that client's goals
      if (req.user.role === 'therapist' && req.user.currentViewingClientId) {
        console.log(`Therapist ${req.user.id} is viewing client ${req.user.currentViewingClientId}'s goals`);
        const clientGoals = await storage.getGoalsByUser(req.user.currentViewingClientId);
        return res.status(200).json(clientGoals);
      }
      
      const goals = await storage.getGoalsByUser(userId);
      res.status(200).json(goals);
    } catch (error) {
      console.error("Get goals error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/goals/:id/status", authenticate, async (req, res) => {
    try {
      const { status, therapistComments } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Get the goal to check ownership
      const id = parseInt(req.params.id);
      const goal = await storage.getGoalsByUser(req.user.id).then(
        goals => goals.find(g => g.id === id)
      );
      
      if (!goal && req.user.role !== 'therapist' && req.user.role !== 'admin') {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // If user is a therapist, check if the goal belongs to their client
      if (req.user.role === 'therapist' && !goal) {
        // Find the goal first
        const [updatedGoal] = await db
          .select()
          .from(goals)
          .where(eq(goals.id, id));
        
        if (!updatedGoal) {
          return res.status(404).json({ message: "Goal not found" });
        }
        
        // Check if the client is theirs
        const client = await storage.getUser(updatedGoal.userId);
        if (!client || client.therapistId !== req.user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const updatedGoal = await storage.updateGoalStatus(id, status, therapistComments);
      res.status(200).json(updatedGoal);
    } catch (error) {
      console.error("Update goal status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Goal milestones routes
  app.post("/api/goals/:goalId/milestones", authenticate, async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      console.log("Creating milestone with data:", JSON.stringify(req.body));
      
      // First, retrieve the goal to check ownership and permissions
      const [goal] = await db
        .select()
        .from(goals)
        .where(eq(goals.id, goalId));
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // If it's the user's own goal - always allow
      if (req.user.id === goal.userId) {
        // Continue with creation
      }
      // If therapist is creating milestone for their client's goal - allow
      else if (req.user.role === 'therapist') {
        // First check: therapist cannot create milestones for their own goals
        if (goal.userId === req.user.id) {
          return res.status(403).json({ message: 'As a therapist, you can only provide feedback on goals, not create milestones for your own goals.' });
        }
        
        // Second check: Verify the goal belongs to their client
        const client = await storage.getUser(goal.userId);
        if (!client || client.therapistId !== req.user.id) {
          return res.status(403).json({ message: 'Access denied. You can only create milestones for your clients\' goals.' });
        }
        // Continue with creation
      }
      // Admin can create milestones for any goal
      else if (req.user.role === 'admin') {
        // Continue with creation
      }
      else {
        return res.status(403).json({ message: 'Access denied. You can only create milestones for your own goals.' });
      }
      
      // Create updated body with converted date
      let updatedBody = { ...req.body, goalId };
      
      // Convert dueDate string to a Date object if it exists
      if (updatedBody.dueDate && typeof updatedBody.dueDate === 'string') {
        try {
          updatedBody.dueDate = new Date(updatedBody.dueDate);
        } catch (dateError) {
          console.error("Date conversion error:", dateError);
          // If date parsing fails, set to null
          updatedBody.dueDate = null;
        }
      }
      
      const validatedData = insertGoalMilestoneSchema.parse(updatedBody);
      console.log("Validated milestone data:", JSON.stringify(validatedData));
      
      const milestone = await storage.createGoalMilestone(validatedData);
      res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Milestone validation error:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create goal milestone error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/goals/:goalId/milestones", authenticate, async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      
      // First, retrieve the goal to check ownership and permissions
      const [goal] = await db
        .select()
        .from(goals)
        .where(eq(goals.id, goalId));
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // If it's the user's own goal - always allow
      if (req.user.id === goal.userId) {
        // Continue with request
      }
      // If therapist is viewing their client's goal - allow
      else if (req.user.role === 'therapist') {
        // Verify the goal belongs to their client
        const client = await storage.getUser(goal.userId);
        if (!client || client.therapistId !== req.user.id) {
          return res.status(403).json({ message: 'Access denied. You can only view milestones for your clients\' goals.' });
        }
        // Continue with request
      }
      // Admin can view any goal's milestones
      else if (req.user.role === 'admin') {
        // Continue with request
      }
      else {
        return res.status(403).json({ message: 'Access denied. You can only view milestones for your own goals.' });
      }
      
      const milestones = await storage.getGoalMilestonesByGoal(goalId);
      res.status(200).json(milestones);
    } catch (error) {
      console.error("Get goal milestones error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/milestones/:id/completion", authenticate, async (req, res) => {
    try {
      const { isCompleted } = req.body;
      
      if (isCompleted === undefined) {
        return res.status(400).json({ message: "isCompleted field is required" });
      }
      
      const id = parseInt(req.params.id);
      
      // First get the milestone to check associated goal ownership
      const [milestone] = await db
        .select()
        .from(goalMilestones)
        .where(eq(goalMilestones.id, id));
      
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      // Now get the associated goal to check permissions
      const [goal] = await db
        .select()
        .from(goals)
        .where(eq(goals.id, milestone.goalId));
      
      if (!goal) {
        return res.status(404).json({ message: "Associated goal not found" });
      }
      
      // If it's the user's own goal - always allow
      if (req.user.id === goal.userId) {
        // Continue with update
      }
      // If therapist is updating their client's goal milestone - allow
      else if (req.user.role === 'therapist') {
        // First check: therapist cannot update milestones for their own goals
        if (goal.userId === req.user.id) {
          return res.status(403).json({ message: 'As a therapist, you can only provide feedback on goals, not update milestones for your own goals.' });
        }
        
        // Second check: Verify the goal belongs to their client
        const client = await storage.getUser(goal.userId);
        if (!client || client.therapistId !== req.user.id) {
          return res.status(403).json({ message: 'Access denied. You can only update milestones for your clients\' goals.' });
        }
        // Continue with update
      }
      // Admin can update any milestone
      else if (req.user.role === 'admin') {
        // Continue with update
      }
      else {
        return res.status(403).json({ message: 'Access denied. You can only update milestones for your own goals.' });
      }
      
      const updatedMilestone = await storage.updateGoalMilestoneCompletion(id, isCompleted);
      res.status(200).json(updatedMilestone);
    } catch (error) {
      console.error("Update milestone completion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Actions routes - only clients can create actions
  app.post("/api/users/:userId/actions", authenticate, checkUserAccess, isClientOrAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertActionSchema.parse({
        ...req.body,
        userId
      });
      
      const action = await storage.createAction(validatedData);
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create action error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/:userId/actions", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const actions = await storage.getActionsByUser(userId);
      res.status(200).json(actions);
    } catch (error) {
      console.error("Get actions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/actions/:id/completion", authenticate, async (req, res) => {
    try {
      const { isCompleted, moodAfter, reflection } = req.body;
      
      if (isCompleted === undefined) {
        return res.status(400).json({ message: "isCompleted field is required" });
      }
      
      const id = parseInt(req.params.id);
      
      // First get the action to check ownership
      const [action] = await db
        .select()
        .from(actions)
        .where(eq(actions.id, id));
      
      if (!action) {
        return res.status(404).json({ message: "Action not found" });
      }
      
      // If it's the user's own action - always allow
      if (req.user.id === action.userId) {
        // Continue with update
      }
      // If therapist is updating their client's action - allow
      else if (req.user.role === 'therapist') {
        // First check: therapist cannot update their own actions
        if (action.userId === req.user.id) {
          return res.status(403).json({ message: 'As a therapist, you can only provide feedback on actions, not update your own actions.' });
        }
        
        // Second check: Verify the action belongs to their client
        const client = await storage.getUser(action.userId);
        if (!client || client.therapistId !== req.user.id) {
          return res.status(403).json({ message: 'Access denied. You can only update actions for your clients.' });
        }
        // Continue with update
      }
      // Admin can update any action
      else if (req.user.role === 'admin') {
        // Continue with update
      }
      else {
        return res.status(403).json({ message: 'Access denied. You can only update your own actions.' });
      }
      
      const updatedAction = await storage.updateActionCompletion(id, isCompleted, moodAfter, reflection);
      res.status(200).json(updatedAction);
    } catch (error) {
      console.error("Update action completion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Email notification endpoints (protected for admin and system use)
  app.post("/api/notifications/emotion-reminders", isAdmin, async (req, res) => {
    try {
      const { daysWithoutTracking } = req.body;
      const remindersSent = await sendEmotionTrackingReminders(daysWithoutTracking || 2);
      res.status(200).json({ 
        message: `Sent ${remindersSent} emotion tracking reminders` 
      });
    } catch (error) {
      console.error("Send emotion reminders error:", error);
      res.status(500).json({ message: "Failed to send emotion tracking reminders" });
    }
  });
  
  app.post("/api/notifications/weekly-digests", isAdmin, async (req, res) => {
    try {
      const digestsSent = await sendWeeklyProgressDigests();
      res.status(200).json({ 
        message: `Sent ${digestsSent} weekly progress digests` 
      });
    } catch (error) {
      console.error("Send weekly digests error:", error);
      res.status(500).json({ message: "Failed to send weekly progress digests" });
    }
  });
  
  // In-app notification endpoints
  app.get("/api/notifications", authenticate, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const notifications = await storage.getNotificationsByUser(userId, limit);
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  app.get("/api/notifications/unread", authenticate, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await storage.getUnreadNotificationsByUser(userId);
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });
  
  app.post("/api/notifications/read/:id", authenticate, async (req, res) => {
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
      res.status(200).json(updatedNotification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  app.post("/api/notifications/read-all", authenticate, async (req, res) => {
    try {
      const userId = req.user!.id;
      await storage.markAllNotificationsAsRead(userId);
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });
  
  app.delete("/api/notifications/:id", authenticate, async (req, res) => {
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
      res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });
  
  // Test endpoint to create a notification (will be removed in production)
  app.post("/api/notifications/test", authenticate, async (req, res) => {
    try {
      const userId = req.user!.id;
      const testNotification = await storage.createNotification({
        userId,
        title: "Test Notification",
        body: "This is a test notification to verify functionality.", // Changed from content to body
        type: "system",
        isRead: false
      });
      res.status(201).json(testNotification);
    } catch (error) {
      console.error("Error creating test notification:", error);
      res.status(500).json({ message: "Failed to create test notification" });
    }
  });
  
  // Get protective factors used for a specific thought record
  app.get("/api/users/:userId/thoughts/:id/protective-factors", authenticate, checkUserAccess, async (req, res) => {
    try {
      const thoughtId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      
      // First verify thought record exists and belongs to user
      const thoughtRecord = await storage.getThoughtRecordById(thoughtId);
      if (!thoughtRecord || thoughtRecord.userId !== userId) {
        return res.status(404).json({ message: 'Thought record not found' });
      }
      
      // Query the database to get protective factors used in this thought record
      const query = `
        SELECT pf.id, pf.name
        FROM protective_factors pf
        JOIN protective_factor_usage pfu ON pf.id = pfu.protective_factor_id
        WHERE pfu.thought_record_id = $1
      `;
      
      const result = await pool.query(query, [thoughtId]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching protective factors for thought record:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get coping strategies used for a specific thought record
  app.get("/api/users/:userId/thoughts/:id/coping-strategies", authenticate, checkUserAccess, async (req, res) => {
    try {
      const thoughtId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      
      // First verify thought record exists and belongs to user
      const thoughtRecord = await storage.getThoughtRecordById(thoughtId);
      if (!thoughtRecord || thoughtRecord.userId !== userId) {
        return res.status(404).json({ message: 'Thought record not found' });
      }
      
      // Query the database to get coping strategies used in this thought record
      const query = `
        SELECT cs.id, cs.name
        FROM coping_strategies cs
        JOIN coping_strategy_usage csu ON cs.id = csu.coping_strategy_id
        WHERE csu.thought_record_id = $1
      `;
      
      const result = await pool.query(query, [thoughtId]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching coping strategies for thought record:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Resource Library API Routes
  
  // Get all resources
  app.get("/api/resources", authenticate, async (req, res) => {
    try {
      const includeUnpublished = req.user.role === "admin";
      const resources = await storage.getAllResources(includeUnpublished);
      res.status(200).json(resources);
    } catch (error) {
      console.error("Get resources error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get resource by ID
  app.get("/api/resources/:id", authenticate, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Only allow access to published resources unless user is admin or the creator
      if (!resource.isPublished && req.user.role !== "admin" && resource.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied to unpublished resource" });
      }
      
      res.status(200).json(resource);
    } catch (error) {
      console.error("Get resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a new resource (therapists and admins only)
  app.post("/api/resources", authenticate, async (req, res) => {
    try {
      // Only therapists and admins can create resources
      if (req.user.role !== "therapist" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Only therapists and admins can create resources" });
      }
      
      const validatedData = insertResourceSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const newResource = await storage.createResource(validatedData);
      res.status(201).json(newResource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Clone a resource (therapists only)
  app.post("/api/resources/:id/clone", authenticate, isTherapist, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Only allow cloning of published resources
      if (!resource.isPublished) {
        return res.status(403).json({ message: "Cannot clone unpublished resources" });
      }
      
      const clonedResource = await storage.cloneResource(resourceId, req.user.id);
      res.status(201).json(clonedResource);
    } catch (error) {
      console.error("Clone resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a resource
  app.patch("/api/resources/:id", authenticate, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Only allow updates by the creator or admin
      if (resource.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only update resources you created" });
      }
      
      const validatedData = insertResourceSchema.partial().parse(req.body);
      
      // Don't allow changing the creator
      delete validatedData.createdBy;
      
      const updatedResource = await storage.updateResource(resourceId, validatedData);
      res.status(200).json(updatedResource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a resource
  app.delete("/api/resources/:id", authenticate, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Only allow deletion by the creator or admin
      if (resource.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only delete resources you created" });
      }
      
      await storage.deleteResource(resourceId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get resources by category
  app.get("/api/resources/category/:category", authenticate, async (req, res) => {
    try {
      const category = req.params.category;
      const resources = await storage.getResourcesByCategory(category);
      res.status(200).json(resources);
    } catch (error) {
      console.error("Get resources by category error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get resources created by a user
  app.get("/api/users/:userId/resources", authenticate, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow viewing others' resources if they're published or if the viewer is an admin
      const resources = await storage.getResourcesByCreator(userId);
      
      if (userId !== req.user.id && req.user.role !== "admin") {
        // Filter out unpublished resources
        const publishedResources = resources.filter(resource => resource.isPublished);
        return res.status(200).json(publishedResources);
      }
      
      res.status(200).json(resources);
    } catch (error) {
      console.error("Get user resources error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Resource Assignment API Routes
  
  // Assign a resource to a client (therapists only)
  app.post("/api/resource-assignments", authenticate, isTherapist, async (req, res) => {
    try {
      const { resourceId, assignedTo, notes, isPriority } = req.body;
      
      if (!resourceId || !assignedTo) {
        return res.status(400).json({ message: "Resource ID and client ID are required" });
      }
      
      // Verify the resource exists
      const resource = await storage.getResourceById(Number(resourceId));
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Verify the client exists and is assigned to the therapist
      const clients = await storage.getClients(req.user.id);
      const clientExists = clients.some(client => client.id === Number(assignedTo));
      
      if (!clientExists) {
        return res.status(403).json({ message: "Client not found or not assigned to you" });
      }
      
      const assignmentData = {
        resourceId: Number(resourceId),
        assignedBy: req.user.id,
        assignedTo: Number(assignedTo),
        notes: notes || null,
        isPriority: isPriority || false,
        status: "assigned"
      };
      
      const validatedData = insertResourceAssignmentSchema.parse(assignmentData);
      const assignment = await storage.assignResourceToClient(validatedData);
      
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Assign resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Alternative endpoint for resource assignment (used by client-side code)
  app.post("/api/resources/assign", authenticate, isTherapist, async (req, res) => {
    try {
      const { resourceId, clientId, notes } = req.body;
      
      if (!resourceId || !clientId) {
        return res.status(400).json({ message: "Resource ID and client ID are required" });
      }
      
      // Verify the resource exists
      const resource = await storage.getResourceById(Number(resourceId));
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Verify the client exists and is assigned to the therapist
      const clients = await storage.getClients(req.user.id);
      const clientExists = clients.some(client => client.id === Number(clientId));
      
      if (!clientExists) {
        return res.status(403).json({ message: "Client not found or not assigned to you" });
      }
      
      const assignmentData = {
        resourceId: Number(resourceId),
        assignedBy: req.user.id,
        assignedTo: Number(clientId),
        notes: notes || null,
        isPriority: false,
        status: "assigned"
      };
      
      const validatedData = insertResourceAssignmentSchema.parse(assignmentData);
      const assignment = await storage.assignResourceToClient(validatedData);
      
      res.status(200).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Assign resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get assignments for a client
  app.get("/api/clients/:clientId/assignments", authenticate, async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      // The client can view their own assignments, and their therapist can view them too
      const client = await storage.getUser(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      if (clientId !== req.user.id && client.therapistId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only view assignments for your own clients" });
      }
      
      const assignments = await storage.getAssignmentsByClient(clientId);
      
      // Fetch resources for each assignment
      const assignmentsWithResources = await Promise.all(
        assignments.map(async (assignment) => {
          const resource = await storage.getResourceById(assignment.resourceId);
          return {
            ...assignment,
            resource
          };
        })
      );
      
      res.status(200).json(assignmentsWithResources);
    } catch (error) {
      console.error("Get client assignments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get assignments created by a therapist
  app.get("/api/therapist/assignments", authenticate, isTherapist, async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsByTherapist(req.user.id);
      
      // Fetch resources and clients for each assignment
      const assignmentsWithDetails = await Promise.all(
        assignments.map(async (assignment) => {
          const resource = await storage.getResourceById(assignment.resourceId);
          const client = await storage.getUser(assignment.assignedTo);
          
          console.log(`Assignment ${assignment.id} client data:`, client ? { 
            id: client.id, 
            name: client.name, 
            username: client.username 
          } : 'No client found');
          
          return {
            ...assignment,
            resource,
            client: client ? {
              id: client.id,
              name: client.name || null,
              username: client.username
            } : {
              id: assignment.assignedTo,
              name: null,
              username: 'Unknown Client'
            }
          };
        })
      );
      
      res.status(200).json(assignmentsWithDetails);
    } catch (error) {
      console.error("Get therapist assignments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update assignment status (mark as viewed or completed)
  app.patch("/api/resource-assignments/:id/status", authenticate, async (req, res) => {
    try {
      const assignmentId = Number(req.params.id);
      if (isNaN(assignmentId)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      
      const { status } = req.body;
      if (!status || !["viewed", "completed"].includes(status)) {
        return res.status(400).json({ message: "Valid status (viewed or completed) is required" });
      }
      
      const assignment = await storage.getResourceAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Only the assigned client can update the status
      if (assignment.assignedTo !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own assignments" });
      }
      
      const updatedAssignment = await storage.updateAssignmentStatus(assignmentId, status);
      res.status(200).json(updatedAssignment);
    } catch (error) {
      console.error("Update assignment status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a resource assignment (therapists only)
  app.delete("/api/resource-assignments/:id", authenticate, isTherapist, async (req, res) => {
    try {
      const assignmentId = Number(req.params.id);
      if (isNaN(assignmentId)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      
      const assignment = await storage.getResourceAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Only the therapist who created the assignment can delete it
      if (assignment.assignedBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only delete assignments you created" });
      }
      
      await storage.deleteResourceAssignment(assignmentId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete assignment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Resource Feedback API Routes
  
  // Submit feedback for a resource
  app.post("/api/resources/:id/feedback", authenticate, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      const { rating, feedback } = req.body;
      
      if (rating === undefined) {
        return res.status(400).json({ message: "Rating is required" });
      }
      
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      // Verify the resource exists
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Check if the resource was assigned to this client
      if (req.user.role === "client") {
        const assignments = await storage.getAssignmentsByClient(req.user.id);
        const wasAssigned = assignments.some(a => a.resourceId === resourceId);
        
        if (!wasAssigned) {
          return res.status(403).json({ message: "You can only provide feedback for resources assigned to you" });
        }
      }
      
      const feedbackData = {
        resourceId,
        userId: req.user.id,
        rating,
        feedback: feedback || null
      };
      
      const validatedData = insertResourceFeedbackSchema.parse(feedbackData);
      const newFeedback = await storage.createResourceFeedback(validatedData);
      
      res.status(201).json(newFeedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Submit feedback error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get feedback for a specific resource
  app.get("/api/resources/:id/feedback", authenticate, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      // Verify the resource exists
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Only the resource creator or admin can see all feedback
      if (resource.createdBy !== req.user.id && req.user.role !== "admin" && req.user.role !== "therapist") {
        return res.status(403).json({ message: "Access denied to resource feedback" });
      }
      
      const feedback = await storage.getResourceFeedbackByResource(resourceId);
      
      // Fetch user details for each feedback
      const feedbackWithUserDetails = await Promise.all(
        feedback.map(async (fb) => {
          const user = await storage.getUser(fb.userId);
          return {
            ...fb,
            user: user ? {
              id: user.id,
              name: user.name,
              username: user.username
            } : null
          };
        })
      );
      
      res.status(200).json(feedbackWithUserDetails);
    } catch (error) {
      console.error("Get resource feedback error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Journal Routes
  
  // Get all journal entries for a user
  app.get("/api/users/:userId/journal", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      
      const entries = await storage.getJournalEntriesByUser(userId);
      res.status(200).json(entries);
    } catch (error) {
      console.error("Get journal entries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a specific journal entry by ID
  app.get("/api/journal/:id", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid journal entry ID" });
      }
      
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Check if user has access to this entry
      const user = req.user;
      if (entry.userId !== user.id && 
          (user.role !== 'therapist' || 
           (await storage.getUser(entry.userId))?.therapistId !== user.id) && 
          user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get comments for this entry if user is therapist or admin or the entry owner
      const comments = await storage.getJournalCommentsByEntry(entryId);
      
      res.status(200).json({
        ...entry,
        comments
      });
    } catch (error) {
      console.error("Get journal entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a new journal entry
  app.post("/api/journal", authenticate, async (req, res) => {
    try {
      // Validate the data
      const validatedData = insertJournalEntrySchema.parse({
        ...req.body,
        userId: req.user.id, // Ensure the entry is created for the authenticated user
      });
      
      // Create the journal entry
      const newEntry = await storage.createJournalEntry(validatedData);
      
      // If there's content, analyze it with OpenAI to suggest tags
      if (validatedData.content && process.env.OPENAI_API_KEY) {
        try {
          const analysis = await analyzeJournalEntry(
            validatedData.title || "",
            validatedData.content
          );
          
          // Update the entry with AI analysis
          // Also store initialAiTags to track which tags are from the original analysis
          const updatedEntry = await storage.updateJournalEntry(newEntry.id, {
            aiSuggestedTags: analysis.suggestedTags,
            initialAiTags: analysis.suggestedTags, // Store initial tags separately to track origin
            aiAnalysis: analysis.analysis,
            emotions: analysis.emotions,
            topics: analysis.topics,
            detectedDistortions: analysis.cognitiveDistortions || [], // Include detected cognitive distortions
            sentimentPositive: analysis.sentiment.positive,
            sentimentNegative: analysis.sentiment.negative,
            sentimentNeutral: analysis.sentiment.neutral
          });
          
          console.log(`Journal entry ${newEntry.id} created with initial AI tags:`, analysis.suggestedTags);
          return res.status(201).json(updatedEntry);
        } catch (aiError) {
          console.error("AI analysis error:", aiError);
          // Continue without AI analysis if it fails
          return res.status(201).json(newEntry);
        }
      }
      
      res.status(201).json(newEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create journal entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a journal entry (user can only update their own entries)
  app.patch("/api/journal/:id", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid journal entry ID" });
      }
      
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Check if user owns this entry
      if (entry.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate the data
      const validatedData = insertJournalEntrySchema.partial().parse(req.body);
      
      // If content was updated and there's an OpenAI key, re-analyze the content
      let updatedData = validatedData;
      if (validatedData.content && process.env.OPENAI_API_KEY) {
        try {
          const analysis = await analyzeJournalEntry(
            validatedData.title || entry.title || "",
            validatedData.content
          );
          
          // Add AI analysis to update data
          updatedData = {
            ...validatedData,
            aiSuggestedTags: analysis.suggestedTags,
            aiAnalysis: analysis.analysis,
            emotions: analysis.emotions,
            topics: analysis.topics,
            detectedDistortions: analysis.cognitiveDistortions || [], // Include cognitive distortions
            sentimentPositive: analysis.sentiment.positive,
            sentimentNegative: analysis.sentiment.negative,
            sentimentNeutral: analysis.sentiment.neutral
          };
        } catch (aiError) {
          console.error("AI analysis error on update:", aiError);
          // Continue without updating AI analysis if it fails
        }
      }
      
      // Update the entry
      const updatedEntry = await storage.updateJournalEntry(entryId, updatedData);
      res.status(200).json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update journal entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a journal entry (user can only delete their own entries)
  app.delete("/api/journal/:id", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid journal entry ID" });
      }
      
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Check if user owns this entry or is admin
      if (entry.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete the entry
      await storage.deleteJournalEntry(entryId);
      res.status(200).json({ message: "Journal entry deleted successfully" });
    } catch (error) {
      console.error("Delete journal entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update selected tags for a journal entry
  app.post("/api/journal/:id/tags", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid journal entry ID" });
      }
      
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Check if user owns this entry
      if (entry.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate the data
      const { selectedTags } = req.body;
      if (!Array.isArray(selectedTags)) {
        return res.status(400).json({ message: "Selected tags must be an array" });
      }
      
      // Update the entry with selected tags
      const updatedEntry = await storage.updateJournalEntry(entryId, {
        userSelectedTags: selectedTags
      });
      
      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error("Update journal tags error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Add a comment to a journal entry (therapist can only comment on their clients' entries)
  app.post("/api/journal/:id/comments", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid journal entry ID" });
      }
      
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Check if user is therapist for this client or admin
      const user = req.user;
      if (user.role === 'client' && entry.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      } else if (user.role === 'therapist') {
        const client = await storage.getUser(entry.userId);
        if (!client || client.therapistId !== user.id) {
          return res.status(403).json({ message: "Access denied - not your client" });
        }
      }
      
      // Validate the data
      // Map content field from frontend to comment field expected by schema
      const { content, ...restBody } = req.body;
      const validatedData = insertJournalCommentSchema.parse({
        ...restBody,
        comment: content, // Map content to comment
        userId: user.id,
        therapistId: user.role === 'therapist' ? user.id : null,
        journalEntryId: entryId
      });
      
      // Create the comment
      const newComment = await storage.createJournalComment(validatedData);
      
      // Generate new AI suggestions based on the combined content (entry + comments)
      // This allows tags to evolve as the conversation develops
      if (process.env.OPENAI_API_KEY && entry.content) {
        try {
          console.log("Starting AI analysis for comment on entry:", entryId);
          
          // Get all existing comments including the one we just added
          const comments = await storage.getJournalCommentsByEntry(entryId);
          console.log(`Found ${comments.length} comments for analysis`);
          
          // Make sure we have valid comment objects with the comment field
          if (!comments || !Array.isArray(comments)) {
            console.error("Invalid comments array returned from storage:", comments);
            throw new Error("Invalid comments data structure");
          }
          
          // Construct the combined text
          const combinedText = `
            ${entry.title || ""}
            
            ${entry.content}
            
            Additional comments:
            ${comments.map(c => c.comment || "").join("\n\n")}
          `;
          
          console.log("Sending combined text for AI analysis");
          
          // Get new AI analysis based on the combined content
          const analysis = await analyzeJournalEntry(
            entry.title || "",
            combinedText
          );
          
          console.log("Received AI analysis:", {
            suggestedTagsCount: analysis.suggestedTags.length,
            emotions: analysis.emotions,
            topics: analysis.topics
          });
          
          // Merge new tags with existing ones to avoid duplicates
          const existingTags = entry.aiSuggestedTags || [];
          const allTags = [...new Set([...existingTags, ...analysis.suggestedTags])];
          
          // Ensure we have a good mix of emotions and topics
          const emotionTags = analysis.emotions || [];
          const topicTags = analysis.topics || [];
          
          console.log("Updating journal entry with combined tags:", {
            existingTagsCount: existingTags.length,
            newTagsCount: allTags.length,
            emotionTagsCount: emotionTags.length,
            topicTagsCount: topicTags.length
          });
          
          // Get updated entry with full data for client response
          const updatedEntry = await storage.updateJournalEntry(entryId, {
            aiSuggestedTags: allTags,
            // Do not modify initialAiTags, which tracks the original AI tags
            aiAnalysis: analysis.analysis,
            emotions: emotionTags.length > 0 ? emotionTags : entry.emotions || [],
            topics: topicTags.length > 0 ? topicTags : entry.topics || [],
            detectedDistortions: analysis.cognitiveDistortions || [], // Include detected cognitive distortions
            sentimentPositive: analysis.sentiment.positive,
            sentimentNegative: analysis.sentiment.negative,
            sentimentNeutral: analysis.sentiment.neutral
          });
          
          // After comment creation, return the comment with the updated entry
          // This ensures the client has the most recent tags
          newComment.updatedEntry = updatedEntry;
          
          console.log("Successfully updated journal entry with new AI analysis");
        } catch (aiError) {
          console.error("AI analysis after comment error:", aiError);
          console.error("Error details:", aiError instanceof Error ? aiError.message : String(aiError));
          console.error("Stack trace:", aiError instanceof Error ? aiError.stack : "No stack trace available");
          // Continue without updating AI analysis if it fails
        }
      } else {
        console.log(
          "Skipping AI analysis:",
          !process.env.OPENAI_API_KEY ? "No OpenAI API key" : "No entry content"
        );
      }
      
      res.status(201).json(newComment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Journal comment validation error:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create journal comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a comment (user can only update their own comments)
  app.patch("/api/journal/comments/:id", authenticate, async (req, res) => {
    try {
      const commentId = Number(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      // Get the comment
      const [comment] = await db
        .select()
        .from(journalComments)
        .where(eq(journalComments.id, commentId));
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if user owns this comment
      if (comment.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate the data
      // Map content field from frontend to comment field expected by schema
      const { content, ...restBody } = req.body;
      const validatedData = insertJournalCommentSchema.partial().parse({
        ...restBody,
        comment: content, // Map content to comment if it exists
      });
      
      // Update the comment
      const updatedComment = await storage.updateJournalComment(commentId, validatedData);
      res.status(200).json(updatedComment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update journal comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a comment (user can only delete their own comments or admin)
  app.delete("/api/journal/comments/:id", authenticate, async (req, res) => {
    try {
      const commentId = Number(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      // Get the comment
      const [comment] = await db
        .select()
        .from(journalComments)
        .where(eq(journalComments.id, commentId));
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if user owns this comment or is admin
      if (comment.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete the comment
      await storage.deleteJournalComment(commentId);
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Delete journal comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get journal statistics for a user
  app.get("/api/users/:userId/journal/stats", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      
      // Get all journal entries for this user
      const entries = await storage.getJournalEntriesByUser(userId);
      
      // Extract stats from entries
      const stats = {
        totalEntries: entries.length,
        emotions: {} as Record<string, number>,
        topics: {} as Record<string, number>,
        cognitiveDistortions: {} as Record<string, number>, // Add tracking for cognitive distortions
        sentimentOverTime: entries.map(entry => ({
          date: entry.createdAt,
          positive: entry.sentimentPositive || 0,
          negative: entry.sentimentNegative || 0,
          neutral: entry.sentimentNeutral || 0
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        tagsFrequency: {} as Record<string, number>,
        sentimentPatterns: {
          positive: 0,
          neutral: 0,
          negative: 0
        }
      };
      
      // Calculate overall sentiment patterns
      if (entries.length > 0) {
        let totalPositive = 0;
        let totalNegative = 0;
        let totalNeutral = 0;
        
        entries.forEach(entry => {
          totalPositive += entry.sentimentPositive || 0;
          totalNegative += entry.sentimentNegative || 0;
          totalNeutral += entry.sentimentNeutral || 0;
        });
        
        const total = totalPositive + totalNegative + totalNeutral;
        
        if (total > 0) {
          stats.sentimentPatterns = {
            positive: Math.round((totalPositive / total) * 100),
            negative: Math.round((totalNegative / total) * 100),
            neutral: Math.round((totalNeutral / total) * 100),
          };
          
          // Ensure they sum to 100%
          const sum = stats.sentimentPatterns.positive + 
                      stats.sentimentPatterns.negative + 
                      stats.sentimentPatterns.neutral;
                      
          if (sum !== 100) {
            const diff = 100 - sum;
            // Add the difference to the largest value
            if (stats.sentimentPatterns.positive >= stats.sentimentPatterns.negative && 
                stats.sentimentPatterns.positive >= stats.sentimentPatterns.neutral) {
              stats.sentimentPatterns.positive += diff;
            } else if (stats.sentimentPatterns.negative >= stats.sentimentPatterns.positive && 
                      stats.sentimentPatterns.negative >= stats.sentimentPatterns.neutral) {
              stats.sentimentPatterns.negative += diff;
            } else {
              stats.sentimentPatterns.neutral += diff;
            }
          }
        }
      }
      
      // Count emotions, topics, tags, and cognitive distortions
      entries.forEach(entry => {
        // Process cognitive distortions if available - ONLY count user-confirmed distortions
        if (entry.userSelectedDistortions && Array.isArray(entry.userSelectedDistortions)) {
          entry.userSelectedDistortions.forEach(distortion => {
            stats.cognitiveDistortions[distortion] = (stats.cognitiveDistortions[distortion] || 0) + 1;
          });
        }
        
        // ONLY process user-selected tags, not AI-suggested tags
        if (entry.userSelectedTags && Array.isArray(entry.userSelectedTags)) {
          entry.userSelectedTags.forEach(tag => {
            // Count all user-selected tags
            stats.tagsFrequency[tag] = (stats.tagsFrequency[tag] || 0) + 1;
            
            // Common emotion words - expanded list with more terms
            const emotionWords = [
              // Basic emotions
              'happy', 'sad', 'angry', 'anxious', 'worried', 'excited', 'calm', 'stressed',
              'peaceful', 'nervous', 'joyful', 'depressed', 'content', 'upset', 'frustrated',
              'positive', 'negative', 'neutral', 'balanced', 'overwhelmed', 'hopeful',
              'relieved', 'grateful', 'afraid', 'confused', 'proud', 'ashamed', 'confident',
              'fearful', 'relaxed', 'annoyed', 'disappointed', 'satisfied', 'lonely', 'loved',
              
              // Core emotions and common variations
              'fear', 'anxiety', 'scared', 'terror', 'horror', 'dread', 'panic',
              'joy', 'happiness', 'delight', 'elation', 'ecstasy', 'thrill',
              'disgust', 'repulsion', 'revulsion', 'distaste', 'aversion',
              'surprise', 'astonishment', 'amazement', 'shock', 'wonder',
              'trust', 'anticipation', 'acceptance', 'admiration', 'adoration',
              
              // Cognitive emotion terms
              'incompetence', 'hopelessness', 'frustration', 'despair', 'grief',
              'remorse', 'guilt', 'shame', 'regret', 'embarrassment',
              'pride', 'triumph', 'satisfaction', 'contentment',
              'rage', 'fury', 'resentment', 'irritation', 'annoyance', 'aggression',
              'jealousy', 'envy', 'bitterness', 'disappointment',
              
              // Common emotional states
              'stressed', 'tense', 'overwhelmed', 'burnout', 'exhausted',
              'lonely', 'isolated', 'abandoned', 'rejected', 'betrayed',
              'vulnerable', 'insecure', 'uncertain', 'helpless', 'powerless',
              'hurt', 'pain', 'suffering', 'agony', 'torment',
              
              // Specific emotion patterns
              'catastrophizing'
            ];
            
            const tagLower = tag.toLowerCase().trim();
            
            // Special case: directly check for exact matches with our most common emotions
            if (
              tagLower === 'fear' || 
              tagLower === 'anxiety' || 
              tagLower === 'joy' || 
              tagLower === 'anger' || 
              tagLower === 'sadness' || 
              tagLower === 'disgust' || 
              tagLower === 'surprise' || 
              tagLower === 'trust' || 
              tagLower === 'anticipation' || 
              tagLower === 'worry'
            ) {
              stats.emotions[tag] = (stats.emotions[tag] || 0) + 1;
              return;
            }
            
            // For other terms, check if they contain emotion words
            const isLikelyEmotion = emotionWords.some(word => 
              tagLower === word || // exact match
              tagLower.startsWith(word + ' ') || // starts with the word
              tagLower.endsWith(' ' + word) || // ends with the word
              tagLower.includes(' ' + word + ' ') // contains the word with spaces around it
            );
            
            if (isLikelyEmotion) {
              stats.emotions[tag] = (stats.emotions[tag] || 0) + 1;
            } else {
              // Default to topic if not an emotion
              stats.topics[tag] = (stats.topics[tag] || 0) + 1;
            }
          });
        }
      });
      
      res.status(200).json(stats);
    } catch (error) {
      console.error("Get journal stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Analyze journal text with OpenAI without saving
  app.post("/api/journal/analyze", authenticate, async (req, res) => {
    try {
      const { title, content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required for analysis" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "AI analysis is not available" });
      }
      
      const analysis = await analyzeJournalEntry(title || "", content);
      res.status(200).json(analysis);
    } catch (error) {
      console.error("Journal analysis error:", error);
      res.status(500).json({ message: "Failed to analyze journal content" });
    }
  });
  
  // Re-analyze an existing journal entry to update with cognitive distortions
  app.post("/api/users/:userId/journal/:entryId/reanalyze", authenticate, checkUserAccess, async (req, res) => {
    try {
      const entryId = Number(req.params.entryId);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }
      
      // Get the entry
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Double-check access (in addition to middleware)
      const userId = Number(req.params.userId);
      // Verify the user owns this entry or has access to it
      if (entry.userId !== userId && req.user?.role !== 'admin' && 
          (req.user?.role !== 'therapist' || !await isClientOfTherapist(entry.userId, req.user.id))) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "AI analysis is not available" });
      }
      
      // Re-analyze the entry with OpenAI
      const analysis = await analyzeJournalEntry(entry.title, entry.content);
      
      // Update the entry with new analysis including cognitive distortions
      const updatedEntry = await storage.updateJournalEntry(entryId, {
        aiAnalysis: analysis.analysis,
        detectedDistortions: analysis.cognitiveDistortions || [],
        sentimentPositive: analysis.sentiment.positive,
        sentimentNegative: analysis.sentiment.negative,
        sentimentNeutral: analysis.sentiment.neutral
      });
      
      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error("Journal re-analysis error:", error);
      res.status(500).json({ message: "Failed to re-analyze journal entry" });
    }
  });
  
  // Legacy endpoint for backward compatibility
  app.post("/api/journal/:id/reanalyze", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }
      
      // Get the entry
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Verify the user owns this entry or has access to it
      if (entry.userId !== req.user?.id && req.user?.role !== 'admin' && 
          req.user?.role !== 'therapist') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "AI analysis is not available" });
      }
      
      // Re-analyze the entry with OpenAI
      const analysis = await analyzeJournalEntry(entry.title, entry.content);
      
      // Update the entry with new analysis including cognitive distortions
      const updatedEntry = await storage.updateJournalEntry(entryId, {
        aiAnalysis: analysis.analysis,
        detectedDistortions: analysis.cognitiveDistortions || [],
        sentimentPositive: analysis.sentiment.positive,
        sentimentNegative: analysis.sentiment.negative,
        sentimentNeutral: analysis.sentiment.neutral
      });
      
      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error("Journal re-analysis error:", error);
      res.status(500).json({ message: "Failed to re-analyze journal entry" });
    }
  });
  
  // ------------------------------------
  // Cognitive Distortions Routes
  // ------------------------------------
  
  // Get all cognitive distortions
  app.get("/api/cognitive-distortions", async (req, res) => {
    try {
      const distortions = await storage.getCognitiveDistortions();
      res.status(200).json(distortions);
    } catch (error) {
      console.error("Get cognitive distortions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a specific cognitive distortion
  app.get("/api/cognitive-distortions/:id", async (req, res) => {
    try {
      const distortionId = Number(req.params.id);
      if (isNaN(distortionId)) {
        return res.status(400).json({ message: "Invalid cognitive distortion ID" });
      }
      
      const distortion = await storage.getCognitiveDistortionById(distortionId);
      if (!distortion) {
        return res.status(404).json({ message: "Cognitive distortion not found" });
      }
      
      res.status(200).json(distortion);
    } catch (error) {
      console.error("Get cognitive distortion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a new cognitive distortion (admin only)
  app.post("/api/cognitive-distortions", authenticate, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCognitiveDistortionSchema.parse(req.body);
      const distortion = await storage.createCognitiveDistortion(validatedData);
      res.status(201).json(distortion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create cognitive distortion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a cognitive distortion (admin only)
  app.patch("/api/cognitive-distortions/:id", authenticate, isAdmin, async (req, res) => {
    try {
      const distortionId = Number(req.params.id);
      if (isNaN(distortionId)) {
        return res.status(400).json({ message: "Invalid cognitive distortion ID" });
      }
      
      const distortion = await storage.getCognitiveDistortionById(distortionId);
      if (!distortion) {
        return res.status(404).json({ message: "Cognitive distortion not found" });
      }
      
      const validatedData = insertCognitiveDistortionSchema.partial().parse(req.body);
      const updatedDistortion = await storage.updateCognitiveDistortion(distortionId, validatedData);
      res.status(200).json(updatedDistortion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update cognitive distortion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a cognitive distortion (admin only)
  app.delete("/api/cognitive-distortions/:id", authenticate, isAdmin, async (req, res) => {
    try {
      const distortionId = Number(req.params.id);
      if (isNaN(distortionId)) {
        return res.status(400).json({ message: "Invalid cognitive distortion ID" });
      }
      
      const distortion = await storage.getCognitiveDistortionById(distortionId);
      if (!distortion) {
        return res.status(404).json({ message: "Cognitive distortion not found" });
      }
      
      await storage.deleteCognitiveDistortion(distortionId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete cognitive distortion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // ------------------------------------
  // Journal <-> Thought Record Integration Routes
  // ------------------------------------
  
  // Helper function to check if a user is a client of a therapist
  async function isClientOfTherapist(clientId: number, therapistId: number): Promise<boolean> {
    const client = await storage.getUserById(clientId);
    return !!client && client.therapistId === therapistId;
  }
  
  // Link a journal entry to a thought record
  app.post("/api/users/:userId/journal/:journalId/link-thought", authenticate, checkUserAccess, async (req, res) => {
    try {
      const journalId = Number(req.params.journalId);
      const thoughtRecordId = Number(req.body.thoughtRecordId);
      
      if (isNaN(journalId) || isNaN(thoughtRecordId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Get the journal entry
      const journal = await storage.getJournalEntryById(journalId);
      if (!journal) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Ensure the user has access to this journal entry
      if (journal.userId !== req.user.id && req.user.role !== 'admin' && 
          (req.user.role !== 'therapist' || !await isClientOfTherapist(journal.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this journal entry" });
      }
      
      // Get the thought record
      const thoughtRecord = await storage.getThoughtRecordById(thoughtRecordId);
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      
      // Ensure the user has access to this thought record
      if (thoughtRecord.userId !== req.user.id && req.user.role !== 'admin' && 
          (req.user.role !== 'therapist' || !await isClientOfTherapist(thoughtRecord.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this thought record" });
      }
      
      // Link the journal entry to the thought record
      await storage.linkJournalToThoughtRecord(journalId, thoughtRecordId);
      
      // After linking, get the updated journal entry with all data
      const updatedJournal = await storage.getJournalEntryById(journalId);
      
      // Return the full updated journal entry
      res.status(200).json(updatedJournal);
    } catch (error) {
      console.error("Link journal to thought record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Unlink a journal entry from a thought record
  app.delete("/api/users/:userId/journal/:journalId/link-thought/:thoughtRecordId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const journalId = Number(req.params.journalId);
      const thoughtRecordId = Number(req.params.thoughtRecordId);
      
      if (isNaN(journalId) || isNaN(thoughtRecordId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Get the journal entry
      const journal = await storage.getJournalEntryById(journalId);
      if (!journal) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Ensure the user has access to this journal entry
      if (journal.userId !== req.user.id && req.user.role !== 'admin' && 
          (req.user.role !== 'therapist' || !await isClientOfTherapist(journal.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this journal entry" });
      }
      
      // Get the thought record
      const thoughtRecord = await storage.getThoughtRecordById(thoughtRecordId);
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      
      // Ensure the user has access to this thought record
      if (thoughtRecord.userId !== req.user.id && req.user.role !== 'admin' && 
          (req.user.role !== 'therapist' || !await isClientOfTherapist(thoughtRecord.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this thought record" });
      }
      
      // Unlink the journal entry from the thought record
      await storage.unlinkJournalFromThoughtRecord(journalId, thoughtRecordId);
      
      // After unlinking, get the updated journal entry with all data
      const updatedJournal = await storage.getJournalEntryById(journalId);
      
      // Return the full updated journal entry
      res.status(200).json(updatedJournal);
    } catch (error) {
      console.error("Unlink journal from thought record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all thought records related to a journal entry
  app.get("/api/users/:userId/journal/:journalId/related-thoughts", authenticate, checkUserAccess, async (req, res) => {
    try {
      const journalId = Number(req.params.journalId);
      
      if (isNaN(journalId)) {
        return res.status(400).json({ message: "Invalid journal ID" });
      }
      
      // Get the journal entry
      const journal = await storage.getJournalEntryById(journalId);
      if (!journal) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Ensure the user has access to this journal entry
      if (journal.userId !== req.user.id && req.user.role !== 'admin' && 
          (req.user.role !== 'therapist' || !await isClientOfTherapist(journal.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this journal entry" });
      }
      
      // Get related thought records
      const relatedThoughts = await storage.getRelatedThoughtRecords(journalId);
      
      res.status(200).json(relatedThoughts);
    } catch (error) {
      console.error("Get related thought records error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all journal entries related to a thought record
  app.get("/api/users/:userId/thoughts/:thoughtRecordId/related-journals", authenticate, checkUserAccess, async (req, res) => {
    try {
      const thoughtRecordId = Number(req.params.thoughtRecordId);
      
      if (isNaN(thoughtRecordId)) {
        return res.status(400).json({ message: "Invalid thought record ID" });
      }
      
      // Get the thought record
      const thoughtRecord = await storage.getThoughtRecordById(thoughtRecordId);
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      
      // Ensure the user has access to this thought record
      if (thoughtRecord.userId !== req.user.id && req.user.role !== 'admin' && 
          (req.user.role !== 'therapist' || !await isClientOfTherapist(thoughtRecord.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this thought record" });
      }
      
      // Get related journal entries
      const relatedJournals = await storage.getRelatedJournalEntries(thoughtRecordId);
      
      res.status(200).json(relatedJournals);
    } catch (error) {
      console.error("Get related journal entries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
