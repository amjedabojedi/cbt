/**
 * Reframe Coach Service
 * 
 * This service handles cognitive restructuring practice features, including:
 * - Creating reframing practice sessions
 * - Recording practice results
 * - Managing user gamification profiles
 * - Calculating streaks and achievements
 */

import { Request, Response } from "express";
import { Express } from "express";
import { db } from "../db";
import { authenticate, checkUserAccess } from "../middleware/auth";
import { 
  thoughtRecords, 
  resourceAssignments,
  reframePracticeResults,
  userGameProfile,
  cognitiveDistortions,
  emotionRecords
} from "@shared/schema";
import { 
  insertResourceAssignmentSchema, 
  insertReframePracticeResultSchema,
  insertUserGameProfileSchema 
} from "@shared/schema";
import { generateReframePracticeScenarios, ReframePracticeSession } from "./openai";
import { eq, and, desc, isNull, sql, inArray } from "drizzle-orm";
import { z } from "zod";

// Zod schema for reframe practice creation requests
const createReframePracticeSchema = z.object({
  thoughtRecordId: z.number(),
  assignedTo: z.number(),
  isPriority: z.boolean().optional().default(false),
  notes: z.string().optional(),
  customInstructions: z.string().optional()
});

// Zod schema for recording practice results
const recordPracticeResultSchema = z.object({
  assignmentId: z.number().optional(),
  thoughtRecordId: z.number(),
  score: z.number(),
  correctAnswers: z.number(),
  totalQuestions: z.number(),
  streakCount: z.number().optional(),
  timeSpent: z.number().optional(),
  scenarioData: z.any(),
  userChoices: z.any()
});

/**
 * Calculates new achievements based on practice results
 */
async function calculateAchievements(userId: number, result: z.infer<typeof recordPracticeResultSchema>) {
  // Get or create user game profile
  let [profile] = await db
    .select()
    .from(userGameProfile)
    .where(eq(userGameProfile.userId, userId));

  if (!profile) {
    // Create new profile if it doesn't exist
    [profile] = await db
      .insert(userGameProfile)
      .values({
        userId,
        totalScore: 0,
        level: 1,
        practiceStreak: 0,
        achievements: [],
        badges: []
      })
      .returning();
  }

  // Calculate new stats
  const newTotalScore = profile.totalScore + result.score;
  const newLevel = Math.floor(newTotalScore / 500) + 1; // Level up every 500 points
  
  // Calculate streak
  const today = new Date();
  let newStreak = profile.practiceStreak || 0;
  
  if (profile.lastPracticeDate) {
    const lastPractice = new Date(profile.lastPracticeDate);
    // Check if last practice was yesterday
    const timeDiff = today.getTime() - lastPractice.getTime();
    const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));
    
    if (dayDiff === 1) {
      // Continue streak
      newStreak += 1;
    } else if (dayDiff > 1) {
      // Break streak
      newStreak = 1;
    }
    // If same day, keep streak the same
  } else {
    // First practice
    newStreak = 1;
  }
  
  // Calculate new achievements
  const currentAchievements = profile.achievements || [];
  const newAchievements = [...currentAchievements];
  
  // Streak achievements
  if (newStreak >= 3 && !newAchievements.includes('streak_3')) {
    newAchievements.push('streak_3');
  }
  if (newStreak >= 7 && !newAchievements.includes('streak_7')) {
    newAchievements.push('streak_7');
  }
  if (newStreak >= 14 && !newAchievements.includes('streak_14')) {
    newAchievements.push('streak_14');
  }
  
  // Practice count achievements (get count of all practice results)
  const { count } = await db
    .select({ count: sql<number>`count(*)` })
    .from(reframePracticeResults)
    .where(eq(reframePracticeResults.userId, userId))
    .then(rows => rows[0]);
    
  if (count >= 5 && !newAchievements.includes('practice_5')) {
    newAchievements.push('practice_5');
  }
  if (count >= 20 && !newAchievements.includes('practice_20')) {
    newAchievements.push('practice_20');
  }
  if (count >= 50 && !newAchievements.includes('practice_50')) {
    newAchievements.push('practice_50');
  }
  
  // Perfect score achievements
  if (result.correctAnswers === result.totalQuestions && !newAchievements.includes('perfect_score')) {
    newAchievements.push('perfect_score');
  }
  
  // Update profile with new stats
  await db
    .update(userGameProfile)
    .set({
      totalScore: newTotalScore,
      level: newLevel,
      practiceStreak: newStreak,
      lastPracticeDate: new Date(),
      achievements: newAchievements,
      updatedAt: new Date()
    })
    .where(eq(userGameProfile.userId, userId));
    
  return {
    newTotalScore,
    newLevel,
    newStreak,
    newAchievements: newAchievements.filter(a => !currentAchievements.includes(a))
  };
}

