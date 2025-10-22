import crypto from 'crypto';
import { db } from '../db';
import { eq, and, gt } from 'drizzle-orm';
import { users, passwordResetTokens } from '@shared/schema';
import { sendPasswordResetEmail } from './email';

// Function to generate a secure random token
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Function to hash password the same way our auth system does
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

// Function to verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [hashValue, salt] = hash.split('.');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(hashValue === derivedKey.toString('hex'));
    });
  });
}

// Create a password reset token for a user
export async function createPasswordResetToken(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find the user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      // Don't reveal if the email exists in the system
      return { success: true, message: "If your email is in our system, you will receive a password reset link." };
    }

    // Clear any existing tokens for the user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
    
    // Create a new token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store the token in the database
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
      used: false
    });
    
    // Create the reset URL
    const baseUrl = process.env.NODE_ENV === 'production'
      ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
      : 'http://localhost:5003';
    
    const resetUrl = `${baseUrl}/reset-password/${token}`;
    
    // Send the password reset email
    await sendPasswordResetEmail(user.email, resetUrl);
    
    // Return success without revealing if email exists
    return { success: true, message: "If your email is in our system, you will receive a password reset link." };
  } catch (error) {
    console.error('Error creating password reset token:', error);
    return { success: false, message: "An error occurred while processing your request." };
  }
}

// Verify if a reset token is valid
export async function verifyResetToken(token: string): Promise<{ valid: boolean; userId?: number }> {
  try {
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
      return { valid: false };
    }
    
    return { valid: true, userId: resetToken.userId };
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return { valid: false };
  }
}

// Reset password using a token
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    // Verify the token
    const { valid, userId } = await verifyResetToken(token);
    
    if (!valid || !userId) {
      return { success: false, message: "Invalid or expired reset token." };
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the user's password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
    
    // Mark the token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
    
    return { success: true, message: "Your password has been successfully reset." };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, message: "An error occurred while resetting your password." };
  }
}