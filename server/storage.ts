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
  sessions, type Session, type InsertSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or, isNull } from "drizzle-orm";
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
  deleteProtectiveFactor(id: number): Promise<void>;
  
  // Protective factor usage
  addProtectiveFactorUsage(usage: InsertProtectiveFactorUsage): Promise<ProtectiveFactorUsage>;
  
  // Coping strategies
  createCopingStrategy(strategy: InsertCopingStrategy): Promise<CopingStrategy>;
  getCopingStrategiesByUser(userId: number, includeGlobal?: boolean): Promise<CopingStrategy[]>;
  getCopingStrategyById(id: number): Promise<CopingStrategy | undefined>;
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
    if (includeGlobal) {
      return db
        .select()
        .from(protectiveFactors)
        .where(or(
          eq(protectiveFactors.userId, userId),
          eq(protectiveFactors.isGlobal, true)
        ))
        .orderBy(protectiveFactors.name);
    } else {
      return db
        .select()
        .from(protectiveFactors)
        .where(eq(protectiveFactors.userId, userId))
        .orderBy(protectiveFactors.name);
    }
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
    if (includeGlobal) {
      return db
        .select()
        .from(copingStrategies)
        .where(or(
          eq(copingStrategies.userId, userId),
          eq(copingStrategies.isGlobal, true)
        ))
        .orderBy(copingStrategies.name);
    } else {
      return db
        .select()
        .from(copingStrategies)
        .where(eq(copingStrategies.userId, userId))
        .orderBy(copingStrategies.name);
    }
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
    const updateData: Partial<Goal> = { status };
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
