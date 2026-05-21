import { Request, Response } from "express";
import { db } from "../db";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { goals, goalMilestones, insertGoalSchema, insertGoalMilestoneSchema } from "@shared/schema";
import { storage } from "../storage";
import { z } from "zod";

// Helper function to auto-update goal status based on milestone completion
export async function updateGoalStatusBasedOnMilestones(goalId: number): Promise<void> {
  try {
    // Get all milestones for this goal
    const milestones = await db
      .select()
      .from(goalMilestones)
      .where(eq(goalMilestones.goalId, goalId));
    
    // If no milestones, set status to pending
    if (milestones.length === 0) {
      await db
        .update(goals)
        .set({ status: 'pending' })
        .where(eq(goals.id, goalId));
      console.log(`Goal ${goalId} status set to 'pending' (no milestones)`);
      return;
    }
    
    // Calculate completion percentage
    const completedMilestones = milestones.filter(m => m.isCompleted).length;
    const totalMilestones = milestones.length;
    const completionPercentage = (completedMilestones / totalMilestones) * 100;
    
    // Determine new status based on completion
    let newStatus: string;
    if (completionPercentage === 0) {
      newStatus = 'pending';
    } else if (completionPercentage === 100) {
      newStatus = 'completed';
    } else {
      newStatus = 'in_progress';
    }
    
    // Update goal status
    await db
      .update(goals)
      .set({ status: newStatus as any })
      .where(eq(goals.id, goalId));
    
    console.log(`Goal ${goalId} status auto-updated to '${newStatus}' (${completedMilestones}/${totalMilestones} milestones completed)`);
  } catch (error) {
    console.error(`Error auto-updating status for goal ${goalId}:`, error);
  }
}

