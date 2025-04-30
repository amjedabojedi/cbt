import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, isTherapist, isAdmin, checkUserAccess } from "./middleware/auth";
import { z } from "zod";
import * as bcrypt from "bcrypt";
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
  insertActionSchema
} from "@shared/schema";
import cookieParser from "cookie-parser";
import { sendClientInvitation } from "./services/email";
import { sendEmotionTrackingReminders, sendWeeklyProgressDigests } from "./services/reminders";

export async function registerRoutes(app: Express): Promise<Server> {
  // Parse cookies
  app.use(cookieParser());
  
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
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Get the user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check the password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
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
  
  // User management routes (for therapists)
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
      const inviteToken = require('crypto').randomBytes(32).toString('hex');
      
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
  
  // Emotion tracking routes
  app.post("/api/users/:userId/emotions", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertEmotionRecordSchema.parse({
        ...req.body,
        userId
      });
      
      const emotionRecord = await storage.createEmotionRecord(validatedData);
      res.status(201).json(emotionRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create emotion record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/:userId/emotions", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotions = await storage.getEmotionRecordsByUser(userId);
      res.status(200).json(emotions);
    } catch (error) {
      console.error("Get emotion records error:", error);
      res.status(500).json({ message: "Internal server error" });
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
  
  // Thought record routes
  app.post("/api/users/:userId/thoughts", authenticate, checkUserAccess, async (req, res) => {
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
      const thoughts = await storage.getThoughtRecordsByUser(userId);
      res.status(200).json(thoughts);
    } catch (error) {
      console.error("Get thought records error:", error);
      res.status(500).json({ message: "Internal server error" });
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
  app.post("/api/users/:userId/protective-factors", authenticate, checkUserAccess, async (req, res) => {
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
  
  app.post("/api/users/:userId/protective-factor-usage", authenticate, checkUserAccess, async (req, res) => {
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
  app.post("/api/users/:userId/coping-strategies", authenticate, checkUserAccess, async (req, res) => {
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
  
  app.post("/api/users/:userId/coping-strategy-usage", authenticate, checkUserAccess, async (req, res) => {
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
  
  // Goals routes
  app.post("/api/users/:userId/goals", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertGoalSchema.parse({
        ...req.body,
        userId
      });
      
      const goal = await storage.createGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create goal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/:userId/goals", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
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
      
      // Check if the goal exists and the user has access
      const goals = await storage.getGoalsByUser(req.user.id);
      const goal = goals.find(g => g.id === goalId);
      
      if (!goal && req.user.role !== 'therapist' && req.user.role !== 'admin') {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      const validatedData = insertGoalMilestoneSchema.parse({
        ...req.body,
        goalId
      });
      
      const milestone = await storage.createGoalMilestone(validatedData);
      res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create goal milestone error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/goals/:goalId/milestones", authenticate, async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      
      // Check if the goal exists and the user has access
      const goals = await storage.getGoalsByUser(req.user.id);
      const goal = goals.find(g => g.id === goalId);
      
      if (!goal && req.user.role !== 'therapist' && req.user.role !== 'admin') {
        return res.status(404).json({ message: "Goal not found" });
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
      const updatedMilestone = await storage.updateGoalMilestoneCompletion(id, isCompleted);
      res.status(200).json(updatedMilestone);
    } catch (error) {
      console.error("Update milestone completion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Actions routes
  app.post("/api/users/:userId/actions", authenticate, checkUserAccess, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
