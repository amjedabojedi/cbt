import { Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { emotionRecords, insertEmotionRecordSchema } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import * as emotionMapping from "../services/emotionMapping";

// Helper function to get emotion color by name
function getEmotionColor(emotion: string): string {
  return emotionMapping.getEmotionColor(emotion);
}

// Get emotions count
export async function getEmotionsCount(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // Count emotion records for this user
    const result = await db.select({ count: sql`count(*)::int` }).from(emotionRecords)
      .where(eq(emotionRecords.userId, userId));
    
    res.json({ totalCount: result[0].count });
  } catch (error) {
    console.error("Error counting emotions:", error);
    res.status(500).json({ message: "Error counting emotion records" });
  }
}

// Create new emotion record
export async function createEmotionRecord(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // Prepare emotion data with properly typed timestamp
    const emotionData: any = { 
      userId,
      coreEmotion: req.body.coreEmotion,
      intensity: req.body.intensity,
      situation: req.body.situation,
      location: req.body.location || null,
      company: req.body.company || null,
      // Always convert timestamp to a Date object for database insertion
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date()
    };
    
    // Only include emotional fields if they have actual values (not empty strings)
    if (req.body.primaryEmotion && req.body.primaryEmotion.trim() !== '') {
      emotionData.primaryEmotion = req.body.primaryEmotion;
    }
    
    if (req.body.tertiaryEmotion && req.body.tertiaryEmotion.trim() !== '') {
      emotionData.tertiaryEmotion = req.body.tertiaryEmotion;
    }
    
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
      error: (error as any)?.message
    });
  }
}

// Get all emotions for a user
export async function getEmotions(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // ALWAYS use the userId from the URL path - this is the client being viewed
    // The checkUserAccess middleware already verified the therapist has permission to view this client
    const emotions = await storage.getEmotionRecordsByUser(userId);
    res.status(200).json(emotions);
  } catch (error) {
    console.error("Get emotion records error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Delete an emotion record
export async function deleteEmotionRecord(req: Request, res: Response) {
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
}

// Get emotion statistics
export async function getEmotionStats(req: Request, res: Response) {
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
}
