import { 
  emotionRecords, type EmotionRecord, type InsertEmotionRecord,
  thoughtRecords, type ThoughtRecord, type InsertThoughtRecord,
  protectiveFactors, type ProtectiveFactor, type InsertProtectiveFactor,
  protectiveFactorUsage, type ProtectiveFactorUsage, type InsertProtectiveFactorUsage,
  copingStrategies, type CopingStrategy, type InsertCopingStrategy,
  copingStrategyUsage, type CopingStrategyUsage, type InsertCopingStrategyUsage,
  cognitiveDistortions, type CognitiveDistortion, type InsertCognitiveDistortion,
  reframePracticeResults, users
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, or } from "drizzle-orm";

export class TherapyRepository {
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
    const relatedThoughts = await this.getThoughtRecordsByEmotionId(id);
    
    for (const thought of relatedThoughts) {
      await this.deleteThoughtRecord(thought.id);
    }
    
    await db
      .delete(emotionRecords)
      .where(eq(emotionRecords.id, id));
  }

  async getAllEmotionRecords(): Promise<EmotionRecord[]> {
    return db
      .select()
      .from(emotionRecords)
      .orderBy(desc(emotionRecords.timestamp));
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
    await db
      .delete(reframePracticeResults)
      .where(eq(reframePracticeResults.thoughtRecordId, id));
    
    await db
      .delete(copingStrategyUsage)
      .where(eq(copingStrategyUsage.thoughtRecordId, id));
    
    await db
      .delete(protectiveFactorUsage)
      .where(eq(protectiveFactorUsage.thoughtRecordId, id));
    
    await db
      .delete(thoughtRecords)
      .where(eq(thoughtRecords.id, id));
  }

  async getAllThoughtRecords(): Promise<ThoughtRecord[]> {
    return db
      .select()
      .from(thoughtRecords)
      .orderBy(desc(thoughtRecords.createdAt));
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
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (includeGlobal) {
      const conditions = [
        eq(protectiveFactors.userId, userId),
        eq(protectiveFactors.isGlobal, true)
      ];
      
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
    await db
      .delete(protectiveFactorUsage)
      .where(eq(protectiveFactorUsage.protectiveFactorId, id));
      
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
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (includeGlobal) {
      const conditions = [
        eq(copingStrategies.userId, userId),
        eq(copingStrategies.isGlobal, true)
      ];
      
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
    await db
      .delete(copingStrategyUsage)
      .where(eq(copingStrategyUsage.copingStrategyId, id));
      
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
}
