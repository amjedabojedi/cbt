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
  resources, type Resource, type InsertResource,
  resourceAssignments, type ResourceAssignment, type InsertResourceAssignment,
  resourceFeedback, type ResourceFeedback, type InsertResourceFeedback,
  journalEntries, type JournalEntry, type InsertJournalEntry,
  notifications, type Notification, type InsertNotification,
  notificationPreferences, type NotificationPreferences, type InsertNotificationPreferences,
  journalComments, type JournalComment, type InsertJournalComment,
  sessions, type Session, type InsertSession,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  cognitiveDistortions, type CognitiveDistortion, type InsertCognitiveDistortion
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or, isNull, gte, gt } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";

// Define the storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getClients(therapistId: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  updateCurrentViewingClient(userId: number, clientId: number | null): Promise<User>;
  getCurrentViewingClient(userId: number): Promise<number | null>;
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  updateSubscriptionStatus(userId: number, status: string, endDate?: Date): Promise<User>;
  assignSubscriptionPlan(userId: number, planId: number): Promise<User>;
  countTherapistClients(therapistId: number): Promise<number>;
  deleteUser(userId: number, adminId?: number): Promise<void>;
  updateUserTherapist(userId: number, therapistId: number): Promise<User>;
  
  // System logs
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  
  // Admin statistics methods
  getAllEmotionRecords(): Promise<EmotionRecord[]>;
  getAllThoughtRecords(): Promise<ThoughtRecord[]>;
  getAllGoals(): Promise<Goal[]>;
  getAllResources(): Promise<Resource[]>;
  getAllResourceAssignments(): Promise<ResourceAssignment[]>;
  
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
  
  // Resources
  createResource(resource: InsertResource): Promise<Resource>;
  getResourceById(id: number): Promise<Resource | undefined>;
  getResourcesByCreator(userId: number): Promise<Resource[]>;
  getResourcesByCategory(category: string): Promise<Resource[]>;
  getAllResources(includeUnpublished?: boolean): Promise<Resource[]>;
  updateResource(id: number, data: Partial<InsertResource>): Promise<Resource>;
  deleteResource(id: number): Promise<void>;
  cloneResource(resourceId: number, userId: number): Promise<Resource>;
  
  // Resource assignments
  assignResourceToClient(assignment: InsertResourceAssignment): Promise<ResourceAssignment>;
  getResourceAssignmentById(id: number): Promise<ResourceAssignment | undefined>;
  getAssignmentsByClient(clientId: number): Promise<ResourceAssignment[]>;
  getAssignmentsByTherapist(therapistId: number): Promise<ResourceAssignment[]>;
  updateAssignmentStatus(id: number, status: string): Promise<ResourceAssignment>;
  deleteResourceAssignment(id: number): Promise<void>;
  
  // Resource feedback
  createResourceFeedback(feedback: InsertResourceFeedback): Promise<ResourceFeedback>;
  getResourceFeedbackByResource(resourceId: number): Promise<ResourceFeedback[]>;
  getResourceFeedbackByUser(userId: number): Promise<ResourceFeedback[]>;
  
  // Journal entries
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntryById(id: number): Promise<JournalEntry | undefined>;
  getJournalEntriesByUser(userId: number): Promise<JournalEntry[]>;
  updateJournalEntry(id: number, data: Partial<InsertJournalEntry>): Promise<JournalEntry>;
  deleteJournalEntry(id: number): Promise<void>;
  
  // Journal comments (therapist feedback)
  createJournalComment(comment: InsertJournalComment): Promise<JournalComment>;
  getJournalCommentsByEntry(journalEntryId: number): Promise<JournalComment[]>;
  updateJournalComment(id: number, data: Partial<InsertJournalComment>): Promise<JournalComment>;
  deleteJournalComment(id: number): Promise<void>;
  
  // Cognitive distortions
  createCognitiveDistortion(distortion: InsertCognitiveDistortion): Promise<CognitiveDistortion>;
  getCognitiveDistortions(): Promise<CognitiveDistortion[]>;
  getCognitiveDistortionById(id: number): Promise<CognitiveDistortion | undefined>;
  updateCognitiveDistortion(id: number, data: Partial<InsertCognitiveDistortion>): Promise<CognitiveDistortion>;
  deleteCognitiveDistortion(id: number): Promise<void>;
  
  // Integration: Journal entries <-> Thought records
  linkJournalToThoughtRecord(journalId: number, thoughtRecordId: number): Promise<void>;
  unlinkJournalFromThoughtRecord(journalId: number, thoughtRecordId: number): Promise<void>;
  getRelatedThoughtRecords(journalId: number): Promise<ThoughtRecord[]>;
  getRelatedJournalEntries(thoughtRecordId: number): Promise<JournalEntry[]>;
  
  // Notification management
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number, limit?: number): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<Notification[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  
  // Notification preferences
  getNotificationPreferences(userId: number): Promise<NotificationPreferences | undefined>;
  createNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences>;
  updateNotificationPreferences(userId: number, preferences: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences>;
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

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
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
  
  async updateUserTherapist(userId: number, therapistId: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ therapistId })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async updateUserStatus(userId: number, status: string): Promise<User> {
    console.log(`Updating user ${userId} status to ${status}`);
    
    const [updatedUser] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async removeClientFromTherapist(clientId: number, therapistId: number): Promise<User | null> {
    // First verify that this client belongs to this therapist
    const client = await this.getUser(clientId);
    
    if (!client || client.therapistId !== therapistId) {
      console.log(`Client ${clientId} does not belong to therapist ${therapistId}`);
      return null;
    }
    
    console.log(`Removing client ${clientId} from therapist ${therapistId}`);
    
    // Update the client to remove the therapist association
    const [updatedClient] = await db
      .update(users)
      .set({ therapistId: null })
      .where(eq(users.id, clientId))
      .returning();
    
    // Update any current viewing client references for this therapist
    await db
      .update(users)
      .set({ currentViewingClientId: null })
      .where(
        and(
          eq(users.id, therapistId),
          eq(users.currentViewingClientId, clientId)
        )
      );
    
    console.log(`Client ${clientId} removed from therapist ${therapistId}`);
    return updatedClient;
  }
    
  async deleteUser(userId: number, adminId?: number): Promise<void> {
    console.log(`Deleting user with ID: ${userId}`);
    
    // Fetch user details before deletion for logging
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Create a system log entry for this deletion
    if (adminId) {
      const admin = await this.getUser(adminId);
      await this.createSystemLog({
        action: "user_deleted",
        performedBy: adminId,
        details: {
          deletedUserId: userId,
          username: user.username,
          email: user.email,
          role: user.role,
          adminUsername: admin?.username || "Unknown"
        },
        ipAddress: null
      });
    }
    
    // If user is a therapist, notify all clients about their therapist being removed
    if (user.role === "therapist") {
      // Find all clients of this therapist
      const clients = await db
        .select()
        .from(users)
        .where(eq(users.therapistId, userId));
      
      // Create notifications for all affected clients
      for (const client of clients) {
        await this.createNotification({
          userId: client.id,
          title: "Therapist Account Removed",
          message: `Your therapist's account has been removed from the system. Please contact administration for more information.`,
          type: "system",
          read: false,
          link: null
        });
      }
    }
    
    // If user is a client with a therapist, notify the therapist
    if (user.role === "client" && user.therapistId) {
      await this.createNotification({
        userId: user.therapistId,
        title: "Client Account Removed",
        message: `Your client ${user.name} (${user.username}) has been removed from the system.`,
        type: "system",
        read: false,
        link: null
      });
    }
    
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
    
    // Delete journal entries and their associated comments
    const userJournals = await this.getJournalEntriesByUser(userId);
    for (const journal of userJournals) {
      await this.deleteJournalEntry(journal.id);
    }
    
    // Delete actions for this user
    await db.delete(actions).where(eq(actions.userId, userId));
    
    // Delete all notifications for this user
    await db.delete(notifications).where(eq(notifications.userId, userId));
    
    // Delete notification preferences for this user
    await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    
    // Delete resource assignments for this user
    await db.delete(resourceAssignments).where(eq(resourceAssignments.assignedTo, userId));
    
    // Delete resource feedback provided by this user
    await db.delete(resourceFeedback).where(eq(resourceFeedback.userId, userId));
    
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
  
  // System logs
  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const [newLog] = await db
      .insert(systemLogs)
      .values(log)
      .returning();
    
    return newLog;
  }
  
  // Admin statistics methods
  async getAllEmotionRecords(): Promise<EmotionRecord[]> {
    return db
      .select()
      .from(emotionRecords)
      .orderBy(desc(emotionRecords.timestamp));
  }
  
  async getAllThoughtRecords(): Promise<ThoughtRecord[]> {
    return db
      .select()
      .from(thoughtRecords)
      .orderBy(desc(thoughtRecords.createdAt));
  }
  
  async getAllGoals(): Promise<Goal[]> {
    return db
      .select()
      .from(goals)
      .orderBy(desc(goals.createdAt));
  }
  
  async getAllResources(): Promise<Resource[]> {
    return db
      .select()
      .from(resources)
      .orderBy(resources.title);
  }
  
  async getAllResourceAssignments(): Promise<ResourceAssignment[]> {
    return db
      .select()
      .from(resourceAssignments);
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
  
  // Resources
  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db
      .insert(resources)
      .values(resource)
      .returning();
    
    return newResource;
  }
  
  async getResourceById(id: number): Promise<Resource | undefined> {
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id));
    
    return resource;
  }
  
  async getResourcesByCreator(userId: number): Promise<Resource[]> {
    return db
      .select()
      .from(resources)
      .where(eq(resources.createdBy, userId))
      .orderBy(desc(resources.createdAt));
  }
  
  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return db
      .select()
      .from(resources)
      .where(eq(resources.category, category))
      .where(eq(resources.isPublished, true))
      .orderBy(desc(resources.createdAt));
  }
  
  async getAllResources(includeUnpublished: boolean = false): Promise<Resource[]> {
    if (includeUnpublished) {
      return db
        .select()
        .from(resources)
        .orderBy(desc(resources.createdAt));
    } else {
      return db
        .select()
        .from(resources)
        .where(eq(resources.isPublished, true))
        .orderBy(desc(resources.createdAt));
    }
  }
  
  async updateResource(id: number, data: Partial<InsertResource>): Promise<Resource> {
    // Set updatedAt to current timestamp
    const [updatedResource] = await db
      .update(resources)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(resources.id, id))
      .returning();
    
    return updatedResource;
  }
  
  async deleteResource(id: number): Promise<void> {
    // First delete all assignments and feedback for this resource
    await db
      .delete(resourceAssignments)
      .where(eq(resourceAssignments.resourceId, id));
    
    await db
      .delete(resourceFeedback)
      .where(eq(resourceFeedback.resourceId, id));
    
    // Then delete the resource
    await db
      .delete(resources)
      .where(eq(resources.id, id));
  }
  
  async cloneResource(resourceId: number, userId: number): Promise<Resource> {
    // Get the original resource
    const originalResource = await this.getResourceById(resourceId);
    
    if (!originalResource) {
      throw new Error("Resource not found");
    }
    
    // Create a new resource based on the original one, with the current user as creator
    const [clonedResource] = await db
      .insert(resources)
      .values({
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
      })
      .returning();
    
    return clonedResource;
  }
  
  // Resource assignments
  async assignResourceToClient(assignment: InsertResourceAssignment): Promise<ResourceAssignment> {
    const [newAssignment] = await db
      .insert(resourceAssignments)
      .values(assignment)
      .returning();
    
    return newAssignment;
  }
  
  async getResourceAssignmentById(id: number): Promise<ResourceAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(resourceAssignments)
      .where(eq(resourceAssignments.id, id));
    
    return assignment;
  }
  
  async getAssignmentsByClient(clientId: number): Promise<ResourceAssignment[]> {
    return db
      .select()
      .from(resourceAssignments)
      .where(eq(resourceAssignments.assignedTo, clientId))
      .orderBy(desc(resourceAssignments.assignedAt));
  }
  
  async getAssignmentsByTherapist(therapistId: number): Promise<ResourceAssignment[]> {
    return db
      .select()
      .from(resourceAssignments)
      .where(eq(resourceAssignments.assignedBy, therapistId))
      .orderBy(desc(resourceAssignments.assignedAt));
  }
  
  async updateAssignmentStatus(id: number, status: string): Promise<ResourceAssignment> {
    const completedAt = status === "completed" ? new Date() : null;
    
    const [updatedAssignment] = await db
      .update(resourceAssignments)
      .set({
        status,
        completedAt
      })
      .where(eq(resourceAssignments.id, id))
      .returning();
    
    return updatedAssignment;
  }
  
  async deleteResourceAssignment(id: number): Promise<void> {
    await db
      .delete(resourceAssignments)
      .where(eq(resourceAssignments.id, id));
  }
  
  // Resource feedback
  async createResourceFeedback(feedback: InsertResourceFeedback): Promise<ResourceFeedback> {
    const [newFeedback] = await db
      .insert(resourceFeedback)
      .values(feedback)
      .returning();
    
    return newFeedback;
  }
  
  async getResourceFeedbackByResource(resourceId: number): Promise<ResourceFeedback[]> {
    return db
      .select()
      .from(resourceFeedback)
      .where(eq(resourceFeedback.resourceId, resourceId))
      .orderBy(desc(resourceFeedback.createdAt));
  }
  
  async getResourceFeedbackByUser(userId: number): Promise<ResourceFeedback[]> {
    return db
      .select()
      .from(resourceFeedback)
      .where(eq(resourceFeedback.userId, userId))
      .orderBy(desc(resourceFeedback.createdAt));
  }
  
  // Journal entries implementation
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [newEntry] = await db
      .insert(journalEntries)
      .values(entry)
      .returning();
    
    return newEntry;
  }
  
  async getJournalEntryById(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.id, id));
    
    return entry;
  }
  
  async getJournalEntriesByUser(userId: number): Promise<JournalEntry[]> {
    return db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
  }
  
  async updateJournalEntry(id: number, data: Partial<InsertJournalEntry>): Promise<JournalEntry> {
    const [updatedEntry] = await db
      .update(journalEntries)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(journalEntries.id, id))
      .returning();
    
    return updatedEntry;
  }
  
  async deleteJournalEntry(id: number): Promise<void> {
    // First delete any comments associated with this journal entry
    await db
      .delete(journalComments)
      .where(eq(journalComments.journalEntryId, id));
    
    // Then delete the journal entry itself
    await db
      .delete(journalEntries)
      .where(eq(journalEntries.id, id));
  }
  
  // Journal comments implementation
  async createJournalComment(comment: InsertJournalComment): Promise<JournalComment> {
    const [newComment] = await db
      .insert(journalComments)
      .values(comment)
      .returning();
    
    return newComment;
  }
  
  async getJournalCommentsByEntry(journalEntryId: number): Promise<JournalComment[]> {
    // Join with users table to get user names for comments
    const results = await db
      .select({
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
          username: users.username,
        }
      })
      .from(journalComments)
      .leftJoin(users, eq(journalComments.userId, users.id))
      .where(eq(journalComments.journalEntryId, journalEntryId))
      .orderBy(journalComments.createdAt);
    
    return results;
  }
  
  async updateJournalComment(id: number, data: Partial<InsertJournalComment>): Promise<JournalComment> {
    const [updatedComment] = await db
      .update(journalComments)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(journalComments.id, id))
      .returning();
    
    return updatedComment;
  }
  
  async deleteJournalComment(id: number): Promise<void> {
    await db
      .delete(journalComments)
      .where(eq(journalComments.id, id));
  }
  
  // Cognitive distortions
  async createCognitiveDistortion(distortion: InsertCognitiveDistortion): Promise<CognitiveDistortion> {
    const [newDistortion] = await db
      .insert(cognitiveDistortions)
      .values(distortion)
      .returning();
    
    return newDistortion;
  }
  
  async getCognitiveDistortions(): Promise<CognitiveDistortion[]> {
    return db
      .select()
      .from(cognitiveDistortions)
      .orderBy(cognitiveDistortions.name);
  }
  
  async getCognitiveDistortionById(id: number): Promise<CognitiveDistortion | undefined> {
    const [distortion] = await db
      .select()
      .from(cognitiveDistortions)
      .where(eq(cognitiveDistortions.id, id));
    
    return distortion;
  }
  
  async updateCognitiveDistortion(id: number, data: Partial<InsertCognitiveDistortion>): Promise<CognitiveDistortion> {
    const [updatedDistortion] = await db
      .update(cognitiveDistortions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(cognitiveDistortions.id, id))
      .returning();
    
    return updatedDistortion;
  }
  
  async deleteCognitiveDistortion(id: number): Promise<void> {
    await db
      .delete(cognitiveDistortions)
      .where(eq(cognitiveDistortions.id, id));
  }
  
  // Integration: Journal entries <-> Thought records
  async linkJournalToThoughtRecord(journalId: number, thoughtRecordId: number): Promise<void> {
    // Get current journal entry
    const journal = await this.getJournalEntryById(journalId);
    if (!journal) {
      throw new Error(`Journal entry with ID ${journalId} not found`);
    }
    
    // Get current thought record
    const thoughtRecord = await this.getThoughtRecordById(thoughtRecordId);
    if (!thoughtRecord) {
      throw new Error(`Thought record with ID ${thoughtRecordId} not found`);
    }
    
    // Current related thought record IDs (handling null case)
    const currentThoughtRecordIds = journal.relatedThoughtRecordIds || [];
    
    // Only add if not already linked
    if (!currentThoughtRecordIds.includes(thoughtRecordId)) {
      // Update journal with link to thought record
      await db.update(journalEntries)
        .set({
          relatedThoughtRecordIds: [...currentThoughtRecordIds, thoughtRecordId],
          updatedAt: new Date()
        })
        .where(eq(journalEntries.id, journalId));
    }
    
    // Current related journal entry IDs (handling null case)
    const currentJournalEntryIds = thoughtRecord.relatedJournalEntryIds || [];
    
    // Only add if not already linked
    if (!currentJournalEntryIds.includes(journalId)) {
      // Update thought record with link to journal
      await db.update(thoughtRecords)
        .set({
          relatedJournalEntryIds: [...currentJournalEntryIds, journalId]
        })
        .where(eq(thoughtRecords.id, thoughtRecordId));
    }
  }
  
  async unlinkJournalFromThoughtRecord(journalId: number, thoughtRecordId: number): Promise<void> {
    // Get current journal entry
    const journal = await this.getJournalEntryById(journalId);
    if (!journal) {
      throw new Error(`Journal entry with ID ${journalId} not found`);
    }
    
    // Get current thought record
    const thoughtRecord = await this.getThoughtRecordById(thoughtRecordId);
    if (!thoughtRecord) {
      throw new Error(`Thought record with ID ${thoughtRecordId} not found`);
    }
    
    // Current related thought record IDs (handling null case)
    const currentThoughtRecordIds = journal.relatedThoughtRecordIds || [];
    
    // Remove the thought record ID
    if (currentThoughtRecordIds.includes(thoughtRecordId)) {
      await db.update(journalEntries)
        .set({
          relatedThoughtRecordIds: currentThoughtRecordIds.filter(id => id !== thoughtRecordId),
          updatedAt: new Date()
        })
        .where(eq(journalEntries.id, journalId));
    }
    
    // Current related journal entry IDs (handling null case)
    const currentJournalEntryIds = thoughtRecord.relatedJournalEntryIds || [];
    
    // Remove the journal entry ID
    if (currentJournalEntryIds.includes(journalId)) {
      await db.update(thoughtRecords)
        .set({
          relatedJournalEntryIds: currentJournalEntryIds.filter(id => id !== journalId)
        })
        .where(eq(thoughtRecords.id, thoughtRecordId));
    }
  }
  
  async getRelatedThoughtRecords(journalId: number): Promise<ThoughtRecord[]> {
    const journal = await this.getJournalEntryById(journalId);
    if (!journal || !journal.relatedThoughtRecordIds || journal.relatedThoughtRecordIds.length === 0) {
      return [];
    }
    
    // Get all thought records that are linked to this journal
    const relatedRecords: ThoughtRecord[] = [];
    
    for (const recordId of journal.relatedThoughtRecordIds) {
      const record = await this.getThoughtRecordById(recordId);
      if (record) {
        relatedRecords.push(record);
      }
    }
    
    return relatedRecords;
  }
  
  async getRelatedJournalEntries(thoughtRecordId: number): Promise<JournalEntry[]> {
    const thoughtRecord = await this.getThoughtRecordById(thoughtRecordId);
    if (!thoughtRecord || !thoughtRecord.relatedJournalEntryIds || thoughtRecord.relatedJournalEntryIds.length === 0) {
      return [];
    }
    
    // Get all journal entries that are linked to this thought record
    const relatedEntries: JournalEntry[] = [];
    
    for (const entryId of thoughtRecord.relatedJournalEntryIds) {
      const entry = await this.getJournalEntryById(entryId);
      if (entry) {
        relatedEntries.push(entry);
      }
    }
    
    return relatedEntries;
  }
  
  // Notification management
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    
    return newNotification;
  }
  
  async getNotificationsByUser(userId: number, limit: number = 20): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }
  
  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .where(eq(notifications.isRead, false))
      .where(
        or(
          isNull(notifications.expiresAt),
          gte(notifications.expiresAt, new Date())
        )
      )
      .orderBy(desc(notifications.createdAt));
  }
  
  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    
    return notification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
  
  async deleteNotification(id: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }
  
  // Notification preferences
  async getNotificationPreferences(userId: number): Promise<NotificationPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    
    return preferences;
  }
  
  async createNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const [newPreferences] = await db
      .insert(notificationPreferences)
      .values(preferences)
      .returning();
    
    return newPreferences;
  }
  
  async updateNotificationPreferences(userId: number, preferences: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences> {
    const [updatedPreferences] = await db
      .update(notificationPreferences)
      .set({
        ...preferences,
        updatedAt: new Date()
      })
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    
    return updatedPreferences;
  }
}

export const storage = new DatabaseStorage();