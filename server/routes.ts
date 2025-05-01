import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, isTherapist, isAdmin, checkUserAccess, isClientOrAdmin, checkResourceCreationPermission } from "./middleware/auth";
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
  insertActionSchema,
  goals,
  goalMilestones,
  actions,
  protectiveFactors,
  protectiveFactorUsage,
  copingStrategies,
  copingStrategyUsage
} from "@shared/schema";
import cookieParser from "cookie-parser";
import { sendClientInvitation } from "./services/email";
import { sendEmotionTrackingReminders, sendWeeklyProgressDigests } from "./services/reminders";
import { db, pool } from "./db";
import { eq, or, isNull, desc, and } from "drizzle-orm";

// Helper function to get emotion color by name
function getEmotionColor(emotion: string): string {
  const colorMap: Record<string, string> = {
    // Core emotions
    "Joy": "#F9D71C",
    "Sadness": "#6D87C4",
    "Fear": "#8A65AA",
    "Disgust": "#7DB954",
    "Anger": "#E43D40",
    // Secondary/tertiary fallbacks
    "Happy": "#F9D71C",
    "Excited": "#E8B22B",
    "Proud": "#D6A338",
    "Content": "#C8953F",
    "Hopeful": "#BAA150",
    "Depressed": "#6D87C4",
    "Lonely": "#5D78B5",
    "Guilty": "#4C69A6",
    "Disappointed": "#3B5A97",
    "Hurt": "#2A4B88",
    "Worried": "#8A65AA",
    "Anxious": "#7A569B",
    "Insecure": "#6A478C",
    "Rejected": "#5A387D",
    "Overwhelmed": "#4A296E",
    "Disgusted": "#7DB954",
    "Judgmental": "#6DAA45",
    "Disapproving": "#5D9B36",
    "Critical": "#4D8C27",
    "Repulsed": "#3D7D18",
    "Furious": "#E43D40",
    "Annoyed": "#D42E31",
    "Frustrated": "#C41F22",
    "Irritated": "#B41013",
    "Resentful": "#A40104"
  };
  
  return colorMap[emotion] || "#888888";
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Use the pool from the imported db
  const { pool } = await import('./db');
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

  const httpServer = createServer(app);
  return httpServer;
}
