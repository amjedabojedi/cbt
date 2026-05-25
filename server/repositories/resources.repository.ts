import { 
  resources, type Resource, type InsertResource,
  resourceAssignments, type ResourceAssignment, type InsertResourceAssignment,
  resourceFeedback, type ResourceFeedback, type InsertResourceFeedback
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";

export class ResourcesRepository {
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
    await db
      .delete(resourceAssignments)
      .where(eq(resourceAssignments.resourceId, id));
    
    await db
      .delete(resourceFeedback)
      .where(eq(resourceFeedback.resourceId, id));
    
    await db
      .delete(resources)
      .where(eq(resources.id, id));
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
