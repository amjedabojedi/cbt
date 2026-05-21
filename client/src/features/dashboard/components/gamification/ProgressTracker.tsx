import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Calendar, Trophy, AlertTriangle, Gift, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Sample user stats for development
// In production, these would come from the API
const sampleUserStats = {
  currentStreak: 5,
  longestStreak: 12,
  lastActivityDate: new Date().toISOString(),
  totalPoints: 275,
  level: 3,
  emotionTrackingCount: 18,
  thoughtRecordCount: 7,
  journalEntryCount: 14,
  completedGoalsCount: 2,
  emotionDiversityScore: 65,
  
  // Level-related info
  currentLevelPoints: 200,
  nextLevelPoints: 400,
  
  // Daily challenge
  dailyChallenge: {
    id: 123,
    title: "Journey to Understanding",
    description: "Create a journal entry reflecting on your emotions from the past week",
    pointReward: 25,
    category: "journaling",
    completed: false
  }
};

export default function ProgressTracker() {
  const [showReward, setShowReward] = useState(false);
  
  // Calculate progress percentage
  const calculateProgress = () => {
    const progress = sampleUserStats.totalPoints - sampleUserStats.currentLevelPoints;
    const totalNeeded = sampleUserStats.nextLevelPoints - sampleUserStats.currentLevelPoints;
    return Math.round((progress / totalNeeded) * 100);
  };
  
  // Format level as roman numeral
  const formatLevel = (level: number) => {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[level - 1] || level.toString();
  };
  
  // Display time since last activity
  const getLastActivityText = () => {
    const now = new Date();
    const lastActivity = new Date(sampleUserStats.lastActivityDate);
    const diffHours = Math.round((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };
  
  // Show completion animation and reward
  const handleCompleteChallenge = () => {
    setShowReward(true);
    setTimeout(() => setShowReward(false), 3000);
  };
  
  const renderMilestoneStatus = (count: number, target: number) => {
    const percent = Math.min(100, Math.round((count / target) * 100));
    return (
      <div className="flex-1 flex items-center">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className={cn(
            "h-2.5 rounded-full",
            percent < 50 ? "bg-yellow-300" : 
            percent < 100 ? "bg-blue-400" : "bg-green-500"
          )} style={{ width: `${percent}%` }}></div>
        </div>
      </div>
    );
  };
  
  return (
    <>
      {/* Progress Overview */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Progress Tracker
          </CardTitle>
          <CardDescription>Your personal growth journey</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Level progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1 text-sm">
              <div className="font-medium">Level {sampleUserStats.level}</div>
              <div className="text-muted-foreground">
                {sampleUserStats.totalPoints - sampleUserStats.currentLevelPoints} / 
                {sampleUserStats.nextLevelPoints - sampleUserStats.currentLevelPoints} XP
              </div>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <div>Level {formatLevel(sampleUserStats.level)}</div>
              <div>Level {formatLevel(sampleUserStats.level + 1)}</div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-blue-700">Streak</div>
                <Flame className="h-4 w-4 text-blue-500" />
              </div>
              <div className="mt-1 text-2xl font-bold text-blue-700">
                {sampleUserStats.currentStreak} <span className="text-xs font-normal text-blue-500">days</span>
              </div>
              <div className="text-xs text-blue-500/80">
                Best: {sampleUserStats.longestStreak} days
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-purple-700">Total XP</div>
                <Star className="h-4 w-4 text-purple-500" />
              </div>
              <div className="mt-1 text-2xl font-bold text-purple-700">
                {sampleUserStats.totalPoints}
              </div>
              <div className="text-xs text-purple-500/80">
                Level {formatLevel(sampleUserStats.level)}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-green-700">Activities</div>
                <Calendar className="h-4 w-4 text-green-500" />
              </div>
              <div className="mt-1 text-2xl font-bold text-green-700">
                {sampleUserStats.emotionTrackingCount + sampleUserStats.thoughtRecordCount + sampleUserStats.journalEntryCount}
              </div>
              <div className="text-xs text-green-500/80">
                Last activity: {getLastActivityText()}
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-amber-700">Emotion Range</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-4 w-4 text-amber-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs text-xs">
                        Your emotion diversity score measures how varied your recorded emotions are. 
                        A higher score indicates you're tracking a wider range of emotions.
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="mt-1 text-2xl font-bold text-amber-700">
                {sampleUserStats.emotionDiversityScore}<span className="text-xs font-normal text-amber-500">/100</span>
              </div>
              <div className="text-xs text-amber-500/80">
                {sampleUserStats.emotionDiversityScore < 30 ? "Limited range" :
                 sampleUserStats.emotionDiversityScore < 60 ? "Good variety" :
                 "Excellent diversity"}
              </div>
            </div>
          </div>
          
          {/* Activity Milestones */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium">Activity Milestones</h3>
            
            <div className="flex items-center gap-2">
              <div className="w-32 text-xs">Emotion Tracking:</div>
              {renderMilestoneStatus(sampleUserStats.emotionTrackingCount, 20)}
              <div className="text-xs font-medium">{sampleUserStats.emotionTrackingCount}/20</div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-32 text-xs">Thought Records:</div>
              {renderMilestoneStatus(sampleUserStats.thoughtRecordCount, 10)}
              <div className="text-xs font-medium">{sampleUserStats.thoughtRecordCount}/10</div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-32 text-xs">Journal Entries:</div>
              {renderMilestoneStatus(sampleUserStats.journalEntryCount, 15)}
              <div className="text-xs font-medium">{sampleUserStats.journalEntryCount}/15</div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-32 text-xs">Completed Goals:</div>
              {renderMilestoneStatus(sampleUserStats.completedGoalsCount, 5)}
              <div className="text-xs font-medium">{sampleUserStats.completedGoalsCount}/5</div>
            </div>
          </div>
          
          {/* Daily Challenge */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium text-blue-800 flex items-center gap-1">
                <Gift className="h-4 w-4" />
                Today's Challenge
              </h3>
              <div className="px-2 py-0.5 bg-blue-100 rounded-full text-xs font-medium text-blue-800">
                +{sampleUserStats.dailyChallenge.pointReward} XP
              </div>
            </div>
            <p className="text-sm text-blue-700 mb-3">{sampleUserStats.dailyChallenge.description}</p>
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleCompleteChallenge}
              disabled={showReward}
            >
              {showReward ? "Challenge Completed!" : "Complete Challenge"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Reward animation */}
      {showReward && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-xl p-6 text-center max-w-sm"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              damping: 15
            }}
          >
            <motion.div
              initial={{ rotate: 0, scale: 1 }}
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600 mb-4"
            >
              <Trophy className="h-8 w-8" />
            </motion.div>
            <h2 className="text-xl font-bold mb-2">Challenge Completed!</h2>
            <p className="text-gray-600 mb-4">You earned {sampleUserStats.dailyChallenge.pointReward} XP!</p>
            <div className="text-xs text-gray-500">
              Your streak is now {sampleUserStats.currentStreak + 1} days
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}