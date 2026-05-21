import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { aiRateLimit } from "../middleware/rateLimiter";
import {
  getJournalEntryById,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  updateJournalTags,
  createJournalComment,
  updateJournalComment,
  deleteJournalComment,
  analyzeJournalText,
  reanalyzeJournalEntry
} from "../controllers/journal.controller";

const router = Router({ mergeParams: true });

// Get a specific journal entry by ID
router.get("/journal/:id", authenticate, getJournalEntryById);

// Create a new journal entry
router.post("/journal", authenticate, createJournalEntry);

// Update a journal entry (user can only update their own entries)
router.patch("/journal/:id", authenticate, updateJournalEntry);

// Delete a journal entry (user can only delete their own entries)
router.delete("/journal/:id", authenticate, deleteJournalEntry);

// Update selected tags for a journal entry
router.post("/journal/:id/tags", authenticate, updateJournalTags);

// Add a comment to a journal entry
router.post("/journal/:id/comments", authenticate, createJournalComment);

// Update a comment (user can only update their own comments)
router.patch("/journal/comments/:id", authenticate, updateJournalComment);

// Delete a comment (user can only delete their own comments or admin)
router.delete("/journal/comments/:id", authenticate, deleteJournalComment);

// Analyze journal text with OpenAI without saving
router.post("/journal/analyze", authenticate, aiRateLimit, analyzeJournalText);

// Re-analyze an existing journal entry to update with cognitive distortions
router.post("/journal/:id/reanalyze", authenticate, aiRateLimit, reanalyzeJournalEntry);

export default router;
