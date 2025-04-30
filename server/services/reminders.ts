import { storage } from "../storage";
import { sendEmotionTrackingReminder, sendWeeklyProgressDigest } from "./email";
import { sub, format } from "date-fns";

/**
 * Send emotion tracking reminders to users who haven't tracked emotions recently
 * 
 * @param daysWithoutTracking Number of days since last emotion tracking before sending a reminder
 * @returns Number of reminders sent
 */
export async function sendEmotionTrackingReminders(daysWithoutTracking = 2): Promise<number> {
  try {
    console.log(`Looking for users who haven't tracked emotions in ${daysWithoutTracking} days...`);
    
    // Get all users except admin
    const users = await storage.getAllUsers();
    const nonAdminUsers = users.filter(user => user.role !== 'admin');
    
    let remindersSent = 0;
    const now = new Date();
    const cutoffDate = sub(now, { days: daysWithoutTracking });
    
    for (const user of nonAdminUsers) {
      // Get user's latest emotion record
      const emotions = await storage.getEmotionRecordsByUser(user.id);
      
      // Sort by createdAt in descending order to get the latest record
      const sortedEmotions = emotions.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      const latestEmotion = sortedEmotions[0];
      
      // Check if user needs a reminder
      const needsReminder = !latestEmotion || new Date(latestEmotion.createdAt) < cutoffDate;
      
      if (needsReminder) {
        console.log(`Sending reminder to ${user.email} (${user.name})`);
        const sent = await sendEmotionTrackingReminder(user.email, user.name);
        
        if (sent) {
          remindersSent++;
          console.log(`Reminder sent to ${user.email}`);
        } else {
          console.error(`Failed to send reminder to ${user.email}`);
        }
      }
    }
    
    console.log(`Sent ${remindersSent} emotion tracking reminders`);
    return remindersSent;
  } catch (error) {
    console.error("Error sending emotion tracking reminders:", error);
    return 0;
  }
}

/**
 * Send weekly progress digests to all users
 * 
 * @returns Number of digests sent
 */
export async function sendWeeklyProgressDigests(): Promise<number> {
  try {
    console.log("Preparing weekly progress digests...");
    
    // Get all users except admin
    const users = await storage.getAllUsers();
    const nonAdminUsers = users.filter(user => user.role !== 'admin');
    
    let digestsSent = 0;
    const oneWeekAgo = sub(new Date(), { weeks: 1 });
    
    for (const user of nonAdminUsers) {
      console.log(`Preparing digest for ${user.email} (${user.name})`);
      
      // Get data from the past week
      const emotions = await storage.getEmotionRecordsByUser(user.id);
      const recentEmotions = emotions.filter(e => 
        new Date(e.createdAt) >= oneWeekAgo
      );
      
      const thoughts = await storage.getThoughtRecordsByUser(user.id);
      const recentThoughts = thoughts.filter(t => 
        new Date(t.createdAt) >= oneWeekAgo
      );
      
      const goals = await storage.getGoalsByUser(user.id);
      const completedGoals = goals.filter(g => 
        g.status === 'completed' && 
        new Date(g.updatedAt) >= oneWeekAgo
      );
      
      // Generate summary text
      let summary = "Here's your progress for the past week:";
      
      // Add mood trend if emotions were tracked
      if (recentEmotions.length > 0) {
        const avgIntensity = recentEmotions.reduce((sum, e) => sum + e.intensity, 0) / recentEmotions.length;
        summary += `\n- Average emotion intensity: ${avgIntensity.toFixed(1)}/10`;
        
        // Most common emotion
        const emotionCounts: Record<string, number> = {};
        recentEmotions.forEach(e => {
          emotionCounts[e.primaryEmotion] = (emotionCounts[e.primaryEmotion] || 0) + 1;
        });
        
        let mostCommonEmotion = '';
        let highestCount = 0;
        
        Object.entries(emotionCounts).forEach(([emotion, count]) => {
          if (count > highestCount) {
            mostCommonEmotion = emotion;
            highestCount = count;
          }
        });
        
        if (mostCommonEmotion) {
          summary += `\n- Most common emotion: ${mostCommonEmotion}`;
        }
      }
      
      // Add thought record progress
      if (recentThoughts.length > 0) {
        summary += `\n- Completed ${recentThoughts.length} thought record${recentThoughts.length === 1 ? '' : 's'}`;
      }
      
      // Add goal progress
      if (completedGoals.length > 0) {
        summary += `\n- Completed ${completedGoals.length} goal${completedGoals.length === 1 ? '' : 's'}`;
      }
      
      // If no activity, encourage engagement
      if (recentEmotions.length === 0 && recentThoughts.length === 0 && completedGoals.length === 0) {
        summary = "You haven't recorded any activity this week. Regular tracking helps build awareness and identify patterns. Try to set aside a few minutes each day for reflection.";
      }
      
      // Send the digest
      const sent = await sendWeeklyProgressDigest(
        user.email,
        user.name,
        summary,
        completedGoals.length,
        recentEmotions.length,
        recentThoughts.length
      );
      
      if (sent) {
        digestsSent++;
        console.log(`Weekly digest sent to ${user.email}`);
      } else {
        console.error(`Failed to send digest to ${user.email}`);
      }
    }
    
    console.log(`Sent ${digestsSent} weekly progress digests`);
    return digestsSent;
  } catch (error) {
    console.error("Error sending weekly progress digests:", error);
    return 0;
  }
}