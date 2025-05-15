import { pgTable, text, serial, integer, jsonb, timestamp, boolean, foreignKey, date, varchar, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // Price in cents
  interval: text("interval", { enum: ["month", "year"] }).notNull(),
  features: jsonb("features").notNull().$type<string[]>(),
  maxClients: integer("max_clients").notNull(), // Maximum number of clients allowed
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false), // For free/trial plans
  stripePriceId: text("stripe_price_id"), // Stripe price ID for paid plans
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User table with role (therapist or client)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["client", "therapist", "admin"] }).notNull().default("client"),
  therapistId: integer("therapist_id").references(() => users.id),
  currentViewingClientId: integer("current_viewing_client_id").references(() => users.id),
  // User status for client accounts (pending = invited but not activated yet)
  status: text("status", { enum: ["pending", "active"] }).default("active").notNull(),
  // Subscription related fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionPlanId: integer("subscription_plan_id").references(() => subscriptionPlans.id),
  subscriptionStatus: text("subscription_status", {
    enum: ["trial", "active", "past_due", "canceled", "unpaid"]
  }),
  subscriptionEndDate: date("subscription_end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Therapist profile fields
  bio: text("bio"),
  specialty: text("specialty"),
  licenses: text("licenses"),
  education: text("education"), 
  approach: text("approach"),
});

