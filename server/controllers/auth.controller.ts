import { Request, Response } from "express";
import { z } from "zod";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { eq, and, gt, inArray } from "drizzle-orm";
import { storage } from "../storage";
import { db } from "../db";
import { insertUserSchema, clientInvitations, passwordResetTokens, users } from "@shared/schema";
import { getSessionCookieOptions } from "../middleware/auth";
import { sendPasswordResetEmail, sendEmail, sendProfessionalWelcomeEmail, sendClientInvitation } from "../services/email";

/**
 * Get a safe base URL for link generation to prevent Host-Header poisoning
 */
function getSafeBaseUrl(req: Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.trim();
  }
  
  if (process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(',')[0]?.trim();
    if (domain) return `https://${domain}`;
  }
  
  const host = req.get('host') || '';
  
  // Validate host format to ensure no malicious injections
  if (!host || !/^[a-zA-Z0-9.-]+(:\d+)?$/.test(host)) {
    throw new Error("Invalid Host header");
  }
  
  const isDev = process.env.NODE_ENV !== 'production';
  const isLocal = /^localhost(:\d+)?$/.test(host) || /^127\.0\.0\.1(:\d+)?$/.test(host);
  
  if (isDev && isLocal) {
    return `${req.protocol}://${host}`;
  }
  
  if (process.env.ALLOWED_HOSTS) {
    const allowedHosts = process.env.ALLOWED_HOSTS.split(',').map(h => h.trim().toLowerCase());
    const hostname = host.split(':')[0].toLowerCase();
    if (allowedHosts.includes(hostname)) {
      return `${req.protocol}://${host}`;
    }
  }
  
  // Safety Fallback for Production to block arbitrary host routing
  console.error(`🚨 Host-Header Poisoning Blocked: Incoming Host '${host}' is unverified and APP_URL is missing. Defaulting to localhost fallback.`);
  return `http://localhost:5000`;
}

/**
 * Handle user registration (direct or via invitation)
 */
