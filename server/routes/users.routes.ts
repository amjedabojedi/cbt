import { Router } from "express";
import {
  authenticate,
  isAdmin,
  isTherapist,
  checkUserAccess,
  ensureAuthenticated,
  isClientOrAdmin,
  checkResourceCreationPermission
} from "../middleware/auth";
import { aiRateLimit } from "../middleware/rateLimiter";
import {
  isClientOfTherapist,
  getEnhancedInsights,
  updateUserStatus,
  getAllUsers,
  getClients,
  getAllClients,
  getViewingClientFixed,
  getCurrentViewingClient,
  getUserDetails,
  registerByAdmin,
  deleteUser,
  unassignTherapist,
  resetPassword,
  updateUserProfile,
  assignSubscriptionPlan,
  deleteClientByTherapist,
  getJournalsCount,
  inviteClient,
  setCurrentViewingClient,
  getClientRecentActivity,
  getProtectiveFactorUsage,
  createProtectiveFactorUsage,
  createProtectiveFactor,
  getProtectiveFactors,
  updateProtectiveFactor,
  deleteProtectiveFactor,
  getCopingStrategyUsage,
  createCopingStrategyUsage,
  createCopingStrategy,
  getCopingStrategies,
  updateCopingStrategy,
  deleteCopingStrategy,
  createAction,
  getActions,
  getUserResources,
  getJournalEntries,
  getJournalStats,
  reanalyzeJournal,
  linkThought,
  unlinkThought,
  getRelatedThoughts,
  getAiRecommendations,
  createAiRecommendation
} from "../controllers/users.controller";

const router = Router();

// Re-export helper function for other routes
export { isClientOfTherapist };

// Enhanced insights endpoint
router.get("/:userId/enhanced-insights", authenticate, checkUserAccess, getEnhancedInsights);

// Endpoint to update user status
router.post("/:userId/update-status", authenticate, ensureAuthenticated, checkUserAccess, updateUserStatus);

// User management routes
router.get("/", authenticate, isAdmin, getAllUsers);
router.get("/clients", authenticate, getClients);
router.get("/all-clients", authenticate, isAdmin, getAllClients);
router.get("/viewing-client-fixed", authenticate, getViewingClientFixed);
router.get("/current-viewing-client", authenticate, getCurrentViewingClient);

// Get single user details
router.get("/:userId", authenticate, checkUserAccess, getUserDetails);

// Register user by admin
router.post("/register-by-admin", authenticate, isAdmin, registerByAdmin);

// Delete user by admin
router.delete("/:userId", authenticate, isAdmin, deleteUser);

// Unassign therapist from client
router.patch("/:userId/unassign-therapist", authenticate, isAdmin, unassignTherapist);

// Reset password by admin
router.post("/:userId/reset-password", authenticate, isAdmin, resetPassword);

// Update user profile
router.patch("/:userId", authenticate, checkUserAccess, updateUserProfile);

// Assign subscription plan
router.post("/:userId/subscription-plan", authenticate, isAdmin, assignSubscriptionPlan);

// Delete client by therapist
router.delete("/clients/:clientId", authenticate, isTherapist, deleteClientByTherapist);

// Get journals count
router.get("/:userId/journals/count", authenticate, checkUserAccess, getJournalsCount);

// Invite client by therapist
router.post("/invite-client", authenticate, isTherapist, inviteClient);

// Set current viewing client for therapist
router.post("/current-viewing-client", authenticate, setCurrentViewingClient);

// Get client recent activity
router.get("/:userId/recent-activity", authenticate, checkUserAccess, getClientRecentActivity);

// Protective Factors Usage
router.get("/:userId/protective-factor-usage", authenticate, checkUserAccess, getProtectiveFactorUsage);
router.post("/:userId/protective-factor-usage", authenticate, checkUserAccess, checkResourceCreationPermission, createProtectiveFactorUsage);

// Protective Factors CRUD
router.post("/:userId/protective-factors", authenticate, checkUserAccess, checkResourceCreationPermission, createProtectiveFactor);
router.get("/:userId/protective-factors", authenticate, checkUserAccess, getProtectiveFactors);
router.put("/:userId/protective-factors/:factorId", authenticate, checkUserAccess, updateProtectiveFactor);
router.delete("/:userId/protective-factors/:factorId", authenticate, checkUserAccess, deleteProtectiveFactor);

// Coping Strategy Usage
router.get("/:userId/coping-strategy-usage", authenticate, checkUserAccess, getCopingStrategyUsage);
router.post("/:userId/coping-strategy-usage", authenticate, checkUserAccess, checkResourceCreationPermission, createCopingStrategyUsage);

// Coping Strategy CRUD
router.post("/:userId/coping-strategies", authenticate, checkUserAccess, checkResourceCreationPermission, createCopingStrategy);
router.get("/:userId/coping-strategies", authenticate, checkUserAccess, getCopingStrategies);
router.put("/:userId/coping-strategies/:strategyId", authenticate, checkUserAccess, updateCopingStrategy);
router.delete("/:userId/coping-strategies/:strategyId", authenticate, checkUserAccess, deleteCopingStrategy);

// Action Items CRUD
router.post("/:userId/actions", authenticate, checkUserAccess, isClientOrAdmin, createAction);
router.get("/:userId/actions", authenticate, checkUserAccess, getActions);

// Resources
router.get("/:userId/resources", authenticate, getUserResources);

// Journal Entries
router.get("/:userId/journal", authenticate, checkUserAccess, getJournalEntries);
router.get("/:userId/journal/stats", authenticate, checkUserAccess, getJournalStats);
router.post("/:userId/journal/:entryId/reanalyze", authenticate, aiRateLimit, checkUserAccess, reanalyzeJournal);

// Thought Linkage
router.post("/:userId/journal/:journalId/link-thought", authenticate, checkUserAccess, linkThought);
router.delete("/:userId/journal/:journalId/link-thought/:thoughtRecordId", authenticate, checkUserAccess, unlinkThought);
router.get("/:userId/journal/:journalId/related-thoughts", authenticate, checkUserAccess, getRelatedThoughts);

// AI Recommendations
router.get("/:userId/recommendations", authenticate, checkUserAccess, getAiRecommendations);
router.post("/:userId/recommendations", authenticate, ensureAuthenticated, createAiRecommendation);

export default router;
