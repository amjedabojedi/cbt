import { Request, Response } from "express";
import { db, pool } from "../db";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { thoughtRecords, insertThoughtRecordSchema } from "@shared/schema";
import { storage } from "../storage";
import { z } from "zod";
import { isClientOfTherapist } from "./users.controller";

// Get thoughts count
export async function getThoughtsCount(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // Sample clients optimization/mock logic
    if (userId >= 100 && userId <= 110) {
      return res.status(200).json({ totalCount: Math.floor(Math.random() * 6) + 2 });
    }
    
    // Count thought records for this user
    const result = await db.select({ count: sql`count(*)::int` }).from(thoughtRecords)
      .where(eq(thoughtRecords.userId, userId));
    
    res.json({ totalCount: result[0].count });
  } catch (error) {
    console.error("Error counting thoughts:", error);
    res.status(500).json({ message: "Error counting thought records" });
  }
}

// Create new thought record
export async function createThoughtRecord(req: Request, res: Response) {
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
}

// Update thought record
export async function updateThoughtRecord(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const thoughtId = parseInt(req.params.thoughtId);
    
    // Validate the update data
    const updateSchema = z.object({
      cognitiveDistortions: z.array(z.string()).optional(),
      evidenceFor: z.string().min(1).optional(),
      evidenceAgainst: z.string().min(1).optional(),
      alternativePerspective: z.string().min(1).optional(),
      reflectionRating: z.number().min(0).max(10).optional(),
      insightsGained: z.string().min(1).optional(),
    });
    
    const validatedUpdate = updateSchema.parse(req.body);
    
    // Get the existing thought record
    const existingThought = await storage.getThoughtRecordById(thoughtId);
    if (!existingThought) {
      return res.status(404).json({ message: "Thought record not found" });
    }
    
    // Verify ownership
    if (existingThought.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Update only the fields that are provided
    const updateData = {
      ...(validatedUpdate.cognitiveDistortions !== undefined && { cognitiveDistortions: validatedUpdate.cognitiveDistortions }),
      ...(validatedUpdate.evidenceFor !== undefined && { evidenceFor: validatedUpdate.evidenceFor }),
      ...(validatedUpdate.evidenceAgainst !== undefined && { evidenceAgainst: validatedUpdate.evidenceAgainst }),
      ...(validatedUpdate.alternativePerspective !== undefined && { alternativePerspective: validatedUpdate.alternativePerspective }),
      ...(validatedUpdate.reflectionRating !== undefined && { reflectionRating: validatedUpdate.reflectionRating }),
      ...(validatedUpdate.insightsGained !== undefined && { insightsGained: validatedUpdate.insightsGained }),
    };
    
    // Update in database
    const [updatedThought] = await db.update(thoughtRecords)
      .set(updateData)
      .where(eq(thoughtRecords.id, thoughtId))
      .returning();
    
    res.status(200).json(updatedThought);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Update thought record error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all thought records for a user
export async function getThoughtRecords(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const emotionRecordId = req.query.emotionRecordId 
      ? parseInt(req.query.emotionRecordId as string) 
      : undefined;
    
    // If the requesting user is a therapist and trying to access a client's data
    if (req.user?.role === 'therapist' && userId !== req.user.id) {
      console.log(`Therapist ${req.user.id} is trying to access client ${userId}'s thought records`);
      
      // Check if this client belongs to the therapist
      const clientBelongsToTherapist = await isClientOfTherapist(userId, req.user.id);
      if (!clientBelongsToTherapist) {
        console.log(`Client ${userId} does not belong to therapist ${req.user.id}`);
        return res.status(403).json({ message: "Access denied - client not assigned to you" });
      }
      
      console.log(`Access granted - client ${userId} belongs to therapist ${req.user.id}`);
      const clientThoughts = await storage.getThoughtRecordsByUser(userId);
      
      // Filter by emotion record ID if provided
      const filteredClientThoughts = emotionRecordId
        ? clientThoughts.filter(t => t.emotionRecordId === emotionRecordId)
        : clientThoughts;
        
      return res.status(200).json(filteredClientThoughts);
    }
    
    // Get all thoughts for this user (own data or admin access)
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
}

// Delete a thought record
export async function deleteThoughtRecord(req: Request, res: Response) {
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
}

// Get thought record ratings for trends/charts
export async function getThoughtRatings(req: Request, res: Response) {
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
      ratingsByDate[date].push(thought.reflectionRating as number);
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
}

// Get protective factors used for a specific thought record
export async function getThoughtProtectiveFactors(req: Request, res: Response) {
  try {
    const thoughtId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    // First verify thought record exists and belongs to user
    const thoughtRecord = await storage.getThoughtRecordById(thoughtId);
    if (!thoughtRecord || thoughtRecord.userId !== userId) {
      return res.status(404).json({ message: 'Thought record not found' });
    }
    
    // Query the database to get protective factors used in this thought record with effectiveness ratings
    const query = `
      SELECT pf.id, pf.name, pfu.effectiveness_rating as effectiveness
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
}

// Get coping strategies used for a specific thought record
export async function getThoughtCopingStrategies(req: Request, res: Response) {
  try {
    const thoughtId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    // First verify thought record exists and belongs to user
    const thoughtRecord = await storage.getThoughtRecordById(thoughtId);
    if (!thoughtRecord || thoughtRecord.userId !== userId) {
      return res.status(404).json({ message: 'Thought record not found' });
    }
    
    // Query the database to get coping strategies used in this thought record with effectiveness ratings
    const query = `
      SELECT cs.id, cs.name, csu.effectiveness_rating as effectiveness
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
}

// Get related journals for a thought record
export async function getRelatedJournals(req: Request, res: Response) {
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
    if (thoughtRecord.userId !== req.user!.id && req.user!.role !== 'admin' && 
        (req.user!.role !== 'therapist' || !await isClientOfTherapist(thoughtRecord.userId, req.user!.id))) {
      return res.status(403).json({ message: "You don't have access to this thought record" });
    }
    
    // Get related journal entries
    const relatedJournals = await storage.getRelatedJournalEntries(thoughtRecordId);
    
    res.status(200).json(relatedJournals);
  } catch (error) {
    console.error("Get related journal entries error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get a single thought record by ID (agnostic of userId in route mounting path)
export async function getSingleThoughtRecord(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const thought = await storage.getThoughtRecordById(id);
    
    if (!thought) {
      return res.status(404).json({ message: "Thought record not found" });
    }
    
    // Check if the user has access to this thought record
    if (thought.userId !== req.user!.id) {
      // If it's a therapist, check if the thought belongs to their client
      if (req.user!.role === 'therapist') {
        const client = await storage.getUser(thought.userId);
        if (!client || client.therapistId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    
    res.status(200).json(thought);
  } catch (error) {
    console.error("Get thought record error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
