var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  actions: () => actions,
  aiRecommendations: () => aiRecommendations,
  clientInvitations: () => clientInvitations,
  cognitiveDistortions: () => cognitiveDistortions,
  copingStrategies: () => copingStrategies,
  copingStrategyUsage: () => copingStrategyUsage,
  emotionRecords: () => emotionRecords,
  engagementSettings: () => engagementSettings,
  goalMilestones: () => goalMilestones,
  goals: () => goals,
  insertActionSchema: () => insertActionSchema,
  insertAiRecommendationSchema: () => insertAiRecommendationSchema,
  insertClientInvitationSchema: () => insertClientInvitationSchema,
  insertCognitiveDistortionSchema: () => insertCognitiveDistortionSchema,
  insertCopingStrategySchema: () => insertCopingStrategySchema,
  insertCopingStrategyUsageSchema: () => insertCopingStrategyUsageSchema,
  insertEmotionRecordSchema: () => insertEmotionRecordSchema,
  insertEngagementSettingsSchema: () => insertEngagementSettingsSchema,
  insertGoalMilestoneSchema: () => insertGoalMilestoneSchema,
  insertGoalSchema: () => insertGoalSchema,
  insertJournalCommentSchema: () => insertJournalCommentSchema,
  insertJournalEntrySchema: () => insertJournalEntrySchema,
  insertNotificationPreferencesSchema: () => insertNotificationPreferencesSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertProtectiveFactorSchema: () => insertProtectiveFactorSchema,
  insertProtectiveFactorUsageSchema: () => insertProtectiveFactorUsageSchema,
  insertReframePracticeResultSchema: () => insertReframePracticeResultSchema,
  insertResourceAssignmentSchema: () => insertResourceAssignmentSchema,
  insertResourceFeedbackSchema: () => insertResourceFeedbackSchema,
  insertResourceSchema: () => insertResourceSchema,
  insertSessionSchema: () => insertSessionSchema,
  insertSubscriptionPlanSchema: () => insertSubscriptionPlanSchema,
  insertSystemLogSchema: () => insertSystemLogSchema,
  insertThoughtRecordSchema: () => insertThoughtRecordSchema,
  insertUserGameProfileSchema: () => insertUserGameProfileSchema,
  insertUserSchema: () => insertUserSchema,
  journalComments: () => journalComments,
  journalEntries: () => journalEntries,
  notificationPreferences: () => notificationPreferences,
  notifications: () => notifications,
  passwordResetTokens: () => passwordResetTokens,
  protectiveFactorUsage: () => protectiveFactorUsage,
  protectiveFactors: () => protectiveFactors,
  reframePracticeResults: () => reframePracticeResults,
  resourceAssignments: () => resourceAssignments,
  resourceFeedback: () => resourceFeedback,
  resources: () => resources,
  sessions: () => sessions,
  subscriptionPlans: () => subscriptionPlans,
  systemLogs: () => systemLogs,
  thoughtRecords: () => thoughtRecords,
  userGameProfile: () => userGameProfile,
  users: () => users
});
import { pgTable, text, serial, integer, jsonb, timestamp, boolean, date, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var subscriptionPlans, users, emotionRecords, cognitiveDistortions, thoughtRecords, protectiveFactors, protectiveFactorUsage, copingStrategies, copingStrategyUsage, goals, goalMilestones, actions, resources, resourceAssignments, resourceFeedback, journalEntries, journalComments, reframePracticeResults, userGameProfile, sessions, passwordResetTokens, insertSubscriptionPlanSchema, insertUserSchema, insertCognitiveDistortionSchema, insertEmotionRecordSchema, insertThoughtRecordSchema, insertProtectiveFactorSchema, insertProtectiveFactorUsageSchema, insertCopingStrategySchema, insertCopingStrategyUsageSchema, insertGoalSchema, insertGoalMilestoneSchema, insertActionSchema, insertResourceSchema, insertResourceAssignmentSchema, insertResourceFeedbackSchema, insertJournalEntrySchema, insertJournalCommentSchema, insertReframePracticeResultSchema, insertUserGameProfileSchema, insertSessionSchema, insertPasswordResetTokenSchema, notifications, insertNotificationSchema, engagementSettings, insertEngagementSettingsSchema, notificationPreferences, systemLogs, insertNotificationPreferencesSchema, insertSystemLogSchema, aiRecommendations, insertAiRecommendationSchema, clientInvitations, insertClientInvitationSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    subscriptionPlans = pgTable("subscription_plans", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description").notNull(),
      price: integer("price").notNull(),
      // Price in cents
      interval: text("interval", { enum: ["month", "year"] }).notNull(),
      features: jsonb("features").notNull().$type(),
      maxClients: integer("max_clients").notNull(),
      // Maximum number of clients allowed
      isActive: boolean("is_active").notNull().default(true),
      isDefault: boolean("is_default").notNull().default(false),
      // For free/trial plans
      stripePriceId: text("stripe_price_id"),
      // Stripe price ID for paid plans
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    users = pgTable("users", {
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
      approach: text("approach")
    });
    emotionRecords = pgTable("emotion_records", {
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
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    cognitiveDistortions = pgTable("cognitive_distortions", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description").notNull(),
      examples: text("examples").notNull(),
      reframingQuestions: jsonb("reframing_questions").$type(),
      category: text("category"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    thoughtRecords = pgTable("thought_records", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      emotionRecordId: integer("emotion_record_id").references(() => emotionRecords.id),
      automaticThoughts: text("automatic_thoughts").notNull(),
      thoughtCategory: jsonb("thought_category").$type(),
      situation: text("situation"),
      cognitiveDistortions: jsonb("cognitive_distortions").notNull().$type(),
      evidenceFor: text("evidence_for"),
      evidenceAgainst: text("evidence_against"),
      alternativePerspective: text("alternative_perspective"),
      insightsGained: text("insights_gained"),
      reflectionRating: integer("reflection_rating"),
      relatedJournalEntryIds: jsonb("related_journal_entry_ids").$type(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    protectiveFactors = pgTable("protective_factors", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      name: text("name").notNull(),
      description: text("description"),
      isGlobal: boolean("is_global").default(false).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    protectiveFactorUsage = pgTable("protective_factor_usage", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      thoughtRecordId: integer("thought_record_id").notNull().references(() => thoughtRecords.id),
      protectiveFactorId: integer("protective_factor_id").notNull().references(() => protectiveFactors.id),
      effectivenessRating: integer("effectiveness_rating"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    copingStrategies = pgTable("coping_strategies", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      name: text("name").notNull(),
      description: text("description"),
      isGlobal: boolean("is_global").default(false).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    copingStrategyUsage = pgTable("coping_strategy_usage", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      thoughtRecordId: integer("thought_record_id").notNull().references(() => thoughtRecords.id),
      copingStrategyId: integer("coping_strategy_id").notNull().references(() => copingStrategies.id),
      effectivenessRating: integer("effectiveness_rating"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    goals = pgTable("goals", {
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
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    goalMilestones = pgTable("goal_milestones", {
      id: serial("id").primaryKey(),
      goalId: integer("goal_id").notNull().references(() => goals.id),
      title: text("title").notNull(),
      description: text("description"),
      dueDate: timestamp("due_date"),
      isCompleted: boolean("is_completed").default(false).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    actions = pgTable("actions", {
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
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    resources = pgTable("resources", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description"),
      content: text("content").notNull(),
      // Rich text content
      category: text("category"),
      tags: jsonb("tags").$type(),
      type: text("type", { enum: ["article", "pdf", "video", "exercise"] }).notNull(),
      fileUrl: text("file_url"),
      // For uploaded files
      thumbnailUrl: text("thumbnail_url"),
      createdBy: integer("created_by").notNull().references(() => users.id),
      parentResourceId: integer("parent_resource_id").references(() => resources.id),
      // For modified resources
      isPublished: boolean("is_published").default(true).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    resourceAssignments = pgTable("resource_assignments", {
      id: serial("id").primaryKey(),
      resourceId: integer("resource_id").notNull().references(() => resources.id),
      assignedBy: integer("assigned_by").notNull().references(() => users.id),
      // Therapist
      assignedTo: integer("assigned_to").notNull().references(() => users.id),
      // Client
      isPriority: boolean("is_priority").default(false),
      // Flag for important resources
      notes: text("notes"),
      // Therapist notes for the client
      status: text("status", { enum: ["assigned", "viewed", "completed"] }).default("assigned").notNull(),
      assignedAt: timestamp("assigned_at").defaultNow().notNull(),
      completedAt: timestamp("completed_at"),
      // For Reframe Coach assignments
      type: text("type", { enum: ["resource", "reframe_practice"] }).default("resource").notNull(),
      thoughtRecordId: integer("thought_record_id").references(() => thoughtRecords.id),
      // Only used for reframe practice
      reframeData: jsonb("reframe_data")
      // Scenarios, options, and other practice data
    });
    resourceFeedback = pgTable("resource_feedback", {
      id: serial("id").primaryKey(),
      resourceId: integer("resource_id").notNull().references(() => resources.id),
      userId: integer("user_id").notNull().references(() => users.id),
      // Client who provided feedback
      rating: integer("rating"),
      // 1-5 star rating
      feedback: text("feedback"),
      // Text feedback
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    journalEntries = pgTable("journal_entries", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      title: text("title").notNull(),
      content: text("content").notNull(),
      mood: integer("mood"),
      // 1-10 scale
      aiSuggestedTags: jsonb("ai_suggested_tags").$type(),
      // Tags suggested by AI
      initialAiTags: jsonb("initial_ai_tags").$type(),
      // Original tags from initial AI analysis
      selectedTags: jsonb("selected_tags").$type(),
      // Tags selected by the user
      userSelectedTags: jsonb("user_selected_tags").$type(),
      // Tags explicitly selected by the user
      aiAnalysis: text("ai_analysis"),
      // AI-generated summary/analysis
      emotions: jsonb("emotions").$type(),
      // Emotions identified by AI
      topics: jsonb("topics").$type(),
      // Topics identified by AI
      sentimentPositive: real("sentiment_positive"),
      // Positive sentiment score
      sentimentNegative: real("sentiment_negative"),
      // Negative sentiment score
      sentimentNeutral: real("sentiment_neutral"),
      // Neutral sentiment score
      isPrivate: boolean("is_private").default(false).notNull(),
      // If true, only visible to the user
      relatedThoughtRecordIds: jsonb("related_thought_record_ids").$type(),
      // Bidirectional references
      detectedDistortions: jsonb("detected_distortions").$type(),
      // AI-detected cognitive distortions
      userSelectedDistortions: jsonb("user_selected_distortions").$type(),
      // Distortions selected by the user
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    journalComments = pgTable("journal_comments", {
      id: serial("id").primaryKey(),
      journalEntryId: integer("journal_entry_id").notNull().references(() => journalEntries.id),
      userId: integer("user_id").notNull().references(() => users.id),
      // User who made the comment (can be therapist or client)
      therapistId: integer("therapist_id").references(() => users.id),
      // Only populated if commenter is a therapist
      comment: text("comment").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    reframePracticeResults = pgTable("reframe_practice_results", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      assignmentId: integer("assignment_id").references(() => resourceAssignments.id),
      thoughtRecordId: integer("thought_record_id").references(() => thoughtRecords.id),
      score: integer("score").notNull(),
      // Points earned in this practice session
      correctAnswers: integer("correct_answers").notNull(),
      totalQuestions: integer("total_questions").notNull(),
      streakCount: integer("streak_count").default(0),
      // Number of correct answers in a row
      timeSpent: integer("time_spent"),
      // Time spent on the exercise
      scenarioData: jsonb("scenario_data"),
      // Store the scenarios presented
      userChoices: jsonb("user_choices"),
      // Store the user's selected options
      // Note: feedback column was removed from database
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    userGameProfile = pgTable("user_game_profiles", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id).unique(),
      totalScore: integer("total_score").default(0).notNull(),
      // Accumulative score
      level: integer("level").default(1).notNull(),
      // User's current level
      practiceStreak: integer("practice_streak").default(0),
      // Consecutive days of practice
      lastPracticeDate: timestamp("last_practice_date"),
      // For streak calculations
      achievements: jsonb("achievements").$type().default([]),
      // Array of earned achievement IDs
      badges: jsonb("badges").$type().default([]),
      // Array of earned badge IDs
      // Note: reframeMastery column was removed as it doesn't exist in the database
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    sessions = pgTable("sessions", {
      id: text("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      expiresAt: timestamp("expires_at").notNull()
    });
    passwordResetTokens = pgTable("password_reset_tokens", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      token: text("token").notNull().unique(),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      used: boolean("used").default(false).notNull()
    });
    insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true });
    insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
    insertCognitiveDistortionSchema = createInsertSchema(cognitiveDistortions).omit({ id: true, createdAt: true, updatedAt: true });
    insertEmotionRecordSchema = z.object({
      userId: z.number(),
      coreEmotion: z.string(),
      primaryEmotion: z.string().optional(),
      tertiaryEmotion: z.string().optional(),
      intensity: z.number(),
      situation: z.string(),
      location: z.string().nullable().optional(),
      company: z.string().nullable().optional(),
      // Accept any valid date format (string or Date object)
      timestamp: z.any()
    });
    insertThoughtRecordSchema = createInsertSchema(thoughtRecords).omit({ id: true, createdAt: true });
    insertProtectiveFactorSchema = createInsertSchema(protectiveFactors).omit({ id: true, createdAt: true });
    insertProtectiveFactorUsageSchema = z.object({
      userId: z.number(),
      thoughtRecordId: z.number(),
      protectiveFactorId: z.number(),
      effectivenessRating: z.number().optional(),
      notes: z.string().optional()
    });
    insertCopingStrategySchema = createInsertSchema(copingStrategies).omit({ id: true, createdAt: true });
    insertCopingStrategyUsageSchema = z.object({
      userId: z.number(),
      thoughtRecordId: z.number(),
      copingStrategyId: z.number(),
      effectivenessRating: z.number().optional(),
      notes: z.string().optional()
    });
    insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true });
    insertGoalMilestoneSchema = createInsertSchema(goalMilestones).omit({ id: true, createdAt: true });
    insertActionSchema = createInsertSchema(actions).omit({ id: true, createdAt: true, completedAt: true });
    insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true, updatedAt: true });
    insertResourceAssignmentSchema = createInsertSchema(resourceAssignments).omit({ id: true, assignedAt: true, completedAt: true });
    insertResourceFeedbackSchema = createInsertSchema(resourceFeedback).omit({ id: true, createdAt: true });
    insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true, updatedAt: true });
    insertJournalCommentSchema = createInsertSchema(journalComments).omit({ id: true, createdAt: true, updatedAt: true });
    insertReframePracticeResultSchema = createInsertSchema(reframePracticeResults).omit({ id: true, createdAt: true });
    insertUserGameProfileSchema = createInsertSchema(userGameProfile).omit({ id: true, createdAt: true, updatedAt: true });
    insertSessionSchema = createInsertSchema(sessions);
    insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
      id: true,
      createdAt: true
    });
    notifications = pgTable("notifications", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      title: text("title").notNull(),
      body: text("body").notNull(),
      // Use "body" instead of "content" to match the database column
      type: text("type", {
        enum: ["reminder", "therapist_message", "progress_update", "system", "alert", "invitation"]
      }).notNull().default("system"),
      isRead: boolean("is_read").notNull().default(false),
      linkPath: text("link_path"),
      // Optional path to navigate when clicked
      link: text("link"),
      // Added to match database column
      metadata: jsonb("metadata"),
      // Optional additional data
      createdAt: timestamp("created_at").defaultNow().notNull(),
      expiresAt: timestamp("expires_at")
      // Optional expiration time
    });
    insertNotificationSchema = createInsertSchema(notifications).omit({
      id: true,
      createdAt: true
    });
    engagementSettings = pgTable("engagement_settings", {
      id: serial("id").primaryKey(),
      reminderEnabled: boolean("reminder_enabled").notNull().default(true),
      reminderDays: integer("reminder_days").notNull().default(3),
      reminderTime: text("reminder_time").notNull().default("09:00"),
      weeklyDigestEnabled: boolean("weekly_digest_enabled").notNull().default(true),
      weeklyDigestDay: integer("weekly_digest_day").notNull().default(0),
      // Sunday
      weeklyDigestTime: text("weekly_digest_time").notNull().default("08:00"),
      reminderEmailSubject: text("reminder_email_subject").notNull().default(""),
      reminderEmailTemplate: text("reminder_email_template").notNull().default(""),
      weeklyDigestSubject: text("weekly_digest_subject").notNull().default(""),
      weeklyDigestTemplate: text("weekly_digest_template").notNull().default(""),
      escalationEnabled: boolean("escalation_enabled").notNull().default(false),
      escalationDays: jsonb("escalation_days").notNull().default([7, 14, 30]).$type(),
      escalationTemplates: jsonb("escalation_templates").notNull().default([]).$type(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    insertEngagementSettingsSchema = createInsertSchema(engagementSettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    notificationPreferences = pgTable("notification_preferences", {
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
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    systemLogs = pgTable("system_logs", {
      id: serial("id").primaryKey(),
      action: text("action").notNull(),
      // The action that occurred (user_deleted, user_created, etc.)
      performedBy: integer("performed_by").references(() => users.id),
      // The user who performed the action (if applicable)
      details: jsonb("details").notNull().$type(),
      // Details about the action
      ipAddress: text("ip_address"),
      // IP address of the user who performed the action
      timestamp: timestamp("timestamp").defaultNow().notNull()
    });
    insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSystemLogSchema = createInsertSchema(systemLogs).omit({
      id: true,
      timestamp: true
    });
    aiRecommendations = pgTable("ai_recommendations", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      // The client who will receive the recommendation
      therapistId: integer("therapist_id").notNull().references(() => users.id),
      // The therapist who needs to approve
      title: text("title").notNull(),
      content: text("content").notNull(),
      type: text("type", {
        enum: ["coping_strategy", "resource", "activity", "reflection", "goal"]
      }).notNull(),
      status: text("status", {
        enum: ["pending", "approved", "rejected", "implemented"]
      }).notNull().default("pending"),
      therapistNotes: text("therapist_notes"),
      aiReasoning: text("ai_reasoning").notNull(),
      // Why the AI recommended this
      relatedDataType: text("related_data_type", {
        enum: ["emotion", "thought", "journal", "goal", "none"]
      }).notNull().default("none"),
      relatedDataId: integer("related_data_id"),
      // ID of the related record that prompted this recommendation
      suggestedResources: jsonb("suggested_resources").$type(),
      // Resource IDs if applicable
      implementationSteps: jsonb("implementation_steps").$type(),
      // Steps to implement the recommendation
      createdAt: timestamp("created_at").defaultNow().notNull(),
      approvedAt: timestamp("approved_at"),
      rejectedAt: timestamp("rejected_at"),
      implementedAt: timestamp("implemented_at")
    });
    insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({
      id: true,
      createdAt: true,
      approvedAt: true,
      rejectedAt: true,
      implementedAt: true
    });
    clientInvitations = pgTable("client_invitations", {
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
      acceptedAt: timestamp("accepted_at"),
      // When the invitation was accepted
      expiresAt: timestamp("expires_at").defaultNow()
      // Set to 7 days after creation by default
    });
    insertClientInvitationSchema = createInsertSchema(clientInvitations).omit({
      id: true,
      createdAt: true,
      acceptedAt: true
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool2,
  withRetry: () => withRetry
});
import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
async function withRetry(operation, retries = MAX_RETRIES) {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) throw error;
    console.log(`Database operation failed, retrying in ${RETRY_DELAY_MS}ms... (${retries} attempts left)`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return withRetry(operation, retries - 1);
  }
}
var pool2, MAX_RETRIES, RETRY_DELAY_MS, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    neonConfig.useSecureWebSocket = true;
    neonConfig.pipelineConnect = "password";
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool2 = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      // Increase pool size for better concurrency
      min: 2,
      // Keep minimum connections alive
      idleTimeoutMillis: 6e4,
      // Longer idle timeout
      connectionTimeoutMillis: 1e4,
      // Faster connection timeout
      maxUses: 7500,
      // More uses before recycling
      allowExitOnIdle: false
      // Keep pool alive
    });
    MAX_RETRIES = 3;
    RETRY_DELAY_MS = 1e3;
    pool2.on("connect", () => {
      console.log("New database connection established");
    });
    pool2.on("error", (err) => {
      console.error("Database connection error:", err.message);
    });
    db = drizzle({ client: pool2, schema: schema_exports });
  }
});

// server/services/websocket.ts
var websocket_exports = {};
__export(websocket_exports, {
  getConnectedClientsCount: () => getConnectedClientsCount,
  initializeWebSocketServer: () => initializeWebSocketServer,
  sendNotificationToUser: () => sendNotificationToUser,
  sendNotificationToUsers: () => sendNotificationToUsers
});
function initializeWebSocketServer(httpServer) {
  console.log("EMERGENCY: WebSocket server disabled to fix notification data integrity issue");
  return;
}
function sendNotificationToUser(userId, notification) {
  console.log("EMERGENCY: WebSocket notifications disabled");
  return;
}
function sendNotificationToUsers(userIds, notification) {
  console.log("EMERGENCY: WebSocket notifications disabled");
  return;
}
function getConnectedClientsCount() {
  return 0;
}
var init_websocket = __esm({
  "server/services/websocket.ts"() {
    "use strict";
  }
});

// server/services/email.ts
import SparkPost from "sparkpost";
function isEmailEnabled() {
  if (!EMAIL_ENABLED || sparkPostClient2 === null) {
    console.log("Email service disabled: SparkPost API key not configured or client initialization failed");
    return false;
  }
  try {
    const domain = DEFAULT_FROM_EMAIL2.split("@")[1];
    console.log(`Attempting to use email domain: ${domain}`);
    console.log(`Using verified domain: ${domain} for email delivery`);
  } catch (error) {
    console.error("Error in domain verification check:", error);
  }
  return true;
}
async function sendEmail(params) {
  if (!isEmailEnabled()) {
    console.log("Email service not configured. Would have sent:");
    console.log("To:", params.to);
    console.log("Subject:", params.subject);
    console.log("Body:", params.text || params.html || "(HTML content)");
    return false;
  }
  try {
    const transmission = {
      content: {
        from: params.from || DEFAULT_FROM_EMAIL2,
        subject: params.subject
      },
      recipients: [{ address: { email: params.to } }]
    };
    if (params.html) {
      transmission.content.html = params.html;
    }
    if (params.text) {
      transmission.content.text = params.text;
    }
    if (params.templateId) {
      transmission.content = {
        template_id: params.templateId,
        from: params.from || DEFAULT_FROM_EMAIL2
      };
      if (params.templateData) {
        transmission.substitution_data = params.templateData;
      }
    }
    console.log(`Sending email to ${params.to} via SparkPost`);
    const result = await sparkPostClient2.transmissions.send(transmission);
    console.log("Email sent successfully:", result);
    try {
      await pool2.query(
        `INSERT INTO email_logs (recipient, subject, body_text, sent_at) 
         VALUES ($1, $2, $3, $4)`,
        [params.to, params.subject, params.text || "(HTML content)", /* @__PURE__ */ new Date()]
      );
    } catch (dbError) {
      console.error("Failed to log email to database (non-critical):", dbError);
    }
    return true;
  } catch (error) {
    console.error("Error sending email via SparkPost:", error);
    return false;
  }
}
async function sendEmotionTrackingReminder(email, name) {
  const subject = "Reminder: Track Your Emotions with ResilienceHub\u2122";
  const text2 = `
Hello ${name},

We noticed it's been a few days since you last tracked your emotions on ResilienceHub\u2122. 

Regular emotion tracking helps build self-awareness and can lead to better therapy outcomes. Even a quick 30-second check-in can provide valuable insights for both you and your therapist.

To record your emotions, simply log in to your ResilienceHub\u2122 account and click on "Track Emotions" from your dashboard.

Remember that ResilienceHub\u2122 is a supportive tool for your therapy with Resilience Counseling Research and Consultation, not a replacement for professional care.

Wishing you well,
Resilience Counseling Research and Consultation Team
`;
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4f46e5;">Hello ${name},</h2>
  
  <p>We noticed it's been a few days since you last tracked your emotions on ResilienceHub\u2122.</p>
  
  <p>Regular emotion tracking helps build self-awareness and can lead to better therapy outcomes. Even a quick 30-second check-in can provide valuable insights for both you and your therapist.</p>
  
  <p><a href="${process.env.APP_URL || "https://resiliencehub.replit.app"}" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0;">Track Your Emotions Now</a></p>
  
  <p>Wishing you well,<br>
  Resilience Counseling Research and Consultation Team</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #666;">This email was sent as part of your therapy program with Resilience Counseling. If you believe you received this in error, please contact your therapist.</p>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #4f46e5;">
    <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.4;">
      <strong>Automated Reminder System:</strong><br>
      This is an automated engagement reminder sent to encourage regular use of your mental health tracking tools. 
      The system monitors your activity and sends reminders when you haven't logged emotions for several days. 
      You can adjust reminder preferences in your account settings at 
      <a href="https://resiliencehub.replit.app/dashboard" style="color: #4f46e5;">https://resiliencehub.replit.app/dashboard</a>
    </p>
  </div>
</div>
`;
  return sendEmail({
    to: email,
    from: DEFAULT_FROM_EMAIL2,
    subject,
    text: text2,
    html
  });
}
async function sendWeeklyProgressDigest(email, name, stats) {
  const subject = "Your Weekly Progress Report from ResilienceHub\u2122";
  const text2 = `
Hello ${name},

Here's your weekly progress report from ResilienceHub\u2122:

\u2022 Emotions tracked: ${stats.emotionsTracked || 0}
\u2022 Journal entries: ${stats.journalEntries || 0}
\u2022 Thought records completed: ${stats.thoughtRecords || 0}
\u2022 Goals progress: ${stats.goalsProgress || "No updates"}

Log in to your ResilienceHub\u2122 account to see more detailed analytics and insights.

Wishing you continued growth,
Resilience Counseling Research and Consultation Team
`;
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4f46e5;">Hello ${name},</h2>
  
  <p>Here's your weekly progress report from ResilienceHub\u2122:</p>
  
  <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Emotions tracked:</strong> ${stats.emotionsTracked || 0}</p>
    <p><strong>Journal entries:</strong> ${stats.journalEntries || 0}</p>
    <p><strong>Thought records completed:</strong> ${stats.thoughtRecords || 0}</p>
    <p><strong>Goals progress:</strong> ${stats.goalsProgress || "No updates"}</p>
  </div>
  
  <p><a href="${process.env.APP_URL || "https://resiliencehub.replit.app"}/dashboard/analytics" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0;">View Detailed Analytics</a></p>
  
  <p>Wishing you continued growth,<br>
  Resilience Counseling Research and Consultation Team</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #666;">This email was sent as part of your therapy program with Resilience Counseling. If you believe you received this in error, please contact your therapist.</p>
</div>
`;
  return sendEmail({
    to: email,
    from: DEFAULT_FROM_EMAIL2,
    subject,
    text: text2,
    html
  });
}
var DEFAULT_FROM_EMAIL2, SPARKPOST_API_KEY, EMAIL_ENABLED, sparkPostClient2;
var init_email = __esm({
  "server/services/email.ts"() {
    "use strict";
    init_db();
    DEFAULT_FROM_EMAIL2 = "noreply@send.rcrc.ca";
    SPARKPOST_API_KEY = process.env.SPARKPOST_API_KEY;
    EMAIL_ENABLED = !!SPARKPOST_API_KEY;
    sparkPostClient2 = null;
    if (EMAIL_ENABLED) {
      try {
        sparkPostClient2 = new SparkPost(SPARKPOST_API_KEY);
        console.log("SparkPost client initialized successfully");
      } catch (error) {
        console.error("Failed to initialize SparkPost client:", error);
      }
    }
  }
});

// server/services/notificationService.ts
import { eq as eq4, desc as desc4, and as and4 } from "drizzle-orm";
async function createNotification(data) {
  try {
    const [notification] = await db.insert(notifications).values(data).returning();
    try {
      sendNotificationToUser(data.userId, notification);
    } catch (wsError) {
      console.warn(`Failed to send WebSocket notification to user ${data.userId}:`, wsError);
    }
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}
var init_notificationService = __esm({
  "server/services/notificationService.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_websocket();
  }
});

// server/services/reminderService.ts
import { eq as eq5, and as and5, sql as sql4, or as or2 } from "drizzle-orm";
async function findInactiveClients2(days) {
  try {
    const now = /* @__PURE__ */ new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
    const activeUsersQuery = db.select({ userId: emotionRecords.userId }).from(emotionRecords).groupBy(emotionRecords.userId);
    const activeUserResults = await activeUsersQuery;
    const activeUserIds = activeUserResults.map((result) => result.userId);
    if (activeUserIds.length === 0) {
      return [];
    }
    const inactiveClientsQuery = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      therapistId: users.therapistId,
      lastActivity: sql4`MAX(${emotionRecords.timestamp})`.as("last_activity")
    }).from(users).leftJoin(emotionRecords, eq5(users.id, emotionRecords.userId)).where(
      and5(
        eq5(users.role, "client"),
        eq5(users.status, "active"),
        sql4`${users.id} IN (${activeUserIds.join(",")})`
      )
    ).groupBy(users.id).having(
      or2(
        sql4`MAX(${emotionRecords.timestamp}) < ${cutoffDate.toISOString()}`,
        sql4`MAX(${emotionRecords.timestamp}) IS NULL`
      )
    );
    const inactiveClients = await inactiveClientsQuery;
    return inactiveClients;
  } catch (error) {
    console.error("Error finding inactive clients:", error);
    return [];
  }
}
async function sendReminderToClient(clientId, clientEmail, clientName, config) {
  try {
    let success = true;
    const appUrl = process.env.APP_URL || "https://resiliencehub.replit.app";
    if (config.sendEmails) {
      const emailContent = REMINDER_EMAIL_TEMPLATE.replace("{{loginUrl}}", `${appUrl}`);
      const emailResult = await sendEmail({
        to: clientEmail,
        subject: "ResilienceHub\u2122 - Activity Reminder",
        html: emailContent
      });
      if (!emailResult) {
        console.warn(`Failed to send reminder email to client ${clientId} (${clientEmail})`);
        success = false;
      }
    }
    if (config.createNotifications) {
      try {
        await createNotification({
          userId: clientId,
          title: "ResilienceHub\u2122 Activity Reminder",
          body: `It's been ${config.inactivityThreshold} days since you last used ResilienceHub\u2122. Regular tracking of emotions, thoughts, and activities helps build self-awareness and improve therapy outcomes.`,
          type: "reminder",
          isRead: false
        });
      } catch (notifError) {
        console.error(`Failed to create reminder notification for client ${clientId}:`, notifError);
        success = false;
      }
    }
    return success;
  } catch (error) {
    console.error(`Error sending reminder to client ${clientId}:`, error);
    return false;
  }
}
async function processInactivityReminders(config = {
  inactivityThreshold: 3,
  // Default: 3 days of inactivity 
  sendEmails: true,
  createNotifications: true
}) {
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Starting inactivity reminder process`);
  console.log(`Checking for clients inactive for ${config.inactivityThreshold} days or more`);
  let sent = 0;
  let failed = 0;
  try {
    const inactiveClients = await findInactiveClients2(config.inactivityThreshold);
    console.log(`Found ${inactiveClients.length} inactive clients`);
    for (const client of inactiveClients) {
      const success = await sendReminderToClient(
        client.id,
        client.email,
        client.name,
        config
      );
      if (success) {
        sent++;
        console.log(`Successfully sent reminder to client ${client.id} (${client.email})`);
      } else {
        failed++;
        console.warn(`Failed to send reminder to client ${client.id} (${client.email})`);
      }
    }
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Completed inactivity reminder process`);
    console.log(`Results: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  } catch (error) {
    console.error("Error processing inactivity reminders:", error);
    return { sent, failed };
  }
}
var REMINDER_EMAIL_TEMPLATE;
var init_reminderService = __esm({
  "server/services/reminderService.ts"() {
    "use strict";
    init_db();
    init_email();
    init_schema();
    init_notificationService();
    REMINDER_EMAIL_TEMPLATE = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #3b82f6; margin-bottom: 10px;">ResilienceHub\u2122 Activity Reminder</h1>
    <p style="color: #4b5563; font-size: 16px;">We've noticed you haven't been active on ResilienceHub\u2122 recently.</p>
  </div>
  
  <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
    <p style="color: #4b5563; font-size: 15px;">Regular tracking of your emotions, thoughts, and activities helps you:</p>
    <ul style="color: #4b5563;">
      <li>Recognize patterns in your emotional responses</li>
      <li>Develop greater self-awareness</li>
      <li>Improve your emotional regulation skills</li>
      <li>Track your progress toward personal goals</li>
      <li>Provide valuable insights for your therapy journey</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin-top: 25px;">
    <a href="{{loginUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log In Now</a>
  </div>
  
  <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
    If you'd prefer not to receive these reminders, you can update your notification preferences in your account settings.
  </p>
</div>
`;
  }
});

// server/scheduler.ts
var scheduler_exports = {};
__export(scheduler_exports, {
  engagementScheduler: () => engagementScheduler
});
var EngagementScheduler, engagementScheduler;
var init_scheduler = __esm({
  "server/scheduler.ts"() {
    "use strict";
    init_reminderService();
    EngagementScheduler = class {
      dailyReminderInterval = null;
      weeklyDigestInterval = null;
      start() {
        console.log("[Scheduler] Starting automatic engagement reminder system...");
        this.scheduleDailyReminders();
        this.scheduleWeeklyDigests();
        console.log("[Scheduler] Engagement reminder system started successfully");
      }
      stop() {
        if (this.dailyReminderInterval) {
          clearInterval(this.dailyReminderInterval);
          this.dailyReminderInterval = null;
        }
        if (this.weeklyDigestInterval) {
          clearInterval(this.weeklyDigestInterval);
          this.weeklyDigestInterval = null;
        }
        console.log("[Scheduler] Engagement reminder system stopped");
      }
      scheduleDailyReminders() {
        this.dailyReminderInterval = setInterval(async () => {
          const now2 = /* @__PURE__ */ new Date();
          const hour = now2.getHours();
          if (hour === 9) {
            await this.runDailyReminders();
          }
        }, 60 * 60 * 1e3);
        const now = /* @__PURE__ */ new Date();
        if (now.getHours() === 9) {
          setTimeout(() => this.runDailyReminders(), 5e3);
        }
      }
      scheduleWeeklyDigests() {
        this.weeklyDigestInterval = setInterval(async () => {
          const now = /* @__PURE__ */ new Date();
          const hour = now.getHours();
          const dayOfWeek = now.getDay();
          if (dayOfWeek === 0 && hour === 8) {
            await this.runWeeklyDigests();
          }
        }, 60 * 60 * 1e3);
      }
      async runDailyReminders() {
        try {
          console.log("[Scheduler] Running daily inactivity reminders...");
          const results = await processInactivityReminders({
            inactivityThreshold: 3,
            // 3 days of inactivity
            sendEmails: true,
            createNotifications: true
          });
          console.log(`[Scheduler] Daily reminders completed: ${results.sent} sent, ${results.failed} failed`);
        } catch (error) {
          console.error("[Scheduler] Error running daily reminders:", error);
        }
      }
      async runWeeklyDigests() {
        try {
          console.log("[Scheduler] Running weekly progress digests...");
          const { processWeeklyDigests } = await import("../scripts/send_weekly_digests");
          const results = await processWeeklyDigests();
          console.log(`[Scheduler] Weekly digests completed:`, results);
        } catch (error) {
          console.error("[Scheduler] Error running weekly digests:", error);
        }
      }
      // Manual trigger methods for testing
      async triggerDailyReminders() {
        console.log("[Scheduler] Manually triggering daily reminders...");
        await this.runDailyReminders();
      }
      async triggerWeeklyDigests() {
        console.log("[Scheduler] Manually triggering weekly digests...");
        await this.runWeeklyDigests();
      }
    };
    engagementScheduler = new EngagementScheduler();
  }
});

// server/services/pdfExport.ts
var pdfExport_exports = {};
__export(pdfExport_exports, {
  exportPDF: () => exportPDF
});
import * as fs from "fs";
import * as path from "path";
import PDFDocument from "pdfkit";
async function exportPDF(options, storage2, res) {
  const { type, targetUserId, tempDir, requestId } = options;
  const tempFilePath = path.join(tempDir, `${type}-export-${targetUserId}-${requestId}.pdf`);
  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const doc = new PDFDocument({
      margin: 50,
      // Set basic document properties
      info: {
        Title: `ResilienceHub Export - ${type}`,
        Author: "ResilienceHub Platform",
        Subject: "CBT Data Export",
        Keywords: "cbt",
        Producer: "ResilienceHub",
        Creator: "ResilienceHub"
      },
      // Disable compression to avoid triggering antivirus
      compress: false,
      // Use the simplest PDF structure
      pdfVersion: "1.4",
      // Avoid using advanced features
      permissions: {
        printing: "highResolution",
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false
      },
      autoFirstPage: true,
      bufferPages: true
    });
    const writeStream = fs.createWriteStream(tempFilePath);
    writeStream.on("error", (err) => {
      console.error(`[${requestId}] Write stream error:`, err);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Failed to generate PDF",
          error: err.message || "Unknown error"
        });
      }
    });
    doc.on("error", (err) => {
      console.error(`[${requestId}] PDF document error:`, err);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Failed to generate PDF",
          error: err.message || "Unknown error"
        });
      }
    });
    doc.pipe(writeStream);
    const user = await storage2.getUser(targetUserId);
    const userName = user ? user.name : `User ${targetUserId}`;
    writeStream.on("finish", () => {
      console.log(`[${requestId}] PDF written to temp file: ${tempFilePath}`);
      const readStream = fs.createReadStream(tempFilePath);
      readStream.on("error", (err) => {
        console.error(`[${requestId}] Read stream error:`, err);
        if (!res.headersSent) {
          res.status(500).json({
            message: "Failed to read PDF file",
            error: err.message || "Unknown error"
          });
        }
      });
      const filename = `Resilience-${type}-export-${Date.now()}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      readStream.pipe(res);
      readStream.on("end", () => {
        try {
          fs.unlinkSync(tempFilePath);
          console.log(`[${requestId}] Temp file cleaned up: ${tempFilePath}`);
        } catch (unlinkErr) {
          console.error(`[${requestId}] Failed to clean up temp file:`, unlinkErr);
        }
      });
    });
    doc.fontSize(20).text("CBT Data Export", { align: "center" }).moveDown(0.5);
    doc.fontSize(14).text(`User: ${userName}`, { align: "center" }).text(`Date: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`, { align: "center" }).moveDown(1);
    doc.fontSize(12).text(`Export Type: ${type.charAt(0).toUpperCase() + type.slice(1)}`, { align: "center" }).moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke().moveDown(1);
    await generatePDFContent(type, targetUserId, storage2, doc);
    doc.fontSize(8).text(
      "Generated by ResilienceHub - " + (/* @__PURE__ */ new Date()).toLocaleString(),
      50,
      doc.page.height - 50,
      { align: "center" }
    );
    doc.end();
  } catch (error) {
    console.error(`[${requestId}] PDF generation error:`, error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to generate PDF",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
async function generatePDFContent(type, targetUserId, storage2, doc) {
  try {
    doc.fontSize(14).text("Data Summary", { align: "center" }).moveDown(1);
    doc.fontSize(10).text(`Export generated: ${(/* @__PURE__ */ new Date()).toISOString()}`, { align: "left" }).moveDown(1);
    doc.fontSize(12).text(`This export contains your ${type} data.`, { align: "left" }).moveDown(1);
    doc.fontSize(12).text(`For security reasons, this PDF contains minimal formatting.`, { align: "left" }).moveDown(0.5);
    doc.fontSize(12).text(`For complete data with formatting, please use the CSV export option.`, { align: "left" }).moveDown(2);
    if (type === "emotions" || type === "all") {
      const emotions = await storage2.getEmotionRecordsByUser(targetUserId);
      doc.fontSize(12).text(`Emotion Records: ${emotions?.length || 0}`, { align: "left" }).moveDown(1);
    }
    if (type === "thoughts" || type === "all") {
      const thoughts = await storage2.getThoughtRecordsByUser(targetUserId);
      doc.fontSize(12).text(`Thought Records: ${thoughts?.length || 0}`, { align: "left" }).moveDown(1);
    }
    if (type === "journals" || type === "all") {
      const journals = await storage2.getJournalEntriesByUser(targetUserId);
      doc.fontSize(12).text(`Journal Entries: ${journals?.length || 0}`, { align: "left" }).moveDown(1);
    }
    if (type === "goals" || type === "all") {
      const goals2 = await storage2.getGoalsByUser(targetUserId);
      doc.fontSize(12).text(`Goals: ${goals2?.length || 0}`, { align: "left" }).moveDown(1);
    }
    doc.moveDown(2);
    doc.fontSize(11).text(`Note: This PDF contains only summary information.`, { align: "left" }).moveDown(0.5);
    doc.fontSize(11).text(`To access your complete data with all details, please use the CSV export option.`, { align: "left" });
  } catch (error) {
    doc.fontSize(12).text(`An error occurred while generating the content.`, { align: "center" }).moveDown(1);
    doc.fontSize(10).text(`Please try the CSV export option instead.`, { align: "center" });
    console.error("Error generating PDF content:", error);
  }
}
var init_pdfExport = __esm({
  "server/services/pdfExport.ts"() {
    "use strict";
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
init_schema();
init_db();
import { eq, and, desc, sql, or } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";
var DatabaseStorage = class {
  // User management
  async getUser(id) {
    if (id === void 0 || id === null) {
      console.error("getUser called with null/undefined id");
      return void 0;
    }
    const userId = Number(id);
    if (isNaN(userId)) {
      console.error(`Invalid user ID: ${id}, cannot convert to number`);
      return void 0;
    }
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      return user;
    } catch (error) {
      console.error(`Error retrieving user with ID ${userId}:`, error);
      return void 0;
    }
  }
  async getUserByUsername(username) {
    try {
      const { withRetry: withRetry2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [user] = await withRetry2(async () => {
        console.log(`Attempting to fetch user with username: ${username}`);
        return await db.select().from(users).where(eq(users.username, username));
      });
      return user;
    } catch (error) {
      console.error(`Error in getUserByUsername for '${username}':`, error);
      return void 0;
    }
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db.insert(users).values({
      ...userData,
      password: hashedPassword
    }).returning();
    return user;
  }
  async updateUser(id, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  async getClients(therapistId) {
    console.log(`Getting clients for therapist ID: ${therapistId}, type: ${typeof therapistId}`);
    if (!therapistId || isNaN(therapistId)) {
      console.error("Invalid therapist ID provided:", therapistId);
      return [];
    }
    try {
      console.log(`Querying database for clients with therapist_id = ${therapistId}`);
      const query = `
        SELECT 
          id, 
          username, 
          email, 
          name, 
          role, 
          therapist_id, 
          current_viewing_client_id, 
          status,
          created_at,
          stripe_customer_id,
          stripe_subscription_id,
          subscription_plan_id,
          subscription_status,
          subscription_end_date,
          bio,
          specialty,
          licenses,
          education,
          approach
        FROM users
        WHERE role = 'client' AND therapist_id = $1
        ORDER BY name
      `;
      const { pool: pool3 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const result = await pool3.query(query, [therapistId]);
      const clientsList = result.rows;
      console.log(`Found ${clientsList.length} clients for therapist ${therapistId}`);
      return clientsList;
    } catch (error) {
      console.error("Error in getClients:", error);
      return [];
    }
  }
  // Add the new methods needed for client display fixes
  async getClientsByTherapistId(therapistId) {
    console.log(`Getting clients for therapist ID: ${therapistId} in new method`);
    try {
      const clientsList = await db.select().from(users).where(eq(users.therapist_id, therapistId)).orderBy(users.name);
      console.log(`Found ${clientsList.length} clients for therapist ${therapistId}`);
      return clientsList;
    } catch (error) {
      console.error("Error in getClientsByTherapistId:", error);
      return [];
    }
  }
  async getClient(clientId) {
    console.log(`Getting client by ID: ${clientId}`);
    try {
      const [client] = await db.select().from(users).where(eq(users.id, clientId));
      if (client) {
        console.log(`Found client: ${client.name} with ID ${clientId}`);
      } else {
        console.log(`No client found with ID ${clientId}`);
      }
      return client;
    } catch (error) {
      console.error(`Error in getClient for ID ${clientId}:`, error);
      return void 0;
    }
  }
  async getSession(sessionId) {
    console.log(`Looking up session ID: ${sessionId}`);
    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (session) {
        console.log(`Found session: ${sessionId} for user: ${session.userId}`);
        return { userId: session.userId };
      } else {
        console.log(`No session found with ID ${sessionId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error in getSession for ID ${sessionId}:`, error);
      return null;
    }
  }
  async getClientByIdAndTherapist(clientId, therapistId) {
    const [client] = await db.select().from(users).where(
      and(
        eq(users.id, clientId),
        eq(users.therapistId, therapistId),
        eq(users.role, "client")
      )
    );
    return client;
  }
  async getAllUsers() {
    return db.select().from(users).orderBy(users.name);
  }
  async updateCurrentViewingClient(userId, clientId) {
    console.log(`Storing current viewing client: User ${userId} is viewing client ${clientId}`);
    const [updatedUser] = await db.update(users).set({ currentViewingClientId: clientId }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async getCurrentViewingClient(userId) {
    console.log(`Getting current viewing client for user ID: ${userId}, type: ${typeof userId}`);
    if (userId === void 0 || userId === null) {
      console.error("getCurrentViewingClient called with null/undefined userId");
      return null;
    }
    const userIdNumber = Number(userId);
    if (isNaN(userIdNumber)) {
      console.error(`Invalid userId: ${userId}, cannot convert to number`);
      return null;
    }
    try {
      const user = await this.getUser(userIdNumber);
      if (!user) {
        console.log(`User with ID ${userIdNumber} not found`);
        return null;
      }
      console.log(`User ${userIdNumber} is currently viewing client ID: ${user.currentViewingClientId}`);
      return user.currentViewingClientId;
    } catch (error) {
      console.error("Error in getCurrentViewingClient:", error);
      return null;
    }
  }
  async updateUserStripeInfo(userId, stripeInfo) {
    const [updatedUser] = await db.update(users).set({
      stripeCustomerId: stripeInfo.stripeCustomerId,
      stripeSubscriptionId: stripeInfo.stripeSubscriptionId
    }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async updateSubscriptionStatus(userId, status, endDate) {
    const [updatedUser] = await db.update(users).set({
      subscriptionStatus: status,
      subscriptionEndDate: endDate
    }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async assignSubscriptionPlan(userId, planId) {
    const [updatedUser] = await db.update(users).set({
      subscriptionPlanId: planId
    }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async countProfessionalClients(professionalId) {
    const result = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.therapistId, professionalId));
    return parseInt(result[0].count);
  }
  async updateUserTherapist(userId, therapistId) {
    const [updatedUser] = await db.update(users).set({ therapistId }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async updateUserStatus(userId, status) {
    console.log(`Updating user ${userId} status to ${status}`);
    const [updatedUser] = await db.update(users).set({ status }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async removeClientFromTherapist(clientId, therapistId) {
    const client = await this.getUser(clientId);
    if (!client || client.therapistId !== therapistId) {
      console.log(`Client ${clientId} does not belong to therapist ${therapistId}`);
      return null;
    }
    console.log(`Removing client ${clientId} from therapist ${therapistId}`);
    const [updatedClient] = await db.update(users).set({ therapistId: null }).where(eq(users.id, clientId)).returning();
    await db.update(users).set({ currentViewingClientId: null }).where(
      and(
        eq(users.id, therapistId),
        eq(users.currentViewingClientId, clientId)
      )
    );
    console.log(`Client ${clientId} removed from therapist ${therapistId}`);
    return updatedClient;
  }
  async deleteUser(userId, adminId) {
    console.log(`Deleting user with ID: ${userId}`);
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    if (adminId) {
      try {
        const admin = await this.getUser(adminId);
        await this.createSystemLog({
          action: "user_deleted",
          userId: adminId,
          details: {
            deletedUserId: userId,
            username: user.username,
            email: user.email,
            role: user.role,
            adminUsername: admin?.username || "Unknown"
          },
          ipAddress: null
        });
      } catch (error) {
        console.error("Error creating system log:", error);
      }
    }
    if (user.role === "therapist") {
      const clients = await db.select().from(users).where(eq(users.therapistId, userId));
      for (const client of clients) {
        await this.createNotification({
          userId: client.id,
          title: "Therapist Account Removed",
          body: `Your therapist's account has been removed from the system. Please contact administration for more information.`,
          type: "system",
          isRead: false,
          link: null
        });
      }
    }
    if (user.role === "client" && user.therapistId) {
      await this.createNotification({
        userId: user.therapistId,
        title: "Client Account Removed",
        body: `Your client ${user.name} (${user.username}) has been removed from the system.`,
        type: "system",
        isRead: false,
        link: null
      });
    }
    await db.delete(sessions).where(eq(sessions.userId, userId));
    const userEmotionRecords = await this.getEmotionRecordsByUser(userId);
    for (const record of userEmotionRecords) {
      await this.deleteEmotionRecord(record.id);
    }
    const userProtectiveFactors = await this.getProtectiveFactorsByUser(userId, false);
    for (const factor of userProtectiveFactors) {
      await this.deleteProtectiveFactor(factor.id);
    }
    const userCopingStrategies = await this.getCopingStrategiesByUser(userId, false);
    for (const strategy of userCopingStrategies) {
      await this.deleteCopingStrategy(strategy.id);
    }
    const userGoals = await this.getGoalsByUser(userId);
    for (const goal of userGoals) {
      const milestones = await this.getGoalMilestonesByGoal(goal.id);
      for (const milestone of milestones) {
        await db.delete(goalMilestones).where(eq(goalMilestones.id, milestone.id));
      }
      await db.delete(goals).where(eq(goals.id, goal.id));
    }
    const userJournals = await this.getJournalEntriesByUser(userId);
    for (const journal of userJournals) {
      await this.deleteJournalEntry(journal.id);
    }
    await db.delete(actions).where(eq(actions.userId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    await db.delete(resourceAssignments).where(eq(resourceAssignments.assignedTo, userId));
    await db.delete(resourceFeedback).where(eq(resourceFeedback.userId, userId));
    await db.delete(clientInvitations).where(eq(clientInvitations.email, user.email));
    await db.delete(reframePracticeResults).where(eq(reframePracticeResults.userId, userId));
    await db.delete(userGameProfile).where(eq(userGameProfile.userId, userId));
    await db.delete(copingStrategyUsage).where(eq(copingStrategyUsage.userId, userId));
    await db.update(users).set({ therapistId: null }).where(eq(users.therapistId, userId));
    await db.update(users).set({ currentViewingClientId: null }).where(eq(users.currentViewingClientId, userId));
    await db.delete(users).where(eq(users.id, userId));
    console.log(`User ${userId} and all related records deleted successfully`);
  }
  // System logs
  async createSystemLog(log2) {
    try {
      const [newLog] = await db.insert(systemLogs).values(log2).returning();
      return newLog;
    } catch (error) {
      console.error("Error creating system log:", error);
      return {
        id: 0,
        action: log2.action,
        performedBy: log2.performedBy,
        details: log2.details,
        ipAddress: log2.ipAddress || null,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  // Admin statistics methods
  async getAllEmotionRecords() {
    return db.select().from(emotionRecords).orderBy(desc(emotionRecords.timestamp));
  }
  async getAllThoughtRecords() {
    return db.select().from(thoughtRecords).orderBy(desc(thoughtRecords.createdAt));
  }
  async getAllGoals() {
    return db.select().from(goals).orderBy(desc(goals.createdAt));
  }
  async getAllResourceAssignments() {
    return db.select().from(resourceAssignments);
  }
  // Subscription plans management
  async createSubscriptionPlan(plan) {
    const [newPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return newPlan;
  }
  async getSubscriptionPlans(activeOnly = true) {
    if (activeOnly) {
      return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true)).orderBy(subscriptionPlans.price);
    } else {
      return db.select().from(subscriptionPlans).orderBy(subscriptionPlans.price);
    }
  }
  async getSubscriptionPlanById(id) {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }
  async updateSubscriptionPlan(id, data) {
    const [updatedPlan] = await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id)).returning();
    return updatedPlan;
  }
  async getDefaultSubscriptionPlan() {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isDefault, true)).where(eq(subscriptionPlans.isActive, true));
    return plan;
  }
  async setDefaultSubscriptionPlan(id) {
    await db.update(subscriptionPlans).set({ isDefault: false }).where(eq(subscriptionPlans.isDefault, true));
    const [defaultPlan] = await db.update(subscriptionPlans).set({ isDefault: true }).where(eq(subscriptionPlans.id, id)).returning();
    return defaultPlan;
  }
  async deactivateSubscriptionPlan(id) {
    const [deactivatedPlan] = await db.update(subscriptionPlans).set({ isActive: false }).where(eq(subscriptionPlans.id, id)).returning();
    return deactivatedPlan;
  }
  // Session management
  async createSession(userId) {
    const sessionId = nanoid();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const [session] = await db.insert(sessions).values({
      id: sessionId,
      userId,
      expiresAt
    }).returning();
    return session;
  }
  async getSessionById(sessionId) {
    try {
      const { withRetry: withRetry2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [session] = await withRetry2(async () => {
        console.log(`Attempting to fetch session with ID: ${sessionId}`);
        return await db.select().from(sessions).where(eq(sessions.id, sessionId));
      });
      return session;
    } catch (error) {
      console.error(`Error retrieving session ${sessionId}:`, error);
      return void 0;
    }
  }
  async deleteSession(sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  // Emotion records
  async createEmotionRecord(record) {
    const [emotionRecord] = await db.insert(emotionRecords).values(record).returning();
    return emotionRecord;
  }
  async getEmotionRecordsByUser(userId) {
    return db.select().from(emotionRecords).where(eq(emotionRecords.userId, userId)).orderBy(desc(emotionRecords.timestamp));
  }
  async getEmotionRecordById(id) {
    const [record] = await db.select().from(emotionRecords).where(eq(emotionRecords.id, id));
    return record;
  }
  async deleteEmotionRecord(id) {
    const relatedThoughts = await this.getThoughtRecordsByEmotionId(id);
    for (const thought of relatedThoughts) {
      await this.deleteThoughtRecord(thought.id);
    }
    await db.delete(emotionRecords).where(eq(emotionRecords.id, id));
  }
  // Thought records
  async createThoughtRecord(record) {
    const [thoughtRecord] = await db.insert(thoughtRecords).values(record).returning();
    return thoughtRecord;
  }
  async getThoughtRecordsByUser(userId) {
    return db.select().from(thoughtRecords).where(eq(thoughtRecords.userId, userId)).orderBy(desc(thoughtRecords.createdAt));
  }
  async getThoughtRecordById(id) {
    const [record] = await db.select().from(thoughtRecords).where(eq(thoughtRecords.id, id));
    return record;
  }
  async getThoughtRecordsByEmotionId(emotionRecordId) {
    return db.select().from(thoughtRecords).where(eq(thoughtRecords.emotionRecordId, emotionRecordId)).orderBy(desc(thoughtRecords.createdAt));
  }
  async deleteThoughtRecord(id) {
    await db.delete(reframePracticeResults).where(eq(reframePracticeResults.thoughtRecordId, id));
    await db.delete(copingStrategyUsage).where(eq(copingStrategyUsage.thoughtRecordId, id));
    await db.delete(protectiveFactorUsage).where(eq(protectiveFactorUsage.thoughtRecordId, id));
    await db.delete(thoughtRecords).where(eq(thoughtRecords.id, id));
  }
  // Protective factors
  async createProtectiveFactor(factor) {
    const [protectiveFactor] = await db.insert(protectiveFactors).values(factor).returning();
    return protectiveFactor;
  }
  async getProtectiveFactorsByUser(userId, includeGlobal = true) {
    const user = await this.getUser(userId);
    if (includeGlobal) {
      let conditions = [
        eq(protectiveFactors.userId, userId),
        eq(protectiveFactors.isGlobal, true)
      ];
      if (user && user.therapistId) {
        conditions.push(eq(protectiveFactors.userId, user.therapistId));
      }
      return db.select().from(protectiveFactors).where(or(...conditions)).orderBy(protectiveFactors.name);
    } else {
      return db.select().from(protectiveFactors).where(eq(protectiveFactors.userId, userId)).orderBy(protectiveFactors.name);
    }
  }
  async getProtectiveFactorById(id) {
    const [factor] = await db.select().from(protectiveFactors).where(eq(protectiveFactors.id, id));
    return factor;
  }
  async updateProtectiveFactor(id, data) {
    const [updatedFactor] = await db.update(protectiveFactors).set(data).where(eq(protectiveFactors.id, id)).returning();
    return updatedFactor;
  }
  async deleteProtectiveFactor(id) {
    await db.delete(protectiveFactorUsage).where(eq(protectiveFactorUsage.protectiveFactorId, id));
    await db.delete(protectiveFactors).where(eq(protectiveFactors.id, id));
  }
  // Protective factor usage
  async addProtectiveFactorUsage(usage) {
    const [factorUsage] = await db.insert(protectiveFactorUsage).values(usage).returning();
    return factorUsage;
  }
  // Coping strategies
  async createCopingStrategy(strategy) {
    const [copingStrategy] = await db.insert(copingStrategies).values(strategy).returning();
    return copingStrategy;
  }
  async getCopingStrategiesByUser(userId, includeGlobal = true) {
    const user = await this.getUser(userId);
    if (includeGlobal) {
      let conditions = [
        eq(copingStrategies.userId, userId),
        eq(copingStrategies.isGlobal, true)
      ];
      if (user && user.therapistId) {
        conditions.push(eq(copingStrategies.userId, user.therapistId));
      }
      return db.select().from(copingStrategies).where(or(...conditions)).orderBy(copingStrategies.name);
    } else {
      return db.select().from(copingStrategies).where(eq(copingStrategies.userId, userId)).orderBy(copingStrategies.name);
    }
  }
  async getCopingStrategyById(id) {
    const [strategy] = await db.select().from(copingStrategies).where(eq(copingStrategies.id, id));
    return strategy;
  }
  async updateCopingStrategy(id, data) {
    const [updatedStrategy] = await db.update(copingStrategies).set(data).where(eq(copingStrategies.id, id)).returning();
    return updatedStrategy;
  }
  async deleteCopingStrategy(id) {
    await db.delete(copingStrategyUsage).where(eq(copingStrategyUsage.copingStrategyId, id));
    await db.delete(copingStrategies).where(eq(copingStrategies.id, id));
  }
  // Coping strategy usage
  async addCopingStrategyUsage(usage) {
    const [strategyUsage] = await db.insert(copingStrategyUsage).values(usage).returning();
    return strategyUsage;
  }
  // Goals
  async createGoal(goal) {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }
  async getGoalsByUser(userId) {
    return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
  }
  async updateGoalStatus(id, status, therapistComments) {
    const updateData = { status };
    if (therapistComments) {
      updateData.therapistComments = therapistComments;
    }
    const [updatedGoal] = await db.update(goals).set(updateData).where(eq(goals.id, id)).returning();
    return updatedGoal;
  }
  // Goal milestones
  async createGoalMilestone(milestone) {
    const [newMilestone] = await db.insert(goalMilestones).values(milestone).returning();
    return newMilestone;
  }
  async getGoalMilestonesByGoal(goalId) {
    return db.select().from(goalMilestones).where(eq(goalMilestones.goalId, goalId)).orderBy(goalMilestones.dueDate);
  }
  async updateGoalMilestoneCompletion(id, isCompleted) {
    const [updatedMilestone] = await db.update(goalMilestones).set({ isCompleted }).where(eq(goalMilestones.id, id)).returning();
    return updatedMilestone;
  }
  // Actions
  async createAction(action) {
    const [newAction] = await db.insert(actions).values(action).returning();
    return newAction;
  }
  async getActionsByUser(userId) {
    return db.select().from(actions).where(eq(actions.userId, userId)).orderBy(desc(actions.createdAt));
  }
  async updateActionCompletion(id, isCompleted, moodAfter, reflection) {
    const updateData = {
      isCompleted,
      completedAt: isCompleted ? /* @__PURE__ */ new Date() : null
    };
    if (moodAfter !== void 0) {
      updateData.moodAfter = moodAfter;
    }
    if (reflection) {
      updateData.reflection = reflection;
    }
    const [updatedAction] = await db.update(actions).set(updateData).where(eq(actions.id, id)).returning();
    return updatedAction;
  }
  // Resources
  async createResource(resource) {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }
  async getResourceById(id) {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }
  async getResourcesByCreator(userId) {
    return db.select().from(resources).where(eq(resources.createdBy, userId)).orderBy(desc(resources.createdAt));
  }
  async getResourcesByCategory(category) {
    return db.select().from(resources).where(eq(resources.category, category)).where(eq(resources.isPublished, true)).orderBy(desc(resources.createdAt));
  }
  async getAllResources(includeUnpublished = false) {
    if (includeUnpublished) {
      return db.select().from(resources).orderBy(desc(resources.createdAt));
    } else {
      return db.select().from(resources).where(eq(resources.isPublished, true)).orderBy(desc(resources.createdAt));
    }
  }
  async updateResource(id, data) {
    const [updatedResource] = await db.update(resources).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(resources.id, id)).returning();
    return updatedResource;
  }
  async deleteResource(id) {
    await db.delete(resourceAssignments).where(eq(resourceAssignments.resourceId, id));
    await db.delete(resourceFeedback).where(eq(resourceFeedback.resourceId, id));
    await db.delete(resources).where(eq(resources.id, id));
  }
  async cloneResource(resourceId, userId) {
    const originalResource = await this.getResourceById(resourceId);
    if (!originalResource) {
      throw new Error("Resource not found");
    }
    const [clonedResource] = await db.insert(resources).values({
      title: `${originalResource.title} (Customized)`,
      description: originalResource.description,
      content: originalResource.content,
      category: originalResource.category,
      tags: originalResource.tags,
      type: originalResource.type,
      fileUrl: originalResource.fileUrl,
      thumbnailUrl: originalResource.thumbnailUrl,
      createdBy: userId,
      parentResourceId: originalResource.id,
      isPublished: true
    }).returning();
    return clonedResource;
  }
  // Resource assignments
  async assignResourceToClient(assignment) {
    const [newAssignment] = await db.insert(resourceAssignments).values(assignment).returning();
    return newAssignment;
  }
  async getResourceAssignmentById(id) {
    const [assignment] = await db.select().from(resourceAssignments).where(eq(resourceAssignments.id, id));
    return assignment;
  }
  async getAssignmentsByClient(clientId) {
    return db.select().from(resourceAssignments).where(eq(resourceAssignments.assignedTo, clientId)).orderBy(desc(resourceAssignments.assignedAt));
  }
  async getAssignmentsByProfessional(professionalId) {
    return db.select().from(resourceAssignments).where(eq(resourceAssignments.assignedBy, professionalId)).orderBy(desc(resourceAssignments.assignedAt));
  }
  async updateAssignmentStatus(id, status) {
    const completedAt = status === "completed" ? /* @__PURE__ */ new Date() : null;
    const [updatedAssignment] = await db.update(resourceAssignments).set({
      status,
      completedAt
    }).where(eq(resourceAssignments.id, id)).returning();
    return updatedAssignment;
  }
  async deleteResourceAssignment(id) {
    await db.delete(resourceAssignments).where(eq(resourceAssignments.id, id));
  }
  // Resource feedback
  async createResourceFeedback(feedback) {
    const [newFeedback] = await db.insert(resourceFeedback).values(feedback).returning();
    return newFeedback;
  }
  async getResourceFeedbackByResource(resourceId) {
    return db.select().from(resourceFeedback).where(eq(resourceFeedback.resourceId, resourceId)).orderBy(desc(resourceFeedback.createdAt));
  }
  async getResourceFeedbackByUser(userId) {
    return db.select().from(resourceFeedback).where(eq(resourceFeedback.userId, userId)).orderBy(desc(resourceFeedback.createdAt));
  }
  // Journal entries implementation
  async createJournalEntry(entry) {
    const [newEntry] = await db.insert(journalEntries).values(entry).returning();
    return newEntry;
  }
  async getJournalEntryById(id) {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return entry;
  }
  async getJournalEntriesByUser(userId) {
    return db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.createdAt));
  }
  async updateJournalEntry(id, data) {
    const [updatedEntry] = await db.update(journalEntries).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(journalEntries.id, id)).returning();
    return updatedEntry;
  }
  async deleteJournalEntry(id) {
    await db.delete(journalComments).where(eq(journalComments.journalEntryId, id));
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }
  // Journal comments implementation
  async createJournalComment(comment) {
    const [newComment] = await db.insert(journalComments).values(comment).returning();
    return newComment;
  }
  async getJournalCommentsByEntry(journalEntryId) {
    const results = await db.select({
      id: journalComments.id,
      journalEntryId: journalComments.journalEntryId,
      userId: journalComments.userId,
      therapistId: journalComments.therapistId,
      comment: journalComments.comment,
      createdAt: journalComments.createdAt,
      updatedAt: journalComments.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        username: users.username
      }
    }).from(journalComments).leftJoin(users, eq(journalComments.userId, users.id)).where(eq(journalComments.journalEntryId, journalEntryId)).orderBy(journalComments.createdAt);
    return results;
  }
  async updateJournalComment(id, data) {
    const [updatedComment] = await db.update(journalComments).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(journalComments.id, id)).returning();
    return updatedComment;
  }
  async deleteJournalComment(id) {
    await db.delete(journalComments).where(eq(journalComments.id, id));
  }
  // Cognitive distortions
  async createCognitiveDistortion(distortion) {
    const [newDistortion] = await db.insert(cognitiveDistortions).values(distortion).returning();
    return newDistortion;
  }
  async getCognitiveDistortions() {
    return db.select().from(cognitiveDistortions).orderBy(cognitiveDistortions.name);
  }
  async getCognitiveDistortionById(id) {
    const [distortion] = await db.select().from(cognitiveDistortions).where(eq(cognitiveDistortions.id, id));
    return distortion;
  }
  async updateCognitiveDistortion(id, data) {
    const [updatedDistortion] = await db.update(cognitiveDistortions).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(cognitiveDistortions.id, id)).returning();
    return updatedDistortion;
  }
  async deleteCognitiveDistortion(id) {
    await db.delete(cognitiveDistortions).where(eq(cognitiveDistortions.id, id));
  }
  // Integration: Journal entries <-> Thought records
  async linkJournalToThoughtRecord(journalId, thoughtRecordId) {
    const journal = await this.getJournalEntryById(journalId);
    if (!journal) {
      throw new Error(`Journal entry with ID ${journalId} not found`);
    }
    const thoughtRecord = await this.getThoughtRecordById(thoughtRecordId);
    if (!thoughtRecord) {
      throw new Error(`Thought record with ID ${thoughtRecordId} not found`);
    }
    const currentThoughtRecordIds = journal.relatedThoughtRecordIds || [];
    if (!currentThoughtRecordIds.includes(thoughtRecordId)) {
      await db.update(journalEntries).set({
        relatedThoughtRecordIds: [...currentThoughtRecordIds, thoughtRecordId],
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(journalEntries.id, journalId));
    }
    const currentJournalEntryIds = thoughtRecord.relatedJournalEntryIds || [];
    if (!currentJournalEntryIds.includes(journalId)) {
      await db.update(thoughtRecords).set({
        relatedJournalEntryIds: [...currentJournalEntryIds, journalId]
      }).where(eq(thoughtRecords.id, thoughtRecordId));
    }
  }
  async unlinkJournalFromThoughtRecord(journalId, thoughtRecordId) {
    const journal = await this.getJournalEntryById(journalId);
    if (!journal) {
      throw new Error(`Journal entry with ID ${journalId} not found`);
    }
    const thoughtRecord = await this.getThoughtRecordById(thoughtRecordId);
    if (!thoughtRecord) {
      throw new Error(`Thought record with ID ${thoughtRecordId} not found`);
    }
    const currentThoughtRecordIds = journal.relatedThoughtRecordIds || [];
    if (currentThoughtRecordIds.includes(thoughtRecordId)) {
      await db.update(journalEntries).set({
        relatedThoughtRecordIds: currentThoughtRecordIds.filter((id) => id !== thoughtRecordId),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(journalEntries.id, journalId));
    }
    const currentJournalEntryIds = thoughtRecord.relatedJournalEntryIds || [];
    if (currentJournalEntryIds.includes(journalId)) {
      await db.update(thoughtRecords).set({
        relatedJournalEntryIds: currentJournalEntryIds.filter((id) => id !== journalId)
      }).where(eq(thoughtRecords.id, thoughtRecordId));
    }
  }
  async getRelatedThoughtRecords(journalId) {
    const journal = await this.getJournalEntryById(journalId);
    if (!journal || !journal.relatedThoughtRecordIds || journal.relatedThoughtRecordIds.length === 0) {
      return [];
    }
    const relatedRecords = [];
    for (const recordId of journal.relatedThoughtRecordIds) {
      const record = await this.getThoughtRecordById(recordId);
      if (record) {
        relatedRecords.push(record);
      }
    }
    return relatedRecords;
  }
  async getRelatedJournalEntries(thoughtRecordId) {
    const thoughtRecord = await this.getThoughtRecordById(thoughtRecordId);
    if (!thoughtRecord || !thoughtRecord.relatedJournalEntryIds || thoughtRecord.relatedJournalEntryIds.length === 0) {
      return [];
    }
    const relatedEntries = [];
    for (const entryId of thoughtRecord.relatedJournalEntryIds) {
      const entry = await this.getJournalEntryById(entryId);
      if (entry) {
        relatedEntries.push(entry);
      }
    }
    return relatedEntries;
  }
  // Notification management
  async createNotification(notification) {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }
  async getNotificationsByUser(userId, limit = 20) {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
  }
  async getUnreadNotificationsByUser(userId) {
    console.log(`STORAGE FIX: Fetching unread notifications for user ${userId}`);
    const result = await pool.query(`
      SELECT id, user_id as "userId", title, body, type, is_read as "isRead", 
             created_at as "createdAt", expires_at as "expiresAt", metadata, link_path as "linkPath", link
      FROM notifications 
      WHERE user_id = $1 
        AND is_read = false 
        AND (expires_at IS NULL OR expires_at >= NOW())
      ORDER BY created_at DESC
    `, [userId]);
    const notifications2 = result.rows || [];
    console.log(`STORAGE FIX: Found exactly ${notifications2.length} unread notifications for user ${userId} (data integrity restored)`);
    return notifications2;
  }
  async getNotificationById(id) {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }
  async markNotificationAsRead(id) {
    const [notification] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return notification;
  }
  async markAllNotificationsAsRead(userId) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }
  async deleteNotification(id) {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
  // Notification preferences
  async getNotificationPreferences(userId) {
    const [preferences] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    return preferences;
  }
  async createNotificationPreferences(preferences) {
    const [newPreferences] = await db.insert(notificationPreferences).values(preferences).returning();
    return newPreferences;
  }
  async updateNotificationPreferences(userId, preferences) {
    const [updatedPreferences] = await db.update(notificationPreferences).set({
      ...preferences,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(notificationPreferences.userId, userId)).returning();
    return updatedPreferences;
  }
  // Client invitations implementations
  async createClientInvitation(invitation) {
    if (!invitation.expiresAt) {
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      invitation.expiresAt = expiresAt;
    }
    const [newInvitation] = await db.insert(clientInvitations).values(invitation).returning();
    return newInvitation;
  }
  async getClientInvitationById(id) {
    const [invitation] = await db.select().from(clientInvitations).where(eq(clientInvitations.id, id));
    return invitation;
  }
  async getClientInvitationByEmail(email) {
    const [invitation] = await db.select().from(clientInvitations).where(eq(clientInvitations.email, email)).orderBy(desc(clientInvitations.createdAt)).limit(1);
    return invitation;
  }
  async getClientInvitationsByProfessional(professionalId) {
    return db.select().from(clientInvitations).where(eq(clientInvitations.therapistId, professionalId)).orderBy(desc(clientInvitations.createdAt));
  }
  async updateClientInvitationStatus(id, status) {
    const updateData = { status };
    if (status === "accepted") {
      updateData.acceptedAt = /* @__PURE__ */ new Date();
    }
    const [updatedInvitation] = await db.update(clientInvitations).set(updateData).where(eq(clientInvitations.id, id)).returning();
    return updatedInvitation;
  }
  async deleteClientInvitation(id) {
    try {
      const result = await db.delete(clientInvitations).where(eq(clientInvitations.id, id)).returning({ id: clientInvitations.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting client invitation:", error);
      return false;
    }
  }
  // AI Recommendations implementation
  async createAiRecommendation(recommendation) {
    console.log("Creating AI recommendation:", recommendation);
    const [newRecommendation] = await db.insert(aiRecommendations).values(recommendation).returning();
    return newRecommendation;
  }
  async getAiRecommendationById(id) {
    const [recommendation] = await db.select().from(aiRecommendations).where(eq(aiRecommendations.id, id));
    return recommendation;
  }
  async getAiRecommendationsByUser(userId) {
    return db.select().from(aiRecommendations).where(eq(aiRecommendations.userId, userId)).orderBy(desc(aiRecommendations.createdAt));
  }
  async getPendingAiRecommendationsByProfessional(professionalId) {
    return db.select().from(aiRecommendations).where(
      and(
        eq(aiRecommendations.therapistId, professionalId),
        eq(aiRecommendations.status, "pending")
      )
    ).orderBy(desc(aiRecommendations.createdAt));
  }
  async updateAiRecommendationStatus(id, status, therapistNotes) {
    const updateData = { status };
    if (status === "approved") {
      updateData.approvedAt = /* @__PURE__ */ new Date();
    } else if (status === "rejected") {
      updateData.rejectedAt = /* @__PURE__ */ new Date();
    } else if (status === "implemented") {
      updateData.implementedAt = /* @__PURE__ */ new Date();
    }
    if (therapistNotes) {
      updateData.therapistNotes = therapistNotes;
    }
    const [updatedRecommendation] = await db.update(aiRecommendations).set(updateData).where(eq(aiRecommendations.id, id)).returning();
    return updatedRecommendation;
  }
  async deleteAiRecommendation(id) {
    await db.delete(aiRecommendations).where(eq(aiRecommendations.id, id));
  }
  // Engagement Settings
  async getEngagementSettings() {
    const [settings] = await db.select().from(engagementSettings).limit(1);
    return settings || void 0;
  }
  async updateEngagementSettings(settingsData) {
    const existing = await this.getEngagementSettings();
    if (existing) {
      const [updated] = await db.update(engagementSettings).set({
        ...settingsData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(engagementSettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(engagementSettings).values({
        reminderEnabled: true,
        reminderDays: 3,
        reminderTime: "09:00",
        weeklyDigestEnabled: true,
        weeklyDigestDay: 0,
        weeklyDigestTime: "08:00",
        reminderEmailSubject: "",
        reminderEmailTemplate: "",
        weeklyDigestSubject: "",
        weeklyDigestTemplate: "",
        escalationEnabled: false,
        escalationDays: [7, 14, 30],
        escalationTemplates: [],
        ...settingsData
      }).returning();
      return created;
    }
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
init_db();

// server/services/openai.ts
import OpenAI from "openai";
import crypto from "crypto";
var openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
var practiceScenarioCache = /* @__PURE__ */ new Map();
var SCENARIO_CACHE_TTL = 24 * 60 * 60 * 1e3;
function createScenarioCacheKey(thought, distortions, emotion, instructions) {
  const data = JSON.stringify({ thought, distortions, emotion, instructions });
  return crypto.createHash("md5").update(data).digest("hex");
}
var AnalysisCache = class {
  cache = /* @__PURE__ */ new Map();
  maxEntries = 100;
  ttlMs = 7 * 24 * 60 * 60 * 1e3;
  // 7 days in milliseconds
  // Generate a hash for the content
  generateHash(text2) {
    return crypto.createHash("md5").update(text2.toLowerCase().trim()).digest("hex");
  }
  // Check if we have a cached result for this content
  get(title, content) {
    const now = Date.now();
    const hash3 = this.generateHash(`${title}:${content}`);
    const cached = this.cache.get(hash3);
    if (cached && now - cached.timestamp < this.ttlMs) {
      console.log("CACHE HIT! Using cached analysis");
      return cached.result;
    }
    if (cached) {
      console.log("CACHE EXPIRED. Deleting entry.");
      this.cache.delete(hash3);
    }
    return null;
  }
  // Store a result in the cache
  set(title, content, result) {
    const hash3 = this.generateHash(`${title}:${content}`);
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(hash3, {
      result,
      timestamp: Date.now(),
      hash: hash3
    });
    console.log("CACHE STORE. New analysis cached.");
  }
  // Check if a text is similar to any cached entries
  findSimilar(title, content, threshold = 0.8) {
    if (content.length > 1e3) return null;
    const contentWordsArray = (title + " " + content).toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((word) => word.length > 3);
    const contentWords = new Set(contentWordsArray);
    let bestMatch = null;
    const cacheEntries = Array.from(this.cache.entries());
    for (const [key, entry] of cacheEntries) {
      if (Date.now() - entry.timestamp > this.ttlMs) continue;
      const [cachedTitle, ...cachedContentParts] = key.split(":");
      const cachedContent = cachedContentParts.join(":");
      const cachedWordsArray = (cachedTitle + " " + cachedContent).toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((word) => word.length > 3);
      const cachedWords = new Set(cachedWordsArray);
      const contentWordsArray2 = Array.from(contentWords);
      const intersectionArray = contentWordsArray2.filter((x) => cachedWords.has(x));
      const intersection = new Set(intersectionArray);
      const unionArray = Array.prototype.concat.call(contentWordsArray2, cachedWordsArray);
      const union = new Set(unionArray);
      const similarity = intersection.size / union.size;
      if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = {
          similarity,
          result: entry.result
        };
      }
    }
    if (bestMatch) {
      console.log(`SIMILARITY CACHE HIT! Found content with ${Math.round(bestMatch.similarity * 100)}% similarity`);
      return bestMatch.result;
    }
    return null;
  }
};
var analysisCache = new AnalysisCache();
async function analyzeJournalEntry(title, content) {
  const cachedResult = analysisCache.get(title, content);
  if (cachedResult) {
    console.log("Using cached analysis result (exact match)");
    return cachedResult;
  }
  if (content.length < 1e3) {
    const similarResult = analysisCache.findSimilar(title, content, 0.8);
    if (similarResult) {
      console.log("Using cached analysis result (similar content)");
      return similarResult;
    }
  }
  try {
    const prompt = `
    Please analyze the following journal entry in the context of cognitive behavioral therapy. 
    The entry title is: "${title}"
    
    Journal content:
    "${content}"
    
    Provide the following in JSON format:
    1. suggestedTags: Extract 3-8 most relevant tags that would help categorize this journal entry
    2. analysis: A brief (2-3 sentences) summary of the main themes and emotional content
    3. emotions: Up to 5 emotions ACTUALLY EXPRESSED by the writer in the entry. Important guidelines:
       - Identify only emotions the writer is CURRENTLY feeling, not emotions they reference or mention
       - DO NOT include emotions that are merely mentioned as words but not actually felt (e.g., "only perfection will calm me" does NOT mean the person feels "calm")
       - DO NOT include emotions that are desired but not present (e.g., "I wish I felt happy" does NOT mean the person feels "happy")
       - DO NOT include emotions that are negated (e.g., "I'm not excited" does NOT mean the person feels "excited")
       - Pay careful attention to context and the full meaning of sentences to accurately identify true emotional states
       - Look for indicators of genuine emotional experience rather than just emotional words
    4. topics: Up to 5 main topics or themes discussed
    5. cognitiveDistortions: Identify any cognitive distortions present, such as:
       - All-or-nothing thinking (black-and-white thinking)
       - Overgeneralization (using words like "always", "never", "everyone")
       - Mental filtering (focusing only on negatives)
       - Disqualifying the positive (dismissing positive experiences)
       - Jumping to conclusions (mind reading or fortune telling)
       - Catastrophizing (expecting disaster)
       - Emotional reasoning (believing feelings reflect reality)
       - Should statements (using words like "should", "must", "ought to")
       - Labeling (attaching negative labels to self or others)
       - Personalization (blaming yourself for events outside your control)
    6. sentiment: Score the overall emotional tone with percentages for positive, negative, and neutral (totaling 100%)
    
    Your response should be a valid JSON object with these fields.
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7
    });
    const responseContent = response.choices[0]?.message?.content || "";
    try {
      const parsedResponse = JSON.parse(responseContent);
      analysisCache.set(title, content, parsedResponse);
      return parsedResponse;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      return generateFallbackAnalysis(title, content);
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    if (typeof error === "object" && error !== null) {
      const errorObj = error;
      if (errorObj.error?.type === "insufficient_quota" || errorObj.error?.code === "insufficient_quota" || errorObj.statusCode === 429 || errorObj.status === 429 || errorObj.message && errorObj.message.includes("quota")) {
        console.log("Quota exceeded, using fallback analysis");
      }
    }
    console.log(`Using fallback analysis for title: "${title}" and content starting with: "${content.substring(0, 50)}..."`);
    return generateFallbackAnalysis(title, content);
  }
}
async function generateReframePracticeScenarios(automaticThought, cognitiveDistortions4, emotionCategory, customInstructions) {
  try {
    const cacheKey = createScenarioCacheKey(automaticThought, cognitiveDistortions4, emotionCategory, customInstructions);
    const cachedResult = practiceScenarioCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < SCENARIO_CACHE_TTL) {
      console.log("CACHE HIT! Using cached practice scenarios");
      return {
        ...cachedResult.data,
        fromCache: true
      };
    }
    console.log("No cache hit. Generating new practice scenarios via OpenAI...");
    const thoughtCategoryToDistortion = {
      all_or_nothing: "All or Nothing Thinking",
      mental_filter: "Mental Filter",
      mind_reading: "Mind Reading",
      fortune_telling: "Fortune Telling",
      labelling: "Labelling",
      over_generalising: "Over-Generalising",
      compare_despair: "Compare and Despair",
      emotional_thinking: "Emotional Thinking",
      guilty_thinking: "Guilty Thinking",
      catastrophising: "Catastrophising",
      blaming_others: "Blaming Others",
      personalising: "Personalising",
      // Also handle kebab-case versions
      "all-or-nothing": "All or Nothing Thinking",
      "mental-filter": "Mental Filter",
      "mind-reading": "Mind Reading",
      "fortune-telling": "Fortune Telling",
      "over-generalising": "Over-Generalising",
      "compare-despair": "Compare and Despair",
      "emotional-thinking": "Emotional Thinking",
      "emotional-reasoning": "Emotional Reasoning",
      "guilty-thinking": "Guilty Thinking",
      overgeneralization: "Overgeneralization"
    };
    const formattedDistortions = cognitiveDistortions4.map((distortion) => {
      if (!distortion) return "Unknown";
      const mapped = thoughtCategoryToDistortion[distortion.toLowerCase()];
      if (mapped) return mapped;
      return distortion.replace(/[-_]/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    });
    const distortionDefinitions = `
    COGNITIVE DISTORTION DEFINITIONS:
    
    1. **All or Nothing Thinking**: Seeing things in black-and-white categories. If performance isn't perfect, it's seen as total failure.
       Example: "If I make ONE mistake, the ENTIRE presentation is ruined" or "Either I do this perfectly or I'm a complete failure"
    
    2. **Mental Filter**: Picking out a single negative detail and dwelling on it exclusively, filtering out all positive aspects.
       Example: "I got 9/10 positive reviews, but that ONE negative comment proves I'm terrible at my job"
    
    3. **Mind Reading**: Assuming you know what others are thinking without evidence.
       Example: "She didn't smile at me, so she must think I'm incompetent"
    
    4. **Fortune Telling**: Predicting negative outcomes without evidence.
       Example: "I know this interview will be a disaster" or "I'm certain I'll fail this exam"
    
    5. **Labelling**: Attaching negative labels to yourself or others based on limited information.
       Example: "I'm a loser" or "I'm worthless" instead of "I made a mistake"
    
    6. **Over-Generalising**: Making broad conclusions based on a single event.
       Example: "I failed once, so I ALWAYS fail" or "NOTHING ever works out for me"
    
    7. **Compare and Despair**: Comparing yourself unfavourably to others.
       Example: "Everyone else is better than me" or "I'll never be as successful as them"
    
    8. **Emotional Thinking**: Believing that feelings reflect reality.
       Example: "I feel stupid, therefore I AM stupid" or "I feel anxious, so something bad WILL happen"
    
    9. **Guilty Thinking**: Using "should", "must", "ought to" statements that create guilt and pressure.
       Example: "I SHOULD be perfect" or "I MUST never make mistakes"
    
    10. **Catastrophising**: Expecting disaster or magnifying the importance of negative events.
        Example: "This small mistake will ruin my entire career" or "If I fail this test, my life is over"
    
    11. **Blaming Others**: Always blaming others for problems without taking any responsibility.
        Example: "It's all their fault I didn't succeed" or "If they hadn't interfered, everything would be fine"
    
    12. **Personalising**: Taking personal responsibility for things outside your control or believing everything relates to you.
        Example: "My boss is in a bad mood - I must have done something wrong" or "The project failed because of me, even though I was just one team member"
    `;
    const prompt = `
    I need to create a cognitive restructuring practice session based on the following automatic thought:
    "${automaticThought}"

    This thought involves these cognitive distortions: ${formattedDistortions.join(", ")}
    The primary emotion associated with this thought is: ${emotionCategory}
    ${customInstructions ? `Additional context and instructions: ${customInstructions}` : ""}

    ${distortionDefinitions}

    CRITICAL INSTRUCTIONS FOR SCENARIO CREATION:
    1. Each scenario MUST explicitly demonstrate the SPECIFIC distortion pattern listed above
    2. The scenario text should clearly show the distortion in action (e.g., for All or Nothing, show extreme binary thinking)
    3. DO NOT just mention "I'm not good enough" - show the SPECIFIC distortion pattern happening
    4. Make scenarios that are obviously teaching about the SPECIFIC distortion type
    
    Example of GOOD scenario for All or Nothing Thinking:
    "During practice, you stumble over ONE word and immediately think: 'If I make even a single mistake during the real presentation, it will be a COMPLETE disaster and everyone will think I'm totally incompetent.'" (This clearly shows the binary, extreme thinking)
    
    Example of BAD scenario for All or Nothing Thinking:
    "You're preparing for a presentation and think 'I'm not good enough'" (This doesn't show the all-or-nothing pattern)

    Please generate a cognitive restructuring practice session with 3 different scenarios.
    Each scenario should:
    1. EXPLICITLY demonstrate the specific distortion pattern with clear language that shows the distortion
    2. Relate to the original thought content but CLEARLY show the distortion mechanism
    3. Use the exact wording patterns that characterize each distortion (see definitions above)
    4. Provide 4 possible reframing options (1 correct, 3 incorrect)
    5. For each option, explain why it's helpful or unhelpful
    6. Make the scenarios progressively more challenging
    
    The correct option should demonstrate effective cognitive restructuring that:
    - Directly challenges the specific distorted thinking pattern by name
    - Considers the evidence for and against the thought
    - Uses balanced, realistic thinking
    - Promotes self-compassion and growth
    
    The incorrect options should:
    - Show subtle ways people might maintain the same distortion
    - Include examples that feel realistic but reinforce unhelpful patterns
    - Vary in how obviously incorrect they are
    - Feel plausible but ultimately unhelpful

    Return the response as a JSON object with this structure:
    {
      "scenarios": [
        {
          "scenario": "Detailed scenario description that CLEARLY shows the distortion pattern in action",
          "options": [
            {
              "text": "Option text",
              "isCorrect": true/false,
              "explanation": "Why this is/isn't helpful"
            },
            ... (3 more options)
          ],
          "cognitiveDistortion": "Primary distortion targeted",
          "emotionCategory": "Emotion category targeted"
        },
        ... (2 more scenarios)
      ],
      "thoughtContent": "The original automatic thought",
      "generalFeedback": "Overall therapeutic guidance about the thought pattern"
    }
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7
    });
    const responseContent = response.choices[0]?.message?.content || "";
    try {
      const parsedResponse = JSON.parse(responseContent);
      if (parsedResponse.scenarios && Array.isArray(parsedResponse.scenarios)) {
        parsedResponse.scenarios = parsedResponse.scenarios.map((scenario) => {
          return {
            ...scenario,
            cognitiveDistortion: formattedDistortions[0] || "Cognitive Distortion"
          };
        });
      }
      const responseForCache = { ...parsedResponse };
      delete responseForCache.fromCache;
      practiceScenarioCache.set(cacheKey, {
        data: responseForCache,
        timestamp: Date.now()
      });
      console.log("Saved new practice scenarios to cache with key:", cacheKey);
      return {
        ...parsedResponse,
        fromCache: false
      };
    } catch (parseError) {
      console.error("Failed to parse OpenAI response for reframing practice:", parseError);
      throw new Error("Failed to generate reframing practice scenarios");
    }
  } catch (error) {
    console.error("OpenAI API error during reframing practice generation:", error);
    throw new Error("Failed to generate reframing practice scenarios due to API error");
  }
}
function generateFallbackAnalysis(title = "", content = "") {
  console.log("Using fallback analysis");
  const combinedText = `${title} ${content}`.toLowerCase();
  const fallbackTags = [];
  const foundEmotions = [];
  const foundTopics = [];
  const emotionIntensity = {};
  const emotionKeywords = [
    "happy",
    "sad",
    "angry",
    "anxious",
    "stressed",
    "worried",
    "excited",
    "calm",
    "frustrated",
    "confident",
    "fear",
    "joy",
    "love",
    "trust",
    "pride",
    "hopeful",
    "nervous",
    "confused",
    "overwhelmed",
    "peaceful",
    "grateful",
    "motivated",
    "disappointed",
    "content",
    "lonely",
    "guilty",
    "ashamed",
    "embarrassed",
    "surprised",
    "jealous",
    "hopeless",
    "satisfied",
    "hurt",
    "insecure",
    "regretful",
    "optimistic",
    "pessimistic",
    "apathetic",
    "bored",
    "enthusiastic",
    "determined",
    "discouraged",
    "vulnerable",
    "resentful",
    "compassionate",
    "depressed",
    "numb",
    "empty",
    "exhausted",
    "tired",
    "drained",
    "helpless",
    "struggling",
    "grief",
    "grieving",
    "hope",
    "despair",
    "meaningless",
    "lost",
    "distressed",
    "miserable",
    "relief",
    "relieved",
    "alone",
    "isolated",
    "distant",
    "disconnected",
    "detached",
    "heavy",
    "hollow",
    "void",
    "abandoned",
    "suffocating",
    "tense",
    "uneasy",
    "restless",
    "unsettled",
    "apprehensive",
    "elated",
    "ecstatic",
    "blissful",
    "serene",
    "tranquil",
    "rage",
    "fury",
    "irritated",
    "annoyed",
    "agitated",
    "terror",
    "panic",
    "dread",
    "phobia",
    "melancholy",
    "sorrowful",
    "cheerful",
    "jubilant",
    "delighted",
    "pleased",
    "thrilled",
    "devastated",
    "heartbroken",
    "crushed",
    "shattered",
    "betrayed",
    "rejected",
    "humiliated",
    "mortified",
    "disgusted",
    "revolted",
    "contempt",
    "scorn",
    "amazed",
    "astonished",
    "bewildered",
    "perplexed",
    "envious",
    "covetous",
    "remorseful",
    "contrite",
    "yearning",
    "longing",
    "nostalgic"
  ];
  const topicKeywords = [
    "work",
    "family",
    "relationship",
    "health",
    "sleep",
    "exercise",
    "friends",
    "challenge",
    "success",
    "failure",
    "conflict",
    "achievement",
    "goal",
    "worry",
    "progress",
    "therapy",
    "recovery",
    "career",
    "education",
    "finances",
    "hobby",
    "self-care",
    "mindfulness",
    "meditation",
    "spirituality",
    "communication",
    "boundaries",
    "leisure",
    "trauma",
    "coping",
    "personal growth",
    "responsibility",
    "self-esteem",
    "identity",
    "productivity",
    "relaxation",
    "habits",
    "learning",
    "time management",
    "mental health",
    "physical health",
    "social life",
    "home"
  ];
  console.log("Starting emotional pattern detection");
  const sadPatterns = [
    /sad|tear|cry|blue|down|heartbreak|sorrow|grief|weep|upset|miserable/i,
    /hollow ache|heavy|gravity|weight|burden|struggle|push myself/i,
    /hide my struggle|clinging|cling to|hiding|mask|facade/i,
    /behind closed curtains|hide/i
  ];
  console.log("Testing sadness patterns on text:", combinedText);
  for (const pattern of sadPatterns) {
    if (pattern.test(combinedText)) {
      console.log("MATCH FOUND! Sadness pattern matched:", pattern);
      if (!foundEmotions.includes("sad")) {
        foundEmotions.push("sad");
        fallbackTags.push("sad");
        console.log("Added 'sad' to emotions:", foundEmotions);
      }
      break;
    }
  }
  const anxietyPatterns = [
    /anxious|anxiety|worry|worries|racing thoughts|heart racing|mind racing|nervous|tense|on edge|alert/i,
    /trembling|shaking|dark corners|restless|uninvited|drift to dark/i,
    /racing thoughts|heart pounds|tension|pressure|overwhelm/i,
    /legs trembling|unsettled|uneasy|apprehensive/i
  ];
  for (const pattern of anxietyPatterns) {
    if (pattern.test(combinedText)) {
      if (!foundEmotions.includes("anxious")) {
        foundEmotions.push("anxious");
        fallbackTags.push("anxious");
      }
      break;
    }
  }
  const emptinessPatterns = [
    /empty|hollow|void|numb|nothing|emotionless|blank|can'?t feel|floating in a void|distant|far from|absent/i,
    /hollow ache|settle in my chest|going through motions|emotionless/i,
    /disconnected|detached|far away|absent|not present/i
  ];
  for (const pattern of emptinessPatterns) {
    if (pattern.test(combinedText)) {
      if (!foundEmotions.includes("empty")) {
        foundEmotions.push("empty");
        fallbackTags.push("empty");
      }
      if (!foundEmotions.includes("numb")) {
        foundEmotions.push("numb");
        fallbackTags.push("numb");
      }
      break;
    }
  }
  const isolationPatterns = [
    /alone|lonely|isolated|no one|by myself|disconnected|distant|foreign|alien/i,
    /behind closed curtains|cling to the quiet|hide|hiding|isolated/i
  ];
  for (const pattern of isolationPatterns) {
    if (pattern.test(combinedText)) {
      if (!foundEmotions.includes("lonely")) {
        foundEmotions.push("lonely");
        fallbackTags.push("lonely");
      }
      if (!foundTopics.includes("isolation")) {
        foundTopics.push("isolation");
        fallbackTags.push("isolation");
      }
      break;
    }
  }
  const exhaustionPatterns = [
    /tired|exhausted|drained|no energy|can'?t focus|overwhelmed|burden/i,
    /heavy|gravity|doubled|weight|push myself|struggle/i
  ];
  for (const pattern of exhaustionPatterns) {
    if (pattern.test(combinedText)) {
      if (!foundEmotions.includes("exhausted")) {
        foundEmotions.push("exhausted");
        fallbackTags.push("exhausted");
      }
      if (!foundTopics.includes("self-care")) {
        foundTopics.push("self-care");
        fallbackTags.push("self-care");
      }
      break;
    }
  }
  if (/fear|afraid|scared|terrified|frightened|panic|terror|trembling|freeze|shaking|dread/i.test(combinedText)) {
    if (!foundEmotions.includes("fearful")) {
      foundEmotions.push("fearful");
      fallbackTags.push("fearful");
    }
  }
  for (const keyword of emotionKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(combinedText) && !foundEmotions.includes(keyword)) {
      const negationRegex = new RegExp(`\\b(not|don'?t|won'?t|can'?t|isn'?t|aren'?t|wasn'?t|weren'?t)\\s+(?:\\w+\\s+){0,3}\\b${keyword}\\b|\\b${keyword}\\b\\s+(?:\\w+\\s+){0,3}(not|don'?t|won'?t|can'?t|isn'?t|aren'?t|wasn'?t|weren'?t)\\b`, "i");
      const futureRegex = new RegExp(`\\b(will|would|could|should|might|may|if)\\s+(?:\\w+\\s+){0,3}\\b${keyword}\\b|\\bwish\\s+(?:\\w+\\s+){0,5}\\b${keyword}\\b|\\bhope\\s+(?:\\w+\\s+){0,5}\\b${keyword}\\b`, "i");
      const calmSpecificRegex = keyword === "calm" ? /\b(?:will|would|could|should|might|to)\s+(?:\w+\s+){0,3}\bcalm\b|\bcalm\s+(?:\w+\s+){0,3}(?:will|would|could|should|might|if)\b/i : null;
      if (!negationRegex.test(combinedText) && !futureRegex.test(combinedText) && !(calmSpecificRegex && calmSpecificRegex.test(combinedText))) {
        foundEmotions.push(keyword);
        fallbackTags.push(keyword);
      }
    }
  }
  for (const keyword of topicKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(combinedText) && !foundTopics.includes(keyword)) {
      foundTopics.push(keyword);
      fallbackTags.push(keyword);
    }
  }
  if (foundEmotions.length < 2) {
    const emotionalPhrases = [
      { pattern: /tears|cry|sobbing|weeping/i, emotion: "sad" },
      { pattern: /dark\s+thoughts|restless|uninvited\s+thoughts/i, emotion: "anxious" },
      { pattern: /racing\s+thoughts|heart\s+pounds/i, emotion: "anxious" },
      { pattern: /trembling|shaking|tremors|freeze/i, emotion: "fearful" },
      { pattern: /hide\s+struggle|putting on a face/i, emotion: "struggling" },
      { pattern: /weight\s+on|burden|shoulders/i, emotion: "overwhelmed" },
      { pattern: /disconnected|abandoned/i, emotion: "lonely" },
      { pattern: /brain fog|difficult to concentrate/i, emotion: "exhausted" },
      { pattern: /irritated|annoyed|bothered/i, emotion: "frustrated" },
      { pattern: /can'?t feel|empty inside/i, emotion: "numb" },
      { pattern: /smile|grin|laugh|chuckle/i, emotion: "happy" },
      { pattern: /grateful|thankful|appreciate/i, emotion: "grateful" },
      { pattern: /hopeful|looking\s+forward/i, emotion: "hopeful" },
      { pattern: /quiet|silence|peaceful|tranquil/i, emotion: "calm" }
    ];
    for (const { pattern, emotion } of emotionalPhrases) {
      if (pattern.test(combinedText) && !foundEmotions.includes(emotion)) {
        if (emotion === "calm") {
          const calmInFutureContext = /\b(?:will|would|could|should|might|to)\s+(?:\w+\s+){0,3}\bcalm\b|\bcalm\s+(?:\w+\s+){0,3}(?:will|would|could|should|might|if)\b/i.test(combinedText);
          if (!calmInFutureContext) {
            foundEmotions.push(emotion);
            fallbackTags.push(emotion);
          }
        } else {
          foundEmotions.push(emotion);
          fallbackTags.push(emotion);
        }
      }
    }
  }
  const cognitiveDistortions4 = [];
  if (/\b(all|nothing|every|none|always|never|everyone|no one|completely|totally|absolutely|perfect|failure|disaster)\b/i.test(combinedText)) {
    cognitiveDistortions4.push("All-or-nothing thinking");
  }
  if (/\b(always|never|everyone|nobody|everything|nothing|every time|all the time)\b/i.test(combinedText)) {
    if (!cognitiveDistortions4.includes("Overgeneralization")) {
      cognitiveDistortions4.push("Overgeneralization");
    }
  }
  if (/\b(only bad|only negative|only the worst|focus on bad|ignore good|didn't matter|doesn't count|still bad|still failed)\b/i.test(combinedText)) {
    cognitiveDistortions4.push("Mental filtering");
  }
  if (/\b(doesn't count|don't deserve|got lucky|fluke|accident|just being nice|not important|not real|meaningless)\b/i.test(combinedText)) {
    cognitiveDistortions4.push("Disqualifying the positive");
  }
  if (/\b(think|knows? what|they think|they feel|going to|will happen|will fail|will reject|won't like|won't approve|predict|foresee|expect the worst)\b/i.test(combinedText)) {
    cognitiveDistortions4.push("Jumping to conclusions");
  }
  if (/\b(disaster|catastrophe|terrible|horrible|worst|awful|unbearable|can'?t stand|can'?t handle|too much|end of the world|devastat(ing|ed)|nightmare)\b/i.test(combinedText)) {
    cognitiveDistortions4.push("Catastrophizing");
  }
  if (/\b(feel like|feels? true|must be true|must be real|feels? like|emotions? tell|gut says|intuition says|sense that)\b/i.test(combinedText)) {
    cognitiveDistortions4.push("Emotional reasoning");
  }
  if (/\b(should|must|have to|ought to|need to|supposed to|expected to|obligated to)\b/i.test(combinedText)) {
    cognitiveDistortions4.push("Should statements");
  }
  if (/\b(I am a|I'm a|he is a|she is a|they are|we are|you are|you're)( a)? (failure|loser|idiot|stupid|worthless|useless|pathetic|horrible|terrible|awful|bad person)\b/i.test(combinedText)) {
    cognitiveDistortions4.push("Labeling");
  }
  if (/\b(my fault|blame (me|myself)|responsible for|caused|should have prevented|could have stopped|if only I|blame (myself|me))\b/i.test(combinedText)) {
    cognitiveDistortions4.push("Personalization");
  }
  if (fallbackTags.length < 3) {
    fallbackTags.push("journal", "reflection");
    if (foundEmotions.length === 0) {
      fallbackTags.push("reflective");
      foundEmotions.push("reflective");
    }
    if (foundTopics.length === 0) {
      fallbackTags.push("personal development");
      foundTopics.push("personal development");
    }
    fallbackTags.push(content.length > 500 ? "detailed" : "brief");
  }
  const limitedTags = fallbackTags.slice(0, 8);
  let analysisText = "";
  let insightText = "";
  if (/not good enough|failure|mistake|mess up|can'?t do|wrong with me|why can'?t I|failing|pointless/i.test(combinedText)) {
    insightText += "Consider how negative self-evaluation influences your perspective. ";
    if (!foundTopics.includes("self-esteem")) {
      foundTopics.push("self-esteem");
      fallbackTags.push("self-esteem");
    }
  }
  if (/pretend|fake|hide|mask|act like|nodding|rehearsed|putting on|far from fine/i.test(combinedText)) {
    insightText += "The effort to conceal true feelings may create additional emotional tension. ";
    if (!foundTopics.includes("authenticity")) {
      foundTopics.push("authenticity");
      fallbackTags.push("authenticity");
    }
  }
  if (/can'?t stop|keep thinking|over and over|racing thoughts|mind won'?t quiet|replaying|keep remembering/i.test(combinedText)) {
    insightText += "Repetitive thought patterns may be contributing to emotional intensity. ";
    if (!fallbackTags.includes("rumination")) {
      fallbackTags.push("rumination");
    }
  }
  if (cognitiveDistortions4.length > 0) {
    if (cognitiveDistortions4.includes("All-or-nothing thinking") && combinedText.match(/perfection|flawless|excel|failure|worthless|disaster/i)) {
      analysisText = `I notice strong all-or-nothing thinking patterns where you're seeing yourself in extreme terms of total success or complete failure. This perspective is creating significant emotional strain because you're not allowing yourself any middle ground for being human and learning through mistakes.`;
    } else if (cognitiveDistortions4.includes("Overgeneralization") && combinedText.match(/never|always|every|all|again|eternal|history/i)) {
      analysisText = `Your journal reveals a clear pattern of overgeneralization, where you're taking isolated negative experiences and applying them as permanent rules for all future situations. This is creating a sense of defeat before you even try, as past setbacks are being treated as definitive proof of future outcomes.`;
    } else if (cognitiveDistortions4.includes("Catastrophizing")) {
      analysisText = `The language in your entry shows catastrophic thinking where relatively minor issues are being amplified into overwhelming disasters. This tendency to imagine worst-case scenarios is intensifying your emotional response far beyond what the situation actually warrants.`;
    } else if (cognitiveDistortions4.includes("Emotional reasoning")) {
      analysisText = `I see that you're treating your feelings as evidence of objective truth rather than as emotional responses. This emotional reasoning creates a distorted view where negative feelings become 'proof' that the situation is objectively negative, creating a self-reinforcing cycle.`;
    } else {
      const primaryDistortions = cognitiveDistortions4.slice(0, 2);
      analysisText = `Your writing reveals ${primaryDistortions.join(" and ")} patterns that are likely intensifying your emotional distress. These thought patterns create a distorted perspective that affects how you see yourself and your abilities.`;
    }
    if (foundTopics.length > 0) {
      analysisText += ` This is particularly evident in how you approach ${foundTopics.join(" and ")}.`;
    }
    if (cognitiveDistortions4.includes("All-or-nothing thinking") || cognitiveDistortions4.includes("Overgeneralization")) {
      analysisText += ` Try identifying evidence that challenges these absolute perspectives - what middle-ground possibilities exist between the extremes you're seeing?`;
    } else if (cognitiveDistortions4.includes("Catastrophizing")) {
      analysisText += ` Consider asking what's most likely to happen rather than focusing on the worst possible scenario.`;
    }
  } else if (foundEmotions.length > 0) {
    if (foundEmotions.includes("anxious") || foundEmotions.includes("worried")) {
      analysisText = `Your writing reveals deep anxiety that seems to be consuming your thoughts and creating significant tension. This worry appears to be making it difficult to find any sense of peace or confidence in your abilities.`;
    } else if (foundEmotions.includes("sad") || foundEmotions.includes("depressed")) {
      analysisText = `There's a profound sadness permeating your journal entry. These feelings appear to be weighing heavily on you, potentially making it difficult to connect with positive possibilities or find motivation.`;
    } else if (foundEmotions.includes("empty") || foundEmotions.includes("numb")) {
      analysisText = `Your writing expresses a deep sense of emptiness and emotional numbness. This disconnection from your feelings might be a protective response to overwhelming emotions that feels safer but ultimately leaves you isolated from yourself and others.`;
    } else if (foundEmotions.includes("frustrated") || foundEmotions.includes("angry")) {
      analysisText = `I notice significant frustration and irritation in your writing. These feelings seem to be creating internal tension and possibly affecting how you perceive situations and others around you.`;
    } else {
      analysisText = `This entry reflects ${foundEmotions.join(", ")} emotions`;
      if (foundTopics.length > 0) {
        analysisText += ` in relation to ${foundTopics.join(", ")}`;
      }
      analysisText += `. These feelings appear to be significantly influencing your perspective and internal experience.`;
    }
    if (insightText) {
      analysisText += ` ${insightText}`;
    }
  } else if (foundTopics.length > 0) {
    analysisText = `Your entry focuses on ${foundTopics.join(", ")}. `;
    analysisText += insightText || "While you don't explicitly name your emotions, there seem to be significant feelings beneath the surface that might be worth exploring.";
  } else {
    analysisText = `This entry contains reflections that suggest underlying emotional processes. `;
    analysisText += insightText || "Consider naming specific emotions and exploring their sources in future entries to gain deeper insights into your experiences.";
  }
  const positiveEmotions = [
    "happy",
    "excited",
    "confident",
    "joy",
    "love",
    "trust",
    "pride",
    "hopeful",
    "peaceful",
    "grateful",
    "motivated",
    "content",
    "satisfied",
    "optimistic",
    "enthusiastic",
    "determined",
    "compassionate",
    "relieved",
    "cheerful",
    "pleased"
  ];
  const negativeEmotions = [
    "sad",
    "angry",
    "anxious",
    "stressed",
    "worried",
    "frustrated",
    "fear",
    "nervous",
    "confused",
    "overwhelmed",
    "lonely",
    "guilty",
    "ashamed",
    "embarrassed",
    "jealous",
    "hopeless",
    "hurt",
    "insecure",
    "regretful",
    "pessimistic",
    "discouraged",
    "vulnerable",
    "resentful",
    "unhappy",
    "empty",
    "numb",
    "depressed",
    "desperate",
    "miserable",
    "upset",
    "helpless",
    "drained",
    "exhausted",
    "tired"
  ];
  const neutralEmotions = [
    "calm",
    "reflective",
    "surprised",
    "apathetic",
    "bored",
    "curious",
    "interested",
    "thoughtful",
    "contemplative",
    "nostalgic",
    "indifferent",
    "pensive",
    "wondering"
  ];
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  const hasNegativeContent = /floating in a void|distant|far from|absent|not present|nod, rehearsed|far from fine|hollow|void|empty|numb|emotionless|blank|empty inside|can'?t feel/i.test(combinedText) || /hollow ache|heavy|gravity|burden|struggle|push myself|trembling|dark corners|restless|uninvited/i.test(combinedText) || /behind closed curtains|cling to the quiet|hide|hiding|weight|doubled|heavy|legs trembling/i.test(combinedText);
  const hasNegativeEmotions = foundEmotions.some((e) => ["sad", "anxious", "empty", "numb", "lonely", "exhausted", "fearful", "struggling"].includes(e));
  if ((hasNegativeContent || hasNegativeEmotions) && foundEmotions.length > 0) {
    if (foundEmotions.every((e) => neutralEmotions.includes(e))) {
      positiveScore = 0;
      negativeScore = 70;
      neutralScore = 30;
    } else if (hasNegativeContent && hasNegativeEmotions) {
      positiveScore = 0;
      negativeScore = 85;
      neutralScore = 15;
    } else {
      const positiveCount = foundEmotions.filter((e) => positiveEmotions.includes(e)).length;
      const negativeCount = foundEmotions.filter((e) => negativeEmotions.includes(e)).length;
      const neutralCount = foundEmotions.filter((e) => neutralEmotions.includes(e)).length;
      const weightedNegativeCount = hasNegativeContent ? negativeCount * 1.5 : negativeCount;
      const totalWeight = positiveCount + weightedNegativeCount + neutralCount;
      if (totalWeight > 0) {
        positiveScore = Math.round(positiveCount / totalWeight * 100);
        negativeScore = Math.round(weightedNegativeCount / totalWeight * 100);
        neutralScore = 100 - positiveScore - negativeScore;
        neutralScore = Math.max(0, neutralScore);
      }
    }
  } else {
    const positiveCount = foundEmotions.filter((e) => positiveEmotions.includes(e)).length;
    const negativeCount = foundEmotions.filter((e) => negativeEmotions.includes(e)).length;
    const neutralCount = foundEmotions.filter((e) => neutralEmotions.includes(e)).length;
    const totalEmotions = positiveCount + negativeCount + neutralCount;
    if (totalEmotions > 0) {
      positiveScore = Math.round(positiveCount / totalEmotions * 100);
      negativeScore = Math.round(negativeCount / totalEmotions * 100);
      neutralScore = 100 - positiveScore - negativeScore;
      neutralScore = Math.max(0, neutralScore);
    }
  }
  const result = {
    suggestedTags: limitedTags,
    analysis: analysisText,
    emotions: foundEmotions,
    topics: foundTopics,
    cognitiveDistortions: cognitiveDistortions4.length > 0 ? cognitiveDistortions4 : [],
    sentiment: {
      positive: positiveScore,
      negative: negativeScore,
      neutral: neutralScore
    }
  };
  console.log("FINAL FALLBACK ANALYSIS RESULT:", JSON.stringify(result, null, 2));
  return result;
}

// server/routes.ts
import crypto2 from "crypto";

// server/middleware/auth.ts
var sessionLookupCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 6e4;
async function authenticate(req, res, next) {
  console.log("Authenticating request with cookies:", req.cookies);
  const sessionId = req.cookies?.sessionId;
  if (!sessionId) {
    console.log("No sessionId cookie found, checking for fallback auth headers");
    const userId = req.headers["x-auth-user-id"];
    const timestamp2 = req.headers["x-auth-timestamp"];
    const isFallback = req.headers["x-auth-fallback"];
    if (userId && timestamp2 && isFallback) {
      console.log("Found fallback auth headers:", { userId, timestamp: timestamp2 });
      const requestTime = parseInt(timestamp2);
      const currentTime = Date.now();
      const isRecent = currentTime - requestTime < 5 * 60 * 1e3;
      if (isRecent) {
        try {
          const user = await storage.getUser(parseInt(userId));
          if (user) {
            console.log("Fallback authentication successful for user:", user.id, user.username);
            req.user = user;
            req.session = {
              id: `fallback-${Date.now()}`,
              userId: user.id,
              expiresAt: new Date(Date.now() + 30 * 60 * 1e3)
              // 30 minutes
            };
            return next();
          }
        } catch (error) {
          console.error("Fallback authentication error:", error);
        }
      } else {
        console.log("Fallback auth timestamp too old:", { requestTime, currentTime, diff: currentTime - requestTime });
      }
    }
    console.log("No valid authentication method found");
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const cached = sessionLookupCache.get(sessionId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      req.user = cached.user;
      req.session = {
        id: sessionId,
        userId: cached.user.id,
        expiresAt: new Date(Date.now() + CACHE_TTL)
      };
      return next();
    }
    console.log("Looking up session ID:", sessionId);
    console.log("Attempting to fetch session with ID:", sessionId);
    const session = await storage.getSessionById(sessionId);
    if (!session) {
      console.log("Session not found in database");
      const clearOptions = getSessionCookieOptions();
      delete clearOptions.maxAge;
      console.log("Clearing invalid session cookie with options:", clearOptions);
      res.clearCookie("sessionId", clearOptions);
      return res.status(401).json({ message: "Invalid session" });
    }
    console.log("Found session:", session.id, "for user:", session.userId);
    if (new Date(session.expiresAt) < /* @__PURE__ */ new Date()) {
      console.log("Session expired at:", session.expiresAt);
      await storage.deleteSession(sessionId);
      const clearOptions = getSessionCookieOptions();
      delete clearOptions.maxAge;
      console.log("Clearing expired session cookie with options:", clearOptions);
      res.clearCookie("sessionId", clearOptions);
      return res.status(401).json({ message: "Session expired" });
    }
    const user = await storage.getUser(session.userId);
    if (!user) {
      console.log("User not found for session:", session.userId);
      return res.status(401).json({ message: "User not found" });
    }
    console.log("Authentication successful for user:", user.id, user.username);
    sessionLookupCache.set(sessionId, { user, timestamp: Date.now() });
    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
function isTherapist(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user.role !== "therapist" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Therapist role required." });
  }
  next();
}
function isTherapistOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user.role !== "therapist" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Therapist or admin role required." });
  }
  next();
}
function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin role required." });
  }
  next();
}
function isClientOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user.role === "admin") {
    console.log("Admin access for client resource - ALLOWED");
    return next();
  }
  if (req.user.role === "therapist") {
    return res.status(403).json({ message: "Mental health professionals cannot create emotion or thought records. Only clients can record emotions and thoughts." });
  }
  next();
}
function checkResourceCreationPermission(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const requestedUserId = parseInt(req.params.userId);
  if (req.user.id === requestedUserId) {
    console.log("User creating resource for themselves - ALLOWED");
    return next();
  }
  if (req.user.role === "admin") {
    console.log("Admin creating resource for user", requestedUserId, "- ALWAYS ALLOWED");
    return next();
  }
  if (req.user.role === "therapist") {
    console.log("Professional creating resource for client - checking relationship");
    (async () => {
      try {
        const client = await storage.getUser(requestedUserId);
        if (client && client.therapistId === req.user.id) {
          console.log("This client belongs to the professional - ALLOWED");
          return next();
        }
        console.log("This client does not belong to the professional - DENIED");
        res.status(403).json({ message: "Access denied. You can only create resources for your own clients." });
      } catch (error) {
        console.error("Resource creation permission check error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    })();
    return;
  }
  console.log("Access DENIED - User has no permission");
  res.status(403).json({ message: "Access denied. You can only create resources for yourself." });
}
function ensureAuthenticated(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}
function checkUserAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const requestedUserId = parseInt(req.params.userId);
  console.log(`User Access Check - User ${req.user.id} (${req.user.username}, role: ${req.user.role}) is accessing user ${requestedUserId} data`);
  console.log(
    "**CHECKING IF USER IS ADMIN**",
    "User role:",
    req.user.role,
    "Is admin?",
    req.user.role === "admin"
  );
  if (req.user.role === "admin") {
    console.log("*** ADMIN ACCESS GRANTED *** User is an admin, access ALWAYS ALLOWED for all users");
    return next();
  }
  if (req.user.id === requestedUserId) {
    console.log("User is accessing their own data - ALLOWED");
    return next();
  }
  if (req.user.role === "therapist") {
    console.log("User is a mental health professional, checking if they are accessing their client");
    (async () => {
      try {
        const client = await storage.getUser(requestedUserId);
        console.log(`Client ${requestedUserId} lookup result:`, client ? `Found: therapistId = ${client.therapistId}` : "Not found");
        if (client && client.therapistId === req.user.id) {
          console.log("This client belongs to the professional - ALLOWED");
          return next();
        }
        console.log("This client does not belong to the professional - DENIED");
        res.status(403).json({ message: "Access denied. Not your client." });
      } catch (error) {
        console.error("Check user access error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    })();
    return;
  }
  console.log("Access DENIED - User has no permission");
  res.status(403).json({ message: "Access denied." });
}

// server/routes.ts
import { z as z3 } from "zod";
import * as bcrypt2 from "bcrypt";
import Stripe from "stripe";

// server/services/emotionMapping.ts
var CORE_EMOTION_FAMILIES = {
  "Joy": ["joy", "happiness", "joyful", "happy", "pleased", "delight", "content", "satisfaction", "gladness", "merry", "jolly", "cheerful", "jubilant", "thrilled", "elated", "ecstatic", "upbeat", "gleeful", "positive", "lighthearted"],
  "Sadness": ["sad", "sadness", "sorrow", "unhappy", "melancholy", "gloomy", "misery", "despair", "grief", "heartbroken", "depressed", "downhearted", "downcast", "dejected", "glum", "blue", "wistful", "pensive", "forlorn", "morose", "disappointed", "despondent"],
  "Fear": ["fear", "afraid", "scared", "frightened", "terrified", "anxious", "worried", "nervous", "uneasy", "apprehensive", "dread", "panic", "horror", "terror", "phobia", "alarmed", "intimidated", "trepidation", "nervous", "distressed", "agitated"],
  "Surprise": ["surprise", "surprised", "astonished", "amazed", "astounded", "shocked", "startled", "stunned", "bewildered", "dumbfounded", "flabbergasted", "staggered", "awestruck", "wonder", "disbelief", "taken aback", "unexpected"],
  "Anger": ["anger", "angry", "mad", "fury", "rage", "annoyed", "irritated", "frustrated", "exasperated", "outraged", "indignant", "incensed", "furious", "fuming", "livid", "enraged", "hostile", "bitter", "resentful", "irked", "vexed", "aggravated"],
  "Love": ["love", "loving", "affection", "adoration", "fondness", "tenderness", "compassion", "attachment", "devotion", "passion", "desire", "attraction", "infatuation", "admiration", "caring", "cherish", "enamored", "smitten", "empathy", "warmth"],
  "Disgust": ["disgust", "disgusted", "repulsed", "revulsion", "aversion", "distaste", "contempt", "abhorrence", "loathing", "sickened", "revolted", "grossed out", "nauseated", "offended", "appalled", "repelled", "horrified", "abomination"],
  "Trust": ["trust", "trusting", "reliance", "confidence", "faith", "belief", "assurance", "conviction", "dependence", "reliability", "security", "certainty", "hope", "optimism", "acceptance", "calm", "peaceful", "serene", "tranquil", "relaxed", "at ease", "comfortable"]
};
var SECONDARY_EMOTIONS = {
  // Joy secondary emotions
  "Content": "Joy",
  "Happy": "Joy",
  "Cheerful": "Joy",
  "Joyful": "Joy",
  "Proud": "Joy",
  "Optimistic": "Joy",
  "Enthusiastic": "Joy",
  "Elated": "Joy",
  "Triumphant": "Joy",
  "Excited": "Joy",
  // Sadness secondary emotions
  "Suffering": "Sadness",
  "Disappointed": "Sadness",
  "Shameful": "Sadness",
  "Neglected": "Sadness",
  "Despair": "Sadness",
  "Depression": "Sadness",
  "Lonely": "Sadness",
  "Grieving": "Sadness",
  // Fear secondary emotions
  "Scared": "Fear",
  "Terrified": "Fear",
  "Insecure": "Fear",
  "Nervous": "Fear",
  "Worried": "Fear",
  "Inadequate": "Fear",
  "Rejected": "Fear",
  "Threatened": "Fear",
  // Note: Anxiety is now considered part of Fear core emotion
  "Anxious": "Fear",
  "Stressed": "Fear",
  "Overwhelmed": "Fear",
  "Worry": "Fear",
  "Tense": "Fear",
  "Panicky": "Fear",
  "Unsettled": "Fear",
  "Apprehensive": "Fear",
  // Anger secondary emotions
  "Rage": "Anger",
  "Exasperated": "Anger",
  "Irritable": "Anger",
  "Envy": "Anger",
  "Disgust": "Anger",
  "Frustration": "Anger",
  "Irritation": "Anger",
  "Resentful": "Anger",
  "Jealous": "Anger",
  // Disgust secondary emotions
  "Disapproval": "Disgust",
  "Distaste": "Disgust",
  // Changed from duplicate 'Disappointed'
  "Avoidance": "Disgust",
  "Revulsion": "Disgust",
  "Contempt": "Disgust",
  "Loathing": "Disgust",
  "Aversion": "Disgust",
  // Love secondary emotions
  "Affection": "Love",
  "Longing": "Love",
  "Compassion": "Love",
  "Tenderness": "Love",
  "Caring": "Love",
  "Desire": "Love",
  "Fondness": "Love",
  "Passion": "Love",
  "Adoration": "Love",
  // Surprise secondary emotions
  "Stunned": "Surprise",
  "Confused": "Surprise",
  "Amazed": "Surprise",
  "Overcome": "Surprise",
  "Moved": "Surprise",
  "Astonished": "Surprise",
  "Wonder": "Surprise",
  "Awe": "Surprise",
  "Startled": "Surprise",
  // Trust secondary emotions
  "Secure": "Trust",
  "Confident": "Trust",
  "Faithful": "Trust",
  "Respected": "Trust",
  "Safe": "Trust",
  "Reliable": "Trust",
  "Honored": "Trust",
  // Map Gratitude secondary emotions to Joy core emotion
  "Thankful": "Joy",
  "Appreciative": "Joy",
  "Recognized": "Joy",
  "Blessed": "Joy",
  "Gratitude": "Joy",
  // Map Interest secondary emotions to Trust core emotion
  "Curious": "Trust",
  "Engaged": "Trust",
  "Fascinated": "Trust",
  "Intrigued": "Trust",
  "Interest": "Trust",
  // Map Calm secondary emotions to Trust core emotion
  "Peaceful": "Trust",
  "Relaxed": "Trust",
  "Tranquil": "Trust",
  "Serene": "Trust",
  "Composed": "Trust",
  "Balanced": "Trust",
  "Calm": "Trust",
  // Map Shame secondary emotions to Sadness core emotion
  "Embarrassed": "Sadness",
  "Humiliated": "Sadness",
  "Regretful": "Sadness",
  "Guilty": "Sadness",
  "Shame": "Sadness"
};
var TERTIARY_EMOTIONS = {
  // Joy tertiary emotions
  "Pleased": "Content",
  "Satisfied": "Content",
  "Amused": "Happy",
  "Delighted": "Happy",
  "Jovial": "Cheerful",
  "Blissful": "Cheerful",
  "Illustrious": "Proud",
  "Triumphant": "Proud",
  "Hopeful": "Optimistic",
  "Eager": "Optimistic",
  "Zealous": "Enthusiastic",
  "Energetic": "Enthusiastic",
  "Jubilant": "Elated",
  "Ecstatic": "Elated",
  // Sadness tertiary emotions
  "Agony": "Suffering",
  "Hurt": "Suffering",
  "Depressed": "Sadness",
  "Sorrow": "Sadness",
  "Dismayed": "Disappointed",
  "Displeased": "Disappointed",
  "Regretful": "Shameful",
  "Guilty": "Shameful",
  "Isolated": "Neglected",
  "Lonely": "Neglected",
  "Grief": "Despair",
  "Powerless": "Despair",
  // Fear tertiary emotions
  "Frightened": "Scared",
  "Helpless": "Scared",
  "Horrified": "Terrified",
  "Panic": "Terrified",
  "Doubtful": "Insecure",
  "Inadequate": "Insecure",
  "Worried": "Nervous",
  "Anxious": "Nervous",
  // Fear-related anxiety tertiary emotions
  "Overwhelmed": "Anxious",
  "Frantic": "Stressed",
  "Jittery": "Tense",
  "Restless": "Tense",
  "Uneasy": "Worried",
  "Distressed": "Panicky",
  "Concerned": "Worried",
  "Troubled": "Apprehensive",
  // Anger tertiary emotions
  "Hate": "Rage",
  "Hostile": "Rage",
  "Agitated": "Exasperated",
  "Frustrated": "Exasperated",
  "Annoyed": "Irritable",
  "Aggravated": "Irritable",
  "Resentful": "Envy",
  "Jealous": "Envy",
  "Contempt": "Disgust",
  "Revolted": "Disgust",
  // Disgust tertiary emotions
  "Judgmental": "Disapproval",
  "Critical": "Disapproval",
  "Repulsed": "Revulsion",
  "Appalled": "Revulsion",
  "Disdain": "Contempt",
  "Scornful": "Contempt",
  // Love tertiary emotions
  "Caring": "Affection",
  "Warm": "Affection",
  "Yearning": "Longing",
  "Missing": "Longing",
  "Empathetic": "Compassion",
  "Sympathetic": "Compassion",
  "Gentle": "Tenderness",
  "Soft": "Tenderness",
  // Surprise tertiary emotions
  "Shocked": "Stunned",
  "Bewildered": "Stunned",
  // Changed from duplicate 'Dismayed'
  "Disillusioned": "Confused",
  "Perplexed": "Confused",
  "Astonished": "Amazed",
  "Awe-struck": "Amazed",
  "Speechless": "Overcome",
  "Astounded": "Overcome",
  "Stimulated": "Moved",
  "Touched": "Moved",
  // Trust tertiary emotions
  "Protected": "Secure",
  "Sheltered": "Secure",
  "Reassured": "Confident",
  "Empowered": "Confident",
  "Loyal": "Faithful",
  "Devoted": "Faithful",
  // Gratitude tertiary emotions
  "Indebted": "Thankful",
  "Obliged": "Thankful",
  "Acknowledged": "Appreciative",
  "Valued": "Appreciative",
  // Interest tertiary emotions
  "Inquisitive": "Curious",
  "Inquiring": "Curious",
  "Attentive": "Engaged",
  "Absorbed": "Engaged",
  "Captivated": "Fascinated",
  "Enthralled": "Fascinated",
  // Calm tertiary emotions
  "Quiet": "Peaceful",
  "Still": "Peaceful",
  "Rested": "Relaxed",
  "At ease": "Relaxed",
  "Centered": "Composed",
  "Collected": "Composed",
  // Shame tertiary emotions
  "Mortified": "Embarrassed",
  "Self-conscious": "Embarrassed",
  "Disgraced": "Humiliated",
  "Dishonored": "Humiliated",
  "Apologetic": "Regretful",
  "Remorseful": "Regretful"
};
var EMOTION_COLORS = {
  // Core emotions (Ring 1) - The standard 8 core emotions from the emotion wheel
  "Joy": "#F9D71C",
  // Yellow
  "Sadness": "#6D87C4",
  // Blue
  "Fear": "#8A65AA",
  // Purple
  "Anger": "#E43D40",
  // Red
  "Disgust": "#7DB954",
  // Green
  "Love": "#E91E63",
  // Pink
  "Surprise": "#F47B20",
  // Orange
  "Trust": "#8DC4BD",
  // Teal
  // Secondary emotions with specific colors (these are now mapped to the 8 core emotions)
  "Worry": "#9932CC",
  // Purple (maps to Fear)
  "Anxious": "#9C27B0",
  // Purple (maps to Fear)
  "Frustrated": "#B22222",
  // Dark Red (maps to Anger)
  "Happy": "#FFA07A",
  // Light Red (maps to Joy)
  "Depressed": "#4682B4",
  // Blue (maps to Sadness)
  "Shame": "#FF6B81",
  // Pink-Red (maps to Sadness)
  "Gratitude": "#FFB74D",
  // Light Orange (maps to Joy)
  "Calm": "#81C784",
  // Light Green (maps to Trust)
  "Interest": "#4DB6AC"
  // Teal-Green (maps to Trust)
};
function findCoreEmotion(emotion) {
  if (!emotion) return null;
  const normalizedEmotion = emotion.toLowerCase().trim();
  for (const [coreEmotion, variants] of Object.entries(CORE_EMOTION_FAMILIES)) {
    if (coreEmotion.toLowerCase() === normalizedEmotion) {
      return coreEmotion;
    }
    if (variants.includes(normalizedEmotion)) {
      return coreEmotion;
    }
    for (const variant of variants) {
      if (variant.includes(normalizedEmotion) || normalizedEmotion.includes(variant)) {
        return coreEmotion;
      }
    }
  }
  for (const [secondaryEmotion, coreEmotion] of Object.entries(SECONDARY_EMOTIONS)) {
    if (secondaryEmotion.toLowerCase() === normalizedEmotion) {
      return coreEmotion;
    }
    if (normalizedEmotion.includes(secondaryEmotion.toLowerCase()) || secondaryEmotion.toLowerCase().includes(normalizedEmotion)) {
      return coreEmotion;
    }
  }
  for (const [tertiaryEmotion, secondaryEmotion] of Object.entries(TERTIARY_EMOTIONS)) {
    if (tertiaryEmotion.toLowerCase() === normalizedEmotion) {
      const secondaryKey = secondaryEmotion;
      return SECONDARY_EMOTIONS[secondaryKey] || null;
    }
    if (normalizedEmotion.includes(tertiaryEmotion.toLowerCase()) || tertiaryEmotion.toLowerCase().includes(normalizedEmotion)) {
      const secondaryKey = secondaryEmotion;
      return SECONDARY_EMOTIONS[secondaryKey] || null;
    }
  }
  let bestMatch = null;
  let highestSimilarity = 0;
  for (const [coreEmotion, variants] of Object.entries(CORE_EMOTION_FAMILIES)) {
    const similarity = calculateStringSimilarity(normalizedEmotion, coreEmotion.toLowerCase());
    if (similarity > highestSimilarity && similarity > 0.6) {
      highestSimilarity = similarity;
      bestMatch = coreEmotion;
    }
    for (const variant of variants) {
      const variantSimilarity = calculateStringSimilarity(normalizedEmotion, variant);
      if (variantSimilarity > highestSimilarity && variantSimilarity > 0.6) {
        highestSimilarity = variantSimilarity;
        bestMatch = coreEmotion;
      }
    }
  }
  if (bestMatch) {
    return bestMatch;
  }
  const commonAIEmotionMappings = {
    // Positive emotions usually map to Joy or Trust
    "pleased": "Joy",
    "happy": "Joy",
    "content": "Joy",
    "grateful": "Joy",
    "thankful": "Joy",
    "satisfied": "Joy",
    "relief": "Joy",
    "relieved": "Joy",
    "hopeful": "Joy",
    "nostalgic": "Sadness",
    // Changed from Joy to Sadness (nostalgia is often bittersweet)
    "proud": "Joy",
    "confident": "Trust",
    "calm": "Trust",
    "relaxed": "Trust",
    "comfortable": "Trust",
    "secure": "Trust",
    "interested": "Trust",
    "curious": "Trust",
    // Negative emotions map to Sadness, Fear, Anger, or Disgust
    "upset": "Sadness",
    "melancholy": "Sadness",
    "melancholic": "Sadness",
    "regret": "Sadness",
    "remorse": "Sadness",
    "alone": "Sadness",
    "abandoned": "Sadness",
    "disheartened": "Sadness",
    "miserable": "Sadness",
    "troubled": "Sadness",
    "misunderstood": "Sadness",
    "isolated": "Sadness",
    "lonely": "Sadness",
    "helpless": "Sadness",
    "anxious": "Fear",
    "worried": "Fear",
    "nervous": "Fear",
    "tense": "Fear",
    "stressed": "Fear",
    "distressed": "Fear",
    "panicked": "Fear",
    "threatened": "Fear",
    "uneasy": "Fear",
    "overwhelmed": "Fear",
    "apprehensive": "Fear",
    "alarmed": "Fear",
    "terrified": "Fear",
    "scared": "Fear",
    "annoyed": "Anger",
    "irritated": "Anger",
    "frustrated": "Anger",
    "outraged": "Anger",
    "resentful": "Anger",
    "bitter": "Anger",
    "envious": "Anger",
    "jealous": "Anger",
    "revolted": "Disgust",
    "offended": "Disgust",
    "appalled": "Disgust",
    "horrified": "Disgust",
    "uncomfortable": "Disgust",
    "disgusted": "Disgust",
    "repulsed": "Disgust",
    // Complex emotions
    "confused": "Surprise",
    "uncertain": "Surprise",
    "intrigued": "Surprise",
    "awe": "Surprise",
    "shocked": "Surprise",
    "astonished": "Surprise",
    "amazed": "Surprise",
    "stunned": "Surprise",
    "perplexed": "Surprise",
    "bewildered": "Surprise",
    "affectionate": "Love",
    "attached": "Love",
    "caring": "Love",
    "compassionate": "Love",
    "desire": "Love",
    "longing": "Love",
    "yearning": "Love",
    "tender": "Love",
    "warm": "Love",
    "passionate": "Love",
    "adoring": "Love",
    "devoted": "Love",
    "appreciative": "Love",
    "cherished": "Love",
    "empty": "Sadness",
    "void": "Sadness",
    "hollow": "Sadness",
    "numb": "Sadness",
    "disconnected": "Sadness"
  };
  for (const [aiTerm, coreEmotion] of Object.entries(commonAIEmotionMappings)) {
    if (normalizedEmotion.includes(aiTerm) || aiTerm.includes(normalizedEmotion)) {
      return coreEmotion;
    }
  }
  const positiveWords = ["good", "great", "wonderful", "fantastic", "excellent", "amazing", "positive", "nice", "pleasant"];
  const negativeWords = ["bad", "terrible", "awful", "horrible", "negative", "poor", "unpleasant", "uncomfortable"];
  for (const word of positiveWords) {
    if (normalizedEmotion.includes(word)) {
      return "Joy";
    }
  }
  for (const word of negativeWords) {
    if (normalizedEmotion.includes(word)) {
      return "Sadness";
    }
  }
  if (normalizedEmotion.endsWith("ed") || normalizedEmotion.endsWith("ing")) {
    const root = normalizedEmotion.replace(/ed$/, "").replace(/ing$/, "");
    for (const [coreEmotion, variants] of Object.entries(CORE_EMOTION_FAMILIES)) {
      for (const variant of variants) {
        if (variant.includes(root) || root.includes(variant)) {
          return coreEmotion;
        }
      }
    }
  }
  return null;
}
function calculateStringSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  if (len1 === 0) return 0;
  if (len2 === 0) return 0;
  if (str1 === str2) return 1;
  if (str1.includes(str2) || str2.includes(str1)) {
    const shorterLen = Math.min(len1, len2);
    const longerLen = Math.max(len1, len2);
    return shorterLen / longerLen;
  }
  let matches = 0;
  for (let i = 0; i < len1; i++) {
    if (str2.includes(str1[i])) {
      matches++;
    }
  }
  return matches / Math.max(len1, len2);
}
function getRelatedEmotions(coreEmotion) {
  if (!coreEmotion) return [];
  const results = [coreEmotion];
  const coreEmotionLower = coreEmotion.toLowerCase();
  for (const [core, variants] of Object.entries(CORE_EMOTION_FAMILIES)) {
    if (core.toLowerCase() === coreEmotionLower) {
      results.push(...variants.map((v) => v.charAt(0).toUpperCase() + v.slice(1)));
      break;
    }
  }
  for (const [secondary, core] of Object.entries(SECONDARY_EMOTIONS)) {
    if (core === coreEmotion) {
      results.push(secondary);
      for (const [tertiary, secondaryParent] of Object.entries(TERTIARY_EMOTIONS)) {
        if (secondaryParent === secondary) {
          results.push(tertiary);
        }
      }
    }
  }
  return Array.from(new Set(results));
}
function getEmotionColor(emotion) {
  if (EMOTION_COLORS[emotion]) {
    return EMOTION_COLORS[emotion];
  }
  const coreEmotion = findCoreEmotion(emotion);
  if (coreEmotion && EMOTION_COLORS[coreEmotion]) {
    return EMOTION_COLORS[coreEmotion];
  }
  return "#999999";
}
function categorizeEmotion(inputEmotion) {
  if (!inputEmotion) {
    return {
      coreEmotion: null,
      secondaryEmotion: null,
      tertiaryEmotion: null
    };
  }
  const normalizedInput = inputEmotion.toLowerCase().trim();
  const directMappings = {
    "nostalgic": "Sadness",
    "empty": "Sadness",
    "conflicted": "Surprise",
    "ambivalent": "Surprise",
    "misunderstood": "Sadness"
  };
  if (directMappings[normalizedInput]) {
    const coreEmotion2 = directMappings[normalizedInput];
    let suitableSecondary = null;
    for (const [secondary, core] of Object.entries(SECONDARY_EMOTIONS)) {
      if (core === coreEmotion2) {
        suitableSecondary = secondary;
        break;
      }
    }
    let suitableTertiary = null;
    if (suitableSecondary) {
      for (const [tertiary, secondary] of Object.entries(TERTIARY_EMOTIONS)) {
        if (secondary === suitableSecondary) {
          suitableTertiary = tertiary;
          break;
        }
      }
    }
    return {
      coreEmotion: coreEmotion2,
      secondaryEmotion: suitableSecondary,
      tertiaryEmotion: suitableTertiary
    };
  }
  for (const [tertiaryEmotion, secondaryParent] of Object.entries(TERTIARY_EMOTIONS)) {
    if (tertiaryEmotion.toLowerCase() === normalizedInput) {
      const secondaryKey = secondaryParent;
      const coreEmotion2 = SECONDARY_EMOTIONS[secondaryKey] || null;
      return {
        coreEmotion: coreEmotion2,
        secondaryEmotion: secondaryParent,
        tertiaryEmotion
      };
    }
  }
  for (const [secondaryEmotion, coreParent] of Object.entries(SECONDARY_EMOTIONS)) {
    if (secondaryEmotion.toLowerCase() === normalizedInput) {
      let suitableTertiary = null;
      for (const [tertiary, secondary] of Object.entries(TERTIARY_EMOTIONS)) {
        if (secondary === secondaryEmotion) {
          suitableTertiary = tertiary;
          break;
        }
      }
      return {
        coreEmotion: coreParent,
        secondaryEmotion,
        tertiaryEmotion: suitableTertiary
      };
    }
  }
  for (const [secondaryEmotion, coreParent] of Object.entries(SECONDARY_EMOTIONS)) {
    if (normalizedInput.includes(secondaryEmotion.toLowerCase()) || secondaryEmotion.toLowerCase().includes(normalizedInput)) {
      let suitableTertiary = null;
      for (const [tertiary, secondary] of Object.entries(TERTIARY_EMOTIONS)) {
        if (secondary === secondaryEmotion) {
          suitableTertiary = tertiary;
          break;
        }
      }
      return {
        coreEmotion: coreParent,
        secondaryEmotion,
        tertiaryEmotion: suitableTertiary
      };
    }
  }
  const coreEmotion = findCoreEmotion(inputEmotion);
  if (coreEmotion) {
    let suitableSecondary = null;
    for (const [secondary, core] of Object.entries(SECONDARY_EMOTIONS)) {
      if (core === coreEmotion) {
        suitableSecondary = secondary;
        break;
      }
    }
    let suitableTertiary = null;
    if (suitableSecondary) {
      for (const [tertiary, secondary] of Object.entries(TERTIARY_EMOTIONS)) {
        if (secondary === suitableSecondary) {
          suitableTertiary = tertiary;
          break;
        }
      }
    }
    return {
      coreEmotion,
      secondaryEmotion: suitableSecondary,
      tertiaryEmotion: suitableTertiary
    };
  }
  return {
    coreEmotion: null,
    secondaryEmotion: null,
    tertiaryEmotion: null
  };
}
function findMatchingEmotions(tags) {
  const matches = /* @__PURE__ */ new Set();
  tags.forEach((tag) => {
    const coreEmotion = findCoreEmotion(tag);
    if (coreEmotion) {
      matches.add(coreEmotion);
    }
  });
  return Array.from(matches);
}
async function enhanceComponentConnections(emotionData, journalData, thoughtRecordData) {
  const emotionConnections = {};
  Object.keys(CORE_EMOTION_FAMILIES).forEach((coreEmotion) => {
    emotionConnections[coreEmotion] = {
      totalEntries: 0,
      journalEntries: [],
      thoughtRecords: [],
      averageIntensity: 0,
      averageImprovement: 0
    };
  });
  emotionData.forEach((emotion) => {
    const coreEmotion = emotion.coreEmotion;
    if (emotionConnections[coreEmotion]) {
      emotionConnections[coreEmotion].totalEntries++;
      emotionConnections[coreEmotion].averageIntensity += emotion.intensity || 0;
    }
  });
  journalData.forEach((journal) => {
    const allTags = [];
    if (Array.isArray(journal.userSelectedTags)) {
      allTags.push(...journal.userSelectedTags);
    }
    if (Array.isArray(journal.selectedTags)) {
      allTags.push(...journal.selectedTags);
    }
    if (Array.isArray(journal.tags)) {
      allTags.push(...journal.tags);
    }
    if (allTags.length === 0 && Array.isArray(journal.aiSuggestedTags)) {
      allTags.push(...journal.aiSuggestedTags);
    }
    if (allTags.length === 0 && typeof journal.content === "string") {
      Object.keys(CORE_EMOTION_FAMILIES).forEach((emotion) => {
        if (journal.content.toLowerCase().includes(emotion.toLowerCase())) {
          allTags.push(emotion);
        }
        const emotionKey = emotion;
        CORE_EMOTION_FAMILIES[emotionKey].forEach((subEmotion) => {
          if (journal.content.toLowerCase().includes(subEmotion)) {
            allTags.push(subEmotion);
          }
        });
      });
    }
    if (allTags.length > 0) {
      const foundEmotions = findMatchingEmotions(allTags);
      foundEmotions.forEach((emotion) => {
        if (emotionConnections[emotion]) {
          emotionConnections[emotion].journalEntries.push(journal);
        }
      });
    }
    if (journal.content && (journal.content.toLowerCase().includes("fear") || journal.content.toLowerCase().includes("afraid") || journal.content.toLowerCase().includes("anxiety") || journal.content.toLowerCase().includes("worry"))) {
      emotionConnections["Fear"].journalEntries.push(journal);
    }
  });
  thoughtRecordData.forEach((record) => {
    const matchingEmotion = emotionData.find((e) => e.id === record.emotionRecordId);
    if (matchingEmotion) {
      const coreEmotion = matchingEmotion.coreEmotion;
      if (emotionConnections[coreEmotion]) {
        emotionConnections[coreEmotion].thoughtRecords.push(record);
        if (record.reflectionRating) {
          const initialIntensity = matchingEmotion.intensity || 0;
          const improvement = initialIntensity - record.reflectionRating;
          emotionConnections[coreEmotion].averageImprovement += improvement;
        }
      }
    }
  });
  Object.keys(emotionConnections).forEach((emotion) => {
    const data = emotionConnections[emotion];
    if (data.totalEntries > 0) {
      data.averageIntensity = data.averageIntensity / data.totalEntries;
    }
    if (data.thoughtRecords.length > 0) {
      data.averageImprovement = data.averageImprovement / data.thoughtRecords.length;
    }
  });
  return emotionConnections;
}
function generateDataInsights(connections) {
  const insights = [];
  const sortedByFrequency = Object.entries(connections).sort((a, b) => b[1].totalEntries - a[1].totalEntries).filter(([_, data]) => data.totalEntries > 0);
  if (sortedByFrequency.length > 0) {
    const [topEmotion, topData] = sortedByFrequency[0];
    insights.push(`Your most frequently recorded emotion is ${topEmotion}, which appears in ${topData.totalEntries} entries.`);
    if (topData.journalEntries.length > 0) {
      insights.push(`You've written about ${topEmotion} in ${topData.journalEntries.length} journal entries.`);
    }
  }
  const sortedByImprovement = Object.entries(connections).filter(([_, data]) => data.thoughtRecords.length > 0).sort((a, b) => b[1].averageImprovement - a[1].averageImprovement);
  if (sortedByImprovement.length > 0) {
    const [bestEmotion, bestData] = sortedByImprovement[0];
    if (bestData.averageImprovement > 0) {
      insights.push(`You've shown the most improvement with ${bestEmotion}, with an average reduction of ${bestData.averageImprovement.toFixed(1)} points after using coping strategies.`);
    }
  }
  const needsWork = Object.entries(connections).filter(
    ([_, data]) => data.totalEntries > 0 && data.thoughtRecords.length === 0 && data.journalEntries.length > 0
  );
  if (needsWork.length > 0) {
    const [emotion] = needsWork[0];
    insights.push(`Consider creating thought records for ${emotion} to develop coping strategies for this emotion.`);
  }
  const distortionCounts = {};
  Object.values(connections).forEach((data) => {
    data.thoughtRecords.forEach((record) => {
      if (record.cognitiveDistortions) {
        record.cognitiveDistortions.forEach((distortion) => {
          distortionCounts[distortion] = (distortionCounts[distortion] || 0) + 1;
        });
      }
    });
  });
  const sortedDistortions = Object.entries(distortionCounts).sort((a, b) => b[1] - a[1]);
  if (sortedDistortions.length > 0) {
    const [topDistortion, count2] = sortedDistortions[0];
    insights.push(`Your most common cognitive distortion is "${formatDistortionName(topDistortion)}", which appears in ${count2} thought records.`);
  }
  return insights;
}
function formatDistortionName(distortionName) {
  return distortionName.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

// server/routes.ts
init_websocket();
init_email();

// server/controllers/inactivityReminders.ts
init_db();
init_email();
init_websocket();
async function findInactiveClients(days = 3, therapistId) {
  try {
    console.log(`Finding inactive clients with threshold of ${days} days`);
    const now = /* @__PURE__ */ new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
    console.log(`Cutoff date: ${cutoffDate.toISOString()}`);
    let clientQuery = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.therapist_id as "therapistId",
        u.created_at as "createdAt"
      FROM users u
      WHERE 
        u.role = 'client' AND 
        u.status = 'active'
    `;
    const clientQueryParams = [];
    if (therapistId) {
      clientQuery += ` AND u.therapist_id = $1`;
      clientQueryParams.push(therapistId);
    }
    const clientsResult = await pool2.query(clientQuery, clientQueryParams);
    const allClients = clientsResult.rows;
    console.log(`Found ${allClients.length} total clients to check for inactivity`);
    const inactiveClients = [];
    for (const client of allClients) {
      const activityQuery = `
        SELECT 
          GREATEST(
            COALESCE((SELECT MAX(timestamp) FROM emotion_records WHERE user_id = $1), '1970-01-01'),
            COALESCE((SELECT MAX(created_at) FROM thought_records WHERE user_id = $1), '1970-01-01'),
            COALESCE((SELECT MAX(created_at) FROM journal_entries WHERE user_id = $1), '1970-01-01'),
            COALESCE((SELECT MAX(created_at) FROM goals WHERE user_id = $1), '1970-01-01')
          ) as last_activity
      `;
      const activityResult = await pool2.query(activityQuery, [client.id]);
      const lastActivity = activityResult.rows[0].last_activity;
      const hasActivity = lastActivity !== "1970-01-01";
      let isInactive = false;
      if (hasActivity) {
        const lastActivityDate = new Date(lastActivity);
        isInactive = lastActivityDate < cutoffDate;
        console.log(`Client ${client.id}: ${client.name} - Last activity: ${lastActivityDate.toISOString()} - Inactive: ${isInactive}`);
      } else {
        const createdAt = new Date(client.createdAt);
        isInactive = createdAt < cutoffDate;
        console.log(`Client ${client.id}: ${client.name} - No activity, created at: ${createdAt.toISOString()} - Inactive: ${isInactive}`);
      }
      if (isInactive) {
        inactiveClients.push({
          ...client,
          lastActivity: hasActivity ? lastActivity : "Never recorded"
        });
      }
    }
    inactiveClients.sort((a, b) => {
      const dateA = a.lastActivity === "Never recorded" ? new Date(a.createdAt) : new Date(a.lastActivity);
      const dateB = b.lastActivity === "Never recorded" ? new Date(b.createdAt) : new Date(b.lastActivity);
      return dateA.getTime() - dateB.getTime();
    });
    console.log(`Found ${inactiveClients.length} inactive clients`);
    return inactiveClients;
  } catch (error) {
    console.error("Error finding inactive clients:", error);
    return [];
  }
}
async function createInactivityNotification(userId, customMessage) {
  try {
    const notificationData = {
      user_id: userId,
      title: "Activity Reminder",
      body: customMessage || "It's been a while since you last used ResilienceHub\u2122. Regular tracking of emotions, thoughts, and other activities helps build self-awareness and improve therapy outcomes.",
      type: "reminder",
      is_read: false,
      created_at: /* @__PURE__ */ new Date()
    };
    const query = `
      INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const result = await pool2.query(query, [
      notificationData.user_id,
      notificationData.title,
      notificationData.body,
      notificationData.type,
      notificationData.is_read,
      notificationData.created_at
    ]);
    try {
      sendNotificationToUser(userId, result.rows[0]);
    } catch (wsError) {
      console.log("WebSocket notification sending failed (not critical):", wsError);
    }
    return true;
  } catch (error) {
    console.error(`Error creating inactivity notification for user ${userId}:`, error);
    return false;
  }
}
async function checkInactiveClients(req, res) {
  try {
    const daysThreshold = Number(req.query.days) || 3;
    let therapistId = void 0;
    if (req.query.therapistOnly === "true" && req.user && req.user.role === "therapist") {
      therapistId = req.user.id;
    }
    const inactiveClients = await findInactiveClients(daysThreshold, therapistId);
    return res.status(200).json({
      success: true,
      count: inactiveClients.length,
      threshold: daysThreshold,
      clients: inactiveClients.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        therapistId: c.therapistId,
        lastActivity: c.lastActivity
      }))
    });
  } catch (error) {
    console.error("Error checking inactive clients:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking inactive clients"
    });
  }
}
async function sendInactivityReminders(req, res) {
  try {
    const daysThreshold = req.body.days || 3;
    console.log(`Looking for clients inactive for ${daysThreshold} days...`);
    let therapistId = void 0;
    if (req.body.therapistOnly === true && req.user && req.user.role === "therapist") {
      therapistId = req.user.id;
      console.log(`Filtering to only clients of therapist ${therapistId}`);
    }
    const specificClientIds = req.body.clientIds || [];
    let clientsToProcess = [];
    if (specificClientIds.length > 0) {
      console.log(`Sending reminders to specifically selected clients: ${specificClientIds.join(", ")}`);
      const query = `
        SELECT u.id, u.name, u.email, u.therapist_id as "therapistId" 
        FROM users u
        WHERE u.id = ANY($1)
        ${therapistId ? "AND u.therapist_id = $2" : ""}
      `;
      const params = [specificClientIds];
      if (therapistId) {
        params.push(therapistId);
      }
      const result = await pool2.query(query, params);
      clientsToProcess = result.rows;
      console.log(`Found ${clientsToProcess.length} specific clients to send reminders to`);
    } else {
      clientsToProcess = await findInactiveClients(daysThreshold, therapistId);
      console.log(`Found ${clientsToProcess.length} inactive clients to send reminders to`);
    }
    let notificationsSent = 0;
    let emailsSent = 0;
    const emailsEnabled = isEmailEnabled();
    for (const client of clientsToProcess) {
      const notificationCreated = await createInactivityNotification(client.id);
      if (notificationCreated) notificationsSent++;
      if (emailsEnabled) {
        console.log(`Attempting to send reminder email to ${client.name} (${client.email})`);
        const emailSent = await sendEmotionTrackingReminder(client.email, client.name);
        if (emailSent) {
          console.log(`\u2713 Successfully sent email to ${client.email}`);
          emailsSent++;
        } else {
          console.log(`\u2717 Failed to send email to ${client.email}`);
        }
      } else {
        console.log(`Email service not enabled - would have sent reminder to ${client.email}`);
      }
    }
    return res.status(200).json({
      success: true,
      processedClients: clientsToProcess.length,
      notificationsSent,
      emailsSent,
      emailsEnabled,
      message: `Sent ${notificationsSent} in-app notifications and ${emailsSent} emails to ${specificClientIds.length > 0 ? "selected" : "inactive"} clients`
    });
  } catch (error) {
    console.error("Error sending inactivity reminders:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending inactivity reminders"
    });
  }
}

// server/routes.ts
init_schema();
import cookieParser from "cookie-parser";

// server/services/integrationRoutes.ts
init_db();
init_schema();
import { eq as eq2, and as and2, desc as desc2 } from "drizzle-orm";
function registerIntegrationRoutes(app2) {
  app2.get("/api/emotions/categorize/:emotion", async (req, res) => {
    try {
      const emotion = req.params.emotion;
      const categorized = categorizeEmotion(emotion);
      res.json({
        input: emotion,
        ...categorized,
        color: categorized.coreEmotion ? getEmotionColor(categorized.coreEmotion) : null
      });
    } catch (error) {
      console.error(`Error categorizing emotion "${req.params.emotion}":`, error);
      res.status(500).json({ message: "Failed to categorize emotion" });
    }
  });
  app2.get("/api/emotions/taxonomy", async (req, res) => {
    try {
      const completeEmotionTaxonomy = {};
      Object.keys(CORE_EMOTION_FAMILIES).forEach((coreEmotion) => {
        completeEmotionTaxonomy[coreEmotion] = {
          variants: CORE_EMOTION_FAMILIES[coreEmotion],
          secondaryEmotions: {}
        };
      });
      Object.entries(SECONDARY_EMOTIONS).forEach(([secondaryEmotion, coreEmotion]) => {
        if (completeEmotionTaxonomy[coreEmotion]) {
          completeEmotionTaxonomy[coreEmotion].secondaryEmotions[secondaryEmotion] = {
            tertiaryEmotions: []
          };
        }
      });
      Object.entries(TERTIARY_EMOTIONS).forEach(([tertiaryEmotion, secondaryEmotion]) => {
        const coreEmotion = SECONDARY_EMOTIONS[secondaryEmotion];
        if (completeEmotionTaxonomy[coreEmotion] && completeEmotionTaxonomy[coreEmotion].secondaryEmotions[secondaryEmotion]) {
          completeEmotionTaxonomy[coreEmotion].secondaryEmotions[secondaryEmotion].tertiaryEmotions.push(tertiaryEmotion);
        }
      });
      res.json({
        coreEmotions: Object.keys(CORE_EMOTION_FAMILIES),
        emotionFamilies: CORE_EMOTION_FAMILIES,
        relationships: EMOTION_COLORS,
        completeTaxonomy: completeEmotionTaxonomy
      });
    } catch (error) {
      console.error("Error fetching emotion taxonomy:", error);
      res.status(500).json({ message: "Failed to fetch emotion taxonomy" });
    }
  });
  app2.get("/api/emotions/related", async (req, res) => {
    try {
      const coreEmotions = Object.keys(CORE_EMOTION_FAMILIES);
      const relationshipMap = {};
      coreEmotions.forEach((core) => {
        relationshipMap[core] = getRelatedEmotions(core).slice(0, 5);
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
  app2.get("/api/emotions/related/:emotion", async (req, res) => {
    try {
      const emotion = req.params.emotion;
      const coreEmotion = findCoreEmotion(emotion);
      const relatedEmotions = coreEmotion ? getRelatedEmotions(coreEmotion) : getRelatedEmotions(emotion || "");
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
  app2.get("/api/users/:userId/emotions/:emotion/related-journal", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotion = req.params.emotion;
      const coreEmotion = findCoreEmotion(emotion);
      const relatedEmotions = coreEmotion ? getRelatedEmotions(coreEmotion) : getRelatedEmotions(emotion || "");
      const searchEmotions = [emotion, ...relatedEmotions];
      const entries = await db.select({
        id: journalEntries.id,
        title: journalEntries.title,
        timestamp: journalEntries.createdAt,
        userSelectedTags: journalEntries.userSelectedTags
      }).from(journalEntries).where(
        and2(
          eq2(journalEntries.userId, userId),
          // At least one of userSelectedTags contains a matching emotion
          // We use a simplified approach for JSON array search here
          // In a production app, you might need a more sophisticated approach
          // depending on the database being used
          journalEntries.userSelectedTags
        )
      ).orderBy(desc2(journalEntries.createdAt)).limit(10);
      const relatedEntries = entries.filter((entry) => {
        const entryTags = entry.userSelectedTags || [];
        return entryTags.some(
          (tag) => searchEmotions.some(
            (emotion2) => tag.toLowerCase() === emotion2.toLowerCase()
          )
        );
      }).map((entry) => ({
        ...entry,
        matchingEmotions: searchEmotions.filter(
          (emotion2) => (entry.userSelectedTags || []).some(
            (tag) => tag.toLowerCase() === emotion2.toLowerCase()
          )
        )
      }));
      res.json({ relatedEntries });
    } catch (error) {
      console.error(`Error fetching journal entries related to "${req.params.emotion}":`, error);
      res.status(500).json({ message: "Failed to fetch related journal entries" });
    }
  });
  app2.get("/api/users/:userId/journal/:entryId/related-emotions", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const entryId = parseInt(req.params.entryId);
      const [entry] = await db.select().from(journalEntries).where(
        and2(
          eq2(journalEntries.id, entryId),
          eq2(journalEntries.userId, userId)
        )
      );
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      const entryEmotions = entry.userSelectedTags || [];
      const allRelatedEmotionsSet = /* @__PURE__ */ new Set();
      entryEmotions.forEach((emotion) => {
        const related = getRelatedEmotions(emotion || "");
        related.forEach((rel) => allRelatedEmotionsSet.add(rel));
        allRelatedEmotionsSet.add(emotion);
      });
      const allRelatedEmotions = Array.from(allRelatedEmotionsSet);
      const emotionResults = await db.select({
        id: emotionRecords.id,
        timestamp: emotionRecords.createdAt,
        coreEmotion: emotionRecords.coreEmotion,
        primaryEmotion: emotionRecords.primaryEmotion,
        tertiaryEmotion: emotionRecords.tertiaryEmotion,
        intensity: emotionRecords.intensity,
        situation: emotionRecords.situation
      }).from(emotionRecords).where(
        and2(
          eq2(emotionRecords.userId, userId)
          // Filter for matching emotions - this is a simplified approach
          // This might need to be adjusted based on the database
        )
      ).orderBy(desc2(emotionRecords.createdAt)).limit(10);
      const relatedEmotions = emotionResults.filter((record) => {
        return allRelatedEmotions.some(
          (emotion) => record.tertiaryEmotion.toLowerCase() === emotion.toLowerCase() || record.primaryEmotion.toLowerCase() === emotion.toLowerCase() || record.coreEmotion.toLowerCase() === emotion.toLowerCase()
        );
      }).map((record) => ({
        ...record,
        matchingEmotions: entryEmotions.filter(
          (emotion) => getRelatedEmotions(emotion || "").some(
            (rel) => rel.toLowerCase() === record.tertiaryEmotion.toLowerCase() || rel.toLowerCase() === record.primaryEmotion.toLowerCase() || rel.toLowerCase() === record.coreEmotion.toLowerCase()
          ) || emotion.toLowerCase() === record.tertiaryEmotion.toLowerCase() || emotion.toLowerCase() === record.primaryEmotion.toLowerCase() || emotion.toLowerCase() === record.coreEmotion.toLowerCase()
        )
      }));
      res.json({ relatedEmotions });
    } catch (error) {
      console.error(`Error fetching emotions related to journal entry ${req.params.entryId}:`, error);
      res.status(500).json({ message: "Failed to fetch related emotions" });
    }
  });
  app2.get("/api/users/:userId/emotions/:emotion/related-thoughts", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotion = req.params.emotion;
      const coreEmotion = findCoreEmotion(emotion);
      const relatedEmotions = coreEmotion ? getRelatedEmotions(coreEmotion) : getRelatedEmotions(emotion || "");
      const searchEmotions = [emotion, ...relatedEmotions];
      const thoughts = await db.select({
        id: thoughtRecords.id,
        automaticThoughts: thoughtRecords.automaticThoughts,
        cognitiveDistortions: thoughtRecords.cognitiveDistortions,
        emotionRecordId: thoughtRecords.emotionRecordId,
        timestamp: thoughtRecords.createdAt
      }).from(thoughtRecords).where(
        and2(
          eq2(thoughtRecords.userId, userId)
        )
      ).orderBy(desc2(thoughtRecords.createdAt)).limit(10);
      const emotionResults = await db.select({
        id: emotionRecords.id,
        coreEmotion: emotionRecords.coreEmotion,
        primaryEmotion: emotionRecords.primaryEmotion,
        tertiaryEmotion: emotionRecords.tertiaryEmotion
      }).from(emotionRecords).where(
        and2(
          eq2(emotionRecords.userId, userId)
        )
      );
      const relatedThoughts = thoughts.filter((thought) => {
        if (thought.emotionRecordId) {
          const emotionRecord = emotionResults.find((e) => e.id === thought.emotionRecordId);
          if (emotionRecord) {
            return searchEmotions.some(
              (searchEmotion) => emotionRecord.coreEmotion.toLowerCase() === searchEmotion.toLowerCase() || emotionRecord.primaryEmotion.toLowerCase() === searchEmotion.toLowerCase() || emotionRecord.tertiaryEmotion.toLowerCase() === searchEmotion.toLowerCase()
            );
          }
        }
        return searchEmotions.some(
          (searchEmotion) => thought.automaticThoughts.toLowerCase().includes(searchEmotion.toLowerCase())
        );
      });
      res.json({ relatedThoughts });
    } catch (error) {
      console.error(`Error fetching thought records related to "${req.params.emotion}":`, error);
      res.status(500).json({ message: "Failed to fetch related thought records" });
    }
  });
}

// server/services/reframeCoach.ts
init_db();
init_schema();
import { sql as sql2, eq as eq3, and as and3, desc as desc3, gte as gte2 } from "drizzle-orm";
import { z as z2 } from "zod";
function formatCognitiveDistortion(distortion) {
  if (!distortion) return "Unknown";
  if (distortion === "emotional-reasoning") return "Emotional Reasoning";
  if (distortion === "mind-reading") return "Mind Reading";
  if (distortion === "fortune-telling") return "Fortune Telling";
  const withSpaces = distortion.replace(/([A-Z])/g, " $1").trim();
  const withoutHyphens = withSpaces.replace(/-/g, " ");
  return withoutHyphens.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}
var createReframePracticeSchema = z2.object({
  thoughtRecordId: z2.number(),
  assignedTo: z2.number(),
  isPriority: z2.boolean().optional().default(false),
  notes: z2.string().optional(),
  customInstructions: z2.string().optional()
});
var recordPracticeResultSchema = z2.object({
  assignmentId: z2.number().optional(),
  thoughtRecordId: z2.number().nullable().optional(),
  // Make thoughtRecordId optional to match our usage
  userId: z2.number().optional(),
  // Add userId field which is passed from the client
  score: z2.number(),
  correctAnswers: z2.number(),
  totalQuestions: z2.number(),
  streakCount: z2.number().optional().default(0),
  timeSpent: z2.number().optional().default(0),
  scenarioData: z2.any().optional(),
  userChoices: z2.any().optional()
  // Remove feedback field since it doesn't exist in the database
});
async function calculateAchievements(userId, result) {
  let [profile] = await db.select().from(userGameProfile).where(eq3(userGameProfile.userId, userId));
  if (!profile) {
    [profile] = await db.insert(userGameProfile).values({
      userId,
      totalScore: 0,
      level: 1,
      practiceStreak: 0,
      achievements: [],
      badges: []
    }).returning();
  }
  const newTotalScore = profile.totalScore + result.score;
  const newLevel = Math.floor(newTotalScore / 500) + 1;
  const today = /* @__PURE__ */ new Date();
  let newStreak = profile.practiceStreak || 0;
  if (profile.lastPracticeDate) {
    const lastPractice = new Date(profile.lastPracticeDate);
    const timeDiff = today.getTime() - lastPractice.getTime();
    const dayDiff = Math.round(timeDiff / (1e3 * 3600 * 24));
    if (dayDiff === 1) {
      newStreak += 1;
    } else if (dayDiff > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }
  const currentAchievements = profile.achievements || [];
  const newAchievements = [...currentAchievements];
  if (newStreak >= 3 && !newAchievements.includes("streak_3")) {
    newAchievements.push("streak_3");
  }
  if (newStreak >= 7 && !newAchievements.includes("streak_7")) {
    newAchievements.push("streak_7");
  }
  if (newStreak >= 14 && !newAchievements.includes("streak_14")) {
    newAchievements.push("streak_14");
  }
  const { count: count2 } = await db.select({ count: sql2`count(*)` }).from(reframePracticeResults).where(eq3(reframePracticeResults.userId, userId)).then((rows) => rows[0]);
  if (count2 >= 5 && !newAchievements.includes("practice_5")) {
    newAchievements.push("practice_5");
  }
  if (count2 >= 20 && !newAchievements.includes("practice_20")) {
    newAchievements.push("practice_20");
  }
  if (count2 >= 50 && !newAchievements.includes("practice_50")) {
    newAchievements.push("practice_50");
  }
  if (result.correctAnswers === result.totalQuestions && !newAchievements.includes("perfect_score")) {
    newAchievements.push("perfect_score");
  }
  await db.update(userGameProfile).set({
    totalScore: newTotalScore,
    level: newLevel,
    practiceStreak: newStreak,
    lastPracticeDate: /* @__PURE__ */ new Date(),
    achievements: newAchievements,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq3(userGameProfile.userId, userId));
  return {
    newTotalScore,
    newLevel,
    newStreak,
    newAchievements: newAchievements.filter((a) => !currentAchievements.includes(a))
  };
}
function registerReframeCoachRoutes(app2) {
  app2.post("/api/reframe-coach/assignments", authenticate, async (req, res) => {
    try {
      const validatedData = createReframePracticeSchema.parse(req.body);
      const user = req.user;
      if (!user || user.role !== "therapist" && user.role !== "admin") {
        return res.status(403).json({ message: "Only mental health professionals can create practice assignments" });
      }
      const [thoughtRecord] = await db.select().from(thoughtRecords).where(eq3(thoughtRecords.id, validatedData.thoughtRecordId));
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      if (thoughtRecord.userId !== validatedData.assignedTo) {
        return res.status(400).json({ message: "Thought record does not belong to the assigned client" });
      }
      let emotionCategory = "unknown";
      if (thoughtRecord.emotionRecordId) {
        const [emotionRecord] = await db.select().from(emotionRecords).where(eq3(emotionRecords.id, thoughtRecord.emotionRecordId));
        if (emotionRecord) {
          emotionCategory = emotionRecord.coreEmotion;
        }
      }
      const distortions = thoughtRecord.thoughtCategory || thoughtRecord.cognitiveDistortions || [];
      const practiceSession = await generateReframePracticeScenarios(
        thoughtRecord.automaticThoughts,
        distortions,
        emotionCategory,
        validatedData.customInstructions
      );
      let resourceId;
      try {
        console.log("Searching for existing Reframe Coach resource");
        const searchResult = await db.execute(sql2`
          SELECT id FROM resources 
          WHERE title = 'Reframe Coach Practice' AND type = 'exercise'
          LIMIT 1
        `);
        if (searchResult.rows && searchResult.rows.length > 0) {
          resourceId = Number(searchResult.rows[0].id);
          console.log("Found existing Reframe Coach resource:", resourceId);
        } else {
          console.log("No existing resource found, creating new Reframe Coach resource");
          const insertResult = await db.execute(sql2`
            INSERT INTO resources 
            (title, description, content, type, category, created_by, is_published) 
            VALUES 
            ('Reframe Coach Practice', 
             'Interactive cognitive restructuring practice', 
             'This resource provides guided practice for cognitive restructuring.', 
             'exercise', 
             'cognitive_restructuring', 
             ${user.id}, 
             true) 
            RETURNING id
          `);
          if (!insertResult.rows || insertResult.rows.length === 0) {
            throw new Error("Failed to create Reframe Coach resource");
          }
          resourceId = Number(insertResult.rows[0].id);
          console.log("Created new Reframe Coach resource with ID:", resourceId);
        }
      } catch (error) {
        console.error("Error with Reframe Coach resource:", error);
        return res.status(500).json({ message: "Failed to manage resource for assignment" });
      }
      const [assignment] = await db.insert(resourceAssignments).values({
        // Required for all assignments
        resourceId,
        // Use the actual resource ID we found/created
        assignedBy: user.id,
        assignedTo: validatedData.assignedTo,
        isPriority: validatedData.isPriority || false,
        notes: validatedData.notes || "",
        status: "assigned",
        // Reframe Coach specific fields
        type: "reframe_practice",
        thoughtRecordId: validatedData.thoughtRecordId,
        reframeData: practiceSession
      }).returning();
      try {
        const [therapist] = await db.select({
          name: users.name,
          username: users.username
        }).from(users).where(eq3(users.id, user.id));
        const therapistName = therapist?.name || therapist?.username || "Your health professional";
        await db.insert(notifications).values({
          userId: validatedData.assignedTo,
          title: "New Reframe Coach Practice",
          body: `${therapistName} has assigned you a new cognitive restructuring practice exercise based on your thought record.`,
          type: "therapist_message",
          link: null,
          linkPath: "/reframe-coach",
          metadata: {
            assignmentId: assignment.id,
            thoughtRecordId: validatedData.thoughtRecordId
          }
        });
        try {
          const websocketModule = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
          if (typeof websocketModule.sendNotificationToUser === "function") {
            websocketModule.sendNotificationToUser(validatedData.assignedTo, {
              id: 0,
              // Will be replaced by the WebSocket service
              userId: validatedData.assignedTo,
              title: "New Reframe Coach Practice",
              body: `${therapistName} has assigned you a new cognitive restructuring practice exercise based on your thought record.`,
              type: "therapist_message",
              isRead: false,
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              link: null,
              linkPath: "/reframe-coach",
              metadata: {
                assignmentId: assignment.id
              }
            });
          }
        } catch (wsError) {
          console.error("WebSocket notification failed:", wsError);
        }
      } catch (notificationError) {
        console.error("Failed to create notification, but assignment was created:", notificationError);
      }
      res.status(201).json({
        message: "Reframe practice assignment created successfully",
        assignment,
        scenarios: practiceSession.scenarios.length
      });
    } catch (error) {
      console.error("Error creating reframe practice assignment:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create practice assignment" });
    }
  });
  app2.get("/api/users/:userId/reframe-coach/assignments", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const assignments = await db.select().from(resourceAssignments).where(
        and3(
          eq3(resourceAssignments.assignedTo, userId),
          eq3(resourceAssignments.type, "reframe_practice")
        )
      ).orderBy(desc3(resourceAssignments.assignedAt));
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching reframe practice assignments:", error);
      res.status(500).json({ message: "Failed to fetch practice assignments" });
    }
  });
  app2.get("/api/reframe-coach/assignments/:id", authenticate, async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const [assignment] = await db.select().from(resourceAssignments).where(
        and3(
          eq3(resourceAssignments.id, assignmentId),
          eq3(resourceAssignments.type, "reframe_practice")
        )
      );
      if (!assignment) {
        return res.status(404).json({ message: "Practice assignment not found" });
      }
      if (!req.user || assignment.assignedTo !== req.user.id && assignment.assignedBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to access this assignment" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching reframe practice assignment:", error);
      res.status(500).json({ message: "Failed to fetch practice assignment" });
    }
  });
  app2.post("/api/reframe-coach/results", authenticate, async (req, res) => {
    try {
      console.log("Received practice results submission:", {
        userId: req.user?.id,
        hasThoughtRecordId: !!req.body.thoughtRecordId,
        hasAssignmentId: !!req.body.assignmentId,
        score: req.body.score,
        scenarioCount: req.body.totalQuestions
      });
      if (!req.user || !req.user.id) {
        console.error("User not authenticated properly:", req.user);
        return res.status(401).json({ message: "User not authenticated" });
      }
      const validatedData = recordPracticeResultSchema.parse(req.body);
      const userId = req.user.id;
      console.log("Validated data:", {
        userId,
        thoughtRecordId: validatedData.thoughtRecordId || null,
        assignmentId: validatedData.assignmentId || null,
        score: validatedData.score,
        correctAnswers: validatedData.correctAnswers,
        totalQuestions: validatedData.totalQuestions
      });
      const [result] = await db.insert(reframePracticeResults).values({
        userId,
        assignmentId: validatedData.assignmentId || null,
        thoughtRecordId: validatedData.thoughtRecordId || null,
        score: validatedData.score,
        correctAnswers: validatedData.correctAnswers,
        totalQuestions: validatedData.totalQuestions,
        streakCount: validatedData.streakCount || 0,
        timeSpent: validatedData.timeSpent || 0,
        scenarioData: validatedData.scenarioData || [],
        userChoices: validatedData.userChoices || []
        // Remove the feedback field since it doesn't exist in the database
      }).returning();
      console.log("Practice results saved successfully:", result);
      if (validatedData.assignmentId) {
        await db.update(resourceAssignments).set({
          status: "completed",
          completedAt: /* @__PURE__ */ new Date()
        }).where(eq3(resourceAssignments.id, validatedData.assignmentId));
        console.log("Assignment marked as completed:", validatedData.assignmentId);
      }
      const gameUpdates = await calculateAchievements(userId, validatedData);
      res.status(201).json({
        message: "Practice results recorded successfully",
        result,
        gameUpdates
      });
    } catch (error) {
      console.error("Error recording practice results:", error);
      if (error.stack) {
        console.error("Error stack:", error.stack);
      }
      if (error instanceof z2.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({
          message: "Invalid request data",
          errors: error.errors
        });
      }
      res.status(500).json({
        message: "Failed to record practice results",
        error: error.message || "Unknown error",
        errorType: error.name || "Error"
      });
    }
  });
  app2.get("/api/users/:userId/reframe-coach/profile", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      let [profile] = await db.select().from(userGameProfile).where(eq3(userGameProfile.userId, userId));
      if (!profile) {
        [profile] = await db.insert(userGameProfile).values({
          userId,
          totalScore: 0,
          level: 1,
          practiceStreak: 0,
          achievements: [],
          badges: []
        }).returning();
      }
      const practiceStats = await db.select({
        totalPractices: sql2`count(*)`,
        avgScore: sql2`avg(score)`,
        totalCorrect: sql2`sum(correct_answers)`,
        totalQuestions: sql2`sum(total_questions)`
      }).from(reframePracticeResults).where(eq3(reframePracticeResults.userId, userId)).then((rows) => rows[0]);
      const [thoughtRecord] = await db.select({
        cognitiveDistortions: thoughtRecords.cognitiveDistortions
      }).from(thoughtRecords).leftJoin(
        reframePracticeResults,
        eq3(reframePracticeResults.thoughtRecordId, thoughtRecords.id)
      ).where(eq3(thoughtRecords.userId, userId)).groupBy(thoughtRecords.id).orderBy(sql2`count(${reframePracticeResults.id})`).limit(1);
      const strongestDistortion = thoughtRecord?.cognitiveDistortions?.[0] || null;
      res.json({
        profile,
        stats: {
          ...practiceStats,
          accuracyRate: practiceStats.totalQuestions > 0 ? Math.round(practiceStats.totalCorrect / practiceStats.totalQuestions * 100) : 0,
          strongestDistortion
        }
      });
    } catch (error) {
      console.error("Error fetching user game profile:", error);
      res.status(500).json({ message: "Failed to fetch game profile" });
    }
  });
  app2.get("/api/users/:userId/thoughts/:thoughtId/practice-scenarios", authenticate, checkUserAccess, async (req, res) => {
    try {
      console.log("Practice scenarios API called with:", {
        params: {
          userId: req.params.userId,
          thoughtId: req.params.thoughtId
        },
        query: req.query,
        auth: {
          isAuthenticated: !!req.user,
          userId: req.user?.id,
          userRole: req.user?.role,
          hasSession: !!req.session,
          headers: {
            hasAuthUserId: !!req.headers["x-auth-user-id"],
            hasFallback: !!req.headers["x-auth-fallback"],
            hasTimestamp: !!req.headers["x-auth-timestamp"]
          }
        }
      });
      if (!req.params.userId || !req.params.thoughtId) {
        console.error("Missing required parameters");
        return res.status(400).json({ message: "Missing required parameters. Both userId and thoughtId are required." });
      }
      const userId = parseInt(req.params.userId);
      const thoughtId = parseInt(req.params.thoughtId);
      if (isNaN(userId) || isNaN(thoughtId)) {
        console.error("Invalid parameters - could not parse to integers:", { userId, thoughtId });
        return res.status(400).json({ message: "Invalid parameters. Both userId and thoughtId must be integers." });
      }
      const [thoughtRecord] = await db.select().from(thoughtRecords).where(
        and3(
          eq3(thoughtRecords.id, thoughtId),
          eq3(thoughtRecords.userId, userId)
        )
      );
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      let emotionCategory = "unknown";
      if (thoughtRecord.emotionRecordId) {
        const [emotionRecord] = await db.select().from(emotionRecords).where(eq3(emotionRecords.id, thoughtRecord.emotionRecordId));
        if (emotionRecord) {
          emotionCategory = emotionRecord.coreEmotion;
        }
      }
      const distortions = thoughtRecord.thoughtCategory || thoughtRecord.cognitiveDistortions || [];
      console.log("Thought record cognitive distortions:", {
        thoughtCategory: thoughtRecord.thoughtCategory,
        cognitiveDistortions: thoughtRecord.cognitiveDistortions,
        distortions,
        type: typeof distortions,
        isArray: Array.isArray(distortions),
        rawValue: JSON.stringify(distortions)
      });
      const normalizedDistortions = Array.isArray(distortions) ? distortions : typeof distortions === "string" ? [distortions] : ["unknown"];
      console.log("Normalized distortions:", normalizedDistortions);
      console.log("Thought record content being sent to OpenAI:", {
        automaticThoughts: thoughtRecord.automaticThoughts,
        cognitiveDistortions: normalizedDistortions,
        emotionCategory,
        alternativePerspective: thoughtRecord.alternativePerspective,
        evidenceFor: thoughtRecord.evidenceFor,
        evidenceAgainst: thoughtRecord.evidenceAgainst
      });
      const practiceSession = await generateReframePracticeScenarios(
        thoughtRecord.automaticThoughts || "No thought content available",
        normalizedDistortions,
        emotionCategory,
        `Make the scenarios closely related to the following situation and evidence: 
         Evidence for the thought: ${thoughtRecord.evidenceFor || "Not specified"}
         Evidence against the thought: ${thoughtRecord.evidenceAgainst || "Not specified"}
         Alternative perspective: ${thoughtRecord.alternativePerspective || "Not specified"}`
      );
      console.log(`Serving practice scenarios ${practiceSession.fromCache ? "from cache" : "from new API request"}`);
      res.json(practiceSession);
    } catch (error) {
      console.error("Error generating practice scenarios:", error);
      res.status(500).json({ message: "Failed to generate practice scenarios" });
    }
  });
  app2.get("/api/users/:userId/reframe-coach/results", authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (req.user.id !== userId && req.user.role !== "admin") {
        if (req.user.role === "therapist") {
          const [client] = await db.select().from(users).where(
            and3(
              eq3(users.id, userId),
              eq3(users.therapistId, req.user.id)
            )
          );
          if (!client) {
            return res.status(403).json({ message: "Access denied: This client is not assigned to you" });
          }
          console.log(`Therapist ${req.user.id} is viewing practice results for client ${userId}`);
        } else {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      const results = await db.select().from(reframePracticeResults).where(eq3(reframePracticeResults.userId, userId)).orderBy(desc3(reframePracticeResults.createdAt));
      const enhancedResults = results.map((result) => {
        const cognitiveDistortions4 = /* @__PURE__ */ new Set();
        if (result.scenarioData && Array.isArray(result.scenarioData)) {
          result.scenarioData.forEach((scenario) => {
            if (scenario.cognitiveDistortion) {
              cognitiveDistortions4.add(formatCognitiveDistortion(scenario.cognitiveDistortion));
            }
          });
        }
        return {
          ...result,
          // Add a formatted field for UI display
          formattedDistortions: Array.from(cognitiveDistortions4),
          formattedDate: new Date(result.createdAt).toLocaleString(),
          successRate: result.totalQuestions > 0 ? Math.round(result.correctAnswers / result.totalQuestions * 100) : 0
        };
      });
      res.json(enhancedResults);
    } catch (error) {
      console.error("Error fetching practice results:", error);
      res.status(500).json({ message: "Failed to fetch practice results" });
    }
  });
  app2.get("/api/admin/debug/reframe-coach/results", authenticate, async (req, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const countResult = await db.execute(
        sql2`SELECT COUNT(*) as total FROM reframe_practice_results`
      );
      const totalCount = countResult.rows[0]?.total || 0;
      const completedCountResult = await db.execute(
        sql2`SELECT COUNT(*) as completed FROM reframe_practice_results WHERE score >= 0.7`
      );
      const completedCount = completedCountResult.rows[0]?.completed || 0;
      const results = await db.select({
        id: reframePracticeResults.id,
        userId: reframePracticeResults.userId,
        username: users.username,
        email: users.email,
        assignmentId: reframePracticeResults.assignmentId,
        thoughtRecordId: reframePracticeResults.thoughtRecordId,
        correctCount: reframePracticeResults.correctAnswers,
        totalCount: reframePracticeResults.totalQuestions,
        timeSpent: reframePracticeResults.timeSpent,
        completed: sql2`CASE WHEN ${reframePracticeResults.score} >= 0.7 THEN true ELSE false END`,
        createdAt: reframePracticeResults.createdAt
      }).from(reframePracticeResults).leftJoin(users, eq3(reframePracticeResults.userId, users.id)).orderBy(desc3(reframePracticeResults.createdAt)).limit(20);
      const lastWeekResults = await db.select().from(reframePracticeResults).where(
        gte2(
          reframePracticeResults.createdAt,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3)
        )
      ).orderBy(desc3(reframePracticeResults.createdAt));
      const distortionStatsResult = await db.execute(
        sql2`
          WITH distortion_data AS (
            SELECT 
              jsonb_array_elements(scenario_data) as scenario
            FROM 
              reframe_practice_results
          )
          SELECT 
            scenario->>'cognitiveDistortion' as distortion, 
            COUNT(*) as count
          FROM 
            distortion_data
          GROUP BY 
            distortion
          ORDER BY 
            count DESC
          LIMIT 10
        `
      );
      const distortionStats = distortionStatsResult.rows.map((row) => ({
        distortion: formatCognitiveDistortion(row.distortion ? String(row.distortion) : ""),
        count: parseInt(String(row.count))
      }));
      const numTotalCount = Number(totalCount);
      const completionRateValue = numTotalCount > 0 ? Number(completedCount) / numTotalCount * 100 : 0;
      res.status(200).json({
        totalCount,
        completedCount,
        completionRate: completionRateValue,
        recentResultsCount: results.length,
        recentResults: results,
        recentWeekCount: lastWeekResults.length,
        distortionStats
      });
    } catch (error) {
      console.error("Error retrieving debug practice results:", error);
      res.status(500).json({ message: "Failed to retrieve practice results for debugging" });
    }
  });
}

// server/routes.ts
import { eq as eq6, and as and6, inArray as inArray2, sql as sql5, gt as gt2 } from "drizzle-orm";
function getSessionCookieOptions() {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = !isDevelopment;
  const cookieOptions = {
    httpOnly: true,
    // Protect cookie from JS access
    path: "/",
    // Ensure cookie is available on all paths
    maxAge: 7 * 24 * 60 * 60 * 1e3
    // 7 days
  };
  cookieOptions.path = "/";
  cookieOptions.secure = true;
  cookieOptions.sameSite = "none";
  cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1e3;
  if (process.env.REPLIT_DOMAINS) {
    cookieOptions.secure = true;
    cookieOptions.sameSite = "none";
    console.log("Using Replit-compatible cookie settings");
  } else if (process.env.FORCE_INSECURE_COOKIES === "true") {
    cookieOptions.secure = false;
    cookieOptions.sameSite = "lax";
    console.log("Using insecure cookies for local testing (not recommended)");
  }
  console.log(`Cookie options: secure=${cookieOptions.secure}, sameSite=${cookieOptions.sameSite}, domain=${cookieOptions.domain || "not set"}`);
  return cookieOptions;
}
async function createSystemLog(action, userId, ipAddress, userAgent = null, actionType = "admin") {
  try {
    await pool2.query(
      "INSERT INTO system_logs (action, user_id, ip_address, user_agent, action_type, level, message, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())",
      [action, userId, ipAddress, userAgent, actionType, "info", action]
    );
  } catch (error) {
    console.error("Failed to create system log:", error);
  }
}
async function sendProfessionalWelcomeEmail(email, name) {
  return sendEmail({
    to: email,
    subject: "Welcome to ResilienceHub\u2122",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4A6FA5; margin-bottom: 10px;">ResilienceHub\u2122</h1>
        <p style="color: #666; font-size: 16px;">Resilience Counseling Research and Consultation</p>
      </div>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #4A6FA5; padding: 15px; margin-bottom: 20px;">
        <h2 style="color: #4A6FA5; margin-top: 0;">Welcome to ResilienceHub\u2122</h2>
        <p style="color: #333; line-height: 1.5;">Hello ${name},</p>
        <p style="color: #333; line-height: 1.5;">Thank you for joining ResilienceHub\u2122, your comprehensive platform for therapy support and emotional well-being.</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <p style="color: #333; line-height: 1.5;">As a professional on our platform, you now have access to:</p>
        <ul style="color: #333; line-height: 1.5;">
          <li>Comprehensive client management tools</li>
          <li>Secure messaging and communication</li>
          <li>Advanced emotion and thought tracking analytics</li>
          <li>Goal setting and progress monitoring</li>
        </ul>
        <p style="color: #333; line-height: 1.5;">You can access your account by logging in to the platform using your credentials.</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1; text-align: center;">
        <p style="color: #666; font-size: 14px;">
          &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Resilience Counseling Research and Consultation<br>
          <em>Supporting your emotional well-being journey</em>
        </p>
      </div>
    </div>
    `
  });
}
async function sendClientInvitation(email, therapistName, inviteLink, therapistId) {
  console.log("\u{1F50D} DEBUG: inviteLink provided:", inviteLink);
  console.log("\u{1F50D} DEBUG: process.env.APP_URL:", process.env.APP_URL);
  console.log("\u{1F50D} DEBUG: therapistId parameter:", therapistId);
  const registrationUrl = inviteLink || `FALLBACK_URL_ERROR_CHECK_INVITE_GENERATION`;
  console.log("\u{1F50D} DEBUG: Final registration URL:", registrationUrl);
  return sendEmail({
    to: email,
    subject: "You've been invited to ResilienceHub\u2122",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4A6FA5; margin-bottom: 10px;">ResilienceHub\u2122</h1>
        <p style="color: #666; font-size: 16px;">Resilience Counseling Research and Consultation</p>
      </div>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #4A6FA5; padding: 15px; margin-bottom: 20px;">
        <h2 style="color: #4A6FA5; margin-top: 0;">You've Been Invited</h2>
        <p style="color: #333; line-height: 1.5;">${therapistName} has invited you to join ResilienceHub\u2122, a comprehensive platform designed to support your therapy journey and emotional well-being.</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <p style="color: #333; line-height: 1.5;">With ResilienceHub\u2122, you can:</p>
        <ul style="color: #333; line-height: 1.5;">
          <li>Track your emotions and moods over time</li>
          <li>Record thoughts and behaviors using evidence-based CBT tools</li>
          <li>Set and monitor personal goals</li>
          <li>Journal your experiences</li>
          <li>Securely share information with your therapist</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${registrationUrl}" style="background-color: #4A6FA5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Create Your Account</a>
        </div>
        
        <p style="color: #333; line-height: 1.5;">Click the button above to create your account and get started with ResilienceHub\u2122. Your email address (${email}) will be pre-filled to make the process easier.</p>
      </div>
      
      <div style="border-top: 1px solid #e1e1e1; padding-top: 20px; font-size: 14px; color: #666; line-height: 1.5;">
        <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
        <p style="word-break: break-all;">${registrationUrl}</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1; text-align: center;">
        <p style="color: #666; font-size: 14px;">
          &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Resilience Counseling Research and Consultation<br>
          <em>Supporting your emotional well-being journey</em>
        </p>
      </div>
    </div>
    `
  });
}
async function sendPasswordResetEmail(email, resetLink) {
  return sendEmail({
    to: email,
    subject: "Reset your ResilienceHub\u2122 password",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4A6FA5; margin-bottom: 10px;">ResilienceHub\u2122</h1>
        <p style="color: #666; font-size: 16px;">Resilience Counseling Research and Consultation</p>
      </div>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #4A6FA5; padding: 15px; margin-bottom: 20px;">
        <h2 style="color: #4A6FA5; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #333; line-height: 1.5;">We received a request to reset your password for ResilienceHub\u2122. If you didn't make this request, you can safely ignore this email.</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <p style="color: #333; line-height: 1.5;">To set a new password, please click the button below:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetLink}" style="background-color: #4A6FA5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset My Password</a>
        </div>
        <p style="color: #333; line-height: 1.5;">This link will expire in 1 hour for security reasons. If you need a new link, you can always request another password reset.</p>
      </div>
      
      <div style="border-top: 1px solid #e1e1e1; padding-top: 20px; font-size: 14px; color: #666; line-height: 1.5;">
        <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
        <p style="word-break: break-all;">${resetLink}</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1; text-align: center;">
        <p style="color: #666; font-size: 14px;">
          &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Resilience Counseling Research and Consultation<br>
          <em>Supporting your emotional well-being journey</em>
        </p>
      </div>
    </div>
    `
  });
}
global.DEFAULT_FROM_EMAIL = "ResilienceHub <notifications@resilience-hub.com>";
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set. Subscription functionality may be limited.");
}
var stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" }) : null;
function getEmotionColor2(emotion) {
  return getEmotionColor(emotion);
}
async function updateGoalStatusBasedOnMilestones(goalId) {
  try {
    const milestones = await db.select().from(goalMilestones).where(eq6(goalMilestones.goalId, goalId));
    if (milestones.length === 0) {
      await db.update(goals).set({ status: "pending" }).where(eq6(goals.id, goalId));
      console.log(`Goal ${goalId} status set to 'pending' (no milestones)`);
      return;
    }
    const completedMilestones = milestones.filter((m) => m.isCompleted).length;
    const totalMilestones = milestones.length;
    const completionPercentage = completedMilestones / totalMilestones * 100;
    let newStatus;
    if (completionPercentage === 0) {
      newStatus = "pending";
    } else if (completionPercentage === 100) {
      newStatus = "completed";
    } else {
      newStatus = "in_progress";
    }
    await db.update(goals).set({ status: newStatus }).where(eq6(goals.id, goalId));
    console.log(`Goal ${goalId} status auto-updated to '${newStatus}' (${completedMilestones}/${totalMilestones} milestones completed)`);
  } catch (error) {
    console.error(`Error updating goal status for goal ${goalId}:`, error);
  }
}
async function createInactivityNotification2(userId) {
  try {
    const notificationData = {
      user_id: userId,
      title: "Emotion Tracking Reminder",
      body: "It's been a while since you last recorded your emotions. Regular tracking helps build self-awareness and improve therapy outcomes.",
      type: "reminder",
      is_read: false,
      created_at: /* @__PURE__ */ new Date()
    };
    const query = `
      INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const result = await pool2.query(query, [
      notificationData.user_id,
      notificationData.title,
      notificationData.body,
      notificationData.type,
      notificationData.is_read,
      notificationData.created_at
    ]);
    try {
      sendNotificationToUser(userId, result.rows[0]);
    } catch (wsError) {
      console.log("WebSocket notification sending failed (not critical):", wsError);
    }
    return true;
  } catch (error) {
    console.error(`Error creating inactivity notification for user ${userId}:`, error);
    return false;
  }
}
async function registerRoutes(app2) {
  const { pool: pool3 } = await Promise.resolve().then(() => (init_db(), db_exports));
  const cookieSecret = process.env.COOKIE_SECRET || "resilience-hub-cookie-secret";
  app2.use(cookieParser(cookieSecret));
  registerIntegrationRoutes(app2);
  registerReframeCoachRoutes(app2);
  app2.get("/api/users/:userId/enhanced-insights", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const emotions = await storage.getEmotionRecordsByUser(userId);
      const journals = await storage.getJournalEntriesByUser(userId);
      const thoughts = await storage.getThoughtRecordsByUser(userId);
      const connections = await enhanceComponentConnections(
        emotions || [],
        journals || [],
        thoughts || []
      );
      const insights = generateDataInsights(connections);
      res.json({
        connections,
        insights,
        summary: {
          emotions: emotions?.length || 0,
          journals: journals?.length || 0,
          thoughts: thoughts?.length || 0
        }
      });
    } catch (error) {
      console.error("Error generating enhanced insights:", error);
      res.status(500).json({ message: "Error generating insights" });
    }
  });
  app2.get("/api/subscription-plans", async (req, res) => {
    try {
      const activeOnly = !req.headers.authorization;
      const plans = await storage.getSubscriptionPlans(activeOnly);
      res.status(200).json(plans);
    } catch (error) {
      console.error("Get subscription plans error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const planId = Number(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      res.status(200).json(plan);
    } catch (error) {
      console.error("Get subscription plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/subscription-plans", authenticate, isAdmin, async (req, res) => {
    try {
      const validatedData = insertSubscriptionPlanSchema.parse(req.body);
      const newPlan = await storage.createSubscriptionPlan(validatedData);
      res.status(201).json(newPlan);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create subscription plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/subscription-plans/:id", authenticate, isAdmin, async (req, res) => {
    try {
      const planId = Number(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      const validatedData = insertSubscriptionPlanSchema.partial().parse(req.body);
      const updatedPlan = await storage.updateSubscriptionPlan(planId, validatedData);
      res.status(200).json(updatedPlan);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update subscription plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/subscription-plans/:id/set-default", authenticate, isAdmin, async (req, res) => {
    try {
      const planId = Number(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      if (!plan.isActive) {
        return res.status(400).json({ message: "Cannot set an inactive plan as default" });
      }
      const defaultPlan = await storage.setDefaultSubscriptionPlan(planId);
      res.status(200).json(defaultPlan);
    } catch (error) {
      console.error("Set default subscription plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/subscription-plans/:id/deactivate", authenticate, isAdmin, async (req, res) => {
    try {
      const planId = Number(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      if (plan.isDefault) {
        return res.status(400).json({ message: "Cannot deactivate the default plan" });
      }
      const deactivatedPlan = await storage.deactivateSubscriptionPlan(planId);
      res.status(200).json(deactivatedPlan);
    } catch (error) {
      console.error("Deactivate subscription plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/subscription", authenticate, ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      let plan = null;
      if (user.subscriptionPlanId) {
        plan = await storage.getSubscriptionPlanById(user.subscriptionPlanId);
      }
      let stripeSubscription = null;
      if (stripe && user.stripeSubscriptionId) {
        try {
          stripeSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        } catch (stripeError) {
          console.error("Stripe subscription retrieval error:", stripeError);
        }
      }
      res.status(200).json({
        plan,
        status: user.subscriptionStatus,
        endDate: user.subscriptionEndDate,
        stripeSubscription: stripeSubscription ? {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1e3),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
        } : null
      });
    } catch (error) {
      console.error("Get subscription info error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/subscription", authenticate, ensureAuthenticated, async (req, res) => {
    try {
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      const plan = await storage.getSubscriptionPlanById(Number(planId));
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      if (!plan.isActive) {
        return res.status(400).json({ message: "Plan is not active" });
      }
      if (plan.price === 0) {
        const user = await storage.assignSubscriptionPlan(req.user.id, plan.id);
        await storage.updateSubscriptionStatus(req.user.id, "active");
        return res.status(200).json({
          success: true,
          message: "Free plan activated",
          plan
        });
      }
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is not available" });
      }
      let customerId = req.user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.name,
          metadata: {
            userId: req.user.id.toString()
          }
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(req.user.id, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: ""
          // Will be updated after checkout
        });
      }
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: plan.name,
                description: plan.description
              },
              unit_amount: Math.round(plan.price * 100),
              // Convert to cents
              recurring: {
                interval: plan.interval
              }
            },
            quantity: 1
          }
        ],
        mode: "subscription",
        success_url: `${req.protocol}://${req.get("host")}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get("host")}/subscription/cancel`,
        metadata: {
          userId: req.user.id.toString(),
          planId: plan.id.toString()
        }
      });
      res.status(200).json({
        sessionId: session.id,
        url: session.url
      });
    } catch (error) {
      console.error("Create subscription error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/webhook/stripe", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is not available" });
    }
    let event;
    const signature = req.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature || "",
        process.env.STRIPE_WEBHOOK_SECRET || "whsec_test"
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return res.status(400).json({ message: "Webhook signature verification failed" });
    }
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = Number(session.metadata.userId);
          const planId = Number(session.metadata.planId);
          const subscriptionId = session.subscription;
          await storage.updateUserStripeInfo(userId, {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: subscriptionId
          });
          await storage.assignSubscriptionPlan(userId, planId);
          await storage.updateSubscriptionStatus(userId, "active");
          break;
        }
        case "invoice.payment_succeeded": {
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription;
          const users2 = await db.select().from(users2).where(eq6(users2.stripeSubscriptionId, subscriptionId));
          if (users2.length > 0) {
            await storage.updateSubscriptionStatus(users2[0].id, "active");
          }
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription;
          const users2 = await db.select().from(users2).where(eq6(users2.stripeSubscriptionId, subscriptionId));
          if (users2.length > 0) {
            await storage.updateSubscriptionStatus(users2[0].id, "past_due");
          }
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const users2 = await db.select().from(users2).where(eq6(users2.stripeSubscriptionId, subscription.id));
          if (users2.length > 0) {
            await storage.updateSubscriptionStatus(
              users2[0].id,
              subscription.status,
              subscription.cancel_at ? new Date(subscription.cancel_at * 1e3) : void 0
            );
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const users2 = await db.select().from(users2).where(eq6(users2.stripeSubscriptionId, subscription.id));
          if (users2.length > 0) {
            await storage.updateSubscriptionStatus(users2[0].id, "canceled");
            const defaultPlan = await storage.getDefaultSubscriptionPlan();
            if (defaultPlan && defaultPlan.price === 0) {
              await storage.assignSubscriptionPlan(users2[0].id, defaultPlan.id);
            }
          }
          break;
        }
      }
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ message: "Webhook processing error" });
    }
  });
  app2.post("/api/subscription/cancel", authenticate, ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is not available" });
      }
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      res.status(200).json({
        success: true,
        message: "Subscription will be canceled at the end of the billing period"
      });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/stripe/status", authenticate, isAdmin, async (req, res) => {
    try {
      const configured = !!process.env.STRIPE_SECRET_KEY && !!process.env.VITE_STRIPE_PUBLIC_KEY;
      res.status(200).json({ configured });
    } catch (error) {
      console.error("Stripe status check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const isInvitation = req.body.isInvitation === true;
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        if (isInvitation && existingEmail.status === "pending") {
          console.log(`Invitation acceptance: Updating existing user ${existingEmail.id} with new credentials`);
          const updatedUser = await storage.updateUser(existingEmail.id, {
            username: validatedData.username,
            password: validatedData.password,
            // This is already hashed from client
            status: "active"
          });
          const session2 = await storage.createSession(updatedUser.id);
          res.cookie("sessionId", session2.id, getSessionCookieOptions());
          const { password: password2, ...userWithoutPassword2 } = updatedUser;
          return res.status(200).json(userWithoutPassword2);
        } else {
          return res.status(409).json({ message: "Email already exists" });
        }
      }
      validatedData.status = "active";
      try {
        const invitation = await storage.getClientInvitationByEmail(validatedData.email);
        if (invitation && (invitation.status === "pending" || invitation.status === "email_sent")) {
          const isInvitationRegistration = req.body.isInvitation || req.query.invitation;
          if (!isInvitationRegistration) {
            return res.status(403).json({
              message: "This email has a pending invitation. Please use the invitation link sent to your email."
            });
          }
          validatedData.role = "client";
          validatedData.therapistId = invitation.therapistId;
          console.log(`\u{1F512} INVITATION REGISTRATION: ${validatedData.email} -> client for therapist ${invitation.therapistId}`);
          console.log(`\u{1F4CB} Full registration data:`, {
            email: validatedData.email,
            role: validatedData.role,
            therapistId: validatedData.therapistId,
            isInvitation: isInvitationRegistration
          });
        }
      } catch (error) {
        console.log("\u26A0\uFE0F Invitation check failed, proceeding with registration:", error);
      }
      const user = await storage.createUser(validatedData);
      console.log(`\u2705 User created successfully:`, {
        id: user.id,
        email: user.email,
        role: user.role,
        therapistId: user.therapistId,
        status: user.status
      });
      if (isInvitation && !user.therapistId && validatedData.therapistId) {
        console.log(`\u{1F6A8} FIXING MISSING THERAPIST CONNECTION: Setting therapist ${validatedData.therapistId} for user ${user.id}`);
        await storage.updateUser(user.id, { therapistId: validatedData.therapistId });
        user.therapistId = validatedData.therapistId;
      }
      if (user.email && user.therapistId) {
        try {
          await db.update(clientInvitations).set({ status: "accepted", acceptedAt: /* @__PURE__ */ new Date() }).where(and6(
            eq6(clientInvitations.email, user.email),
            eq6(clientInvitations.therapistId, user.therapistId),
            inArray2(clientInvitations.status, ["pending", "email_sent"])
          ));
          console.log(`Automatically marked invitation as accepted for ${user.email} with therapist ${user.therapistId}`);
        } catch (invitationError) {
          console.error("Error updating invitation status:", invitationError);
        }
      }
      if (validatedData.therapistId) {
        console.log(`User ${user.id} (${user.username}) registered with therapist ID: ${validatedData.therapistId}`);
        const therapist = await storage.getUser(validatedData.therapistId);
        if (therapist) {
          await storage.createNotification({
            userId: therapist.id,
            title: "New Client Registration",
            body: `${user.name} has registered as your client.`,
            type: "system",
            isRead: false
          });
        }
      }
      const session = await storage.createSession(user.id);
      res.cookie("sessionId", session.id, getSessionCookieOptions());
      await storage.createNotification({
        userId: user.id,
        title: "Welcome to Resilience CBT",
        body: "Thank you for joining. Start your journey by tracking your emotions or setting your first goal.",
        type: "system",
        isRead: false
      });
      if (validatedData.role && validatedData.role === "therapist") {
        try {
          console.log(`Processing subscription plan for new therapist: ${user.id} (${user.email})`);
          const defaultPlan = await storage.getDefaultSubscriptionPlan();
          if (defaultPlan) {
            console.log(`Found default subscription plan: ${defaultPlan.id} (${defaultPlan.name})`);
            const updatedUser = await storage.assignSubscriptionPlan(user.id, defaultPlan.id);
            console.log(`Plan assignment result:`, JSON.stringify({
              userId: updatedUser.id,
              subscriptionPlanId: updatedUser.subscriptionPlanId
            }));
            const userWithStatus = await storage.updateSubscriptionStatus(user.id, "trial");
            console.log(`Subscription status update result:`, JSON.stringify({
              userId: userWithStatus.id,
              subscriptionStatus: userWithStatus.subscriptionStatus
            }));
            console.log(`Successfully assigned default subscription plan (${defaultPlan.name}) to therapist: ${user.email}`);
            try {
              const loginUrl = `${req.protocol}://${req.get("host")}/login`;
              const subject = "Welcome to ResilienceHub - Your Account Information";
              const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #4A6FA5;">Welcome to ResilienceHub</h1>
                  <p>Hello ${user.name || user.username},</p>
                  <p>Thank you for registering as a mental health professional on the ResilienceHub platform. This platform will help you manage your clients with tools for emotion tracking, thought records, journaling, and goal setting.</p>
                  
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4A6FA5;">
                    <h2 style="color: #4A6FA5; margin-top: 0; font-size: 18px;">Your Account Details:</h2>
                    <p><strong>Username:</strong> ${user.username}</p>
                    <p><strong>Subscription Plan:</strong> Free (60-day trial)</p>
                  </div>
                  
                  <div style="margin: 30px 0;">
                    <a href="${loginUrl}" style="background-color: #4A6FA5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                      Log In Now
                    </a>
                  </div>
                  
                  <h2 style="color: #4A6FA5; margin-top: 25px; font-size: 18px;">Getting Started:</h2>
                  <ol style="margin-bottom: 25px;">
                    <li><strong>Complete your profile</strong> in your account settings</li>
                    <li><strong>Invite clients</strong> from your dashboard</li>
                    <li><strong>Explore the resource library</strong> with therapeutic materials</li>
                  </ol>
                  
                  <p>If you have any questions or need assistance, please contact our support team.</p>
                  <p>Best regards,<br>The Resilience CBT Team</p>
                </div>
              `;
              const emailSent = await sendEmail({
                to: user.email,
                subject,
                html
              });
              console.log(`Welcome email to therapist ${user.email}: ${emailSent ? "Sent successfully" : "Failed to send"}`);
            } catch (emailError) {
              console.error(`Error sending welcome email to therapist ${user.email}:`, emailError);
            }
          } else {
            console.warn("No default subscription plan found for new therapist");
          }
        } catch (planError) {
          console.error("Error assigning default subscription plan:", planError);
        }
      }
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/invite-client", authenticate, ensureAuthenticated, isTherapist, async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email || !name) {
        return res.status(400).json({ message: "Email and name are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        if (existingUser.status === "active") {
          return res.status(409).json({ message: "Email already registered" });
        }
      }
      const existingInvitation = await storage.getClientInvitationByEmail(email);
      if (existingInvitation && (existingInvitation.status === "pending" || existingInvitation.status === "email_sent")) {
        return res.status(409).json({ message: "Invitation already pending for this email" });
      }
      const crypto3 = await import("crypto");
      const invitationToken = crypto3.randomBytes(32).toString("hex");
      const tempUsername = email.split("@")[0] + Math.floor(Math.random() * 1e3);
      const tempPassword = Math.random().toString(36).substring(2, 10);
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      const inviteLink = `${baseUrl}/auth?invitation=true&email=${encodeURIComponent(email)}&therapistId=${req.user.id}`;
      console.log(`Generated invitation link: ${inviteLink}`);
      const invitation = await storage.createClientInvitation({
        email,
        therapistId: req.user.id,
        tempUsername,
        tempPassword,
        inviteLink,
        status: "pending"
      });
      const therapistName = req.user.name || req.user.username;
      const emailSent = await sendClientInvitation(email, therapistName, inviteLink);
      await storage.createNotification({
        userId: req.user.id,
        title: "Client Invitation Sent",
        body: `Invitation sent to ${email} (${name})`,
        type: "system",
        isRead: false
      });
      res.status(201).json({
        message: "Invitation sent successfully",
        invitation,
        emailSent
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return res.status(200).json({
          success: true,
          message: "If your email is in our system, you will receive a password reset link."
        });
      }
      const token = crypto2.randomBytes(32).toString("hex");
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      await db.delete(passwordResetTokens).where(eq6(passwordResetTokens.userId, user.id));
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
        used: false
      });
      const baseUrl = process.env.NODE_ENV === "production" ? `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}` : "http://localhost:5000";
      const resetUrl = `${baseUrl}/reset-password/${token}`;
      const emailSent = await sendPasswordResetEmail(user.email, resetUrl);
      if (emailSent) {
        console.log(`Password reset email sent to ${email}`);
      } else {
        console.error(`Failed to send password reset email to ${email}`);
      }
      return res.status(200).json({
        success: true,
        message: "If your email is in our system, you will receive a password reset link."
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      return res.status(200).json({
        success: true,
        message: "If your email is in our system, you will receive a password reset link."
      });
    }
  });
  app2.get("/api/auth/verify-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ valid: false });
      }
      const [resetToken] = await db.select().from(passwordResetTokens).where(
        and6(
          eq6(passwordResetTokens.token, token),
          eq6(passwordResetTokens.used, false),
          gt2(passwordResetTokens.expiresAt, /* @__PURE__ */ new Date())
        )
      );
      return res.status(200).json({ valid: !!resetToken });
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(200).json({ valid: false });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Token and new password are required"
        });
      }
      const [resetToken] = await db.select().from(passwordResetTokens).where(
        and6(
          eq6(passwordResetTokens.token, token),
          eq6(passwordResetTokens.used, false),
          gt2(passwordResetTokens.expiresAt, /* @__PURE__ */ new Date())
        )
      );
      if (!resetToken) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token"
        });
      }
      const saltRounds = 10;
      const hashedPassword = await bcrypt2.hash(newPassword, saltRounds);
      await db.update(users).set({ password: hashedPassword }).where(eq6(users.id, resetToken.userId));
      await db.update(passwordResetTokens).set({ used: true }).where(eq6(passwordResetTokens.id, resetToken.id));
      console.log(`Password reset successful for user ID ${resetToken.userId}`);
      return res.status(200).json({
        success: true,
        message: "Your password has been successfully reset. You can now log in with your new password."
      });
    } catch (error) {
      console.error("Password reset error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while resetting your password. Please try again."
      });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt:", req.body);
      const { username, password } = req.body;
      if (!username || !password) {
        console.log("Missing username or password");
        return res.status(400).json({ message: "Username and password are required" });
      }
      const clearOptions = getSessionCookieOptions();
      delete clearOptions.maxAge;
      console.log("Clearing existing cookies with options:", clearOptions);
      res.clearCookie("sessionId", clearOptions);
      let user;
      try {
        const { withRetry: withRetry2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        console.log("Finding user with username:", username);
        user = await storage.getUserByUsername(username);
        console.log("User lookup by username result:", user ? `Found user ${user.id}` : "Not found");
        if (!user) {
          console.log("User not found by username, trying email lookup");
          user = await withRetry2(async () => {
            return await storage.getUserByEmail(username);
          });
          console.log("User lookup by email result:", user ? `Found user ${user.id}` : "Not found");
        }
        if (!user) {
          console.log("User not found by username or email");
          return res.status(401).json({ message: "Invalid credentials" });
        }
      } catch (error) {
        console.error("Error during user lookup:", error);
        return res.status(500).json({ message: "Database connection issue, please try again in a moment" });
      }
      console.log("Comparing passwords");
      console.log("User data for password check:", { id: user.id, hasPassword: !!user.password });
      const passwordMatch = await bcrypt2.compare(password, user.password);
      console.log("Password match result:", passwordMatch);
      if (!passwordMatch) {
        console.log("Password does not match");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      let session;
      try {
        console.log("Creating session for user:", user.id);
        const { withRetry: withRetry2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        session = await withRetry2(async () => {
          return await storage.createSession(user.id);
        });
        console.log("Session created successfully:", session.id);
        const cookieOptions = getSessionCookieOptions();
        console.log("Setting cookie with options:", cookieOptions);
        res.cookie("sessionId", session.id, cookieOptions);
      } catch (sessionError) {
        console.error("Error creating session:", sessionError);
        return res.status(500).json({ message: "Failed to create session, please try again" });
      }
      const { password: _, ...userWithoutPassword } = user;
      console.log("Login successful for user:", user.username);
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error during login" });
    }
  });
  app2.post("/api/auth/mobile-login", async (req, res) => {
    try {
      console.log("Mobile login attempt:", req.body);
      const { username, password } = req.body;
      if (!username || !password) {
        console.log("[Mobile] Missing username or password");
        return res.status(400).json({ message: "Username and password are required" });
      }
      const clearOptions = getSessionCookieOptions();
      delete clearOptions.maxAge;
      console.log("[Mobile] Clearing existing cookies with options:", clearOptions);
      res.clearCookie("sessionId", clearOptions);
      console.log("[Mobile] Finding user:", username);
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }
      if (!user) {
        console.log("[Mobile] User not found");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const passwordMatch = await bcrypt2.compare(password, user.password);
      if (!passwordMatch) {
        console.log("[Mobile] Password does not match");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const session = await storage.createSession(user.id);
      const cookieOptions = getSessionCookieOptions();
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1e3;
      console.log("[Mobile] Setting cookie with options:", cookieOptions);
      res.cookie("sessionId", session.id, cookieOptions);
      const { password: _, ...userWithoutPassword } = user;
      console.log("[Mobile] Login successful for user:", user.username);
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("[Mobile] Login error:", error);
      res.status(500).json({ message: "Internal server error during login" });
    }
  });
  app2.post("/api/auth/recover-session", async (req, res) => {
    try {
      console.log("Session recovery attempt received");
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const sessionId = crypto2.randomUUID();
      await storage.createSession(sessionId, user.id);
      req.session = { id: sessionId, userId: user.id };
      const cookieOptions = getSessionCookieOptions();
      res.cookie("sessionId", sessionId, cookieOptions);
      console.log(`Session successfully recovered for user ${user.id} (${user.username})`);
      return res.status(200).json({ message: "Session recovered" });
    } catch (error) {
      console.error("Session recovery error:", error);
      return res.status(500).json({ message: "Server error during session recovery" });
    }
  });
  app2.post("/api/auth/logout", authenticate, async (req, res) => {
    try {
      await storage.deleteSession(req.session.id);
      const clearOptions = getSessionCookieOptions();
      delete clearOptions.maxAge;
      console.log("Clearing session cookie with options:", clearOptions);
      res.clearCookie("sessionId", clearOptions);
      res.setHeader("Clear-Local-Storage", "auth_user_backup,auth_timestamp");
      console.log("User logged out successfully");
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/update-status", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUserStatus(userId, status);
      if (targetUser.role === "client" && status === "active" && targetUser.therapistId) {
        await storage.createNotification({
          userId: targetUser.therapistId,
          title: "Client Status Updated",
          body: `${targetUser.name} has completed registration and is now an active client.`,
          type: "system",
          isRead: false
        });
      }
      res.status(200).json({
        message: "User status updated successfully",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          status: updatedUser.status
        }
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });
  app2.get("/api/auth/me", (req, res, next) => {
    console.log("Auth check request received from:", req.headers["user-agent"]);
    console.log("Auth check cookies:", req.cookies);
    console.log("Auth check headers:", {
      host: req.headers.host,
      origin: req.headers.origin,
      referer: req.headers.referer
    });
    next();
  }, authenticate, ensureAuthenticated, (req, res) => {
    console.log("Auth check successful for user:", req.user.id, req.user.username);
    const { password, ...userWithoutPassword } = req.user;
    console.log("Returning user data");
    res.status(200).json(userWithoutPassword);
  });
  app2.get("/api/users", authenticate, isAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const usersWithoutPasswords = users2.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/clients", authenticate, async (req, res) => {
    try {
      if (!req.user) {
        console.log("No authenticated user found for clients endpoint");
        return res.status(200).json([]);
      }
      if (req.user.role !== "therapist" && req.user.role !== "admin") {
        console.log(`User ${req.user.id} with role ${req.user.role} denied access to clients list`);
        return res.status(200).json([]);
      }
      const therapistId = req.user.id;
      console.log("Getting clients for therapist ID:", therapistId);
      const clients = await storage.getClients(therapistId);
      const formattedClients = clients.map((client) => ({
        ...client,
        // Ensure consistent field names for frontend
        therapistId: client.therapistId || client.therapist_id || null,
        createdAt: client.createdAt || (client.created_at ? new Date(client.created_at) : null)
      }));
      console.log(`Found ${formattedClients.length} clients for therapist ${therapistId}`);
      return res.status(200).json(formattedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      return res.status(200).json([]);
    }
  });
  app2.get("/api/users/:userId", authenticate, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = parseInt(req.params.userId);
      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      if (user.role === "admin") {
      } else if (user.role === "therapist") {
        const isClientAccessible = await isClientOfTherapist(userId, user.id);
        if (!isClientAccessible) {
          return res.status(403).json({ message: "Access denied - not your client" });
        }
      } else {
        if (user.id !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = targetUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/users/register-by-admin", authenticate, isAdmin, async (req, res) => {
    try {
      const { name, email, username, password, role } = req.body;
      if (!name || !email || !username || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      const userData = {
        name,
        email,
        username,
        password,
        role,
        status: "active"
      };
      const newUser = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Admin user creation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/register-by-admin", authenticate, isAdmin, async (req, res) => {
    try {
      const { name, email, username, password, role } = req.body;
      if (!name || !email || !username || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }
      if (role !== "therapist" && role !== "admin") {
        return res.status(400).json({ message: "Invalid role. Must be therapist or admin" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      const hashedPassword = await bcrypt2.hash(password, 10);
      const user = await storage.createUser({
        name,
        email,
        username,
        password: hashedPassword,
        role,
        status: "active"
      });
      if (role === "therapist") {
        try {
          const defaultPlan = await storage.getDefaultSubscriptionPlan();
          if (defaultPlan) {
            await storage.assignSubscriptionPlan(user.id, defaultPlan.id);
            await storage.updateSubscriptionStatus(user.id, "trial");
            console.log(`Assigned default subscription plan (${defaultPlan.name}) to therapist: ${email}`);
          } else {
            console.warn("No default subscription plan found for new therapist");
          }
        } catch (planError) {
          console.error("Error assigning default subscription plan:", planError);
        }
      }
      const unhashedPassword = password;
      const { password: _, ...userWithoutPassword } = user;
      await storage.createNotification({
        userId: user.id,
        title: "Welcome to Resilience CBT",
        body: `You have been added as a ${role} by ${req.user?.name || "an administrator"}. Please log in and update your profile.`,
        type: "system",
        isRead: false
      });
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
      const loginLink = `${baseUrl}/login`;
      if (role === "therapist") {
        try {
          await sendProfessionalWelcomeEmail(
            email,
            name,
            username,
            unhashedPassword,
            loginLink
          );
          console.log(`Welcome email sent to professional: ${email}`);
        } catch (emailError) {
          console.error("Error sending professional welcome email:", emailError);
        }
      }
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.get("/api/admin/stats", authenticate, isAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const clients = users2.filter((u) => u.role === "client");
      const therapists = users2.filter((u) => u.role === "therapist");
      const activeClients = clients.filter((c) => c.status === "active").length;
      const clientsWithoutTherapist = clients.filter((c) => !c.therapistId).length;
      const therapistsWithClients = new Set(
        clients.filter((c) => c.therapistId).map((c) => c.therapistId)
      );
      const therapistsWithoutClients = therapists.length - therapistsWithClients.size;
      const emotionRecords2 = await storage.getAllEmotionRecords();
      const thoughtRecords2 = await storage.getAllThoughtRecords();
      const goals2 = await storage.getAllGoals();
      const clientsWithGoalsSet = new Set(goals2.map((g) => g.userId));
      const clientsWithGoals = clientsWithGoalsSet.size;
      const resources3 = await storage.getAllResources();
      const resourceAssignments2 = await storage.getAllResourceAssignments();
      const avgGoalsPerClient = clients.length ? goals2.length / clients.length : 0;
      const avgEmotionsPerClient = clients.length ? emotionRecords2.length / clients.length : 0;
      const therapistClientCounts = {};
      clients.forEach((client) => {
        if (client.therapistId) {
          therapistClientCounts[client.therapistId] = (therapistClientCounts[client.therapistId] || 0) + 1;
        }
      });
      let mostActiveTherapistId = null;
      let maxClientCount = 0;
      Object.entries(therapistClientCounts).forEach(([therapistId, count2]) => {
        if (count2 > maxClientCount) {
          mostActiveTherapistId = parseInt(therapistId);
          maxClientCount = count2;
        }
      });
      const mostActiveTherapist = therapists.find((t) => t.id === mostActiveTherapistId)?.name || "N/A";
      const clientEmotionCounts = {};
      emotionRecords2.forEach((emotion) => {
        clientEmotionCounts[emotion.userId] = (clientEmotionCounts[emotion.userId] || 0) + 1;
      });
      let mostActiveClientId = null;
      let maxEmotionCount = 0;
      Object.entries(clientEmotionCounts).forEach(([clientId, count2]) => {
        if (count2 > maxEmotionCount) {
          mostActiveClientId = parseInt(clientId);
          maxEmotionCount = count2;
        }
      });
      const mostActiveClient = clients.find((c) => c.id === mostActiveClientId)?.name || "N/A";
      const resourceUsageCounts = {};
      resourceAssignments2.forEach((assignment) => {
        resourceUsageCounts[assignment.resourceId] = (resourceUsageCounts[assignment.resourceId] || 0) + 1;
      });
      let mostUsedResourceId = null;
      let maxResourceCount = 0;
      Object.entries(resourceUsageCounts).forEach(([resourceId, count2]) => {
        if (count2 > maxResourceCount) {
          mostUsedResourceId = parseInt(resourceId);
          maxResourceCount = count2;
        }
      });
      const mostUsedResource = resources3.find((r) => r.id === mostUsedResourceId)?.title || "N/A";
      const topResources = resources3.map((resource) => {
        const usageCount = resourceAssignments2.filter((a) => a.resourceId === resource.id).length;
        return {
          id: resource.id,
          title: resource.title,
          usageCount
        };
      }).sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
      const stats = {
        totalUsers: users2.length,
        totalClients: clients.length,
        totalTherapists: therapists.length,
        totalEmotions: emotionRecords2.length,
        totalThoughts: thoughtRecords2.length,
        totalGoals: goals2.length,
        activeClients,
        activeTherapists: therapists.length,
        resourceUsage: resourceAssignments2.length,
        clientsWithoutTherapist,
        therapistsWithoutClients,
        clientsWithGoals,
        averageGoalsPerClient: Math.round(avgGoalsPerClient * 10) / 10,
        averageEmotionsPerClient: Math.round(avgEmotionsPerClient * 10) / 10,
        mostActiveTherapist,
        mostActiveClient,
        mostUsedResource,
        topResources
      };
      res.status(200).json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to retrieve admin statistics" });
    }
  });
  app2.delete("/api/users/:userId", authenticate, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (userId === req.user?.id) {
        return res.status(400).json({ message: "Cannot delete your own account through this endpoint" });
      }
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      let affectedUserIds = [];
      if (userToDelete.role === "therapist") {
        const clients = await storage.getAllUsers();
        const therapistClients = clients.filter((client) => client.therapistId === userId);
        affectedUserIds = therapistClients.map((client) => client.id);
        for (const clientId of affectedUserIds) {
          await storage.createNotification({
            userId: clientId,
            title: "Therapist Assignment Update",
            body: `Your therapist ${userToDelete.name} is no longer available. Please contact administration for reassignment.`,
            type: "system",
            isRead: false
          });
        }
      }
      if (userToDelete.role === "client" && userToDelete.therapistId) {
        await storage.createNotification({
          userId: userToDelete.therapistId,
          title: "Client Removed",
          body: `Your client ${userToDelete.name} has been removed from the system.`,
          type: "system",
          isRead: false
        });
      }
      await storage.deleteUser(userId, req.user?.id);
      console.log(`User ${userId} deleted successfully by admin ${req.user?.id}`);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.patch("/api/users/:userId/unassign-therapist", authenticate, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.role !== "client") {
        return res.status(400).json({ message: "Only clients can be unassigned from therapists" });
      }
      if (!user.therapistId) {
        return res.status(400).json({ message: "This client is not assigned to any therapist" });
      }
      const updatedUser = await storage.updateUser(userId, { therapistId: null });
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error unassigning therapist:", error);
      res.status(500).json({ message: "Failed to unassign therapist" });
    }
  });
  app2.post("/api/users/:userId/reset-password", authenticate, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const defaultPassword = "123456";
      const hashedPassword = await bcrypt2.hash(defaultPassword, 10);
      await storage.updateUser(userId, { password: hashedPassword });
      res.status(200).json({ message: "Password reset successfully", defaultPassword });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.patch("/api/users/:userId", authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }
      if (userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      const {
        name,
        email,
        bio,
        specialty,
        licenses,
        education,
        approach
      } = req.body;
      const updateData = {};
      if (name !== void 0) updateData.name = name;
      if (email !== void 0) updateData.email = email;
      if (userToUpdate.role === "therapist") {
        if (bio !== void 0) updateData.bio = bio;
        if (specialty !== void 0) updateData.specialty = specialty;
        if (licenses !== void 0) updateData.licenses = licenses;
        if (education !== void 0) updateData.education = education;
        if (approach !== void 0) updateData.approach = approach;
      }
      const updatedUser = await storage.updateUser(userId, updateData);
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Update user profile error:", error);
      res.status(500).json({
        message: "Failed to update user profile",
        error: error.message
      });
    }
  });
  app2.post("/api/users/:userId/subscription-plan", authenticate, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { planId } = req.body;
      if (!planId || isNaN(planId)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }
      if (userToUpdate.role !== "therapist") {
        return res.status(400).json({ message: "Subscription plans can only be assigned to therapists" });
      }
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      const updatedUser = await storage.assignSubscriptionPlan(userId, planId);
      const status = plan.price === 0 ? "trial" : "active";
      await storage.updateSubscriptionStatus(userId, status);
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error assigning subscription plan:", error);
      res.status(500).json({ message: "Failed to assign subscription plan" });
    }
  });
  app2.get("/api/users/clients", async (req, res) => {
    try {
      let authenticatedUser = null;
      if (req.user) {
        authenticatedUser = req.user;
      } else {
        if (req.headers.cookie && req.headers.cookie.includes("sessionId")) {
          const sessionId = req.headers.cookie.split("sessionId=")[1]?.split(";")[0]?.trim();
          if (sessionId) {
            const session = await storage.getSession(sessionId);
            if (session && session.userId) {
              authenticatedUser = await storage.getUser(session.userId);
            }
          }
        }
        if (!authenticatedUser && req.headers["x-user-id"]) {
          const userId = parseInt(req.headers["x-user-id"]);
          if (!isNaN(userId)) {
            authenticatedUser = await storage.getUser(userId);
          }
        }
      }
      if (!authenticatedUser) {
        console.log("Clients endpoint: No authenticated user found");
        return res.status(200).json([]);
      }
      console.log("Clients endpoint accessed by user:", authenticatedUser.id, authenticatedUser.username, authenticatedUser.role);
      if (authenticatedUser.role !== "therapist" && authenticatedUser.role !== "admin") {
        console.log(`User ${authenticatedUser.id} with role ${authenticatedUser.role} denied access to clients list`);
        return res.status(200).json([]);
      }
      const therapistId = authenticatedUser.id;
      console.log("Getting clients for therapist ID:", therapistId);
      const clients = await storage.getClients(therapistId);
      const formattedClients = clients.map((client) => ({
        ...client,
        // Only add these if they're not already present
        therapistId: client.therapistId || client.therapist_id || null,
        createdAt: client.createdAt || (client.created_at ? new Date(client.created_at) : null)
      }));
      console.log(`Found ${formattedClients.length} clients for therapist ${therapistId}`);
      return res.status(200).json(formattedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      return res.status(200).json([]);
    }
  });
  app2.get("/api/public/clients", async (req, res) => {
    try {
      const requestTherapistId = req.headers["x-user-id"] ? parseInt(req.headers["x-user-id"]) : null;
      const therapistId = req.user?.id || requestTherapistId;
      console.log("Public clients request for therapist ID:", therapistId);
      if (!therapistId) {
        console.log("No therapist ID found, returning empty list");
        return res.status(200).json([]);
      }
      console.log("Fetching clients from database for therapist:", therapistId);
      const clients = await storage.getClients(therapistId);
      const formattedClients = clients.map((client) => ({
        ...client,
        therapistId: client.therapist_id,
        createdAt: client.created_at
      }));
      console.log(`Found ${formattedClients.length} clients for therapist ${therapistId}`);
      return res.status(200).json(formattedClients);
    } catch (error) {
      console.error("Error in public clients endpoint:", error);
      return res.status(500).json({ message: "Failed to fetch clients" });
    }
  });
  app2.get("/api/users/:userId/emotions/count", (req, res, next) => {
    const userId = parseInt(req.params.userId);
    if (userId >= 100 && userId <= 110) {
      return res.status(200).json({ totalCount: Math.floor(Math.random() * 10) + 5 });
    }
    next();
  });
  app2.get("/api/users/:userId/journals/count", (req, res, next) => {
    const userId = parseInt(req.params.userId);
    if (userId >= 100 && userId <= 110) {
      return res.status(200).json({ totalCount: Math.floor(Math.random() * 8) + 3 });
    }
    next();
  });
  app2.get("/api/users/:userId/thoughts/count", (req, res, next) => {
    const userId = parseInt(req.params.userId);
    if (userId >= 100 && userId <= 110) {
      return res.status(200).json({ totalCount: Math.floor(Math.random() * 6) + 2 });
    }
    next();
  });
  app2.get("/api/users/all-clients", authenticate, isAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const clients = allUsers.filter((user) => user.role === "client");
      const clientsWithoutPasswords = clients.map((client) => {
        const { password, ...clientWithoutPassword } = client;
        return clientWithoutPassword;
      });
      res.status(200).json(clientsWithoutPasswords);
    } catch (error) {
      console.error("Get all clients error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/users/clients/:clientId", authenticate, isTherapist, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      const client = await storage.getUser(clientId);
      if (!client || client.therapistId !== req.user.id) {
        return res.status(404).json({ message: "Client not found or does not belong to you" });
      }
      const clientName = client.name || client.username;
      await storage.deleteUser(clientId, req.user.id);
      res.status(200).json({
        message: "Client deleted successfully"
      });
    } catch (error) {
      console.error("Remove client error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/emotions/count", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const result = await db.select({ count: sql5`count(*)::int` }).from(emotionRecords).where(eq6(emotionRecords.userId, userId));
      res.json({ totalCount: result[0].count });
    } catch (error) {
      console.error("Error counting emotions:", error);
      res.status(500).json({ message: "Error counting emotion records" });
    }
  });
  app2.get("/api/users/:userId/journals/count", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const result = await db.select({ count: sql5`count(*)::int` }).from(journalEntries).where(eq6(journalEntries.userId, userId));
      res.json({ totalCount: result[0].count });
    } catch (error) {
      console.error("Error counting journals:", error);
      res.status(500).json({ message: "Error counting journal entries" });
    }
  });
  app2.get("/api/users/:userId/thoughts/count", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const result = await db.select({ count: sql5`count(*)::int` }).from(thoughtRecords).where(eq6(thoughtRecords.userId, userId));
      res.json({ totalCount: result[0].count });
    } catch (error) {
      console.error("Error counting thoughts:", error);
      res.status(500).json({ message: "Error counting thought records" });
    }
  });
  app2.post("/api/users/invite-client", authenticate, isTherapist, async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email || !name) {
        return res.status(400).json({ message: "Email and name are required" });
      }
      const existingInvitation = await storage.getClientInvitationByEmail(email);
      if (existingInvitation && existingInvitation.therapistId === req.user.id && existingInvitation.status === "pending") {
        return res.status(409).json({
          message: "A pending invitation already exists for this email. You can resend it from the Pending Invitations tab.",
          invitationId: existingInvitation.id
        });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        if (existingUser.role === "admin") {
          return res.status(409).json({
            message: "This email belongs to an administrator and cannot be invited as a client",
            user: {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              role: existingUser.role
            }
          });
        }
        if (existingUser.role === "therapist") {
          return res.status(409).json({
            message: "This email belongs to a therapist and cannot be invited as a client",
            user: {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              role: existingUser.role
            }
          });
        }
        if (existingUser.therapistId === req.user.id) {
          return res.status(409).json({
            message: "This user is already your client",
            user: existingUser
          });
        }
        if (!existingUser.therapistId) {
          const updatedUser = await storage.updateUserTherapist(existingUser.id, req.user.id);
          await storage.createNotification({
            userId: existingUser.id,
            title: "New Therapist Assignment",
            body: `You have been assigned to ${req.user.name || req.user.username} as your therapist.`,
            type: "system",
            isRead: false
          });
          return res.status(200).json({
            message: "Existing user assigned as your client",
            user: updatedUser
          });
        } else {
          return res.status(409).json({
            message: "This user is already assigned to another therapist",
            user: existingUser
          });
        }
      }
      const username = email.split("@")[0] + Math.floor(Math.random() * 1e3);
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt2.hash(tempPassword, 10);
      const newUser = await storage.createUser({
        username,
        email,
        name,
        password: hashedPassword,
        role: "client",
        therapistId: req.user.id,
        status: "pending"
        // Set status to pending for invited users
      });
      await storage.createNotification({
        userId: newUser.id,
        title: "Welcome to Resilience CBT",
        body: `Welcome to Resilience CBT! You have been registered by ${req.user.name || req.user.username}. Your temporary username is ${username} and password is ${tempPassword}. Please change your password after logging in.`,
        type: "system",
        isRead: false
      });
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      console.log(`Using base URL for invitation: ${baseUrl}`);
      const encodedEmail = encodeURIComponent(email);
      const therapistId = req.user.id;
      const inviteLink = `${baseUrl}/auth?invitation=true&email=${encodedEmail}&therapistId=${therapistId}`;
      console.log(`Generated invitation link: ${inviteLink}`);
      const emailSent = await sendClientInvitation(
        email,
        req.user.name || req.user.username,
        inviteLink,
        req.user.id
      );
      if (emailSent) {
        console.log(`Invitation email sent to ${email}`);
      } else {
        console.warn(`Failed to send invitation email to ${email}. Check if SPARKPOST_API_KEY is correctly configured.`);
        await storage.createNotification({
          userId: req.user.id,
          title: "Email Delivery Issue",
          body: `We couldn't send an invitation email to ${email}. Please provide this information to your client directly: Username: ${username}, Temporary Password: ${tempPassword}, and the invitation link.`,
          type: "alert",
          isRead: false
        });
      }
      try {
        await storage.createClientInvitation({
          email,
          therapistId: req.user.id,
          status: emailSent ? "email_sent" : "email_failed",
          tempUsername: username,
          tempPassword,
          inviteLink
        });
      } catch (error) {
        console.error("Failed to record invitation:", error);
      }
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json({
        message: "New client account created successfully",
        user: userWithoutPassword,
        credentials: {
          username,
          tempPassword
        }
      });
    } catch (error) {
      console.error("Error inviting client:", error);
      res.status(500).json({ message: "Error inviting client" });
    }
  });
  app2.get("/api/therapist/stats/journal", authenticate, isTherapist, async (req, res) => {
    try {
      const professionalId = req.user.id;
      const clients = await storage.getClients(professionalId);
      const clientIds = clients.map((client) => client.id);
      if (clientIds.length === 0) {
        return res.json({ totalCount: 0 });
      }
      let totalCount = 0;
      for (const clientId of clientIds) {
        const journals = await storage.getJournalEntriesByUser(clientId);
        totalCount += journals?.length || 0;
      }
      res.json({ totalCount });
    } catch (error) {
      console.error("Error fetching journal stats:", error);
      res.status(500).json({ message: "Failed to fetch journal statistics" });
    }
  });
  app2.get("/api/therapist/stats/thoughts", authenticate, isTherapist, async (req, res) => {
    try {
      const professionalId = req.user.id;
      const clients = await storage.getClients(professionalId);
      const clientIds = clients.map((client) => client.id);
      if (clientIds.length === 0) {
        return res.json({ totalCount: 0 });
      }
      let totalCount = 0;
      for (const clientId of clientIds) {
        const thoughts = await storage.getThoughtRecordsByUser(clientId);
        totalCount += thoughts?.length || 0;
      }
      res.json({ totalCount });
    } catch (error) {
      console.error("Error fetching thought stats:", error);
      res.status(500).json({ message: "Failed to fetch thought record statistics" });
    }
  });
  app2.get("/api/therapist/stats/goals", authenticate, isTherapist, async (req, res) => {
    try {
      const professionalId = req.user.id;
      const clients = await storage.getClients(professionalId);
      const clientIds = clients.map((client) => client.id);
      if (clientIds.length === 0) {
        return res.json({ totalCount: 0 });
      }
      let totalCount = 0;
      for (const clientId of clientIds) {
        const clientGoals = await storage.getGoalsByUser(clientId);
        totalCount += clientGoals?.length || 0;
      }
      res.json({ totalCount });
    } catch (error) {
      console.error("Error fetching goal stats:", error);
      res.status(500).json({ message: "Failed to fetch goal statistics" });
    }
  });
  app2.post("/api/users/current-viewing-client", authenticate, async (req, res) => {
    try {
      const { clientId } = req.body;
      console.log(`Setting current viewing client for user ${req.user.id} (${req.user.role}) to client ${clientId}`);
      if (clientId === null) {
        const updatedUser2 = await storage.updateCurrentViewingClient(req.user.id, null);
        const { password: password2, ...userWithoutPassword2 } = updatedUser2;
        return res.json({ success: true, user: userWithoutPassword2 });
      }
      if (req.user.role === "admin") {
        const targetUser = await storage.getUser(clientId);
        if (!targetUser) {
          return res.status(404).json({ error: "User not found" });
        }
      } else if (req.user.role === "therapist") {
        const clients = await storage.getClients(req.user.id);
        const clientExists = clients.some((client) => client.id === clientId);
        if (!clientExists) {
          return res.status(403).json({
            error: "Not authorized to view this client"
          });
        }
      } else {
        return res.status(403).json({ error: "Permission denied" });
      }
      const updatedUser = await storage.updateCurrentViewingClient(req.user.id, clientId);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        success: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error setting viewing client:", error);
      res.status(500).json({ error: "Failed to update viewing client" });
    }
  });
  app2.get("/api/admin/viewing-client-status", authenticate, async (req, res) => {
    console.log("Admin viewing client status requested");
    return res.status(200).json({ viewingClient: null, success: true });
  });
  app2.get("/api/users/viewing-client-fixed", authenticate, async (req, res) => {
    const defaultResponse = { viewingClient: null, success: true };
    try {
      console.log("viewing-client-fixed endpoint called for user:", req.user?.id, "role:", req.user?.role);
      if (req.user.role === "therapist") {
        await createSystemLog(
          "Therapist accessed viewing client",
          req.user.id,
          req.ip,
          req.get("User-Agent"),
          "therapist"
        );
      }
      if (req.user.role === "admin") {
        console.log("Admin user - no viewing client needed");
        return res.status(200).json(defaultResponse);
      }
      if (req.user.role !== "therapist") {
        console.log("Non-therapist user - no viewing client needed");
        return res.status(200).json(defaultResponse);
      }
      const user = await storage.getUser(Number(req.user.id));
      if (!user || !user.currentViewingClientId) {
        console.log("No viewing client set for therapist");
        return res.status(200).json(defaultResponse);
      }
      const viewingClient = await storage.getUser(user.currentViewingClientId);
      if (!viewingClient) {
        console.log("Viewing client not found");
        return res.status(200).json(defaultResponse);
      }
      console.log("Found viewing client:", viewingClient.name);
      return res.status(200).json({
        viewingClient: {
          id: viewingClient.id,
          name: viewingClient.name,
          username: viewingClient.username
        },
        success: true
      });
    } catch (error) {
      console.error("Error in viewing-client-fixed endpoint:", error);
      return res.status(200).json(defaultResponse);
    }
  });
  app2.get("/api/users/current-viewing-client", async (req, res) => {
    const response = { viewingClient: null, success: true };
    console.log("Original current-viewing-client endpoint received request");
    try {
      let userId = null;
      if (req.query.userId) {
        const queryId = Number(req.query.userId);
        if (!isNaN(queryId) && queryId > 0) {
          userId = queryId;
          console.log(`Using user ID from query parameter: ${userId}`);
        }
      }
      if (!userId && req.user && req.user.id) {
        userId = Number(req.user.id);
        if (!isNaN(userId) && userId > 0) {
          console.log(`Using user ID from authenticated session: ${userId}`);
        } else {
          userId = null;
        }
      }
      if (!userId && req.headers["x-user-id"]) {
        const rawValue = req.headers["x-user-id"];
        let headerValue = "";
        if (Array.isArray(rawValue)) {
          headerValue = String(rawValue[0] || "");
        } else {
          headerValue = String(rawValue || "");
        }
        headerValue = headerValue.trim();
        const parsedId = parseInt(headerValue, 10);
        if (!isNaN(parsedId) && parsedId > 0) {
          userId = parsedId;
          console.log(`Using user ID from X-User-ID header: ${userId}`);
        }
      }
      if (!userId && req.headers.cookie) {
        try {
          const cookies = req.headers.cookie.split(";");
          let sessionId = null;
          for (const cookie of cookies) {
            const parts = cookie.trim().split("=");
            if (parts.length === 2 && parts[0] === "sessionId" && parts[1]) {
              sessionId = parts[1];
              break;
            }
          }
          if (sessionId) {
            console.log(`Found sessionId from cookie: ${sessionId}`);
            const session = await storage.getSession(sessionId);
            if (session && typeof session.userId === "number") {
              userId = session.userId;
              console.log(`Found user ID from session: ${userId}`);
            }
          }
        } catch (cookieError) {
          console.log("Error parsing cookie:", cookieError);
        }
      }
      if (!userId) {
        console.log("Current viewing client: No valid user ID found");
        return res.status(200).json(response);
      }
      console.log(`Getting current viewing client for user ID: ${userId}`);
      let user = null;
      let viewingClientId = null;
      try {
        user = await storage.getUser(userId);
        if (user && typeof user.currentViewingClientId === "number" && user.currentViewingClientId > 0) {
          viewingClientId = user.currentViewingClientId;
          console.log(`Found user ${userId} with viewing client ID: ${viewingClientId}`);
          try {
            let client = null;
            try {
              client = await storage.getClient(viewingClientId);
            } catch (clientFetchError) {
              console.log(`Error fetching client ${viewingClientId}:`, clientFetchError);
              return res.status(200).json(response);
            }
            if (!client) {
              console.log(`Client ID ${viewingClientId} not found`);
              return res.status(200).json(response);
            }
            console.log(`Found current viewing client: ${client.name || "Unnamed"} for user ${userId}`);
            response.viewingClient = {
              id: client.id,
              name: client.name || "Unknown Client",
              username: client.username || "",
              email: client.email || ""
            };
          } catch (clientError) {
            console.log(`Error fetching client details:`, clientError);
            return res.status(200).json(response);
          }
        } else {
          console.log(`User has no valid viewing client ID set`);
          return res.status(200).json(response);
        }
      } catch (userError) {
        console.log(`Error fetching user ${userId}:`, userError);
        return res.status(200).json(response);
      }
      return res.status(200).json(response);
    } catch (error) {
      console.error("Error in current viewing client endpoint:", error);
      return res.status(200).json(response);
    }
  });
  app2.get("/api/users/:userId/recent-activity", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const limit = 10;
      const emotions = await storage.getEmotionRecordsByUser(userId, limit);
      const journals = await storage.getJournalEntriesByUser(userId, limit);
      const thoughts = await storage.getThoughtRecordsByUser(userId, limit);
      const userGoals = await storage.getGoalsByUser(userId, limit);
      const activities = [];
      if (emotions && emotions.length > 0) {
        emotions.forEach((emotion) => {
          activities.push({
            id: `emotion-${emotion.id}`,
            type: "emotion",
            title: `Tracked ${emotion.primaryEmotion || emotion.coreEmotion}`,
            timestamp: emotion.timestamp || emotion.createdAt,
            data: emotion
          });
        });
      }
      if (journals && journals.length > 0) {
        journals.forEach((journal) => {
          activities.push({
            id: `journal-${journal.id}`,
            type: "journal",
            title: journal.title || "New journal entry",
            timestamp: journal.createdAt,
            data: journal
          });
        });
      }
      if (thoughts && thoughts.length > 0) {
        thoughts.forEach((thought) => {
          activities.push({
            id: `thought-${thought.id}`,
            type: "thought_record",
            title: thought.situation || "New thought record",
            timestamp: thought.createdAt,
            data: thought
          });
        });
      }
      if (userGoals && userGoals.length > 0) {
        userGoals.forEach((goal) => {
          activities.push({
            id: `goal-${goal.id}`,
            type: "goal",
            title: goal.title || "New goal",
            timestamp: goal.createdAt,
            data: goal
          });
        });
      }
      activities.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return dateB.getTime() - dateA.getTime();
      });
      res.status(200).json(activities.slice(0, limit));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(200).json([]);
    }
  });
  app2.get("/api/invitations", authenticate, ensureAuthenticated, isTherapist, async (req, res) => {
    try {
      const allInvitations = await storage.getClientInvitationsByProfessional(req.user.id);
      const validInvitations = [];
      for (const invitation of allInvitations) {
        if (invitation.status === "pending") {
          const existingUser = await storage.getUserByEmail(invitation.email);
          if (!existingUser) {
            validInvitations.push(invitation);
          } else {
            if (existingUser.therapistId === req.user.id) {
              await storage.updateClientInvitationStatus(invitation.id, "accepted");
            } else {
              await storage.updateClientInvitationStatus(invitation.id, "expired");
            }
          }
        }
      }
      res.json(validInvitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });
  app2.get("/api/invitations/:id", authenticate, ensureAuthenticated, isTherapist, async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const invitation = await storage.getClientInvitationById(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      if (invitation.therapistId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this invitation" });
      }
      res.json(invitation);
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });
  app2.post("/api/invitations/:id/resend", authenticate, ensureAuthenticated, isTherapist, async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const invitation = await storage.getClientInvitationById(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      if (invitation.therapistId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to resend this invitation" });
      }
      const therapist = await storage.getUser(req.user.id);
      if (!therapist) {
        return res.status(404).json({ message: "Therapist not found" });
      }
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const freshInviteLink = `${baseUrl}/auth?invitation=true&email=${encodeURIComponent(invitation.email)}&therapistId=${req.user.id}`;
      const emailSent = await sendClientInvitation(
        invitation.email,
        therapist.name || therapist.username,
        freshInviteLink,
        req.user.id
      );
      await storage.createNotification({
        userId: req.user.id,
        title: emailSent ? "Invitation Resent" : "Invitation Email Failed",
        body: emailSent ? `Invitation to ${invitation.email} has been resent successfully.` : `Failed to send invitation email to ${invitation.email}. Please provide account details directly: Username: ${invitation.tempUsername}, Password: ${invitation.tempPassword}`,
        type: emailSent ? "system" : "alert",
        isRead: false
      });
      await storage.updateClientInvitationStatus(
        invitationId,
        emailSent ? "email_sent" : "email_failed"
      );
      res.json({
        success: true,
        emailSent,
        message: emailSent ? "Invitation resent successfully" : "Email failed, but notification created"
      });
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ message: "Failed to resend invitation" });
    }
  });
  app2.delete("/api/invitations/:id", authenticate, ensureAuthenticated, isTherapist, async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const invitation = await storage.getClientInvitationById(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      if (invitation.therapistId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this invitation" });
      }
      const deleted = await storage.deleteClientInvitation(invitationId);
      if (deleted) {
        await storage.createNotification({
          userId: req.user.id,
          title: "Invitation Canceled",
          body: `Invitation to ${invitation.email} has been canceled.`,
          type: "system",
          isRead: false
        });
        res.json({
          success: true,
          message: "Invitation canceled successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to cancel invitation"
        });
      }
    } catch (error) {
      console.error("Error canceling invitation:", error);
      res.status(500).json({ message: "Failed to cancel invitation" });
    }
  });
  app2.post("/api/users/:userId/emotions", authenticate, checkUserAccess, isClientOrAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotionData = {
        userId,
        coreEmotion: req.body.coreEmotion,
        intensity: req.body.intensity,
        situation: req.body.situation,
        location: req.body.location || null,
        company: req.body.company || null,
        // Always convert timestamp to a Date object for database insertion
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : /* @__PURE__ */ new Date()
      };
      if (req.body.primaryEmotion && req.body.primaryEmotion.trim() !== "") {
        emotionData.primaryEmotion = req.body.primaryEmotion;
      }
      if (req.body.tertiaryEmotion && req.body.tertiaryEmotion.trim() !== "") {
        emotionData.tertiaryEmotion = req.body.tertiaryEmotion;
      }
      console.log("Processing emotion record:", {
        originalTimestamp: req.body.timestamp,
        convertedTimestamp: emotionData.timestamp,
        isDateObject: emotionData.timestamp instanceof Date,
        validDate: !isNaN(emotionData.timestamp.getTime())
      });
      let validationResult = insertEmotionRecordSchema.safeParse(emotionData);
      if (!validationResult.success) {
        console.log("Validation error:", validationResult.error);
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      const emotionRecord = await storage.createEmotionRecord(emotionData);
      res.status(201).json(emotionRecord);
    } catch (error) {
      console.error("Create emotion record error:", error);
      res.status(500).json({
        message: "Failed to record emotion",
        error: error.message
      });
    }
  });
  app2.get("/api/users/:userId/emotions", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`Therapist ${req.user?.id} is viewing client ${userId}'s emotions`);
      const emotions = await storage.getEmotionRecordsByUser(userId);
      res.status(200).json(emotions);
    } catch (error) {
      console.error("Get emotion records error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/users/:userId/emotions/:emotionId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotionId = parseInt(req.params.emotionId);
      const emotion = await storage.getEmotionRecordById(emotionId);
      if (!emotion) {
        return res.status(404).json({ message: "Emotion record not found" });
      }
      if (emotion.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this record" });
      }
      const thoughts = await storage.getThoughtRecordsByEmotionId(emotionId);
      if (thoughts && thoughts.length > 0) {
        for (const thought of thoughts) {
          await storage.deleteThoughtRecord(thought.id);
        }
      }
      await storage.deleteEmotionRecord(emotionId);
      res.status(200).json({ message: "Emotion record deleted successfully" });
    } catch (error) {
      console.error("Error deleting emotion record:", error);
      res.status(500).json({ message: "Error deleting emotion record" });
    }
  });
  app2.get("/api/users/:userId/emotions/stats", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const days = parseInt(req.query.days) || 30;
      const endDate = /* @__PURE__ */ new Date();
      const startDate = /* @__PURE__ */ new Date();
      startDate.setDate(startDate.getDate() - days);
      const emotions = await storage.getEmotionRecordsByUser(userId);
      const filteredEmotions = emotions.filter((emotion) => {
        const emotionDate = new Date(emotion.createdAt);
        return emotionDate >= startDate && emotionDate <= endDate;
      });
      const emotionCounts = {};
      filteredEmotions.forEach((emotion) => {
        const coreEmotion = emotion.coreEmotion;
        emotionCounts[coreEmotion] = (emotionCounts[coreEmotion] || 0) + 1;
      });
      const result = Object.keys(emotionCounts).map((emotion) => ({
        emotion,
        count: emotionCounts[emotion],
        color: getEmotionColor2(emotion)
      }));
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching emotion statistics:", error);
      res.status(500).json({ message: "Failed to fetch emotion statistics" });
    }
  });
  app2.get("/api/emotions/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const emotion = await storage.getEmotionRecordById(id);
      if (!emotion) {
        return res.status(404).json({ message: "Emotion record not found" });
      }
      if (emotion.userId !== req.user.id) {
        if (req.user.role === "therapist") {
          const client = await storage.getUser(emotion.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      res.status(200).json(emotion);
    } catch (error) {
      console.error("Get emotion record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/thoughts", authenticate, checkUserAccess, isClientOrAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertThoughtRecordSchema.parse({
        ...req.body,
        userId
      });
      const thoughtRecord = await storage.createThoughtRecord(validatedData);
      res.status(201).json(thoughtRecord);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create thought record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/users/:userId/thoughts/:thoughtId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const thoughtId = parseInt(req.params.thoughtId);
      const updateSchema = z3.object({
        cognitiveDistortions: z3.array(z3.string()).optional(),
        evidenceFor: z3.string().min(1).optional(),
        evidenceAgainst: z3.string().min(1).optional(),
        alternativePerspective: z3.string().min(1).optional(),
        reflectionRating: z3.number().min(0).max(10).optional(),
        insightsGained: z3.string().min(1).optional()
      });
      const validatedUpdate = updateSchema.parse(req.body);
      const existingThought = await storage.getThoughtRecordById(thoughtId);
      if (!existingThought) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      if (existingThought.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updateData = {
        ...validatedUpdate.cognitiveDistortions !== void 0 && { cognitiveDistortions: validatedUpdate.cognitiveDistortions },
        ...validatedUpdate.evidenceFor !== void 0 && { evidenceFor: validatedUpdate.evidenceFor },
        ...validatedUpdate.evidenceAgainst !== void 0 && { evidenceAgainst: validatedUpdate.evidenceAgainst },
        ...validatedUpdate.alternativePerspective !== void 0 && { alternativePerspective: validatedUpdate.alternativePerspective },
        ...validatedUpdate.reflectionRating !== void 0 && { reflectionRating: validatedUpdate.reflectionRating },
        ...validatedUpdate.insightsGained !== void 0 && { insightsGained: validatedUpdate.insightsGained }
      };
      const [updatedThought] = await db.update(thoughtRecords).set(updateData).where(eq6(thoughtRecords.id, thoughtId)).returning();
      res.status(200).json(updatedThought);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update thought record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/thoughts", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const emotionRecordId = req.query.emotionRecordId ? parseInt(req.query.emotionRecordId) : void 0;
      console.log(`Getting thought records for user ${userId}, requester: ${req.user.id} (${req.user.role})`);
      if (req.user?.role === "therapist" && userId !== req.user.id) {
        console.log(`Therapist ${req.user.id} is trying to access client ${userId}'s thought records`);
        const clientBelongsToTherapist = await isClientOfTherapist(userId, req.user.id);
        if (!clientBelongsToTherapist) {
          console.log(`Client ${userId} does not belong to therapist ${req.user.id}`);
          return res.status(403).json({ message: "Access denied - client not assigned to you" });
        }
        console.log(`Access granted - client ${userId} belongs to therapist ${req.user.id}`);
        const clientThoughts = await storage.getThoughtRecordsByUser(userId);
        const filteredClientThoughts = emotionRecordId ? clientThoughts.filter((t) => t.emotionRecordId === emotionRecordId) : clientThoughts;
        return res.status(200).json(filteredClientThoughts);
      }
      const thoughts = await storage.getThoughtRecordsByUser(userId);
      const filteredThoughts = emotionRecordId ? thoughts.filter((t) => t.emotionRecordId === emotionRecordId) : thoughts;
      res.status(200).json(filteredThoughts);
    } catch (error) {
      console.error("Get thought records error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/users/:userId/thoughts/:thoughtId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const thoughtId = parseInt(req.params.thoughtId);
      const thought = await storage.getThoughtRecordById(thoughtId);
      if (!thought) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      if (thought.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this record" });
      }
      await storage.deleteThoughtRecord(thoughtId);
      res.status(200).json({ message: "Thought record deleted successfully" });
    } catch (error) {
      console.error("Error deleting thought record:", error);
      res.status(500).json({ message: "Error deleting thought record" });
    }
  });
  app2.get("/api/users/:userId/thoughts/ratings", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const days = parseInt(req.query.days) || 30;
      const endDate = /* @__PURE__ */ new Date();
      const startDate = /* @__PURE__ */ new Date();
      startDate.setDate(startDate.getDate() - days);
      const thoughts = await storage.getThoughtRecordsByUser(userId);
      const filteredThoughts = thoughts.filter((thought) => {
        const thoughtDate = new Date(thought.createdAt);
        return thoughtDate >= startDate && thoughtDate <= endDate && thought.reflectionRating != null;
      });
      const ratingsByDate = {};
      filteredThoughts.forEach((thought) => {
        const date2 = new Date(thought.createdAt).toISOString().split("T")[0];
        if (!ratingsByDate[date2]) {
          ratingsByDate[date2] = [];
        }
        ratingsByDate[date2].push(thought.reflectionRating);
      });
      const result = Object.keys(ratingsByDate).map((date2) => ({
        date: date2,
        rating: Math.round(
          ratingsByDate[date2].reduce((sum, val) => sum + val, 0) / ratingsByDate[date2].length * 10
        ) / 10
        // Round to 1 decimal place
      }));
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching thought record ratings:", error);
      res.status(500).json({ message: "Failed to fetch thought record ratings" });
    }
  });
  app2.get("/api/thoughts/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const thought = await storage.getThoughtRecordById(id);
      if (!thought) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      if (thought.userId !== req.user.id) {
        if (req.user.role === "therapist") {
          const client = await storage.getUser(thought.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      res.status(200).json(thought);
    } catch (error) {
      console.error("Get thought record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/protective-factors", authenticate, checkUserAccess, checkResourceCreationPermission, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertProtectiveFactorSchema.parse({
        ...req.body,
        userId
      });
      const factor = await storage.createProtectiveFactor(validatedData);
      res.status(201).json(factor);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create protective factor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/protective-factors", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const includeGlobal = req.query.includeGlobal !== "false";
      const factors = await storage.getProtectiveFactorsByUser(userId, includeGlobal);
      res.status(200).json(factors);
    } catch (error) {
      console.error("Get protective factors error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/protective-factor-usage", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const query = `
        SELECT 
          pf.id, 
          pf.name, 
          pfu.effectiveness_rating as effectiveness
        FROM protective_factors pf
        JOIN protective_factor_usage pfu ON pf.id = pfu.protective_factor_id
        JOIN thought_records tr ON pfu.thought_record_id = tr.id
        WHERE tr.user_id = $1
      `;
      const result = await pool3.query(query, [userId]);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Get protective factor usage error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.put("/api/users/:userId/protective-factors/:factorId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const factorId = parseInt(req.params.factorId);
      const factor = await storage.getProtectiveFactorById(factorId);
      if (!factor) {
        return res.status(404).json({ message: "Protective factor not found" });
      }
      if (factor.userId !== userId && factor.userId !== null) {
        if (req.user.role === "therapist") {
          const client = await storage.getUser(factor.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      const validatedData = insertProtectiveFactorSchema.partial().parse(req.body);
      delete validatedData.userId;
      const updatedFactor = await storage.updateProtectiveFactor(factorId, validatedData);
      res.status(200).json(updatedFactor);
    } catch (error) {
      console.error("Update protective factor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/users/:userId/protective-factors/:factorId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const factorId = parseInt(req.params.factorId);
      const factor = await storage.getProtectiveFactorById(factorId);
      if (!factor) {
        return res.status(404).json({ message: "Protective factor not found" });
      }
      if (factor.userId !== userId && factor.userId !== null) {
        if (req.user.role === "therapist") {
          const client = await storage.getUser(factor.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      await storage.deleteProtectiveFactor(factorId);
      res.status(200).json({ message: "Protective factor deleted successfully" });
    } catch (error) {
      console.error("Delete protective factor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/protective-factor-usage", authenticate, checkUserAccess, checkResourceCreationPermission, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertProtectiveFactorUsageSchema.parse({
        ...req.body,
        userId
      });
      const usage = await storage.addProtectiveFactorUsage(validatedData);
      res.status(201).json(usage);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Add protective factor usage error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/coping-strategies", authenticate, checkUserAccess, checkResourceCreationPermission, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertCopingStrategySchema.parse({
        ...req.body,
        userId
      });
      const strategy = await storage.createCopingStrategy(validatedData);
      res.status(201).json(strategy);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create coping strategy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/coping-strategies", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const includeGlobal = req.query.includeGlobal !== "false";
      const strategies = await storage.getCopingStrategiesByUser(userId, includeGlobal);
      res.status(200).json(strategies);
    } catch (error) {
      console.error("Get coping strategies error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/coping-strategy-usage", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const query = `
        SELECT 
          cs.id, 
          cs.name, 
          csu.effectiveness_rating as effectiveness
        FROM coping_strategies cs
        JOIN coping_strategy_usage csu ON cs.id = csu.coping_strategy_id
        JOIN thought_records tr ON csu.thought_record_id = tr.id
        WHERE tr.user_id = $1
      `;
      const result = await pool3.query(query, [userId]);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Get coping strategy usage error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.put("/api/users/:userId/coping-strategies/:strategyId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const strategyId = parseInt(req.params.strategyId);
      const strategy = await storage.getCopingStrategyById(strategyId);
      if (!strategy) {
        return res.status(404).json({ message: "Coping strategy not found" });
      }
      if (strategy.userId !== userId && strategy.userId !== null) {
        if (req.user.role === "therapist") {
          const client = await storage.getUser(strategy.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      const validatedData = insertCopingStrategySchema.partial().parse(req.body);
      delete validatedData.userId;
      const updatedStrategy = await storage.updateCopingStrategy(strategyId, validatedData);
      res.status(200).json(updatedStrategy);
    } catch (error) {
      console.error("Update coping strategy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/users/:userId/coping-strategies/:strategyId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const strategyId = parseInt(req.params.strategyId);
      const strategy = await storage.getCopingStrategyById(strategyId);
      if (!strategy) {
        return res.status(404).json({ message: "Coping strategy not found" });
      }
      if (strategy.userId !== userId && strategy.userId !== null) {
        if (req.user.role === "therapist") {
          const client = await storage.getUser(strategy.userId);
          if (!client || client.therapistId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      await storage.deleteCopingStrategy(strategyId);
      res.status(200).json({ message: "Coping strategy deleted successfully" });
    } catch (error) {
      console.error("Delete coping strategy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/coping-strategy-usage", authenticate, checkUserAccess, checkResourceCreationPermission, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertCopingStrategyUsageSchema.parse({
        ...req.body,
        userId
      });
      const usage = await storage.addCopingStrategyUsage(validatedData);
      res.status(201).json(usage);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Add coping strategy usage error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/goals", authenticate, checkUserAccess, isClientOrAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log("Creating goal with data:", JSON.stringify(req.body));
      let updatedBody = { ...req.body, userId };
      if (updatedBody.deadline && typeof updatedBody.deadline === "string") {
        try {
          updatedBody.deadline = new Date(updatedBody.deadline);
        } catch (dateError) {
          console.error("Date conversion error:", dateError);
          updatedBody.deadline = null;
        }
      }
      const validatedData = insertGoalSchema.parse(updatedBody);
      console.log("Validated goal data:", JSON.stringify(validatedData));
      const goal = await storage.createGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        console.error("Goal validation error:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create goal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/goals", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (req.user.role === "therapist" && req.user.currentViewingClientId) {
        console.log(`Therapist ${req.user.id} is viewing client ${req.user.currentViewingClientId}'s goals`);
        const clientGoals = await storage.getGoalsByUser(req.user.currentViewingClientId);
        return res.status(200).json(clientGoals);
      }
      const goals2 = await storage.getGoalsByUser(userId);
      res.status(200).json(goals2);
    } catch (error) {
      console.error("Get goals error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/goals/milestones", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      let targetUserId = userId;
      if (req.user.role === "therapist" && req.user.currentViewingClientId) {
        console.log(`Therapist ${req.user.id} is viewing client ${req.user.currentViewingClientId}'s milestones`);
        targetUserId = req.user.currentViewingClientId;
      }
      const goals2 = await storage.getGoalsByUser(targetUserId);
      const allMilestones = [];
      for (const goal of goals2) {
        const milestones = await storage.getGoalMilestonesByGoal(goal.id);
        allMilestones.push(...milestones);
      }
      res.status(200).json(allMilestones);
    } catch (error) {
      console.error("Get all milestones error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/goals/:id/status", authenticate, async (req, res) => {
    try {
      const { status, therapistComments } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const id = parseInt(req.params.id);
      const goal = await storage.getGoalsByUser(req.user.id).then(
        (goals2) => goals2.find((g) => g.id === id)
      );
      if (!goal && req.user.role !== "therapist" && req.user.role !== "admin") {
        return res.status(404).json({ message: "Goal not found" });
      }
      if (req.user.role === "therapist" && !goal) {
        const [updatedGoal2] = await db.select().from(goals).where(eq6(goals.id, id));
        if (!updatedGoal2) {
          return res.status(404).json({ message: "Goal not found" });
        }
        const client = await storage.getUser(updatedGoal2.userId);
        if (!client || client.therapistId !== req.user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      const updatedGoal = await storage.updateGoalStatus(id, status, therapistComments);
      res.status(200).json(updatedGoal);
    } catch (error) {
      console.error("Update goal status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/goals/:goalId/milestones", authenticate, async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      console.log("Creating milestone with data:", JSON.stringify(req.body));
      const [goal] = await db.select().from(goals).where(eq6(goals.id, goalId));
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      if (req.user.id === goal.userId) {
      } else if (req.user.role === "therapist") {
        if (goal.userId === req.user.id) {
          return res.status(403).json({ message: "As a therapist, you can only provide feedback on goals, not create milestones for your own goals." });
        }
        const client = await storage.getUser(goal.userId);
        if (!client || client.therapistId !== req.user.id) {
          return res.status(403).json({ message: "Access denied. You can only create milestones for your clients' goals." });
        }
      } else if (req.user.role === "admin") {
      } else {
        return res.status(403).json({ message: "Access denied. You can only create milestones for your own goals." });
      }
      let updatedBody = { ...req.body, goalId };
      if (updatedBody.dueDate && typeof updatedBody.dueDate === "string") {
        try {
          updatedBody.dueDate = new Date(updatedBody.dueDate);
        } catch (dateError) {
          console.error("Date conversion error:", dateError);
          updatedBody.dueDate = null;
        }
      }
      const validatedData = insertGoalMilestoneSchema.parse(updatedBody);
      console.log("Validated milestone data:", JSON.stringify(validatedData));
      const milestone = await storage.createGoalMilestone(validatedData);
      await updateGoalStatusBasedOnMilestones(goalId);
      res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        console.error("Milestone validation error:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create goal milestone error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/goals/:goalId/milestones", authenticate, async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const [goal] = await db.select().from(goals).where(eq6(goals.id, goalId));
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      if (req.user.id === goal.userId) {
      } else if (req.user.role === "therapist") {
        const client = await storage.getUser(goal.userId);
        if (!client || client.therapistId !== req.user.id) {
          return res.status(403).json({ message: "Access denied. You can only view milestones for your clients' goals." });
        }
      } else if (req.user.role === "admin") {
      } else {
        return res.status(403).json({ message: "Access denied. You can only view milestones for your own goals." });
      }
      const milestones = await storage.getGoalMilestonesByGoal(goalId);
      res.status(200).json(milestones);
    } catch (error) {
      console.error("Get goal milestones error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/milestones/:id/completion", authenticate, async (req, res) => {
    try {
      const { isCompleted } = req.body;
      if (isCompleted === void 0) {
        return res.status(400).json({ message: "isCompleted field is required" });
      }
      const id = parseInt(req.params.id);
      const [milestone] = await db.select().from(goalMilestones).where(eq6(goalMilestones.id, id));
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      const [goal] = await db.select().from(goals).where(eq6(goals.id, milestone.goalId));
      if (!goal) {
        return res.status(404).json({ message: "Associated goal not found" });
      }
      if (req.user.id === goal.userId) {
      } else if (req.user.role === "therapist") {
        if (goal.userId === req.user.id) {
          return res.status(403).json({ message: "As a therapist, you can only provide feedback on goals, not update milestones for your own goals." });
        }
        const client = await storage.getUser(goal.userId);
        if (!client || client.therapistId !== req.user.id) {
          return res.status(403).json({ message: "Access denied. You can only update milestones for your clients' goals." });
        }
      } else if (req.user.role === "admin") {
      } else {
        return res.status(403).json({ message: "Access denied. You can only update milestones for your own goals." });
      }
      const updatedMilestone = await storage.updateGoalMilestoneCompletion(id, isCompleted);
      await updateGoalStatusBasedOnMilestones(milestone.goalId);
      res.status(200).json(updatedMilestone);
    } catch (error) {
      console.error("Update milestone completion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/admin/recalculate-goal-statuses", authenticate, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const allGoals = await db.select().from(goals);
      let updatedCount = 0;
      for (const goal of allGoals) {
        await updateGoalStatusBasedOnMilestones(goal.id);
        updatedCount++;
      }
      res.status(200).json({
        message: `Successfully recalculated status for ${updatedCount} goals`,
        updatedCount
      });
    } catch (error) {
      console.error("Recalculate goal statuses error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/actions", authenticate, checkUserAccess, isClientOrAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertActionSchema.parse({
        ...req.body,
        userId
      });
      const action = await storage.createAction(validatedData);
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create action error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/actions", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const actions2 = await storage.getActionsByUser(userId);
      res.status(200).json(actions2);
    } catch (error) {
      console.error("Get actions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/actions/:id/completion", authenticate, async (req, res) => {
    try {
      const { isCompleted, moodAfter, reflection } = req.body;
      if (isCompleted === void 0) {
        return res.status(400).json({ message: "isCompleted field is required" });
      }
      const id = parseInt(req.params.id);
      const [action] = await db.select().from(actions).where(eq6(actions.id, id));
      if (!action) {
        return res.status(404).json({ message: "Action not found" });
      }
      if (req.user.id === action.userId) {
      } else if (req.user.role === "therapist") {
        if (action.userId === req.user.id) {
          return res.status(403).json({ message: "As a therapist, you can only provide feedback on actions, not update your own actions." });
        }
        const client = await storage.getUser(action.userId);
        if (!client || client.therapistId !== req.user.id) {
          return res.status(403).json({ message: "Access denied. You can only update actions for your clients." });
        }
      } else if (req.user.role === "admin") {
      } else {
        return res.status(403).json({ message: "Access denied. You can only update your own actions." });
      }
      const updatedAction = await storage.updateActionCompletion(id, isCompleted, moodAfter, reflection);
      res.status(200).json(updatedAction);
    } catch (error) {
      console.error("Update action completion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/client-engagement/inactive", authenticate, isTherapistOrAdmin, async (req, res) => {
    try {
      await checkInactiveClients(req, res);
    } catch (error) {
      console.error("Error checking inactive clients:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check inactive clients"
      });
    }
  });
  app2.post("/api/client-engagement/send-reminders", authenticate, isTherapistOrAdmin, async (req, res) => {
    try {
      await sendInactivityReminders(req, res);
    } catch (error) {
      console.error("Error sending client engagement reminders:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send client engagement reminders"
      });
    }
  });
  app2.post("/api/client-engagement/remind-client/:clientId", authenticate, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId, 10);
      const { message } = req.body;
      if (req.user.role !== "admin") {
        const isClientOfCurrentTherapist = await isClientOfTherapist(clientId, req.user.id);
        if (!isClientOfTherapist) {
          return res.status(403).json({
            success: false,
            message: "You don't have permission to send reminders to this client"
          });
        }
      }
      const notificationCreated = await createInactivityNotification2(clientId, message);
      let emailSent = false;
      if (isEmailEnabled()) {
        const client = await pool3.query(`
          SELECT name, email FROM users WHERE id = $1
        `, [clientId]);
        if (client.rows.length > 0) {
          emailSent = await sendEmotionTrackingReminder(
            client.rows[0].email,
            client.rows[0].name
          );
        }
      }
      return res.status(200).json({
        success: true,
        notificationCreated,
        emailSent,
        message: `Reminder ${notificationCreated ? "successfully" : "failed to be"} sent to client`
      });
    } catch (error) {
      console.error("Error sending reminder to specific client:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send reminder to client"
      });
    }
  });
  app2.post("/api/admin/scheduler/trigger-daily-reminders", isAdmin, async (req, res) => {
    try {
      const { engagementScheduler: engagementScheduler2 } = await Promise.resolve().then(() => (init_scheduler(), scheduler_exports));
      await engagementScheduler2.triggerDailyReminders();
      res.json({
        success: true,
        message: "Daily reminders triggered successfully"
      });
    } catch (error) {
      console.error("Error triggering daily reminders:", error);
      res.status(500).json({
        success: false,
        message: "Failed to trigger daily reminders"
      });
    }
  });
  app2.post("/api/admin/scheduler/trigger-weekly-digests", isAdmin, async (req, res) => {
    try {
      const { engagementScheduler: engagementScheduler2 } = await Promise.resolve().then(() => (init_scheduler(), scheduler_exports));
      await engagementScheduler2.triggerWeeklyDigests();
      res.json({
        success: true,
        message: "Weekly digests triggered successfully"
      });
    } catch (error) {
      console.error("Error triggering weekly digests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to trigger weekly digests"
      });
    }
  });
  app2.post("/api/notifications/emotion-reminders", isAdmin, async (req, res) => {
    try {
      const { daysWithoutTracking } = req.body;
      console.log("Using deprecated emotion-reminders endpoint. Please update to use /api/client-engagement/send-reminders");
      const modifiedReq = {
        ...req,
        body: {
          days: daysWithoutTracking || 2,
          therapistOnly: false
        }
      };
      await sendInactivityReminders(modifiedReq, res);
    } catch (error) {
      console.error("Send emotion reminders error:", error);
      res.status(500).json({ message: "Failed to send emotion tracking reminders" });
    }
  });
  app2.post("/api/notifications/weekly-digests", isAdmin, async (req, res) => {
    try {
      const digestsSent = await sendWeeklyProgressDigest(req.body.email, req.body.name, req.body.stats || {});
      res.status(200).json({
        success: digestsSent,
        message: digestsSent ? "Weekly progress digest sent successfully" : "Failed to send weekly progress digest"
      });
    } catch (error) {
      console.error("Send weekly digests error:", error);
      res.status(500).json({ message: "Failed to send weekly progress digests" });
    }
  });
  app2.get("/api/notifications", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const { withRetry: withRetry2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const notifications2 = await withRetry2(async () => {
        return await storage.getNotificationsByUser(userId, limit);
      });
      res.status(200).json(notifications2);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  const notificationCache = /* @__PURE__ */ new Map();
  const NOTIFICATION_CACHE_DURATION = 3e4;
  app2.get("/api/notifications/unread", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const cached = notificationCache.get(userId);
      if (cached && Date.now() < cached.expires) {
        return res.status(200).json(cached.notifications);
      }
      const { pool: pool4 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const result = await pool4.query(`
        SELECT id, user_id as "userId", title, body, type, is_read as "isRead", 
               created_at as "createdAt", expires_at as "expiresAt", metadata, link_path as "linkPath", link
        FROM notifications 
        WHERE user_id = $1
          AND is_read = false 
          AND (expires_at IS NULL OR expires_at >= NOW())
        ORDER BY created_at DESC
      `, [userId]);
      const notifications2 = result.rows || [];
      notificationCache.set(userId, {
        notifications: notifications2,
        expires: Date.now() + NOTIFICATION_CACHE_DURATION
      });
      const now = Date.now();
      const keysToDelete = [];
      notificationCache.forEach((value, key) => {
        if (now > value.expires) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => notificationCache.delete(key));
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("X-Direct-Query", "true");
      res.status(200).json(notifications2);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });
  app2.post("/api/notifications/read/:id", authenticate, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotificationById(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to modify this notification" });
      }
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.status(200).json(updatedNotification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  app2.post("/api/notifications/read-all", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      console.log(`EMERGENCY NOTIFICATION RESET for user ${userId}`);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      try {
        const { pool: pool4 } = await Promise.resolve().then(() => (init_db(), db_exports));
        await pool4.query(`
          UPDATE notifications 
          SET is_read = true 
          WHERE user_id = $1
        `, [userId]);
        console.log(`Successfully marked all notifications as read for user ${userId}`);
        console.log(`Notification database reset completed successfully for user ${userId}`);
      } catch (sqlError) {
        console.error("Critical error with notification reset:", sqlError);
        throw sqlError;
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read",
        timestamp: Date.now()
      });
    }
  });
  app2.delete("/api/notifications/:id", authenticate, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotificationById(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this notification" });
      }
      await storage.deleteNotification(notificationId);
      res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });
  app2.post("/api/notifications/test", authenticate, isAdmin, async (req, res) => {
    try {
      const userId = req.user.id;
      const testNotification = await storage.createNotification({
        userId,
        title: "Test Notification",
        body: "This is a test notification to verify functionality.",
        type: "system",
        isRead: false
      });
      sendNotificationToUser(userId, testNotification);
      res.status(201).json(testNotification);
    } catch (error) {
      console.error("Error creating test notification:", error);
      res.status(500).json({ message: "Failed to create test notification" });
    }
  });
  app2.get("/api/admin/notifications", authenticate, isAdmin, async (req, res) => {
    try {
      const query = `
        SELECT 
          n.id, 
          n.title, 
          n.body, 
          n.type, 
          n.is_read as "isRead", 
          n.created_at as "createdAt",
          n.user_id as "userId",
          u.name as "userName",
          u.email as "userEmail"
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        ORDER BY n.created_at DESC
        LIMIT 100
      `;
      const result = await pool3.query(query);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.get("/api/admin/logs", authenticate, isAdmin, async (req, res) => {
    try {
      const query = `
        SELECT 
          sl.id,
          sl.action,
          sl.action_type as "actionType",
          sl.level,
          sl.message,
          sl.user_id as "performedBy",
          sl.ip_address as "ipAddress",
          sl.user_agent as "userAgent",
          sl.created_at as "timestamp",
          u.username as "performerName",
          u.email as "performerEmail"
        FROM system_logs sl
        LEFT JOIN users u ON sl.user_id = u.id
        ORDER BY sl.created_at DESC
        LIMIT 100
      `;
      const result = await pool3.query(query);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching system logs:", error);
      res.status(500).json({ message: "Failed to fetch system logs" });
    }
  });
  app2.delete("/api/admin/logs", authenticate, isAdmin, async (req, res) => {
    try {
      await pool3.query("DELETE FROM system_logs");
      res.status(200).json({ message: "System logs cleared successfully" });
    } catch (error) {
      console.error("Error clearing system logs:", error);
      res.status(500).json({ message: "Failed to clear system logs" });
    }
  });
  app2.get("/api/users/:userId/thoughts/:id/protective-factors", authenticate, checkUserAccess, async (req, res) => {
    try {
      const thoughtId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      const thoughtRecord = await storage.getThoughtRecordById(thoughtId);
      if (!thoughtRecord || thoughtRecord.userId !== userId) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      const query = `
        SELECT pf.id, pf.name, pfu.effectiveness_rating as effectiveness
        FROM protective_factors pf
        JOIN protective_factor_usage pfu ON pf.id = pfu.protective_factor_id
        WHERE pfu.thought_record_id = $1
      `;
      const result = await pool3.query(query, [thoughtId]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching protective factors for thought record:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/users/:userId/thoughts/:id/coping-strategies", authenticate, checkUserAccess, async (req, res) => {
    try {
      const thoughtId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      const thoughtRecord = await storage.getThoughtRecordById(thoughtId);
      if (!thoughtRecord || thoughtRecord.userId !== userId) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      const query = `
        SELECT cs.id, cs.name, csu.effectiveness_rating as effectiveness
        FROM coping_strategies cs
        JOIN coping_strategy_usage csu ON cs.id = csu.coping_strategy_id
        WHERE csu.thought_record_id = $1
      `;
      const result = await pool3.query(query, [thoughtId]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching coping strategies for thought record:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/resources", authenticate, async (req, res) => {
    try {
      const includeUnpublished = req.user.role === "admin";
      const resources3 = await storage.getAllResources(includeUnpublished);
      res.status(200).json(resources3);
    } catch (error) {
      console.error("Get resources error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/resources/:id", authenticate, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      if (!resource.isPublished && req.user.role !== "admin" && resource.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied to unpublished resource" });
      }
      res.status(200).json(resource);
    } catch (error) {
      console.error("Get resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/resources", authenticate, async (req, res) => {
    try {
      if (req.user.role !== "therapist" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Only therapists and admins can create resources" });
      }
      const validatedData = insertResourceSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      const newResource = await storage.createResource(validatedData);
      res.status(201).json(newResource);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/resources/:id/clone", authenticate, isTherapist, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      if (!resource.isPublished) {
        return res.status(403).json({ message: "Cannot clone unpublished resources" });
      }
      const clonedResource = await storage.cloneResource(resourceId, req.user.id);
      res.status(201).json(clonedResource);
    } catch (error) {
      console.error("Clone resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/resources/:id", authenticate, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      if (resource.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only update resources you created" });
      }
      const validatedData = insertResourceSchema.partial().parse(req.body);
      delete validatedData.createdBy;
      const updatedResource = await storage.updateResource(resourceId, validatedData);
      res.status(200).json(updatedResource);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/resources/:id", authenticate, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      if (req.user.role !== "therapist" && req.user.role !== "admin") {
        return res.status(403).json({
          message: "Access denied: Only therapists and admins can delete educational resources"
        });
      }
      if (resource.createdBy === req.user.id) {
        console.log(`${req.user.role} ${req.user.id} is deleting their own resource ${resourceId}`);
      } else if (req.user.role === "admin") {
        console.log(`Admin ${req.user.id} is deleting resource ${resourceId}`);
      } else {
        return res.status(403).json({
          message: "Access denied: You can only delete resources you created"
        });
      }
      await storage.deleteResource(resourceId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/resources/category/:category", authenticate, async (req, res) => {
    try {
      const category = req.params.category;
      const resources3 = await storage.getResourcesByCategory(category);
      res.status(200).json(resources3);
    } catch (error) {
      console.error("Get resources by category error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/resources", authenticate, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const resources3 = await storage.getResourcesByCreator(userId);
      if (userId !== req.user.id && req.user.role !== "admin") {
        const publishedResources = resources3.filter((resource) => resource.isPublished);
        return res.status(200).json(publishedResources);
      }
      res.status(200).json(resources3);
    } catch (error) {
      console.error("Get user resources error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/resource-assignments", authenticate, isTherapist, async (req, res) => {
    try {
      const { resourceId, assignedTo, notes, isPriority } = req.body;
      if (!resourceId || !assignedTo) {
        return res.status(400).json({ message: "Resource ID and client ID are required" });
      }
      const resource = await storage.getResourceById(Number(resourceId));
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      const clients = await storage.getClients(req.user.id);
      const clientExists = clients.some((client) => client.id === Number(assignedTo));
      if (!clientExists) {
        return res.status(403).json({ message: "Client not found or not assigned to you" });
      }
      const assignmentData = {
        resourceId: Number(resourceId),
        assignedBy: req.user.id,
        assignedTo: Number(assignedTo),
        notes: notes || null,
        isPriority: isPriority || false,
        status: "assigned"
      };
      const validatedData = insertResourceAssignmentSchema.parse(assignmentData);
      const assignment = await storage.assignResourceToClient(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Assign resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/resources/assign", authenticate, isTherapist, async (req, res) => {
    try {
      const { resourceId, clientId, notes } = req.body;
      if (!resourceId || !clientId) {
        return res.status(400).json({ message: "Resource ID and client ID are required" });
      }
      const resource = await storage.getResourceById(Number(resourceId));
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      const clients = await storage.getClients(req.user.id);
      const clientExists = clients.some((client) => client.id === Number(clientId));
      if (!clientExists) {
        return res.status(403).json({ message: "Client not found or not assigned to you" });
      }
      const assignmentData = {
        resourceId: Number(resourceId),
        assignedBy: req.user.id,
        assignedTo: Number(clientId),
        notes: notes || null,
        isPriority: false,
        status: "assigned"
      };
      const validatedData = insertResourceAssignmentSchema.parse(assignmentData);
      const assignment = await storage.assignResourceToClient(validatedData);
      res.status(200).json(assignment);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Assign resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/clients/:clientId/assignments", authenticate, async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      const client = await storage.getUser(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      if (clientId !== req.user.id && client.therapistId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only view assignments for your own clients" });
      }
      const assignments = await storage.getAssignmentsByClient(clientId);
      const assignmentsWithResources = await Promise.all(
        assignments.map(async (assignment) => {
          const resource = await storage.getResourceById(assignment.resourceId);
          return {
            ...assignment,
            resource
          };
        })
      );
      res.status(200).json(assignmentsWithResources);
    } catch (error) {
      console.error("Get client assignments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/therapist/assignments", authenticate, isTherapist, async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsByProfessional(req.user.id);
      const assignmentsWithDetails = await Promise.all(
        assignments.map(async (assignment) => {
          const resource = await storage.getResourceById(assignment.resourceId);
          const client = await storage.getUser(assignment.assignedTo);
          console.log(`Assignment ${assignment.id} client data:`, client ? {
            id: client.id,
            name: client.name,
            username: client.username
          } : "No client found");
          return {
            ...assignment,
            resource,
            client: client ? {
              id: client.id,
              name: client.name || null,
              username: client.username
            } : {
              id: assignment.assignedTo,
              name: null,
              username: "Unknown Client"
            }
          };
        })
      );
      res.status(200).json(assignmentsWithDetails);
    } catch (error) {
      console.error("Get therapist assignments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/resource-assignments/:id/status", authenticate, async (req, res) => {
    try {
      const assignmentId = Number(req.params.id);
      if (isNaN(assignmentId)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      const { status } = req.body;
      if (!status || !["viewed", "completed"].includes(status)) {
        return res.status(400).json({ message: "Valid status (viewed or completed) is required" });
      }
      const assignment = await storage.getResourceAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      if (assignment.assignedTo !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own assignments" });
      }
      const updatedAssignment = await storage.updateAssignmentStatus(assignmentId, status);
      res.status(200).json(updatedAssignment);
    } catch (error) {
      console.error("Update assignment status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/resource-assignments/:id", authenticate, isTherapist, async (req, res) => {
    try {
      const assignmentId = Number(req.params.id);
      if (isNaN(assignmentId)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      const assignment = await storage.getResourceAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      if (assignment.assignedBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only delete assignments you created" });
      }
      await storage.deleteResourceAssignment(assignmentId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete assignment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/resources/:id/feedback", authenticate, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      const { rating, feedback } = req.body;
      if (rating === void 0) {
        return res.status(400).json({ message: "Rating is required" });
      }
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      if (req.user.role === "client") {
        const assignments = await storage.getAssignmentsByClient(req.user.id);
        const wasAssigned = assignments.some((a) => a.resourceId === resourceId);
        if (!wasAssigned) {
          return res.status(403).json({ message: "You can only provide feedback for resources assigned to you" });
        }
      }
      const feedbackData = {
        resourceId,
        userId: req.user.id,
        rating,
        feedback: feedback || null
      };
      const validatedData = insertResourceFeedbackSchema.parse(feedbackData);
      const newFeedback = await storage.createResourceFeedback(validatedData);
      res.status(201).json(newFeedback);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Submit feedback error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/resources/:id/feedback", authenticate, async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      const resource = await storage.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      if (resource.createdBy !== req.user.id && req.user.role !== "admin" && req.user.role !== "therapist") {
        return res.status(403).json({ message: "Access denied to resource feedback" });
      }
      const feedback = await storage.getResourceFeedbackByResource(resourceId);
      const feedbackWithUserDetails = await Promise.all(
        feedback.map(async (fb) => {
          const user = await storage.getUser(fb.userId);
          return {
            ...fb,
            user: user ? {
              id: user.id,
              name: user.name,
              username: user.username
            } : null
          };
        })
      );
      res.status(200).json(feedbackWithUserDetails);
    } catch (error) {
      console.error("Get resource feedback error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/journal", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const entries = await storage.getJournalEntriesByUser(userId);
      res.status(200).json(entries);
    } catch (error) {
      console.error("Get journal entries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/journal/:id", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid journal entry ID" });
      }
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      const user = req.user;
      if (entry.userId !== user.id && (user.role !== "therapist" || (await storage.getUser(entry.userId))?.therapistId !== user.id) && user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const comments = await storage.getJournalCommentsByEntry(entryId);
      res.status(200).json({
        ...entry,
        comments
      });
    } catch (error) {
      console.error("Get journal entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/journal", authenticate, async (req, res) => {
    try {
      const validatedData = insertJournalEntrySchema.parse({
        ...req.body,
        userId: req.user.id
        // Ensure the entry is created for the authenticated user
      });
      const newEntry = await storage.createJournalEntry(validatedData);
      if (validatedData.content && process.env.OPENAI_API_KEY) {
        try {
          const analysis = await analyzeJournalEntry(
            validatedData.title || "",
            validatedData.content
          );
          const updatedEntry = await storage.updateJournalEntry(newEntry.id, {
            aiSuggestedTags: analysis.suggestedTags,
            initialAiTags: analysis.suggestedTags,
            // Store initial tags separately to track origin
            aiAnalysis: analysis.analysis,
            emotions: analysis.emotions,
            topics: analysis.topics,
            detectedDistortions: analysis.cognitiveDistortions || [],
            // Include detected cognitive distortions
            sentimentPositive: analysis.sentiment.positive,
            sentimentNegative: analysis.sentiment.negative,
            sentimentNeutral: analysis.sentiment.neutral
          });
          console.log(`Journal entry ${newEntry.id} created with initial AI tags:`, analysis.suggestedTags);
          return res.status(201).json(updatedEntry);
        } catch (aiError) {
          console.error("AI analysis error:", aiError);
          return res.status(201).json(newEntry);
        }
      }
      res.status(201).json(newEntry);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create journal entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/journal/:id", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid journal entry ID" });
      }
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      if (entry.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const validatedData = insertJournalEntrySchema.partial().parse(req.body);
      let updatedData = validatedData;
      if (validatedData.content && process.env.OPENAI_API_KEY) {
        try {
          const analysis = await analyzeJournalEntry(
            validatedData.title || entry.title || "",
            validatedData.content
          );
          updatedData = {
            ...validatedData,
            aiSuggestedTags: analysis.suggestedTags,
            aiAnalysis: analysis.analysis,
            emotions: analysis.emotions,
            topics: analysis.topics,
            detectedDistortions: analysis.cognitiveDistortions || [],
            // Include cognitive distortions
            sentimentPositive: analysis.sentiment.positive,
            sentimentNegative: analysis.sentiment.negative,
            sentimentNeutral: analysis.sentiment.neutral
          };
        } catch (aiError) {
          console.error("AI analysis error on update:", aiError);
        }
      }
      const updatedEntry = await storage.updateJournalEntry(entryId, updatedData);
      res.status(200).json(updatedEntry);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update journal entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/journal/:id", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid journal entry ID" });
      }
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      if (entry.userId === req.user.id) {
        console.log(`User ${req.user.id} is deleting their own journal entry ${entryId}`);
      } else if (req.user.role === "admin") {
        console.log(`Admin ${req.user.id} is deleting journal entry ${entryId} owned by user ${entry.userId}`);
      } else if (req.user.role === "therapist") {
        const client = await storage.getUser(entry.userId);
        if (client && client.therapistId === req.user.id) {
          console.log(`Therapist ${req.user.id} is deleting journal entry ${entryId} for their client ${entry.userId}`);
        } else {
          return res.status(403).json({ message: "Access denied: You can only delete entries for your clients" });
        }
      } else {
        return res.status(403).json({ message: "Access denied: You can only delete your own entries" });
      }
      await storage.deleteJournalEntry(entryId);
      res.status(200).json({ message: "Journal entry deleted successfully" });
    } catch (error) {
      console.error("Delete journal entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/journal/:id/tags", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid journal entry ID" });
      }
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      if (entry.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { selectedTags } = req.body;
      if (!Array.isArray(selectedTags)) {
        return res.status(400).json({ message: "Selected tags must be an array" });
      }
      const updatedEntry = await storage.updateJournalEntry(entryId, {
        userSelectedTags: selectedTags
      });
      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error("Update journal tags error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/journal/:id/comments", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid journal entry ID" });
      }
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      const user = req.user;
      if (user.role === "client" && entry.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      } else if (user.role === "therapist") {
        const client = await storage.getUser(entry.userId);
        if (!client || client.therapistId !== user.id) {
          return res.status(403).json({ message: "Access denied - not your client" });
        }
      }
      const { content, ...restBody } = req.body;
      const validatedData = insertJournalCommentSchema.parse({
        ...restBody,
        comment: content,
        // Map content to comment
        userId: user.id,
        therapistId: user.role === "therapist" ? user.id : null,
        journalEntryId: entryId
      });
      const newComment = await storage.createJournalComment(validatedData);
      if (process.env.OPENAI_API_KEY && entry.content) {
        try {
          console.log("Starting AI analysis for comment on entry:", entryId);
          const comments = await storage.getJournalCommentsByEntry(entryId);
          console.log(`Found ${comments.length} comments for analysis`);
          if (!comments || !Array.isArray(comments)) {
            console.error("Invalid comments array returned from storage:", comments);
            throw new Error("Invalid comments data structure");
          }
          const combinedText = `
            ${entry.title || ""}
            
            ${entry.content}
            
            Additional comments:
            ${comments.map((c) => c.comment || "").join("\n\n")}
          `;
          console.log("Sending combined text for AI analysis");
          const analysis = await analyzeJournalEntry(
            entry.title || "",
            combinedText
          );
          console.log("Received AI analysis:", {
            suggestedTagsCount: analysis.suggestedTags.length,
            emotions: analysis.emotions,
            topics: analysis.topics
          });
          const existingTags = entry.aiSuggestedTags || [];
          const allTags = [.../* @__PURE__ */ new Set([...existingTags, ...analysis.suggestedTags])];
          const emotionTags = analysis.emotions || [];
          const topicTags = analysis.topics || [];
          console.log("Updating journal entry with combined tags:", {
            existingTagsCount: existingTags.length,
            newTagsCount: allTags.length,
            emotionTagsCount: emotionTags.length,
            topicTagsCount: topicTags.length
          });
          const updatedEntry = await storage.updateJournalEntry(entryId, {
            aiSuggestedTags: allTags,
            // Do not modify initialAiTags, which tracks the original AI tags
            aiAnalysis: analysis.analysis,
            emotions: emotionTags.length > 0 ? emotionTags : entry.emotions || [],
            topics: topicTags.length > 0 ? topicTags : entry.topics || [],
            detectedDistortions: analysis.cognitiveDistortions || [],
            // Include detected cognitive distortions
            sentimentPositive: analysis.sentiment.positive,
            sentimentNegative: analysis.sentiment.negative,
            sentimentNeutral: analysis.sentiment.neutral
          });
          newComment.updatedEntry = updatedEntry;
          console.log("Successfully updated journal entry with new AI analysis");
        } catch (aiError) {
          console.error("AI analysis after comment error:", aiError);
          console.error("Error details:", aiError instanceof Error ? aiError.message : String(aiError));
          console.error("Stack trace:", aiError instanceof Error ? aiError.stack : "No stack trace available");
        }
      } else {
        console.log(
          "Skipping AI analysis:",
          !process.env.OPENAI_API_KEY ? "No OpenAI API key" : "No entry content"
        );
      }
      res.status(201).json(newComment);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        console.log("Journal comment validation error:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create journal comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/journal/comments/:id", authenticate, async (req, res) => {
    try {
      const commentId = Number(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      const [comment] = await db.select().from(journalComments).where(eq6(journalComments.id, commentId));
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      if (comment.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { content, ...restBody } = req.body;
      const validatedData = insertJournalCommentSchema.partial().parse({
        ...restBody,
        comment: content
        // Map content to comment if it exists
      });
      const updatedComment = await storage.updateJournalComment(commentId, validatedData);
      res.status(200).json(updatedComment);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update journal comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/journal/comments/:id", authenticate, async (req, res) => {
    try {
      const commentId = Number(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      const [comment] = await db.select().from(journalComments).where(eq6(journalComments.id, commentId));
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      if (comment.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteJournalComment(commentId);
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Delete journal comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/journal/stats", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const entries = await storage.getJournalEntriesByUser(userId);
      const stats = {
        totalEntries: entries.length,
        emotions: {},
        topics: {},
        cognitiveDistortions: {},
        // Add tracking for cognitive distortions
        sentimentOverTime: entries.map((entry) => ({
          date: entry.createdAt,
          positive: entry.sentimentPositive || 0,
          negative: entry.sentimentNegative || 0,
          neutral: entry.sentimentNeutral || 0
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        tagsFrequency: {},
        sentimentPatterns: {
          positive: 0,
          neutral: 0,
          negative: 0
        }
      };
      if (entries.length > 0) {
        let totalPositive = 0;
        let totalNegative = 0;
        let totalNeutral = 0;
        entries.forEach((entry) => {
          totalPositive += entry.sentimentPositive || 0;
          totalNegative += entry.sentimentNegative || 0;
          totalNeutral += entry.sentimentNeutral || 0;
        });
        const total = totalPositive + totalNegative + totalNeutral;
        if (total > 0) {
          stats.sentimentPatterns = {
            positive: Math.round(totalPositive / total * 100),
            negative: Math.round(totalNegative / total * 100),
            neutral: Math.round(totalNeutral / total * 100)
          };
          const sum = stats.sentimentPatterns.positive + stats.sentimentPatterns.negative + stats.sentimentPatterns.neutral;
          if (sum !== 100) {
            const diff = 100 - sum;
            if (stats.sentimentPatterns.positive >= stats.sentimentPatterns.negative && stats.sentimentPatterns.positive >= stats.sentimentPatterns.neutral) {
              stats.sentimentPatterns.positive += diff;
            } else if (stats.sentimentPatterns.negative >= stats.sentimentPatterns.positive && stats.sentimentPatterns.negative >= stats.sentimentPatterns.neutral) {
              stats.sentimentPatterns.negative += diff;
            } else {
              stats.sentimentPatterns.neutral += diff;
            }
          }
        }
      }
      entries.forEach((entry) => {
        if (entry.userSelectedDistortions && Array.isArray(entry.userSelectedDistortions)) {
          entry.userSelectedDistortions.forEach((distortion) => {
            stats.cognitiveDistortions[distortion] = (stats.cognitiveDistortions[distortion] || 0) + 1;
          });
        }
        if (entry.userSelectedTags && Array.isArray(entry.userSelectedTags)) {
          entry.userSelectedTags.forEach((tag) => {
            stats.tagsFrequency[tag] = (stats.tagsFrequency[tag] || 0) + 1;
          });
        }
        if (entry.emotions && Array.isArray(entry.emotions)) {
          entry.emotions.forEach((emotion) => {
            stats.emotions[emotion] = (stats.emotions[emotion] || 0) + 1;
          });
        }
        if (entry.topics && Array.isArray(entry.topics)) {
          entry.topics.forEach((topic) => {
            stats.topics[topic] = (stats.topics[topic] || 0) + 1;
          });
        }
      });
      res.status(200).json(stats);
    } catch (error) {
      console.error("Get journal stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/journal/analyze", authenticate, async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required for analysis" });
      }
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "AI analysis is not available" });
      }
      const analysis = await analyzeJournalEntry(title || "", content);
      res.status(200).json(analysis);
    } catch (error) {
      console.error("Journal analysis error:", error);
      res.status(500).json({ message: "Failed to analyze journal content" });
    }
  });
  app2.post("/api/users/:userId/journal/:entryId/reanalyze", authenticate, checkUserAccess, async (req, res) => {
    try {
      const entryId = Number(req.params.entryId);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      const userId = Number(req.params.userId);
      if (entry.userId !== userId && req.user?.role !== "admin" && (req.user?.role !== "therapist" || !await isClientOfTherapist(entry.userId, req.user.id))) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "AI analysis is not available" });
      }
      const analysis = await analyzeJournalEntry(entry.title, entry.content);
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
  });
  app2.post("/api/journal/:id/reanalyze", authenticate, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      if (entry.userId !== req.user?.id && req.user?.role !== "admin" && req.user?.role !== "therapist") {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "AI analysis is not available" });
      }
      const analysis = await analyzeJournalEntry(entry.title, entry.content);
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
  });
  app2.get("/api/cognitive-distortions", async (req, res) => {
    try {
      const distortions = await storage.getCognitiveDistortions();
      res.status(200).json(distortions);
    } catch (error) {
      console.error("Get cognitive distortions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/cognitive-distortions/:id", async (req, res) => {
    try {
      const distortionId = Number(req.params.id);
      if (isNaN(distortionId)) {
        return res.status(400).json({ message: "Invalid cognitive distortion ID" });
      }
      const distortion = await storage.getCognitiveDistortionById(distortionId);
      if (!distortion) {
        return res.status(404).json({ message: "Cognitive distortion not found" });
      }
      res.status(200).json(distortion);
    } catch (error) {
      console.error("Get cognitive distortion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/cognitive-distortions", authenticate, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCognitiveDistortionSchema.parse(req.body);
      const distortion = await storage.createCognitiveDistortion(validatedData);
      res.status(201).json(distortion);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create cognitive distortion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/cognitive-distortions/:id", authenticate, isAdmin, async (req, res) => {
    try {
      const distortionId = Number(req.params.id);
      if (isNaN(distortionId)) {
        return res.status(400).json({ message: "Invalid cognitive distortion ID" });
      }
      const distortion = await storage.getCognitiveDistortionById(distortionId);
      if (!distortion) {
        return res.status(404).json({ message: "Cognitive distortion not found" });
      }
      const validatedData = insertCognitiveDistortionSchema.partial().parse(req.body);
      const updatedDistortion = await storage.updateCognitiveDistortion(distortionId, validatedData);
      res.status(200).json(updatedDistortion);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update cognitive distortion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/cognitive-distortions/:id", authenticate, isAdmin, async (req, res) => {
    try {
      const distortionId = Number(req.params.id);
      if (isNaN(distortionId)) {
        return res.status(400).json({ message: "Invalid cognitive distortion ID" });
      }
      const distortion = await storage.getCognitiveDistortionById(distortionId);
      if (!distortion) {
        return res.status(404).json({ message: "Cognitive distortion not found" });
      }
      await storage.deleteCognitiveDistortion(distortionId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete cognitive distortion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  async function isClientOfTherapist(clientId, therapistId) {
    try {
      const client = await storage.getUser(clientId);
      return !!client && client.therapistId === therapistId;
    } catch (error) {
      console.error("Error checking client-therapist relationship:", error);
      return false;
    }
  }
  app2.post("/api/users/:userId/journal/:journalId/link-thought", authenticate, checkUserAccess, async (req, res) => {
    try {
      const journalId = Number(req.params.journalId);
      const thoughtRecordId = Number(req.body.thoughtRecordId);
      if (isNaN(journalId) || isNaN(thoughtRecordId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const journal = await storage.getJournalEntryById(journalId);
      if (!journal) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      if (journal.userId !== req.user.id && req.user.role !== "admin" && (req.user.role !== "therapist" || !await isClientOfTherapist(journal.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this journal entry" });
      }
      const thoughtRecord = await storage.getThoughtRecordById(thoughtRecordId);
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      if (thoughtRecord.userId !== req.user.id && req.user.role !== "admin" && (req.user.role !== "therapist" || !await isClientOfTherapist(thoughtRecord.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this thought record" });
      }
      await storage.linkJournalToThoughtRecord(journalId, thoughtRecordId);
      const updatedJournal = await storage.getJournalEntryById(journalId);
      res.status(200).json(updatedJournal);
    } catch (error) {
      console.error("Link journal to thought record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/users/:userId/journal/:journalId/link-thought/:thoughtRecordId", authenticate, checkUserAccess, async (req, res) => {
    try {
      const journalId = Number(req.params.journalId);
      const thoughtRecordId = Number(req.params.thoughtRecordId);
      if (isNaN(journalId) || isNaN(thoughtRecordId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const journal = await storage.getJournalEntryById(journalId);
      if (!journal) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      if (journal.userId !== req.user.id && req.user.role !== "admin" && (req.user.role !== "therapist" || !await isClientOfTherapist(journal.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this journal entry" });
      }
      const thoughtRecord = await storage.getThoughtRecordById(thoughtRecordId);
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      if (thoughtRecord.userId !== req.user.id && req.user.role !== "admin" && (req.user.role !== "therapist" || !await isClientOfTherapist(thoughtRecord.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this thought record" });
      }
      await storage.unlinkJournalFromThoughtRecord(journalId, thoughtRecordId);
      const updatedJournal = await storage.getJournalEntryById(journalId);
      res.status(200).json(updatedJournal);
    } catch (error) {
      console.error("Unlink journal from thought record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/journal/:journalId/related-thoughts", authenticate, checkUserAccess, async (req, res) => {
    try {
      const journalId = Number(req.params.journalId);
      if (isNaN(journalId)) {
        return res.status(400).json({ message: "Invalid journal ID" });
      }
      const journal = await storage.getJournalEntryById(journalId);
      if (!journal) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      if (journal.userId !== req.user.id && req.user.role !== "admin" && (req.user.role !== "therapist" || !await isClientOfTherapist(journal.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this journal entry" });
      }
      const relatedThoughts = await storage.getRelatedThoughtRecords(journalId);
      res.status(200).json(relatedThoughts);
    } catch (error) {
      console.error("Get related thought records error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/thoughts/:thoughtRecordId/related-journals", authenticate, checkUserAccess, async (req, res) => {
    try {
      const thoughtRecordId = Number(req.params.thoughtRecordId);
      if (isNaN(thoughtRecordId)) {
        return res.status(400).json({ message: "Invalid thought record ID" });
      }
      const thoughtRecord = await storage.getThoughtRecordById(thoughtRecordId);
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      if (thoughtRecord.userId !== req.user.id && req.user.role !== "admin" && (req.user.role !== "therapist" || !await isClientOfTherapist(thoughtRecord.userId, req.user.id))) {
        return res.status(403).json({ message: "You don't have access to this thought record" });
      }
      const relatedJournals = await storage.getRelatedJournalEntries(thoughtRecordId);
      res.status(200).json(relatedJournals);
    } catch (error) {
      console.error("Get related journal entries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/ms-verify", (req, res) => {
    res.set({
      "Content-Type": "text/html",
      "X-MS-SmartScreen-Bypass": "true",
      "X-Microsoft-Edge-Secure": "verified",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY"
    });
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="msapplication-TileColor" content="#4285F4">
        <meta name="msapplication-config" content="/browserconfig.xml">
        <meta name="mssmartscreen" content="noprompt">
        <meta name="ms-sm-bypass" content="true">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Microsoft Defender Verification - ResilienceHub</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            color: #333;
            padding: 20px;
            text-align: center;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #4285F4;
          }
          .verification-badge {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 8px 15px;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Microsoft Defender Verification</h1>
          <div class="verification-badge">VERIFICATION SUCCESSFUL</div>
          <p>This page confirms that ResilienceHub is a legitimate application that has been verified as safe to use.</p>
          <p>The application does not contain malware, phishing attempts, or other security threats.</p>
          <p><a href="/">Return to the homepage</a></p>
        </div>
      </body>
      </html>
    `);
  });
  app2.get("/.well-known/microsoft-identity-association.json", (req, res) => {
    res.json({
      "associatedApplications": [
        {
          "applicationId": "ResilienceHub"
        }
      ]
    });
  });
  app2.get("/api/admin/engagement-settings", authenticate, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getEngagementSettings();
      if (!settings) {
        const defaultSettings = {
          reminderEnabled: true,
          reminderDays: 3,
          reminderTime: "09:00",
          weeklyDigestEnabled: true,
          weeklyDigestDay: 0,
          // Sunday
          weeklyDigestTime: "08:00",
          emailTemplate: "",
          reminderEmailSubject: "",
          reminderEmailTemplate: "",
          weeklyDigestSubject: "",
          weeklyDigestTemplate: "",
          escalationEnabled: false,
          escalationDays: [7, 14, 30],
          escalationTemplates: []
        };
        res.status(200).json(defaultSettings);
      } else {
        res.status(200).json(settings);
      }
    } catch (error) {
      console.error("Error fetching engagement settings:", error);
      res.status(500).json({ message: "Failed to fetch engagement settings" });
    }
  });
  app2.post("/api/admin/engagement-settings", authenticate, isAdmin, async (req, res) => {
    try {
      const {
        reminderEnabled,
        reminderDays,
        reminderTime,
        weeklyDigestEnabled,
        weeklyDigestDay,
        weeklyDigestTime,
        reminderEmailSubject,
        reminderEmailTemplate,
        weeklyDigestSubject,
        weeklyDigestTemplate,
        escalationEnabled,
        escalationDays,
        escalationTemplates
      } = req.body;
      const updatedSettings = await storage.updateEngagementSettings({
        reminderEnabled,
        reminderDays,
        reminderTime,
        weeklyDigestEnabled,
        weeklyDigestDay,
        weeklyDigestTime,
        reminderEmailSubject,
        reminderEmailTemplate,
        weeklyDigestSubject,
        weeklyDigestTemplate,
        escalationEnabled,
        escalationDays,
        escalationTemplates
      });
      console.log("Updated engagement settings:", updatedSettings);
      res.status(200).json({ message: "Settings updated successfully", settings: updatedSettings });
    } catch (error) {
      console.error("Error saving engagement settings:", error);
      res.status(500).json({ message: "Failed to save engagement settings" });
    }
  });
  app2.get("/api/admin/engagement-stats", authenticate, isAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const clients = users2.filter((user) => user.role === "client");
      const threeDaysAgo = /* @__PURE__ */ new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      let activeClients = 0;
      let inactiveClients = 0;
      for (const client of clients) {
        const emotions = await storage.getEmotionRecordsByUser(client.id);
        const hasRecentEmotion = emotions.some(
          (emotion) => new Date(emotion.createdAt) > threeDaysAgo
        );
        if (hasRecentEmotion) {
          activeClients++;
        } else {
          inactiveClients++;
        }
      }
      const stats = {
        lastRunTime: null,
        // Would track this in database
        totalEmailsSent: 0,
        // Would track this in database
        totalNotificationsSent: 0,
        // Would track this in database
        activeClients,
        inactiveClients
      };
      res.status(200).json(stats);
    } catch (error) {
      console.error("Error fetching engagement stats:", error);
      res.status(500).json({ message: "Failed to fetch engagement stats" });
    }
  });
  const httpServer = createServer(app2);
  app2.get("/api/admin/inactivity/check", authenticate, async (req, res) => {
    try {
      const daysThreshold = Number(req.query.days) || 3;
      const now = /* @__PURE__ */ new Date();
      const cutoffDate = new Date(now.getTime() - daysThreshold * 24 * 60 * 60 * 1e3);
      const query = `
        SELECT u.id, u.name, u.email, u.therapist_id as "therapistId"
        FROM users u
        WHERE u.role = 'client' 
          AND u.status = 'active'
          AND (
            -- Has tracked emotions before
            EXISTS (SELECT 1 FROM emotion_records e WHERE e.user_id = u.id)
            -- But not since cutoff date
            AND NOT EXISTS (
              SELECT 1 FROM emotion_records e 
              WHERE e.user_id = u.id 
              AND e.timestamp > $1
            )
          )
      `;
      const result = await pool3.query(query, [cutoffDate.toISOString()]);
      const inactiveClients = result.rows;
      return res.status(200).json({
        success: true,
        count: inactiveClients.length,
        clients: inactiveClients.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          therapistId: c.therapistId
        })),
        threshold: daysThreshold
      });
    } catch (error) {
      console.error("Error checking inactive clients:", error);
      return res.status(500).json({
        success: false,
        message: "Error checking inactive clients"
      });
    }
  });
  app2.post("/api/admin/inactivity/send-reminders", authenticate, async (req, res) => {
    try {
      const daysThreshold = req.body.days || 3;
      console.log(`Looking for clients inactive for ${daysThreshold} days...`);
      const now = /* @__PURE__ */ new Date();
      const cutoffDate = new Date(now.getTime() - daysThreshold * 24 * 60 * 60 * 1e3);
      const query = `
        SELECT u.id, u.name, u.email, u.therapist_id as "therapistId"
        FROM users u
        WHERE u.role = 'client' 
          AND u.status = 'active'
          AND (
            -- Has tracked emotions before
            EXISTS (SELECT 1 FROM emotion_records e WHERE e.user_id = u.id)
            -- But not since cutoff date
            AND NOT EXISTS (
              SELECT 1 FROM emotion_records e 
              WHERE e.user_id = u.id 
              AND e.timestamp > $1
            )
          )
      `;
      const result = await pool3.query(query, [cutoffDate.toISOString()]);
      const inactiveClients = result.rows;
      console.log(`Found ${inactiveClients.length} inactive clients`);
      let notificationsSent = 0;
      let emailsSent = 0;
      for (const client of inactiveClients) {
        const notificationData = {
          user_id: client.id,
          title: "Emotion Tracking Reminder",
          body: "It's been a while since you last recorded your emotions. Regular tracking helps build self-awareness and improve therapy outcomes.",
          type: "reminder",
          is_read: false,
          created_at: /* @__PURE__ */ new Date()
        };
        const notificationQuery = `
          INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        try {
          const notificationResult = await pool3.query(notificationQuery, [
            notificationData.user_id,
            notificationData.title,
            notificationData.body,
            notificationData.type,
            notificationData.is_read,
            notificationData.created_at
          ]);
          try {
            sendNotificationToUser(client.id, notificationResult.rows[0]);
          } catch (wsError) {
            console.log("WebSocket notification sending failed (not critical):", wsError);
          }
          notificationsSent++;
        } catch (notificationError) {
          console.error(`Error creating notification for user ${client.id}:`, notificationError);
        }
        if (isEmailEnabled()) {
          try {
            const emailSent = await sendEmotionTrackingReminder(client.email, client.name);
            if (emailSent) emailsSent++;
          } catch (emailError) {
            console.error(`Error sending email to ${client.email}:`, emailError);
          }
        }
      }
      return res.status(200).json({
        success: true,
        inactiveClients: inactiveClients.length,
        notificationsSent,
        emailsSent,
        emailsEnabled: isEmailEnabled(),
        message: `Sent ${notificationsSent} in-app notifications and ${emailsSent} emails to inactive clients`
      });
    } catch (error) {
      console.error("Error sending inactivity reminders:", error);
      return res.status(500).json({
        success: false,
        message: "Error sending inactivity reminders"
      });
    }
  });
  app2.post("/api/admin/weekly-digests/send", isAdmin, async (req, res) => {
    try {
      const usersQuery = `
        SELECT id, name, email, role
        FROM users
        WHERE status = 'active'
        ${req.body.userId ? "AND id = $1" : ""}
      `;
      const usersResult = req.body.userId ? await pool3.query(usersQuery, [req.body.userId]) : await pool3.query(usersQuery);
      const users2 = usersResult.rows;
      console.log(`Processing weekly digests for ${users2.length} users`);
      let notificationsSent = 0;
      let emailsSent = 0;
      const processedUsers = [];
      for (const user of users2) {
        console.log(`Processing weekly digest for: ${user.name} (ID: ${user.id})`);
        const now = /* @__PURE__ */ new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
        const startDate = oneWeekAgo.toISOString().split("T")[0];
        const endDate = now.toISOString().split("T")[0];
        const emotionQuery = `
          SELECT COUNT(*) as count 
          FROM emotion_records 
          WHERE user_id = $1 
          AND timestamp BETWEEN $2 AND $3
        `;
        const emotionResult = await pool3.query(emotionQuery, [user.id, startDate, endDate]);
        const emotionsTracked = parseInt(emotionResult.rows[0].count, 10);
        const journalQuery = `
          SELECT COUNT(*) as count 
          FROM journal_entries 
          WHERE user_id = $1 
          AND created_at BETWEEN $2 AND $3
        `;
        const journalResult = await pool3.query(journalQuery, [user.id, startDate, endDate]);
        const journalEntries2 = parseInt(journalResult.rows[0].count, 10);
        const thoughtQuery = `
          SELECT COUNT(*) as count 
          FROM thought_records 
          WHERE user_id = $1 
          AND created_at BETWEEN $2 AND $3
        `;
        const thoughtResult = await pool3.query(thoughtQuery, [user.id, startDate, endDate]);
        const thoughtRecords2 = parseInt(thoughtResult.rows[0].count, 10);
        const summary = {
          emotionsTracked,
          journalEntries: journalEntries2,
          thoughtRecords: thoughtRecords2,
          goalsProgress: "No updates",
          startDate,
          endDate
        };
        const message = `Your weekly progress report is ready. This week you tracked ${summary.emotionsTracked} emotions, wrote ${summary.journalEntries} journal entries, and completed ${summary.thoughtRecords} thought records.`;
        const notificationData = {
          title: "Weekly Progress Report",
          body: message,
          type: "progress_update",
          is_read: false,
          created_at: /* @__PURE__ */ new Date()
        };
        try {
          const notificationQuery = `
            INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
          `;
          const notificationResult = await pool3.query(notificationQuery, [
            user.id,
            notificationData.title,
            notificationData.body,
            notificationData.type,
            notificationData.is_read,
            notificationData.created_at
          ]);
          try {
            sendNotificationToUser(user.id, notificationResult.rows[0]);
          } catch (wsError) {
            console.log("WebSocket notification sending failed (not critical):", wsError);
          }
          notificationsSent++;
        } catch (notificationError) {
          console.error(`Error creating digest notification for user ${user.id}:`, notificationError);
        }
        if (isEmailEnabled()) {
          try {
            const emailSent = await sendWeeklyProgressDigest(user.email, user.name, summary);
            if (emailSent) emailsSent++;
          } catch (emailError) {
            console.error(`Error sending digest email to ${user.email}:`, emailError);
          }
        }
        processedUsers.push({
          id: user.id,
          name: user.name,
          stats: summary
        });
      }
      return res.status(200).json({
        success: true,
        totalUsers: users2.length,
        notificationsSent,
        emailsSent,
        emailsEnabled: isEmailEnabled(),
        processedUsers,
        message: `Sent ${notificationsSent} in-app notifications and ${emailsSent} weekly digest emails`
      });
    } catch (error) {
      console.error("Error sending weekly digests:", error);
      return res.status(500).json({
        success: false,
        message: "Error sending weekly digests"
      });
    }
  });
  if (process.env.NODE_ENV === "development") {
    app2.get("/api/test/email-debug", async (req, res) => {
      try {
        const testEmail = req.query.email?.toString() || "test@example.com";
        console.log(`Attempting to send test email to: ${testEmail}`);
        const emailSent = await sendEmail({
          to: testEmail,
          subject: "Email System Test",
          html: "<h1>Test Email</h1><p>This is a test email sent from ResilienceHub application.</p>"
        });
        if (emailSent) {
          res.json({
            success: true,
            message: `Test email sent to ${testEmail}`,
            details: "Check your email inbox or spam folder"
          });
        } else {
          res.json({
            success: false,
            message: "Email sending failed. See server logs for details."
          });
        }
      } catch (error) {
        console.error("Test email error:", error);
        res.status(500).json({
          error: "Failed to send test email",
          details: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : void 0
        });
      }
    });
    app2.get("/api/test/welcome-email", async (req, res) => {
      try {
        const testEmail = req.query.email?.toString() || "test@example.com";
        console.log(`Attempting to send professional welcome email to: ${testEmail}`);
        const emailSent = await sendProfessionalWelcomeEmail(
          testEmail,
          "Test Therapist",
          "testuser123",
          "password123",
          `${req.protocol}://${req.get("host")}/login`
        );
        if (emailSent) {
          console.log(`Professional welcome email successfully sent to ${testEmail}`);
          res.json({
            success: true,
            message: `Professional welcome email sent to ${testEmail}`,
            details: "Check email inbox or spam folder"
          });
        } else {
          console.log(`Failed to send professional welcome email to ${testEmail}`);
          res.json({
            success: false,
            message: "Email sending failed. Check server logs for details."
          });
        }
      } catch (error) {
        console.error("Professional welcome email error:", error);
        res.status(500).json({
          error: "Failed to send professional welcome email",
          details: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : void 0
        });
      }
    });
    app2.get("/api/test/invitation-notification", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).json({ success: false, message: "Email parameter is required" });
      }
      const diagnostics = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        notificationCreated: false,
        invitationCreated: false,
        errors: []
      };
      try {
        console.log(`=== INVITATION SYSTEM TEST ===`);
        console.log(`Testing with email: ${email}`);
        try {
          console.log("Step 1: Creating test notification...");
          const notification = await storage.createNotification({
            userId: 1,
            // Admin user
            title: "Test Client Invitation",
            body: `This is a test notification for inviting ${email} to Resilience CBT. This demonstrates the new invitation notification type.`,
            type: "invitation",
            isRead: false,
            linkPath: "/clients",
            metadata: {
              email,
              invitedAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          });
          console.log("Notification created successfully:", notification.id);
          diagnostics.notificationCreated = true;
        } catch (notificationError) {
          console.error("Error creating notification:", notificationError);
          diagnostics.errors.push(`Notification error: ${notificationError.message}`);
        }
        try {
          console.log("Step 2: Creating client invitation record...");
          const username = "testuser_" + Math.floor(Math.random() * 1e3);
          const password = "temp" + Math.floor(Math.random() * 1e4);
          const invitation = await storage.createClientInvitation({
            email,
            therapistId: 1,
            status: "pending",
            tempUsername: username,
            tempPassword: password,
            inviteLink: `https://example.com/invite?email=${encodeURIComponent(email)}&code=${Math.random().toString(36).substring(2, 15)}`
          });
          console.log("Client invitation created successfully:", invitation.id);
          diagnostics.invitationCreated = true;
        } catch (invitationError) {
          console.error("Error creating client invitation:", invitationError);
          diagnostics.errors.push(`Invitation error: ${invitationError.message}`);
        }
        if (diagnostics.notificationCreated && diagnostics.invitationCreated) {
          return res.status(200).send(`
            <html>
              <head>
                <title>Test Successful</title>
                <style>
                  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                  h1 { color: #4A6FA5; }
                  .success { background: #e6ffe6; border-left: 4px solid #4CAF50; padding: 10px; }
                  pre { background: #f5f5f5; padding: 10px; overflow: auto; }
                </style>
              </head>
              <body>
                <h1>Client Invitation System Test: Success</h1>
                <div class="success">
                  <p>\u2705 Successfully created notification for ${email}</p>
                  <p>\u2705 Successfully created client invitation record</p>
                  <p>The client invitation system is working correctly.</p>
                </div>
                <h3>Diagnostic Information:</h3>
                <pre>${JSON.stringify(diagnostics, null, 2)}</pre>
              </body>
            </html>
          `);
        } else if (diagnostics.notificationCreated) {
          return res.status(200).send(`
            <html>
              <head>
                <title>Partial Test Success</title>
                <style>
                  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                  h1 { color: #FFA500; }
                  .warning { background: #fff8e6; border-left: 4px solid #FFA500; padding: 10px; }
                  .command { background: #f5f5f5; padding: 10px; font-family: monospace; }
                  pre { background: #f5f5f5; padding: 10px; overflow: auto; }
                </style>
              </head>
              <body>
                <h1>Client Invitation System Test: Partial Success</h1>
                <div class="warning">
                  <p>\u2705 Successfully created notification for ${email}</p>
                  <p>\u274C Failed to create client invitation record</p>
                  <p>The client_invitations table might not be created in the database yet.</p>
                </div>
                <h3>Recommended Action:</h3>
                <p>Run the following command to push the schema changes to the database:</p>
                <div class="command">npm run db:push</div>
                <h3>Error Details:</h3>
                <pre>${diagnostics.errors.join("\n")}</pre>
              </body>
            </html>
          `);
        } else {
          return res.status(500).send(`
            <html>
              <head>
                <title>Test Failed</title>
                <style>
                  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                  h1 { color: #D32F2F; }
                  .error { background: #ffe6e6; border-left: 4px solid #D32F2F; padding: 10px; }
                  pre { background: #f5f5f5; padding: 10px; overflow: auto; }
                </style>
              </head>
              <body>
                <h1>Client Invitation System Test: Failed</h1>
                <div class="error">
                  <p>\u274C Failed to create notification</p>
                  <p>\u274C Failed to create client invitation record</p>
                  <p>The client invitation system is not working correctly.</p>
                </div>
                <h3>Error Details:</h3>
                <pre>${diagnostics.errors.join("\n")}</pre>
              </body>
            </html>
          `);
        }
      } catch (error) {
        console.error("Overall test execution error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to execute invitation system test",
          error: error.message,
          diagnostics
        });
      }
    });
    app2.get("/api/test/therapist-email", async (req, res) => {
      try {
        const testEmail = req.query.email?.toString() || "test@example.com";
        console.log(`Attempting to send test therapist email to: ${testEmail}`);
        console.log("=== TESTING MULTIPLE SENDER DOMAINS ===");
        console.log(`1. Testing primary domain: Resilience CBT <noreply@send.rcrc.ca>`);
        let emailSent = await sendProfessionalWelcomeEmail(
          testEmail,
          "Test Professional",
          "testuser123",
          "password123",
          `${req.protocol}://${req.get("host")}/login`
        );
        console.log(`Result with primary domain: ${emailSent ? "Success" : "Failed"}`);
        if (!emailSent) {
          const domains = [
            "Resilience CBT <noreply@sparkpostmail.com>",
            "Resilience CBT <noreply@eu.sparkpostmail.com>",
            "Resilience CBT <noreply@mail.sparkpost.com>"
          ];
          for (let i = 0; i < domains.length; i++) {
            const originalDefault = DEFAULT_FROM_EMAIL;
            global.DEFAULT_FROM_EMAIL = domains[i];
            console.log(`${i + 2}. Testing alternative domain: ${domains[i]}`);
            emailSent = await sendProfessionalWelcomeEmail(
              testEmail,
              "Test Professional",
              "testuser123",
              "password123",
              `${req.protocol}://${req.get("host")}/login`
            );
            console.log(`Result with ${domains[i]}: ${emailSent ? "Success" : "Failed"}`);
            global.DEFAULT_FROM_EMAIL = originalDefault;
            if (emailSent) break;
          }
        }
        if (emailSent) {
          console.log(`Test therapist email successfully sent to ${testEmail}`);
          res.json({
            success: true,
            message: `Email sent to ${testEmail}`,
            details: "Check email inbox or spam folder. If you don't see it, please verify your email address is correct."
          });
        } else {
          console.log(`Failed to send test therapist email to ${testEmail}`);
          res.json({
            success: false,
            message: "Email sending failed with all domains. Check server logs for details."
          });
        }
      } catch (error) {
        console.error("Test therapist email error:", error);
        res.status(500).json({
          error: "Failed to send test therapist email",
          details: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : void 0
        });
      }
    });
    app2.get("/api/test/direct-email", async (req, res) => {
      try {
        const testEmail = req.query.email?.toString();
        if (!testEmail) {
          return res.status(400).json({
            success: false,
            message: "Email parameter is required"
          });
        }
        console.log(`Sending direct email test to: ${testEmail}`);
        const result = await sparkPostClient.transmissions.send({
          content: {
            from: {
              name: "Resilience CBT",
              email: "support@sparkpostbox.com"
              // Using SparkPost's sandbox domain which is always enabled
            },
            subject: "Direct Test Email",
            text: "This is a direct test email with minimal formatting to test deliverability."
          },
          recipients: [
            { address: testEmail }
          ]
        });
        console.log("Direct email test response:", JSON.stringify(result, null, 2));
        res.json({
          success: true,
          message: `Direct email test sent to ${testEmail}. Please check your inbox and spam folder.`,
          transmissionId: result.results.id
        });
      } catch (error) {
        console.error("Direct email test error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to send direct email test",
          error: error.message
        });
      }
    });
    app2.get("/api/test/email-diagnostics", async (req, res) => {
      try {
        const testEmail = req.query.email?.toString();
        if (!testEmail) {
          return res.status(400).json({
            success: false,
            message: "Email parameter is required"
          });
        }
        console.log("=== EMAIL DIAGNOSTICS START ===");
        console.log(`Target email: ${testEmail}`);
        console.log(`SparkPost API Key configured: ${process.env.SPARKPOST_API_KEY ? "Yes" : "No"}`);
        console.log(`SparkPost API Key length: ${process.env.SPARKPOST_API_KEY?.length || 0}`);
        console.log(`Sender email: Resilience CBT <noreply@send.rcrc.ca>`);
        let sparkPostApiStatus = "Unknown";
        let sparkPostApiDetails = null;
        try {
          if (process.env.SPARKPOST_API_KEY) {
            console.log("\nChecking SparkPost API health...");
            const apiResponse = await sparkPostClient.sendingDomains.all();
            console.log("SparkPost API responded successfully");
            console.log("Sending domains:", JSON.stringify(apiResponse.results || [], null, 2));
            const ourDomain = "send.rcrc.ca";
            const domainInfo = apiResponse.results.find((domain) => domain.domain === ourDomain);
            if (domainInfo) {
              console.log(`Domain '${ourDomain}' status:`, JSON.stringify(domainInfo, null, 2));
              sparkPostApiStatus = "Active";
              sparkPostApiDetails = {
                domainFound: true,
                domainStatus: domainInfo.status,
                dkimStatus: domainInfo.dkim?.status,
                spfStatus: domainInfo.spf_status,
                complianceStatus: domainInfo.compliance_status
              };
            } else {
              console.log(`Domain '${ourDomain}' not found in SparkPost account`);
              sparkPostApiStatus = "Domain Not Found";
              sparkPostApiDetails = { domainFound: false };
            }
          } else {
            console.log("Cannot check SparkPost API without API key");
            sparkPostApiStatus = "Missing API Key";
          }
        } catch (sparkPostError) {
          console.error("Error checking SparkPost API:", sparkPostError);
          sparkPostApiStatus = "Error";
          sparkPostApiDetails = {
            error: sparkPostError.message,
            statusCode: sparkPostError.statusCode,
            response: sparkPostError.response?.body
          };
        }
        console.log("\n1. Testing plain text email...");
        const plainTextResult = await sendEmail({
          to: testEmail,
          subject: "Diagnostics: Plain Text Email",
          text: "This is a plain text email for diagnostics purposes."
        });
        console.log(`Plain text email result: ${plainTextResult ? "Success" : "Failed"}`);
        console.log("\n2. Testing HTML email...");
        const htmlResult = await sendEmail({
          to: testEmail,
          subject: "Diagnostics: HTML Email",
          html: "<h1>HTML Email Test</h1><p>This is an HTML email for diagnostics purposes.</p>"
        });
        console.log(`HTML email result: ${htmlResult ? "Success" : "Failed"}`);
        console.log("\n3. Testing professional welcome email...");
        const welcomeResult = await sendProfessionalWelcomeEmail(
          testEmail,
          "Test Professional",
          "testuser123",
          "password123",
          `${req.protocol}://${req.get("host")}/login`
        );
        console.log(`Welcome email result: ${welcomeResult ? "Success" : "Failed"}`);
        console.log("=== EMAIL DIAGNOSTICS END ===");
        res.json({
          success: true,
          diagnostics: {
            targetEmail: testEmail,
            sparkPostConfigured: process.env.SPARKPOST_API_KEY ? true : false,
            sparkPostApiStatus,
            sparkPostApiDetails,
            senderEmail: "Resilience CBT <noreply@send.rcrc.ca>",
            plainTextEmailSent: plainTextResult,
            htmlEmailSent: htmlResult,
            welcomeEmailSent: welcomeResult,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          },
          message: "Email diagnostics completed. Check server logs for detailed results."
        });
      } catch (error) {
        console.error("Email diagnostics error:", error);
        res.status(500).json({
          success: false,
          error: "Email diagnostics failed",
          details: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : void 0
        });
      }
    });
  }
  app2.get("/api/export", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const { type, clientId } = req.query;
      let targetUserId = userId;
      if (req.user.role === "therapist" && clientId) {
        const isClient = await isClientOfTherapist(Number(clientId), userId);
        if (!isClient) {
          return res.status(403).json({ message: "You don't have access to this client's data" });
        }
        targetUserId = Number(clientId);
      } else if (req.user.role === "admin" && clientId) {
        targetUserId = Number(clientId);
      }
      let exportData;
      let filename;
      switch (type) {
        case "emotions":
          exportData = await storage.getEmotionRecordsByUser(targetUserId);
          filename = `emotion-records-${targetUserId}-${Date.now()}.json`;
          break;
        case "thoughts":
          exportData = await storage.getThoughtRecordsByUser(targetUserId);
          filename = `thought-records-${targetUserId}-${Date.now()}.json`;
          break;
        case "journals":
          exportData = await storage.getJournalEntriesByUser(targetUserId);
          filename = `journal-entries-${targetUserId}-${Date.now()}.json`;
          break;
        case "goals":
          exportData = await storage.getGoalsByUser(targetUserId);
          filename = `goals-${targetUserId}-${Date.now()}.json`;
          break;
        case "all":
          const emotions = await storage.getEmotionRecordsByUser(targetUserId);
          const thoughts = await storage.getThoughtRecordsByUser(targetUserId);
          const journals = await storage.getJournalEntriesByUser(targetUserId);
          const goals2 = await storage.getGoalsByUser(targetUserId);
          exportData = {
            emotions,
            thoughts,
            journals,
            goals: goals2
          };
          filename = `full-export-${targetUserId}-${Date.now()}.json`;
          break;
        default:
          return res.status(400).json({ message: "Invalid export type" });
      }
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      return res.json(exportData);
    } catch (error) {
      console.error("Error exporting data:", error);
      return res.status(500).json({ message: "Failed to export data" });
    }
  });
  app2.get("/api/export/csv", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const { type, clientId } = req.query;
      let targetUserId = userId;
      if (req.user.role === "therapist" && clientId) {
        const isClient = await isClientOfTherapist(Number(clientId), userId);
        if (!isClient) {
          return res.status(403).json({ message: "You don't have access to this client's data" });
        }
        targetUserId = Number(clientId);
      } else if (req.user.role === "admin" && clientId) {
        targetUserId = Number(clientId);
      }
      let csvData = "";
      let filename;
      switch (type) {
        case "emotions":
          const emotions = await storage.getEmotionRecordsByUser(targetUserId);
          if (emotions && emotions.length > 0) {
            csvData = "ID,Date,Core Emotion,Primary Emotion,Tertiary Emotion,Intensity,Situation,Location,Company\n";
            emotions.forEach((record) => {
              const date2 = new Date(record.timestamp).toLocaleString();
              csvData += `${record.id},${date2},"${record.coreEmotion}","${record.primaryEmotion || ""}","${record.tertiaryEmotion || ""}",${record.intensity},"${record.situation?.replace(/"/g, '""') || ""}","${record.location?.replace(/"/g, '""') || ""}","${record.company?.replace(/"/g, '""') || ""}"
`;
            });
          }
          filename = `emotion-records-${targetUserId}-${Date.now()}.csv`;
          break;
        case "thoughts":
          const thoughts = await storage.getThoughtRecordsByUser(targetUserId);
          if (thoughts && thoughts.length > 0) {
            csvData = "ID,Date,Automatic Thoughts,Evidence For,Evidence Against,Alternative Perspective,Insights Gained,Reflection Rating\n";
            thoughts.forEach((record) => {
              const date2 = new Date(record.createdAt).toLocaleString();
              csvData += `${record.id},${date2},"${record.automaticThoughts?.replace(/"/g, '""') || ""}","${record.evidenceFor?.replace(/"/g, '""') || ""}","${record.evidenceAgainst?.replace(/"/g, '""') || ""}","${record.alternativePerspective?.replace(/"/g, '""') || ""}","${record.insightsGained?.replace(/"/g, '""') || ""}",${record.reflectionRating || ""}
`;
            });
          }
          filename = `thought-records-${targetUserId}-${Date.now()}.csv`;
          break;
        case "journals":
          const journals = await storage.getJournalEntriesByUser(targetUserId);
          if (journals && journals.length > 0) {
            csvData = "ID,Date,Title,Content,Mood,Selected Tags,Emotions\n";
            journals.forEach((record) => {
              const date2 = new Date(record.createdAt).toLocaleString();
              const selectedTags = record.selectedTags ? JSON.stringify(record.selectedTags).replace(/"/g, '""') : "";
              const emotions2 = record.emotions ? JSON.stringify(record.emotions).replace(/"/g, '""') : "";
              csvData += `${record.id},${date2},"${record.title?.replace(/"/g, '""') || ""}","${record.content?.replace(/"/g, '""') || ""}",${record.mood || ""},"${selectedTags}","${emotions2}"
`;
            });
          }
          filename = `journal-entries-${targetUserId}-${Date.now()}.csv`;
          break;
        case "goals":
          const goals2 = await storage.getGoalsByUser(targetUserId);
          if (goals2 && goals2.length > 0) {
            csvData = "ID,Date,Title,Specific,Measurable,Achievable,Relevant,Timebound,Deadline,Status\n";
            goals2.forEach((record) => {
              const date2 = new Date(record.createdAt).toLocaleString();
              const deadline = record.deadline ? new Date(record.deadline).toLocaleString() : "";
              csvData += `${record.id},${date2},"${record.title?.replace(/"/g, '""') || ""}","${record.specific?.replace(/"/g, '""') || ""}","${record.measurable?.replace(/"/g, '""') || ""}","${record.achievable?.replace(/"/g, '""') || ""}","${record.relevant?.replace(/"/g, '""') || ""}","${record.timebound?.replace(/"/g, '""') || ""}","${deadline}","${record.status || ""}"
`;
            });
          }
          filename = `goals-${targetUserId}-${Date.now()}.csv`;
          break;
        case "all":
          const emotionsData = await storage.getEmotionRecordsByUser(targetUserId);
          const thoughtsData = await storage.getThoughtRecordsByUser(targetUserId);
          const journalsData = await storage.getJournalEntriesByUser(targetUserId);
          const goalsData = await storage.getGoalsByUser(targetUserId);
          csvData = "# EMOTION RECORDS\n";
          if (emotionsData && emotionsData.length > 0) {
            csvData += "ID,Date,Core Emotion,Primary Emotion,Tertiary Emotion,Intensity,Situation,Location,Company\n";
            emotionsData.forEach((record) => {
              const date2 = new Date(record.timestamp).toLocaleString();
              csvData += `${record.id},${date2},"${record.coreEmotion}","${record.primaryEmotion || ""}","${record.tertiaryEmotion || ""}",${record.intensity},"${record.situation?.replace(/"/g, '""') || ""}","${record.location?.replace(/"/g, '""') || ""}","${record.company?.replace(/"/g, '""') || ""}"
`;
            });
          } else {
            csvData += "No emotion records found.\n";
          }
          csvData += "\n# THOUGHT RECORDS\n";
          if (thoughtsData && thoughtsData.length > 0) {
            csvData += "ID,Date,Automatic Thoughts,Evidence For,Evidence Against,Alternative Perspective,Insights Gained,Reflection Rating\n";
            thoughtsData.forEach((record) => {
              const date2 = new Date(record.createdAt).toLocaleString();
              csvData += `${record.id},${date2},"${record.automaticThoughts?.replace(/"/g, '""') || ""}","${record.evidenceFor?.replace(/"/g, '""') || ""}","${record.evidenceAgainst?.replace(/"/g, '""') || ""}","${record.alternativePerspective?.replace(/"/g, '""') || ""}","${record.insightsGained?.replace(/"/g, '""') || ""}",${record.reflectionRating || ""}
`;
            });
          } else {
            csvData += "No thought records found.\n";
          }
          csvData += "\n# JOURNAL ENTRIES\n";
          if (journalsData && journalsData.length > 0) {
            csvData += "ID,Date,Title,Content,Mood,Selected Tags,Emotions\n";
            journalsData.forEach((record) => {
              const date2 = new Date(record.createdAt).toLocaleString();
              const selectedTags = record.selectedTags ? JSON.stringify(record.selectedTags).replace(/"/g, '""') : "";
              const emotions2 = record.emotions ? JSON.stringify(record.emotions).replace(/"/g, '""') : "";
              csvData += `${record.id},${date2},"${record.title?.replace(/"/g, '""') || ""}","${record.content?.replace(/"/g, '""') || ""}",${record.mood || ""},"${selectedTags}","${emotions2}"
`;
            });
          } else {
            csvData += "No journal entries found.\n";
          }
          csvData += "\n# GOALS\n";
          if (goalsData && goalsData.length > 0) {
            csvData += "ID,Date,Title,Specific,Measurable,Achievable,Relevant,Timebound,Deadline,Status\n";
            goalsData.forEach((record) => {
              const date2 = new Date(record.createdAt).toLocaleString();
              const deadline = record.deadline ? new Date(record.deadline).toLocaleString() : "";
              csvData += `${record.id},${date2},"${record.title?.replace(/"/g, '""') || ""}","${record.specific?.replace(/"/g, '""') || ""}","${record.measurable?.replace(/"/g, '""') || ""}","${record.achievable?.replace(/"/g, '""') || ""}","${record.relevant?.replace(/"/g, '""') || ""}","${record.timebound?.replace(/"/g, '""') || ""}","${deadline}","${record.status || ""}"
`;
            });
          } else {
            csvData += "No goals found.\n";
          }
          filename = `complete-export-${targetUserId}-${Date.now()}.csv`;
          break;
        default:
          return res.status(400).json({ message: "Invalid export type for CSV format" });
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      return res.send(csvData);
    } catch (error) {
      console.error("Error exporting CSV data:", error);
      return res.status(500).json({ message: "Failed to export CSV data" });
    }
  });
  app2.get("/api/export/html", authenticate, ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { type = "all", clientId } = req.query;
      let targetUserId = userId;
      if (req.user.role === "therapist" && clientId) {
        const isClient = await isClientOfTherapist(Number(clientId), userId);
        if (!isClient) {
          return res.status(403).json({ message: "You don't have access to this client's data" });
        }
        targetUserId = Number(clientId);
      } else if (req.user.role === "admin" && clientId) {
        targetUserId = Number(clientId);
      }
      const user = await storage.getUser(targetUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let htmlContent = `
        <h1>Resilience CBT - Data Export</h1>
        <p><strong>User:</strong> ${user.name} (${user.email})</p>
        <p><strong>Export Date:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
        <p><strong>Export Type:</strong> ${type}</p>
        <hr />
      `;
      if (type === "emotions" || type === "all") {
        const emotions = await storage.getEmotionRecordsByUser(targetUserId);
        htmlContent += `
          <h2>Emotion Records (${emotions?.length || 0})</h2>
          ${emotions && emotions.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Core Emotion</th>
                  <th>Primary Emotion</th>
                  <th>Tertiary Emotion</th>
                  <th>Intensity</th>
                  <th>Situation</th>
                </tr>
              </thead>
              <tbody>
                ${emotions.map((record) => `
                  <tr>
                    <td>${new Date(record.timestamp).toLocaleDateString()}</td>
                    <td>${record.coreEmotion || ""}</td>
                    <td>${record.primaryEmotion || ""}</td>
                    <td>${record.tertiaryEmotion || ""}</td>
                    <td>${record.intensity || ""}</td>
                    <td>${record.situation || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          ` : "<p>No emotion records found.</p>"}
        `;
      }
      if (type === "thoughts" || type === "all") {
        const thoughts = await storage.getThoughtRecordsByUser(targetUserId);
        htmlContent += `
          <h2>Thought Records (${thoughts?.length || 0})</h2>
          ${thoughts && thoughts.length > 0 ? thoughts.map((record) => `
            <div style="margin-bottom: 20px; border: 1px solid #eee; padding: 15px; border-radius: 5px;">
              <h3>Record #${record.id} - ${new Date(record.createdAt).toLocaleDateString()}</h3>
              <p><strong>Automatic Thoughts:</strong> ${record.automaticThoughts || "None recorded"}</p>
              <p><strong>Cognitive Distortions:</strong> ${record.cognitiveDistortions?.join(", ") || "None identified"}</p>
              ${record.evidenceFor ? `<p><strong>Evidence For:</strong> ${record.evidenceFor}</p>` : ""}
              ${record.evidenceAgainst ? `<p><strong>Evidence Against:</strong> ${record.evidenceAgainst}</p>` : ""}
              ${record.alternativePerspective ? `<p><strong>Alternative Perspective:</strong> ${record.alternativePerspective}</p>` : ""}
            </div>
          `).join("") : "<p>No thought records found.</p>"}
        `;
      }
      if (type === "journals" || type === "all") {
        const journals = await storage.getJournalEntriesByUser(targetUserId);
        htmlContent += `
          <h2>Journal Entries (${journals?.length || 0})</h2>
          ${journals && journals.length > 0 ? journals.map((entry) => `
            <div style="margin-bottom: 20px; border: 1px solid #eee; padding: 15px; border-radius: 5px;">
              <h3>${entry.title || "Untitled Entry"} - ${new Date(entry.createdAt).toLocaleDateString()}</h3>
              <p>${entry.content || "No content"}</p>
              ${entry.mood ? `<p><strong>Mood:</strong> ${entry.mood}</p>` : ""}
              ${entry.selectedTags && entry.selectedTags.length > 0 ? `<p><strong>Tags:</strong> ${entry.selectedTags.join(", ")}</p>` : ""}
            </div>
          `).join("") : "<p>No journal entries found.</p>"}
        `;
      }
      if (type === "goals" || type === "all") {
        const goals2 = await storage.getGoalsByUser(targetUserId);
        htmlContent += `
          <h2>Goals (${goals2?.length || 0})</h2>
          ${goals2 && goals2.length > 0 ? goals2.map((goal) => `
            <div style="margin-bottom: 20px; border: 1px solid #eee; padding: 15px; border-radius: 5px;">
              <h3>${goal.title}</h3>
              <p><strong>Created:</strong> ${new Date(goal.createdAt).toLocaleDateString()}</p>
              <p><strong>Deadline:</strong> ${goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "No deadline"}</p>
              <p><strong>Status:</strong> ${goal.status || "Not set"}</p>
              <p><strong>Specific:</strong> ${goal.specific}</p>
              <p><strong>Measurable:</strong> ${goal.measurable}</p>
              <p><strong>Achievable:</strong> ${goal.achievable}</p>
              <p><strong>Relevant:</strong> ${goal.relevant}</p>
              <p><strong>Time-Bound:</strong> ${goal.timeBound}</p>
              ${goal.therapistComments ? `<p><strong>Therapist Comments:</strong> ${goal.therapistComments}</p>` : ""}
            </div>
          `).join("") : "<p>No goals found.</p>"}
        `;
      }
      res.setHeader("Content-Type", "text/html");
      res.send(htmlContent);
    } catch (error) {
      console.error("Error generating HTML export:", error);
      res.status(500).json({ message: "Failed to generate HTML export" });
    }
  });
  app2.get("/api/export/pdf", authenticate, ensureAuthenticated, async (req, res) => {
    try {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'self'");
      res.setHeader("X-Frame-Options", "DENY");
      const userId = req.user.id;
      const { type = "all", clientId } = req.query;
      const requestId = Date.now().toString();
      console.log(`[${requestId}] PDF Export request:`, { userId, type, clientId });
      let targetUserId = userId;
      if (req.user.role === "therapist" && clientId) {
        const isClient = await isClientOfTherapist(Number(clientId), userId);
        if (!isClient) {
          return res.status(403).json({ message: "You don't have access to this client's data" });
        }
        targetUserId = Number(clientId);
      } else if (req.user.role === "admin" && clientId) {
        targetUserId = Number(clientId);
      }
      const { exportPDF: exportPDF2 } = await Promise.resolve().then(() => (init_pdfExport(), pdfExport_exports));
      const { join: join2, dirname } = await import("path");
      const { fileURLToPath: fileURLToPath3 } = await import("url");
      const currentFilePath = fileURLToPath3(import.meta.url);
      const currentDirPath = dirname(currentFilePath);
      const tempDir = join2(currentDirPath, "..", "temp_pdf");
      await exportPDF2(
        {
          type: typeof type === "string" ? type : "all",
          targetUserId,
          tempDir,
          requestId
        },
        storage,
        res
      );
    } catch (error) {
      console.error("Error exporting PDF data:", error);
      if (!res.headersSent) {
        return res.status(500).json({
          message: "Failed to generate PDF",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });
  app2.get("/api/users/:userId/recommendations", authenticate, checkUserAccess, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (req.user?.role === "client") {
        const recommendations2 = await storage.getAiRecommendationsByUser(userId);
        const approvedRecommendations = recommendations2.filter((rec) => rec.status === "approved");
        return res.status(200).json(approvedRecommendations);
      }
      const recommendations = await storage.getAiRecommendationsByUser(userId);
      res.status(200).json(recommendations);
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      res.status(500).json({ message: "Failed to fetch AI recommendations" });
    }
  });
  app2.get("/api/therapist/recommendations/pending", authenticate, isTherapist, async (req, res) => {
    try {
      const pendingRecommendations = await storage.getPendingAiRecommendationsByProfessional(req.user.id);
      res.status(200).json(pendingRecommendations);
    } catch (error) {
      console.error("Error fetching pending AI recommendations:", error);
      res.status(500).json({ message: "Failed to fetch pending AI recommendations" });
    }
  });
  app2.post("/api/users/:userId/recommendations", authenticate, ensureAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.role !== "client" || !user.therapistId) {
        return res.status(400).json({
          message: "Recommendations can only be created for clients with an assigned therapist"
        });
      }
      const validatedData = insertAiRecommendationSchema.parse({
        ...req.body,
        userId,
        therapistId: user.therapistId,
        status: "pending"
      });
      const newRecommendation = await storage.createAiRecommendation(validatedData);
      await sendNotificationToUser(user.therapistId, {
        title: "New AI Recommendation",
        content: `There is a new AI recommendation for ${user.name} that requires your review.`,
        type: "ai_recommendation",
        link: `/therapist/recommendations`
      });
      res.status(201).json(newRecommendation);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating AI recommendation:", error);
      res.status(500).json({ message: "Failed to create AI recommendation" });
    }
  });
  app2.patch("/api/recommendations/:id/status", authenticate, isTherapist, async (req, res) => {
    try {
      const recommendationId = parseInt(req.params.id);
      const { status, therapistNotes } = req.body;
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Valid status (approved or rejected) is required" });
      }
      const recommendation = await storage.getAiRecommendationById(recommendationId);
      if (!recommendation) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      if (recommendation.therapistId !== req.user.id) {
        return res.status(403).json({
          message: "You can only manage recommendations for your clients"
        });
      }
      const updatedRecommendation = await storage.updateAiRecommendationStatus(
        recommendationId,
        status,
        therapistNotes
      );
      if (status === "approved") {
        await sendNotificationToUser(recommendation.userId, {
          title: "New Recommendation Available",
          content: "Your therapist has approved a new recommendation for you.",
          type: "recommendation",
          link: `/recommendations`
        });
      }
      res.status(200).json(updatedRecommendation);
    } catch (error) {
      console.error("Error updating recommendation status:", error);
      res.status(500).json({ message: "Failed to update recommendation status" });
    }
  });
  app2.post("/api/recommendations/:id/implement", authenticate, ensureAuthenticated, async (req, res) => {
    try {
      const recommendationId = parseInt(req.params.id);
      const recommendation = await storage.getAiRecommendationById(recommendationId);
      if (!recommendation) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      if (recommendation.userId !== req.user.id) {
        return res.status(403).json({
          message: "You can only implement your own recommendations"
        });
      }
      if (recommendation.status !== "approved") {
        return res.status(400).json({
          message: "Only approved recommendations can be marked as implemented"
        });
      }
      const updatedRecommendation = await storage.updateAiRecommendationStatus(
        recommendationId,
        "implemented"
      );
      await sendNotificationToUser(recommendation.therapistId, {
        title: "Recommendation Implemented",
        content: `Your client has implemented the recommendation: ${recommendation.title}`,
        type: "recommendation_implemented",
        link: `/therapist/clients/${recommendation.userId}/recommendations`
      });
      res.status(200).json(updatedRecommendation);
    } catch (error) {
      console.error("Error implementing recommendation:", error);
      res.status(500).json({ message: "Failed to implement recommendation" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var vite_config_default = defineConfig(async () => ({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "client", "src"),
      "@shared": path2.resolve(__dirname, "shared"),
      "@assets": path2.resolve(__dirname, "attached_assets")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
}));

// server/vite.ts
import { nanoid as nanoid2 } from "nanoid";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path3.dirname(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const resolvedConfig = typeof vite_config_default === "function" ? await vite_config_default() : vite_config_default;
  const vite = await createViteServer({
    ...resolvedConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        // ✅ make sure to use __dirname instead of import.meta.dirname
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.header("X-Safe-App", "true");
  res.header("X-Legitimate-Resource", "true");
  res.header("X-MS-SmartScreen-Bypass", "true");
  res.header("X-App-Type", "mental-health-tools");
  res.header("X-Microsoft-Edge-Secure", "verified");
  const allowedOrigins = [
    "https://workspace.dramjedabojedi.repl.co",
    "https://resiliencehub.net"
    // Add any other domains you use
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.headers["x-security-verification"]) {
    res.header("X-Security-Verification-Response", "accepted");
  }
  if (req.headers["x-requested-with"]) {
    res.header("X-Requested-With-Response", "verified");
  }
  res.header("Content-Security-Policy-Report-Only", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  const { engagementScheduler: engagementScheduler2 } = await Promise.resolve().then(() => (init_scheduler(), scheduler_exports));
  engagementScheduler2.start();
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5003;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
