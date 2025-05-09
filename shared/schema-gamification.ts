import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Achievements table for gamification
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  type: text("type", { enum: ["streak", "count", "milestone", "diversity"] }).notNull(),
  category: text("category", { 
    enum: ["emotion_tracking", "thought_records", "journaling", "goals", "engagement"] 
  }).notNull(),
  threshold: integer("threshold").notNull(),
  rewardPoints: integer("reward_points").default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User achievements table to track earned achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  seenByUser: boolean("seen_by_user").default(false).notNull(),
});

// User stats table for gamification
export const userStats = pgTable("user_stats", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastActivityDate: timestamp("last_activity_date"),
  totalPoints: integer("total_points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  emotionTrackingCount: integer("emotion_tracking_count").default(0).notNull(),
  thoughtRecordCount: integer("thought_record_count").default(0).notNull(),
  journalEntryCount: integer("journal_entry_count").default(0).notNull(),
  completedGoalsCount: integer("completed_goals_count").default(0).notNull(),
  emotionDiversityScore: integer("emotion_diversity_score").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Progress milestones that unlock new features or content
export const progressMilestones = pgTable("progress_milestones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  requiredLevel: integer("required_level").notNull(),
  requiredPoints: integer("required_points").notNull(),
  unlocksFeature: text("unlocks_feature"),
  unlockContent: jsonb("unlock_content").$type<{ type: string, id: number, data: any }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User milestones to track which milestones users have reached
export const userMilestones = pgTable("user_milestones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  milestoneId: integer("milestone_id").notNull().references(() => progressMilestones.id),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  seenByUser: boolean("seen_by_user").default(false).notNull(),
});

// Daily challenges to encourage engagement
export const dailyChallenges = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category", { 
    enum: ["emotion_tracking", "thought_records", "journaling", "goals", "reflection"] 
  }).notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  pointReward: integer("point_reward").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User challenges to track progress on daily challenges
export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id").notNull().references(() => dailyChallenges.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  status: text("status", { enum: ["assigned", "in_progress", "completed", "expired"] }).default("assigned").notNull(),
});

// Insert schemas
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, createdAt: true });
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, earnedAt: true });
export const insertUserStatsSchema = createInsertSchema(userStats).omit({ createdAt: true, updatedAt: true });
export const insertProgressMilestoneSchema = createInsertSchema(progressMilestones).omit({ id: true, createdAt: true });
export const insertUserMilestoneSchema = createInsertSchema(userMilestones).omit({ id: true, unlockedAt: true });
export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges).omit({ id: true, createdAt: true });
export const insertUserChallengeSchema = createInsertSchema(userChallenges).omit({ id: true, assignedAt: true, completedAt: true });

// Types
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;

export type ProgressMilestone = typeof progressMilestones.$inferSelect;
export type InsertProgressMilestone = z.infer<typeof insertProgressMilestoneSchema>;

export type UserMilestone = typeof userMilestones.$inferSelect;
export type InsertUserMilestone = z.infer<typeof insertUserMilestoneSchema>;

export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type InsertDailyChallenge = z.infer<typeof insertDailyChallengeSchema>;

export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;