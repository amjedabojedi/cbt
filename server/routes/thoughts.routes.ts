import { Router } from "express";
import { authenticate, checkUserAccess, isClientOrAdmin } from "../middleware/auth";
import {
  getThoughtsCount,
  createThoughtRecord,
  updateThoughtRecord,
  getThoughtRecords,
  deleteThoughtRecord,
  getThoughtRatings,
  getThoughtProtectiveFactors,
  getThoughtCopingStrategies,
  getRelatedJournals,
  getSingleThoughtRecord
} from "../controllers/thoughts.controller";

const router = Router({ mergeParams: true });

// Get thoughts count
router.get("/count", authenticate, checkUserAccess, getThoughtsCount);

// Create new thought record
router.post("/", authenticate, checkUserAccess, isClientOrAdmin, createThoughtRecord);

// Update thought record
router.patch("/:thoughtId", authenticate, checkUserAccess, updateThoughtRecord);

// Get all thought records for a user
router.get("/", authenticate, checkUserAccess, getThoughtRecords);

// Delete a thought record
router.delete("/:thoughtId", authenticate, checkUserAccess, deleteThoughtRecord);

// Get thought record ratings for trends/charts
router.get("/ratings", authenticate, checkUserAccess, getThoughtRatings);

// Get protective factors used for a specific thought record
router.get("/:id/protective-factors", authenticate, checkUserAccess, getThoughtProtectiveFactors);

// Get coping strategies used for a specific thought record
router.get("/:id/coping-strategies", authenticate, checkUserAccess, getThoughtCopingStrategies);

// Get related journals for a thought record
router.get("/:thoughtRecordId/related-journals", authenticate, checkUserAccess, getRelatedJournals);

// Get a single thought record by ID (agnostic of userId in route mounting path)
router.get("/thoughts/:id", authenticate, getSingleThoughtRecord);

export default router;