export async function registerUser(req: Request, res: Response) {
  try {
    const validatedData = insertUserSchema.parse(req.body);

    // Unified invitation detection: strict check on both body and query to avoid truthy-bypass attacks
    const isInvitation = req.body.isInvitation === true || req.query.invitation === "true";
    
    // Check if user already exists by username
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }
    
    // Check if email exists
    const existingEmail = await storage.getUserByEmail(validatedData.email);

    // Look up pending invitation for this email once
    const invitationForEmail = await storage.getClientInvitationByEmail(validatedData.email);
    const hasPendingInvitation = !!(invitationForEmail &&
      (invitationForEmail.status === 'pending' || invitationForEmail.status === 'email_sent' || invitationForEmail.status === 'email_failed'));

    // Fail-closed: any invitation signal (body, query, or pending invitation on email) requires
    // a valid one-time token. This prevents both unauthenticated claim and truthy-bypass attacks.
    if (isInvitation || hasPendingInvitation) {
      if (!hasPendingInvitation || !invitationForEmail!.invitationToken) {
        return res.status(403).json({ message: "Invalid or expired invitation. Please request a new invitation link." });
      }
      // Enforce expiry: reject if the invitation has passed its expiry date
      if (invitationForEmail!.expiresAt && new Date() > new Date(invitationForEmail!.expiresAt)) {
        return res.status(403).json({ message: "This invitation has expired. Please ask your therapist to send a new invitation." });
      }
      const providedToken = req.body.invitationToken as string | undefined;
      if (!providedToken) {
        return res.status(403).json({ message: "Invitation token is required. Please use the link sent to your email." });
      }
      const tokenValid = await bcrypt.compare(providedToken, invitationForEmail!.invitationToken);
      if (!tokenValid) {
        return res.status(403).json({ message: "Invalid invitation token. Please use the original link sent to your email." });
      }
      // Token verified — force client role, therapist assignment, and active status unconditionally
      validatedData.role = "client";
      validatedData.therapistId = invitationForEmail!.therapistId;
      validatedData.status = "active";
      console.log(`🔒 INVITATION REGISTRATION (token verified): client for therapist ${validatedData.therapistId}`);
    }

    // If this is an invitation and the email exists, handle based on account status
    if (existingEmail) {
      if ((isInvitation || hasPendingInvitation) && existingEmail.status === "pending") {
        console.log(`Invitation acceptance: Updating existing pending user ${existingEmail.id} with new credentials`);
        
        // Update the existing user with the new username and password
        const updatedUser = await storage.updateUser(existingEmail.id, {
          username: validatedData.username,
          password: validatedData.password,
          status: "active"
        });

        // Mark the invitation as accepted and clear the one-time token hash (one-time use)
        if (invitationForEmail) {
          try {
            await db
              .update(clientInvitations)
              .set({ status: 'accepted', acceptedAt: new Date(), invitationToken: null })
              .where(eq(clientInvitations.id, invitationForEmail.id));
          } catch (invErr) {
            console.error('Error marking invitation accepted:', invErr);
          }
        }
        
        // Create a session
        const session = await storage.createSession(updatedUser.id);
        
        // Set the session cookie using our standardized cookie options
        res.cookie("sessionId", session.id, getSessionCookieOptions());
        
        // Return the user (without password)
        const { password, ...userWithoutPassword } = updatedUser;
        return res.status(200).json(userWithoutPassword);
      } else if ((isInvitation || hasPendingInvitation) && existingEmail.status === "active" && invitationForEmail) {
        // Existing active user accepting a therapist invitation:
        // The token has already been verified above. Link the therapist and mark the invitation accepted.
        console.log(`Invitation acceptance: Linking existing active user ${existingEmail.id} to therapist ${invitationForEmail.therapistId}`);
        
        const updatedUser = await storage.updateUser(existingEmail.id, {
          therapistId: invitationForEmail.therapistId
        });

        // Mark the invitation as accepted and clear the one-time token hash
        try {
          await db
            .update(clientInvitations)
            .set({ status: 'accepted', acceptedAt: new Date(), invitationToken: null })
            .where(eq(clientInvitations.id, invitationForEmail.id));
        } catch (invErr) {
          console.error('Error marking invitation accepted for active user:', invErr);
        }

        // Notify the client
        await storage.createNotification({
          userId: existingEmail.id,
          title: "Therapist Assignment Accepted",
          body: `You have been successfully linked to your new therapist. Welcome to the team!`,
          type: "system",
          isRead: false
        });

        // Create a session so the user is logged in after accepting
        const session = await storage.createSession(updatedUser.id);
        res.cookie("sessionId", session.id, getSessionCookieOptions());

        const { password, ...userWithoutPassword } = updatedUser;
        return res.status(200).json(userWithoutPassword);
      } else {
        return res.status(409).json({ message: "Email already exists" });
      }
    }
    
    // When users register directly (no invitation), they are automatically active
    if (!isInvitation && !hasPendingInvitation) {
      validatedData.status = "active";
      // Strip sensitive fields: public self-registration must always produce a plain client account.
      // role, therapistId, and any subscription/billing fields must not be caller-controlled.
      validatedData.role = "client";
      validatedData.therapistId = undefined;
      validatedData.stripeCustomerId = undefined;
      validatedData.stripeSubscriptionId = undefined;
      validatedData.subscriptionPlanId = undefined;
      validatedData.subscriptionStatus = undefined;
    }
    
    // Create the user
    const user = await storage.createUser(validatedData);
    
    console.log(`User created successfully: id=${user.id} role=${user.role}`);
    
    // SAFETY CHECK: If this was an invitation registration but therapistId is missing, fix it
    if (isInvitation && !user.therapistId && validatedData.therapistId) {
      console.log(`🚨 FIXING MISSING THERAPIST CONNECTION: Setting therapist ${validatedData.therapistId} for user ${user.id}`);
      await storage.updateUser(user.id, { therapistId: validatedData.therapistId });
      user.therapistId = validatedData.therapistId;
    }
    
    // AUTOMATIC CLEANUP: Mark any pending invitations for this email as accepted
    if (user.email && user.therapistId) {
      try {
        // Update invitation status from pending to accepted and clear the one-time token hash
        await db
          .update(clientInvitations)
          .set({ status: 'accepted', acceptedAt: new Date(), invitationToken: null })
          .where(and(
            eq(clientInvitations.email, user.email),
            eq(clientInvitations.therapistId, user.therapistId),
            inArray(clientInvitations.status, ['pending', 'email_sent', 'email_failed'])
          ));
        console.log(`Automatically marked invitation as accepted for user ${user.id} with therapist ${user.therapistId}`);
      } catch (invitationError) {
        console.error('Error updating invitation status:', invitationError);
      }
    }
    
    // Log the registration with therapist information
    if (validatedData.therapistId) {
      console.log(`User ${user.id} registered with therapist ID: ${validatedData.therapistId}`);
      
      // If therapistId is provided, create a notification for the therapist
      const therapist = await storage.getUser(validatedData.therapistId);
      if (therapist) {
        await storage.createNotification({
          userId: therapist.id,
          title: "New Client Registration",
          body: `${user.name} has registered as your client.`,
          type: "system",
          isRead: false
        });
      }
    }
    
    // Create a session
    const session = await storage.createSession(user.id);
    
    // Set the session cookie using our standardized cookie options
    res.cookie("sessionId", session.id, getSessionCookieOptions());
    
    // Create a welcome notification for the new user
    await storage.createNotification({
      userId: user.id,
      title: "Welcome to Resilience CBT",
      body: "Thank you for joining. Start your journey by tracking your emotions or setting your first goal.",
      type: "system",
      isRead: false
    });
    
    // If the user is a therapist, automatically assign them to the default (Free) subscription plan
    if (validatedData.role && validatedData.role === "therapist") {
      try {
        console.log(`Processing subscription plan for new therapist: ${user.id}`);
        
        // Get the default subscription plan (Free plan)
        const defaultPlan = await storage.getDefaultSubscriptionPlan();
        
        if (defaultPlan) {
          console.log(`Found default subscription plan: ${defaultPlan.id} (${defaultPlan.name})`);
          
          // Assign the plan to the therapist
          const updatedUser = await storage.assignSubscriptionPlan(user.id, defaultPlan.id);
          console.log(`Plan assignment result:`, JSON.stringify({
            userId: updatedUser.id,
            subscriptionPlanId: updatedUser.subscriptionPlanId
          }));
          
          // Update subscription status to trial since this is the Free plan
          const userWithStatus = await storage.updateSubscriptionStatus(user.id, "trial");
          console.log(`Subscription status update result:`, JSON.stringify({
            userId: userWithStatus.id,
            subscriptionStatus: userWithStatus.subscriptionStatus
          }));
          
          console.log(`Successfully assigned default subscription plan (${defaultPlan.name}) to therapist ${user.id}`);
          
          // Send welcome email to the new therapist
          try {
            const loginUrl = `${req.protocol}://${req.get('host')}/login`;
            
            // Create a custom message for self-registered therapists
            const subject = 'Welcome to ResilienceHub - Your Account Information';
            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4A6FA5;">Welcome to ResilienceHub</h1>
                <p>Hello ${user.name || user.username},</p>
                <p>Thank you for registering as a mental health professional on the ResilienceHub platform. This platform will help you manage your clients with tools for emotion tracking, thought records, journaling, and goal setting.</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4A6FA5;">
                  <h2 style="color: #4A6FA5; margin-top: 0; font-size: 18px;">Your Account Details:</h2>
                  <p><strong>Username:</strong> ${user.username}</p>
                  <p><strong>Subscription Plan:</strong> Free (60-day trial)</p>
                </div>
                
                <div style="margin: 30px 0;">
                  <a href="${loginUrl}" style="background-color: #4A6FA5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Log In Now
                  </a>
                </div>
                
                <h2 style="color: #4A6FA5; margin-top: 25px; font-size: 18px;">Getting Started:</h2>
                <ol style="margin-bottom: 25px;">
                  <li><strong>Complete your profile</strong> in your account settings</li>
                  <li><strong>Invite clients</strong> from your dashboard</li>
                  <li><strong>Explore the resource library</strong> with therapeutic materials</li>
                </ol>
                
                <p>If you have any questions or need assistance, please contact our support team.</p>
                <p>Best regards,<br>The Resilience CBT Team</p>
              </div>
            `;
            
            const emailSent = await sendEmail({
              to: user.email,
              subject,
              html,
            });
            
            console.log(`Welcome email to therapist ${user.id}: ${emailSent ? 'Sent successfully' : 'Failed to send'}`);
          } catch (emailError) {
            console.error(`Error sending welcome email to therapist ${user.id}:`, emailError);
          }
        } else {
          console.warn("No default subscription plan found for new therapist");
        }
      } catch (planError) {
        console.error("Error assigning default subscription plan:", planError);
      }
    }
    
    // Return the user (without password)
    const { password, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Handle inviting a client
 */
export async function inviteClient(req: Request, res: Response) {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ message: "Email and name are required" });
    }
    
    // Check if email is already registered as an active user
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      if (existingUser.status === 'active') {
        return res.status(409).json({ message: "Email already registered" });
      }
    }
    
    // Check if there's already a pending invitation for this email
    const existingInvitation = await storage.getClientInvitationByEmail(email);
    if (existingInvitation && (existingInvitation.status === 'pending' || existingInvitation.status === 'email_sent')) {
      return res.status(409).json({ message: "Invitation already pending for this email" });
    }
    
    // Generate secure invitation token
    const plaintextToken = crypto.randomBytes(32).toString('hex');
    const invitationTokenHash = await bcrypt.hash(plaintextToken, 10);
    const tempUsername = email.split('@')[0] + Math.floor(Math.random() * 1000);
    const tempPassword = Math.random().toString(36).substring(2, 10);
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
    
    const baseUrl = getSafeBaseUrl(req);
    const inviteLink = `${baseUrl}/auth?invitation=true&email=${encodeURIComponent(email)}&therapistId=${req.user!.id}&token=${plaintextToken}`;
    const storedInviteLink = `${baseUrl}/auth?invitation=true&email=${encodeURIComponent(email)}&therapistId=${req.user!.id}`;
    
    // Create the invitation
    await storage.createClientInvitation({
      email,
      therapistId: req.user!.id,
      tempUsername,
      tempPassword: hashedTempPassword,
      inviteLink: storedInviteLink,
      status: 'pending',
      invitationToken: invitationTokenHash
    });
    
    // Send email invitation
    const therapistName = req.user!.name || req.user!.username;
    const emailSent = await sendClientInvitation(email, therapistName, inviteLink);
    
    // Create notification for therapist
    await storage.createNotification({
      userId: req.user!.id,
      title: "Client Invitation Sent",
      body: `Invitation sent to ${email} (${name})`,
      type: "system",
      isRead: false
    });
    
    res.status(201).json({ 
      message: "Invitation sent successfully",
      emailSent 
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ message: "Failed to create invitation" });
  }
}

/**
 * Request password reset link (forgot password)
 */
export async function requestForgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    
    // For security, don't reveal if the email exists or not
    if (!user) {
      console.log(`Password reset requested for non-existent account`);
      return res.status(200).json({
        success: true,
        message: "If your email is in our system, you will receive a password reset link."
      });
    }
    
    // Generate unique token
    const plaintextToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(plaintextToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
    
    // Delete existing reset tokens
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
    
    // Save the new token (hashed at rest)
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: hashedToken,
      expiresAt,
      used: false
    });
    
    // Build reset URL
    const baseUrl = getSafeBaseUrl(req);
    const resetUrl = `${baseUrl}/reset-password/${plaintextToken}`;
    
    // Send reset email
    console.log(`[PasswordReset] Sending reset email to ${user.email}, URL domain: ${baseUrl}`);
    const emailSent = await sendPasswordResetEmail(user.email, resetUrl);
    
    if (!emailSent) {
      console.error(`[PasswordReset] FAILED to send reset email to ${user.email}`);
    } else {
      console.log(`[PasswordReset] Reset email sent successfully to ${user.email}`);
    }
    
    return res.status(200).json({
      success: true,
      message: "If your email is in our system, you will receive a password reset link."
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(200).json({ 
      success: true, 
      message: "If your email is in our system, you will receive a password reset link." 
    });
  }
}

/**
 * Verify reset password token validity
 */
export async function verifyResetToken(req: Request, res: Response) {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ valid: false });
    }
    
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, hashedToken),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );
    
    return res.status(200).json({ valid: !!resetToken });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(200).json({ valid: false });
  }
}

/**
 * Complete the password reset using a token
 */
export async function executePasswordReset(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Token and new password are required" 
      });
    }
    
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, hashedToken),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );
    
    if (!resetToken) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token" 
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetToken.userId));
    
    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));
    
    console.log(`Password reset successful for user ID ${resetToken.userId}`);
    
    return res.status(200).json({ 
      success: true, 
      message: "Your password has been successfully reset. You can now log in with your new password." 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred while resetting your password. Please try again." 
    });
  }
}

/**
 * Handle user login
 */
export async function loginUser(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const clearOptions = getSessionCookieOptions();
    delete clearOptions.maxAge;
    res.clearCookie("sessionId", clearOptions);
    
    let user;
    
    try {
      const { withRetry } = await import('../db');
      
      console.log("Finding user with username:", username);
      user = await storage.getUserByUsername(username);
      console.log("User lookup by username result:", user ? `Found user ${user.id}` : "Not found");
      
      if (!user) {
        console.log("User not found by username, trying email lookup");
        user = await withRetry(async () => {
          return await storage.getUserByEmail(username);
        });
        console.log("User lookup by email result:", user ? `Found user ${user.id}` : "Not found");
      }
      
      if (!user) {
        console.log("User not found by username or email");
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error during user lookup:", error);
      return res.status(500).json({ message: "Database connection issue, please try again in a moment" });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      console.log("Password does not match");
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    let session;
    try {
      console.log("Creating session for user:", user.id);
      const { withRetry } = await import('../db');
      session = await withRetry(async () => {
        return await storage.createSession(user.id);
      });
      
      const cookieOptions = getSessionCookieOptions();
      res.cookie("sessionId", session.id, cookieOptions);
    } catch (sessionError) {
      console.error("Error creating session:", sessionError);
      return res.status(500).json({ message: "Failed to create session, please try again" });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    console.log("Login successful for user:", user.id);
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error during login" });
  }
}

/**
 * Handle mobile-specific login
 */
export async function mobileLoginUser(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const clearOptions = getSessionCookieOptions();
    delete clearOptions.maxAge;
    res.clearCookie("sessionId", clearOptions);

    let user = await storage.getUserByUsername(username);
    if (!user) {
      user = await storage.getUserByEmail(username);
    }
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const session = await storage.createSession(user.id);
    const cookieOptions = getSessionCookieOptions();
    cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days for mobile
    res.cookie("sessionId", session.id, cookieOptions);

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("[Mobile] Login error:", error);
    res.status(500).json({ message: "Internal server error during login" });
  }
}

/**
 * Handle logging out a user
 */
export async function logoutUser(req: Request, res: Response) {
  try {
    await storage.deleteSession(req.session.id);
    
    const clearOptions = getSessionCookieOptions();
    delete clearOptions.maxAge;
    console.log("Clearing session cookie with options:", clearOptions);
    res.clearCookie("sessionId", clearOptions);
    
    res.setHeader('Clear-Local-Storage', 'auth_user_backup,auth_timestamp');
    
    console.log("User logged out successfully");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Handle getting the currently logged-in user profile
 */
export function getMe(req: Request, res: Response) {
  const { password, ...userWithoutPassword } = req.user!;
  res.status(200).json(userWithoutPassword);
}
