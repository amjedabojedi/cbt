import { 
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  users, type User
} from "@shared/schema";
import { db } from "../db";
import { eq, and } from "drizzle-orm";

export class BillingRepository {
  // Stripe user details updates
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.stripeCustomerId,
        stripeSubscriptionId: stripeInfo.stripeSubscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async updateSubscriptionStatus(userId: number, status: string, endDate?: Date): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        subscriptionStatus: status as any,
        subscriptionEndDate: endDate ? endDate.toISOString().slice(0, 10) : undefined,
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async assignSubscriptionPlan(userId: number, planId: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        subscriptionPlanId: planId
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  // Subscription plans CRUD
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    
    return newPlan;
  }
  
  async getSubscriptionPlans(activeOnly: boolean = true): Promise<SubscriptionPlan[]> {
    if (activeOnly) {
      return db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.price);
    } else {
      return db
        .select()
        .from(subscriptionPlans)
        .orderBy(subscriptionPlans.price);
    }
  }
  
  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    
    return plan;
  }
  
  async updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set(data)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    
    return updatedPlan;
  }
  
  async getDefaultSubscriptionPlan(): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.isDefault, true), eq(subscriptionPlans.isActive, true)));
    
    return plan;
  }
  
  async setDefaultSubscriptionPlan(id: number): Promise<SubscriptionPlan> {
    await db
      .update(subscriptionPlans)
      .set({ isDefault: false })
      .where(eq(subscriptionPlans.isDefault, true));
    
    const [defaultPlan] = await db
      .update(subscriptionPlans)
      .set({ isDefault: true })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    
    return defaultPlan;
  }
  
  async deactivateSubscriptionPlan(id: number): Promise<SubscriptionPlan> {
    const [deactivatedPlan] = await db
      .update(subscriptionPlans)
      .set({ isActive: false })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    
    return deactivatedPlan;
  }
}