// Emotion records
export const emotionRecords = pgTable("emotion_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  coreEmotion: text("core_emotion").notNull(),
  primaryEmotion: text("primary_emotion"),
  tertiaryEmotion: text("tertiary_emotion"),
  intensity: integer("intensity").notNull(),
  situation: text("situation").notNull(),
  location: text("location"),
  company: text("company"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cognitive distortions table - for better categorization and reusable definitions
export const cognitiveDistortions = pgTable("cognitive_distortions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  examples: text("examples").notNull(),
  reframingQuestions: jsonb("reframing_questions").$type<string[]>(),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Thought records and cognitive distortions
export const thoughtRecords = pgTable("thought_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  emotionRecordId: integer("emotion_record_id").references(() => emotionRecords.id),
  automaticThoughts: text("automatic_thoughts").notNull(),
  cognitiveDistortions: jsonb("cognitive_distortions").notNull().$type<string[]>(),
  evidenceFor: text("evidence_for"),
  evidenceAgainst: text("evidence_against"),
  alternativePerspective: text("alternative_perspective"),
  insightsGained: text("insights_gained"),
  reflectionRating: integer("reflection_rating"),
  relatedJournalEntryIds: jsonb("related_journal_entry_ids").$type<number[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Protective factors library
export const protectiveFactors = pgTable("protective_factors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  isGlobal: boolean("is_global").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Protective factor usage in reflections
export const protectiveFactorUsage = pgTable("protective_factor_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  thoughtRecordId: integer("thought_record_id").notNull().references(() => thoughtRecords.id),
  protectiveFactorId: integer("protective_factor_id").notNull().references(() => protectiveFactors.id),
  effectivenessRating: integer("effectiveness_rating"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Coping strategies library
export const copingStrategies = pgTable("coping_strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  isGlobal: boolean("is_global").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Coping strategy usage in reflections
export const copingStrategyUsage = pgTable("coping_strategy_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  thoughtRecordId: integer("thought_record_id").notNull().references(() => thoughtRecords.id),
  copingStrategyId: integer("coping_strategy_id").notNull().references(() => copingStrategies.id),
  effectivenessRating: integer("effectiveness_rating"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SMART Goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  specific: text("specific").notNull(),
  measurable: text("measurable").notNull(),
  achievable: text("achievable").notNull(),
  relevant: text("relevant").notNull(),
  timebound: text("timebound").notNull(),
  deadline: timestamp("deadline"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "approved"] }).default("pending").notNull(),
  therapistComments: text("therapist_comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Goal Milestones
export const goalMilestones = pgTable("goal_milestones", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => goals.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Action Tracking (Behavioral Activation & Exposure)
export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["behavioral_activation", "exposure"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  difficultyRating: integer("difficulty_rating"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  moodBefore: integer("mood_before"),
  moodAfter: integer("mood_after"),
  reflection: text("reflection"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Educational resources library
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(), // Rich text content
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),
  type: text("type", { enum: ["article", "pdf", "video", "exercise"] }).notNull(),
  fileUrl: text("file_url"), // For uploaded files
  thumbnailUrl: text("thumbnail_url"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  parentResourceId: integer("parent_resource_id").references(() => resources.id), // For modified resources
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Resource assignments to clients
export const resourceAssignments = pgTable("resource_assignments", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  assignedBy: integer("assigned_by").notNull().references(() => users.id), // Therapist
  assignedTo: integer("assigned_to").notNull().references(() => users.id), // Client
  isPriority: boolean("is_priority").default(false), // Flag for important resources
  notes: text("notes"), // Therapist notes for the client
  status: text("status", { enum: ["assigned", "viewed", "completed"] }).default("assigned").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  // For Reframe Coach assignments
  type: text("type", { enum: ["resource", "reframe_practice"] }).default("resource").notNull(),
  thoughtRecordId: integer("thought_record_id").references(() => thoughtRecords.id), // Only used for reframe practice
  reframeData: jsonb("reframe_data"), // Scenarios, options, and other practice data
});

// Resource feedback from clients
export const resourceFeedback = pgTable("resource_feedback", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  userId: integer("user_id").notNull().references(() => users.id), // Client who provided feedback
  rating: integer("rating"), // 1-5 star rating
  feedback: text("feedback"), // Text feedback
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Journal entries table
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mood: integer("mood"), // 1-10 scale
  aiSuggestedTags: jsonb("ai_suggested_tags").$type<string[]>(), // Tags suggested by AI
  initialAiTags: jsonb("initial_ai_tags").$type<string[]>(), // Original tags from initial AI analysis
  selectedTags: jsonb("selected_tags").$type<string[]>(), // Tags selected by the user
  userSelectedTags: jsonb("user_selected_tags").$type<string[]>(), // Tags explicitly selected by the user
  aiAnalysis: text("ai_analysis"), // AI-generated summary/analysis
  emotions: jsonb("emotions").$type<string[]>(), // Emotions identified by AI
  topics: jsonb("topics").$type<string[]>(), // Topics identified by AI
  sentimentPositive: real("sentiment_positive"), // Positive sentiment score
  sentimentNegative: real("sentiment_negative"), // Negative sentiment score
  sentimentNeutral: real("sentiment_neutral"), // Neutral sentiment score
  isPrivate: boolean("is_private").default(false).notNull(), // If true, only visible to the user
  relatedThoughtRecordIds: jsonb("related_thought_record_ids").$type<number[]>(), // Bidirectional references
  detectedDistortions: jsonb("detected_distortions").$type<string[]>(), // AI-detected cognitive distortions
  userSelectedDistortions: jsonb("user_selected_distortions").$type<string[]>(), // Distortions selected by the user
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comments on journal entries (from therapists or clients)
export const journalComments = pgTable("journal_comments", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull().references(() => journalEntries.id),
  userId: integer("user_id").notNull().references(() => users.id), // User who made the comment (can be therapist or client)
  therapistId: integer("therapist_id").references(() => users.id), // Only populated if commenter is a therapist
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reframe practice results - for gamification and progress tracking
export const reframePracticeResults = pgTable("reframe_practice_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  assignmentId: integer("assignment_id").references(() => resourceAssignments.id),
  thoughtRecordId: integer("thought_record_id").references(() => thoughtRecords.id),
  score: integer("score").notNull(), // Points earned in this practice session
  correctAnswers: integer("correct_answers").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  streakCount: integer("streak_count").default(0), // Number of correct answers in a row
  timeSpent: integer("time_spent"), // Time spent on the exercise
  scenarioData: jsonb("scenario_data"), // Store the scenarios presented
  userChoices: jsonb("user_choices"), // Store the user's selected options
  feedback: text("feedback"), // Therapist feedback on results
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User gamification profile - for tracking achievements, levels, etc.
export const userGameProfile = pgTable("user_game_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  totalScore: integer("total_score").default(0).notNull(), // Accumulative score
  level: integer("level").default(1).notNull(), // User's current level
  practiceStreak: integer("practice_streak").default(0), // Consecutive days of practice
  lastPracticeDate: timestamp("last_practice_date"), // For streak calculations
  achievements: jsonb("achievements").$type<string[]>().default([]), // Array of earned achievement IDs
  badges: jsonb("badges").$type<string[]>().default([]), // Array of earned badge IDs
  reframeMastery: jsonb("reframe_mastery"), // Object mapping distortion types to mastery levels
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions for users
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
});

// Define all the insert schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCognitiveDistortionSchema = createInsertSchema(cognitiveDistortions).omit({ id: true, createdAt: true, updatedAt: true });
// For emotion records, we need a custom schema to handle the timestamp correctly
export const insertEmotionRecordSchema = z.object({
  userId: z.number(),
  coreEmotion: z.string(),
  primaryEmotion: z.string().optional(),
  tertiaryEmotion: z.string().optional(),
  intensity: z.number(),
  situation: z.string(),
  location: z.string().optional(),
  company: z.string().optional(),
  // Accept any valid date format (string or Date object)
  timestamp: z.any()
});
export const insertThoughtRecordSchema = createInsertSchema(thoughtRecords).omit({ id: true, createdAt: true });
export const insertProtectiveFactorSchema = createInsertSchema(protectiveFactors).omit({ id: true, createdAt: true });
// Custom schema for protective factor usage to better handle validation
export const insertProtectiveFactorUsageSchema = z.object({
  userId: z.number(),
  thoughtRecordId: z.number(),
  protectiveFactorId: z.number(),
  effectivenessRating: z.number().optional(),
  notes: z.string().optional()
});
export const insertCopingStrategySchema = createInsertSchema(copingStrategies).omit({ id: true, createdAt: true });
// Custom schema for coping strategy usage to better handle validation
export const insertCopingStrategyUsageSchema = z.object({
  userId: z.number(),
  thoughtRecordId: z.number(),
  copingStrategyId: z.number(),
  effectivenessRating: z.number().optional(),
  notes: z.string().optional()
});
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGoalMilestoneSchema = createInsertSchema(goalMilestones).omit({ id: true, createdAt: true });
export const insertActionSchema = createInsertSchema(actions).omit({ id: true, createdAt: true, completedAt: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true, updatedAt: true });
export const insertResourceAssignmentSchema = createInsertSchema(resourceAssignments).omit({ id: true, assignedAt: true, completedAt: true });
export const insertResourceFeedbackSchema = createInsertSchema(resourceFeedback).omit({ id: true, createdAt: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJournalCommentSchema = createInsertSchema(journalComments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReframePracticeResultSchema = createInsertSchema(reframePracticeResults).omit({ id: true, createdAt: true });
export const insertUserGameProfileSchema = createInsertSchema(userGameProfile).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSessionSchema = createInsertSchema(sessions);

// Define all the types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type EmotionRecord = typeof emotionRecords.$inferSelect;
export type InsertEmotionRecord = z.infer<typeof insertEmotionRecordSchema>;

export type CognitiveDistortion = typeof cognitiveDistortions.$inferSelect;
export type InsertCognitiveDistortion = z.infer<typeof insertCognitiveDistortionSchema>;

export type ThoughtRecord = typeof thoughtRecords.$inferSelect;
export type InsertThoughtRecord = z.infer<typeof insertThoughtRecordSchema>;

export type ProtectiveFactor = typeof protectiveFactors.$inferSelect;
export type InsertProtectiveFactor = z.infer<typeof insertProtectiveFactorSchema>;

export type ProtectiveFactorUsage = typeof protectiveFactorUsage.$inferSelect;
export type InsertProtectiveFactorUsage = z.infer<typeof insertProtectiveFactorUsageSchema>;

export type CopingStrategy = typeof copingStrategies.$inferSelect;
export type InsertCopingStrategy = z.infer<typeof insertCopingStrategySchema>;

export type CopingStrategyUsage = typeof copingStrategyUsage.$inferSelect;
export type InsertCopingStrategyUsage = z.infer<typeof insertCopingStrategyUsageSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type GoalMilestone = typeof goalMilestones.$inferSelect;
export type InsertGoalMilestone = z.infer<typeof insertGoalMilestoneSchema>;

export type Action = typeof actions.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type ResourceAssignment = typeof resourceAssignments.$inferSelect;
export type InsertResourceAssignment = z.infer<typeof insertResourceAssignmentSchema>;

export type ResourceFeedback = typeof resourceFeedback.$inferSelect;
export type InsertResourceFeedback = z.infer<typeof insertResourceFeedbackSchema>;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export type JournalComment = typeof journalComments.$inferSelect;
export type InsertJournalComment = z.infer<typeof insertJournalCommentSchema>;

export type ReframePracticeResult = typeof reframePracticeResults.$inferSelect;
export type InsertReframePracticeResult = z.infer<typeof insertReframePracticeResultSchema>;

export type UserGameProfile = typeof userGameProfile.$inferSelect;
export type InsertUserGameProfile = z.infer<typeof insertUserGameProfileSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(), // Use "body" instead of "content" to match the database column
  type: text("type", { 
    enum: ["reminder", "therapist_message", "progress_update", "system", "alert", "invitation"] 
  }).notNull().default("system"),
  isRead: boolean("is_read").notNull().default(false),
  linkPath: text("link_path"), // Optional path to navigate when clicked
  link: text("link"), // Added to match database column
  metadata: jsonb("metadata"), // Optional additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Optional expiration time
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  reminderFrequency: text("reminder_frequency", { 
    enum: ["daily", "weekly", "monthly", "none"] 
  }).notNull().default("daily"),
  journalReminders: boolean("journal_reminders").notNull().default(true),
  emotionReminders: boolean("emotion_reminders").notNull().default(true),
  goalReminders: boolean("goal_reminders").notNull().default(true),
  therapistMessages: boolean("therapist_messages").notNull().default(true),
  progressSummaries: boolean("progress_summaries").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System logs for tracking admin actions and system events
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(), // The action that occurred (user_deleted, user_created, etc.)
  performedBy: integer("performed_by").references(() => users.id), // The user who performed the action (if applicable)
  details: jsonb("details").notNull().$type<Record<string, any>>(), // Details about the action
  ipAddress: text("ip_address"), // IP address of the user who performed the action
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  timestamp: true,
});
export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;

// AI Recommendations table for therapist-approved AI suggestions
export const aiRecommendations = pgTable("ai_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // The client who will receive the recommendation
  therapistId: integer("therapist_id").notNull().references(() => users.id), // The therapist who needs to approve
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type", { 
    enum: ["coping_strategy", "resource", "activity", "reflection", "goal"] 
  }).notNull(),
  status: text("status", { 
    enum: ["pending", "approved", "rejected", "implemented"] 
  }).notNull().default("pending"),
  therapistNotes: text("therapist_notes"),
  aiReasoning: text("ai_reasoning").notNull(), // Why the AI recommended this
  relatedDataType: text("related_data_type", {
    enum: ["emotion", "thought", "journal", "goal", "none"]
  }).notNull().default("none"),
  relatedDataId: integer("related_data_id"), // ID of the related record that prompted this recommendation
  suggestedResources: jsonb("suggested_resources").$type<number[]>(), // Resource IDs if applicable
  implementationSteps: jsonb("implementation_steps").$type<string[]>(), // Steps to implement the recommendation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  implementedAt: timestamp("implemented_at"),
});

export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  rejectedAt: true,
  implementedAt: true
});

export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;

// Client invitations table for tracking invitations sent to potential clients
export const clientInvitations = pgTable("client_invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  therapistId: integer("therapist_id").notNull().references(() => users.id),
  status: text("status", { 
    enum: ["pending", "email_sent", "email_failed", "accepted", "expired"] 
  }).notNull().default("pending"),
  tempUsername: text("temp_username").notNull(),
  tempPassword: text("temp_password").notNull(),
  inviteLink: text("invite_link").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"), // When the invitation was accepted
  expiresAt: timestamp("expires_at").defaultNow(), // Set to 7 days after creation by default
});

export const insertClientInvitationSchema = createInsertSchema(clientInvitations).omit({
  id: true,
  createdAt: true,
  acceptedAt: true
});
export type ClientInvitation = typeof clientInvitations.$inferSelect;
export type InsertClientInvitation = z.infer<typeof insertClientInvitationSchema>;
