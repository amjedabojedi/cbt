import { 
  type User, type InsertUser,
  type EmotionRecord, type InsertEmotionRecord,
  type ThoughtRecord, type InsertThoughtRecord,
  type ProtectiveFactor, type InsertProtectiveFactor,
  type ProtectiveFactorUsage, type InsertProtectiveFactorUsage,
  type CopingStrategy, type InsertCopingStrategy,
  type CopingStrategyUsage, type InsertCopingStrategyUsage,
  type Goal, type InsertGoal,
  type GoalMilestone, type InsertGoalMilestone,
  type Action, type InsertAction,
  type Resource, type InsertResource,
  type ResourceAssignment, type InsertResourceAssignment,
  type ResourceFeedback, type InsertResourceFeedback,
  type JournalEntry, type InsertJournalEntry,
  type Notification, type InsertNotification,
  type NotificationPreferences, type InsertNotificationPreferences,
  type JournalComment, type InsertJournalComment,
  type Session,
  type SubscriptionPlan, type InsertSubscriptionPlan,
  type CognitiveDistortion, type InsertCognitiveDistortion,
  type SystemLog, type InsertSystemLog,
  type ClientInvitation, type InsertClientInvitation,
  type AiRecommendation, type InsertAiRecommendation,
  type EngagementSettings, type InsertEngagementSettings
} from "@shared/schema";

import { UsersRepository } from "./repositories/users.repository";
import { TherapyRepository } from "./repositories/therapy.repository";
import { GoalsRepository } from "./repositories/goals.repository";
import { JournalRepository } from "./repositories/journal.repository";
import { ResourcesRepository } from "./repositories/resources.repository";
import { BillingRepository } from "./repositories/billing.repository";
import { NotificationsRepository } from "./repositories/notifications.repository";
import { AdminRepository } from "./repositories/admin.repository";

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
  getClientByIdAndTherapist(clientId: number, therapistId: number): Promise<User | undefined>;
  updateCurrentViewingClient(userId: number, clientId: number | null): Promise<User>;
  getCurrentViewingClient(userId: number): Promise<number | null>;
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  updateSubscriptionStatus(userId: number, status: string, endDate?: Date): Promise<User>;
  assignSubscriptionPlan(userId: number, planId: number): Promise<User>;
  countTherapistClients(therapistId: number): Promise<number>;
  deleteUser(userId: number, adminId?: number): Promise<void>;
  updateUserTherapist(userId: number, therapistId: number): Promise<User>;

  // Additional methods needed for our fixes
  getClientsByTherapistId(therapistId: number): Promise<User[]>;
  getClient(clientId: number): Promise<User | undefined>;
  getSession(sessionId: string): Promise<{ userId: number } | null>;

  // System logs
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;

  // Admin statistics methods
  getAllEmotionRecords(): Promise<EmotionRecord[]>;
  getAllThoughtRecords(): Promise<ThoughtRecord[]>;
  getAllGoals(): Promise<Goal[]>;

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
  clearAllNotifications(userId: number): Promise<void>;

  // Notification preferences
  getNotificationPreferences(userId: number): Promise<NotificationPreferences | undefined>;
  createNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences>;
  updateNotificationPreferences(userId: number, preferences: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences>;

  // Client invitations
  createClientInvitation(invitation: InsertClientInvitation): Promise<ClientInvitation>;
  getClientInvitationById(id: number): Promise<ClientInvitation | undefined>;
  getClientInvitationByEmail(email: string): Promise<ClientInvitation | undefined>;
  getClientInvitationsByTherapist(therapistId: number): Promise<ClientInvitation[]>;
  updateClientInvitationStatus(id: number, status: string): Promise<ClientInvitation>;
  resendClientInvitation(id: number, tokenHash: string): Promise<ClientInvitation>;
  deleteClientInvitation(id: number): Promise<boolean>;

  // AI Recommendations
  createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation>;
  getAiRecommendationById(id: number): Promise<AiRecommendation | undefined>;
  getAiRecommendationsByUser(userId: number): Promise<AiRecommendation[]>;
  getPendingAiRecommendationsByTherapist(therapistId: number): Promise<AiRecommendation[]>;
  updateAiRecommendationStatus(id: number, status: string, therapistNotes?: string): Promise<AiRecommendation>;
  deleteAiRecommendation(id: number): Promise<void>;

  // Engagement Settings
  getEngagementSettings(): Promise<EngagementSettings | undefined>;
  updateEngagementSettings(settings: Partial<InsertEngagementSettings>): Promise<EngagementSettings>;
}

