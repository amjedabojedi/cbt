import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import AchievementBadge from "./AchievementBadge";
import { Award, Medal, Target, Calendar, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Sample achievement data for development
// In production, this would come from the API
const sampleAchievements = [
  // Emotion Tracking achievements
  {
    id: 1,
    name: "First Step",
    description: "Recorded your first emotion",
    type: "milestone" as const,
    category: "emotion_tracking" as const,
    level: 1,
    isLocked: false,
    isNew: false,
  },
  {
    id: 2,
    name: "Tracking Journey",
    description: "Recorded 10 emotions",
    type: "count" as const,
    category: "emotion_tracking" as const,
    level: 1,
    isLocked: false,
    isNew: false,
  },
  {
    id: 3,
    name: "Emotion Master",
    description: "Recorded emotions from all core categories",
    type: "diversity" as const,
    category: "emotion_tracking" as const,
    level: 2,
    isLocked: false,
    isNew: true,
  },
  
  // Thought Records achievements
  {
    id: 4,
    name: "Cognitive Explorer",
    description: "Created your first thought record",
    type: "milestone" as const,
    category: "thought_records" as const,
    level: 1,
    isLocked: false,
    isNew: false,
  },
  {
    id: 5,
    name: "Thought Analyzer",
    description: "Identified 5 different cognitive distortions",
    type: "diversity" as const,
    category: "thought_records" as const,
    level: 1,
    isLocked: false,
    isNew: false,
  },
  {
    id: 6,
    name: "Reframing Master",
    description: "Created 20 alternative perspectives",
    type: "count" as const,
    category: "thought_records" as const,
    level: 2,
    isLocked: true,
    isNew: false,
  },
  
  // Journaling achievements
  {
    id: 7,
    name: "Self-Reflection",
    description: "Wrote your first journal entry",
    type: "milestone" as const,
    category: "journaling" as const,
    level: 1,
    isLocked: false,
    isNew: false,
  },
  {
    id: 8,
    name: "Consistent Journaler",
    description: "Journaled for 5 consecutive days",
    type: "streak" as const,
    category: "journaling" as const,
    level: 2,
    isLocked: true,
    isNew: false,
  },
  
  // Goals achievements
  {
    id: 9,
    name: "Goal Setter",
    description: "Created your first goal",
    type: "milestone" as const,
    category: "goals" as const,
    level: 1,
    isLocked: false,
    isNew: false,
  },
  {
    id: 10,
    name: "Milestone Maker",
    description: "Completed 3 goal milestones",
    type: "count" as const,
    category: "goals" as const,
    level: 1,
    isLocked: true,
    isNew: false,
  },
  
  // Engagement achievements
  {
    id: 11,
    name: "Committed to Growth",
    description: "Logged in for 7 consecutive days",
    type: "streak" as const,
    category: "engagement" as const,
    level: 1,
    isLocked: false,
    isNew: false,
  },
  {
    id: 12,
    name: "Dedicated User",
    description: "Used the app for 30 consecutive days",
    type: "streak" as const,
    category: "engagement" as const,
    level: 3,
    isLocked: true,
    isNew: false,
  },
];

export default function AchievementsList() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  // Filter achievements based on active category
  const filteredAchievements = sampleAchievements.filter(achievement => 
    activeCategory === "all" || achievement.category === activeCategory
  );
  
  // Separate unlocked and locked achievements
  const unlockedAchievements = filteredAchievements.filter(a => !a.isLocked);
  const lockedAchievements = filteredAchievements.filter(a => a.isLocked);
  
  // Stats about achievements
  const achievementStats = {
    total: sampleAchievements.length,
    unlocked: sampleAchievements.filter(a => !a.isLocked).length,
    bronze: sampleAchievements.filter(a => !a.isLocked && a.level === 1).length,
    silver: sampleAchievements.filter(a => !a.isLocked && a.level === 2).length,
    gold: sampleAchievements.filter(a => !a.isLocked && a.level === 3).length,
  };
  
  return (
    <div className="space-y-6">
      {/* Achievement Stats */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Your Achievements
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Achievements are earned by engaging with different aspects of the app. Unlock more by using the app regularly!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>Track your progress and earn rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{achievementStats.unlocked}</div>
              <div className="text-xs text-muted-foreground">Unlocked</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-700">{achievementStats.bronze}</div>
              <div className="text-xs text-amber-700/70">Bronze</div>
            </div>
            <div className="bg-slate-100 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-slate-700">{achievementStats.silver}</div>
              <div className="text-xs text-slate-700/70">Silver</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-700">{achievementStats.gold}</div>
              <div className="text-xs text-yellow-700/70">Gold</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{sampleAchievements.filter(a => a.isNew && !a.isLocked).length}</div>
              <div className="text-xs text-red-700/70">New</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Achievements Tabs and Filtering */}
      <Tabs defaultValue="all" onValueChange={setActiveCategory}>
        <TabsList className="w-full mb-4 grid grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="emotion_tracking">Emotions</TabsTrigger>
          <TabsTrigger value="thought_records">Thoughts</TabsTrigger>
          <TabsTrigger value="journaling">Journals</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeCategory} className="space-y-4">
          {/* Unlocked Achievements */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Medal className="h-5 w-5 mr-2 text-slate-600" />
              Unlocked Achievements
            </h3>
            
            {unlockedAchievements.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No achievements in this category yet</p>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05 }}
              >
                {unlockedAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AchievementBadge
                      id={achievement.id}
                      name={achievement.name}
                      description={achievement.description}
                      type={achievement.type}
                      category={achievement.category}
                      isNew={achievement.isNew}
                      isLocked={achievement.isLocked}
                      level={achievement.level}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
          
          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Target className="h-5 w-5 mr-2 text-slate-600" />
                Achievements to Unlock
              </h3>
              <motion.div 
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 opacity-80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ staggerChildren: 0.05, delay: 0.3 }}
              >
                {lockedAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AchievementBadge
                      id={achievement.id}
                      name={achievement.name}
                      description={achievement.description}
                      type={achievement.type}
                      category={achievement.category}
                      isLocked={achievement.isLocked}
                      level={achievement.level}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}