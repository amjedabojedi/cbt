import { 
  resources, type Resource, type InsertResource,
  resourceAssignments, type ResourceAssignment, type InsertResourceAssignment,
  resourceFeedback, type ResourceFeedback, type InsertResourceFeedback, aiRecommendations, users
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { ResourceReferencedError } from "./resource-reference-errors";
import type { ResourceReferenceSummary } from "@shared/resource-references";

export class ResourcesRepository {
  async getResourceRecommendationReferences(
    id: number, viewer: { id: number; role: "admin" | "therapist" },
  ): Promise<ResourceReferenceSummary> {
    const referencesResource = sql`${aiRecommendations.suggestedResources} @> ${JSON.stringify([id])}::jsonb`;
    // Do not use the recommendation's original therapist: read access follows
    // the client's current assignment, including after a reassignment.
    const visibleScope = viewer.role === "admin"
      ? undefined
      : sql`exists (select 1 from ${users} where ${users.id} = ${aiRecommendations.userId}
          and ${users.therapistId} = ${viewer.id})`;
    const references = await db.select({
      id: aiRecommendations.id,
      status: aiRecommendations.status,
      createdAt: aiRecommendations.createdAt,
    }).from(aiRecommendations)
      .where(and(referencesResource, visibleScope))
      .orderBy(desc(aiRecommendations.createdAt), desc(aiRecommendations.id))
      .limit(51);
    // Only disclose existence, not a count or metadata about hidden records.
    const [anyReference] = await db.select({ id: aiRecommendations.id })
      .from(aiRecommendations).where(referencesResource).limit(1);
    return {
      hasReferences: references.length > 0 || !!anyReference,
      references: references.slice(0, 50),
      hasMore: references.length > 50,
    };
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
      .where(and(eq(resources.category, category), eq(resources.isPublished, true)))
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
    await db.transaction(async (tx) => {
      // All recommendation writers must lock the resource before inserting.
      // Check references AFTER acquiring the lock so a waiting deletion sees
      // recommendations committed by a concurrent creator (READ COMMITTED).
      const [resource] = await tx.select({ id: resources.id })
        .from(resources).where(eq(resources.id, id)).for("update");
      if (!resource) return;
      const [reference] = await tx.select({ id: aiRecommendations.id })
        .from(aiRecommendations)
        .where(sql`${aiRecommendations.suggestedResources} @> ${JSON.stringify([id])}::jsonb`)
        .limit(1);
      if (reference) throw new ResourceReferencedError();

      // Keep the original deletion behavior for unreferenced resources, but
      // roll back all cleanup if any part fails.
      await tx.delete(resourceAssignments).where(eq(resourceAssignments.resourceId, id));
      await tx.delete(resourceFeedback).where(eq(resourceFeedback.resourceId, id));
      await tx.delete(resources).where(eq(resources.id, id));
    }, { isolationLevel: "read committed" });
  }
  
  async cloneResource(resourceId: number, userId: number): Promise<Resource> {
    const originalResource = await this.getResourceById(resourceId);
    
    if (!originalResource) {
      throw new Error("Resource not found");
    }
    
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
  
  async getAssignmentsByProfessional(professionalId: number): Promise<ResourceAssignment[]> {
    return db
      .select()
      .from(resourceAssignments)
      .where(eq(resourceAssignments.assignedBy, professionalId))
      .orderBy(desc(resourceAssignments.assignedAt));
  }

  async getAssignmentsByTherapist(therapistId: number): Promise<ResourceAssignment[]> {
    return this.getAssignmentsByProfessional(therapistId);
  }
  
  async updateAssignmentStatus(id: number, status: string): Promise<ResourceAssignment> {
    const completedAt = status === "completed" ? new Date() : null;
    
    const [updatedAssignment] = await db
      .update(resourceAssignments)
      .set({
        status: status as any,
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
  
  async getAllResourceAssignments(): Promise<ResourceAssignment[]> {
    return db
      .select()
      .from(resourceAssignments);
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
}
