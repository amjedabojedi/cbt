import { Request, Response } from "express";
import { storage } from "../storage";

// GET /api/resources
export async function getAllResources(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const includeUnpublished = user?.role === "admin" || user?.role === "therapist";
    const allResources = await storage.getAllResources(includeUnpublished);
    res.json(allResources);
  } catch (error) {
    console.error("getAllResources error:", error);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
}

// POST /api/resources
export async function createResource(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { title, description, content, type, category, tags, isPublished, pdfUrl } = req.body;
    if (!title || !description || !content || !type || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const resource = await storage.createResource({
      title,
      description,
      content,
      type,
      category,
      tags: tags || [],
      isPublished: isPublished ?? true,
      fileUrl: pdfUrl || null,
      createdBy: user.id,
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error("createResource error:", error);
    res.status(500).json({ message: "Failed to create resource" });
  }
}

// PATCH /api/resources/:id
export async function updateResource(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) return res.status(400).json({ message: "Invalid resource ID" });

    const existing = await storage.getResourceById(resourceId);
    if (!existing) return res.status(404).json({ message: "Resource not found" });

    if (user?.role !== "admin" && existing.createdBy !== user?.id) {
      return res.status(403).json({ message: "Not authorised to update this resource" });
    }

    const { title, description, content, type, category, tags, isPublished, pdfUrl } = req.body;
    const updated = await storage.updateResource(resourceId, {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(content !== undefined && { content }),
      ...(type !== undefined && { type }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags }),
      ...(isPublished !== undefined && { isPublished }),
      ...(pdfUrl !== undefined && { fileUrl: pdfUrl }),
    });

    res.json(updated);
  } catch (error) {
    console.error("updateResource error:", error);
    res.status(500).json({ message: "Failed to update resource" });
  }
}

// DELETE /api/resources/:id
export async function deleteResource(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) return res.status(400).json({ message: "Invalid resource ID" });

    const existing = await storage.getResourceById(resourceId);
    if (!existing) return res.status(404).json({ message: "Resource not found" });

    if (user?.role !== "admin" && existing.createdBy !== user?.id) {
      return res.status(403).json({ message: "Not authorised to delete this resource" });
    }

    await storage.deleteResource(resourceId);
    res.status(204).send();
  } catch (error) {
    console.error("deleteResource error:", error);
    res.status(500).json({ message: "Failed to delete resource" });
  }
}

// POST /api/resources/assign
export async function assignResource(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { resourceId, clientId, notes } = req.body;
    if (!resourceId || !clientId) {
      return res.status(400).json({ message: "resourceId and clientId are required" });
    }

    const assignment = await storage.assignResourceToClient({
      resourceId,
      assignedBy: user.id,
      assignedTo: clientId,
      notes: notes || null,
      status: "assigned",
      type: "resource",
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error("assignResource error:", error);
    res.status(500).json({ message: "Failed to assign resource" });
  }
}

// POST /api/resources/:id/clone
export async function cloneResource(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) return res.status(400).json({ message: "Invalid resource ID" });

    const cloned = await storage.cloneResource(resourceId, user.id);
    res.status(201).json(cloned);
  } catch (error) {
    console.error("cloneResource error:", error);
    res.status(500).json({ message: "Failed to clone resource" });
  }
}

// GET /api/therapist/assignments
export async function getTherapistAssignments(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const assignments = await storage.getAssignmentsByTherapist(user.id);

    // Batch-fetch feedback for each unique client so we can attach ratings to every assignment
    const uniqueClientIds = [...new Set(assignments.map((a) => a.assignedTo))];
    const clientFeedbackMap = new Map<number, { resourceId: number; rating: number; feedback?: string | null }[]>();
    await Promise.all(
      uniqueClientIds.map(async (clientId) => {
        const fb = await storage.getResourceFeedbackByUser(clientId);
        clientFeedbackMap.set(clientId, fb);
      })
    );

    // Enrich with resource, client, and feedback data
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const resource = await storage.getResourceById(a.resourceId);
        const client = await storage.getUser(a.assignedTo);
        const clientFeedback = clientFeedbackMap.get(a.assignedTo) || [];
        const feedback = clientFeedback.find((f) => f.resourceId === a.resourceId) || null;
        return {
          ...a,
          resource: resource || null,
          client: client ? { id: client.id, name: client.name, username: client.username } : null,
          feedback,
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error("getTherapistAssignments error:", error);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
}

// GET /api/client/assignments
export async function getClientAssignments(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const assignments = await storage.getAssignmentsByClient(user.id);

    const allFeedback = await storage.getResourceFeedbackByUser(user.id);
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const resource = await storage.getResourceById(a.resourceId);
        const myFeedback = allFeedback.find((f) => f.resourceId === a.resourceId) || null;
        return { ...a, resource: resource || null, feedback: myFeedback };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error("getClientAssignments error:", error);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
}

// PATCH /api/resource-assignments/:id/status
export async function updateResourceAssignmentStatus(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const assignmentId = parseInt(req.params.id);
    if (isNaN(assignmentId)) return res.status(400).json({ message: "Invalid assignment ID" });

    const { status } = req.body;
    if (!status || !["viewed", "completed"].includes(status)) {
      return res.status(400).json({ message: "status must be 'viewed' or 'completed'" });
    }

    const assignment = await storage.getResourceAssignmentById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    if (assignment.assignedTo !== user.id) {
      return res.status(403).json({ message: "Not authorised to update this assignment" });
    }

    const updated = await storage.updateAssignmentStatus(assignmentId, status);
    res.json(updated);
  } catch (error) {
    console.error("updateResourceAssignmentStatus error:", error);
    res.status(500).json({ message: "Failed to update assignment status" });
  }
}

// POST /api/resource-assignments/:id/feedback
export async function submitAssignmentFeedback(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const assignmentId = parseInt(req.params.id);
    if (isNaN(assignmentId)) return res.status(400).json({ message: "Invalid assignment ID" });

    const { rating, feedback } = req.body;
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating must be a number between 1 and 5" });
    }

    const assignment = await storage.getResourceAssignmentById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    if (assignment.assignedTo !== user.id) {
      return res.status(403).json({ message: "Not authorised to submit feedback for this assignment" });
    }

    const existing = await storage.getResourceFeedbackByUser(user.id);
    const alreadyRated = existing.find((f) => f.resourceId === assignment.resourceId);
    if (alreadyRated) {
      return res.status(409).json({ message: "Feedback already submitted for this resource" });
    }

    const saved = await storage.createResourceFeedback({
      resourceId: assignment.resourceId,
      userId: user.id,
      rating,
      feedback: feedback || null,
    });
    res.status(201).json(saved);
  } catch (error) {
    console.error("submitAssignmentFeedback error:", error);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
}

// DELETE /api/resource-assignments/:id
export async function deleteResourceAssignment(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const assignmentId = parseInt(req.params.id);
    if (isNaN(assignmentId)) return res.status(400).json({ message: "Invalid assignment ID" });

    const assignment = await storage.getResourceAssignmentById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    if (user?.role !== "admin" && assignment.assignedBy !== user?.id) {
      return res.status(403).json({ message: "Not authorised to delete this assignment" });
    }

    await storage.deleteResourceAssignment(assignmentId);
    res.status(204).send();
  } catch (error) {
    console.error("deleteResourceAssignment error:", error);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
}