// Facade Storage implementing IStorage by composing domain-specific repositories
export class DatabaseStorage implements IStorage {
  private usersRepo = new UsersRepository();
  private therapyRepo = new TherapyRepository();
  private goalsRepo = new GoalsRepository();
  private journalRepo = new JournalRepository();
  private resourcesRepo = new ResourcesRepository();
  private billingRepo = new BillingRepository();
  private notificationsRepo = new NotificationsRepository();
  private adminRepo = new AdminRepository();

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.usersRepo.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.usersRepo.getUserByUsername(username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.usersRepo.getUserByEmail(email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    return this.usersRepo.createUser(userData);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return this.usersRepo.updateUser(id, data);
  }

  async getClients(therapistId: number): Promise<User[]> {
    return this.usersRepo.getClients(therapistId);
  }

  async getClientsByTherapistId(therapistId: number): Promise<User[]> {
    return this.usersRepo.getClientsByTherapistId(therapistId);
  }

  async getClient(clientId: number): Promise<User | undefined> {
    return this.usersRepo.getClient(clientId);
  }

  async getSession(sessionId: string): Promise<{ userId: number } | null> {
    return this.usersRepo.getSession(sessionId);
  }

  async getClientByIdAndTherapist(clientId: number, therapistId: number): Promise<User | undefined> {
    return this.usersRepo.getClientByIdAndTherapist(clientId, therapistId);
  }

  async getAllUsers(): Promise<User[]> {
    return this.usersRepo.getAllUsers();
  }

  async updateCurrentViewingClient(userId: number, clientId: number | null): Promise<User> {
    return this.usersRepo.updateCurrentViewingClient(userId, clientId);
  }

  async getCurrentViewingClient(userId: number): Promise<number | null> {
    return this.usersRepo.getCurrentViewingClient(userId);
  }
  
  async countTherapistClients(therapistId: number): Promise<number> {
    return this.usersRepo.countProfessionalClients(therapistId);
  }
  
  async countProfessionalClients(professionalId: number): Promise<number> {
    return this.usersRepo.countProfessionalClients(professionalId);
  }

  async updateUserTherapist(userId: number, therapistId: number): Promise<User> {
    return this.usersRepo.updateUserTherapist(userId, therapistId);
  }

  async updateUserStatus(userId: number, status: string): Promise<User> {
    return this.usersRepo.updateUserStatus(userId, status);
  }

  async removeClientFromTherapist(clientId: number, therapistId: number): Promise<User | null> {
    return this.usersRepo.removeClientFromTherapist(clientId, therapistId);
  }

  async deleteUser(userId: number, adminId?: number): Promise<void> {
    return this.usersRepo.deleteUser(userId, adminId);
  }

  // Session management
  async createSession(userId: number): Promise<Session> {
    return this.usersRepo.createSession(userId);
  }

  async getSessionById(sessionId: string): Promise<Session | undefined> {
    return this.usersRepo.getSessionById(sessionId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    return this.usersRepo.deleteSession(sessionId);
  }

  // Client invitations
  async createClientInvitation(invitation: InsertClientInvitation): Promise<ClientInvitation> {
    return this.usersRepo.createClientInvitation(invitation);
  }
  
  async getClientInvitationById(id: number): Promise<ClientInvitation | undefined> {
    return this.usersRepo.getClientInvitationById(id);
  }
  
  async getClientInvitationByEmail(email: string): Promise<ClientInvitation | undefined> {
    return this.usersRepo.getClientInvitationByEmail(email);
  }
  
  async getClientInvitationsByTherapist(therapistId: number): Promise<ClientInvitation[]> {
    return this.usersRepo.getClientInvitationsByProfessional(therapistId);
  }
  
  async getClientInvitationsByProfessional(professionalId: number): Promise<ClientInvitation[]> {
    return this.usersRepo.getClientInvitationsByProfessional(professionalId);
  }
  
  async updateClientInvitationStatus(id: number, status: string): Promise<ClientInvitation> {
    return this.usersRepo.updateClientInvitationStatus(id, status);
  }

  async resendClientInvitation(id: number, tokenHash: string): Promise<ClientInvitation> {
    return this.usersRepo.resendClientInvitation(id, tokenHash);
  }

  async deleteClientInvitation(id: number): Promise<boolean> {
    return this.usersRepo.deleteClientInvitation(id);
  }

  // System logs
  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    return this.adminRepo.createSystemLog(log);
  }

  // Admin statistics methods
  async getAllEmotionRecords(): Promise<EmotionRecord[]> {
    return this.therapyRepo.getAllEmotionRecords();
  }
  
  async getAllThoughtRecords(): Promise<ThoughtRecord[]> {
    return this.therapyRepo.getAllThoughtRecords();
  }
  
  async getAllGoals(): Promise<Goal[]> {
    return this.goalsRepo.getAllGoals();
  }
  
  async getAllResourceAssignments(): Promise<ResourceAssignment[]> {
    return this.resourcesRepo.getAllResourceAssignments();
  }

  // Emotion records
  async createEmotionRecord(record: InsertEmotionRecord): Promise<EmotionRecord> {
    return this.therapyRepo.createEmotionRecord(record);
  }

  async getEmotionRecordsByUser(userId: number): Promise<EmotionRecord[]> {
    return this.therapyRepo.getEmotionRecordsByUser(userId);
  }

  async getEmotionRecordById(id: number): Promise<EmotionRecord | undefined> {
    return this.therapyRepo.getEmotionRecordById(id);
  }

  async deleteEmotionRecord(id: number): Promise<void> {
    return this.therapyRepo.deleteEmotionRecord(id);
  }

  // Thought records
  async createThoughtRecord(record: InsertThoughtRecord): Promise<ThoughtRecord> {
    return this.therapyRepo.createThoughtRecord(record);
  }

  async getThoughtRecordsByUser(userId: number): Promise<ThoughtRecord[]> {
    return this.therapyRepo.getThoughtRecordsByUser(userId);
  }

  async getThoughtRecordById(id: number): Promise<ThoughtRecord | undefined> {
    return this.therapyRepo.getThoughtRecordById(id);
  }

  async getThoughtRecordsByEmotionId(emotionRecordId: number): Promise<ThoughtRecord[]> {
    return this.therapyRepo.getThoughtRecordsByEmotionId(emotionRecordId);
  }

  async deleteThoughtRecord(id: number): Promise<void> {
    return this.therapyRepo.deleteThoughtRecord(id);
  }

  // Protective factors
  async createProtectiveFactor(factor: InsertProtectiveFactor): Promise<ProtectiveFactor> {
    return this.therapyRepo.createProtectiveFactor(factor);
  }

  async getProtectiveFactorsByUser(userId: number, includeGlobal?: boolean): Promise<ProtectiveFactor[]> {
    return this.therapyRepo.getProtectiveFactorsByUser(userId, includeGlobal);
  }

  async getProtectiveFactorById(id: number): Promise<ProtectiveFactor | undefined> {
    return this.therapyRepo.getProtectiveFactorById(id);
  }

  async updateProtectiveFactor(id: number, data: Partial<InsertProtectiveFactor>): Promise<ProtectiveFactor> {
    return this.therapyRepo.updateProtectiveFactor(id, data);
  }

  async deleteProtectiveFactor(id: number): Promise<void> {
    return this.therapyRepo.deleteProtectiveFactor(id);
  }

  // Protective factor usage
  async addProtectiveFactorUsage(usage: InsertProtectiveFactorUsage): Promise<ProtectiveFactorUsage> {
    return this.therapyRepo.addProtectiveFactorUsage(usage);
  }

  // Coping strategies
  async createCopingStrategy(strategy: InsertCopingStrategy): Promise<CopingStrategy> {
    return this.therapyRepo.createCopingStrategy(strategy);
  }

  async getCopingStrategiesByUser(userId: number, includeGlobal?: boolean): Promise<CopingStrategy[]> {
    return this.therapyRepo.getCopingStrategiesByUser(userId, includeGlobal);
  }

  async getCopingStrategyById(id: number): Promise<CopingStrategy | undefined> {
    return this.therapyRepo.getCopingStrategyById(id);
  }

  async updateCopingStrategy(id: number, data: Partial<InsertCopingStrategy>): Promise<CopingStrategy> {
    return this.therapyRepo.updateCopingStrategy(id, data);
  }

  async deleteCopingStrategy(id: number): Promise<void> {
    return this.therapyRepo.deleteCopingStrategy(id);
  }

  // Coping strategy usage
  async addCopingStrategyUsage(usage: InsertCopingStrategyUsage): Promise<CopingStrategyUsage> {
    return this.therapyRepo.addCopingStrategyUsage(usage);
  }

  // Cognitive distortions
  async createCognitiveDistortion(distortion: InsertCognitiveDistortion): Promise<CognitiveDistortion> {
    return this.therapyRepo.createCognitiveDistortion(distortion);
  }
  
  async getCognitiveDistortions(): Promise<CognitiveDistortion[]> {
    return this.therapyRepo.getCognitiveDistortions();
  }
  
  async getCognitiveDistortionById(id: number): Promise<CognitiveDistortion | undefined> {
    return this.therapyRepo.getCognitiveDistortionById(id);
  }
  
  async updateCognitiveDistortion(id: number, data: Partial<InsertCognitiveDistortion>): Promise<CognitiveDistortion> {
    return this.therapyRepo.updateCognitiveDistortion(id, data);
  }
  
  async deleteCognitiveDistortion(id: number): Promise<void> {
    return this.therapyRepo.deleteCognitiveDistortion(id);
  }

  // Goals
  async createGoal(goal: InsertGoal): Promise<Goal> {
    return this.goalsRepo.createGoal(goal);
  }

  async getGoalsByUser(userId: number): Promise<Goal[]> {
    return this.goalsRepo.getGoalsByUser(userId);
  }

  async updateGoalStatus(id: number, status: string, therapistComments?: string): Promise<Goal> {
    return this.goalsRepo.updateGoalStatus(id, status, therapistComments);
  }

  // Goal milestones
  async createGoalMilestone(milestone: InsertGoalMilestone): Promise<GoalMilestone> {
    return this.goalsRepo.createGoalMilestone(milestone);
  }

  async getGoalMilestonesByGoal(goalId: number): Promise<GoalMilestone[]> {
    return this.goalsRepo.getGoalMilestonesByGoal(goalId);
  }

  async updateGoalMilestoneCompletion(id: number, isCompleted: boolean): Promise<GoalMilestone> {
    return this.goalsRepo.updateGoalMilestoneCompletion(id, isCompleted);
  }

  // Actions
  async createAction(action: InsertAction): Promise<Action> {
    return this.goalsRepo.createAction(action);
  }

  async getActionsByUser(userId: number): Promise<Action[]> {
    return this.goalsRepo.getActionsByUser(userId);
  }

  async updateActionCompletion(id: number, isCompleted: boolean, moodAfter?: number, reflection?: string): Promise<Action> {
    return this.goalsRepo.updateActionCompletion(id, isCompleted, moodAfter, reflection);
  }

  // Resources
  async createResource(resource: InsertResource): Promise<Resource> {
    return this.resourcesRepo.createResource(resource);
  }
  
  async getResourceById(id: number): Promise<Resource | undefined> {
    return this.resourcesRepo.getResourceById(id);
  }
  
  async getResourcesByCreator(userId: number): Promise<Resource[]> {
    return this.resourcesRepo.getResourcesByCreator(userId);
  }
  
  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return this.resourcesRepo.getResourcesByCategory(category);
  }
  
