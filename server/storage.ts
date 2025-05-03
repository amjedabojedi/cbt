import { 
  users, type User, type InsertUser,
  emotionRecords, type EmotionRecord, type InsertEmotionRecord,
  thoughtRecords, type ThoughtRecord, type InsertThoughtRecord,
  protectiveFactors, type ProtectiveFactor, type InsertProtectiveFactor,
  protectiveFactorUsage, type ProtectiveFactorUsage, type InsertProtectiveFactorUsage,
  copingStrategies, type CopingStrategy, type InsertCopingStrategy,
  copingStrategyUsage, type CopingStrategyUsage, type InsertCopingStrategyUsage,
  goals, type Goal, type InsertGoal,
  goalMilestones, type GoalMilestone, type InsertGoalMilestone,
  actions, type Action, type InsertAction,
  sessions, type Session, type InsertSession,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or, isNull, gte } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";

// Define the storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getClients(therapistId: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  updateCurrentViewingClient(userId: number, clientId: number | null): Promise<User>;
  getCurrentViewingClient(userId: number): Promise<number | null>;
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  updateSubscriptionStatus(userId: number, status: string, endDate?: Date): Promise<User>;
  assignSubscriptionPlan(userId: number, planId: number): Promise<User>;
  countTherapistClients(therapistId: number): Promise<number>;
  deleteUser(userId: number): Promise<void>;
  
  // Subscription plans management
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getSubscriptionPlans(activeOnly?: boolean): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined>;
  updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  getDefaultSubscriptionPlan(): Promise<SubscriptionPlan | undefined>;
  setDefaultSubscriptionPlan(id: number): Promise<SubscriptionPlan>;
  deactivateSubscriptionPlan(id: number): Promise<SubscriptionPlan>;
  
  // Session management
  createSession(userId: number): Promise<Session>;
  getSessionById(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  
  // Emotion records
  createEmotionRecord(record: InsertEmotionRecord): Promise<EmotionRecord>;
  getEmotionRecordsByUser(userId: number): Promise<EmotionRecord[]>;
  getEmotionRecordById(id: number): Promise<EmotionRecord | undefined>;
  deleteEmotionRecord(id: number): Promise<void>;
  
  // Thought records
  createThoughtRecord(record: InsertThoughtRecord): Promise<ThoughtRecord>;
  getThoughtRecordsByUser(userId: number): Promise<ThoughtRecord[]>;
  getThoughtRecordById(id: number): Promise<ThoughtRecord | undefined>;
  getThoughtRecordsByEmotionId(emotionRecordId: number): Promise<ThoughtRecord[]>;
  deleteThoughtRecord(id: number): Promise<void>;
  
  // Protective factors
  createProtectiveFactor(factor: InsertProtectiveFactor): Promise<ProtectiveFactor>;
  getProtectiveFactorsByUser(userId: number, includeGlobal?: boolean): Promise<ProtectiveFactor[]>;
  getProtectiveFactorById(id: number): Promise<ProtectiveFactor | undefined>;
  updateProtectiveFactor(id: number, data: Partial<InsertProtectiveFactor>): Promise<ProtectiveFactor>;
  deleteProtectiveFactor(id: number): Promise<void>;
  
  // Protective factor usage
  addProtectiveFactorUsage(usage: InsertProtectiveFactorUsage): Promise<ProtectiveFactorUsage>;
  
  // Coping strategies
  createCopingStrategy(strategy: InsertCopingStrategy): Promise<CopingStrategy>;
  getCopingStrategiesByUser(userId: number, includeGlobal?: boolean): Promise<CopingStrategy[]>;
  getCopingStrategyById(id: number): Promise<CopingStrategy | undefined>;
  updateCopingStrategy(id: number, data: Partial<InsertCopingStrategy>): Promise<CopingStrategy>;
  deleteCopingStrategy(id: number): Promise<void>;
  
  // Coping strategy usage
  addCopingStrategyUsage(usage: InsertCopingStrategyUsage): Promise<CopingStrategyUsage>;
  
  // Goals
  createGoal(goal: InsertGoal): Promise<Goal>;
  getGoalsByUser(userId: number): Promise<Goal[]>;
  updateGoalStatus(id: number, status: string, therapistComments?: string): Promise<Goal>;
  
  // Goal milestones
  createGoalMilestone(milestone: InsertGoalMilestone): Promise<GoalMilestone>;
  getGoalMilestonesByGoal(goalId: number): Promise<GoalMilestone[]>;
  updateGoalMilestoneCompletion(id: number, isCompleted: boolean): Promise<GoalMilestone>;
  
  // Actions
  createAction(action: InsertAction): Promise<Action>;
  getActionsByUser(userId: number): Promise<Action[]>;
  updateActionCompletion(id: number, isCompleted: boolean, moodAfter?: number, reflection?: string): Promise<Action>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword
      })
      .returning();
    
    return user;
  }

  async getClients(therapistId: number): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.therapistId, therapistId))
      .orderBy(users.name);
  }
  
  async getAllUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .orderBy(users.name);
  }
  
  async updateCurrentViewingClient(userId: number, clientId: number | null): Promise<User> {
    console.log(`Storing current viewing client: User ${userId} is viewing client ${clientId}`);
    
    const [updatedUser] = await db
      .update(users)
      .set({ currentViewingClientId: clientId })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async getCurrentViewingClient(userId: number): Promise<number | null> {
    const user = await this.getUser(userId);
    
    console.log(`Retrieved current viewing client for user ${userId}:`, user?.currentViewingClientId);
    
    return user?.currentViewingClientId || null;
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.stripeCustomerId,
        stripeSubscriptionId: stripeInfo.stripeSubscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async updateSubscriptionStatus(userId: number, status: string, endDate?: Date): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        subscriptionStatus: status,
        subscriptionEndDate: endDate
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async assignSubscriptionPlan(userId: number, planId: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        subscriptionPlanId: planId
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async countTherapistClients(therapistId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.therapistId, therapistId));
    
    return parseInt(result[0].count as string);
  }
  
  async deleteUser(userId: number): Promise<void> {
    console.log(`Deleting user with ID: ${userId}`);
    
    // First, delete all sessions for this user
    await db
      .delete(sessions)
      .where(eq(sessions.userId, userId));
    
    // Delete emotion records and their related records (cascade)
    const userEmotionRecords = await this.getEmotionRecordsByUser(userId);
    for (const record of userEmotionRecords) {
      await this.deleteEmotionRecord(record.id);
    }
    
    // Delete protective factors for this user
    const userProtectiveFactors = await this.getProtectiveFactorsByUser(userId, false);
    for (const factor of userProtectiveFactors) {
      await this.deleteProtectiveFactor(factor.id);
    }
    
    // Delete coping strategies for this user
    const userCopingStrategies = await this.getCopingStrategiesByUser(userId, false);
    for (const strategy of userCopingStrategies) {
      await this.deleteCopingStrategy(strategy.id);
    }
    
    // Delete goals for this user
    const userGoals = await this.getGoalsByUser(userId);
    for (const goal of userGoals) {
      // Delete goal milestones for this goal
      const milestones = await this.getGoalMilestonesByGoal(goal.id);
      for (const milestone of milestones) {
        await db.delete(goalMilestones).where(eq(goalMilestones.id, milestone.id));
      }
      
      // Delete goal
      await db.delete(goals).where(eq(goals.id, goal.id));
    }
    
    // Delete actions for this user
    await db.delete(actions).where(eq(actions.userId, userId));
    
    // Update therapist references for clients of this user (if the user is a therapist)
    await db
      .update(users)
      .set({ therapistId: null })
      .where(eq(users.therapistId, userId));
    
    // Update current viewing client references
    await db
      .update(users)
      .set({ currentViewingClientId: null })
      .where(eq(users.currentViewingClientId, userId));
    
    // Finally, delete the user
    await db.delete(users).where(eq(users.id, userId));
    
    console.log(`User ${userId} and all related records deleted successfully`);
  }
  
  // Subscription plans management
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    
    return newPlan;
  }
  
  async getSubscriptionPlans(activeOnly: boolean = true): Promise<SubscriptionPlan[]> {
    if (activeOnly) {
      return db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.price);
    } else {
      return db
        .select()
        .from(subscriptionPlans)
        .orderBy(subscriptionPlans.price);
    }
  }
  
  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    
    return plan;
  }
  
  async updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set(data)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    
    return updatedPlan;
  }
  
  async getDefaultSubscriptionPlan(): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isDefault, true))
      .where(eq(subscriptionPlans.isActive, true));
    
    return plan;
  }
  
  async setDefaultSubscriptionPlan(id: number): Promise<SubscriptionPlan> {
    // First clear default from any existing default plans
    await db
      .update(subscriptionPlans)
      .set({ isDefault: false })
      .where(eq(subscriptionPlans.isDefault, true));
    
    // Then set the new default plan
    const [defaultPlan] = await db
      .update(subscriptionPlans)
      .set({ isDefault: true })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    
    return defaultPlan;
  }
  
  async deactivateSubscriptionPlan(id: number): Promise<SubscriptionPlan> {
    const [deactivatedPlan] = await db
      .update(subscriptionPlans)
      .set({ isActive: false })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    
    return deactivatedPlan;
  }

  // Session management
  async createSession(userId: number): Promise<Session> {
    const sessionId = nanoid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Sessions expire in 7 days
    
    const [session] = await db
      .insert(sessions)
      .values({
        id: sessionId,
        userId,
        expiresAt
      })
      .returning();
    
    return session;
  }

  async getSessionById(sessionId: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));
    
    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId));
  }

  // Emotion records
  async createEmotionRecord(record: InsertEmotionRecord): Promise<EmotionRecord> {
    const [emotionRecord] = await db
      .insert(emotionRecords)
      .values(record)
      .returning();
    
    return emotionRecord;
  }

  async getEmotionRecordsByUser(userId: number): Promise<EmotionRecord[]> {
    return db
      .select()
      .from(emotionRecords)
      .where(eq(emotionRecords.userId, userId))
      .orderBy(desc(emotionRecords.timestamp));
  }

  async getEmotionRecordById(id: number): Promise<EmotionRecord | undefined> {
    const [record] = await db
      .select()
      .from(emotionRecords)
      .where(eq(emotionRecords.id, id));
    
    return record;
  }
  
  async deleteEmotionRecord(id: number): Promise<void> {
    // Get all associated thought records first
    const relatedThoughts = await this.getThoughtRecordsByEmotionId(id);
    
    // Delete each related thought record (which will handle their dependencies)
    for (const thought of relatedThoughts) {
      await this.deleteThoughtRecord(thought.id);
    }
    
    // Finally delete the emotion record itself
    await db
      .delete(emotionRecords)
      .where(eq(emotionRecords.id, id));
  }

  // Thought records
  async createThoughtRecord(record: InsertThoughtRecord): Promise<ThoughtRecord> {
    const [thoughtRecord] = await db
      .insert(thoughtRecords)
      .values(record)
      .returning();
    
    return thoughtRecord;
  }

  async getThoughtRecordsByUser(userId: number): Promise<ThoughtRecord[]> {
    return db
      .select()
      .from(thoughtRecords)
      .where(eq(thoughtRecords.userId, userId))
      .orderBy(desc(thoughtRecords.createdAt));
  }

  async getThoughtRecordById(id: number): Promise<ThoughtRecord | undefined> {
    const [record] = await db
      .select()
      .from(thoughtRecords)
      .where(eq(thoughtRecords.id, id));
    
    return record;
  }
  
  async getThoughtRecordsByEmotionId(emotionRecordId: number): Promise<ThoughtRecord[]> {
    return db
      .select()
      .from(thoughtRecords)
      .where(eq(thoughtRecords.emotionRecordId, emotionRecordId))
      .orderBy(desc(thoughtRecords.createdAt));
  }
  
  async deleteThoughtRecord(id: number): Promise<void> {
    // First delete related coping strategy usage records
    await db
      .delete(copingStrategyUsage)
      .where(eq(copingStrategyUsage.thoughtRecordId, id));
    
    // Then delete related protective factor usage records
    await db
      .delete(protectiveFactorUsage)
      .where(eq(protectiveFactorUsage.thoughtRecordId, id));
    
    // Finally delete the thought record
    await db
      .delete(thoughtRecords)
      .where(eq(thoughtRecords.id, id));
  }

  // Protective factors
  async createProtectiveFactor(factor: InsertProtectiveFactor): Promise<ProtectiveFactor> {
    const [protectiveFactor] = await db
      .insert(protectiveFactors)
      .values(factor)
      .returning();
    
    return protectiveFactor;
  }

  async getProtectiveFactorsByUser(userId: number, includeGlobal: boolean = true): Promise<ProtectiveFactor[]> {
    // First get the user to check if they have a therapist
    const user = await this.getUser(userId);
    
    if (includeGlobal) {
      let conditions = [
        eq(protectiveFactors.userId, userId),
        eq(protectiveFactors.isGlobal, true)
      ];
      
      // If user has a therapist, include the therapist's factors too
      if (user && user.therapistId) {
        conditions.push(eq(protectiveFactors.userId, user.therapistId));
      }
      
      return db
        .select()
        .from(protectiveFactors)
        .where(or(...conditions))
        .orderBy(protectiveFactors.name);
    } else {
      return db
        .select()
        .from(protectiveFactors)
        .where(eq(protectiveFactors.userId, userId))
        .orderBy(protectiveFactors.name);
    }
  }
  
  async getProtectiveFactorById(id: number): Promise<ProtectiveFactor | undefined> {
    const [factor] = await db
      .select()
      .from(protectiveFactors)
      .where(eq(protectiveFactors.id, id));
    
    return factor;
  }
  
  async updateProtectiveFactor(id: number, data: Partial<InsertProtectiveFactor>): Promise<ProtectiveFactor> {
    const [updatedFactor] = await db
      .update(protectiveFactors)
      .set(data)
      .where(eq(protectiveFactors.id, id))
      .returning();
    
    return updatedFactor;
  }

  async deleteProtectiveFactor(id: number): Promise<void> {
    // First delete any usage records
    await db
      .delete(protectiveFactorUsage)
      .where(eq(protectiveFactorUsage.protectiveFactorId, id));
      
    // Then delete the factor itself
    await db
      .delete(protectiveFactors)
      .where(eq(protectiveFactors.id, id));
  }

  // Protective factor usage
  async addProtectiveFactorUsage(usage: InsertProtectiveFactorUsage): Promise<ProtectiveFactorUsage> {
    const [factorUsage] = await db
      .insert(protectiveFactorUsage)
      .values(usage)
      .returning();
    
    return factorUsage;
  }

  // Coping strategies
  async createCopingStrategy(strategy: InsertCopingStrategy): Promise<CopingStrategy> {
    const [copingStrategy] = await db
      .insert(copingStrategies)
      .values(strategy)
      .returning();
    
    return copingStrategy;
  }

  async getCopingStrategiesByUser(userId: number, includeGlobal: boolean = true): Promise<CopingStrategy[]> {
    // First get the user to check if they have a therapist
    const user = await this.getUser(userId);
    
    if (includeGlobal) {
      let conditions = [
        eq(copingStrategies.userId, userId),
        eq(copingStrategies.isGlobal, true)
      ];
      
      // If user has a therapist, include the therapist's coping strategies too
      if (user && user.therapistId) {
        conditions.push(eq(copingStrategies.userId, user.therapistId));
      }
      
      return db
        .select()
        .from(copingStrategies)
        .where(or(...conditions))
        .orderBy(copingStrategies.name);
    } else {
      return db
        .select()
        .from(copingStrategies)
        .where(eq(copingStrategies.userId, userId))
        .orderBy(copingStrategies.name);
    }
  }
  
  async getCopingStrategyById(id: number): Promise<CopingStrategy | undefined> {
    const [strategy] = await db
      .select()
      .from(copingStrategies)
      .where(eq(copingStrategies.id, id));
    
    return strategy;
  }
  
  async updateCopingStrategy(id: number, data: Partial<InsertCopingStrategy>): Promise<CopingStrategy> {
    const [updatedStrategy] = await db
      .update(copingStrategies)
      .set(data)
      .where(eq(copingStrategies.id, id))
      .returning();
    
    return updatedStrategy;
  }

  async deleteCopingStrategy(id: number): Promise<void> {
    // First delete any usage records
    await db
      .delete(copingStrategyUsage)
      .where(eq(copingStrategyUsage.copingStrategyId, id));
      
    // Then delete the strategy itself
    await db
      .delete(copingStrategies)
      .where(eq(copingStrategies.id, id));
  }

  // Coping strategy usage
  async addCopingStrategyUsage(usage: InsertCopingStrategyUsage): Promise<CopingStrategyUsage> {
    const [strategyUsage] = await db
      .insert(copingStrategyUsage)
      .values(usage)
      .returning();
    
    return strategyUsage;
  }

  // Goals
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db
      .insert(goals)
      .values(goal)
      .returning();
    
    return newGoal;
  }

  async getGoalsByUser(userId: number): Promise<Goal[]> {
    return db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
  }

  async updateGoalStatus(id: number, status: string, therapistComments?: string): Promise<Goal> {
    const updateData: Partial<Goal> = { status: status as any };
    if (therapistComments) {
      updateData.therapistComments = therapistComments;
    }
    
    const [updatedGoal] = await db
      .update(goals)
      .set(updateData)
      .where(eq(goals.id, id))
      .returning();
    
    return updatedGoal;
  }

  // Goal milestones
  async createGoalMilestone(milestone: InsertGoalMilestone): Promise<GoalMilestone> {
    const [newMilestone] = await db
      .insert(goalMilestones)
      .values(milestone)
      .returning();
    
    return newMilestone;
  }

  async getGoalMilestonesByGoal(goalId: number): Promise<GoalMilestone[]> {
    return db
      .select()
      .from(goalMilestones)
      .where(eq(goalMilestones.goalId, goalId))
      .orderBy(goalMilestones.dueDate);
  }

  async updateGoalMilestoneCompletion(id: number, isCompleted: boolean): Promise<GoalMilestone> {
    const [updatedMilestone] = await db
      .update(goalMilestones)
      .set({ isCompleted })
      .where(eq(goalMilestones.id, id))
      .returning();
    
    return updatedMilestone;
  }

  // Actions
  async createAction(action: InsertAction): Promise<Action> {
    const [newAction] = await db
      .insert(actions)
      .values(action)
      .returning();
    
    return newAction;
  }

  async getActionsByUser(userId: number): Promise<Action[]> {
    return db
      .select()
      .from(actions)
      .where(eq(actions.userId, userId))
      .orderBy(desc(actions.createdAt));
  }

  async updateActionCompletion(id: number, isCompleted: boolean, moodAfter?: number, reflection?: string): Promise<Action> {
    const updateData: Partial<Action> = {
      isCompleted,
      completedAt: isCompleted ? new Date() : null
    };
    
    if (moodAfter !== undefined) {
      updateData.moodAfter = moodAfter;
    }
    
    if (reflection) {
      updateData.reflection = reflection;
    }
    
    const [updatedAction] = await db
      .update(actions)
      .set(updateData)
      .where(eq(actions.id, id))
      .returning();
    
    return updatedAction;
  }
}

export const storage = new DatabaseStorage();