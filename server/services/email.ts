import SparkPost from 'sparkpost';

// Initialize SparkPost client
const sparkPostClient = new SparkPost(process.env.SPARKPOST_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Default sender email from the provided configuration
const DEFAULT_FROM_EMAIL = 'notreply@send.rcrc.ca';

/**
 * Send an email using SparkPost
 * 
 * @param params Email parameters including recipient, subject, and content
 * @returns Promise resolving to a boolean indicating success
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Check if SparkPost API key is configured
    if (!process.env.SPARKPOST_API_KEY) {
      console.error('SparkPost API key not configured');
      return false;
    }

    const transmission = {
      content: {
        from: DEFAULT_FROM_EMAIL,
        subject: params.subject,
        html: params.html || params.text, // Fallback to text if HTML not provided
        text: params.text
      },
      recipients: [
        { address: params.to }
      ]
    };

    await sparkPostClient.transmissions.send(transmission);
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SparkPost email error:', error);
    return false;
  }
}

/**
 * Send a client invitation email
 * 
 * @param clientEmail The client's email address
 * @param therapistName The name of the inviting therapist
 * @param inviteLink Link to accept the invitation
 * @returns Promise resolving to a boolean indicating success
 */
export async function sendClientInvitation(
  clientEmail: string, 
  therapistName: string,
  inviteLink: string
): Promise<boolean> {
  const subject = `${therapistName} has invited you to New Horizon CBT`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A6FA5;">New Horizon CBT Invitation</h1>
      <p>Hello,</p>
      <p><strong>${therapistName}</strong> has invited you to join New Horizon CBT, a platform for cognitive behavioral therapy support.</p>
      <p>New Horizon CBT will help you track emotions, manage thoughts, set goals, and monitor your progress with structured CBT tools.</p>
      
      <h2 style="color: #4A6FA5; margin-top: 25px; font-size: 18px;">Your Next Steps:</h2>
      <ol style="margin-bottom: 25px;">
        <li><strong>Register Your Account</strong>: Click the button below to create your account (your email address will be pre-filled)</li>
        <li><strong>Complete Registration</strong>: Create a username and password of your choice</li>
        <li><strong>Start Using the Platform</strong>: Once registered, you'll be automatically connected with your therapist</li>
      </ol>
      
      <div style="margin: 30px 0;">
        <a href="${inviteLink}" style="background-color: #4A6FA5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Register Your Account
        </a>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4A6FA5;">
        <p style="margin: 0; font-weight: bold;">What to Expect After Registration:</p>
        <ul style="margin-top: 10px; padding-left: 20px;">
          <li>Immediate access to all therapy tools</li>
          <li>Automatic connection to your therapist's practice</li>
          <li>Access to resources shared by your therapist</li>
        </ul>
      </div>
      
      <p style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #4A6FA5;">
        <strong>Important:</strong> This link contains information connecting you to your therapist. Please click the button above rather than copying the URL.
      </p>
      
      <p>This invitation link will expire in 7 days.</p>
      <p>If you have any questions, please contact your therapist directly.</p>
      <p>Best regards,<br>The New Horizon CBT Team</p>
    </div>
  `;
  
  return sendEmail({
    to: clientEmail,
    subject,
    html,
  });
}

/**
 * Send a reminder email for emotion tracking
 * 
 * @param userEmail User's email address
 * @param userName User's name
 * @returns Promise resolving to a boolean indicating success
 */
export async function sendEmotionTrackingReminder(
  userEmail: string,
  userName: string
): Promise<boolean> {
  const subject = 'Reminder: Track your emotions today';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A6FA5;">Emotion Check-In</h1>
      <p>Hello ${userName},</p>
      <p>This is a friendly reminder to track your emotions today. Regular tracking helps build awareness and identify patterns.</p>
      <div style="margin: 30px 0;">
        <a href="https://new-horizon-cbt.replit.app/emotion-tracking" style="background-color: #4A6FA5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Track Now
        </a>
      </div>
      <p>Consistency is key to getting the most out of cognitive behavioral therapy.</p>
      <p>Best regards,<br>The New Horizon CBT Team</p>
    </div>
  `;
  
  return sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

/**
 * Send a weekly progress digest email
 * 
 * @param userEmail User's email address
 * @param userName User's name
 * @param weekSummary Summary text of the week's progress
 * @param goalsCompleted Number of goals completed
 * @param emotionEntries Number of emotion entries recorded
 * @param thoughtRecords Number of thought records completed
 * @returns Promise resolving to a boolean indicating success
 */
export async function sendWeeklyProgressDigest(
  userEmail: string,
  userName: string,
  weekSummary: string,
  goalsCompleted: number,
  emotionEntries: number,
  thoughtRecords: number
): Promise<boolean> {
  const subject = 'Your Weekly CBT Progress Report';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A6FA5;">Weekly Progress Report</h1>
      <p>Hello ${userName},</p>
      <p>Here's a summary of your progress this week:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Week Summary:</strong> ${weekSummary}</p>
        <ul>
          <li><strong>Goals Completed:</strong> ${goalsCompleted}</li>
          <li><strong>Emotion Entries:</strong> ${emotionEntries}</li>
          <li><strong>Thought Records:</strong> ${thoughtRecords}</li>
        </ul>
      </div>
      
      <div style="margin: 30px 0;">
        <a href="https://new-horizon-cbt.replit.app/reports" style="background-color: #4A6FA5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          View Full Report
        </a>
      </div>
      
      <p>Keep up the great work! Consistent practice is key to progress in CBT.</p>
      <p>Best regards,<br>The New Horizon CBT Team</p>
    </div>
  `;
  
  return sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

/**
 * Send a password reset email
 * 
 * @param userEmail User's email address
 * @param resetLink Link to reset password
 * @returns Promise resolving to a boolean indicating success
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  resetLink: string
): Promise<boolean> {
  const subject = 'Reset Your New Horizon CBT Password';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A6FA5;">Password Reset Request</h1>
      <p>Hello,</p>
      <p>We received a request to reset your password for New Horizon CBT. If you didn't make this request, you can safely ignore this email.</p>
      <div style="margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4A6FA5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p>This password reset link will expire in 1 hour.</p>
      <p>If you have any issues, please contact support.</p>
      <p>Best regards,<br>The New Horizon CBT Team</p>
    </div>
  `;
  
  return sendEmail({
    to: userEmail,
    subject,
    html,
  });
}