// Create goal
export async function createGoal(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    console.log("Creating goal for user:", userId);
    
    // Create a new object with all the goal data
    let updatedBody = { ...req.body, userId };
    
    // Convert deadline string to a Date object if it exists
    if (updatedBody.deadline && typeof updatedBody.deadline === 'string') {
      try {
        updatedBody.deadline = new Date(updatedBody.deadline);
      } catch (dateError) {
        console.error("Date conversion error:", dateError);
        // If date parsing fails, set to null
        updatedBody.deadline = null;
      }
    }
    
    const validatedData = insertGoalSchema.parse(updatedBody);
    console.log("Validated goal data:", JSON.stringify(validatedData));
    
    const goal = await storage.createGoal(validatedData);
    res.status(201).json(goal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Goal validation error:", JSON.stringify(error.errors));
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create goal error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all goals for a user
export async function getGoals(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // If the user is a therapist with a current viewing client, show that client's goals
    // Re-verify the relationship is still active before trusting the stored pointer.
    if (req.user!.role === 'therapist' && req.user!.currentViewingClientId) {
      const viewingClient = await storage.getUser(req.user!.currentViewingClientId);
      if (viewingClient && viewingClient.therapistId === req.user!.id) {
        const clientGoals = await storage.getGoalsByUser(req.user!.currentViewingClientId);
        return res.status(200).json(clientGoals);
      }
      // Stale pointer — clear it and fall through to return the requested user's goals
      await storage.updateCurrentViewingClient(req.user!.id, null);
    }
    
    const goals = await storage.getGoalsByUser(userId);
    res.status(200).json(goals);
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all milestones for all of a user's goals
export async function getAllMilestones(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // Determine which user's goals/milestones to fetch
    // Re-verify the relationship is still active before trusting the stored pointer.
    let targetUserId = userId;
    if (req.user!.role === 'therapist' && req.user!.currentViewingClientId) {
      const viewingClient = await storage.getUser(req.user!.currentViewingClientId);
      if (viewingClient && viewingClient.therapistId === req.user!.id) {
        targetUserId = req.user!.currentViewingClientId;
      } else {
        // Stale pointer — clear it and fall through to use the requested userId
        await storage.updateCurrentViewingClient(req.user!.id, null);
      }
    }
    
    // Get all goals for the user
    const goals = await storage.getGoalsByUser(targetUserId);
    
    // Get milestones for each goal
    const allMilestones = [];
    for (const goal of goals) {
      const milestones = await storage.getGoalMilestonesByGoal(goal.id);
      allMilestones.push(...milestones);
    }
    
    res.status(200).json(allMilestones);
  } catch (error) {
    console.error("Get all milestones error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update goal status
export async function updateGoalStatus(req: Request, res: Response) {
  try {
    const { status, therapistComments } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    
    // Get the goal to check ownership
    const id = parseInt(req.params.id);
    const goal = await storage.getGoalsByUser(req.user!.id).then(
      goals => goals.find(g => g.id === id)
    );
    
    if (!goal && req.user!.role !== 'therapist' && req.user!.role !== 'admin') {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    // If user is a therapist, check if the goal belongs to their client
    if (req.user!.role === 'therapist' && !goal) {
      // Find the goal first
      const [updatedGoal] = await db
        .select()
        .from(goals)
        .where(eq(goals.id, id));
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Check if the client is theirs
      const client = await storage.getUser(updatedGoal.userId);
      if (!client || client.therapistId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    
    const updatedGoal = await storage.updateGoalStatus(id, status, therapistComments);
    res.status(200).json(updatedGoal);
  } catch (error) {
    console.error("Update goal status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Create goal milestone
export async function createGoalMilestone(req: Request, res: Response) {
  try {
    const goalId = parseInt(req.params.goalId);
    console.log("Creating milestone for goal:", req.body.goalId);
    
    // First, retrieve the goal to check ownership and permissions
    const [goal] = await db
      .select()
      .from(goals)
      .where(eq(goals.id, goalId));
    
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    // If it's the user's own goal - always allow
    if (req.user!.id === goal.userId) {
      // Continue with creation
    }
    // If therapist is creating milestone for their client's goal - allow
    else if (req.user!.role === 'therapist') {
      // First check: therapist cannot create milestones for their own goals
      if (goal.userId === req.user!.id) {
        return res.status(403).json({ message: 'As a therapist, you can only provide feedback on goals, not create milestones for your own goals.' });
      }
      
      // Second check: Verify the goal belongs to their client
      const client = await storage.getUser(goal.userId);
      if (!client || client.therapistId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied. You can only create milestones for your clients\' goals.' });
      }
      // Continue with creation
    }
    // Admin can create milestones for any goal
    else if (req.user!.role === 'admin') {
      // Continue with creation
    }
    else {
      return res.status(403).json({ message: 'Access denied. You can only create milestones for your own goals.' });
    }
    
    // Create updated body with converted date
    let updatedBody = { ...req.body, goalId };
    
    // Convert dueDate string to a Date object if it exists
    if (updatedBody.dueDate && typeof updatedBody.dueDate === 'string') {
      try {
        updatedBody.dueDate = new Date(updatedBody.dueDate);
      } catch (dateError) {
        console.error("Date conversion error:", dateError);
        // If date parsing fails, set to null
        updatedBody.dueDate = null;
      }
    }
    
    const validatedData = insertGoalMilestoneSchema.parse(updatedBody);
    console.log("Validated milestone data:", JSON.stringify(validatedData));
    
    const milestone = await storage.createGoalMilestone(validatedData);
    
    // Auto-update goal status based on milestone completion
    await updateGoalStatusBasedOnMilestones(goalId);
    
    res.status(201).json(milestone);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Milestone validation error:", JSON.stringify(error.errors));
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create goal milestone error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get milestones for a goal
export async function getGoalMilestones(req: Request, res: Response) {
  try {
    const goalId = parseInt(req.params.goalId);
    
    // First, retrieve the goal to check ownership and permissions
    const [goal] = await db
      .select()
      .from(goals)
      .where(eq(goals.id, goalId));
    
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    // If it's the user's own goal - always allow
    if (req.user!.id === goal.userId) {
      // Continue with request
    }
    // If therapist is viewing their client's goal - allow
    else if (req.user!.role === 'therapist') {
      // Verify the goal belongs to their client
      const client = await storage.getUser(goal.userId);
      if (!client || client.therapistId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied. You can only view milestones for your clients\' goals.' });
      }
      // Continue with request
    }
    // Admin can view any goal's milestones
    else if (req.user!.role === 'admin') {
      // Continue with request
    }
    else {
      return res.status(403).json({ message: 'Access denied. You can only view milestones for your own goals.' });
    }
    
    const milestones = await storage.getGoalMilestonesByGoal(goalId);
    res.status(200).json(milestones);
  } catch (error) {
    console.error("Get goal milestones error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update milestone completion status
export async function updateMilestoneCompletion(req: Request, res: Response) {
  try {
    const { isCompleted } = req.body;
    
    if (isCompleted === undefined) {
      return res.status(400).json({ message: "isCompleted field is required" });
    }
    
    const id = parseInt(req.params.id);
    
    // First get the milestone to check associated goal ownership
    const [milestone] = await db
      .select()
      .from(goalMilestones)
      .where(eq(goalMilestones.id, id));
    
    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }
    
    // Now get the associated goal to check permissions
    const [goal] = await db
      .select()
      .from(goals)
      .where(eq(goals.id, milestone.goalId));
    
    if (!goal) {
      return res.status(404).json({ message: "Associated goal not found" });
    }
    
    // If it's the user's own goal - always allow
    if (req.user!.id === goal.userId) {
      // Continue with update
    }
    // If therapist is updating their client's goal milestone - allow
    else if (req.user!.role === 'therapist') {
      // First check: therapist cannot update milestones for their own goals
      if (goal.userId === req.user!.id) {
        return res.status(403).json({ message: 'As a therapist, you can only provide feedback on goals, not update milestones for your own goals.' });
      }
      
      // Second check: Verify the goal belongs to their client
      const client = await storage.getUser(goal.userId);
      if (!client || client.therapistId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied. You can only update milestones for your clients\' goals.' });
      }
      // Continue with update
    }
    // Admin can update any milestone
    else if (req.user!.role === 'admin') {
      // Continue with update
    }
    else {
      return res.status(403).json({ message: 'Access denied. You can only update milestones for your own goals.' });
    }
    
    const updatedMilestone = await storage.updateGoalMilestoneCompletion(id, isCompleted);
    
    // Auto-update goal status based on milestone completion
    await updateGoalStatusBasedOnMilestones(milestone.goalId);
    
    res.status(200).json(updatedMilestone);
  } catch (error) {
    console.error("Update milestone completion error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
