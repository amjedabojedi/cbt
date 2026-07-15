import { 
  users, type User, type InsertUser,
  sessions, type Session,
  clientInvitations, type ClientInvitation, type InsertClientInvitation,
  emotionRecords, thoughtRecords, protectiveFactors, copingStrategies, goals, goalMilestones,
  journalEntries, actions, notifications, notificationPreferences,
  resourceAssignments, resourceFeedback, reframePracticeResults,
  userGameProfile, copingStrategyUsage, journalComments, protectiveFactorUsage
} from "@shared/schema";
import { db, pool } from "../db";
import { eq, and, desc, sql, or } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";

export class UsersRepository {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    if (id === undefined || id === null) {
      console.error("getUser called with null/undefined id");
      return undefined;
    }
    
    const userId = Number(id);
    if (isNaN(userId)) {
      console.error(`Invalid user ID: ${id}, cannot convert to number`);
      return undefined;
    }
    
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      return user;
    } catch (error) {
      console.error(`Error retrieving user with ID ${userId}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { withRetry } = await import('../db');
      
      const [user] = await withRetry(async () => {
        console.log(`Attempting to fetch user by username`);
        // Case-insensitive match — clients often type names in ALL CAPS
        return await db
          .select()
          .from(users)
          .where(sql`lower(${users.username}) = lower(${username})`);
      });
      
      return user;
    } catch (error) {
      console.error(`Error in getUserByUsername for '${username}':`, error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`);
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
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
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async getClients(therapistId: number): Promise<User[]> {
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
  
  async getClientsByTherapistId(therapistId: number): Promise<User[]> {
    try {
      return await db
        .select()
        .from(users)
        .where(eq(users.therapistId, therapistId))
        .orderBy(users.name);
    } catch (error) {
      console.error("Error in getClientsByTherapistId:", error);
      return [];
    }
  }
  
  async getClient(clientId: number): Promise<User | undefined> {
    try {
      const [client] = await db
        .select()
        .from(users)
        .where(eq(users.id, clientId));
      return client;
    } catch (error) {
      console.error(`Error in getClient for ID ${clientId}:`, error);
      return undefined;
    }
  }
  
  async getSession(sessionId: string): Promise<{ userId: number } | null> {
    try {
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId));
        
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
  
  async getClientByIdAndTherapist(clientId: number, therapistId: number): Promise<User | undefined> {
    const [client] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, clientId),
          eq(users.therapistId, therapistId),
          eq(users.role, "client")
        )
      );
    
    return client;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .orderBy(users.name);
  }
  
  async updateCurrentViewingClient(userId: number, clientId: number | null): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ currentViewingClientId: clientId })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async getCurrentViewingClient(userId: number): Promise<number | null> {
    if (userId === undefined || userId === null) {
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
  
  async countProfessionalClients(professionalId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.therapistId, professionalId));
    
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
    const [updatedUser] = await db
      .update(users)
      .set({ status: status as any })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async removeClientFromTherapist(clientId: number, therapistId: number): Promise<User | null> {
    const client = await this.getUser(clientId);
    
    if (!client || client.therapistId !== therapistId) {
      return null;
    }
    
    const [updatedClient] = await db
      .update(users)
      .set({ therapistId: null })
      .where(eq(users.id, clientId))
      .returning();
    
    await db
      .update(users)
      .set({ currentViewingClientId: null })
      .where(
        and(
          eq(users.id, therapistId),
          eq(users.currentViewingClientId, clientId)
        )
      );
    
    return updatedClient;
  }
    
  async deleteUser(userId: number, adminId?: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    if (adminId) {
      try {
        const admin = await this.getUser(adminId);
        // Direct insert system log
        await db.insert(require("@shared/schema").systemLogs).values({
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
      const clients = await db
        .select()
        .from(users)
        .where(eq(users.therapistId, userId));
      
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

    // Delete thought records and their dependents FIRST (they FK-reference emotion records)
    const userThoughtRecords = await db.select().from(thoughtRecords).where(eq(thoughtRecords.userId, userId));
    for (const thought of userThoughtRecords) {
      await db.delete(protectiveFactorUsage).where(eq(protectiveFactorUsage.thoughtRecordId, thought.id));
      await db.delete(copingStrategyUsage).where(eq(copingStrategyUsage.thoughtRecordId, thought.id));
      await db.delete(reframePracticeResults).where(eq(reframePracticeResults.thoughtRecordId, thought.id));
    }
    await db.delete(thoughtRecords).where(eq(thoughtRecords.userId, userId));

    // Now safe to delete emotion records
    await db.delete(emotionRecords).where(eq(emotionRecords.userId, userId));
    
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
  async createSession(userId: number): Promise<Session> {
    const sessionId = nanoid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
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
    try {
      const { withRetry } = await import('../db');
      
      const [session] = await withRetry(async () => {
        return await db.select().from(sessions).where(eq(sessions.id, sessionId));
      });
      
      return session;
    } catch (error) {
      console.error(`Error retrieving session:`, error);
      return undefined;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId));
  }

  // Client invitations
  async createClientInvitation(invitation: InsertClientInvitation): Promise<ClientInvitation> {
    if (!invitation.expiresAt) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      invitation.expiresAt = expiresAt;
    }
    
    const [newInvitation] = await db
      .insert(clientInvitations)
      .values(invitation)
      .returning();
    
    return newInvitation;
  }
  
  async getClientInvitationById(id: number): Promise<ClientInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(clientInvitations)
      .where(eq(clientInvitations.id, id));
    
    return invitation;
  }
  
  async getClientInvitationByEmail(email: string): Promise<ClientInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(clientInvitations)
      .where(eq(clientInvitations.email, email))
      .orderBy(desc(clientInvitations.createdAt))
      .limit(1);
    
    return invitation;
  }
  
  async getClientInvitationsByProfessional(professionalId: number): Promise<ClientInvitation[]> {
    return db
      .select()
      .from(clientInvitations)
      .where(eq(clientInvitations.therapistId, professionalId))
      .orderBy(desc(clientInvitations.createdAt));
  }
  
  async updateClientInvitationStatus(id: number, status: string): Promise<ClientInvitation> {
    const updateData: any = { status };
    
    if (status === "accepted") {
      updateData.acceptedAt = new Date();
    }
    
    const [updatedInvitation] = await db
      .update(clientInvitations)
      .set(updateData)
      .where(eq(clientInvitations.id, id))
      .returning();
    
    return updatedInvitation;
  }

  async resendClientInvitation(id: number, tokenHash: string): Promise<ClientInvitation> {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);

    const [updatedInvitation] = await db
      .update(clientInvitations)
      .set({
        status: "email_sent",
        invitationToken: tokenHash,
        expiresAt: newExpiry,
      })
      .where(eq(clientInvitations.id, id))
      .returning();

    return updatedInvitation;
  }
  
  async deleteClientInvitation(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(clientInvitations)
        .where(eq(clientInvitations.id, id))
        .returning({ id: clientInvitations.id });
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting client invitation:", error);
      return false;
    }
  }
}
