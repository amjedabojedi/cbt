import { Request, Response } from "express";
import { db } from "../db";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { journalEntries, journalComments, insertJournalEntrySchema, insertJournalCommentSchema } from "@shared/schema";
import { storage } from "../storage";
import { z } from "zod";
import { analyzeJournalEntry } from "../services/openai";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { isClientOfTherapist } from "./users.controller";

// Get specific journal entry by ID with its comments
export async function getJournalEntryById(req: Request, res: Response) {
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
    const user = req.user!;
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
}

// Create a new journal entry
export async function createJournalEntry(req: Request, res: Response) {
  try {
    // Validate the data
    const validatedData = insertJournalEntrySchema.parse({
      ...req.body,
      userId: req.user!.id, // Ensure the entry is created for the authenticated user
    });
    
    // Create the journal entry
    const newEntry = await storage.createJournalEntry(validatedData);
    
    // If there's content, analyze it with OpenAI to suggest tags
    if (validatedData.content && process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      if (!aiRateLimiter.tryConsume(aiRateLimiter.getClientId(req))) {
        return res.status(201).json({ ...newEntry, _aiSkipped: true, _aiSkipReason: 'rate_limit' });
      }
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
}

// Update a journal entry (user can only update their own entries)
export async function updateJournalEntry(req: Request, res: Response) {
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
    if (entry.userId !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Validate the data
    const validatedData = insertJournalEntrySchema.partial().parse(req.body);
    
    // If content was updated and there's an OpenAI key, re-analyze the content
    let updatedData = validatedData;
    if (validatedData.content && process.env.AI_INTEGRATIONS_OPENAI_API_KEY && aiRateLimiter.tryConsume(aiRateLimiter.getClientId(req))) {
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
}

// Delete a journal entry (user can only delete their own entries)
export async function deleteJournalEntry(req: Request, res: Response) {
  try {
    const entryId = Number(req.params.id);
    if (isNaN(entryId)) {
      return res.status(400).json({ message: "Invalid journal entry ID" });
    }
    
    const entry = await storage.getJournalEntryById(entryId);
    if (!entry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }
    
    // Check if user owns this entry, is an admin, or is a therapist for the client who owns the entry
    if (entry.userId === req.user!.id) {
      // User owns this entry, allow deletion
      console.log(`User ${req.user!.id} is deleting their own journal entry ${entryId}`);
    } else if (req.user!.role === 'admin') {
      // Admin can delete any entry
      console.log(`Admin ${req.user!.id} is deleting journal entry ${entryId} owned by user ${entry.userId}`);
    } else if (req.user!.role === 'therapist') {
      // Check if this therapist is assigned to the entry owner
      const client = await storage.getUser(entry.userId);
      if (client && client.therapistId === req.user!.id) {
        console.log(`Therapist ${req.user!.id} is deleting journal entry ${entryId} for their client ${entry.userId}`);
      } else {
        return res.status(403).json({ message: "Access denied: You can only delete entries for your clients" });
      }
    } else {
      return res.status(403).json({ message: "Access denied: You can only delete your own entries" });
    }
    
    // Delete the entry
    await storage.deleteJournalEntry(entryId);
    res.status(200).json({ message: "Journal entry deleted successfully" });
  } catch (error) {
    console.error("Delete journal entry error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update selected tags for a journal entry
export async function updateJournalTags(req: Request, res: Response) {
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
    if (entry.userId !== req.user!.id) {
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
}

// Add a comment to a journal entry (therapist can only comment on their clients' entries)
export async function createJournalComment(req: Request, res: Response) {
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
    const user = req.user!;
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
    const clientId = aiRateLimiter.getClientId(req);
    if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && entry.content && aiRateLimiter.tryConsume(clientId)) {
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
        
        // Construct the combined text, capping total prompt size to prevent quota abuse
        const MAX_PROMPT_CHARS = 8000;
        const entryPart = `${entry.title || ""}\n\n${entry.content}`;
        const commentsPart = comments.map(c => c.comment || "").join("\n\n");
        const combinedRaw = `${entryPart}\n\nAdditional comments:\n${commentsPart}`;
        const combinedText = combinedRaw.length > MAX_PROMPT_CHARS
          ? combinedRaw.slice(0, MAX_PROMPT_CHARS)
          : combinedRaw;
        
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
        const allTags = Array.from(new Set([...existingTags, ...analysis.suggestedTags]));
        
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
          aiAnalysis: analysis.analysis,
          emotions: emotionTags.length > 0 ? emotionTags : entry.emotions || [],
          topics: topicTags.length > 0 ? topicTags : entry.topics || [],
          detectedDistortions: analysis.cognitiveDistortions || [], // Include detected cognitive distortions
          sentimentPositive: analysis.sentiment.positive,
          sentimentNegative: analysis.sentiment.negative,
          sentimentNeutral: analysis.sentiment.neutral
        });
        
        // After comment creation, return the comment with the updated entry
        (newComment as any).updatedEntry = updatedEntry;
        
        console.log("Successfully updated journal entry with new AI analysis");
      } catch (aiError) {
        console.error("AI analysis after comment error:", aiError);
      }
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
}

// Update a comment (user can only update their own comments)
export async function updateJournalComment(req: Request, res: Response) {
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
    if (comment.userId !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Validate the data
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
}

// Delete a comment (user can only delete their own comments or admin)
export async function deleteJournalComment(req: Request, res: Response) {
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
    if (comment.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Delete the comment
    await storage.deleteJournalComment(commentId);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete journal comment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Analyze journal text with OpenAI without saving
export async function analyzeJournalText(req: Request, res: Response) {
  try {
    const { title, content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "Content is required for analysis" });
    }

    if (typeof content !== "string" || content.length > 50000) {
      return res.status(400).json({ message: "Content must not exceed 50,000 characters" });
    }

    if (title !== undefined && (typeof title !== "string" || title.length > 500)) {
      return res.status(400).json({ message: "Title must not exceed 500 characters" });
    }
    
    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      return res.status(503).json({ message: "AI analysis is not available" });
    }
    
    const analysis = await analyzeJournalEntry(title || "", content);
    res.status(200).json(analysis);
  } catch (error) {
    console.error("Journal analysis error:", error);
    res.status(500).json({ message: "Failed to analyze journal content" });
  }
}

// Re-analyze an existing journal entry to update with cognitive distortions
export async function reanalyzeJournalEntry(req: Request, res: Response) {
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
    if (entry.userId !== req.user?.id && req.user?.role !== 'admin') {
      // For therapists, verify the journal entry belongs to one of their assigned clients
      if (req.user?.role === 'therapist') {
        const clientBelongsToTherapist = await isClientOfTherapist(entry.userId, req.user.id);
        if (!clientBelongsToTherapist) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    
    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
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
}
