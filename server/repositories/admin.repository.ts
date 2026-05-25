import { 
  systemLogs, type SystemLog, type InsertSystemLog,
  engagementSettings, type EngagementSettings, type InsertEngagementSettings,
  aiRecommendations, type AiRecommendation, type InsertAiRecommendation
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";

export class AdminRepository {
  // System logs
  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    try {
      const [newLog] = await db
        .insert(systemLogs)
        .values(log)
        .returning();
      
      return newLog;
    } catch (error) {
      console.error("Error creating system log:", error);
      return {
        id: 0,
        level: log.level ?? "info",
        message: log.message ?? log.action ?? "",
        userId: log.userId ?? null,
        actionType: log.actionType ?? null,
        ipAddress: log.ipAddress ?? null,
        userAgent: log.userAgent ?? null,
        createdAt: new Date(),
        action: log.action ?? null,
        details: log.details ?? null,
      } as SystemLog;
    }
  }

  // Engagement Settings
  async getEngagementSettings(): Promise<EngagementSettings | undefined> {
    const [settings] = await db
      .select()
      .from(engagementSettings)
      .limit(1);
    
    return settings || undefined;
  }

  async updateEngagementSettings(settingsData: Partial<InsertEngagementSettings>): Promise<EngagementSettings> {
    const existing = await this.getEngagementSettings();
    
    if (existing) {
      const [updated] = await db
        .update(engagementSettings)
        .set({
          ...settingsData,
          updatedAt: new Date()
        })
        .where(eq(engagementSettings.id, existing.id))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(engagementSettings)
        .values({
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
        })
        .returning();
      
      return created;
    }
  }

  // AI Recommendations
  async createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation> {
    console.log("Creating AI recommendation:", recommendation);
    const [newRecommendation] = await db
      .insert(aiRecommendations)
      .values(recommendation)
      .returning();
    
    return newRecommendation;
  }
  
  async getAiRecommendationById(id: number): Promise<AiRecommendation | undefined> {
    const [recommendation] = await db
      .select()
      .from(aiRecommendations)
      .where(eq(aiRecommendations.id, id));
    
    return recommendation;
  }
  
  async getAiRecommendationsByUser(userId: number): Promise<AiRecommendation[]> {
    return db
      .select()
      .from(aiRecommendations)
      .where(eq(aiRecommendations.userId, userId))
      .orderBy(desc(aiRecommendations.createdAt));
  }
  
  async getPendingAiRecommendationsByProfessional(professionalId: number): Promise<AiRecommendation[]> {
    return db
      .select()
      .from(aiRecommendations)
      .where(
        and(
          eq(aiRecommendations.therapistId, professionalId),
          eq(aiRecommendations.status, "pending")
        )
      )
      .orderBy(desc(aiRecommendations.createdAt));
  }

  async getPendingAiRecommendationsByTherapist(therapistId: number): Promise<AiRecommendation[]> {
    return this.getPendingAiRecommendationsByProfessional(therapistId);
  }
  
  async updateAiRecommendationStatus(id: number, status: string, therapistNotes?: string): Promise<AiRecommendation> {
    const updateData: any = { status };
    
    if (status === "approved") {
      updateData.approvedAt = new Date();
    } else if (status === "rejected") {
      updateData.rejectedAt = new Date();
    } else if (status === "implemented") {
      updateData.implementedAt = new Date();
    }
    
    if (therapistNotes) {
      updateData.therapistNotes = therapistNotes;
    }
    
    const [updatedRecommendation] = await db
      .update(aiRecommendations)
      .set(updateData)
      .where(eq(aiRecommendations.id, id))
      .returning();
    
    return updatedRecommendation;
  }
  
  async deleteAiRecommendation(id: number): Promise<void> {
    await db
      .delete(aiRecommendations)
      .where(eq(aiRecommendations.id, id));
  }
}
