import { pool } from '../db';
import SparkPost from 'sparkpost';

// Default from email address to use when not specified
// Default from email address - will need to be configured in SparkPost
const DEFAULT_FROM_EMAIL = "support@resilience-counseling.com";

// Check if SparkPost domain is verified
async function checkSparkPostDomainStatus() {
  if (!sparkPostClient) return false;
  
  try {
    console.log('Checking SparkPost domain verification status...');
    const domain = DEFAULT_FROM_EMAIL.split('@')[1];
    const result = await sparkPostClient.sendingDomains.retrieve(domain);
    console.log('SparkPost domain status:', result);
    return result.status && result.status.ownership_verified === true;
  } catch (error) {
    console.error('Error checking SparkPost domain status:', error);
    return false;
  }
}

// Email configuration 
const SPARKPOST_API_KEY = process.env.SPARKPOST_API_KEY;
const EMAIL_ENABLED = !!SPARKPOST_API_KEY;

// Initialize SparkPost client if API key is available
let sparkPostClient: any = null;
if (EMAIL_ENABLED) {
  try {
    sparkPostClient = new SparkPost(SPARKPOST_API_KEY as string);
    console.log('SparkPost client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize SparkPost client:', error);
  }
}

// Email service configuration
interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

/**
 * Check if email service is enabled
 */
export function isEmailEnabled(): boolean {
  if (!EMAIL_ENABLED || sparkPostClient === null) {
    console.log('Email service disabled: SparkPost API key not configured or client initialization failed');
    return false;
  }
  
  // Check if domain is verified - but don't block sending if we can't verify
  // This just adds informational warnings to the logs
  try {
    const domain = DEFAULT_FROM_EMAIL.split('@')[1];
    console.log(`Attempting to use email domain: ${domain}`);
    
    // Don't await this - just log the result when it completes
    sparkPostClient.sendingDomains.retrieve(domain)
      .then(result => {
        if (result && result.status) {
          const isVerified = result.status.ownership_verified === true;
          console.log(`SparkPost domain status for ${domain}: ${isVerified ? 'Verified' : 'Not verified'}`);
          if (!isVerified) {
            console.warn(`WARNING: The domain ${domain} is not verified with SparkPost.`);
            console.warn('This may cause emails to fail or be delivered to spam folders.');
            console.warn('Please verify your domain in the SparkPost dashboard.');
          }
        }
      })
      .catch(error => {
        console.error(`Error checking SparkPost domain ${domain}:`, error);
        console.warn('Domain verification check failed. This may indicate the domain is not set up in SparkPost.');
      });
  } catch (error) {
    console.error('Error in domain verification check:', error);
  }
  
  return true;
}

/**
 * Generic function to send an email
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  // If SparkPost integration isn't configured, log the email that would have been sent
  if (!isEmailEnabled()) {
    console.log('Email service not configured. Would have sent:');
    console.log('To:', params.to);
    console.log('Subject:', params.subject);
    console.log('Body:', params.text || params.html || '(HTML content)');
    return false;
  }

  try {
    // Use SparkPost for real email delivery
    const transmission: any = {
      content: {
        from: params.from || DEFAULT_FROM_EMAIL,
        subject: params.subject,
      },
      recipients: [{ address: { email: params.to } }],
    };

    // Add either text or HTML content
    if (params.html) {
      transmission.content.html = params.html;
    }
    if (params.text) {
      transmission.content.text = params.text;
    }

    // If a template ID is provided, use that instead of custom content
    if (params.templateId) {
      transmission.content = {
        template_id: params.templateId,
        from: params.from || DEFAULT_FROM_EMAIL,
      };
      
      if (params.templateData) {
        transmission.substitution_data = params.templateData;
      }
    }

    // Send the email through SparkPost
    console.log(`Sending email to ${params.to} via SparkPost`);
    const result = await sparkPostClient.transmissions.send(transmission);
    console.log('Email sent successfully:', result);
    
    // Record the email in our database for auditing
    try {
      await pool.query(
        `INSERT INTO email_logs (recipient, subject, body_text, sent_at) 
         VALUES ($1, $2, $3, $4)`,
        [params.to, params.subject, params.text || '(HTML content)', new Date()]
      );
    } catch (dbError) {
      console.error('Failed to log email to database (non-critical):', dbError);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email via SparkPost:', error);
    return false;
  }
}

/**
 * Send an emotion tracking reminder email to a client
 */
export async function sendEmotionTrackingReminder(email: string, name: string): Promise<boolean> {
  const subject = "Reminder: Track Your Emotions with ResilienceHub™";
  
  const text = `
Hello ${name},

We noticed it's been a few days since you last tracked your emotions on ResilienceHub™. 

Regular emotion tracking helps build self-awareness and can lead to better therapy outcomes. Even a quick 30-second check-in can provide valuable insights for both you and your therapist.

To record your emotions, simply log in to your ResilienceHub™ account and click on "Track Emotions" from your dashboard.

Remember that ResilienceHub™ is a supportive tool for your therapy with Resilience Counseling Research and Consultation, not a replacement for professional care.

Wishing you well,
Resilience Counseling Research and Consultation Team
`;

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4f46e5;">Hello ${name},</h2>
  
  <p>We noticed it's been a few days since you last tracked your emotions on ResilienceHub™.</p>
  
  <p>Regular emotion tracking helps build self-awareness and can lead to better therapy outcomes. Even a quick 30-second check-in can provide valuable insights for both you and your therapist.</p>
  
  <p><a href="https://resiliencehub.app/dashboard" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0;">Track Your Emotions Now</a></p>
  
  <p>Wishing you well,<br>
  Resilience Counseling Research and Consultation Team</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #666;">This email was sent as part of your therapy program with Resilience Counseling. If you believe you received this in error, please contact your therapist.</p>
</div>
`;

  return sendEmail({
    to: email,
    from: DEFAULT_FROM_EMAIL,
    subject,
    text,
    html
  });
}

/**
 * Send a weekly progress digest email to a client
 */
export async function sendWeeklyProgressDigest(email: string, name: string, stats: any): Promise<boolean> {
  const subject = "Your Weekly Progress Report from ResilienceHub™";
  
  const text = `
Hello ${name},

Here's your weekly progress report from ResilienceHub™:

• Emotions tracked: ${stats.emotionsTracked || 0}
• Journal entries: ${stats.journalEntries || 0}
• Thought records completed: ${stats.thoughtRecords || 0}
• Goals progress: ${stats.goalsProgress || 'No updates'}

Log in to your ResilienceHub™ account to see more detailed analytics and insights.

Wishing you continued growth,
Resilience Counseling Research and Consultation Team
`;

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4f46e5;">Hello ${name},</h2>
  
  <p>Here's your weekly progress report from ResilienceHub™:</p>
  
  <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Emotions tracked:</strong> ${stats.emotionsTracked || 0}</p>
    <p><strong>Journal entries:</strong> ${stats.journalEntries || 0}</p>
    <p><strong>Thought records completed:</strong> ${stats.thoughtRecords || 0}</p>
    <p><strong>Goals progress:</strong> ${stats.goalsProgress || 'No updates'}</p>
  </div>
  
  <p><a href="https://resiliencehub.app/dashboard/analytics" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0;">View Detailed Analytics</a></p>
  
  <p>Wishing you continued growth,<br>
  Resilience Counseling Research and Consultation Team</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #666;">This email was sent as part of your therapy program with Resilience Counseling. If you believe you received this in error, please contact your therapist.</p>
</div>
`;

  return sendEmail({
    to: email,
    from: DEFAULT_FROM_EMAIL,
    subject,
    text,
    html
  });
}