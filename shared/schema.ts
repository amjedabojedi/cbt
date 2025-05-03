import { pgTable, text, serial, integer, jsonb, timestamp, boolean, foreignKey, date } from "drizzle-orm/pg-core";
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
  // Subscription related fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionPlanId: integer("subscription_plan_id").references(() => subscriptionPlans.id),
  subscriptionStatus: text("subscription_status", {
    enum: ["trial", "active", "past_due", "canceled", "unpaid"]
  }),
  subscriptionEndDate: date("subscription_end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Emotion records
export const emotionRecords = pgTable("emotion_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  coreEmotion: text("core_emotion").notNull(),
  primaryEmotion: text("primary_emotion").notNull(),
  tertiaryEmotion: text("tertiary_emotion").notNull(),
  intensity: integer("intensity").notNull(),
  situation: text("situation").notNull(),
  location: text("location"),
  company: text("company"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// Sessions for users
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
});

// Define all the insert schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
// For emotion records, we need a custom schema to handle the timestamp correctly
export const insertEmotionRecordSchema = z.object({
  userId: z.number(),
  coreEmotion: z.string(),
  primaryEmotion: z.string(),
  tertiaryEmotion: z.string(),
  intensity: z.number(),
  situation: z.string(),
  location: z.string().optional(),
  company: z.string().optional(),
  // Accept any valid date format (string or Date object)
  timestamp: z.any()
});
export const insertThoughtRecordSchema = createInsertSchema(thoughtRecords).omit({ id: true, createdAt: true });
export const insertProtectiveFactorSchema = createInsertSchema(protectiveFactors).omit({ id: true, createdAt: true });
export const insertProtectiveFactorUsageSchema = createInsertSchema(protectiveFactorUsage).omit({ id: true, createdAt: true });
export const insertCopingStrategySchema = createInsertSchema(copingStrategies).omit({ id: true, createdAt: true });
export const insertCopingStrategyUsageSchema = createInsertSchema(copingStrategyUsage).omit({ id: true, createdAt: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGoalMilestoneSchema = createInsertSchema(goalMilestones).omit({ id: true, createdAt: true });
export const insertActionSchema = createInsertSchema(actions).omit({ id: true, createdAt: true, completedAt: true });
export const insertSessionSchema = createInsertSchema(sessions);

// Define all the types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type EmotionRecord = typeof emotionRecords.$inferSelect;
export type InsertEmotionRecord = z.infer<typeof insertEmotionRecordSchema>;

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

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
