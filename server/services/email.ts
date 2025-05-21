const SparkPost = require('sparkpost');

// Initialize SparkPost client
let sparkpost: any = null;

try {
  if (process.env.SPARKPOST_API_KEY) {
    sparkpost = new SparkPost(process.env.SPARKPOST_API_KEY);
  } else {
    console.warn('No SparkPost API key found. Email functionality will be limited.');
  }
} catch (error) {
  console.error('Error initializing SparkPost client:', error);
}

/**
 * Send an email using SparkPost
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}): Promise<boolean> {
  if (!sparkpost) {
    console.warn('SparkPost client not initialized. Cannot send email.');
    return false;
  }

  if (!options.html && !options.text) {
    console.error('Email must contain either HTML or text content');
    return false;
  }

  try {
    const fromAddress = options.from || 'notifications@resilience-hub.com';
    const fromName = 'ResilienceHub™';

    const transmissionOptions = {
      content: {
        from: {
          email: fromAddress,
          name: fromName
        },
        subject: options.subject,
        html: options.html,
        text: options.text
      },
      recipients: [
        { address: options.to }
      ],
      options: {
        open_tracking: true,
        click_tracking: true
      }
    };

    const result = await sparkpost.transmissions.send(transmissionOptions);
    console.log(`Email sent to ${options.to}, result:`, result);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send emotion tracking reminder email
 */
export async function sendEmotionTrackingReminder(email: string, name: string): Promise<boolean> {
  const subject = "Emotion Tracking Reminder";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3b82f6; margin-bottom: 10px;">Emotion Check-In Reminder</h1>
        <p style="color: #4b5563; font-size: 16px;">Hello ${name}, we've noticed you haven't recorded your emotions recently.</p>
      </div>
      
      <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
        <p style="color: #4b5563; font-size: 15px;">Regular emotion tracking helps you:</p>
        <ul style="color: #4b5563;">
          <li>Recognize patterns in your emotional responses</li>
          <li>Develop greater emotional awareness</li>
          <li>Improve your emotional regulation skills</li>
          <li>Provide valuable insights for your therapy journey</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 25px;">
        <a href="${process.env.APP_URL || 'https://resilience-hub.replit.app'}/login" 
           style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Log In Now
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
        This email was sent by ResilienceHub™, a service of Resilience Counseling Research and Consultation.
        <br>If you'd prefer not to receive these reminders, you can update your notification preferences in your account settings.
      </p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Send weekly progress digest email
 */
export async function sendWeeklyProgressDigest(
  email: string,
  name: string,
  summary: string,
  completedGoals: number,
  trackedEmotions: number,
  completedThoughts: number
): Promise<boolean> {
  const subject = "Your Weekly Progress Report";
  
  // Emotion color map for display
  const emotionColors = {
    'Joy': '#FFD700',
    'Sadness': '#4682B4',
    'Anger': '#FF6347',
    'Fear': '#9370DB',
    'Disgust': '#32CD32',
    'Surprise': '#FF69B4',
    'Trust': '#40E0D0',
    'Anticipation': '#FFA500'
  };
  
  const hasActivity = trackedEmotions > 0 || completedThoughts > 0 || completedGoals > 0;
  
  // Format the summary as HTML
  const summaryHtml = summary.split('\n').map(line => `<p style="color: #4b5563;">${line}</p>`).join('');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3b82f6; margin-bottom: 10px;">Your Weekly Progress Report</h1>
        <p style="color: #4b5563; font-size: 16px;">Hello ${name},</p>
        <p style="color: #4b5563; font-size: 16px;">Here's your weekly summary from ResilienceHub™.</p>
      </div>
      
      ${hasActivity ? `
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Your Activity Summary</h2>
          
          <div style="display: flex; justify-content: space-between; flex-wrap: wrap; margin-top: 15px;">
            <div style="flex: 1; min-width: 120px; background-color: white; border-radius: 6px; padding: 15px; margin: 5px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${trackedEmotions}</div>
              <div style="color: #6b7280;">Emotions Tracked</div>
            </div>
            
            <div style="flex: 1; min-width: 120px; background-color: white; border-radius: 6px; padding: 15px; margin: 5px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${completedThoughts}</div>
              <div style="color: #6b7280;">Thought Records</div>
            </div>
            
            <div style="flex: 1; min-width: 120px; background-color: white; border-radius: 6px; padding: 15px; margin: 5px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${completedGoals}</div>
              <div style="color: #6b7280;">Goals Completed</div>
            </div>
          </div>
          
          <div style="margin-top: 20px;">
            ${summaryHtml}
          </div>
        </div>
      ` : `
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #3b82f6; margin-top: 0;">No Activity This Week</h2>
          <p style="color: #4b5563;">We noticed you haven't recorded any activity in ResilienceHub™ this past week.</p>
          <p style="color: #4b5563;">Regular tracking helps build emotional awareness and provides valuable insights for your therapy journey.</p>
        </div>
      `}
      
      <div style="background-color: #eef2ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #3b82f6; margin-top: 0;">This Week's Tip</h2>
        <p style="color: #4b5563;">Regular emotional tracking is essential for building self-awareness. Try to notice and record your emotions at different times throughout the day, especially during challenging moments.</p>
      </div>
      
      <div style="text-align: center; margin-top: 25px;">
        <a href="${process.env.APP_URL || 'https://resilience-hub.replit.app'}/login" 
           style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View Your Full Progress
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
        This email was sent by ResilienceHub™, a service of Resilience Counseling Research and Consultation.
        <br>If you'd prefer not to receive these weekly updates, you can update your notification preferences in your account settings.
      </p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Check if email functionality is available
 */
export function isEmailEnabled(): boolean {
  return sparkpost !== null;
}