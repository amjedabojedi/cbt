var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc15) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc15 = __getOwnPropDesc(from, key)) || desc15.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  actions: () => actions,
  aiRecommendations: () => aiRecommendations,
  clientInvitations: () => clientInvitations,
  cognitiveDistortions: () => cognitiveDistortions,
  copingStrategies: () => copingStrategies,
  copingStrategyUsage: () => copingStrategyUsage,
  emailLogs: () => emailLogs,
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
import { pgTable, text, serial, integer, jsonb, timestamp, boolean, date, varchar, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var subscriptionPlans, users, emotionRecords, cognitiveDistortions, thoughtRecords, protectiveFactors, protectiveFactorUsage, copingStrategies, copingStrategyUsage, goals, goalMilestones, actions, resources, resourceAssignments, resourceFeedback, journalEntries, journalComments, reframePracticeResults, userGameProfile, sessions, passwordResetTokens, insertSubscriptionPlanSchema, insertUserSchema, insertCognitiveDistortionSchema, insertEmotionRecordSchema, insertThoughtRecordSchema, insertProtectiveFactorSchema, insertProtectiveFactorUsageSchema, insertCopingStrategySchema, insertCopingStrategyUsageSchema, insertGoalSchema, insertGoalMilestoneSchema, insertActionSchema, insertResourceSchema, insertResourceAssignmentSchema, insertResourceFeedbackSchema, insertJournalEntrySchema, insertJournalCommentSchema, insertReframePracticeResultSchema, insertUserGameProfileSchema, insertSessionSchema, insertPasswordResetTokenSchema, notifications, insertNotificationSchema, engagementSettings, insertEngagementSettingsSchema, notificationPreferences, systemLogs, insertNotificationPreferencesSchema, insertSystemLogSchema, aiRecommendations, insertAiRecommendationSchema, emailLogs, clientInvitations, insertClientInvitationSchema;
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
    insertThoughtRecordSchema = createInsertSchema(thoughtRecords).omit({ id: true, createdAt: true }).extend({
      automaticThoughts: z.string().max(1e4, "Automatic thoughts must not exceed 10,000 characters"),
      situation: z.string().max(5e3, "Situation must not exceed 5,000 characters").nullable().optional(),
      evidenceFor: z.string().max(5e3, "Evidence for must not exceed 5,000 characters").nullable().optional(),
      evidenceAgainst: z.string().max(5e3, "Evidence against must not exceed 5,000 characters").nullable().optional(),
      alternativePerspective: z.string().max(5e3, "Alternative perspective must not exceed 5,000 characters").nullable().optional(),
      insightsGained: z.string().max(5e3, "Insights gained must not exceed 5,000 characters").nullable().optional()
    });
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
    insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true, updatedAt: true }).extend({
      title: z.string().max(500, "Title must not exceed 500 characters"),
      content: z.string().max(5e4, "Content must not exceed 50,000 characters")
    });
    insertJournalCommentSchema = createInsertSchema(journalComments).omit({ id: true, createdAt: true, updatedAt: true }).extend({
      comment: z.string().min(1, "Comment cannot be empty").max(2e3, "Comment must not exceed 2,000 characters")
    });
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
      level: varchar("level", { length: 50 }).notNull().default("info"),
      message: text("message").notNull().default(""),
      userId: integer("user_id").references(() => users.id),
      actionType: varchar("action_type", { length: 100 }),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").defaultNow(),
      action: varchar("action"),
      details: jsonb("details").$type()
    });
    insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSystemLogSchema = createInsertSchema(systemLogs).omit({
      id: true,
      createdAt: true
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
    emailLogs = pgTable("email_logs", {
      id: serial("id").primaryKey(),
      recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
      subject: varchar("subject", { length: 500 }).notNull(),
      emailType: varchar("email_type", { length: 100 }).notNull(),
      status: varchar("status", { length: 50 }).notNull().default("sent"),
      sparkpostTransactionId: varchar("sparkpost_transaction_id", { length: 255 }),
      errorMessage: text("error_message"),
      sentAt: timestamp("sent_at").defaultNow(),
      userId: integer("user_id").references(() => users.id),
      recipient: varchar("recipient", { length: 255 })
    });
    clientInvitations = pgTable("client_invitations", {
      id: serial("id").primaryKey(),
      email: text("email").notNull(),
      name: text("name"),
      therapistId: integer("therapist_id").notNull().references(() => users.id),
      status: text("status", {
        enum: ["pending", "email_sent", "email_failed", "accepted", "expired"]
      }).notNull().default("pending"),
      tempUsername: text("temp_username").notNull(),
      tempPassword: text("temp_password").notNull(),
      inviteLink: text("invite_link").notNull(),
      invitationToken: text("invitation_token"),
      // bcrypt hash of one-time token included in invite URL
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
  pool: () => pool,
  withRetry: () => withRetry
});
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
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
var pool, MAX_RETRIES, RETRY_DELAY_MS, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    console.log("Database connection pool initialized");
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      // Increase pool size for better concurrency
      min: 2,
      // Keep minimum connections alive
      idleTimeoutMillis: 6e4,
      // Longer idle timeout
      connectionTimeoutMillis: 1e4,
      // Faster connection timeout
      ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? { rejectUnauthorized: false } : false
    });
    MAX_RETRIES = 3;
    RETRY_DELAY_MS = 1e3;
    pool.on("connect", () => {
      console.log("New database connection established");
    });
    pool.on("error", (err) => {
      console.error("Database connection error:", err.message);
    });
    db = drizzle({ client: pool, schema: schema_exports });
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
  if (!EMAIL_ENABLED || sparkPostClient === null) {
    console.log("Email service disabled: SparkPost API key not configured or client initialization failed");
    return false;
  }
  try {
    const domain = DEFAULT_FROM_EMAIL.split("@")[1];
    console.log(`Attempting to use email domain: ${domain}`);
    console.log(`Using verified domain: ${domain} for email delivery`);
  } catch (error) {
    console.error("Error in domain verification check:", error);
  }
  return true;
}
async function sendEmail(params) {
  if (!isEmailEnabled()) {
    return false;
  }
  try {
    const transmission = {
      content: {
        from: params.from || DEFAULT_FROM_EMAIL,
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
        from: params.from || DEFAULT_FROM_EMAIL
      };
      if (params.templateData) {
        transmission.substitution_data = params.templateData;
      }
    }
    const response = await sparkPostClient.transmissions.send(transmission);
    const results = response?.results || {};
    const transmissionId = results?.id || results?.transmission_id || results?.message_id || "unknown";
    const totalAccepted = Number(results?.total_accepted_recipients ?? 0);
    const totalRejected = Number(results?.total_rejected_recipients ?? 0);
    console.log(
      `[Email] SENT subject="${params.subject}" to=${params.to} transmissionId=${transmissionId} accepted=${totalAccepted} rejected=${totalRejected}`
    );
    if (totalRejected > 0) {
      console.warn(`[Email] SparkPost reported rejected recipients`, JSON.stringify(results));
    }
    try {
      const emailType = params.templateId ? "template" : params.html ? "html" : "text";
      await pool.query(
        `INSERT INTO email_logs (recipient_email, recipient, subject, email_type, status, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [params.to, params.to, params.subject, emailType, "sent", /* @__PURE__ */ new Date()]
      );
    } catch (dbError) {
      console.error("Failed to log email to database (non-critical):", dbError);
    }
    return true;
  } catch (error) {
    const statusCode = error?.statusCode || error?.status || "unknown";
    console.error(`[Email] FAILED subject="${params.subject}" to=${params.to} status=${statusCode}:`, error?.message || error);
    if (error?.errors) {
      console.error("[Email] SparkPost errors:", JSON.stringify(error.errors));
    }
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
    from: DEFAULT_FROM_EMAIL,
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
    from: DEFAULT_FROM_EMAIL,
    subject,
    text: text2,
    html
  });
}
async function sendPasswordResetEmail(email, resetLink) {
  const subject = "Reset Your ResilienceHub\u2122 Password";
  const text2 = `
Hello,

We received a request to reset your password for your ResilienceHub\u2122 account. If you didn't make this request, please ignore this email.

To reset your password, click the link below:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please contact our support team immediately.

Best regards,
Resilience Counseling Research and Consultation Team
`;
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://www.rcrc.ca/wp-content/uploads/2023/06/RCRC-Logo-scaled.jpg" alt="Resilience Counseling Research and Consultation" style="max-width: 200px;">
  </div>
  
  <h2 style="color: #4A6FA5; margin-bottom: 20px;">Reset Your Password</h2>
  
  <p>Hello,</p>
  
  <p>We received a request to reset your password for your ResilienceHub\u2122 account. If you didn't make this request, please ignore this email.</p>
  
  <p>To reset your password, click the button below:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetLink}" style="background-color: #4A6FA5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
  </div>
  
  <p>This link will expire in 1 hour for security reasons.</p>
  
  <p>If you didn't request a password reset, please contact our support team immediately.</p>
  
  <p>Best regards,<br>
  Resilience Counseling Research and Consultation Team</p>
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
    <p>For security, this reset request was received on ${(/* @__PURE__ */ new Date()).toLocaleDateString()} at ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}</p>
  </div>
</div>
`;
  return sendEmail({
    to: email,
    from: DEFAULT_FROM_EMAIL,
    subject,
    text: text2,
    html
  });
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
  const registrationUrl = inviteLink || `FALLBACK_URL_ERROR_CHECK_INVITE_GENERATION`;
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
var DEFAULT_FROM_EMAIL, SPARKPOST_API_KEY, EMAIL_ENABLED, sparkPostClient;
var init_email = __esm({
  "server/services/email.ts"() {
    "use strict";
    init_db();
    DEFAULT_FROM_EMAIL = "noreply@send.rcrc.ca";
    SPARKPOST_API_KEY = process.env.SPARKPOST_API_KEY;
    EMAIL_ENABLED = !!SPARKPOST_API_KEY;
    sparkPostClient = null;
    if (EMAIL_ENABLED) {
      try {
        sparkPostClient = new SparkPost(SPARKPOST_API_KEY);
        console.log("[Email] SparkPost client initialized successfully - email service ACTIVE");
      } catch (error) {
        console.error("[Email] Failed to initialize SparkPost client:", error);
      }
    } else {
      console.warn("[Email] SPARKPOST_API_KEY not set - email service DISABLED. Password reset emails will NOT be sent.");
    }
  }
});

// server/services/notificationService.ts
import { eq as eq17, desc as desc14, and as and13 } from "drizzle-orm";
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
import { eq as eq18, and as and14, sql as sql9, or as or3 } from "drizzle-orm";
async function findInactiveClients(days) {
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
      lastActivity: sql9`MAX(${emotionRecords.timestamp})`.as("last_activity")
    }).from(users).leftJoin(emotionRecords, eq18(users.id, emotionRecords.userId)).where(
      and14(
        eq18(users.role, "client"),
        eq18(users.status, "active"),
        sql9`${users.id} IN (${activeUserIds.join(",")})`
      )
    ).groupBy(users.id).having(
      or3(
        sql9`MAX(${emotionRecords.timestamp}) < ${cutoffDate.toISOString()}`,
        sql9`MAX(${emotionRecords.timestamp}) IS NULL`
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
        console.warn(`Failed to send reminder email to client ${clientId}`);
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
    const inactiveClients = await findInactiveClients(config.inactivityThreshold);
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
        console.log(`Successfully sent reminder to client ${client.id}`);
      } else {
        failed++;
        console.warn(`Failed to send reminder to client ${client.id}`);
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

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import cookieParser from "cookie-parser";

// server/middleware/csrf.ts
var SAFE_METHODS = /* @__PURE__ */ new Set(["GET", "HEAD", "OPTIONS"]);
function getAllowedHosts() {
  const fromEnv = (process.env.CSRF_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean).map((origin) => {
    try {
      return new URL(origin).host;
    } catch {
      return origin;
    }
  });
  return new Set(fromEnv);
}
var allowlist = getAllowedHosts();
function verifyOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.headers["x-requested-with"] === "ResilienceHub-Mobile" || req.headers["x-app-platform"] === "mobile") {
    return next();
  }
  console.log("[CSRF] headers:", JSON.stringify(req.headers));
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const source = origin || referer;
  if (!source) {
    return res.status(403).json({ message: "Origin header required" });
  }
  let sourceHost;
  try {
    sourceHost = new URL(source).host;
  } catch {
    return res.status(403).json({ message: "Invalid origin" });
  }
  const expectedHost = req.headers["x-forwarded-host"] || req.headers.host || "";
  if (sourceHost === expectedHost) return next();
  if (allowlist.has(sourceHost)) return next();
  return res.status(403).json({ message: "Cross-origin request blocked" });
}

// server/services/integrationRoutes.ts
init_db();

// server/repositories/users.repository.ts
init_schema();
init_db();
import { eq, and, desc, sql } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";
var UsersRepository = class {
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
        console.log(`Attempting to fetch user by username`);
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
    if (!therapistId || isNaN(therapistId)) {
      console.error("Invalid therapist ID provided:", therapistId);
      return [];
    }
    try {
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
      const result = await pool.query(query, [therapistId]);
      return result.rows;
    } catch (error) {
      console.error("Error in getClients:", error);
      return [];
    }
  }
  async getClientsByTherapistId(therapistId) {
    try {
      return await db.select().from(users).where(eq(users.therapistId, therapistId)).orderBy(users.name);
    } catch (error) {
      console.error("Error in getClientsByTherapistId:", error);
      return [];
    }
  }
  async getClient(clientId) {
    try {
      const [client] = await db.select().from(users).where(eq(users.id, clientId));
      return client;
    } catch (error) {
      console.error(`Error in getClient for ID ${clientId}:`, error);
      return void 0;
    }
  }
  async getSession(sessionId) {
    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (session) {
        return { userId: session.userId };
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error in getSession:`, error);
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
    const [updatedUser] = await db.update(users).set({ currentViewingClientId: clientId }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async getCurrentViewingClient(userId) {
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
        return null;
      }
      return user.currentViewingClientId;
    } catch (error) {
      console.error("Error in getCurrentViewingClient:", error);
      return null;
    }
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
    const [updatedUser] = await db.update(users).set({ status }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async removeClientFromTherapist(clientId, therapistId) {
    const client = await this.getUser(clientId);
    if (!client || client.therapistId !== therapistId) {
      return null;
    }
    const [updatedClient] = await db.update(users).set({ therapistId: null }).where(eq(users.id, clientId)).returning();
    await db.update(users).set({ currentViewingClientId: null }).where(
      and(
        eq(users.id, therapistId),
        eq(users.currentViewingClientId, clientId)
      )
    );
    return updatedClient;
  }
  async deleteUser(userId, adminId) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    if (adminId) {
      try {
        const admin = await this.getUser(adminId);
        await db.insert((init_schema(), __toCommonJS(schema_exports)).systemLogs).values({
          action: "user_deleted",
          userId: adminId,
          details: {
            deletedUserId: userId,
            username: user.username,
            email: user.email,
            role: user.role,
            adminUsername: admin?.username || "Unknown"
          },
          ipAddress: null,
          level: "info",
          message: `User ${user.username} deleted by admin ${admin?.username || "Unknown"}`
        });
      } catch (error) {
        console.error("Error creating system log during deletion:", error);
      }
    }
    if (user.role === "therapist") {
      const clients = await db.select().from(users).where(eq(users.therapistId, userId));
      for (const client of clients) {
        await db.insert(notifications).values({
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
      await db.insert(notifications).values({
        userId: user.therapistId,
        title: "Client Account Removed",
        body: `Your client ${user.name} (${user.username}) has been removed from the system.`,
        type: "system",
        isRead: false,
        link: null
      });
    }
    await db.delete(sessions).where(eq(sessions.userId, userId));
    const userEmotionRecords = await db.select().from(emotionRecords).where(eq(emotionRecords.userId, userId));
    for (const record of userEmotionRecords) {
      await db.delete(protectiveFactorUsage).where(eq(protectiveFactorUsage.thoughtRecordId, record.id));
      await db.delete(copingStrategyUsage).where(eq(copingStrategyUsage.thoughtRecordId, record.id));
      await db.delete(reframePracticeResults).where(eq(reframePracticeResults.thoughtRecordId, record.id));
      await db.delete(emotionRecords).where(eq(emotionRecords.id, record.id));
    }
    await db.delete(protectiveFactors).where(eq(protectiveFactors.userId, userId));
    await db.delete(copingStrategies).where(eq(copingStrategies.userId, userId));
    const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));
    for (const goal of userGoals) {
      await db.delete(goalMilestones).where(eq(goalMilestones.goalId, goal.id));
      await db.delete(goals).where(eq(goals.id, goal.id));
    }
    const userJournals = await db.select().from(journalEntries).where(eq(journalEntries.userId, userId));
    for (const journal of userJournals) {
      await db.delete(journalComments).where(eq(journalComments.journalEntryId, journal.id));
      await db.delete(journalEntries).where(eq(journalEntries.id, journal.id));
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
        return await db.select().from(sessions).where(eq(sessions.id, sessionId));
      });
      return session;
    } catch (error) {
      console.error(`Error retrieving session:`, error);
      return void 0;
    }
  }
  async deleteSession(sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  // Client invitations
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
};

// server/repositories/therapy.repository.ts
init_schema();
init_db();
import { eq as eq2, desc as desc2, or as or2 } from "drizzle-orm";
var TherapyRepository = class {
  // Emotion records
  async createEmotionRecord(record) {
    const [emotionRecord] = await db.insert(emotionRecords).values(record).returning();
    return emotionRecord;
  }
  async getEmotionRecordsByUser(userId) {
    return db.select().from(emotionRecords).where(eq2(emotionRecords.userId, userId)).orderBy(desc2(emotionRecords.timestamp));
  }
  async getEmotionRecordById(id) {
    const [record] = await db.select().from(emotionRecords).where(eq2(emotionRecords.id, id));
    return record;
  }
  async deleteEmotionRecord(id) {
    const relatedThoughts = await this.getThoughtRecordsByEmotionId(id);
    for (const thought of relatedThoughts) {
      await this.deleteThoughtRecord(thought.id);
    }
    await db.delete(emotionRecords).where(eq2(emotionRecords.id, id));
  }
  async getAllEmotionRecords() {
    return db.select().from(emotionRecords).orderBy(desc2(emotionRecords.timestamp));
  }
  // Thought records
  async createThoughtRecord(record) {
    const [thoughtRecord] = await db.insert(thoughtRecords).values(record).returning();
    return thoughtRecord;
  }
  async getThoughtRecordsByUser(userId) {
    return db.select().from(thoughtRecords).where(eq2(thoughtRecords.userId, userId)).orderBy(desc2(thoughtRecords.createdAt));
  }
  async getThoughtRecordById(id) {
    const [record] = await db.select().from(thoughtRecords).where(eq2(thoughtRecords.id, id));
    return record;
  }
  async getThoughtRecordsByEmotionId(emotionRecordId) {
    return db.select().from(thoughtRecords).where(eq2(thoughtRecords.emotionRecordId, emotionRecordId)).orderBy(desc2(thoughtRecords.createdAt));
  }
  async deleteThoughtRecord(id) {
    await db.delete(reframePracticeResults).where(eq2(reframePracticeResults.thoughtRecordId, id));
    await db.delete(copingStrategyUsage).where(eq2(copingStrategyUsage.thoughtRecordId, id));
    await db.delete(protectiveFactorUsage).where(eq2(protectiveFactorUsage.thoughtRecordId, id));
    await db.delete(thoughtRecords).where(eq2(thoughtRecords.id, id));
  }
  async getAllThoughtRecords() {
    return db.select().from(thoughtRecords).orderBy(desc2(thoughtRecords.createdAt));
  }
  // Protective factors
  async createProtectiveFactor(factor) {
    const [protectiveFactor] = await db.insert(protectiveFactors).values(factor).returning();
    return protectiveFactor;
  }
  async getProtectiveFactorsByUser(userId, includeGlobal = true) {
    const [user] = await db.select().from(users).where(eq2(users.id, userId));
    if (includeGlobal) {
      const conditions = [
        eq2(protectiveFactors.userId, userId),
        eq2(protectiveFactors.isGlobal, true)
      ];
      if (user && user.therapistId) {
        conditions.push(eq2(protectiveFactors.userId, user.therapistId));
      }
      return db.select().from(protectiveFactors).where(or2(...conditions)).orderBy(protectiveFactors.name);
    } else {
      return db.select().from(protectiveFactors).where(eq2(protectiveFactors.userId, userId)).orderBy(protectiveFactors.name);
    }
  }
  async getProtectiveFactorById(id) {
    const [factor] = await db.select().from(protectiveFactors).where(eq2(protectiveFactors.id, id));
    return factor;
  }
  async updateProtectiveFactor(id, data) {
    const [updatedFactor] = await db.update(protectiveFactors).set(data).where(eq2(protectiveFactors.id, id)).returning();
    return updatedFactor;
  }
  async deleteProtectiveFactor(id) {
    await db.delete(protectiveFactorUsage).where(eq2(protectiveFactorUsage.protectiveFactorId, id));
    await db.delete(protectiveFactors).where(eq2(protectiveFactors.id, id));
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
    const [user] = await db.select().from(users).where(eq2(users.id, userId));
    if (includeGlobal) {
      const conditions = [
        eq2(copingStrategies.userId, userId),
        eq2(copingStrategies.isGlobal, true)
      ];
      if (user && user.therapistId) {
        conditions.push(eq2(copingStrategies.userId, user.therapistId));
      }
      return db.select().from(copingStrategies).where(or2(...conditions)).orderBy(copingStrategies.name);
    } else {
      return db.select().from(copingStrategies).where(eq2(copingStrategies.userId, userId)).orderBy(copingStrategies.name);
    }
  }
  async getCopingStrategyById(id) {
    const [strategy] = await db.select().from(copingStrategies).where(eq2(copingStrategies.id, id));
    return strategy;
  }
  async updateCopingStrategy(id, data) {
    const [updatedStrategy] = await db.update(copingStrategies).set(data).where(eq2(copingStrategies.id, id)).returning();
    return updatedStrategy;
  }
  async deleteCopingStrategy(id) {
    await db.delete(copingStrategyUsage).where(eq2(copingStrategyUsage.copingStrategyId, id));
    await db.delete(copingStrategies).where(eq2(copingStrategies.id, id));
  }
  // Coping strategy usage
  async addCopingStrategyUsage(usage) {
    const [strategyUsage] = await db.insert(copingStrategyUsage).values(usage).returning();
    return strategyUsage;
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
    const [distortion] = await db.select().from(cognitiveDistortions).where(eq2(cognitiveDistortions.id, id));
    return distortion;
  }
  async updateCognitiveDistortion(id, data) {
    const [updatedDistortion] = await db.update(cognitiveDistortions).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(cognitiveDistortions.id, id)).returning();
    return updatedDistortion;
  }
  async deleteCognitiveDistortion(id) {
    await db.delete(cognitiveDistortions).where(eq2(cognitiveDistortions.id, id));
  }
};

// server/repositories/goals.repository.ts
init_schema();
init_db();
import { eq as eq3, desc as desc3 } from "drizzle-orm";
var GoalsRepository = class {
  // Goals
  async createGoal(goal) {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }
  async getGoalsByUser(userId) {
    return db.select().from(goals).where(eq3(goals.userId, userId)).orderBy(desc3(goals.createdAt));
  }
  async updateGoalStatus(id, status, therapistComments) {
    const updateData = { status };
    if (therapistComments) {
      updateData.therapistComments = therapistComments;
    }
    const [updatedGoal] = await db.update(goals).set(updateData).where(eq3(goals.id, id)).returning();
    return updatedGoal;
  }
  async getAllGoals() {
    return db.select().from(goals).orderBy(desc3(goals.createdAt));
  }
  // Goal milestones
  async createGoalMilestone(milestone) {
    const [newMilestone] = await db.insert(goalMilestones).values(milestone).returning();
    return newMilestone;
  }
  async getGoalMilestonesByGoal(goalId) {
    return db.select().from(goalMilestones).where(eq3(goalMilestones.goalId, goalId)).orderBy(goalMilestones.dueDate);
  }
  async updateGoalMilestoneCompletion(id, isCompleted) {
    const [updatedMilestone] = await db.update(goalMilestones).set({ isCompleted }).where(eq3(goalMilestones.id, id)).returning();
    return updatedMilestone;
  }
  // Actions
  async createAction(action) {
    const [newAction] = await db.insert(actions).values(action).returning();
    return newAction;
  }
  async getActionsByUser(userId) {
    return db.select().from(actions).where(eq3(actions.userId, userId)).orderBy(desc3(actions.createdAt));
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
    const [updatedAction] = await db.update(actions).set(updateData).where(eq3(actions.id, id)).returning();
    return updatedAction;
  }
};

// server/repositories/journal.repository.ts
init_schema();
init_db();
import { eq as eq4, desc as desc4 } from "drizzle-orm";
var JournalRepository = class {
  // Journal entries
  async createJournalEntry(entry) {
    const [newEntry] = await db.insert(journalEntries).values(entry).returning();
    return newEntry;
  }
  async getJournalEntryById(id) {
    const [entry] = await db.select().from(journalEntries).where(eq4(journalEntries.id, id));
    return entry;
  }
  async getJournalEntriesByUser(userId) {
    return db.select().from(journalEntries).where(eq4(journalEntries.userId, userId)).orderBy(desc4(journalEntries.createdAt));
  }
  async updateJournalEntry(id, data) {
    const [updatedEntry] = await db.update(journalEntries).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(journalEntries.id, id)).returning();
    return updatedEntry;
  }
  async deleteJournalEntry(id) {
    await db.delete(journalComments).where(eq4(journalComments.journalEntryId, id));
    await db.delete(journalEntries).where(eq4(journalEntries.id, id));
  }
  // Journal comments
  async createJournalComment(comment) {
    const [newComment] = await db.insert(journalComments).values(comment).returning();
    return newComment;
  }
  async getJournalCommentsByEntry(journalEntryId) {
    return db.select({
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
    }).from(journalComments).leftJoin(users, eq4(journalComments.userId, users.id)).where(eq4(journalComments.journalEntryId, journalEntryId)).orderBy(journalComments.createdAt);
  }
  async updateJournalComment(id, data) {
    const [updatedComment] = await db.update(journalComments).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(journalComments.id, id)).returning();
    return updatedComment;
  }
  async deleteJournalComment(id) {
    await db.delete(journalComments).where(eq4(journalComments.id, id));
  }
  // Integration: Journal entries <-> Thought records
  async linkJournalToThoughtRecord(journalId, thoughtRecordId) {
    const [journal] = await db.select().from(journalEntries).where(eq4(journalEntries.id, journalId));
    if (!journal) {
      throw new Error(`Journal entry with ID ${journalId} not found`);
    }
    const [thoughtRecord] = await db.select().from(thoughtRecords).where(eq4(thoughtRecords.id, thoughtRecordId));
    if (!thoughtRecord) {
      throw new Error(`Thought record with ID ${thoughtRecordId} not found`);
    }
    const currentThoughtRecordIds = journal.relatedThoughtRecordIds || [];
    if (!currentThoughtRecordIds.includes(thoughtRecordId)) {
      await db.update(journalEntries).set({
        relatedThoughtRecordIds: [...currentThoughtRecordIds, thoughtRecordId],
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq4(journalEntries.id, journalId));
    }
    const currentJournalEntryIds = thoughtRecord.relatedJournalEntryIds || [];
    if (!currentJournalEntryIds.includes(journalId)) {
      await db.update(thoughtRecords).set({
        relatedJournalEntryIds: [...currentJournalEntryIds, journalId]
      }).where(eq4(thoughtRecords.id, thoughtRecordId));
    }
  }
  async unlinkJournalFromThoughtRecord(journalId, thoughtRecordId) {
    const [journal] = await db.select().from(journalEntries).where(eq4(journalEntries.id, journalId));
    if (!journal) {
      throw new Error(`Journal entry with ID ${journalId} not found`);
    }
    const [thoughtRecord] = await db.select().from(thoughtRecords).where(eq4(thoughtRecords.id, thoughtRecordId));
    if (!thoughtRecord) {
      throw new Error(`Thought record with ID ${thoughtRecordId} not found`);
    }
    const currentThoughtRecordIds = journal.relatedThoughtRecordIds || [];
    if (currentThoughtRecordIds.includes(thoughtRecordId)) {
      await db.update(journalEntries).set({
        relatedThoughtRecordIds: currentThoughtRecordIds.filter((id) => id !== thoughtRecordId),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq4(journalEntries.id, journalId));
    }
    const currentJournalEntryIds = thoughtRecord.relatedJournalEntryIds || [];
    if (currentJournalEntryIds.includes(journalId)) {
      await db.update(thoughtRecords).set({
        relatedJournalEntryIds: currentJournalEntryIds.filter((id) => id !== journalId)
      }).where(eq4(thoughtRecords.id, thoughtRecordId));
    }
  }
  async getRelatedThoughtRecords(journalId) {
    const [journal] = await db.select().from(journalEntries).where(eq4(journalEntries.id, journalId));
    if (!journal || !journal.relatedThoughtRecordIds || journal.relatedThoughtRecordIds.length === 0) {
      return [];
    }
    const relatedRecords = [];
    for (const recordId of journal.relatedThoughtRecordIds) {
      const [record] = await db.select().from(thoughtRecords).where(eq4(thoughtRecords.id, recordId));
      if (record) {
        relatedRecords.push(record);
      }
    }
    return relatedRecords;
  }
  async getRelatedJournalEntries(thoughtRecordId) {
    const [thoughtRecord] = await db.select().from(thoughtRecords).where(eq4(thoughtRecords.id, thoughtRecordId));
    if (!thoughtRecord || !thoughtRecord.relatedJournalEntryIds || thoughtRecord.relatedJournalEntryIds.length === 0) {
      return [];
    }
    const relatedEntries = [];
    for (const entryId of thoughtRecord.relatedJournalEntryIds) {
      const [entry] = await db.select().from(journalEntries).where(eq4(journalEntries.id, entryId));
      if (entry) {
        relatedEntries.push(entry);
      }
    }
    return relatedEntries;
  }
};

// server/repositories/resources.repository.ts
init_schema();
init_db();
import { eq as eq5, and as and3, desc as desc5 } from "drizzle-orm";
var ResourcesRepository = class {
  // Resources
  async createResource(resource) {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }
  async getResourceById(id) {
    const [resource] = await db.select().from(resources).where(eq5(resources.id, id));
    return resource;
  }
  async getResourcesByCreator(userId) {
    return db.select().from(resources).where(eq5(resources.createdBy, userId)).orderBy(desc5(resources.createdAt));
  }
  async getResourcesByCategory(category) {
    return db.select().from(resources).where(and3(eq5(resources.category, category), eq5(resources.isPublished, true))).orderBy(desc5(resources.createdAt));
  }
  async getAllResources(includeUnpublished = false) {
    if (includeUnpublished) {
      return db.select().from(resources).orderBy(desc5(resources.createdAt));
    } else {
      return db.select().from(resources).where(eq5(resources.isPublished, true)).orderBy(desc5(resources.createdAt));
    }
  }
  async updateResource(id, data) {
    const [updatedResource] = await db.update(resources).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq5(resources.id, id)).returning();
    return updatedResource;
  }
  async deleteResource(id) {
    await db.delete(resourceAssignments).where(eq5(resourceAssignments.resourceId, id));
    await db.delete(resourceFeedback).where(eq5(resourceFeedback.resourceId, id));
    await db.delete(resources).where(eq5(resources.id, id));
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
    const [assignment] = await db.select().from(resourceAssignments).where(eq5(resourceAssignments.id, id));
    return assignment;
  }
  async getAssignmentsByClient(clientId) {
    return db.select().from(resourceAssignments).where(eq5(resourceAssignments.assignedTo, clientId)).orderBy(desc5(resourceAssignments.assignedAt));
  }
  async getAssignmentsByProfessional(professionalId) {
    return db.select().from(resourceAssignments).where(eq5(resourceAssignments.assignedBy, professionalId)).orderBy(desc5(resourceAssignments.assignedAt));
  }
  async getAssignmentsByTherapist(therapistId) {
    return this.getAssignmentsByProfessional(therapistId);
  }
  async updateAssignmentStatus(id, status) {
    const completedAt = status === "completed" ? /* @__PURE__ */ new Date() : null;
    const [updatedAssignment] = await db.update(resourceAssignments).set({
      status,
      completedAt
    }).where(eq5(resourceAssignments.id, id)).returning();
    return updatedAssignment;
  }
  async deleteResourceAssignment(id) {
    await db.delete(resourceAssignments).where(eq5(resourceAssignments.id, id));
  }
  async getAllResourceAssignments() {
    return db.select().from(resourceAssignments);
  }
  // Resource feedback
  async createResourceFeedback(feedback) {
    const [newFeedback] = await db.insert(resourceFeedback).values(feedback).returning();
    return newFeedback;
  }
  async getResourceFeedbackByResource(resourceId) {
    return db.select().from(resourceFeedback).where(eq5(resourceFeedback.resourceId, resourceId)).orderBy(desc5(resourceFeedback.createdAt));
  }
  async getResourceFeedbackByUser(userId) {
    return db.select().from(resourceFeedback).where(eq5(resourceFeedback.userId, userId)).orderBy(desc5(resourceFeedback.createdAt));
  }
};

// server/repositories/billing.repository.ts
init_schema();
init_db();
import { eq as eq6, and as and4 } from "drizzle-orm";
var BillingRepository = class {
  // Stripe user details updates
  async updateUserStripeInfo(userId, stripeInfo) {
    const [updatedUser] = await db.update(users).set({
      stripeCustomerId: stripeInfo.stripeCustomerId,
      stripeSubscriptionId: stripeInfo.stripeSubscriptionId
    }).where(eq6(users.id, userId)).returning();
    return updatedUser;
  }
  async updateSubscriptionStatus(userId, status, endDate) {
    const [updatedUser] = await db.update(users).set({
      subscriptionStatus: status,
      subscriptionEndDate: endDate ? endDate.toISOString().slice(0, 10) : void 0
    }).where(eq6(users.id, userId)).returning();
    return updatedUser;
  }
  async assignSubscriptionPlan(userId, planId) {
    const [updatedUser] = await db.update(users).set({
      subscriptionPlanId: planId
    }).where(eq6(users.id, userId)).returning();
    return updatedUser;
  }
  // Subscription plans CRUD
  async createSubscriptionPlan(plan) {
    const [newPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return newPlan;
  }
  async getSubscriptionPlans(activeOnly = true) {
    if (activeOnly) {
      return db.select().from(subscriptionPlans).where(eq6(subscriptionPlans.isActive, true)).orderBy(subscriptionPlans.price);
    } else {
      return db.select().from(subscriptionPlans).orderBy(subscriptionPlans.price);
    }
  }
  async getSubscriptionPlanById(id) {
    const [plan] = await db.select().from(subscriptionPlans).where(eq6(subscriptionPlans.id, id));
    return plan;
  }
  async updateSubscriptionPlan(id, data) {
    const [updatedPlan] = await db.update(subscriptionPlans).set(data).where(eq6(subscriptionPlans.id, id)).returning();
    return updatedPlan;
  }
  async getDefaultSubscriptionPlan() {
    const [plan] = await db.select().from(subscriptionPlans).where(and4(eq6(subscriptionPlans.isDefault, true), eq6(subscriptionPlans.isActive, true)));
    return plan;
  }
  async setDefaultSubscriptionPlan(id) {
    await db.update(subscriptionPlans).set({ isDefault: false }).where(eq6(subscriptionPlans.isDefault, true));
    const [defaultPlan] = await db.update(subscriptionPlans).set({ isDefault: true }).where(eq6(subscriptionPlans.id, id)).returning();
    return defaultPlan;
  }
  async deactivateSubscriptionPlan(id) {
    const [deactivatedPlan] = await db.update(subscriptionPlans).set({ isActive: false }).where(eq6(subscriptionPlans.id, id)).returning();
    return deactivatedPlan;
  }
};

// server/repositories/notifications.repository.ts
init_schema();
init_db();
import { eq as eq7, desc as desc6 } from "drizzle-orm";
var NotificationsRepository = class {
  // Notification management
  async createNotification(notification) {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }
  async getNotificationsByUser(userId, limit = 20) {
    return db.select().from(notifications).where(eq7(notifications.userId, userId)).orderBy(desc6(notifications.createdAt)).limit(limit);
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
    const notifs = result.rows || [];
    console.log(`STORAGE FIX: Found exactly ${notifs.length} unread notifications for user ${userId} (data integrity restored)`);
    return notifs;
  }
  async getNotificationById(id) {
    const [notification] = await db.select().from(notifications).where(eq7(notifications.id, id));
    return notification;
  }
  async markNotificationAsRead(id) {
    const [notification] = await db.update(notifications).set({ isRead: true }).where(eq7(notifications.id, id)).returning();
    return notification;
  }
  async markAllNotificationsAsRead(userId) {
    await db.update(notifications).set({ isRead: true }).where(eq7(notifications.userId, userId));
  }
  async deleteNotification(id) {
    await db.delete(notifications).where(eq7(notifications.id, id));
  }
  async clearAllNotifications(userId) {
    await db.delete(notifications).where(eq7(notifications.userId, userId));
  }
  // Notification preferences
  async getNotificationPreferences(userId) {
    const [preferences] = await db.select().from(notificationPreferences).where(eq7(notificationPreferences.userId, userId));
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
    }).where(eq7(notificationPreferences.userId, userId)).returning();
    return updatedPreferences;
  }
};

// server/repositories/admin.repository.ts
init_schema();
init_db();
import { eq as eq8, and as and5, desc as desc7 } from "drizzle-orm";
var AdminRepository = class {
  // System logs
  async createSystemLog(log2) {
    try {
      const [newLog] = await db.insert(systemLogs).values(log2).returning();
      return newLog;
    } catch (error) {
      console.error("Error creating system log:", error);
      return {
        id: 0,
        level: log2.level ?? "info",
        message: log2.message ?? log2.action ?? "",
        userId: log2.userId ?? null,
        actionType: log2.actionType ?? null,
        ipAddress: log2.ipAddress ?? null,
        userAgent: log2.userAgent ?? null,
        createdAt: /* @__PURE__ */ new Date(),
        action: log2.action ?? null,
        details: log2.details ?? null
      };
    }
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
      }).where(eq8(engagementSettings.id, existing.id)).returning();
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
  // AI Recommendations
  async createAiRecommendation(recommendation) {
    console.log("Creating AI recommendation:", recommendation);
    const [newRecommendation] = await db.insert(aiRecommendations).values(recommendation).returning();
    return newRecommendation;
  }
  async getAiRecommendationById(id) {
    const [recommendation] = await db.select().from(aiRecommendations).where(eq8(aiRecommendations.id, id));
    return recommendation;
  }
  async getAiRecommendationsByUser(userId) {
    return db.select().from(aiRecommendations).where(eq8(aiRecommendations.userId, userId)).orderBy(desc7(aiRecommendations.createdAt));
  }
  async getPendingAiRecommendationsByProfessional(professionalId) {
    return db.select().from(aiRecommendations).where(
      and5(
        eq8(aiRecommendations.therapistId, professionalId),
        eq8(aiRecommendations.status, "pending")
      )
    ).orderBy(desc7(aiRecommendations.createdAt));
  }
  async getPendingAiRecommendationsByTherapist(therapistId) {
    return this.getPendingAiRecommendationsByProfessional(therapistId);
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
    const [updatedRecommendation] = await db.update(aiRecommendations).set(updateData).where(eq8(aiRecommendations.id, id)).returning();
    return updatedRecommendation;
  }
  async deleteAiRecommendation(id) {
    await db.delete(aiRecommendations).where(eq8(aiRecommendations.id, id));
  }
};

// server/storage.ts
var DatabaseStorage = class {
  usersRepo = new UsersRepository();
  therapyRepo = new TherapyRepository();
  goalsRepo = new GoalsRepository();
  journalRepo = new JournalRepository();
  resourcesRepo = new ResourcesRepository();
  billingRepo = new BillingRepository();
  notificationsRepo = new NotificationsRepository();
  adminRepo = new AdminRepository();
  // User management
  async getUser(id) {
    return this.usersRepo.getUser(id);
  }
  async getUserByUsername(username) {
    return this.usersRepo.getUserByUsername(username);
  }
  async getUserByEmail(email) {
    return this.usersRepo.getUserByEmail(email);
  }
  async createUser(userData) {
    return this.usersRepo.createUser(userData);
  }
  async updateUser(id, data) {
    return this.usersRepo.updateUser(id, data);
  }
  async getClients(therapistId) {
    return this.usersRepo.getClients(therapistId);
  }
  async getClientsByTherapistId(therapistId) {
    return this.usersRepo.getClientsByTherapistId(therapistId);
  }
  async getClient(clientId) {
    return this.usersRepo.getClient(clientId);
  }
  async getSession(sessionId) {
    return this.usersRepo.getSession(sessionId);
  }
  async getClientByIdAndTherapist(clientId, therapistId) {
    return this.usersRepo.getClientByIdAndTherapist(clientId, therapistId);
  }
  async getAllUsers() {
    return this.usersRepo.getAllUsers();
  }
  async updateCurrentViewingClient(userId, clientId) {
    return this.usersRepo.updateCurrentViewingClient(userId, clientId);
  }
  async getCurrentViewingClient(userId) {
    return this.usersRepo.getCurrentViewingClient(userId);
  }
  async countTherapistClients(therapistId) {
    return this.usersRepo.countProfessionalClients(therapistId);
  }
  async countProfessionalClients(professionalId) {
    return this.usersRepo.countProfessionalClients(professionalId);
  }
  async updateUserTherapist(userId, therapistId) {
    return this.usersRepo.updateUserTherapist(userId, therapistId);
  }
  async updateUserStatus(userId, status) {
    return this.usersRepo.updateUserStatus(userId, status);
  }
  async removeClientFromTherapist(clientId, therapistId) {
    return this.usersRepo.removeClientFromTherapist(clientId, therapistId);
  }
  async deleteUser(userId, adminId) {
    return this.usersRepo.deleteUser(userId, adminId);
  }
  // Session management
  async createSession(userId) {
    return this.usersRepo.createSession(userId);
  }
  async getSessionById(sessionId) {
    return this.usersRepo.getSessionById(sessionId);
  }
  async deleteSession(sessionId) {
    return this.usersRepo.deleteSession(sessionId);
  }
  // Client invitations
  async createClientInvitation(invitation) {
    return this.usersRepo.createClientInvitation(invitation);
  }
  async getClientInvitationById(id) {
    return this.usersRepo.getClientInvitationById(id);
  }
  async getClientInvitationByEmail(email) {
    return this.usersRepo.getClientInvitationByEmail(email);
  }
  async getClientInvitationsByTherapist(therapistId) {
    return this.usersRepo.getClientInvitationsByProfessional(therapistId);
  }
  async getClientInvitationsByProfessional(professionalId) {
    return this.usersRepo.getClientInvitationsByProfessional(professionalId);
  }
  async updateClientInvitationStatus(id, status) {
    return this.usersRepo.updateClientInvitationStatus(id, status);
  }
  async deleteClientInvitation(id) {
    return this.usersRepo.deleteClientInvitation(id);
  }
  // System logs
  async createSystemLog(log2) {
    return this.adminRepo.createSystemLog(log2);
  }
  // Admin statistics methods
  async getAllEmotionRecords() {
    return this.therapyRepo.getAllEmotionRecords();
  }
  async getAllThoughtRecords() {
    return this.therapyRepo.getAllThoughtRecords();
  }
  async getAllGoals() {
    return this.goalsRepo.getAllGoals();
  }
  async getAllResourceAssignments() {
    return this.resourcesRepo.getAllResourceAssignments();
  }
  // Emotion records
  async createEmotionRecord(record) {
    return this.therapyRepo.createEmotionRecord(record);
  }
  async getEmotionRecordsByUser(userId) {
    return this.therapyRepo.getEmotionRecordsByUser(userId);
  }
  async getEmotionRecordById(id) {
    return this.therapyRepo.getEmotionRecordById(id);
  }
  async deleteEmotionRecord(id) {
    return this.therapyRepo.deleteEmotionRecord(id);
  }
  // Thought records
  async createThoughtRecord(record) {
    return this.therapyRepo.createThoughtRecord(record);
  }
  async getThoughtRecordsByUser(userId) {
    return this.therapyRepo.getThoughtRecordsByUser(userId);
  }
  async getThoughtRecordById(id) {
    return this.therapyRepo.getThoughtRecordById(id);
  }
  async getThoughtRecordsByEmotionId(emotionRecordId) {
    return this.therapyRepo.getThoughtRecordsByEmotionId(emotionRecordId);
  }
  async deleteThoughtRecord(id) {
    return this.therapyRepo.deleteThoughtRecord(id);
  }
  // Protective factors
  async createProtectiveFactor(factor) {
    return this.therapyRepo.createProtectiveFactor(factor);
  }
  async getProtectiveFactorsByUser(userId, includeGlobal) {
    return this.therapyRepo.getProtectiveFactorsByUser(userId, includeGlobal);
  }
  async getProtectiveFactorById(id) {
    return this.therapyRepo.getProtectiveFactorById(id);
  }
  async updateProtectiveFactor(id, data) {
    return this.therapyRepo.updateProtectiveFactor(id, data);
  }
  async deleteProtectiveFactor(id) {
    return this.therapyRepo.deleteProtectiveFactor(id);
  }
  // Protective factor usage
  async addProtectiveFactorUsage(usage) {
    return this.therapyRepo.addProtectiveFactorUsage(usage);
  }
  // Coping strategies
  async createCopingStrategy(strategy) {
    return this.therapyRepo.createCopingStrategy(strategy);
  }
  async getCopingStrategiesByUser(userId, includeGlobal) {
    return this.therapyRepo.getCopingStrategiesByUser(userId, includeGlobal);
  }
  async getCopingStrategyById(id) {
    return this.therapyRepo.getCopingStrategyById(id);
  }
  async updateCopingStrategy(id, data) {
    return this.therapyRepo.updateCopingStrategy(id, data);
  }
  async deleteCopingStrategy(id) {
    return this.therapyRepo.deleteCopingStrategy(id);
  }
  // Coping strategy usage
  async addCopingStrategyUsage(usage) {
    return this.therapyRepo.addCopingStrategyUsage(usage);
  }
  // Cognitive distortions
  async createCognitiveDistortion(distortion) {
    return this.therapyRepo.createCognitiveDistortion(distortion);
  }
  async getCognitiveDistortions() {
    return this.therapyRepo.getCognitiveDistortions();
  }
  async getCognitiveDistortionById(id) {
    return this.therapyRepo.getCognitiveDistortionById(id);
  }
  async updateCognitiveDistortion(id, data) {
    return this.therapyRepo.updateCognitiveDistortion(id, data);
  }
  async deleteCognitiveDistortion(id) {
    return this.therapyRepo.deleteCognitiveDistortion(id);
  }
  // Goals
  async createGoal(goal) {
    return this.goalsRepo.createGoal(goal);
  }
  async getGoalsByUser(userId) {
    return this.goalsRepo.getGoalsByUser(userId);
  }
  async updateGoalStatus(id, status, therapistComments) {
    return this.goalsRepo.updateGoalStatus(id, status, therapistComments);
  }
  // Goal milestones
  async createGoalMilestone(milestone) {
    return this.goalsRepo.createGoalMilestone(milestone);
  }
  async getGoalMilestonesByGoal(goalId) {
    return this.goalsRepo.getGoalMilestonesByGoal(goalId);
  }
  async updateGoalMilestoneCompletion(id, isCompleted) {
    return this.goalsRepo.updateGoalMilestoneCompletion(id, isCompleted);
  }
  // Actions
  async createAction(action) {
    return this.goalsRepo.createAction(action);
  }
  async getActionsByUser(userId) {
    return this.goalsRepo.getActionsByUser(userId);
  }
  async updateActionCompletion(id, isCompleted, moodAfter, reflection) {
    return this.goalsRepo.updateActionCompletion(id, isCompleted, moodAfter, reflection);
  }
  // Resources
  async createResource(resource) {
    return this.resourcesRepo.createResource(resource);
  }
  async getResourceById(id) {
    return this.resourcesRepo.getResourceById(id);
  }
  async getResourcesByCreator(userId) {
    return this.resourcesRepo.getResourcesByCreator(userId);
  }
  async getResourcesByCategory(category) {
    return this.resourcesRepo.getResourcesByCategory(category);
  }
  async getAllResources(includeUnpublished) {
    return this.resourcesRepo.getAllResources(includeUnpublished);
  }
  async updateResource(id, data) {
    return this.resourcesRepo.updateResource(id, data);
  }
  async deleteResource(id) {
    return this.resourcesRepo.deleteResource(id);
  }
  async cloneResource(resourceId, userId) {
    return this.resourcesRepo.cloneResource(resourceId, userId);
  }
  // Resource assignments
  async assignResourceToClient(assignment) {
    return this.resourcesRepo.assignResourceToClient(assignment);
  }
  async getResourceAssignmentById(id) {
    return this.resourcesRepo.getResourceAssignmentById(id);
  }
  async getAssignmentsByClient(clientId) {
    return this.resourcesRepo.getAssignmentsByClient(clientId);
  }
  async getAssignmentsByTherapist(therapistId) {
    return this.resourcesRepo.getAssignmentsByTherapist(therapistId);
  }
  async getAssignmentsByProfessional(professionalId) {
    return this.resourcesRepo.getAssignmentsByProfessional(professionalId);
  }
  async updateAssignmentStatus(id, status) {
    return this.resourcesRepo.updateAssignmentStatus(id, status);
  }
  async deleteResourceAssignment(id) {
    return this.resourcesRepo.deleteResourceAssignment(id);
  }
  // Resource feedback
  async createResourceFeedback(feedback) {
    return this.resourcesRepo.createResourceFeedback(feedback);
  }
  async getResourceFeedbackByResource(resourceId) {
    return this.resourcesRepo.getResourceFeedbackByResource(resourceId);
  }
  async getResourceFeedbackByUser(userId) {
    return this.resourcesRepo.getResourceFeedbackByUser(userId);
  }
  // Journal entries
  async createJournalEntry(entry) {
    return this.journalRepo.createJournalEntry(entry);
  }
  async getJournalEntryById(id) {
    return this.journalRepo.getJournalEntryById(id);
  }
  async getJournalEntriesByUser(userId) {
    return this.journalRepo.getJournalEntriesByUser(userId);
  }
  async updateJournalEntry(id, data) {
    return this.journalRepo.updateJournalEntry(id, data);
  }
  async deleteJournalEntry(id) {
    return this.journalRepo.deleteJournalEntry(id);
  }
  // Journal comments
  async createJournalComment(comment) {
    return this.journalRepo.createJournalComment(comment);
  }
  async getJournalCommentsByEntry(journalEntryId) {
    return this.journalRepo.getJournalCommentsByEntry(journalEntryId);
  }
  async updateJournalComment(id, data) {
    return this.journalRepo.updateJournalComment(id, data);
  }
  async deleteJournalComment(id) {
    return this.journalRepo.deleteJournalComment(id);
  }
  // Integration: Journal entries <-> Thought records
  async linkJournalToThoughtRecord(journalId, thoughtRecordId) {
    return this.journalRepo.linkJournalToThoughtRecord(journalId, thoughtRecordId);
  }
  async unlinkJournalFromThoughtRecord(journalId, thoughtRecordId) {
    return this.journalRepo.unlinkJournalFromThoughtRecord(journalId, thoughtRecordId);
  }
  async getRelatedThoughtRecords(journalId) {
    return this.journalRepo.getRelatedThoughtRecords(journalId);
  }
  async getRelatedJournalEntries(thoughtRecordId) {
    return this.journalRepo.getRelatedJournalEntries(thoughtRecordId);
  }
  // Notification management
  async createNotification(notification) {
    return this.notificationsRepo.createNotification(notification);
  }
  async getNotificationsByUser(userId, limit) {
    return this.notificationsRepo.getNotificationsByUser(userId, limit);
  }
  async getUnreadNotificationsByUser(userId) {
    return this.notificationsRepo.getUnreadNotificationsByUser(userId);
  }
  async getNotificationById(id) {
    return this.notificationsRepo.getNotificationById(id);
  }
  async markNotificationAsRead(id) {
    return this.notificationsRepo.markNotificationAsRead(id);
  }
  async markAllNotificationsAsRead(userId) {
    return this.notificationsRepo.markAllNotificationsAsRead(userId);
  }
  async deleteNotification(id) {
    return this.notificationsRepo.deleteNotification(id);
  }
  async clearAllNotifications(userId) {
    return this.notificationsRepo.clearAllNotifications(userId);
  }
  // Notification preferences
  async getNotificationPreferences(userId) {
    return this.notificationsRepo.getNotificationPreferences(userId);
  }
  async createNotificationPreferences(preferences) {
    return this.notificationsRepo.createNotificationPreferences(preferences);
  }
  async updateNotificationPreferences(userId, preferences) {
    return this.notificationsRepo.updateNotificationPreferences(userId, preferences);
  }
  // Subscription plans management
  async createSubscriptionPlan(plan) {
    return this.billingRepo.createSubscriptionPlan(plan);
  }
  async getSubscriptionPlans(activeOnly) {
    return this.billingRepo.getSubscriptionPlans(activeOnly);
  }
  async getSubscriptionPlanById(id) {
    return this.billingRepo.getSubscriptionPlanById(id);
  }
  async updateSubscriptionPlan(id, data) {
    return this.billingRepo.updateSubscriptionPlan(id, data);
  }
  async getDefaultSubscriptionPlan() {
    return this.billingRepo.getDefaultSubscriptionPlan();
  }
  async setDefaultSubscriptionPlan(id) {
    return this.billingRepo.setDefaultSubscriptionPlan(id);
  }
  async deactivateSubscriptionPlan(id) {
    return this.billingRepo.deactivateSubscriptionPlan(id);
  }
  // Stripe user details updates
  async updateUserStripeInfo(userId, stripeInfo) {
    return this.billingRepo.updateUserStripeInfo(userId, stripeInfo);
  }
  async updateSubscriptionStatus(userId, status, endDate) {
    return this.billingRepo.updateSubscriptionStatus(userId, status, endDate);
  }
  async assignSubscriptionPlan(userId, planId) {
    return this.billingRepo.assignSubscriptionPlan(userId, planId);
  }
  // Engagement Settings
  async getEngagementSettings() {
    return this.adminRepo.getEngagementSettings();
  }
  async updateEngagementSettings(settings) {
    return this.adminRepo.updateEngagementSettings(settings);
  }
  // AI Recommendations
  async createAiRecommendation(recommendation) {
    return this.adminRepo.createAiRecommendation(recommendation);
  }
  async getAiRecommendationById(id) {
    return this.adminRepo.getAiRecommendationById(id);
  }
  async getAiRecommendationsByUser(userId) {
    return this.adminRepo.getAiRecommendationsByUser(userId);
  }
  async getPendingAiRecommendationsByProfessional(professionalId) {
    return this.adminRepo.getPendingAiRecommendationsByProfessional(professionalId);
  }
  async getPendingAiRecommendationsByTherapist(therapistId) {
    return this.adminRepo.getPendingAiRecommendationsByTherapist(therapistId);
  }
  async updateAiRecommendationStatus(id, status, therapistNotes) {
    return this.adminRepo.updateAiRecommendationStatus(id, status, therapistNotes);
  }
  async deleteAiRecommendation(id) {
    return this.adminRepo.deleteAiRecommendation(id);
  }
  // AI Recommendations
  async createAiRecommendation(recommendation) {
    return this.adminRepo.createAiRecommendation(recommendation);
  }
  async getAiRecommendationById(id) {
    return this.adminRepo.getAiRecommendationById(id);
  }
  async getAiRecommendationsByUser(userId) {
    return this.adminRepo.getAiRecommendationsByUser(userId);
  }
  async getPendingAiRecommendationsByProfessional(professionalId) {
    return this.adminRepo.getPendingAiRecommendationsByProfessional(professionalId);
  }
  async getPendingAiRecommendationsByTherapist(therapistId) {
    return this.adminRepo.getPendingAiRecommendationsByTherapist(therapistId);
  }
  async updateAiRecommendationStatus(id, status, therapistNotes) {
    return this.adminRepo.updateAiRecommendationStatus(id, status, therapistNotes);
  }
  async deleteAiRecommendation(id) {
    return this.adminRepo.deleteAiRecommendation(id);
  }
};
var storage = new DatabaseStorage();

// server/middleware/auth.ts
function getSessionCookieOptions(req) {
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
  const isMobile = req && (req.headers["x-requested-with"] === "ResilienceHub-Mobile" || req.headers["x-app-platform"] === "mobile" || req.get?.("User-Agent")?.includes("Expo"));
  const host = req ? req.headers["x-forwarded-host"] || req.headers.host || "" : "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.");
  console.log(`[COOKIE_DBG] req exists: ${!!req}`);
  if (req) {
    console.log(`[COOKIE_DBG] headers: ${JSON.stringify(req.headers)}`);
    console.log(`[COOKIE_DBG] host: ${host}`);
  }
  console.log(`[COOKIE_DBG] FORCE_INSECURE_COOKIES: ${process.env.FORCE_INSECURE_COOKIES}`);
  console.log(`[COOKIE_DBG] isMobile: ${isMobile}, isLocalhost: ${isLocalhost}`);
  if (process.env.REPLIT_DOMAINS) {
    cookieOptions.secure = true;
    cookieOptions.sameSite = "none";
    console.log("Using Replit-compatible cookie settings");
  } else if (process.env.FORCE_INSECURE_COOKIES === "true" || isMobile || isLocalhost) {
    cookieOptions.secure = false;
    cookieOptions.sameSite = "lax";
    console.log(`Using insecure cookies (secure=false, sameSite=lax) for ${isMobile ? "mobile" : isLocalhost ? "local" : "FORCE_INSECURE_COOKIES"}`);
  }
  console.log(`Cookie options: secure=${cookieOptions.secure}, sameSite=${cookieOptions.sameSite}, domain=${cookieOptions.domain || "not set"}`);
  return cookieOptions;
}
var sessionLookupCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 6e4;
async function authenticate(req, res, next) {
  console.log(`[AUTH] Authenticating request: ${req.method} ${req.originalUrl}`);
  console.log(`[AUTH] Headers: ${JSON.stringify(req.headers)}`);
  console.log(`[AUTH] Cookies in req.cookies: ${JSON.stringify(req.cookies)}`);
  console.log(`[AUTH] Raw Cookie Header: ${req.headers.cookie}`);
  let sessionId = req.cookies?.sessionId;
  if (!sessionId && req.headers.cookie) {
    const cookieString = req.headers.cookie;
    const match = cookieString.match(/(?:^|;)\s*sessionId=([^;]+)/);
    if (match) {
      sessionId = decodeURIComponent(match[1].trim());
      if (sessionId.startsWith("s:")) {
        const signedMatch = sessionId.match(/^s:([^.]+)/);
        sessionId = signedMatch ? signedMatch[1] : sessionId.slice(2);
      }
      console.log(`[AUTH] Manually parsed sessionId from headers: ${sessionId}`);
    }
  }
  if (!sessionId && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      sessionId = authHeader.substring(7).trim();
      console.log(`[AUTH] Parsed sessionId from Authorization Bearer header: ${sessionId}`);
    }
  }
  console.log(`[AUTH] Resolved sessionId: ${sessionId}`);
  if (!sessionId) {
    console.log(`[AUTH] Authentication failed: No sessionId found`);
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
    const session = await storage.getSessionById(sessionId);
    if (!session) {
      const clearOptions = getSessionCookieOptions(req);
      delete clearOptions.maxAge;
      res.clearCookie("sessionId", clearOptions);
      return res.status(401).json({ message: "Invalid session" });
    }
    if (new Date(session.expiresAt) < /* @__PURE__ */ new Date()) {
      await storage.deleteSession(sessionId);
      const clearOptions = getSessionCookieOptions(req);
      delete clearOptions.maxAge;
      res.clearCookie("sessionId", clearOptions);
      return res.status(401).json({ message: "Session expired" });
    }
    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
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
async function checkResourceCreationPermission(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const requestedUserId = parseInt(req.params.userId);
  const currentUser = req.user;
  if (currentUser.id === requestedUserId) {
    return next();
  }
  if (currentUser.role === "admin") {
    return next();
  }
  if (currentUser.role === "therapist") {
    try {
      const client = await storage.getUser(requestedUserId);
      if (client && client.therapistId === currentUser.id) {
        return next();
      }
      return res.status(403).json({ message: "Access denied. You can only create resources for your own clients." });
    } catch (error) {
      console.error("Resource creation permission check error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  return res.status(403).json({ message: "Access denied. You can only create resources for yourself." });
}
function ensureAuthenticated(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}
async function checkUserAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const requestedUserId = parseInt(req.params.userId);
  const currentUser = req.user;
  if (currentUser.role === "admin") return next();
  if (currentUser.id === requestedUserId) return next();
  if (currentUser.role === "therapist") {
    try {
      const client = await storage.getUser(requestedUserId);
      if (client && client.therapistId === currentUser.id) return next();
      return res.status(403).json({ message: "Access denied. Not your client." });
    } catch (error) {
      console.error("Check user access error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  return res.status(403).json({ message: "Access denied." });
}

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

// server/services/integrationRoutes.ts
init_schema();
import { eq as eq9, and as and6, desc as desc8 } from "drizzle-orm";
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
        and6(
          eq9(journalEntries.userId, userId),
          // At least one of userSelectedTags contains a matching emotion
          // We use a simplified approach for JSON array search here
          // In a production app, you might need a more sophisticated approach
          // depending on the database being used
          journalEntries.userSelectedTags
        )
      ).orderBy(desc8(journalEntries.createdAt)).limit(10);
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
        and6(
          eq9(journalEntries.id, entryId),
          eq9(journalEntries.userId, userId)
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
        and6(
          eq9(emotionRecords.userId, userId)
          // Filter for matching emotions - this is a simplified approach
          // This might need to be adjusted based on the database
        )
      ).orderBy(desc8(emotionRecords.createdAt)).limit(10);
      const relatedEmotions = emotionResults.filter((record) => {
        return allRelatedEmotions.some(
          (emotion) => (record.tertiaryEmotion ?? "").toLowerCase() === emotion.toLowerCase() || (record.primaryEmotion ?? "").toLowerCase() === emotion.toLowerCase() || record.coreEmotion.toLowerCase() === emotion.toLowerCase()
        );
      }).map((record) => ({
        ...record,
        matchingEmotions: entryEmotions.filter(
          (emotion) => getRelatedEmotions(emotion || "").some(
            (rel) => rel.toLowerCase() === (record.tertiaryEmotion ?? "").toLowerCase() || rel.toLowerCase() === (record.primaryEmotion ?? "").toLowerCase() || rel.toLowerCase() === record.coreEmotion.toLowerCase()
          ) || emotion.toLowerCase() === (record.tertiaryEmotion ?? "").toLowerCase() || emotion.toLowerCase() === (record.primaryEmotion ?? "").toLowerCase() || emotion.toLowerCase() === record.coreEmotion.toLowerCase()
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
        and6(
          eq9(thoughtRecords.userId, userId)
        )
      ).orderBy(desc8(thoughtRecords.createdAt)).limit(10);
      const emotionResults = await db.select({
        id: emotionRecords.id,
        coreEmotion: emotionRecords.coreEmotion,
        primaryEmotion: emotionRecords.primaryEmotion,
        tertiaryEmotion: emotionRecords.tertiaryEmotion
      }).from(emotionRecords).where(
        and6(
          eq9(emotionRecords.userId, userId)
        )
      );
      const relatedThoughts = thoughts.filter((thought) => {
        if (thought.emotionRecordId) {
          const emotionRecord = emotionResults.find((e) => e.id === thought.emotionRecordId);
          if (emotionRecord) {
            return searchEmotions.some(
              (searchEmotion) => emotionRecord.coreEmotion.toLowerCase() === searchEmotion.toLowerCase() || (emotionRecord.primaryEmotion ?? "").toLowerCase() === searchEmotion.toLowerCase() || (emotionRecord.tertiaryEmotion ?? "").toLowerCase() === searchEmotion.toLowerCase()
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

// server/middleware/rateLimiter.ts
var RateLimiter = class {
  constructor(config) {
    this.config = config;
  }
  requests = /* @__PURE__ */ new Map();
  getClientId(req) {
    return req.user?.id?.toString() || req.ip || "anonymous";
  }
  tryConsume(clientId) {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const clientRequests = this.requests.get(clientId) || [];
    const recentRequests = clientRequests.filter((time) => time > windowStart);
    if (recentRequests.length >= this.config.maxRequests) {
      return false;
    }
    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);
    if (Math.random() < 0.01) {
      this.cleanup();
    }
    return true;
  }
  middleware = (req, res, next) => {
    if (process.env.NODE_ENV === "development" || process.env.FORCE_INSECURE_COOKIES === "true") {
      return next();
    }
    const clientId = this.getClientId(req);
    const allowed = this.tryConsume(clientId);
    if (!allowed) {
      return res.status(429).json({
        message: this.config.message || "Too many requests",
        retryAfter: Math.ceil(this.config.windowMs / 1e3)
      });
    }
    next();
  };
  cleanup() {
    const now = Date.now();
    Array.from(this.requests.entries()).forEach(([clientId, requests]) => {
      const recentRequests = requests.filter((time) => time > now - this.config.windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, recentRequests);
      }
    });
  }
};
var createRateLimiter = (config) => new RateLimiter(config).middleware;
var authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  maxRequests: 20,
  message: "Too many authentication attempts"
});
var apiRateLimit = createRateLimiter({
  windowMs: 60 * 1e3,
  // 1 minute
  maxRequests: 100,
  message: "API rate limit exceeded"
});
var aiRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  maxRequests: 20,
  message: "AI analysis rate limit exceeded. Please wait before making more AI requests."
});
var aiRateLimit = aiRateLimiter.middleware;

// server/services/reframeCoach.ts
init_schema();
import { sql as sql2, eq as eq10, and as and7, desc as desc9, gte } from "drizzle-orm";

// server/services/openai.ts
import OpenAI from "openai";
import crypto from "crypto";
var openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});
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
    const hash4 = this.generateHash(`${title}:${content}`);
    const cached = this.cache.get(hash4);
    if (cached && now - cached.timestamp < this.ttlMs) {
      console.log("CACHE HIT! Using cached analysis");
      return cached.result;
    }
    if (cached) {
      console.log("CACHE EXPIRED. Deleting entry.");
      this.cache.delete(hash4);
    }
    return null;
  }
  // Store a result in the cache
  set(title, content, result) {
    const hash4 = this.generateHash(`${title}:${content}`);
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(hash4, {
      result,
      timestamp: Date.now(),
      hash: hash4
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
       - ALWAYS classify each emotion into one of these 6 core categories: "Anger", "Sadness", "Fear", "Joy", "Love", "Surprise"
       - Use the exact core category name (capitalised) as the emotion label \u2014 for example "Fear" not "anxious", "Sadness" not "sad", "Anger" not "frustrated"
       - You may list the same core category only once. If multiple emotions map to the same category, list it once
       - Anger covers: rage, frustration, irritation, annoyance, envy, disgust, resentment
       - Sadness covers: grief, hurt, loneliness, guilt, shame, hopelessness, despair, disappointment
       - Fear covers: anxiety, worry, nervousness, stress, insecurity, dread, overwhelm, uncertainty
       - Joy covers: happiness, excitement, pride, optimism, gratitude, contentment, enthusiasm
       - Love covers: affection, care, compassion, peace, calm, tenderness, belonging
       - Surprise covers: confusion, shock, bewilderment, disbelief, amazement, being caught off guard
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
    return generateFallbackAnalysis(title, content);
  }
}
async function generateReframePracticeScenarios(automaticThought, cognitiveDistortions3, emotionCategory, customInstructions) {
  try {
    const cacheKey = createScenarioCacheKey(automaticThought, cognitiveDistortions3, emotionCategory, customInstructions);
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
    const formattedDistortions = cognitiveDistortions3.map((distortion) => {
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
  const cognitiveDistortions3 = [];
  if (/\b(all|nothing|every|none|always|never|everyone|no one|completely|totally|absolutely|perfect|failure|disaster)\b/i.test(combinedText)) {
    cognitiveDistortions3.push("All-or-nothing thinking");
  }
  if (/\b(always|never|everyone|nobody|everything|nothing|every time|all the time)\b/i.test(combinedText)) {
    if (!cognitiveDistortions3.includes("Overgeneralization")) {
      cognitiveDistortions3.push("Overgeneralization");
    }
  }
  if (/\b(only bad|only negative|only the worst|focus on bad|ignore good|didn't matter|doesn't count|still bad|still failed)\b/i.test(combinedText)) {
    cognitiveDistortions3.push("Mental filtering");
  }
  if (/\b(doesn't count|don't deserve|got lucky|fluke|accident|just being nice|not important|not real|meaningless)\b/i.test(combinedText)) {
    cognitiveDistortions3.push("Disqualifying the positive");
  }
  if (/\b(think|knows? what|they think|they feel|going to|will happen|will fail|will reject|won't like|won't approve|predict|foresee|expect the worst)\b/i.test(combinedText)) {
    cognitiveDistortions3.push("Jumping to conclusions");
  }
  if (/\b(disaster|catastrophe|terrible|horrible|worst|awful|unbearable|can'?t stand|can'?t handle|too much|end of the world|devastat(ing|ed)|nightmare)\b/i.test(combinedText)) {
    cognitiveDistortions3.push("Catastrophizing");
  }
  if (/\b(feel like|feels? true|must be true|must be real|feels? like|emotions? tell|gut says|intuition says|sense that)\b/i.test(combinedText)) {
    cognitiveDistortions3.push("Emotional reasoning");
  }
  if (/\b(should|must|have to|ought to|need to|supposed to|expected to|obligated to)\b/i.test(combinedText)) {
    cognitiveDistortions3.push("Should statements");
  }
  if (/\b(I am a|I'm a|he is a|she is a|they are|we are|you are|you're)( a)? (failure|loser|idiot|stupid|worthless|useless|pathetic|horrible|terrible|awful|bad person)\b/i.test(combinedText)) {
    cognitiveDistortions3.push("Labeling");
  }
  if (/\b(my fault|blame (me|myself)|responsible for|caused|should have prevented|could have stopped|if only I|blame (myself|me))\b/i.test(combinedText)) {
    cognitiveDistortions3.push("Personalization");
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
  if (cognitiveDistortions3.length > 0) {
    if (cognitiveDistortions3.includes("All-or-nothing thinking") && combinedText.match(/perfection|flawless|excel|failure|worthless|disaster/i)) {
      analysisText = `I notice strong all-or-nothing thinking patterns where you're seeing yourself in extreme terms of total success or complete failure. This perspective is creating significant emotional strain because you're not allowing yourself any middle ground for being human and learning through mistakes.`;
    } else if (cognitiveDistortions3.includes("Overgeneralization") && combinedText.match(/never|always|every|all|again|eternal|history/i)) {
      analysisText = `Your journal reveals a clear pattern of overgeneralization, where you're taking isolated negative experiences and applying them as permanent rules for all future situations. This is creating a sense of defeat before you even try, as past setbacks are being treated as definitive proof of future outcomes.`;
    } else if (cognitiveDistortions3.includes("Catastrophizing")) {
      analysisText = `The language in your entry shows catastrophic thinking where relatively minor issues are being amplified into overwhelming disasters. This tendency to imagine worst-case scenarios is intensifying your emotional response far beyond what the situation actually warrants.`;
    } else if (cognitiveDistortions3.includes("Emotional reasoning")) {
      analysisText = `I see that you're treating your feelings as evidence of objective truth rather than as emotional responses. This emotional reasoning creates a distorted view where negative feelings become 'proof' that the situation is objectively negative, creating a self-reinforcing cycle.`;
    } else {
      const primaryDistortions = cognitiveDistortions3.slice(0, 2);
      analysisText = `Your writing reveals ${primaryDistortions.join(" and ")} patterns that are likely intensifying your emotional distress. These thought patterns create a distorted perspective that affects how you see yourself and your abilities.`;
    }
    if (foundTopics.length > 0) {
      analysisText += ` This is particularly evident in how you approach ${foundTopics.join(" and ")}.`;
    }
    if (cognitiveDistortions3.includes("All-or-nothing thinking") || cognitiveDistortions3.includes("Overgeneralization")) {
      analysisText += ` Try identifying evidence that challenges these absolute perspectives - what middle-ground possibilities exist between the extremes you're seeing?`;
    } else if (cognitiveDistortions3.includes("Catastrophizing")) {
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
    cognitiveDistortions: cognitiveDistortions3.length > 0 ? cognitiveDistortions3 : [],
    sentiment: {
      positive: positiveScore,
      negative: negativeScore,
      neutral: neutralScore
    }
  };
  return result;
}
var openaiDirect = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// server/services/reframeCoach.ts
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
  let [profile] = await db.select().from(userGameProfile).where(eq10(userGameProfile.userId, userId));
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
  const { count: count2 } = await db.select({ count: sql2`count(*)` }).from(reframePracticeResults).where(eq10(reframePracticeResults.userId, userId)).then((rows) => rows[0]);
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
  }).where(eq10(userGameProfile.userId, userId));
  return {
    newTotalScore,
    newLevel,
    newStreak,
    newAchievements: newAchievements.filter((a) => !currentAchievements.includes(a))
  };
}
function registerReframeCoachRoutes(app2) {
  app2.post("/api/reframe-coach/assignments", authenticate, aiRateLimit, async (req, res) => {
    try {
      const validatedData = createReframePracticeSchema.parse(req.body);
      const user = req.user;
      if (!user || user.role !== "therapist" && user.role !== "admin") {
        return res.status(403).json({ message: "Only mental health professionals can create practice assignments" });
      }
      const [thoughtRecord] = await db.select().from(thoughtRecords).where(eq10(thoughtRecords.id, validatedData.thoughtRecordId));
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      if (thoughtRecord.userId !== validatedData.assignedTo) {
        return res.status(400).json({ message: "Thought record does not belong to the assigned client" });
      }
      let emotionCategory = "unknown";
      if (thoughtRecord.emotionRecordId) {
        const [emotionRecord] = await db.select().from(emotionRecords).where(eq10(emotionRecords.id, thoughtRecord.emotionRecordId));
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
        }).from(users).where(eq10(users.id, user.id));
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
              createdAt: /* @__PURE__ */ new Date(),
              expiresAt: null,
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
        and7(
          eq10(resourceAssignments.assignedTo, userId),
          eq10(resourceAssignments.type, "reframe_practice")
        )
      ).orderBy(desc9(resourceAssignments.assignedAt));
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
        and7(
          eq10(resourceAssignments.id, assignmentId),
          eq10(resourceAssignments.type, "reframe_practice")
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
        }).where(eq10(resourceAssignments.id, validatedData.assignmentId));
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
      let [profile] = await db.select().from(userGameProfile).where(eq10(userGameProfile.userId, userId));
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
      }).from(reframePracticeResults).where(eq10(reframePracticeResults.userId, userId)).then((rows) => rows[0]);
      const [thoughtRecord] = await db.select({
        cognitiveDistortions: thoughtRecords.cognitiveDistortions
      }).from(thoughtRecords).leftJoin(
        reframePracticeResults,
        eq10(reframePracticeResults.thoughtRecordId, thoughtRecords.id)
      ).where(eq10(thoughtRecords.userId, userId)).groupBy(thoughtRecords.id).orderBy(sql2`count(${reframePracticeResults.id})`).limit(1);
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
  app2.get("/api/users/:userId/thoughts/:thoughtId/practice-scenarios", authenticate, aiRateLimit, checkUserAccess, async (req, res) => {
    try {
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
        and7(
          eq10(thoughtRecords.id, thoughtId),
          eq10(thoughtRecords.userId, userId)
        )
      );
      if (!thoughtRecord) {
        return res.status(404).json({ message: "Thought record not found" });
      }
      let emotionCategory = "unknown";
      if (thoughtRecord.emotionRecordId) {
        const [emotionRecord] = await db.select().from(emotionRecords).where(eq10(emotionRecords.id, thoughtRecord.emotionRecordId));
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
      const normalizedDistortions = Array.isArray(distortions) ? distortions.filter((d) => d && String(d).trim() !== "" && String(d).toLowerCase() !== "unknown") : typeof distortions === "string" && distortions.trim() !== "" ? [distortions] : [];
      console.log("Normalized distortions:", normalizedDistortions);
      const automaticThought = (thoughtRecord.automaticThoughts || "").trim();
      if (automaticThought.length < 10) {
        return res.status(400).json({
          message: "This thought record needs more detail before you can practice with it.",
          reason: "insufficient_content",
          details: "The automatic thought field is empty or too short. Edit the thought record and add a clearer description of the thought you want to practice reframing."
        });
      }
      if (normalizedDistortions.length === 0) {
        return res.status(400).json({
          message: "This thought record has no cognitive distortion identified.",
          reason: "no_distortions",
          details: "Edit the thought record and select at least one cognitive distortion (e.g. All-or-Nothing, Catastrophising) so we can build relevant practice scenarios."
        });
      }
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        message: "Failed to generate practice scenarios",
        reason: "ai_service_error",
        details: errorMessage
      });
    }
  });
  app2.get("/api/users/:userId/reframe-coach/results", authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (req.user.id !== userId && req.user.role !== "admin") {
        if (req.user.role === "therapist") {
          const [client] = await db.select().from(users).where(
            and7(
              eq10(users.id, userId),
              eq10(users.therapistId, req.user.id)
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
      const results = await db.select().from(reframePracticeResults).where(eq10(reframePracticeResults.userId, userId)).orderBy(desc9(reframePracticeResults.createdAt));
      const enhancedResults = results.map((result) => {
        const cognitiveDistortions3 = /* @__PURE__ */ new Set();
        if (result.scenarioData && Array.isArray(result.scenarioData)) {
          result.scenarioData.forEach((scenario) => {
            if (scenario.cognitiveDistortion) {
              cognitiveDistortions3.add(formatCognitiveDistortion(scenario.cognitiveDistortion));
            }
          });
        }
        return {
          ...result,
          // Add a formatted field for UI display
          formattedDistortions: Array.from(cognitiveDistortions3),
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
      }).from(reframePracticeResults).leftJoin(users, eq10(reframePracticeResults.userId, users.id)).orderBy(desc9(reframePracticeResults.createdAt)).limit(20);
      const lastWeekResults = await db.select().from(reframePracticeResults).where(
        gte(
          reframePracticeResults.createdAt,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3)
        )
      ).orderBy(desc9(reframePracticeResults.createdAt));
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

// server/routes/index.ts
import { Router as Router14 } from "express";

// server/routes/subscriptions.routes.ts
import { Router } from "express";

// server/controllers/subscriptions.controller.ts
init_schema();
import { z as z3 } from "zod";

// server/services/stripe.ts
import Stripe from "stripe";
var StripeService = class {
  stripe = null;
  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-04-30.basil"
        });
        console.log("[Stripe] Stripe client initialized successfully");
      } catch (error) {
        console.error("[Stripe] Failed to initialize Stripe client:", error);
      }
    } else {
      console.warn("STRIPE_SECRET_KEY is not set. Subscription functionality may be limited.");
    }
  }
  /**
   * Check if Stripe integration is enabled and active
   */
  isStripeEnabled() {
    return this.stripe !== null;
  }
  /**
   * Retrieve a subscription by ID
   */
  async retrieveSubscription(subscriptionId) {
    if (!this.stripe) {
      throw new Error("Stripe service is not initialized (missing API key).");
    }
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }
  /**
   * Create a new checkout session (placeholder/extension helper)
   */
  async createCheckoutSession(params) {
    if (!this.stripe) {
      throw new Error("Stripe service is not initialized (missing API key).");
    }
    return await this.stripe.checkout.sessions.create(params);
  }
  /**
   * Create a new billing portal session (placeholder/extension helper)
   */
  async createPortalSession(params) {
    if (!this.stripe) {
      throw new Error("Stripe service is not initialized (missing API key).");
    }
    return await this.stripe.billingPortal.sessions.create(params);
  }
  /**
   * Construct event for webhook verification (placeholder/extension helper)
   */
  async constructEvent(payload, header, secret) {
    if (!this.stripe) {
      throw new Error("Stripe service is not initialized (missing API key).");
    }
    return this.stripe.webhooks.constructEvent(payload, header, secret);
  }
};
var stripeService = new StripeService();

