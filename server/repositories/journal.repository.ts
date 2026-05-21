import { 
  journalEntries, type JournalEntry, type InsertJournalEntry,
  journalComments, type JournalComment, type InsertJournalComment,
  users, thoughtRecords, type ThoughtRecord
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";

export class JournalRepository {
  // Journal entries
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
    await db
      .delete(journalComments)
      .where(eq(journalComments.journalEntryId, id));
    
    await db
      .delete(journalEntries)
      .where(eq(journalEntries.id, id));
  }
  
  // Journal comments
  async createJournalComment(comment: InsertJournalComment): Promise<JournalComment> {
    const [newComment] = await db
      .insert(journalComments)
      .values(comment)
      .returning();
    
    return newComment;
  }
  
  async getJournalCommentsByEntry(journalEntryId: number): Promise<any[]> {
    return db
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
  
  // Integration: Journal entries <-> Thought records
  async linkJournalToThoughtRecord(journalId: number, thoughtRecordId: number): Promise<void> {
    const [journal] = await db.select().from(journalEntries).where(eq(journalEntries.id, journalId));
    if (!journal) {
      throw new Error(`Journal entry with ID ${journalId} not found`);
    }
    
    const [thoughtRecord] = await db.select().from(thoughtRecords).where(eq(thoughtRecords.id, thoughtRecordId));
    if (!thoughtRecord) {
      throw new Error(`Thought record with ID ${thoughtRecordId} not found`);
    }
    
    const currentThoughtRecordIds = journal.relatedThoughtRecordIds || [];
    
    if (!currentThoughtRecordIds.includes(thoughtRecordId)) {
      await db.update(journalEntries)
        .set({
          relatedThoughtRecordIds: [...currentThoughtRecordIds, thoughtRecordId],
          updatedAt: new Date()
        })
        .where(eq(journalEntries.id, journalId));
    }
    
    const currentJournalEntryIds = thoughtRecord.relatedJournalEntryIds || [];
    
    if (!currentJournalEntryIds.includes(journalId)) {
      await db.update(thoughtRecords)
        .set({
          relatedJournalEntryIds: [...currentJournalEntryIds, journalId]
        })
        .where(eq(thoughtRecords.id, thoughtRecordId));
    }
  }
  
  async unlinkJournalFromThoughtRecord(journalId: number, thoughtRecordId: number): Promise<void> {
    const [journal] = await db.select().from(journalEntries).where(eq(journalEntries.id, journalId));
    if (!journal) {
      throw new Error(`Journal entry with ID ${journalId} not found`);
    }
    
    const [thoughtRecord] = await db.select().from(thoughtRecords).where(eq(thoughtRecords.id, thoughtRecordId));
    if (!thoughtRecord) {
      throw new Error(`Thought record with ID ${thoughtRecordId} not found`);
    }
    
    const currentThoughtRecordIds = journal.relatedThoughtRecordIds || [];
    
    if (currentThoughtRecordIds.includes(thoughtRecordId)) {
      await db.update(journalEntries)
        .set({
          relatedThoughtRecordIds: currentThoughtRecordIds.filter(id => id !== thoughtRecordId),
          updatedAt: new Date()
        })
        .where(eq(journalEntries.id, journalId));
    }
    
    const currentJournalEntryIds = thoughtRecord.relatedJournalEntryIds || [];
    
    if (currentJournalEntryIds.includes(journalId)) {
      await db.update(thoughtRecords)
        .set({
          relatedJournalEntryIds: currentJournalEntryIds.filter(id => id !== journalId)
        })
        .where(eq(thoughtRecords.id, thoughtRecordId));
    }
  }
  
  async getRelatedThoughtRecords(journalId: number): Promise<ThoughtRecord[]> {
    const [journal] = await db.select().from(journalEntries).where(eq(journalEntries.id, journalId));
    if (!journal || !journal.relatedThoughtRecordIds || journal.relatedThoughtRecordIds.length === 0) {
      return [];
    }
    
    const relatedRecords: ThoughtRecord[] = [];
    
    for (const recordId of journal.relatedThoughtRecordIds) {
      const [record] = await db.select().from(thoughtRecords).where(eq(thoughtRecords.id, recordId));
      if (record) {
        relatedRecords.push(record);
      }
    }
    
    return relatedRecords;
  }
  
  async getRelatedJournalEntries(thoughtRecordId: number): Promise<JournalEntry[]> {
    const [thoughtRecord] = await db.select().from(thoughtRecords).where(eq(thoughtRecords.id, thoughtRecordId));
    if (!thoughtRecord || !thoughtRecord.relatedJournalEntryIds || thoughtRecord.relatedJournalEntryIds.length === 0) {
      return [];
    }
    
    const relatedEntries: JournalEntry[] = [];
    
    for (const entryId of thoughtRecord.relatedJournalEntryIds) {
      const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, entryId));
      if (entry) {
        relatedEntries.push(entry);
      }
    }
    
    return relatedEntries;
  }
}
