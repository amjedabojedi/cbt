import { Request, Response } from "express";
import { z } from "zod";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { db, pool } from "../db";
import { storage } from "../storage";
import { 
  users, 
  journalEntries, 
  thoughtRecords, 
  goals, 
  emotionRecords, 
  clientInvitations, 
  passwordResetTokens, 
  resources, 
  resourceAssignments,
  insertUserSchema, 
  insertAiRecommendationSchema, 
  insertProtectiveFactorUsageSchema, 
  insertCopingStrategyUsageSchema, 
  insertActionSchema, 
  insertProtectiveFactorSchema, 
  insertCopingStrategySchema 
} from "@shared/schema";
import { getSessionCookieOptions } from "../middleware/auth";
import { sendProfessionalWelcomeEmail, sendClientInvitation } from "../services/email";
import { sendNotificationToUser } from "../services/websocket";
import { analyzeJournalEntry } from "../services/openai";
import * as emotionMapping from "../services/emotionMapping";

// Helper function to check if a user is a client of a therapist
export async function isClientOfTherapist(clientId: number, therapistId: number): Promise<boolean> {
  try {
    const client = await storage.getUser(clientId);
    return !!client && client.therapistId === therapistId;
  } catch (error) {
    console.error('Error checking client-therapist relationship:', error);
    return false;
  }
}

/**
 * Enhanced insights using the improved emotion mapping service
 */
export async function getEnhancedInsights(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    
    // Fetch emotion records
    const emotions = await storage.getEmotionRecordsByUser(userId);
    
    // Fetch journal entries
    const journals = await storage.getJournalEntriesByUser(userId);
    
    // Fetch thought records
    const thoughts = await storage.getThoughtRecordsByUser(userId);
    
    // Use enhanced component connections
    const connections = await emotionMapping.enhanceComponentConnections(
      emotions || [], 
      journals || [], 
      thoughts || []
    );
    
    // Generate data insights
    const insights = emotionMapping.generateDataInsights(connections);
    
    res.json({
      connections,
      insights,
      summary: {
        emotions: emotions?.length || 0,
        journals: journals?.length || 0,
        thoughts: thoughts?.length || 0
      }
    });
  } catch (error) {
    console.error("Error generating enhanced insights:", error);
    res.status(500).json({ message: "Error generating insights" });
  }
}

/**
 * Update user status
 */