// server/controllers/subscriptions.controller.ts
async function getSubscriptionPlans(req, res) {
  try {
    const activeOnly = !req.headers.authorization;
    const plans = await storage.getSubscriptionPlans(activeOnly);
    res.status(200).json(plans);
  } catch (error) {
    console.error("Get subscription plans error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getSubscriptionPlanById(req, res) {
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
}
async function createSubscriptionPlan(req, res) {
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
}
async function updateSubscriptionPlan(req, res) {
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
}
async function setDefaultSubscriptionPlan(req, res) {
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
}
async function deactivateSubscriptionPlan(req, res) {
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
}
async function getUserSubscription(req, res) {
  try {
    const user = req.user;
    let plan = null;
    if (user.subscriptionPlanId) {
      plan = await storage.getSubscriptionPlanById(user.subscriptionPlanId);
    }
    let stripeSubscription = null;
    if (stripeService.isStripeEnabled() && user.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripeService.retrieveSubscription(user.stripeSubscriptionId);
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
}

// server/routes/subscriptions.routes.ts
var router = Router();
router.get("/subscription-plans", getSubscriptionPlans);
router.get("/subscription-plans/:id", getSubscriptionPlanById);
router.post("/subscription-plans", authenticate, isAdmin, createSubscriptionPlan);
router.patch("/subscription-plans/:id", authenticate, isAdmin, updateSubscriptionPlan);
router.post("/subscription-plans/:id/set-default", authenticate, isAdmin, setDefaultSubscriptionPlan);
router.post("/subscription-plans/:id/deactivate", authenticate, isAdmin, deactivateSubscriptionPlan);
router.get("/subscription", authenticate, ensureAuthenticated, getUserSubscription);
var subscriptions_routes_default = router;

// server/routes/auth.routes.ts
import { Router as Router2 } from "express";

// server/controllers/auth.controller.ts
import { z as z4 } from "zod";
import * as bcrypt2 from "bcrypt";
import * as crypto2 from "crypto";
import { eq as eq11, and as and8, gt, inArray as inArray2 } from "drizzle-orm";
init_db();
init_schema();
init_email();
function getSafeBaseUrl(req) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.trim();
  }
  if (process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(",")[0]?.trim();
    if (domain) return `https://${domain}`;
  }
  const host = req.get("host") || "";
  if (!host || !/^[a-zA-Z0-9.-]+(:\d+)?$/.test(host)) {
    throw new Error("Invalid Host header");
  }
  const isDev = process.env.NODE_ENV !== "production";
  const isLocal = /^localhost(:\d+)?$/.test(host) || /^127\.0\.0\.1(:\d+)?$/.test(host);
  if (isDev && isLocal) {
    return `${req.protocol}://${host}`;
  }
  if (process.env.ALLOWED_HOSTS) {
    const allowedHosts = process.env.ALLOWED_HOSTS.split(",").map((h) => h.trim().toLowerCase());
    const hostname = host.split(":")[0].toLowerCase();
    if (allowedHosts.includes(hostname)) {
      return `${req.protocol}://${host}`;
    }
  }
  console.error(`\u{1F6A8} Host-Header Poisoning Blocked: Incoming Host '${host}' is unverified and APP_URL is missing. Defaulting to localhost fallback.`);
  return `http://localhost:5000`;
}
async function registerUser(req, res) {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    const isInvitation = req.body.isInvitation === true || req.query.invitation === "true";
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }
    const existingEmail = await storage.getUserByEmail(validatedData.email);
    const invitationForEmail = await storage.getClientInvitationByEmail(validatedData.email);
    const hasPendingInvitation = !!(invitationForEmail && (invitationForEmail.status === "pending" || invitationForEmail.status === "email_sent" || invitationForEmail.status === "email_failed"));
    if (isInvitation || hasPendingInvitation) {
      if (!hasPendingInvitation || !invitationForEmail.invitationToken) {
        return res.status(403).json({ message: "Invalid or expired invitation. Please request a new invitation link." });
      }
      if (invitationForEmail.expiresAt && /* @__PURE__ */ new Date() > new Date(invitationForEmail.expiresAt)) {
        return res.status(403).json({ message: "This invitation has expired. Please ask your therapist to send a new invitation." });
      }
      const providedToken = req.body.invitationToken;
      if (!providedToken) {
        return res.status(403).json({ message: "Invitation token is required. Please use the link sent to your email." });
      }
      const tokenValid = await bcrypt2.compare(providedToken, invitationForEmail.invitationToken);
      if (!tokenValid) {
        return res.status(403).json({ message: "Invalid invitation token. Please use the original link sent to your email." });
      }
      validatedData.role = "client";
      validatedData.therapistId = invitationForEmail.therapistId;
      validatedData.status = "active";
      console.log(`\u{1F512} INVITATION REGISTRATION (token verified): client for therapist ${validatedData.therapistId}`);
    }
    if (existingEmail) {
      if ((isInvitation || hasPendingInvitation) && existingEmail.status === "pending") {
        console.log(`Invitation acceptance: Updating existing pending user ${existingEmail.id} with new credentials`);
        const updatedUser = await storage.updateUser(existingEmail.id, {
          username: validatedData.username,
          password: validatedData.password,
          status: "active"
        });
        if (invitationForEmail) {
          try {
            await db.update(clientInvitations).set({ status: "accepted", acceptedAt: /* @__PURE__ */ new Date(), invitationToken: null }).where(eq11(clientInvitations.id, invitationForEmail.id));
          } catch (invErr) {
            console.error("Error marking invitation accepted:", invErr);
          }
        }
        const session2 = await storage.createSession(updatedUser.id);
        res.cookie("sessionId", session2.id, getSessionCookieOptions(req));
        const { password: password2, ...userWithoutPassword2 } = updatedUser;
        return res.status(200).json(userWithoutPassword2);
      } else if ((isInvitation || hasPendingInvitation) && existingEmail.status === "active" && invitationForEmail) {
        console.log(`Invitation acceptance: Linking existing active user ${existingEmail.id} to therapist ${invitationForEmail.therapistId}`);
        const updatedUser = await storage.updateUser(existingEmail.id, {
          therapistId: invitationForEmail.therapistId
        });
        try {
          await db.update(clientInvitations).set({ status: "accepted", acceptedAt: /* @__PURE__ */ new Date(), invitationToken: null }).where(eq11(clientInvitations.id, invitationForEmail.id));
        } catch (invErr) {
          console.error("Error marking invitation accepted for active user:", invErr);
        }
        await storage.createNotification({
          userId: existingEmail.id,
          title: "Therapist Assignment Accepted",
          body: `You have been successfully linked to your new therapist. Welcome to the team!`,
          type: "system",
          isRead: false
        });
        const session2 = await storage.createSession(updatedUser.id);
        res.cookie("sessionId", session2.id, getSessionCookieOptions(req));
        const { password: password2, ...userWithoutPassword2 } = updatedUser;
        return res.status(200).json(userWithoutPassword2);
      } else {
        return res.status(409).json({ message: "Email already exists" });
      }
    }
    if (!isInvitation && !hasPendingInvitation) {
      validatedData.status = "active";
      if (req.body.role === "therapist" || req.body.role === "admin") {
        validatedData.role = req.body.role;
      } else {
        validatedData.role = "client";
      }
      validatedData.therapistId = void 0;
      validatedData.stripeCustomerId = void 0;
      validatedData.stripeSubscriptionId = void 0;
      validatedData.subscriptionPlanId = void 0;
      validatedData.subscriptionStatus = void 0;
    }
    const user = await storage.createUser(validatedData);
    console.log(`User created successfully: id=${user.id} role=${user.role}`);
    if (isInvitation && !user.therapistId && validatedData.therapistId) {
      console.log(`\u{1F6A8} FIXING MISSING THERAPIST CONNECTION: Setting therapist ${validatedData.therapistId} for user ${user.id}`);
      await storage.updateUser(user.id, { therapistId: validatedData.therapistId });
      user.therapistId = validatedData.therapistId;
    }
    if (user.email && user.therapistId) {
      try {
        await db.update(clientInvitations).set({ status: "accepted", acceptedAt: /* @__PURE__ */ new Date(), invitationToken: null }).where(and8(
          eq11(clientInvitations.email, user.email),
          eq11(clientInvitations.therapistId, user.therapistId),
          inArray2(clientInvitations.status, ["pending", "email_sent", "email_failed"])
        ));
        console.log(`Automatically marked invitation as accepted for user ${user.id} with therapist ${user.therapistId}`);
      } catch (invitationError) {
        console.error("Error updating invitation status:", invitationError);
      }
    }
    if (validatedData.therapistId) {
      console.log(`User ${user.id} registered with therapist ID: ${validatedData.therapistId}`);
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
    res.cookie("sessionId", session.id, getSessionCookieOptions(req));
    await storage.createNotification({
      userId: user.id,
      title: "Welcome to Resilience CBT",
      body: "Thank you for joining. Start your journey by tracking your emotions or setting your first goal.",
      type: "system",
      isRead: false
    });
    if (validatedData.role && validatedData.role === "therapist") {
      try {
        console.log(`Processing subscription plan for new therapist: ${user.id}`);
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
          console.log(`Successfully assigned default subscription plan (${defaultPlan.name}) to therapist ${user.id}`);
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
            console.log(`Welcome email to therapist ${user.id}: ${emailSent ? "Sent successfully" : "Failed to send"}`);
          } catch (emailError) {
            console.error(`Error sending welcome email to therapist ${user.id}:`, emailError);
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
    if (error instanceof z4.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function inviteClient(req, res) {
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
    const plaintextToken = crypto2.randomBytes(32).toString("hex");
    const invitationTokenHash = await bcrypt2.hash(plaintextToken, 10);
    const tempUsername = email.split("@")[0] + Math.floor(Math.random() * 1e3);
    const tempPassword = Math.random().toString(36).substring(2, 10);
    const hashedTempPassword = await bcrypt2.hash(tempPassword, 10);
    const baseUrl = getSafeBaseUrl(req);
    const inviteLink = `${baseUrl}/auth?invitation=true&email=${encodeURIComponent(email)}&therapistId=${req.user.id}&token=${plaintextToken}`;
    const storedInviteLink = `${baseUrl}/auth?invitation=true&email=${encodeURIComponent(email)}&therapistId=${req.user.id}`;
    await storage.createClientInvitation({
      email,
      name,
      therapistId: req.user.id,
      tempUsername,
      tempPassword: hashedTempPassword,
      inviteLink: storedInviteLink,
      status: "pending",
      invitationToken: invitationTokenHash
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
      emailSent
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ message: "Failed to create invitation" });
  }
}
async function requestForgotPassword(req, res) {
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
      console.log(`Password reset requested for non-existent account`);
      return res.status(200).json({
        success: true,
        message: "If your email is in our system, you will receive a password reset link."
      });
    }
    const plaintextToken = crypto2.randomBytes(32).toString("hex");
    const hashedToken = crypto2.createHash("sha256").update(plaintextToken).digest("hex");
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await db.delete(passwordResetTokens).where(eq11(passwordResetTokens.userId, user.id));
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: hashedToken,
      expiresAt,
      used: false
    });
    const baseUrl = getSafeBaseUrl(req);
    const resetUrl = `${baseUrl}/reset-password/${plaintextToken}`;
    console.log(`[PasswordReset] Sending reset email to ${user.email}, URL domain: ${baseUrl}`);
    const emailSent = await sendPasswordResetEmail(user.email, resetUrl);
    if (!emailSent) {
      console.error(`[PasswordReset] FAILED to send reset email to ${user.email}`);
    } else {
      console.log(`[PasswordReset] Reset email sent successfully to ${user.email}`);
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
}
async function verifyResetToken(req, res) {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ valid: false });
    }
    const hashedToken = crypto2.createHash("sha256").update(token).digest("hex");
    const [resetToken] = await db.select().from(passwordResetTokens).where(
      and8(
        eq11(passwordResetTokens.token, hashedToken),
        eq11(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, /* @__PURE__ */ new Date())
      )
    );
    return res.status(200).json({ valid: !!resetToken });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(200).json({ valid: false });
  }
}
async function executePasswordReset(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
      });
    }
    const hashedToken = crypto2.createHash("sha256").update(token).digest("hex");
    const [resetToken] = await db.select().from(passwordResetTokens).where(
      and8(
        eq11(passwordResetTokens.token, hashedToken),
        eq11(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, /* @__PURE__ */ new Date())
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
    await db.update(users).set({ password: hashedPassword }).where(eq11(users.id, resetToken.userId));
    await db.update(passwordResetTokens).set({ used: true }).where(eq11(passwordResetTokens.id, resetToken.id));
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
}
async function loginUser(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const clearOptions = getSessionCookieOptions();
    delete clearOptions.maxAge;
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
    const passwordMatch = await bcrypt2.compare(password, user.password);
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
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie("sessionId", session.id, cookieOptions);
    } catch (sessionError) {
      console.error("Error creating session:", sessionError);
      return res.status(500).json({ message: "Failed to create session, please try again" });
    }
    const { password: _, ...userWithoutPassword } = user;
    console.log("Login successful for user:", user.id);
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error during login" });
  }
}
async function mobileLoginUser(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const clearOptions = getSessionCookieOptions(req);
    delete clearOptions.maxAge;
    res.clearCookie("sessionId", clearOptions);
    let user = await storage.getUserByUsername(username);
    if (!user) {
      user = await storage.getUserByEmail(username);
    }
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const passwordMatch = await bcrypt2.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const session = await storage.createSession(user.id);
    const cookieOptions = getSessionCookieOptions(req);
    cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1e3;
    res.cookie("sessionId", session.id, cookieOptions);
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      user: userWithoutPassword,
      token: session.id
    });
  } catch (error) {
    console.error("[Mobile] Login error:", error);
    res.status(500).json({ message: "Internal server error during login" });
  }
}
async function logoutUser(req, res) {
  try {
    await storage.deleteSession(req.session.id);
    const clearOptions = getSessionCookieOptions(req);
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
}
function getMe(req, res) {
  const { password, ...userWithoutPassword } = req.user;
  res.status(200).json(userWithoutPassword);
}

// server/routes/auth.routes.ts
var router2 = Router2();
router2.post("/register", authRateLimit, registerUser);
router2.post("/login", authRateLimit, loginUser);
router2.post("/mobile-login", authRateLimit, mobileLoginUser);
router2.post("/logout", authenticate, logoutUser);
router2.get("/me", authenticate, ensureAuthenticated, getMe);
router2.post("/invite-client", authenticate, ensureAuthenticated, isTherapist, inviteClient);
router2.post("/forgot-password", authRateLimit, requestForgotPassword);
router2.get("/verify-reset-token/:token", verifyResetToken);
router2.post("/reset-password", authRateLimit, executePasswordReset);
var auth_routes_default = router2;

// server/routes/users.routes.ts
import { Router as Router3 } from "express";

// server/controllers/users.controller.ts
init_db();
import { z as z5 } from "zod";
import * as bcrypt3 from "bcrypt";
import * as crypto3 from "crypto";
import { eq as eq12, sql as sql3 } from "drizzle-orm";
init_schema();
init_email();
init_websocket();
async function isClientOfTherapist(clientId, therapistId) {
  try {
    const client = await storage.getUser(clientId);
    return !!client && client.therapistId === therapistId;
  } catch (error) {
    console.error("Error checking client-therapist relationship:", error);
    return false;
  }
}
async function getEnhancedInsights(req, res) {
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
}
async function updateUserStatus(req, res) {
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
}
async function getAllUsers(req, res) {
  try {
    const allUsers = await storage.getAllUsers();
    const usersWithoutPasswords = allUsers.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getClients(req, res) {
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
      therapistId: client.therapistId ?? client.therapist_id ?? null,
      createdAt: client.createdAt ?? (client.created_at ? new Date(client.created_at) : null)
    }));
    console.log(`Found ${formattedClients.length} clients for therapist ${therapistId}`);
    return res.status(200).json(formattedClients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.status(200).json([]);
  }
}
async function getAllClients(req, res) {
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
}
async function getViewingClientFixed(req, res) {
  const defaultResponse = { viewingClient: null, success: true };
  try {
    console.log("viewing-client-fixed endpoint called for user:", req.user?.id, "role:", req.user?.role);
    if (req.user.role === "therapist") {
      await storage.createSystemLog({
        action: "Therapist accessed viewing client",
        userId: req.user.id,
        ipAddress: req.ip ?? null,
        userAgent: req.get("User-Agent") ?? null,
        actionType: "therapist"
      });
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
      await storage.updateCurrentViewingClient(user.id, null);
      return res.status(200).json(defaultResponse);
    }
    if (viewingClient.therapistId !== user.id) {
      console.log(`Stale viewing client: client ${viewingClient.id} is no longer assigned to therapist ${user.id}`);
      await storage.updateCurrentViewingClient(user.id, null);
      return res.status(200).json(defaultResponse);
    }
    console.log("Found viewing client:", viewingClient.id);
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
}
async function getCurrentViewingClient(req, res) {
  const response = { viewingClient: null, success: true };
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const userId = Number(req.user.id);
    let user = null;
    let viewingClientId = null;
    try {
      user = await storage.getUser(userId);
      if (user && typeof user.currentViewingClientId === "number" && user.currentViewingClientId > 0) {
        viewingClientId = user.currentViewingClientId;
        try {
          let client = null;
          try {
            client = await storage.getClient(viewingClientId);
          } catch (clientFetchError) {
            console.error(`Error fetching client:`, clientFetchError);
            return res.status(200).json(response);
          }
          if (!client) {
            await storage.updateCurrentViewingClient(userId, null);
            return res.status(200).json(response);
          }
          if (req.user.role === "therapist" && client.therapistId !== userId) {
            await storage.updateCurrentViewingClient(userId, null);
            return res.status(200).json(response);
          }
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
}
async function getUserDetails(req, res) {
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
}
async function registerByAdmin(req, res) {
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
    const user = await storage.createUser({
      name,
      email,
      username,
      password,
      role,
      status: "active"
    });
    if (role === "therapist") {
      try {
        const defaultPlan = await storage.getDefaultSubscriptionPlan();
        if (defaultPlan) {
          await storage.assignSubscriptionPlan(user.id, defaultPlan.id);
          await storage.updateSubscriptionStatus(user.id, "trial");
          console.log(`Assigned default subscription plan (${defaultPlan.name}) to therapist ${user.id}`);
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
        console.log(`Welcome email sent to new professional user ${user.id}`);
      } catch (emailError) {
        console.error("Error sending professional welcome email:", emailError);
      }
    }
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
}
async function deleteUser(req, res) {
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
}
async function unassignTherapist(req, res) {
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
    const formerTherapistId = user.therapistId;
    const updatedUser = await storage.removeClientFromTherapist(userId, formerTherapistId);
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to unassign therapist" });
    }
    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error unassigning therapist:", error);
    res.status(500).json({ message: "Failed to unassign therapist" });
  }
}
async function resetPassword(req, res) {
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
    const hashedPassword = await bcrypt3.hash(defaultPassword, 10);
    await storage.updateUser(userId, { password: hashedPassword });
    res.status(200).json({ message: "Password reset successfully", defaultPassword });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
}
async function updateUserProfile(req, res) {
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
      error: error?.message
    });
  }
}
async function assignSubscriptionPlan(req, res) {
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
}
async function deleteClientByTherapist(req, res) {
  try {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    const client = await storage.getUser(clientId);
    if (!client || client.therapistId !== req.user.id) {
      return res.status(404).json({ message: "Client not found or does not belong to you" });
    }
    await storage.deleteUser(clientId, req.user.id);
    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Remove client error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getJournalsCount(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    if (userId >= 100 && userId <= 110) {
      return res.status(200).json({ totalCount: Math.floor(Math.random() * 8) + 3 });
    }
    const result = await db.select({ count: sql3`count(*)::int` }).from(journalEntries).where(eq12(journalEntries.userId, userId));
    res.json({ totalCount: result[0].count });
  } catch (error) {
    console.error("Error counting journals:", error);
    res.status(500).json({ message: "Error counting journal entries" });
  }
}
async function inviteClient2(req, res) {
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
        const plaintextToken2 = crypto3.randomBytes(32).toString("hex");
        const invitationTokenHash2 = await bcrypt3.hash(plaintextToken2, 10);
        const baseUrl2 = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
        const encodedEmail2 = encodeURIComponent(existingUser.email);
        const therapistId2 = req.user.id;
        const inviteLink2 = `${baseUrl2}/auth?invitation=true&email=${encodedEmail2}&therapistId=${therapistId2}&token=${plaintextToken2}`;
        const storedInviteLink2 = `${baseUrl2}/auth?invitation=true&email=${encodedEmail2}&therapistId=${therapistId2}`;
        const emailSent2 = await sendClientInvitation(
          existingUser.email,
          req.user.name || req.user.username,
          inviteLink2,
          req.user.id
        );
        if (!emailSent2) {
          await storage.createNotification({
            userId: req.user.id,
            title: "Email Delivery Issue",
            body: `We couldn't send an invitation email to ${existingUser.email}. Please use the resend invitation feature to try again.`,
            type: "alert",
            isRead: false
          });
        }
        try {
          await storage.createClientInvitation({
            email: existingUser.email,
            name: existingUser.name || name,
            therapistId: req.user.id,
            status: emailSent2 ? "email_sent" : "email_failed",
            tempUsername: existingUser.username,
            tempPassword: "",
            inviteLink: storedInviteLink2,
            invitationToken: invitationTokenHash2
          });
        } catch (error) {
          console.error("Failed to record invitation for existing user:", error);
        }
        return res.status(200).json({
          message: "Invitation sent. The client will need to accept the invitation before being assigned to you.",
          inviteLink: inviteLink2
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
    const hashedPassword = await bcrypt3.hash(tempPassword, 10);
    const newUser = await storage.createUser({
      username,
      email,
      name,
      password: hashedPassword,
      role: "client",
      therapistId: req.user.id,
      status: "pending"
    });
    await storage.createNotification({
      userId: newUser.id,
      title: "Welcome to Resilience CBT",
      body: `Welcome to Resilience CBT! You have been registered by ${req.user.name || req.user.username}. Please check your email for your invitation link to set up your account.`,
      type: "system",
      isRead: false
    });
    const plaintextToken = crypto3.randomBytes(32).toString("hex");
    const invitationTokenHash = await bcrypt3.hash(plaintextToken, 10);
    const hashedTempPassword = await bcrypt3.hash(tempPassword, 10);
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const encodedEmail = encodeURIComponent(email);
    const therapistId = req.user.id;
    const inviteLink = `${baseUrl}/auth?invitation=true&email=${encodedEmail}&therapistId=${therapistId}&token=${plaintextToken}`;
    const storedInviteLink = `${baseUrl}/auth?invitation=true&email=${encodedEmail}&therapistId=${therapistId}`;
    const emailSent = await sendClientInvitation(
      email,
      req.user.name || req.user.username,
      inviteLink,
      req.user.id
    );
    if (!emailSent) {
      console.warn(`Failed to send invitation email.`);
      await storage.createNotification({
        userId: req.user.id,
        title: "Email Delivery Issue",
        body: `We couldn't send an invitation email to ${email}. Please use the resend invitation feature to try again, or contact support.`,
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
        tempPassword: hashedTempPassword,
        inviteLink: storedInviteLink,
        invitationToken: invitationTokenHash
      });
    } catch (error) {
      console.error("Failed to record invitation:", error);
    }
    const { password, ...userWithoutPassword } = newUser;
    res.status(201).json({
      message: "New client account created successfully",
      user: userWithoutPassword,
      inviteLink
    });
  } catch (error) {
    console.error("Error inviting client:", error);
    res.status(500).json({ message: "Error inviting client" });
  }
}
async function setCurrentViewingClient(req, res) {
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
        return res.status(403).json({ error: "Not authorized to view this client" });
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
}
async function getClientRecentActivity(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const limit = 10;
    const storageAny = storage;
    const emotions = await storageAny.getEmotionRecordsByUser(userId, limit);
    const journals = await storageAny.getJournalEntriesByUser(userId, limit);
    const thoughts = await storageAny.getThoughtRecordsByUser(userId, limit);
    const userGoals = await storageAny.getGoalsByUser(userId, limit);
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
}
async function getProtectiveFactorUsage(req, res) {
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
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get protective factor usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function createProtectiveFactorUsage(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const validatedData = insertProtectiveFactorUsageSchema.parse({
      ...req.body,
      userId
    });
    const usage = await storage.addProtectiveFactorUsage(validatedData);
    res.status(201).json(usage);
  } catch (error) {
    if (error instanceof z5.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Add protective factor usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function createProtectiveFactor(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const validatedData = insertProtectiveFactorSchema.parse({
      ...req.body,
      userId
    });
    const factor = await storage.createProtectiveFactor(validatedData);
    res.status(201).json(factor);
  } catch (error) {
    if (error instanceof z5.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create protective factor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getProtectiveFactors(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const includeGlobal = req.query.includeGlobal !== "false";
    const factors = await storage.getProtectiveFactorsByUser(userId, includeGlobal);
    res.status(200).json(factors);
  } catch (error) {
    console.error("Get protective factors error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateProtectiveFactor(req, res) {
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
}
async function deleteProtectiveFactor(req, res) {
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
}
async function getCopingStrategyUsage(req, res) {
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
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get coping strategy usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function createCopingStrategyUsage(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const validatedData = insertCopingStrategyUsageSchema.parse({
      ...req.body,
      userId
    });
    const usage = await storage.addCopingStrategyUsage(validatedData);
    res.status(201).json(usage);
  } catch (error) {
    if (error instanceof z5.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Add coping strategy usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function createCopingStrategy(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const validatedData = insertCopingStrategySchema.parse({
      ...req.body,
      userId
    });
    const strategy = await storage.createCopingStrategy(validatedData);
    res.status(201).json(strategy);
  } catch (error) {
    if (error instanceof z5.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create coping strategy error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getCopingStrategies(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const includeGlobal = req.query.includeGlobal !== "false";
    const strategies = await storage.getCopingStrategiesByUser(userId, includeGlobal);
    res.status(200).json(strategies);
  } catch (error) {
    console.error("Get coping strategies error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateCopingStrategy(req, res) {
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
}
async function deleteCopingStrategy(req, res) {
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
}
async function createAction(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const validatedData = insertActionSchema.parse({
      ...req.body,
      userId
    });
    const action = await storage.createAction(validatedData);
    res.status(201).json(action);
  } catch (error) {
    if (error instanceof z5.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create action error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getActions(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const actions2 = await storage.getActionsByUser(userId);
    res.status(200).json(actions2);
  } catch (error) {
    console.error("Get actions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getUserResources(req, res) {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const resources4 = await storage.getResourcesByCreator(userId);
    if (userId !== req.user.id && req.user.role !== "admin") {
      const publishedResources = resources4.filter((resource) => resource.isPublished);
      return res.status(200).json(publishedResources);
    }
    res.status(200).json(resources4);
  } catch (error) {
    console.error("Get user resources error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getJournalEntries(req, res) {
  try {
    const userId = Number(req.params.userId);
    const entries = await storage.getJournalEntriesByUser(userId);
    res.status(200).json(entries);
  } catch (error) {
    console.error("Get journal entries error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getJournalStats(req, res) {
  try {
    const userId = Number(req.params.userId);
    const entries = await storage.getJournalEntriesByUser(userId);
    const stats = {
      totalEntries: entries.length,
      emotions: {},
      topics: {},
      cognitiveDistortions: {},
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
}
async function reanalyzeJournal(req, res) {
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
    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
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
}
async function linkThought(req, res) {
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
}
async function unlinkThought(req, res) {
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
}
async function getRelatedThoughts(req, res) {
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
}
async function getAiRecommendations(req, res) {
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
}
async function createAiRecommendation(req, res) {
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
    if (req.user.role !== "admin" && req.user.id !== user.therapistId) {
      return res.status(403).json({ message: "You do not have permission to create recommendations for this client" });
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
    if (error instanceof z5.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating AI recommendation:", error);
    res.status(500).json({ message: "Failed to create AI recommendation" });
  }
}

// server/routes/users.routes.ts
var router3 = Router3();
router3.get("/:userId/enhanced-insights", authenticate, checkUserAccess, getEnhancedInsights);
router3.post("/:userId/update-status", authenticate, ensureAuthenticated, checkUserAccess, updateUserStatus);
router3.get("/", authenticate, isAdmin, getAllUsers);
router3.get("/clients", authenticate, getClients);
router3.get("/all-clients", authenticate, isAdmin, getAllClients);
router3.get("/viewing-client-fixed", authenticate, getViewingClientFixed);
router3.get("/current-viewing-client", authenticate, getCurrentViewingClient);
router3.get("/:userId", authenticate, checkUserAccess, getUserDetails);
router3.post("/register-by-admin", authenticate, isAdmin, registerByAdmin);
router3.delete("/:userId", authenticate, isAdmin, deleteUser);
router3.patch("/:userId/unassign-therapist", authenticate, isAdmin, unassignTherapist);
router3.post("/:userId/reset-password", authenticate, isAdmin, resetPassword);
router3.patch("/:userId", authenticate, checkUserAccess, updateUserProfile);
router3.post("/:userId/subscription-plan", authenticate, isAdmin, assignSubscriptionPlan);
router3.delete("/clients/:clientId", authenticate, isTherapist, deleteClientByTherapist);
router3.get("/:userId/journals/count", authenticate, checkUserAccess, getJournalsCount);
router3.post("/invite-client", authenticate, isTherapist, inviteClient2);
router3.post("/current-viewing-client", authenticate, setCurrentViewingClient);
router3.get("/:userId/recent-activity", authenticate, checkUserAccess, getClientRecentActivity);
router3.get("/:userId/protective-factor-usage", authenticate, checkUserAccess, getProtectiveFactorUsage);
router3.post("/:userId/protective-factor-usage", authenticate, checkUserAccess, checkResourceCreationPermission, createProtectiveFactorUsage);
router3.post("/:userId/protective-factors", authenticate, checkUserAccess, checkResourceCreationPermission, createProtectiveFactor);
router3.get("/:userId/protective-factors", authenticate, checkUserAccess, getProtectiveFactors);
router3.put("/:userId/protective-factors/:factorId", authenticate, checkUserAccess, updateProtectiveFactor);
router3.delete("/:userId/protective-factors/:factorId", authenticate, checkUserAccess, deleteProtectiveFactor);
router3.get("/:userId/coping-strategy-usage", authenticate, checkUserAccess, getCopingStrategyUsage);
router3.post("/:userId/coping-strategy-usage", authenticate, checkUserAccess, checkResourceCreationPermission, createCopingStrategyUsage);
router3.post("/:userId/coping-strategies", authenticate, checkUserAccess, checkResourceCreationPermission, createCopingStrategy);
router3.get("/:userId/coping-strategies", authenticate, checkUserAccess, getCopingStrategies);
router3.put("/:userId/coping-strategies/:strategyId", authenticate, checkUserAccess, updateCopingStrategy);
router3.delete("/:userId/coping-strategies/:strategyId", authenticate, checkUserAccess, deleteCopingStrategy);
router3.post("/:userId/actions", authenticate, checkUserAccess, isClientOrAdmin, createAction);
router3.get("/:userId/actions", authenticate, checkUserAccess, getActions);
router3.get("/:userId/resources", authenticate, getUserResources);
router3.get("/:userId/journal", authenticate, checkUserAccess, getJournalEntries);
router3.get("/:userId/journal/stats", authenticate, checkUserAccess, getJournalStats);
router3.post("/:userId/journal/:entryId/reanalyze", authenticate, aiRateLimit, checkUserAccess, reanalyzeJournal);
router3.post("/:userId/journal/:journalId/link-thought", authenticate, checkUserAccess, linkThought);
router3.delete("/:userId/journal/:journalId/link-thought/:thoughtRecordId", authenticate, checkUserAccess, unlinkThought);
router3.get("/:userId/journal/:journalId/related-thoughts", authenticate, checkUserAccess, getRelatedThoughts);
router3.get("/:userId/recommendations", authenticate, checkUserAccess, getAiRecommendations);
router3.post("/:userId/recommendations", authenticate, ensureAuthenticated, createAiRecommendation);
var users_routes_default = router3;

// server/routes/emotions.routes.ts
import { Router as Router4 } from "express";

// server/controllers/emotions.controller.ts
init_db();
init_schema();
import { eq as eq13, sql as sql4 } from "drizzle-orm";
import { z as z6 } from "zod";
function getEmotionColor2(emotion) {
  return getEmotionColor(emotion);
}
async function getEmotionsCount(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const result = await db.select({ count: sql4`count(*)::int` }).from(emotionRecords).where(eq13(emotionRecords.userId, userId));
    res.json({ totalCount: result[0].count });
  } catch (error) {
    console.error("Error counting emotions:", error);
    res.status(500).json({ message: "Error counting emotion records" });
  }
}
async function createEmotionRecord(req, res) {
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
      error: error?.message
    });
  }
}
async function getEmotions(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const emotions = await storage.getEmotionRecordsByUser(userId);
    res.status(200).json(emotions);
  } catch (error) {
    console.error("Get emotion records error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function deleteEmotionRecord(req, res) {
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
}
async function getEmotionStats(req, res) {
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
}
async function updateEmotionRecord(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const emotionId = parseInt(req.params.emotionId);
    const updateSchema = z6.object({
      intensity: z6.number().min(1).max(10).optional(),
      situation: z6.string().optional(),
      location: z6.string().nullable().optional(),
      company: z6.string().nullable().optional()
    });
    const validatedUpdate = updateSchema.parse(req.body);
    const existingEmotion = await storage.getEmotionRecordById(emotionId);
    if (!existingEmotion) {
      return res.status(404).json({ message: "Emotion record not found" });
    }
    if (existingEmotion.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const updateData = {
      ...validatedUpdate.intensity !== void 0 && { intensity: validatedUpdate.intensity },
      ...validatedUpdate.situation !== void 0 && { situation: validatedUpdate.situation },
      ...validatedUpdate.location !== void 0 && { location: validatedUpdate.location },
      ...validatedUpdate.company !== void 0 && { company: validatedUpdate.company }
    };
    const [updatedEmotion] = await db.update(emotionRecords).set(updateData).where(eq13(emotionRecords.id, emotionId)).returning();
    res.status(200).json(updatedEmotion);
  } catch (error) {
    if (error instanceof z6.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Update emotion record error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// server/routes/emotions.routes.ts
var router4 = Router4({ mergeParams: true });
router4.get("/count", authenticate, checkUserAccess, getEmotionsCount);
router4.post("/", authenticate, checkUserAccess, isClientOrAdmin, createEmotionRecord);
router4.patch("/:emotionId", authenticate, checkUserAccess, updateEmotionRecord);
router4.get("/", authenticate, checkUserAccess, getEmotions);
router4.delete("/:emotionId", authenticate, checkUserAccess, deleteEmotionRecord);
router4.get("/stats", authenticate, checkUserAccess, getEmotionStats);
var emotions_routes_default = router4;

// server/routes/thoughts.routes.ts
import { Router as Router5 } from "express";

// server/controllers/thoughts.controller.ts
init_db();
init_schema();
import { eq as eq14, sql as sql5 } from "drizzle-orm";
import { z as z7 } from "zod";
async function getThoughtsCount(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    if (userId >= 100 && userId <= 110) {
      return res.status(200).json({ totalCount: Math.floor(Math.random() * 6) + 2 });
    }
    const result = await db.select({ count: sql5`count(*)::int` }).from(thoughtRecords).where(eq14(thoughtRecords.userId, userId));
    res.json({ totalCount: result[0].count });
  } catch (error) {
    console.error("Error counting thoughts:", error);
    res.status(500).json({ message: "Error counting thought records" });
  }
}
async function createThoughtRecord(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const validatedData = insertThoughtRecordSchema.parse({
      ...req.body,
      userId
    });
    const thoughtRecord = await storage.createThoughtRecord(validatedData);
    res.status(201).json(thoughtRecord);
  } catch (error) {
    if (error instanceof z7.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create thought record error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateThoughtRecord(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const thoughtId = parseInt(req.params.thoughtId);
    const updateSchema = z7.object({
      cognitiveDistortions: z7.array(z7.string()).optional(),
      evidenceFor: z7.string().min(1).optional(),
      evidenceAgainst: z7.string().min(1).optional(),
      alternativePerspective: z7.string().min(1).optional(),
      reflectionRating: z7.number().min(0).max(10).optional(),
      insightsGained: z7.string().min(1).optional()
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
    const [updatedThought] = await db.update(thoughtRecords).set(updateData).where(eq14(thoughtRecords.id, thoughtId)).returning();
    res.status(200).json(updatedThought);
  } catch (error) {
    if (error instanceof z7.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Update thought record error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getThoughtRecords(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const emotionRecordId = req.query.emotionRecordId ? parseInt(req.query.emotionRecordId) : void 0;
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
}
async function deleteThoughtRecord(req, res) {
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
}
async function getThoughtRatings(req, res) {
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
}
async function getThoughtProtectiveFactors(req, res) {
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
    const result = await pool.query(query, [thoughtId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching protective factors for thought record:", error);
    res.status(500).json({ message: "Server error" });
  }
}
async function getThoughtCopingStrategies(req, res) {
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
    const result = await pool.query(query, [thoughtId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching coping strategies for thought record:", error);
    res.status(500).json({ message: "Server error" });
  }
}
async function getRelatedJournals(req, res) {
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
}
async function getSingleThoughtRecord(req, res) {
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
}

// server/routes/thoughts.routes.ts
var router5 = Router5({ mergeParams: true });
router5.get("/count", authenticate, checkUserAccess, getThoughtsCount);
router5.post("/", authenticate, checkUserAccess, isClientOrAdmin, createThoughtRecord);
router5.patch("/:thoughtId", authenticate, checkUserAccess, updateThoughtRecord);
router5.get("/", authenticate, checkUserAccess, getThoughtRecords);
router5.delete("/:thoughtId", authenticate, checkUserAccess, deleteThoughtRecord);
router5.get("/ratings", authenticate, checkUserAccess, getThoughtRatings);
router5.get("/:id/protective-factors", authenticate, checkUserAccess, getThoughtProtectiveFactors);
router5.get("/:id/coping-strategies", authenticate, checkUserAccess, getThoughtCopingStrategies);
router5.get("/:thoughtRecordId/related-journals", authenticate, checkUserAccess, getRelatedJournals);
router5.get("/thoughts/:id", authenticate, getSingleThoughtRecord);
var thoughts_routes_default = router5;

// server/routes/goals.routes.ts
import { Router as Router6 } from "express";

// server/controllers/goals.controller.ts
init_db();
init_schema();
import { eq as eq15 } from "drizzle-orm";
import { z as z8 } from "zod";
async function updateGoalStatusBasedOnMilestones(goalId) {
  try {
    const milestones = await db.select().from(goalMilestones).where(eq15(goalMilestones.goalId, goalId));
    if (milestones.length === 0) {
      await db.update(goals).set({ status: "pending" }).where(eq15(goals.id, goalId));
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
    await db.update(goals).set({ status: newStatus }).where(eq15(goals.id, goalId));
    console.log(`Goal ${goalId} status auto-updated to '${newStatus}' (${completedMilestones}/${totalMilestones} milestones completed)`);
  } catch (error) {
    console.error(`Error auto-updating status for goal ${goalId}:`, error);
  }
}
async function createGoal(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    console.log("Creating goal for user:", userId);
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
    if (error instanceof z8.ZodError) {
      console.error("Goal validation error:", JSON.stringify(error.errors));
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create goal error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getGoals(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    if (req.user.role === "therapist" && req.user.currentViewingClientId) {
      const viewingClient = await storage.getUser(req.user.currentViewingClientId);
      if (viewingClient && viewingClient.therapistId === req.user.id) {
        const clientGoals = await storage.getGoalsByUser(req.user.currentViewingClientId);
        return res.status(200).json(clientGoals);
      }
      await storage.updateCurrentViewingClient(req.user.id, null);
    }
    const goals3 = await storage.getGoalsByUser(userId);
    res.status(200).json(goals3);
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getAllMilestones(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    let targetUserId = userId;
    if (req.user.role === "therapist" && req.user.currentViewingClientId) {
      const viewingClient = await storage.getUser(req.user.currentViewingClientId);
      if (viewingClient && viewingClient.therapistId === req.user.id) {
        targetUserId = req.user.currentViewingClientId;
      } else {
        await storage.updateCurrentViewingClient(req.user.id, null);
      }
    }
    const goals3 = await storage.getGoalsByUser(targetUserId);
    const allMilestones = [];
    for (const goal of goals3) {
      const milestones = await storage.getGoalMilestonesByGoal(goal.id);
      allMilestones.push(...milestones);
    }
    res.status(200).json(allMilestones);
  } catch (error) {
    console.error("Get all milestones error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateGoalStatus(req, res) {
  try {
    const { status, therapistComments } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    const id = parseInt(req.params.id);
    const goal = await storage.getGoalsByUser(req.user.id).then(
      (goals3) => goals3.find((g) => g.id === id)
    );
    if (!goal && req.user.role !== "therapist" && req.user.role !== "admin") {
      return res.status(404).json({ message: "Goal not found" });
    }
    if (req.user.role === "therapist" && !goal) {
      const [updatedGoal2] = await db.select().from(goals).where(eq15(goals.id, id));
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
}
async function createGoalMilestone(req, res) {
  try {
    const goalId = parseInt(req.params.goalId);
    console.log("Creating milestone for goal:", req.body.goalId);
    const [goal] = await db.select().from(goals).where(eq15(goals.id, goalId));
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
    if (error instanceof z8.ZodError) {
      console.error("Milestone validation error:", JSON.stringify(error.errors));
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create goal milestone error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getGoalMilestones(req, res) {
  try {
    const goalId = parseInt(req.params.goalId);
    const [goal] = await db.select().from(goals).where(eq15(goals.id, goalId));
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
}
async function updateMilestoneCompletion(req, res) {
  try {
    const { isCompleted } = req.body;
    if (isCompleted === void 0) {
      return res.status(400).json({ message: "isCompleted field is required" });
    }
    const id = parseInt(req.params.id);
    const [milestone] = await db.select().from(goalMilestones).where(eq15(goalMilestones.id, id));
    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }
    const [goal] = await db.select().from(goals).where(eq15(goals.id, milestone.goalId));
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
}

// server/routes/goals.routes.ts
var router6 = Router6({ mergeParams: true });
router6.post("/", authenticate, checkUserAccess, isClientOrAdmin, createGoal);
router6.get("/", authenticate, checkUserAccess, getGoals);
router6.get("/milestones", authenticate, checkUserAccess, getAllMilestones);
router6.patch("/goals/:id/status", authenticate, updateGoalStatus);
router6.post("/goals/:goalId/milestones", authenticate, createGoalMilestone);
router6.get("/goals/:goalId/milestones", authenticate, getGoalMilestones);
router6.patch("/milestones/:id/completion", authenticate, updateMilestoneCompletion);
var goals_routes_default = router6;

// server/routes/journal.routes.ts
import { Router as Router7 } from "express";

// server/controllers/journal.controller.ts
init_db();
init_schema();
import { eq as eq16 } from "drizzle-orm";
import { z as z9 } from "zod";
async function getJournalEntryById(req, res) {
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
}
async function createJournalEntry(req, res) {
  try {
    const validatedData = insertJournalEntrySchema.parse({
      ...req.body,
      userId: req.user.id
      // Ensure the entry is created for the authenticated user
    });
    const newEntry = await storage.createJournalEntry(validatedData);
    if (validatedData.content && process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      if (!aiRateLimiter.tryConsume(aiRateLimiter.getClientId(req))) {
        return res.status(201).json({ ...newEntry, _aiSkipped: true, _aiSkipReason: "rate_limit" });
      }
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
    if (error instanceof z9.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create journal entry error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateJournalEntry(req, res) {
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
    if (validatedData.content && process.env.AI_INTEGRATIONS_OPENAI_API_KEY && aiRateLimiter.tryConsume(aiRateLimiter.getClientId(req))) {
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
    if (error instanceof z9.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Update journal entry error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function deleteJournalEntry(req, res) {
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
}
async function updateJournalTags(req, res) {
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
}
async function createJournalComment(req, res) {
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
    const clientId = aiRateLimiter.getClientId(req);
    if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && entry.content && aiRateLimiter.tryConsume(clientId)) {
      try {
        console.log("Starting AI analysis for comment on entry:", entryId);
        const comments = await storage.getJournalCommentsByEntry(entryId);
        console.log(`Found ${comments.length} comments for analysis`);
        if (!comments || !Array.isArray(comments)) {
          console.error("Invalid comments array returned from storage:", comments);
          throw new Error("Invalid comments data structure");
        }
        const MAX_PROMPT_CHARS = 8e3;
        const entryPart = `${entry.title || ""}

${entry.content}`;
        const commentsPart = comments.map((c) => c.comment || "").join("\n\n");
        const combinedRaw = `${entryPart}

Additional comments:
${commentsPart}`;
        const combinedText = combinedRaw.length > MAX_PROMPT_CHARS ? combinedRaw.slice(0, MAX_PROMPT_CHARS) : combinedRaw;
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
        const allTags = Array.from(/* @__PURE__ */ new Set([...existingTags, ...analysis.suggestedTags]));
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
      }
    }
    res.status(201).json(newComment);
  } catch (error) {
    if (error instanceof z9.ZodError) {
      console.log("Journal comment validation error:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create journal comment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateJournalComment(req, res) {
  try {
    const commentId = Number(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }
    const [comment] = await db.select().from(journalComments).where(eq16(journalComments.id, commentId));
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
    if (error instanceof z9.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Update journal comment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function deleteJournalComment(req, res) {
  try {
    const commentId = Number(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }
    const [comment] = await db.select().from(journalComments).where(eq16(journalComments.id, commentId));
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
}
async function analyzeJournalText(req, res) {
  try {
    const { title, content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Content is required for analysis" });
    }
    if (typeof content !== "string" || content.length > 5e4) {
      return res.status(400).json({ message: "Content must not exceed 50,000 characters" });
    }
    if (title !== void 0 && (typeof title !== "string" || title.length > 500)) {
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
async function reanalyzeJournalEntry(req, res) {
  try {
    const entryId = Number(req.params.id);
    if (isNaN(entryId)) {
      return res.status(400).json({ message: "Invalid entry ID" });
    }
    const entry = await storage.getJournalEntryById(entryId);
    if (!entry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }
    if (entry.userId !== req.user?.id && req.user?.role !== "admin") {
      if (req.user?.role === "therapist") {
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
}

// server/routes/journal.routes.ts
var router7 = Router7({ mergeParams: true });
router7.get("/journal/:id", authenticate, getJournalEntryById);
router7.post("/journal", authenticate, createJournalEntry);
router7.patch("/journal/:id", authenticate, updateJournalEntry);
router7.delete("/journal/:id", authenticate, deleteJournalEntry);
router7.post("/journal/:id/tags", authenticate, updateJournalTags);
router7.post("/journal/:id/comments", authenticate, createJournalComment);
router7.patch("/journal/comments/:id", authenticate, updateJournalComment);
router7.delete("/journal/comments/:id", authenticate, deleteJournalComment);
router7.post("/journal/analyze", authenticate, aiRateLimit, analyzeJournalText);
router7.post("/journal/:id/reanalyze", authenticate, aiRateLimit, reanalyzeJournalEntry);
var journal_routes_default = router7;

// server/routes/admin.routes.ts
import { Router as Router8 } from "express";

// server/controllers/admin.controller.ts
init_db();
init_schema();
init_websocket();
init_email();
async function getAdminStats(req, res) {
  try {
    const users3 = await storage.getAllUsers();
    const clients = users3.filter((u) => u.role === "client");
    const therapists = users3.filter((u) => u.role === "therapist");
    const activeClients = clients.filter((c) => c.status === "active").length;
    const clientsWithoutTherapist = clients.filter((c) => !c.therapistId).length;
    const therapistsWithClients = new Set(
      clients.filter((c) => c.therapistId).map((c) => c.therapistId)
    );
    const therapistsWithoutClients = therapists.length - therapistsWithClients.size;
    const emotionRecords3 = await storage.getAllEmotionRecords();
    const thoughtRecordsResult = await storage.getAllThoughtRecords();
    const goalsResult = await storage.getAllGoals();
    const clientsWithGoalsSet = new Set(goalsResult.map((g) => g.userId));
    const clientsWithGoals = clientsWithGoalsSet.size;
    const resources4 = await storage.getAllResources();
    const resourceAssignments3 = await storage.getAllResourceAssignments();
    const avgGoalsPerClient = clients.length ? goalsResult.length / clients.length : 0;
    const avgEmotionsPerClient = clients.length ? emotionRecords3.length / clients.length : 0;
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
    emotionRecords3.forEach((emotion) => {
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
    resourceAssignments3.forEach((assignment) => {
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
    const mostUsedResource = resources4.find((r) => r.id === mostUsedResourceId)?.title || "N/A";
    const topResources = resources4.map((resource) => {
      const usageCount = resourceAssignments3.filter((a) => a.resourceId === resource.id).length;
      return {
        id: resource.id,
        title: resource.title,
        usageCount
      };
    }).sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
    const stats = {
      totalUsers: users3.length,
      totalClients: clients.length,
      totalTherapists: therapists.length,
      totalEmotions: emotionRecords3.length,
      totalThoughts: thoughtRecordsResult.length,
      totalGoals: goalsResult.length,
      activeClients,
      activeTherapists: therapists.length,
      resourceUsage: resourceAssignments3.length,
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
}
async function getAdminViewingClientStatus(req, res) {
  console.log("Admin viewing client status requested");
  return res.status(200).json({ viewingClient: null, success: true });
}
async function recalculateGoalStatuses(req, res) {
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
}
async function triggerDailyReminders(req, res) {
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
}
async function triggerWeeklyDigests(req, res) {
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
}
async function getAdminNotifications(req, res) {
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
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
}
async function getAdminLogs(req, res) {
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
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching system logs:", error);
    res.status(500).json({ message: "Failed to fetch system logs" });
  }
}
async function clearSystemLogs(req, res) {
  try {
    await pool.query("DELETE FROM system_logs");
    res.status(200).json({ message: "System logs cleared successfully" });
  } catch (error) {
    console.error("Error clearing system logs:", error);
    res.status(500).json({ message: "Failed to clear system logs" });
  }
}
async function getEngagementSettings(req, res) {
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
}
async function updateEngagementSettings(req, res) {
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
}
async function getEngagementStats(req, res) {
  try {
    const users3 = await storage.getAllUsers();
    const clients = users3.filter((user) => user.role === "client");
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
}
async function checkInactiveClients(req, res) {
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
    const result = await pool.query(query, [cutoffDate.toISOString()]);
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
}
async function sendInactivityReminders(req, res) {
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
    const result = await pool.query(query, [cutoffDate.toISOString()]);
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
        const notificationResult = await pool.query(notificationQuery, [
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
          console.error(`Error sending email to client ${client.id}:`, emailError);
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
}
async function sendWeeklyDigests(req, res) {
  try {
    const usersQuery = `
      SELECT id, name, email, role
      FROM users
      WHERE status = 'active'
      ${req.body.userId ? "AND id = $1" : ""}
    `;
    const usersResult = req.body.userId ? await pool.query(usersQuery, [req.body.userId]) : await pool.query(usersQuery);
    const users3 = usersResult.rows;
    console.log(`Processing weekly digests for ${users3.length} users`);
    let notificationsSent = 0;
    let emailsSent = 0;
    const processedUsers = [];
    for (const user of users3) {
      console.log(`Processing weekly digest for user ID: ${user.id}`);
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
      const emotionResult = await pool.query(emotionQuery, [user.id, startDate, endDate]);
      const emotionsTracked = parseInt(emotionResult.rows[0].count, 10);
      const journalQuery = `
        SELECT COUNT(*) as count 
        FROM journal_entries 
        WHERE user_id = $1 
        AND created_at BETWEEN $2 AND $3
      `;
      const journalResult = await pool.query(journalQuery, [user.id, startDate, endDate]);
      const journalEntries3 = parseInt(journalResult.rows[0].count, 10);
      const thoughtQuery = `
        SELECT COUNT(*) as count 
        FROM thought_records 
        WHERE user_id = $1 
        AND created_at BETWEEN $2 AND $3
      `;
      const thoughtResult = await pool.query(thoughtQuery, [user.id, startDate, endDate]);
      const thoughtRecordsCount = parseInt(thoughtResult.rows[0].count, 10);
      const summary = {
        emotionsTracked,
        journalEntries: journalEntries3,
        thoughtRecords: thoughtRecordsCount,
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
        const notificationResult = await pool.query(notificationQuery, [
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
          console.error(`Error sending digest email to user ${user.id}:`, emailError);
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
      totalUsers: users3.length,
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
}

// server/routes/admin.routes.ts
var router8 = Router8({ mergeParams: true });
router8.get("/admin/stats", authenticate, isAdmin, getAdminStats);
router8.get("/admin/viewing-client-status", authenticate, isAdmin, getAdminViewingClientStatus);
router8.post("/admin/recalculate-goal-statuses", authenticate, isAdmin, recalculateGoalStatuses);
router8.post("/admin/scheduler/trigger-daily-reminders", authenticate, isAdmin, triggerDailyReminders);
router8.post("/admin/scheduler/trigger-weekly-digests", authenticate, isAdmin, triggerWeeklyDigests);
router8.get("/admin/notifications", authenticate, isAdmin, getAdminNotifications);
router8.get("/admin/logs", authenticate, isAdmin, getAdminLogs);
router8.delete("/admin/logs", authenticate, isAdmin, clearSystemLogs);
router8.get("/admin/engagement-settings", authenticate, isAdmin, getEngagementSettings);
router8.post("/admin/engagement-settings", authenticate, isAdmin, updateEngagementSettings);
router8.get("/admin/engagement-stats", authenticate, isAdmin, getEngagementStats);
router8.get("/admin/inactivity/check", authenticate, isAdmin, checkInactiveClients);
router8.post("/admin/inactivity/send-reminders", authenticate, isAdmin, sendInactivityReminders);
router8.post("/admin/weekly-digests/send", authenticate, isAdmin, sendWeeklyDigests);
var admin_routes_default = router8;

// server/routes/notifications.routes.ts
import { Router as Router9 } from "express";

// server/controllers/notifications.controller.ts
init_db();
init_websocket();
var notificationCache = /* @__PURE__ */ new Map();
var NOTIFICATION_CACHE_DURATION = 3e4;
async function getUserNotifications(req, res) {
  try {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const notifications2 = await withRetry(async () => {
      return await storage.getNotificationsByUser(userId, limit);
    });
    res.status(200).json(notifications2);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
}
async function getUnreadNotifications(req, res) {
  try {
    const userId = req.user.id;
    const cached = notificationCache.get(userId);
    if (cached && Date.now() < cached.expires) {
      return res.status(200).json(cached.notifications);
    }
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
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ message: "Failed to fetch unread notifications" });
  }
}
async function markNotificationRead(req, res) {
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
    notificationCache.delete(req.user.id);
    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
}
async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.user.id;
    console.log(`EMERGENCY NOTIFICATION RESET for user ${userId}`);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    try {
      await pool.query(`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1
      `, [userId]);
      console.log(`Successfully marked all notifications as read for user ${userId}`);
    } catch (sqlError) {
      console.error("Critical error with notification reset:", sqlError);
      throw sqlError;
    }
    notificationCache.delete(userId);
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
}
async function deleteNotification(req, res) {
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
    notificationCache.delete(req.user.id);
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
}
async function clearAllNotifications(req, res) {
  try {
    const userId = req.user.id;
    await storage.clearAllNotifications(userId);
    notificationCache.delete(userId);
    res.status(200).json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
}
async function createTestNotification(req, res) {
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
    notificationCache.delete(userId);
    res.status(201).json(testNotification);
  } catch (error) {
    console.error("Error creating test notification:", error);
    res.status(500).json({ message: "Failed to create test notification" });
  }
}

// server/routes/notifications.routes.ts
var router9 = Router9();
router9.get("/", authenticate, getUserNotifications);
router9.get("/unread", authenticate, getUnreadNotifications);
router9.post("/read/:id", authenticate, markNotificationRead);
router9.post("/read-all", authenticate, markAllNotificationsRead);
router9.delete("/", authenticate, clearAllNotifications);
router9.delete("/:id", authenticate, deleteNotification);
router9.post("/test", authenticate, isAdmin, createTestNotification);
var notifications_routes_default = router9;

// server/routes/resources.routes.ts
import { Router as Router10 } from "express";

// server/controllers/resources.controller.ts
init_websocket();
async function getAllResources(req, res) {
  try {
    const user = req.user;
    if (user?.role === "client") {
      const assignments = await storage.getAssignmentsByClient(user.id);
      const resources4 = await Promise.all(
        assignments.map((a) => storage.getResourceById(a.resourceId))
      );
      return res.json(resources4.filter(Boolean));
    }
    const includeUnpublished = user?.role === "admin" || user?.role === "therapist";
    const allResources = await storage.getAllResources(includeUnpublished);
    res.json(allResources);
  } catch (error) {
    console.error("getAllResources error:", error);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
}
async function createResource(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { title, description, content, type, category, tags, isPublished, pdfUrl } = req.body;
    if (!title || !description || !content || !type || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const resource = await storage.createResource({
      title,
      description,
      content,
      type,
      category,
      tags: tags || [],
      isPublished: isPublished ?? true,
      fileUrl: pdfUrl || null,
      createdBy: user.id
    });
    res.status(201).json(resource);
  } catch (error) {
    console.error("createResource error:", error);
    res.status(500).json({ message: "Failed to create resource" });
  }
}
async function updateResource(req, res) {
  try {
    const user = req.user;
    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) return res.status(400).json({ message: "Invalid resource ID" });
    const existing = await storage.getResourceById(resourceId);
    if (!existing) return res.status(404).json({ message: "Resource not found" });
    if (user?.role !== "admin" && existing.createdBy !== user?.id) {
      return res.status(403).json({ message: "Not authorised to update this resource" });
    }
    const { title, description, content, type, category, tags, isPublished, pdfUrl } = req.body;
    const updated = await storage.updateResource(resourceId, {
      ...title !== void 0 && { title },
      ...description !== void 0 && { description },
      ...content !== void 0 && { content },
      ...type !== void 0 && { type },
      ...category !== void 0 && { category },
      ...tags !== void 0 && { tags },
      ...isPublished !== void 0 && { isPublished },
      ...pdfUrl !== void 0 && { fileUrl: pdfUrl }
    });
    res.json(updated);
  } catch (error) {
    console.error("updateResource error:", error);
    res.status(500).json({ message: "Failed to update resource" });
  }
}
async function deleteResource(req, res) {
  try {
    const user = req.user;
    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) return res.status(400).json({ message: "Invalid resource ID" });
    const existing = await storage.getResourceById(resourceId);
    if (!existing) return res.status(404).json({ message: "Resource not found" });
    if (user?.role !== "admin" && existing.createdBy !== user?.id) {
      return res.status(403).json({ message: "Not authorised to delete this resource" });
    }
    await storage.deleteResource(resourceId);
    res.status(204).send();
  } catch (error) {
    console.error("deleteResource error:", error);
    res.status(500).json({ message: "Failed to delete resource" });
  }
}
async function assignResource(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { resourceId, clientId, notes } = req.body;
    if (!resourceId || !clientId) {
      return res.status(400).json({ message: "resourceId and clientId are required" });
    }
    const assignment = await storage.assignResourceToClient({
      resourceId,
      assignedBy: user.id,
      assignedTo: clientId,
      notes: notes || null,
      status: "assigned",
      type: "resource"
    });
    try {
      const resource = await storage.getResourceById(resourceId);
      const resourceTitle = resource?.title ?? "a new resource";
      const notification = await storage.createNotification({
        userId: clientId,
        title: "New Resource Assigned",
        body: `Your therapist assigned you "${resourceTitle}". Check your library to view it.`,
        type: "resource"
      });
      sendNotificationToUser(clientId, notification);
    } catch (notifError) {
      console.error("Failed to send resource assignment notification:", notifError);
    }
    res.status(201).json(assignment);
  } catch (error) {
    console.error("assignResource error:", error);
    res.status(500).json({ message: "Failed to assign resource" });
  }
}
async function cloneResource(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) return res.status(400).json({ message: "Invalid resource ID" });
    const cloned = await storage.cloneResource(resourceId, user.id);
    res.status(201).json(cloned);
  } catch (error) {
    console.error("cloneResource error:", error);
    res.status(500).json({ message: "Failed to clone resource" });
  }
}
async function getTherapistAssignments(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const assignments = await storage.getAssignmentsByTherapist(user.id);
    const uniqueClientIds = [...new Set(assignments.map((a) => a.assignedTo))];
    const clientFeedbackMap = /* @__PURE__ */ new Map();
    await Promise.all(
      uniqueClientIds.map(async (clientId) => {
        const fb = await storage.getResourceFeedbackByUser(clientId);
        clientFeedbackMap.set(clientId, fb);
      })
    );
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const resource = await storage.getResourceById(a.resourceId);
        const client = await storage.getUser(a.assignedTo);
        const clientFeedback = clientFeedbackMap.get(a.assignedTo) || [];
        const feedback = clientFeedback.find((f) => f.resourceId === a.resourceId) || null;
        return {
          ...a,
          resource: resource || null,
          client: client ? { id: client.id, name: client.name, username: client.username } : null,
          feedback
        };
      })
    );
    res.json(enriched);
  } catch (error) {
    console.error("getTherapistAssignments error:", error);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
}
async function getClientAssignments(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const assignments = await storage.getAssignmentsByClient(user.id);
    const allFeedback = await storage.getResourceFeedbackByUser(user.id);
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const resource = await storage.getResourceById(a.resourceId);
        const myFeedback = allFeedback.find((f) => f.resourceId === a.resourceId) || null;
        return { ...a, resource: resource || null, feedback: myFeedback };
      })
    );
    res.json(enriched);
  } catch (error) {
    console.error("getClientAssignments error:", error);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
}
async function updateResourceAssignmentStatus(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const assignmentId = parseInt(req.params.id);
    if (isNaN(assignmentId)) return res.status(400).json({ message: "Invalid assignment ID" });
    const { status } = req.body;
    if (!status || !["viewed", "completed"].includes(status)) {
      return res.status(400).json({ message: "status must be 'viewed' or 'completed'" });
    }
    const assignment = await storage.getResourceAssignmentById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    if (assignment.assignedTo !== user.id) {
      return res.status(403).json({ message: "Not authorised to update this assignment" });
    }
    const updated = await storage.updateAssignmentStatus(assignmentId, status);
    res.json(updated);
  } catch (error) {
    console.error("updateResourceAssignmentStatus error:", error);
    res.status(500).json({ message: "Failed to update assignment status" });
  }
}
async function submitAssignmentFeedback(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const assignmentId = parseInt(req.params.id);
    if (isNaN(assignmentId)) return res.status(400).json({ message: "Invalid assignment ID" });
    const { rating, feedback } = req.body;
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating must be a number between 1 and 5" });
    }
    const assignment = await storage.getResourceAssignmentById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    if (assignment.assignedTo !== user.id) {
      return res.status(403).json({ message: "Not authorised to submit feedback for this assignment" });
    }
    const existing = await storage.getResourceFeedbackByUser(user.id);
    const alreadyRated = existing.find((f) => f.resourceId === assignment.resourceId);
    if (alreadyRated) {
      return res.status(409).json({ message: "Feedback already submitted for this resource" });
    }
    const saved = await storage.createResourceFeedback({
      resourceId: assignment.resourceId,
      userId: user.id,
      rating,
      feedback: feedback || null
    });
    res.status(201).json(saved);
  } catch (error) {
    console.error("submitAssignmentFeedback error:", error);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
}
async function deleteResourceAssignment(req, res) {
  try {
    const user = req.user;
    const assignmentId = parseInt(req.params.id);
    if (isNaN(assignmentId)) return res.status(400).json({ message: "Invalid assignment ID" });
    const assignment = await storage.getResourceAssignmentById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    if (user?.role !== "admin" && assignment.assignedBy !== user?.id) {
      return res.status(403).json({ message: "Not authorised to delete this assignment" });
    }
    await storage.deleteResourceAssignment(assignmentId);
    res.status(204).send();
  } catch (error) {
    console.error("deleteResourceAssignment error:", error);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
}

// server/routes/resources.routes.ts
var router10 = Router10();
router10.get("/resources", authenticate, getAllResources);
router10.post("/resources", authenticate, createResource);
router10.post("/resources/assign", authenticate, assignResource);
router10.patch("/resources/:id", authenticate, updateResource);
router10.delete("/resources/:id", authenticate, deleteResource);
router10.post("/resources/:id/clone", authenticate, cloneResource);
router10.get("/therapist/assignments", authenticate, getTherapistAssignments);
router10.delete("/resource-assignments/:id", authenticate, deleteResourceAssignment);
router10.get("/client/assignments", authenticate, getClientAssignments);
router10.patch("/resource-assignments/:id/status", authenticate, updateResourceAssignmentStatus);
router10.post("/resource-assignments/:id/feedback", authenticate, submitAssignmentFeedback);
var resources_routes_default = router10;

// server/routes/translate.routes.ts
import { Router as Router11 } from "express";
import OpenAI2 from "openai";
var router11 = Router11();
var openai2 = new OpenAI2({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});
router11.post("/translate", authenticate, async (req, res) => {
  try {
    const { text: text2, targetLang = "ar" } = req.body;
    if (!text2 || typeof text2 !== "string" || text2.trim() === "") {
      return res.status(400).json({ message: "Text is required and must be a non-empty string" });
    }
    const languageNames = {
      ar: "Arabic",
      en: "English"
    };
    const targetLanguageName = languageNames[targetLang] || "Arabic";
    const prompt = `Translate the following text into ${targetLanguageName}. Keep the tone natural, compassionate, and appropriate for a mental health / cognitive behavioral therapy application. Do not add any conversational filler, explanations, or quotes around the translated text. Return ONLY the translated text.
    
    Text to translate:
    "${text2}"`;
    const response = await openai2.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });
    const translatedText = response.choices[0]?.message?.content?.trim() || text2;
    res.json({ translation: translatedText });
  } catch (error) {
    console.error("Translation API error:", error);
    res.status(500).json({ message: "Failed to translate text" });
  }
});
var translate_routes_default = router11;

// server/routes/transcribe.routes.ts
import { Router as Router12 } from "express";
import https from "https";
var router12 = Router12();
var RATE_LIMIT_MAX = 30;
var RATE_LIMIT_WINDOW_MS = 60 * 60 * 1e3;
var rateLimitMap = /* @__PURE__ */ new Map();
function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}
function httpsPost(hostname, path3, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path: path3, method: "POST", headers },
      (res) => {
        let data = "";
        res.on("data", (c) => data += c);
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
async function whisperTranscribe(audioBuffer, mimeType, language) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const boundary = "----WaveformBoundary" + Date.now();
  let ext = "webm";
  if (mimeType.includes("mp4")) ext = "mp4";
  else if (mimeType.includes("ogg")) ext = "ogg";
  else if (mimeType.includes("wav")) ext = "wav";
  else if (mimeType.includes("mp3") || mimeType.includes("mpeg")) ext = "mp3";
  const parts = [];
  const addField = (name, value) => {
    parts.push(Buffer.from(
      `--${boundary}\r
Content-Disposition: form-data; name="${name}"\r
\r
${value}\r
`
    ));
  };
  addField("model", "whisper-1");
  if (language) addField("language", language.split("-")[0]);
  parts.push(Buffer.from(
    `--${boundary}\r
Content-Disposition: form-data; name="file"; filename="audio.${ext}"\r
Content-Type: ${mimeType}\r
\r
`
  ));
  parts.push(audioBuffer);
  parts.push(Buffer.from(`\r
--${boundary}--\r
`));
  const body = Buffer.concat(parts);
  const result = await httpsPost(
    "api.openai.com",
    "/v1/audio/transcriptions",
    {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": body.length
    },
    body
  );
  if (result.status !== 200) {
    throw new Error(`Whisper ${result.status}: ${result.body.slice(0, 200)}`);
  }
  const parsed = JSON.parse(result.body);
  return (parsed?.text ?? "").trim();
}
function deepgramMime(mimeType) {
  if (mimeType.includes("mp4")) return "audio/mp4";
  if (mimeType.includes("ogg")) return "audio/ogg";
  if (mimeType.includes("wav")) return "audio/wav";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) return "audio/mpeg";
  return "audio/webm";
}
function deepgramTranscribe(audioBuffer, mimeType, language) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      reject(new Error("DEEPGRAM_API_KEY is not configured"));
      return;
    }
    const contentType = deepgramMime(mimeType);
    const params = new URLSearchParams({
      model: "nova-2",
      smart_format: "true",
      punctuate: "true",
      ...language ? { language } : {}
    });
    const options = {
      hostname: "api.deepgram.com",
      path: `/v1/listen?${params.toString()}`,
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": contentType,
        "Content-Length": audioBuffer.length
      }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Deepgram ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const transcript = parsed?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
          resolve(transcript.trim());
        } catch {
          reject(new Error("Failed to parse Deepgram response"));
        }
      });
    });
    req.on("error", (err) => reject(err));
    req.write(audioBuffer);
    req.end();
  });
}
router12.get("/transcribe/probe", authenticate, async (_req, res) => {
  const results = {};
  try {
    const boundary = "probe" + Date.now();
    const body = Buffer.from(`--${boundary}\r
Content-Disposition: form-data; name="model"\r
\r
whisper-1\r
--${boundary}--\r
`);
    const r = await httpsPost(
      "api.openai.com",
      "/v1/audio/transcriptions",
      {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length
      },
      body
    );
    results["openai_whisper"] = {
      reachable: r.status !== 0,
      status: r.status,
      note: r.status === 200 ? "WORKS" : r.status === 401 ? "BLOCKED \u2014 proxy substitutes service account key" : r.status === 400 ? "Reachable but bad request (expected in probe)" : `status ${r.status}: ${r.body.slice(0, 100)}`
    };
  } catch (e) {
    results["openai_whisper"] = { reachable: false, status: 0, note: e.message };
  }
  try {
    const r = await httpsPost(
      "api.deepgram.com",
      "/v1/listen?model=nova-2",
      {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY ?? "MISSING"}`,
        "Content-Type": "audio/wav",
        "Content-Length": 0
      },
      Buffer.alloc(0)
    );
    results["deepgram"] = {
      reachable: true,
      status: r.status,
      note: r.status === 200 ? "WORKS" : r.status === 401 ? process.env.DEEPGRAM_API_KEY ? "Key invalid \u2014 check DEEPGRAM_API_KEY" : "DEEPGRAM_API_KEY not set" : `status ${r.status}`
    };
  } catch (e) {
    results["deepgram"] = { reachable: false, status: 0, note: e.message };
  }
  res.json({ results });
});
router12.post("/transcribe", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ message: "Voice typing limit reached. Try again in an hour." });
    }
    const { audio, mimeType = "audio/webm" } = req.body ?? {};
    if (!audio || typeof audio !== "string") {
      return res.status(400).json({ message: "No audio data provided." });
    }
    const hasWhisper = !!process.env.OPENAI_API_KEY;
    const hasDeepgram = !!process.env.DEEPGRAM_API_KEY;
    if (!hasWhisper && !hasDeepgram) {
      return res.status(503).json({
        message: "Server-side transcription is not configured.",
        code: "NO_API_KEY"
      });
    }
    const language = typeof req.query.language === "string" ? req.query.language : void 0;
    const audioBuffer = Buffer.from(audio, "base64");
    if (hasWhisper) {
      try {
        const text2 = await whisperTranscribe(audioBuffer, mimeType, language);
        console.log("[Transcribe] Used Whisper successfully");
        return res.json({ text: text2, engine: "whisper" });
      } catch (whisperErr) {
        console.warn("[Transcribe] Whisper failed, trying Deepgram fallback:", whisperErr?.message);
      }
    }
    if (hasDeepgram) {
      const text2 = await deepgramTranscribe(audioBuffer, mimeType, language);
      console.log("[Transcribe] Used Deepgram (fallback)");
      return res.json({ text: text2, engine: "deepgram" });
    }
    return res.status(503).json({
      message: "Server-side transcription is not configured.",
      code: "NO_API_KEY"
    });
  } catch (err) {
    console.error("[Transcribe] Error:", err?.message ?? err);
    res.status(500).json({ message: "Transcription failed. Please try again." });
  }
});
var transcribe_routes_default = router12;

// server/routes/invitations.routes.ts
import { Router as Router13 } from "express";
init_email();
import crypto4 from "crypto";
import bcrypt4 from "bcrypt";
var router13 = Router13();
router13.get("/invitations", authenticate, isTherapist, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const therapistId = req.user.id;
    const invitations = await storage.getClientInvitationsByTherapist(therapistId);
    return res.json(Array.isArray(invitations) ? invitations : []);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return res.status(500).json({ message: "Failed to fetch invitations" });
  }
});
router13.post("/invitations/:id/resend", authenticate, ensureAuthenticated, isTherapist, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid invitation ID" });
    const invitation = await storage.getClientInvitationById(id);
    if (!invitation) return res.status(404).json({ message: "Invitation not found" });
    if (invitation.therapistId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const plaintextToken = crypto4.randomBytes(32).toString("hex");
    const invitationTokenHash = await bcrypt4.hash(plaintextToken, 10);
    const baseUrl = getSafeBaseUrl(req);
    const inviteLink = `${baseUrl}/auth?invitation=true&email=${encodeURIComponent(invitation.email)}&therapistId=${req.user.id}&token=${plaintextToken}`;
    await storage.updateClientInvitationStatus(id, "email_sent");
    const therapistName = req.user.name || req.user.username;
    const emailSent = await sendClientInvitation(invitation.email, therapistName, inviteLink);
    res.json({ message: "Invitation resent successfully", emailSent });
  } catch (error) {
    console.error("Error resending invitation:", error);
    res.status(500).json({ message: "Failed to resend invitation" });
  }
});
var invitations_routes_default = router13;

// server/routes/index.ts
var router14 = Router14();
router14.use("/subscription-plans", subscriptions_routes_default);
router14.use("/subscription", subscriptions_routes_default);
router14.use("/auth", auth_routes_default);
router14.use("/users", users_routes_default);
router14.use("/users/:userId/emotions", emotions_routes_default);
router14.use("/users/:userId/thoughts", thoughts_routes_default);
router14.get("/thoughts/:id", authenticate, getSingleThoughtRecord);
router14.use("/users/:userId/goals", goals_routes_default);
router14.use("/", goals_routes_default);
router14.use("/", journal_routes_default);
router14.use("/", admin_routes_default);
router14.use("/notifications", notifications_routes_default);
router14.use("/", resources_routes_default);
router14.use("/", translate_routes_default);
router14.use("/", transcribe_routes_default);
router14.use("/", invitations_routes_default);
var routes_default = router14;

// server/routes.ts
async function registerRoutes(app2) {
  const cookieSecret = process.env.COOKIE_SECRET || "resilience-hub-cookie-secret";
  app2.use(cookieParser(cookieSecret));
  app2.use("/api", verifyOrigin);
  registerIntegrationRoutes(app2);
  registerReframeCoachRoutes(app2);
  app2.use("/api", routes_default);
  app2.get("/.well-known/microsoft-identity-association.json", (req, res) => {
    res.json({
      associatedApplications: [
        {
          applicationId: "ResilienceHub"
        }
      ]
    });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
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
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
}));

// server/vite.ts
import { nanoid as nanoid2 } from "nanoid";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
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
      const clientTemplate = path2.resolve(
        __dirname2,
        // ✅ make sure to use __dirname instead of import.meta.dirname
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
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
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    }
  }));
  app2.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({ limit: "25mb" }));
app.use(express2.urlencoded({ extended: false, limit: "25mb" }));
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
  res.header(
    "Content-Security-Policy-Report-Only",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      const logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
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
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0"
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
