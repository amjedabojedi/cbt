import { Request, Response } from "express";
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { eq, and, gt } from 'drizzle-orm';
import { users, passwordResetTokens } from '@shared/schema';
import { sendPasswordResetEmail } from '../services/email';

/**
 * Request a password reset (forgot password)
 * Generates a token and sends an email to the user
 */
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }
    
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    // For security, don't reveal if the email exists or not
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      // Still return success to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: "If your email is in our system, you will receive a password reset link."
      });
    }
    
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour
    
    // Delete any existing reset tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
    
    // Save the new token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
      used: false
    });
    
    // Build the reset URL
    const baseUrl = process.env.NODE_ENV === 'production'
      ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
      : 'http://localhost:5000';
    
    const resetUrl = `${baseUrl}/reset-password/${token}`;
    
    // Send the reset email
    const emailSent = await sendPasswordResetEmail(email, resetUrl);
    
    if (emailSent) {
      console.log(`Password reset email sent to ${email}`);
    } else {
      console.error(`Failed to send password reset email to ${email}`);
    }
    
    // Return success regardless of email sending status (for security)
    return res.status(200).json({
      success: true,
      message: "If your email is in our system, you will receive a password reset link."
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    // Don't expose error details
    return res.status(200).json({ 
      success: true, 
      message: "If your email is in our system, you will receive a password reset link." 
    });
  }
}

/**
 * Verify if a reset token is valid
 * Used by the client side before showing reset form
 */
export async function verifyResetToken(req: Request, res: Response) {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ valid: false });
    }
    
    // Find the token in the database
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
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
 * Reset password using a valid token
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Token and new password are required" 
      });
    }
    
    // Find the token in the database
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
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
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the user's password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetToken.userId));
    
    // Mark the token as used
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