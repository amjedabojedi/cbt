import { db } from './server/db.js';
import { 
  users, 
  clientInvitations, 
  thoughtRecords, 
  emotionRecords, 
  journalEntries,
  goals,
  goalMilestones,
  notifications,
  notificationPreferences,
  sessions,
  resourceAssignments,
  resourceFeedback,
  actions,
  reframePracticeResults,
  userGameProfiles,
  copingStrategyUsage,
  protectiveFactors,
  copingStrategies
} from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function cleanupClient(email) {
  console.log(`Starting cleanup for client: ${email}`);
  
  try {
    // Find the user
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user.length) {
      console.log(`User ${email} not found in database`);
      return;
    }
    
    const userId = user[0].id;
    console.log(`Found user ID: ${userId}`);
    
    // Delete in correct order to handle foreign key constraints
    
    // 1. Delete thought records first (they reference emotion records)
    console.log('Deleting thought records...');
    await db.delete(thoughtRecords).where(eq(thoughtRecords.userId, userId));
    
    // 2. Delete emotion records
    console.log('Deleting emotion records...');
    await db.delete(emotionRecords).where(eq(emotionRecords.userId, userId));
    
    // 3. Delete goal milestones (they reference goals)
    console.log('Deleting goal milestones...');
    const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));
    for (const goal of userGoals) {
      await db.delete(goalMilestones).where(eq(goalMilestones.goalId, goal.id));
    }
    
    // 4. Delete goals
    console.log('Deleting goals...');
    await db.delete(goals).where(eq(goals.userId, userId));
    
    // 5. Delete journal entries
    console.log('Deleting journal entries...');
    await db.delete(journalEntries).where(eq(journalEntries.userId, userId));
    
    // 6. Delete other related records
    console.log('Deleting other related records...');
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    await db.delete(resourceAssignments).where(eq(resourceAssignments.assignedTo, userId));
    await db.delete(resourceFeedback).where(eq(resourceFeedback.userId, userId));
    await db.delete(actions).where(eq(actions.userId, userId));
    await db.delete(reframePracticeResults).where(eq(reframePracticeResults.userId, userId));
    await db.delete(userGameProfiles).where(eq(userGameProfiles.userId, userId));
    await db.delete(copingStrategyUsage).where(eq(copingStrategyUsage.userId, userId));
    await db.delete(protectiveFactors).where(eq(protectiveFactors.userId, userId));
    await db.delete(copingStrategies).where(eq(copingStrategies.userId, userId));
    
    // 7. Delete client invitations
    console.log('Deleting client invitations...');
    await db.delete(clientInvitations).where(eq(clientInvitations.email, email));
    
    // 8. Finally delete the user
    console.log('Deleting user record...');
    await db.delete(users).where(eq(users.id, userId));
    
    console.log(`✅ Successfully cleaned up client: ${email}`);
    
  } catch (error) {
    console.error(`❌ Error cleaning up client ${email}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🔧 Starting client deletion cleanup...');
  
  // Clean up the problematic clients
  await cleanupClient('aabojedi@banacenter.com');
  await cleanupClient('mazayed69@gmail.com');
  
  console.log('✅ Cleanup completed! You can now invite these emails again.');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});