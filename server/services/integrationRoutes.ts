/**
 * Integration Routes Service
 * 
 * This service sets up routes for cross-component data integration,
 * particularly for connecting emotions between the emotion wheel and journal entries.
 */

import { Request, Response } from "express";
import { Express } from "express";
import { db } from "../db";
import { authenticate, checkUserAccess } from "../middleware/auth";
import * as emotionMapping from "./emotionMapping";
import { eq, and, like, desc } from "drizzle-orm";
import { 
  journalEntries, 
  emotionRecords, 
  thoughtRecords 
} from "@shared/schema";

export function registerIntegrationRoutes(app: Express): void {
  // Get emotion taxonomy (core emotions and their families)
  app.get("/api/emotions/taxonomy", async (req: Request, res: Response) => {
    try {
      // Return the core emotions and emotion families
      res.json({
        coreEmotions: Object.keys(emotionMapping.CORE_EMOTION_FAMILIES),
        emotionFamilies: emotionMapping.CORE_EMOTION_FAMILIES,
        relationships: emotionMapping.EMOTION_COLORS
      });
    } catch (error) {
      console.error("Error fetching emotion taxonomy:", error);
      res.status(500).json({ message: "Failed to fetch emotion taxonomy" });
    }
  });

  // Handle the base case with no emotion specified
  app.get("/api/emotions/related", async (req: Request, res: Response) => {
    try {
      // Return all core emotions with their relationships
      const coreEmotions = Object.keys(emotionMapping.CORE_EMOTION_FAMILIES);
      const relationshipMap: Record<string, string[]> = {};
      
      // For each core emotion, get a sample of related emotions
      coreEmotions.forEach(core => {
        relationshipMap[core] = emotionMapping.getRelatedEmotions(core).slice(0, 5); // Just return a few examples
      });
      
      res.json({
        coreEmotions,
        relationships: relationshipMap
      });
    } catch (error) {
      console.error("Error fetching related emotions:", error);
      res.status(500).json({ message: "Failed to fetch related emotions" });
    }
  });

  // Get emotions related to a specific emotion
  app.get("/api/emotions/related/:emotion", async (req: Request, res: Response) => {
    try {
      const emotion = req.params.emotion;
      const coreEmotion = emotionMapping.findCoreEmotion(emotion);
      
      // If we found a core emotion, get all related emotions for that core emotion
      // Otherwise, just get related emotions for the input emotion
      const relatedEmotions = coreEmotion 
        ? emotionMapping.getRelatedEmotions(coreEmotion) 
        : emotionMapping.getRelatedEmotions(emotion || '');
      
      res.json({
        emotion,
        coreEmotion,
        relatedEmotions
      });
    } catch (error) {
      console.error(`Error fetching related emotions for "${req.params.emotion}":`, error);
      res.status(500).json({ message: "Failed to fetch related emotions" });
    }
  });

  // Get journal entries related to a specific emotion
  app.get("/api/users/:userId/emotions/:emotion/related-journal", authenticate, checkUserAccess, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotion = req.params.emotion;
      const coreEmotion = emotionMapping.findCoreEmotion(emotion);
      
      // If we found a core emotion, get all related emotions for that core emotion
      // Otherwise, just get related emotions for the input emotion
      const relatedEmotions = coreEmotion 
        ? emotionMapping.getRelatedEmotions(coreEmotion) 
        : emotionMapping.getRelatedEmotions(emotion || '');
      
      // Include the original emotion in the search
      const searchEmotions = [emotion, ...relatedEmotions];
      
      // Get journal entries with matching tags
      const entries = await db.select({
        id: journalEntries.id,
        title: journalEntries.title,
        timestamp: journalEntries.createdAt,
        userSelectedTags: journalEntries.userSelectedTags
      })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          // At least one of userSelectedTags contains a matching emotion
          // We use a simplified approach for JSON array search here
          // In a production app, you might need a more sophisticated approach
          // depending on the database being used
          journalEntries.userSelectedTags
        )
      )
      .orderBy(desc(journalEntries.createdAt))
      .limit(10);

      // Filter entries to only those that contain matching emotions
      const relatedEntries = entries.filter(entry => {
        const entryTags = entry.userSelectedTags || [];
        return entryTags.some(tag => 
          searchEmotions.some(emotion => 
            tag.toLowerCase() === emotion.toLowerCase()
          )
        );
      }).map(entry => ({
        ...entry,
        matchingEmotions: searchEmotions.filter(emotion => 
          (entry.userSelectedTags || []).some(tag => 
            tag.toLowerCase() === emotion.toLowerCase()
          )
        )
      }));
      
      res.json({ relatedEntries });
    } catch (error) {
      console.error(`Error fetching journal entries related to "${req.params.emotion}":`, error);
      res.status(500).json({ message: "Failed to fetch related journal entries" });
    }
  });

  // Get emotions related to a specific journal entry
  app.get("/api/users/:userId/journal/:entryId/related-emotions", authenticate, checkUserAccess, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const entryId = parseInt(req.params.entryId);
      
      // Get the journal entry
      const [entry] = await db.select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.id, entryId),
            eq(journalEntries.userId, userId)
          )
        );
      
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Extract emotion tags from the entry
      const entryEmotions = entry.userSelectedTags || [];
      
      // Create a set of all related emotions to search for
      const allRelatedEmotionsSet = new Set<string>();
      entryEmotions.forEach(emotion => {
        const related = emotionMapping.getRelatedEmotions(emotion || '');
        related.forEach(rel => allRelatedEmotionsSet.add(rel));
        allRelatedEmotionsSet.add(emotion);
      });
      
      const allRelatedEmotions = Array.from(allRelatedEmotionsSet);
      
      // Find emotion records that match the related emotions
      const emotionResults = await db.select({
        id: emotionRecords.id,
        timestamp: emotionRecords.createdAt,
        coreEmotion: emotionRecords.coreEmotion,
        primaryEmotion: emotionRecords.primaryEmotion,
        tertiaryEmotion: emotionRecords.tertiaryEmotion,
        intensity: emotionRecords.intensity,
        situation: emotionRecords.situation
      })
      .from(emotionRecords)
      .where(
        and(
          eq(emotionRecords.userId, userId),
          // Filter for matching emotions - this is a simplified approach
          // This might need to be adjusted based on the database
        )
      )
      .orderBy(desc(emotionRecords.createdAt))
      .limit(10);
      
      // Post-filter results to find matching records
      const relatedEmotions = emotionResults.filter(record => {
        return allRelatedEmotions.some(emotion => 
          record.tertiaryEmotion.toLowerCase() === emotion.toLowerCase() ||
          record.primaryEmotion.toLowerCase() === emotion.toLowerCase() ||
          record.coreEmotion.toLowerCase() === emotion.toLowerCase()
        );
      }).map(record => ({
        ...record,
        matchingEmotions: entryEmotions.filter(emotion => 
          emotionMapping.getRelatedEmotions(emotion || '').some(rel => 
            rel.toLowerCase() === record.tertiaryEmotion.toLowerCase() ||
            rel.toLowerCase() === record.primaryEmotion.toLowerCase() ||
            rel.toLowerCase() === record.coreEmotion.toLowerCase()
          ) || 
          emotion.toLowerCase() === record.tertiaryEmotion.toLowerCase() ||
          emotion.toLowerCase() === record.primaryEmotion.toLowerCase() ||
          emotion.toLowerCase() === record.coreEmotion.toLowerCase()
        )
      }));
      
      res.json({ relatedEmotions });
    } catch (error) {
      console.error(`Error fetching emotions related to journal entry ${req.params.entryId}:`, error);
      res.status(500).json({ message: "Failed to fetch related emotions" });
    }
  });

  // Get thought records related to a specific emotion
  app.get("/api/users/:userId/emotions/:emotion/related-thoughts", authenticate, checkUserAccess, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotion = req.params.emotion;
      const coreEmotion = emotionMapping.findCoreEmotion(emotion);
      
      // If we found a core emotion, get all related emotions for that core emotion
      // Otherwise, just get related emotions for the input emotion
      const relatedEmotions = coreEmotion 
        ? emotionMapping.getRelatedEmotions(coreEmotion) 
        : emotionMapping.getRelatedEmotions(emotion || '');
      
      // Include the original emotion in the search
      const searchEmotions = [emotion, ...relatedEmotions];
      
      // Get thought records with matching emotions
      const thoughts = await db.select({
        id: thoughtRecords.id,
        automaticThoughts: thoughtRecords.automaticThoughts,
        cognitiveDistortions: thoughtRecords.cognitiveDistortions,
        emotionRecordId: thoughtRecords.emotionRecordId, 
        timestamp: thoughtRecords.createdAt
      })
      .from(thoughtRecords)
      .where(
        and(
          eq(thoughtRecords.userId, userId)
        )
      )
      .orderBy(desc(thoughtRecords.createdAt))
      .limit(10);
      
      // We need to get the emotion records first to filter thoughts
      // First get emotion records to match with thought records
      const emotionResults = await db.select({
        id: emotionRecords.id,
        coreEmotion: emotionRecords.coreEmotion,
        primaryEmotion: emotionRecords.primaryEmotion,
        tertiaryEmotion: emotionRecords.tertiaryEmotion,
      })
      .from(emotionRecords)
      .where(
        and(
          eq(emotionRecords.userId, userId)
        )
      );
      
      // Filter thoughts by joining with emotion records
      const relatedThoughts = thoughts.filter(thought => {
        // If the thought record has an emotion record ID
        if (thought.emotionRecordId) {
          // Find the matching emotion record
          const emotionRecord = emotionResults.find(e => e.id === thought.emotionRecordId);
          if (emotionRecord) {
            // Check if any of the emotions in this record match our search emotions
            return searchEmotions.some(searchEmotion => 
              emotionRecord.coreEmotion.toLowerCase() === searchEmotion.toLowerCase() ||
              emotionRecord.primaryEmotion.toLowerCase() === searchEmotion.toLowerCase() ||
              emotionRecord.tertiaryEmotion.toLowerCase() === searchEmotion.toLowerCase()
            );
          }
        }
        
        // If no matching emotion record, check if any cognitive distortions contain emotion keywords
        // This is a fallback strategy since we don't have direct emotion fields in thought records
        return searchEmotions.some(searchEmotion => 
          thought.automaticThoughts.toLowerCase().includes(searchEmotion.toLowerCase())
        );
      });
      
      res.json({ relatedThoughts });
    } catch (error) {
      console.error(`Error fetching thought records related to "${req.params.emotion}":`, error);
      res.status(500).json({ message: "Failed to fetch related thought records" });
    }
  });
}