  async getAllResources(includeUnpublished?: boolean): Promise<Resource[]> {
    return this.resourcesRepo.getAllResources(includeUnpublished);
  }
  
  async updateResource(id: number, data: Partial<InsertResource>): Promise<Resource> {
    return this.resourcesRepo.updateResource(id, data);
  }
  
  async deleteResource(id: number): Promise<void> {
    return this.resourcesRepo.deleteResource(id);
  }
  
  async cloneResource(resourceId: number, userId: number): Promise<Resource> {
    return this.resourcesRepo.cloneResource(resourceId, userId);
  }
  
  // Resource assignments
  async assignResourceToClient(assignment: InsertResourceAssignment): Promise<ResourceAssignment> {
    return this.resourcesRepo.assignResourceToClient(assignment);
  }
  
  async getResourceAssignmentById(id: number): Promise<ResourceAssignment | undefined> {
    return this.resourcesRepo.getResourceAssignmentById(id);
  }
  
  async getAssignmentsByClient(clientId: number): Promise<ResourceAssignment[]> {
    return this.resourcesRepo.getAssignmentsByClient(clientId);
  }
  
  async getAssignmentsByTherapist(therapistId: number): Promise<ResourceAssignment[]> {
    return this.resourcesRepo.getAssignmentsByTherapist(therapistId);
  }
  
