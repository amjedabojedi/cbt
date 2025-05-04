/**
 * Integration Routes Service
 * 
 * This service sets up routes for cross-component data integration,
 * particularly for connecting emotions between the emotion wheel and journal entries.
 */

import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { 
  CORE_EMOTIONS,
  EMOTION_FAMILIES,
  normalizeToCoreEmotion,
  areRelatedEmotions,
  getRelatedEmotions,
  findMatchingJournalEmotions,
  getEmotionRelationshipMap
} from "./emotionMapping";
import { authenticate, checkUserAccess } from "../middleware/auth";

export function registerIntegrationRoutes(app: Express): void {
  // Get the emotion taxonomy mapping
  app.get("/api/emotions/taxonomy", async (req: Request, res: Response) => {
    try {
      const emotionMap = getEmotionRelationshipMap();
      res.status(200).json({
        coreEmotions: CORE_EMOTIONS,
        emotionFamilies: emotionMap
      });
    } catch (error) {
      console.error("Get emotion taxonomy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get related emotions for a specific emotion
  app.get("/api/emotions/related/:emotion", async (req: Request, res: Response) => {
    try {
      const emotion = req.params.emotion;
      const relatedEmotions = getRelatedEmotions(emotion);
      const coreEmotion = normalizeToCoreEmotion(emotion);
      
      res.status(200).json({
        emotion,
        coreEmotion,
        relatedEmotions
      });
    } catch (error) {
      console.error("Get related emotions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Find journal entries related to an emotion
  app.get("/api/users/:userId/emotions/:emotion/related-journal", authenticate, checkUserAccess, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotion = req.params.emotion;
      
      // Get all journal entries for the user
      const journalEntries = await storage.getJournalEntriesByUser(userId);
      
      // Filter entries with matching emotions (using the mapping service)
      const relatedEntries = journalEntries.filter(entry => {
        if (!entry.userSelectedTags) return false;
        
        // Check if any of the entry's selected tags match related emotions
        return entry.userSelectedTags.some(tag => 
          areRelatedEmotions(tag, emotion)
        );
      });
      
      res.status(200).json({
        emotion,
        relatedEntries: relatedEntries.map(entry => ({
          id: entry.id,
          title: entry.title,
          timestamp: entry.timestamp,
          userSelectedTags: entry.userSelectedTags,
          matchingEmotions: entry.userSelectedTags ? 
            entry.userSelectedTags.filter(tag => areRelatedEmotions(tag, emotion)) : 
            []
        }))
      });
    } catch (error) {
      console.error("Get related journal entries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Find wheel emotions related to a journal entry
  app.get("/api/users/:userId/journal/:entryId/related-emotions", authenticate, checkUserAccess, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const entryId = parseInt(req.params.entryId);
      
      // Get the journal entry
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      if (!entry.userSelectedTags || entry.userSelectedTags.length === 0) {
        return res.status(200).json({ 
          entryId,
          relatedEmotions: []
        });
      }
      
      // Get emotion records from the emotion wheel
      const emotionRecords = await storage.getEmotionRecordsByUser(userId);
      
      // Filter emotion records with emotions related to the journal tags
      const relatedEmotions = emotionRecords.filter(record => {
        if (!entry.userSelectedTags) return false;
        
        return entry.userSelectedTags.some(tag => 
          areRelatedEmotions(tag, record.tertiaryEmotion) ||
          areRelatedEmotions(tag, record.primaryEmotion) ||
          areRelatedEmotions(tag, record.coreEmotion)
        );
      });
      
      res.status(200).json({
        entryId,
        journalTags: entry.userSelectedTags,
        relatedEmotions: relatedEmotions.map(record => ({
          id: record.id,
          timestamp: record.timestamp,
          coreEmotion: record.coreEmotion,
          primaryEmotion: record.primaryEmotion,
          tertiaryEmotion: record.tertiaryEmotion,
          intensity: record.intensity,
          situation: record.situation,
          matchingEmotions: entry.userSelectedTags!.filter(tag => 
            areRelatedEmotions(tag, record.tertiaryEmotion) || 
            areRelatedEmotions(tag, record.primaryEmotion) || 
            areRelatedEmotions(tag, record.coreEmotion)
          )
        }))
      });
    } catch (error) {
      console.error("Get related emotions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Find thought records related to a specific emotion
  app.get("/api/users/:userId/emotions/:emotion/related-thoughts", authenticate, checkUserAccess, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotion = req.params.emotion;
      
      // Get all thought records for the user
      const thoughtRecords = await storage.getThoughtRecordsByUser(userId);
      
      // Filter thought records with matching emotions
      const relatedThoughts = thoughtRecords.filter(thought => 
        areRelatedEmotions(thought.emotion, emotion)
      );
      
      res.status(200).json({
        emotion,
        relatedThoughts: relatedThoughts.map(thought => ({
          id: thought.id,
          situation: thought.situation,
          automaticThought: thought.automaticThought,
          emotion: thought.emotion,
          emotionIntensity: thought.emotionIntensity,
          timestamp: thought.timestamp
        }))
      });
    } catch (error) {
      console.error("Get related thought records error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}