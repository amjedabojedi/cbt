import { 
  goals, type Goal, type InsertGoal,
  goalMilestones, type GoalMilestone, type InsertGoalMilestone,
  actions, type Action, type InsertAction
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";

export class GoalsRepository {
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

  async getAllGoals(): Promise<Goal[]> {
    return db
      .select()
      .from(goals)
      .orderBy(desc(goals.createdAt));
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
}