  async getAssignmentsByProfessional(professionalId: number): Promise<ResourceAssignment[]> {
    return this.resourcesRepo.getAssignmentsByProfessional(professionalId);
  }
  
  async updateAssignmentStatus(id: number, status: string): Promise<ResourceAssignment> {
    return this.resourcesRepo.updateAssignmentStatus(id, status);
  }
  
  async deleteResourceAssignment(id: number): Promise<void> {
    return this.resourcesRepo.deleteResourceAssignment(id);
  }

  // Resource feedback
  async createResourceFeedback(feedback: InsertResourceFeedback): Promise<ResourceFeedback> {
    return this.resourcesRepo.createResourceFeedback(feedback);
  }
  
  async getResourceFeedbackByResource(resourceId: number): Promise<ResourceFeedback[]> {
    return this.resourcesRepo.getResourceFeedbackByResource(resourceId);
  }
  
  async getResourceFeedbackByUser(userId: number): Promise<ResourceFeedback[]> {
    return this.resourcesRepo.getResourceFeedbackByUser(userId);
  }

  // Journal entries
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    return this.journalRepo.createJournalEntry(entry);
  }
  
  async getJournalEntryById(id: number): Promise<JournalEntry | undefined> {
    return this.journalRepo.getJournalEntryById(id);
  }
  
  async getJournalEntriesByUser(userId: number): Promise<JournalEntry[]> {
    return this.journalRepo.getJournalEntriesByUser(userId);
  }
  
  async updateJournalEntry(id: number, data: Partial<InsertJournalEntry>): Promise<JournalEntry> {
    return this.journalRepo.updateJournalEntry(id, data);
  }
  
  async deleteJournalEntry(id: number): Promise<void> {
    return this.journalRepo.deleteJournalEntry(id);
  }
  
  // Journal comments
  async createJournalComment(comment: InsertJournalComment): Promise<JournalComment> {
    return this.journalRepo.createJournalComment(comment);
  }
  
  async getJournalCommentsByEntry(journalEntryId: number): Promise<JournalComment[]> {
    return this.journalRepo.getJournalCommentsByEntry(journalEntryId);
  }
  
  async updateJournalComment(id: number, data: Partial<InsertJournalComment>): Promise<JournalComment> {
    return this.journalRepo.updateJournalComment(id, data);
  }
  
  async deleteJournalComment(id: number): Promise<void> {
    return this.journalRepo.deleteJournalComment(id);
  }

  // Integration: Journal entries <-> Thought records
  async linkJournalToThoughtRecord(journalId: number, thoughtRecordId: number): Promise<void> {
    return this.journalRepo.linkJournalToThoughtRecord(journalId, thoughtRecordId);
  }
  
  async unlinkJournalFromThoughtRecord(journalId: number, thoughtRecordId: number): Promise<void> {
    return this.journalRepo.unlinkJournalFromThoughtRecord(journalId, thoughtRecordId);
  }
  
  async getRelatedThoughtRecords(journalId: number): Promise<ThoughtRecord[]> {
    return this.journalRepo.getRelatedThoughtRecords(journalId);
  }
  
  async getRelatedJournalEntries(thoughtRecordId: number): Promise<JournalEntry[]> {
    return this.journalRepo.getRelatedJournalEntries(thoughtRecordId);
  }

  // Notification management
  async createNotification(notification: InsertNotification): Promise<Notification> {
    return this.notificationsRepo.createNotification(notification);
  }
  
  async getNotificationsByUser(userId: number, limit?: number): Promise<Notification[]> {
    return this.notificationsRepo.getNotificationsByUser(userId, limit);
  }
  
  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    return this.notificationsRepo.getUnreadNotificationsByUser(userId);
  }
  
  async getNotificationById(id: number): Promise<Notification | undefined> {
    return this.notificationsRepo.getNotificationById(id);
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    return this.notificationsRepo.markNotificationAsRead(id);
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    return this.notificationsRepo.markAllNotificationsAsRead(userId);
  }
  
  async deleteNotification(id: number): Promise<void> {
    return this.notificationsRepo.deleteNotification(id);
  }

  async clearAllNotifications(userId: number): Promise<void> {
    return this.notificationsRepo.clearAllNotifications(userId);
  }

  // Notification preferences
  async getNotificationPreferences(userId: number): Promise<NotificationPreferences | undefined> {
    return this.notificationsRepo.getNotificationPreferences(userId);
  }
  
  async createNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences> {
    return this.notificationsRepo.createNotificationPreferences(preferences);
  }
  
  async updateNotificationPreferences(userId: number, preferences: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences> {
    return this.notificationsRepo.updateNotificationPreferences(userId, preferences);
  }

  // Subscription plans management
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    return this.billingRepo.createSubscriptionPlan(plan);
  }
  
  async getSubscriptionPlans(activeOnly?: boolean): Promise<SubscriptionPlan[]> {
    return this.billingRepo.getSubscriptionPlans(activeOnly);
  }
  
  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    return this.billingRepo.getSubscriptionPlanById(id);
  }
  
  async updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    return this.billingRepo.updateSubscriptionPlan(id, data);
  }
  
  async getDefaultSubscriptionPlan(): Promise<SubscriptionPlan | undefined> {
    return this.billingRepo.getDefaultSubscriptionPlan();
  }
  
  async setDefaultSubscriptionPlan(id: number): Promise<SubscriptionPlan> {
    return this.billingRepo.setDefaultSubscriptionPlan(id);
  }
  
  async deactivateSubscriptionPlan(id: number): Promise<SubscriptionPlan> {
    return this.billingRepo.deactivateSubscriptionPlan(id);
  }

  // Stripe user details updates
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    return this.billingRepo.updateUserStripeInfo(userId, stripeInfo);
  }
  
  async updateSubscriptionStatus(userId: number, status: string, endDate?: Date): Promise<User> {
    return this.billingRepo.updateSubscriptionStatus(userId, status, endDate);
  }
  
  async assignSubscriptionPlan(userId: number, planId: number): Promise<User> {
    return this.billingRepo.assignSubscriptionPlan(userId, planId);
  }

  // Engagement Settings
  async getEngagementSettings(): Promise<EngagementSettings | undefined> {
    return this.adminRepo.getEngagementSettings();
  }

  async updateEngagementSettings(settings: Partial<InsertEngagementSettings>): Promise<EngagementSettings> {
    return this.adminRepo.updateEngagementSettings(settings);
  }

  // AI Recommendations
  async createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation> {
    return this.adminRepo.createAiRecommendation(recommendation);
  }
  
  async getAiRecommendationById(id: number): Promise<AiRecommendation | undefined> {
    return this.adminRepo.getAiRecommendationById(id);
  }
  
  async getAiRecommendationsByUser(userId: number): Promise<AiRecommendation[]> {
    return this.adminRepo.getAiRecommendationsByUser(userId);
  }
  
  async getPendingAiRecommendationsByProfessional(professionalId: number): Promise<AiRecommendation[]> {
    return this.adminRepo.getPendingAiRecommendationsByProfessional(professionalId);
  }

  async getPendingAiRecommendationsByTherapist(therapistId: number): Promise<AiRecommendation[]> {
    return this.adminRepo.getPendingAiRecommendationsByTherapist(therapistId);
  }
  
  async updateAiRecommendationStatus(id: number, status: string, therapistNotes?: string): Promise<AiRecommendation> {
    return this.adminRepo.updateAiRecommendationStatus(id, status, therapistNotes);
  }
  
  async deleteAiRecommendation(id: number): Promise<void> {
    return this.adminRepo.deleteAiRecommendation(id);
  }

  // AI Recommendations
  async createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation> {
    return this.adminRepo.createAiRecommendation(recommendation);
  }
  
  async getAiRecommendationById(id: number): Promise<AiRecommendation | undefined> {
    return this.adminRepo.getAiRecommendationById(id);
  }
  
  async getAiRecommendationsByUser(userId: number): Promise<AiRecommendation[]> {
    return this.adminRepo.getAiRecommendationsByUser(userId);
  }
  
  async getPendingAiRecommendationsByProfessional(professionalId: number): Promise<AiRecommendation[]> {
    return this.adminRepo.getPendingAiRecommendationsByProfessional(professionalId);
  }

  async getPendingAiRecommendationsByTherapist(therapistId: number): Promise<AiRecommendation[]> {
    return this.adminRepo.getPendingAiRecommendationsByTherapist(therapistId);
  }
  
  async updateAiRecommendationStatus(id: number, status: string, therapistNotes?: string): Promise<AiRecommendation> {
    return this.adminRepo.updateAiRecommendationStatus(id, status, therapistNotes);
  }
  
  async deleteAiRecommendation(id: number): Promise<void> {
    return this.adminRepo.deleteAiRecommendation(id);
  }
}

export const storage = new DatabaseStorage();