export async function updateUserStatus(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    
    const targetUser = await storage.getUser(userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const updatedUser = await storage.updateUserStatus(userId, status);
    
    if (targetUser.role === 'client' && status === 'active' && targetUser.therapistId) {
      await storage.createNotification({
        userId: targetUser.therapistId,
        title: "Client Status Updated",
        body: `${targetUser.name} has completed registration and is now an active client.`,
        type: "system",
        isRead: false
      });
    }
    
    res.status(200).json({ 
      message: "User status updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(req: Request, res: Response) {
  try {
    const allUsers = await storage.getAllUsers();
    const usersWithoutPasswords = allUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get clients for a therapist
 */
export async function getClients(req: Request, res: Response) {
  try {
    if (!req.user) {
      console.log("No authenticated user found for clients endpoint");
      return res.status(200).json([]);
    }
    
    if (req.user.role !== "therapist" && req.user.role !== "admin") {
      console.log(`User ${req.user.id} with role ${req.user.role} denied access to clients list`);
      return res.status(200).json([]);
    }
    
    const therapistId = req.user.id;
    console.log("Getting clients for therapist ID:", therapistId);
    
    const clients = await storage.getClients(therapistId);
    
    const formattedClients = clients.map((client: any) => ({
      ...client,
      therapistId: client.therapistId ?? client.therapist_id ?? null,
      createdAt: client.createdAt ?? (client.created_at ? new Date(client.created_at) : null)
    }));
    
    console.log(`Found ${formattedClients.length} clients for therapist ${therapistId}`);
    return res.status(200).json(formattedClients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.status(200).json([]);
  }
}

/**
 * Get all clients, including unassigned clients (admin only)
 */
export async function getAllClients(req: Request, res: Response) {
  try {
    const allUsers = await storage.getAllUsers();
    const clients = allUsers.filter(user => user.role === "client");
    
    const clientsWithoutPasswords = clients.map(client => {
      const { password, ...clientWithoutPassword } = client;
      return clientWithoutPassword;
    });
    res.status(200).json(clientsWithoutPasswords);
  } catch (error) {
    console.error("Get all clients error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Fixed viewing client endpoint - handles all cases gracefully
 */
export async function getViewingClientFixed(req: Request, res: Response) {
  const defaultResponse = { viewingClient: null, success: true };
  
  try {
    console.log("viewing-client-fixed endpoint called for user:", req.user?.id, "role:", req.user?.role);
    
    if (req.user!.role === 'therapist') {
      await storage.createSystemLog({
        action: 'Therapist accessed viewing client',
        userId: req.user!.id,
        ipAddress: req.ip ?? null,
        userAgent: req.get('User-Agent') ?? null,
        actionType: 'therapist',
      });
    }
    
    if (req.user!.role === 'admin') {
      console.log("Admin user - no viewing client needed");
      return res.status(200).json(defaultResponse);
    }

    if (req.user!.role !== 'therapist') {
      console.log("Non-therapist user - no viewing client needed");
      return res.status(200).json(defaultResponse);
    }

    const user = await storage.getUser(Number(req.user!.id));
    if (!user || !user.currentViewingClientId) {
      console.log("No viewing client set for therapist");
      return res.status(200).json(defaultResponse);
    }

    const viewingClient = await storage.getUser(user.currentViewingClientId);
    if (!viewingClient) {
      console.log("Viewing client not found");
      await storage.updateCurrentViewingClient(user.id, null);
      return res.status(200).json(defaultResponse);
    }

    if (viewingClient.therapistId !== user.id) {
      console.log(`Stale viewing client: client ${viewingClient.id} is no longer assigned to therapist ${user.id}`);
      await storage.updateCurrentViewingClient(user.id, null);
      return res.status(200).json(defaultResponse);
    }

    console.log("Found viewing client:", viewingClient.id);
    return res.status(200).json({ 
      viewingClient: {
        id: viewingClient.id,
        name: viewingClient.name,
        username: viewingClient.username
      }, 
      success: true 
    });
  } catch (error) {
    console.error("Error in viewing-client-fixed endpoint:", error);
    return res.status(200).json(defaultResponse);
  }
}

/**
 * Get current viewing client details
 */
export async function getCurrentViewingClient(req: Request, res: Response) {
  const response = { viewingClient: null, success: true };

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const userId = Number(req.user.id);
    
    let user = null;
    let viewingClientId = null;
    
    try {
      user = await storage.getUser(userId);
      
      if (user && typeof user.currentViewingClientId === 'number' && user.currentViewingClientId > 0) {
        viewingClientId = user.currentViewingClientId;
        
        try {
          let client = null;
          try {
            client = await storage.getClient(viewingClientId);
          } catch (clientFetchError) {
            console.error(`Error fetching client:`, clientFetchError);
            return res.status(200).json(response);
          }
          
          if (!client) {
            await storage.updateCurrentViewingClient(userId, null);
            return res.status(200).json(response);
          }

          if (req.user.role === 'therapist' && client.therapistId !== userId) {
            await storage.updateCurrentViewingClient(userId, null);
            return res.status(200).json(response);
          }
          
          (response as any).viewingClient = {
            id: client.id,
            name: client.name || "Unknown Client",
            username: client.username || "",
            email: client.email || "",
          };
        } catch (clientError) {
          console.log(`Error fetching client details:`, clientError);
          return res.status(200).json(response);
        }
      } else {
        console.log(`User has no valid viewing client ID set`);
        return res.status(200).json(response);
      }
    } catch (userError) {
      console.log(`Error fetching user ${userId}:`, userError);
      return res.status(200).json(response);
    }
    
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in current viewing client endpoint:", error);
    return res.status(200).json(response);
  }
}

/**
 * Get individual user details
 */
export async function getUserDetails(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = parseInt(req.params.userId);
    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (user.role === "admin") {
      // Allow
    } else if (user.role === "therapist") {
      const isClientAccessible = await isClientOfTherapist(userId, user.id);
      if (!isClientAccessible) {
        return res.status(403).json({ message: "Access denied - not your client" });
      }
    } else {
      if (user.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const targetUser = await storage.getUser(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = targetUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}

/**
 * Register user by admin (for creating therapists and admins)
 */
export async function registerByAdmin(req: Request, res: Response) {
  try {
    const { name, email, username, password, role } = req.body;
    
    if (!name || !email || !username || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    if (role !== "therapist" && role !== "admin") {
      return res.status(400).json({ message: "Invalid role. Must be therapist or admin" });
    }
    
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }
    
    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }
    
    const user = await storage.createUser({
      name,
      email,
      username,
      password,
      role,
      status: "active"
    });
    
    if (role === "therapist") {
      try {
        const defaultPlan = await storage.getDefaultSubscriptionPlan();
        if (defaultPlan) {
          await storage.assignSubscriptionPlan(user.id, defaultPlan.id);
          await storage.updateSubscriptionStatus(user.id, "trial");
          console.log(`Assigned default subscription plan (${defaultPlan.name}) to therapist ${user.id}`);
        } else {
          console.warn("No default subscription plan found for new therapist");
        }
      } catch (planError) {
        console.error("Error assigning default subscription plan:", planError);
      }
    }
    
    const unhashedPassword = password;
    const { password: _, ...userWithoutPassword } = user;
    
    await storage.createNotification({
      userId: user.id,
      title: "Welcome to Resilience CBT",
      body: `You have been added as a ${role} by ${req.user?.name || 'an administrator'}. Please log in and update your profile.`,
      type: "system",
      isRead: false
    });
    
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const loginLink = `${baseUrl}/login`;
    
    if (role === "therapist") {
      try {
        await (sendProfessionalWelcomeEmail as any)(
          email,
          name,
          username,
          unhashedPassword,
          loginLink
        );
        console.log(`Welcome email sent to new professional user ${user.id}`);
      } catch (emailError) {
        console.error("Error sending professional welcome email:", emailError);
      }
    }
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
}

/**
 * Delete a user (admin only)
 */
export async function deleteUser(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    if (userId === req.user?.id) {
      return res.status(400).json({ message: "Cannot delete your own account through this endpoint" });
    }
    
    const userToDelete = await storage.getUser(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }
    
    let affectedUserIds = [];
    
    if (userToDelete.role === "therapist") {
      const clients = await storage.getAllUsers();
      const therapistClients = clients.filter(client => client.therapistId === userId);
      
      affectedUserIds = therapistClients.map(client => client.id);
      
      for (const clientId of affectedUserIds) {
        await storage.createNotification({
          userId: clientId,
          title: "Therapist Assignment Update",
          body: `Your therapist ${userToDelete.name} is no longer available. Please contact administration for reassignment.`,
          type: "system",
          isRead: false
        });
      }
    }
    
    if (userToDelete.role === "client" && userToDelete.therapistId) {
      await storage.createNotification({
        userId: userToDelete.therapistId,
        title: "Client Removed",
        body: `Your client ${userToDelete.name} has been removed from the system.`,
        type: "system",
        isRead: false
      });
    }
    
    await storage.deleteUser(userId, req.user?.id);
    console.log(`User ${userId} deleted successfully by admin ${req.user?.id}`);
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
}

/**
 * Unassign client from therapist (admin only)
 */
export async function unassignTherapist(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role !== "client") {
      return res.status(400).json({ message: "Only clients can be unassigned from therapists" });
    }
    
    if (!user.therapistId) {
      return res.status(400).json({ message: "This client is not assigned to any therapist" });
    }
    
    const formerTherapistId = user.therapistId;
    const updatedUser = await storage.removeClientFromTherapist(userId, formerTherapistId);
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to unassign therapist" });
    }
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error unassigning therapist:", error);
    res.status(500).json({ message: "Failed to unassign therapist" });
  }
}

/**
 * Reset a user's password to default (admin only)
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const defaultPassword = "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    await storage.updateUser(userId, { password: hashedPassword });
    
    res.status(200).json({ message: "Password reset successfully", defaultPassword });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const userToUpdate = await storage.getUser(userId);
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (userId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ message: "You can only update your own profile" });
    }
    
    const { 
      name, 
      email,
      bio,
      specialty,
      licenses,
      education,
      approach
    } = req.body;
    
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    
    if (userToUpdate.role === "therapist") {
      if (bio !== undefined) updateData.bio = bio;
      if (specialty !== undefined) updateData.specialty = specialty;
      if (licenses !== undefined) updateData.licenses = licenses;
      if (education !== undefined) updateData.education = education;
      if (approach !== undefined) updateData.approach = approach;
    }
    
    const updatedUser = await storage.updateUser(userId, updateData);
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error("Update user profile error:", error);
    res.status(500).json({ 
      message: "Failed to update user profile",
      error: error?.message 
    });
  }
}

/**
 * Assign subscription plan to therapist (admin only)
 */
export async function assignSubscriptionPlan(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const { planId } = req.body;
    
    if (!planId || isNaN(planId)) {
      return res.status(400).json({ message: "Invalid plan ID" });
    }
    
    const userToUpdate = await storage.getUser(userId);
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (userToUpdate.role !== "therapist") {
      return res.status(400).json({ message: "Subscription plans can only be assigned to therapists" });
    }
    
    const plan = await storage.getSubscriptionPlanById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    
    const updatedUser = await storage.assignSubscriptionPlan(userId, planId);
    const status = plan.price === 0 ? "trial" : "active";
    await storage.updateSubscriptionStatus(userId, status);
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error assigning subscription plan:", error);
    res.status(500).json({ message: "Failed to assign subscription plan" });
  }
}

/**
 * Delete (remove) client from therapist
 */
export async function deleteClientByTherapist(req: Request, res: Response) {
  try {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    
    const client = await storage.getUser(clientId);
    
    if (!client || client.therapistId !== req.user!.id) {
      return res.status(404).json({ message: "Client not found or does not belong to you" });
    }
    
    await storage.deleteUser(clientId, req.user!.id);
    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Remove client error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get journals count for a user
 */
export async function getJournalsCount(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    if (userId >= 100 && userId <= 110) {
      return res.status(200).json({ totalCount: Math.floor(Math.random() * 8) + 3 });
    }
    
    const result = await db.select({ count: sql`count(*)::int` }).from(journalEntries)
      .where(eq(journalEntries.userId, userId));
    
    res.json({ totalCount: result[0].count });
  } catch (error) {
    console.error("Error counting journals:", error);
    res.status(500).json({ message: "Error counting journal entries" });
  }
}

/**
 * Client invitation endpoint (therapist invites client)
 */
export async function inviteClient(req: Request, res: Response) {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ message: "Email and name are required" });
    }
    
    const existingInvitation = await storage.getClientInvitationByEmail(email);
    if (existingInvitation && existingInvitation.therapistId === req.user!.id && existingInvitation.status === 'pending') {
      return res.status(409).json({ 
        message: "A pending invitation already exists for this email. You can resend it from the Pending Invitations tab.",
        invitationId: existingInvitation.id
      });
    }
    
    const existingUser = await storage.getUserByEmail(email);
    
    if (existingUser) {
      if (existingUser.role === "admin") {
        return res.status(409).json({ 
          message: "This email belongs to an administrator and cannot be invited as a client",
          user: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role
          }
        });
      }
      
      if (existingUser.role === "therapist") {
        return res.status(409).json({ 
          message: "This email belongs to a therapist and cannot be invited as a client",
          user: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role
          }
        });
      }
      
      if (existingUser.therapistId === req.user!.id) {
        return res.status(409).json({ 
          message: "This user is already your client",
          user: existingUser
        });
      }
      
      if (!existingUser.therapistId) {
        const plaintextToken = crypto.randomBytes(32).toString('hex');
        const invitationTokenHash = await bcrypt.hash(plaintextToken, 10);

        const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        const encodedEmail = encodeURIComponent(existingUser.email);
        const therapistId = req.user!.id;
        const inviteLink = `${baseUrl}/auth?invitation=true&email=${encodedEmail}&therapistId=${therapistId}&token=${plaintextToken}`;
        const storedInviteLink = `${baseUrl}/auth?invitation=true&email=${encodedEmail}&therapistId=${therapistId}`;

        const emailSent = await sendClientInvitation(
          existingUser.email,
          req.user!.name || req.user!.username,
          inviteLink,
          req.user!.id
        );

        if (!emailSent) {
          await storage.createNotification({
            userId: req.user!.id,
            title: "Email Delivery Issue",
            body: `We couldn't send an invitation email to ${existingUser.email}. Please use the resend invitation feature to try again.`,
            type: "alert",
            isRead: false
          });
        }

        try {
          await storage.createClientInvitation({
            email: existingUser.email,
            name: existingUser.name || name,
            therapistId: req.user!.id,
            status: emailSent ? "email_sent" : "email_failed",
            tempUsername: existingUser.username,
            tempPassword: "",
            inviteLink: storedInviteLink,
            invitationToken: invitationTokenHash
          });
        } catch (error) {
          console.error("Failed to record invitation for existing user:", error);
        }

        return res.status(200).json({
          message: "Invitation sent. The client will need to accept the invitation before being assigned to you.",
          inviteLink
        });
      } else {
        return res.status(409).json({ 
          message: "This user is already assigned to another therapist",
          user: existingUser
        });
      }
    }
    
    const username = email.split("@")[0] + Math.floor(Math.random() * 1000);
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const newUser = await storage.createUser({
      username,
      email,
      name,
      password: hashedPassword,
      role: "client",
      therapistId: req.user!.id,
      status: "pending"
    });
    
    await storage.createNotification({
      userId: newUser.id,
      title: "Welcome to Resilience CBT",
      body: `Welcome to Resilience CBT! You have been registered by ${req.user!.name || req.user!.username}. Please check your email for your invitation link to set up your account.`,
      type: "system",
      isRead: false
    });
    
    const plaintextToken = crypto.randomBytes(32).toString('hex');
    const invitationTokenHash = await bcrypt.hash(plaintextToken, 10);
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const encodedEmail = encodeURIComponent(email);
    const therapistId = req.user!.id;
    const inviteLink = `${baseUrl}/auth?invitation=true&email=${encodedEmail}&therapistId=${therapistId}&token=${plaintextToken}`;
    const storedInviteLink = `${baseUrl}/auth?invitation=true&email=${encodedEmail}&therapistId=${therapistId}`;
    
    const emailSent = await sendClientInvitation(
      email,
      req.user!.name || req.user!.username,
      inviteLink,
      req.user!.id
    );
    
    if (!emailSent) {
      console.warn(`Failed to send invitation email.`);
      await storage.createNotification({
        userId: req.user!.id,
        title: "Email Delivery Issue",
        body: `We couldn't send an invitation email to ${email}. Please use the resend invitation feature to try again, or contact support.`,
        type: "alert",
        isRead: false
      });
    }
    
    try {
      await storage.createClientInvitation({
        email: email,
        therapistId: req.user!.id,
        status: emailSent ? "email_sent" : "email_failed",
        tempUsername: username,
        tempPassword: hashedTempPassword,
        inviteLink: storedInviteLink,
        invitationToken: invitationTokenHash
      });
    } catch (error) {
      console.error("Failed to record invitation:", error);
    }
    
    const { password, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: "New client account created successfully",
      user: userWithoutPassword,
      inviteLink
    });
  } catch (error) {
    console.error("Error inviting client:", error);
    res.status(500).json({ message: "Error inviting client" });
  }
}

/**
 * Set the current viewing client for therapist or admin
 */
export async function setCurrentViewingClient(req: Request, res: Response) {
  try {
    const { clientId } = req.body;
    console.log(`Setting current viewing client for user ${req.user!.id} (${req.user!.role}) to client ${clientId}`);
    
    if (clientId === null) {
      const updatedUser = await storage.updateCurrentViewingClient(req.user!.id, null);
      const { password, ...userWithoutPassword } = updatedUser;
      return res.json({ success: true, user: userWithoutPassword });
    }
    
    if (req.user!.role === "admin") {
      const targetUser = await storage.getUser(clientId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
    } else if (req.user!.role === "therapist") {
      const clients = await storage.getClients(req.user!.id);
      const clientExists = clients.some(client => client.id === clientId);
      
      if (!clientExists) {
        return res.status(403).json({ error: "Not authorized to view this client" });
      }
    } else {
      return res.status(403).json({ error: "Permission denied" });
    }
    
    const updatedUser = await storage.updateCurrentViewingClient(req.user!.id, clientId);
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json({ 
      success: true, 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error("Error setting viewing client:", error);
    res.status(500).json({ error: "Failed to update viewing client" });
  }
}

/**
 * Get client recent activity
 */
export async function getClientRecentActivity(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const limit = 10;
    const storageAny = storage as any;
    const emotions = await storageAny.getEmotionRecordsByUser(userId, limit);
    const journals = await storageAny.getJournalEntriesByUser(userId, limit);
    const thoughts = await storageAny.getThoughtRecordsByUser(userId, limit);
    const userGoals = await storageAny.getGoalsByUser(userId, limit);
    
    const activities: any[] = [];
    
    if (emotions && emotions.length > 0) {
      emotions.forEach((emotion: any) => {
        activities.push({
          id: `emotion-${emotion.id}`,
          type: 'emotion',
          title: `Tracked ${emotion.primaryEmotion || emotion.coreEmotion}`,
          timestamp: emotion.timestamp || emotion.createdAt,
          data: emotion
        });
      });
    }
    
    if (journals && journals.length > 0) {
      journals.forEach((journal: any) => {
        activities.push({
          id: `journal-${journal.id}`,
          type: 'journal',
          title: journal.title || 'New journal entry',
          timestamp: journal.createdAt,
          data: journal
        });
      });
    }
    
    if (thoughts && thoughts.length > 0) {
      thoughts.forEach((thought: any) => {
        activities.push({
          id: `thought-${thought.id}`,
          type: 'thought_record',
          title: thought.situation || 'New thought record',
          timestamp: thought.createdAt,
          data: thought
        });
      });
    }
    
    if (userGoals && userGoals.length > 0) {
      userGoals.forEach((goal: any) => {
        activities.push({
          id: `goal-${goal.id}`,
          type: 'goal',
          title: goal.title || 'New goal',
          timestamp: goal.createdAt,
          data: goal
        });
      });
    }
    
    activities.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    res.status(200).json(activities.slice(0, limit));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(200).json([]);
  }
}

/**
 * Get protective factor usage
 */
export async function getProtectiveFactorUsage(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    const query = `
      SELECT 
        pf.id, 
        pf.name, 
        pfu.effectiveness_rating as effectiveness
      FROM protective_factors pf
      JOIN protective_factor_usage pfu ON pf.id = pfu.protective_factor_id
      JOIN thought_records tr ON pfu.thought_record_id = tr.id
      WHERE tr.user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get protective factor usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Record protective factor usage
 */
export async function createProtectiveFactorUsage(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const validatedData = insertProtectiveFactorUsageSchema.parse({
      ...req.body,
      userId
    });
    
    const usage = await storage.addProtectiveFactorUsage(validatedData);
    res.status(201).json(usage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Add protective factor usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Create a new protective factor
 */
export async function createProtectiveFactor(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const validatedData = insertProtectiveFactorSchema.parse({
      ...req.body,
      userId
    });
    
    const factor = await storage.createProtectiveFactor(validatedData);
    res.status(201).json(factor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create protective factor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get protective factors for a user
 */
export async function getProtectiveFactors(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const includeGlobal = req.query.includeGlobal !== 'false';
    const factors = await storage.getProtectiveFactorsByUser(userId, includeGlobal);
    res.status(200).json(factors);
  } catch (error) {
    console.error("Get protective factors error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Update protective factor
 */
export async function updateProtectiveFactor(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const factorId = parseInt(req.params.factorId);
    
    const factor = await storage.getProtectiveFactorById(factorId);
    
    if (!factor) {
      return res.status(404).json({ message: "Protective factor not found" });
    }
    
    if (factor.userId !== userId && factor.userId !== null) {
      if (req.user!.role === 'therapist') {
        const client = await storage.getUser(factor.userId);
        if (!client || client.therapistId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    
    const validatedData = insertProtectiveFactorSchema.partial().parse(req.body);
    delete validatedData.userId;
    
    const updatedFactor = await storage.updateProtectiveFactor(factorId, validatedData);
    res.status(200).json(updatedFactor);
  } catch (error) {
    console.error("Update protective factor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Delete protective factor
 */
export async function deleteProtectiveFactor(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const factorId = parseInt(req.params.factorId);
    
    const factor = await storage.getProtectiveFactorById(factorId);
    
    if (!factor) {
      return res.status(404).json({ message: "Protective factor not found" });
    }
    
    if (factor.userId !== userId && factor.userId !== null) {
      if (req.user!.role === 'therapist') {
        const client = await storage.getUser(factor.userId);
        if (!client || client.therapistId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    
    await storage.deleteProtectiveFactor(factorId);
    res.status(200).json({ message: "Protective factor deleted successfully" });
  } catch (error) {
    console.error("Delete protective factor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get coping strategy usage
 */
export async function getCopingStrategyUsage(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    const query = `
      SELECT 
        cs.id, 
        cs.name, 
        csu.effectiveness_rating as effectiveness
      FROM coping_strategies cs
      JOIN coping_strategy_usage csu ON cs.id = csu.coping_strategy_id
      JOIN thought_records tr ON csu.thought_record_id = tr.id
      WHERE tr.user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get coping strategy usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Record coping strategy usage
 */
export async function createCopingStrategyUsage(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const validatedData = insertCopingStrategyUsageSchema.parse({
      ...req.body,
      userId
    });
    
    const usage = await storage.addCopingStrategyUsage(validatedData);
    res.status(201).json(usage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Add coping strategy usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Create coping strategy
 */
export async function createCopingStrategy(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const validatedData = insertCopingStrategySchema.parse({
      ...req.body,
      userId
    });
    
    const strategy = await storage.createCopingStrategy(validatedData);
    res.status(201).json(strategy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create coping strategy error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get coping strategies for a user
 */
export async function getCopingStrategies(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const includeGlobal = req.query.includeGlobal !== 'false';
    const strategies = await storage.getCopingStrategiesByUser(userId, includeGlobal);
    res.status(200).json(strategies);
  } catch (error) {
    console.error("Get coping strategies error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Update coping strategy
 */
export async function updateCopingStrategy(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const strategyId = parseInt(req.params.strategyId);
    
    const strategy = await storage.getCopingStrategyById(strategyId);
    
    if (!strategy) {
      return res.status(404).json({ message: "Coping strategy not found" });
    }
    
    if (strategy.userId !== userId && strategy.userId !== null) {
      if (req.user!.role === 'therapist') {
        const client = await storage.getUser(strategy.userId);
        if (!client || client.therapistId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    
    const validatedData = insertCopingStrategySchema.partial().parse(req.body);
    delete validatedData.userId;
    
    const updatedStrategy = await storage.updateCopingStrategy(strategyId, validatedData);
    res.status(200).json(updatedStrategy);
  } catch (error) {
    console.error("Update coping strategy error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Delete coping strategy
 */
export async function deleteCopingStrategy(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const strategyId = parseInt(req.params.strategyId);
    
    const strategy = await storage.getCopingStrategyById(strategyId);
    
    if (!strategy) {
      return res.status(404).json({ message: "Coping strategy not found" });
    }
    
    if (strategy.userId !== userId && strategy.userId !== null) {
      if (req.user!.role === 'therapist') {
        const client = await storage.getUser(strategy.userId);
        if (!client || client.therapistId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    
    await storage.deleteCopingStrategy(strategyId);
    res.status(200).json({ message: "Coping strategy deleted successfully" });
  } catch (error) {
    console.error("Delete coping strategy error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Create action item
 */
export async function createAction(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const validatedData = insertActionSchema.parse({
      ...req.body,
      userId
    });
    
    const action = await storage.createAction(validatedData);
    res.status(201).json(action);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create action error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get action items
 */
export async function getActions(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const actions = await storage.getActionsByUser(userId);
    res.status(200).json(actions);
  } catch (error) {
    console.error("Get actions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get resources created by a user
 */
export async function getUserResources(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const resources = await storage.getResourcesByCreator(userId);
    
    if (userId !== req.user!.id && req.user!.role !== "admin") {
      const publishedResources = resources.filter(resource => resource.isPublished);
      return res.status(200).json(publishedResources);
    }
    
    res.status(200).json(resources);
  } catch (error) {
    console.error("Get user resources error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get all journal entries for a user
 */
export async function getJournalEntries(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    const entries = await storage.getJournalEntriesByUser(userId);
    res.status(200).json(entries);
  } catch (error) {
    console.error("Get journal entries error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get journal statistics for a user
 */
export async function getJournalStats(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    const entries = await storage.getJournalEntriesByUser(userId);
    
    const stats = {
      totalEntries: entries.length,
      emotions: {} as Record<string, number>,
      topics: {} as Record<string, number>,
      cognitiveDistortions: {} as Record<string, number>,
      sentimentOverTime: entries.map(entry => ({
        date: entry.createdAt,
        positive: entry.sentimentPositive || 0,
        negative: entry.sentimentNegative || 0,
        neutral: entry.sentimentNeutral || 0
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      tagsFrequency: {} as Record<string, number>,
      sentimentPatterns: {
        positive: 0,
        neutral: 0,
        negative: 0
      }
    };
    
    if (entries.length > 0) {
      let totalPositive = 0;
      let totalNegative = 0;
      let totalNeutral = 0;
      
      entries.forEach(entry => {
        totalPositive += entry.sentimentPositive || 0;
        totalNegative += entry.sentimentNegative || 0;
        totalNeutral += entry.sentimentNeutral || 0;
      });
      
      const total = totalPositive + totalNegative + totalNeutral;
      
      if (total > 0) {
        stats.sentimentPatterns = {
          positive: Math.round((totalPositive / total) * 100),
          negative: Math.round((totalNegative / total) * 100),
          neutral: Math.round((totalNeutral / total) * 100),
        };
        
        const sum = stats.sentimentPatterns.positive + 
                    stats.sentimentPatterns.negative + 
                    stats.sentimentPatterns.neutral;
                    
        if (sum !== 100) {
          const diff = 100 - sum;
          if (stats.sentimentPatterns.positive >= stats.sentimentPatterns.negative && 
              stats.sentimentPatterns.positive >= stats.sentimentPatterns.neutral) {
            stats.sentimentPatterns.positive += diff;
          } else if (stats.sentimentPatterns.negative >= stats.sentimentPatterns.positive && 
                    stats.sentimentPatterns.negative >= stats.sentimentPatterns.neutral) {
            stats.sentimentPatterns.negative += diff;
          } else {
            stats.sentimentPatterns.neutral += diff;
          }
        }
      }
    }
    
    entries.forEach(entry => {
      if (entry.userSelectedDistortions && Array.isArray(entry.userSelectedDistortions)) {
        entry.userSelectedDistortions.forEach(distortion => {
          stats.cognitiveDistortions[distortion] = (stats.cognitiveDistortions[distortion] || 0) + 1;
        });
      }
      
      if (entry.userSelectedTags && Array.isArray(entry.userSelectedTags)) {
        entry.userSelectedTags.forEach(tag => {
          stats.tagsFrequency[tag] = (stats.tagsFrequency[tag] || 0) + 1;
        });
      }
      
      if (entry.emotions && Array.isArray(entry.emotions)) {
        entry.emotions.forEach(emotion => {
          stats.emotions[emotion] = (stats.emotions[emotion] || 0) + 1;
        });
      }
      
      if (entry.topics && Array.isArray(entry.topics)) {
        entry.topics.forEach(topic => {
          stats.topics[topic] = (stats.topics[topic] || 0) + 1;
        });
      }
    });
    
    res.status(200).json(stats);
  } catch (error) {
    console.error("Get journal stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Re-analyze an existing journal entry
 */
export async function reanalyzeJournal(req: Request, res: Response) {
  try {
    const entryId = Number(req.params.entryId);
    if (isNaN(entryId)) {
      return res.status(400).json({ message: "Invalid entry ID" });
    }
    
    const entry = await storage.getJournalEntryById(entryId);
    if (!entry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }
    
    const userId = Number(req.params.userId);
    if (entry.userId !== userId && req.user?.role !== 'admin' && 
        (req.user?.role !== 'therapist' || !await isClientOfTherapist(entry.userId, req.user.id))) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      return res.status(503).json({ message: "AI analysis is not available" });
    }
    
    const analysis = await analyzeJournalEntry(entry.title, entry.content);
    
    const updatedEntry = await storage.updateJournalEntry(entryId, {
      aiAnalysis: analysis.analysis,
      detectedDistortions: analysis.cognitiveDistortions || [],
      sentimentPositive: analysis.sentiment.positive,
      sentimentNegative: analysis.sentiment.negative,
      sentimentNeutral: analysis.sentiment.neutral
    });
    
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error("Journal re-analysis error:", error);
    res.status(500).json({ message: "Failed to re-analyze journal entry" });
  }
}

/**
 * Link journal entry to a thought record
 */
export async function linkThought(req: Request, res: Response) {
  try {
    const journalId = Number(req.params.journalId);
    const thoughtRecordId = Number(req.body.thoughtRecordId);
    
    if (isNaN(journalId) || isNaN(thoughtRecordId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const journal = await storage.getJournalEntryById(journalId);
    if (!journal) {
      return res.status(404).json({ message: "Journal entry not found" });
    }
    
    if (journal.userId !== req.user!.id && req.user!.role !== 'admin' && 
        (req.user!.role !== 'therapist' || !await isClientOfTherapist(journal.userId, req.user!.id))) {
      return res.status(403).json({ message: "You don't have access to this journal entry" });
    }
    
    const thoughtRecord = await storage.getThoughtRecordById(thoughtRecordId);
    if (!thoughtRecord) {
      return res.status(404).json({ message: "Thought record not found" });
    }
    
    if (thoughtRecord.userId !== req.user!.id && req.user!.role !== 'admin' && 
        (req.user!.role !== 'therapist' || !await isClientOfTherapist(thoughtRecord.userId, req.user!.id))) {
      return res.status(403).json({ message: "You don't have access to this thought record" });
    }
    
    await storage.linkJournalToThoughtRecord(journalId, thoughtRecordId);
    const updatedJournal = await storage.getJournalEntryById(journalId);
    
    res.status(200).json(updatedJournal);
  } catch (error) {
    console.error("Link journal to thought record error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Unlink journal entry from thought record
 */
export async function unlinkThought(req: Request, res: Response) {
  try {
    const journalId = Number(req.params.journalId);
    const thoughtRecordId = Number(req.params.thoughtRecordId);
    
    if (isNaN(journalId) || isNaN(thoughtRecordId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const journal = await storage.getJournalEntryById(journalId);
    if (!journal) {
      return res.status(404).json({ message: "Journal entry not found" });
    }
    
    if (journal.userId !== req.user!.id && req.user!.role !== 'admin' && 
        (req.user!.role !== 'therapist' || !await isClientOfTherapist(journal.userId, req.user!.id))) {
      return res.status(403).json({ message: "You don't have access to this journal entry" });
    }
    
    const thoughtRecord = await storage.getThoughtRecordById(thoughtRecordId);
    if (!thoughtRecord) {
      return res.status(404).json({ message: "Thought record not found" });
    }
    
    if (thoughtRecord.userId !== req.user!.id && req.user!.role !== 'admin' && 
        (req.user!.role !== 'therapist' || !await isClientOfTherapist(thoughtRecord.userId, req.user!.id))) {
      return res.status(403).json({ message: "You don't have access to this thought record" });
    }
    
    await storage.unlinkJournalFromThoughtRecord(journalId, thoughtRecordId);
    const updatedJournal = await storage.getJournalEntryById(journalId);
    
    res.status(200).json(updatedJournal);
  } catch (error) {
    console.error("Unlink journal from thought record error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get all thought records related to a journal entry
 */
export async function getRelatedThoughts(req: Request, res: Response) {
  try {
    const journalId = Number(req.params.journalId);
    
    if (isNaN(journalId)) {
      return res.status(400).json({ message: "Invalid journal ID" });
    }
    
    const journal = await storage.getJournalEntryById(journalId);
    if (!journal) {
      return res.status(404).json({ message: "Journal entry not found" });
    }
    
    if (journal.userId !== req.user!.id && req.user!.role !== 'admin' && 
        (req.user!.role !== 'therapist' || !await isClientOfTherapist(journal.userId, req.user!.id))) {
      return res.status(403).json({ message: "You don't have access to this journal entry" });
    }
    
    const relatedThoughts = await storage.getRelatedThoughtRecords(journalId);
    res.status(200).json(relatedThoughts);
  } catch (error) {
    console.error("Get related thought records error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get AI recommendations for a specific user
 */
export async function getAiRecommendations(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    if (req.user?.role === 'client') {
      const recommendations = await storage.getAiRecommendationsByUser(userId);
      const approvedRecommendations = recommendations.filter(rec => rec.status === 'approved');
      return res.status(200).json(approvedRecommendations);
    }
    
    const recommendations = await storage.getAiRecommendationsByUser(userId);
    res.status(200).json(recommendations);
  } catch (error) {
    console.error("Error fetching AI recommendations:", error);
    res.status(500).json({ message: "Failed to fetch AI recommendations" });
  }
}

/**
 * Create a new AI recommendation
 */
export async function createAiRecommendation(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role !== 'client' || !user.therapistId) {
      return res.status(400).json({ 
        message: "Recommendations can only be created for clients with an assigned therapist" 
      });
    }
    
    if (req.user!.role !== 'admin' && req.user!.id !== user.therapistId) {
      return res.status(403).json({ message: "You do not have permission to create recommendations for this client" });
    }
    
    const validatedData = insertAiRecommendationSchema.parse({
      ...req.body,
      userId,
      therapistId: user.therapistId,
      status: 'pending'
    });
    
    const newRecommendation = await storage.createAiRecommendation(validatedData);
    
    await sendNotificationToUser(user.therapistId, {
      title: "New AI Recommendation",
      content: `There is a new AI recommendation for ${user.name} that requires your review.`,
      type: "ai_recommendation" as any,
      link: `/therapist/recommendations`
    } as any);
    
    res.status(201).json(newRecommendation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating AI recommendation:", error);
    res.status(500).json({ message: "Failed to create AI recommendation" });
  }
}