export function registerReframeCoachRoutes(app: Express): void {
  // Create a new reframe practice assignment
  app.post("/api/reframe-coach/assignments", authenticate, async (req: Request, res: Response) => {
    try {
      // Validate request data
      const validatedData = createReframePracticeSchema.parse(req.body);
      
      // Ensure user is a therapist or admin
      const user = req.user;
      if (user.role !== 'therapist' && user.role !== 'admin') {
        return res.status(403).json({ message: "Only mental health professionals can create practice assignments" });
      }
      
      // Verify the thought record exists and belongs to the assigned client
      const [thoughtRecord] = await db
        .select()
        .from(thoughtRecords)
        .where(eq(thoughtRecords.id, validatedData.thoughtRecordId));
        
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      
      if (thoughtRecord.userId !== validatedData.assignedTo) {
        return res.status(400).json({ message: "Thought record does not belong to the assigned client" });
      }
      
      // Need to get more detail for creating the practice scenarios
      // Get emotion record if available
      let emotionCategory = "unknown";
      if (thoughtRecord.emotionRecordId) {
        const [emotionRecord] = await db
          .select()
          .from(emotionRecords)
          .where(eq(emotionRecords.id, thoughtRecord.emotionRecordId));
          
        if (emotionRecord) {
          emotionCategory = emotionRecord.coreEmotion;
        }
      }
      
      // Generate practice scenarios using OpenAI
      const practiceSession = await generateReframePracticeScenarios(
        thoughtRecord.automaticThoughts,
        thoughtRecord.cognitiveDistortions,
        emotionCategory,
        validatedData.customInstructions
      );
      
      // Create a resource assignment
      const [assignment] = await db
        .insert(resourceAssignments)
        .values({
          // Required for all assignments
          resourceId: 0, // Set to 0 for reframe practice
          assignedBy: user.id,
          assignedTo: validatedData.assignedTo,
          isPriority: validatedData.isPriority || false,
          notes: validatedData.notes || "",
          status: "assigned",
          
          // Reframe Coach specific fields
          type: "reframe_practice",
          thoughtRecordId: validatedData.thoughtRecordId,
          reframeData: practiceSession
        })
        .returning();
        
      res.status(201).json({ 
        message: "Reframe practice assignment created successfully",
        assignment,
        scenarios: practiceSession.scenarios.length
      });
    } catch (error) {
      console.error("Error creating reframe practice assignment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create practice assignment" });
    }
  });
  
  // Get reframe practice assignments for a user
  app.get("/api/users/:userId/reframe-coach/assignments", authenticate, checkUserAccess, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const assignments = await db
        .select()
        .from(resourceAssignments)
        .where(
          and(
            eq(resourceAssignments.assignedTo, userId),
            eq(resourceAssignments.type, "reframe_practice")
          )
        )
        .orderBy(desc(resourceAssignments.assignedAt));
        
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching reframe practice assignments:", error);
      res.status(500).json({ message: "Failed to fetch practice assignments" });
    }
  });
  
  // Get a specific reframe practice assignment
  app.get("/api/reframe-coach/assignments/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id);
      
      const [assignment] = await db
        .select()
        .from(resourceAssignments)
        .where(
          and(
            eq(resourceAssignments.id, assignmentId),
            eq(resourceAssignments.type, "reframe_practice")
          )
        );
        
      if (!assignment) {
        return res.status(404).json({ message: "Practice assignment not found" });
      }
      
      // Check if user has access (either assigned to them or assigned by them)
      if (assignment.assignedTo !== req.user.id && assignment.assignedBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to access this assignment" });
      }
      
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching reframe practice assignment:", error);
      res.status(500).json({ message: "Failed to fetch practice assignment" });
    }
  });
  
  // Record the results of a practice session
  app.post("/api/reframe-coach/results", authenticate, async (req: Request, res: Response) => {
    try {
      const validatedData = recordPracticeResultSchema.parse(req.body);
      const userId = req.user.id;
      
      // Create practice result record
      const [result] = await db
        .insert(reframePracticeResults)
        .values({
          userId,
          assignmentId: validatedData.assignmentId,
          thoughtRecordId: validatedData.thoughtRecordId,
          score: validatedData.score,
          correctAnswers: validatedData.correctAnswers,
          totalQuestions: validatedData.totalQuestions,
          streakCount: validatedData.streakCount || 0,
          timeSpent: validatedData.timeSpent,
          scenarioData: validatedData.scenarioData,
          userChoices: validatedData.userChoices
        })
        .returning();
        
      // If this is from an assignment, update the assignment status
      if (validatedData.assignmentId) {
        await db
          .update(resourceAssignments)
          .set({
            status: "completed",
            completedAt: new Date()
          })
          .where(eq(resourceAssignments.id, validatedData.assignmentId));
      }
      
      // Calculate and update achievements/gamification data
      const gameUpdates = await calculateAchievements(userId, validatedData);
      
      res.status(201).json({ 
        message: "Practice results recorded successfully",
        result,
        gameUpdates
      });
    } catch (error) {
      console.error("Error recording practice results:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record practice results" });
    }
  });
  
  // Get user game profile with achievements and stats
  app.get("/api/users/:userId/reframe-coach/profile", authenticate, checkUserAccess, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get user game profile
      let [profile] = await db
        .select()
        .from(userGameProfile)
        .where(eq(userGameProfile.userId, userId));
        
      if (!profile) {
        // Create new profile if it doesn't exist
        [profile] = await db
          .insert(userGameProfile)
          .values({
            userId,
            totalScore: 0,
            level: 1,
            practiceStreak: 0,
            achievements: [],
            badges: []
          })
          .returning();
      }
      
      // Get practice history stats
      const practiceStats = await db
        .select({
          totalPractices: sql<number>`count(*)`,
          avgScore: sql<number>`avg(score)`,
          totalCorrect: sql<number>`sum(correct_answers)`,
          totalQuestions: sql<number>`sum(total_questions)`
        })
        .from(reframePracticeResults)
        .where(eq(reframePracticeResults.userId, userId))
        .then(rows => rows[0]);
        
      // Get distortion mastery (most practiced distortions)
      const [thoughtRecord] = await db
        .select({
          cognitiveDistortions: thoughtRecords.cognitiveDistortions
        })
        .from(thoughtRecords)
        .leftJoin(
          reframePracticeResults,
          eq(reframePracticeResults.thoughtRecordId, thoughtRecords.id)
        )
        .where(eq(thoughtRecords.userId, userId))
        .groupBy(thoughtRecords.id)
        .orderBy(sql`count(${reframePracticeResults.id})`)
        .limit(1);
        
      const strongestDistortion = thoughtRecord?.cognitiveDistortions?.[0] || null;
      
      res.json({
        profile,
        stats: {
          ...practiceStats,
          accuracyRate: practiceStats.totalQuestions > 0 
            ? Math.round((practiceStats.totalCorrect / practiceStats.totalQuestions) * 100) 
            : 0,
          strongestDistortion
        }
      });
    } catch (error) {
      console.error("Error fetching user game profile:", error);
      res.status(500).json({ message: "Failed to fetch game profile" });
    }
  });
  
  // Generate practice scenarios for a specific thought record (without creating an assignment)
  app.get("/api/users/:userId/thoughts/:thoughtId/practice-scenarios", authenticate, checkUserAccess, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const thoughtId = parseInt(req.params.thoughtId);
      
      // Get the thought record
      const [thoughtRecord] = await db
        .select()
        .from(thoughtRecords)
        .where(
          and(
            eq(thoughtRecords.id, thoughtId),
            eq(thoughtRecords.userId, userId)
          )
        );
        
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      
      // Get emotion if available
      let emotionCategory = "unknown";
      if (thoughtRecord.emotionRecordId) {
        const [emotionRecord] = await db
          .select()
          .from(emotionRecords)
          .where(eq(emotionRecords.id, thoughtRecord.emotionRecordId));
          
        if (emotionRecord) {
          emotionCategory = emotionRecord.coreEmotion;
        }
      }
      
      // Generate practice scenarios
      const practiceSession = await generateReframePracticeScenarios(
        thoughtRecord.automaticThoughts,
        thoughtRecord.cognitiveDistortions,
        emotionCategory
      );
      
      res.json(practiceSession);
    } catch (error) {
      console.error("Error generating practice scenarios:", error);
      res.status(500).json({ message: "Failed to generate practice scenarios" });
    }
  });
  
  // Get all practice results for a user (history)
  app.get("/api/users/:userId/reframe-coach/results", authenticate, checkUserAccess, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const results = await db
        .select()
        .from(reframePracticeResults)
        .where(eq(reframePracticeResults.userId, userId))
        .orderBy(desc(reframePracticeResults.createdAt));
        
      res.json(results);
    } catch (error) {
      console.error("Error fetching practice results:", error);
      res.status(500).json({ message: "Failed to fetch practice results" });
    }
  });
}