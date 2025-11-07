import { useQuery } from "@tanstack/react-query";
import type { EmotionRecord, ThoughtRecord, Goal, JournalEntry, ReframePracticeResult } from "@shared/schema";
import { subDays } from "date-fns";

// Emotion type classification (CBT evidence-based, aligned with emotion wheel)
// Based on clinical psychology affect classification
// Positive affect: Joy and Love families
const POSITIVE_EMOTIONS = ["Joy", "Love"];
// Negative affect: Sadness, Fear, Anger, Disgust families
const NEGATIVE_EMOTIONS = ["Sadness", "Fear", "Anger", "Disgust"];
// Note: Surprise is context-dependent and excluded from balance calculation
// to maintain clinical validity

interface ProgressInsights {
  // Activity metrics
  totalActivities: number;
  emotionCount: number;
  thoughtCount: number;
  journalCount: number;
  goalCount: number;
  reframeCount: number;
  
  // Emotional balance (evidence-based: positive vs negative separation)
  emotionalBalance: {
    negativeIntensity: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    positiveIntensity: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    negativeFrequency: number;
    positiveFrequency: number;
  };
  
  // Thought challenge rate (CBT evidence-based)
  thoughtChallengeRate: {
    rate: number; // Percentage
    challenged: number;
    total: number;
  };
  
  // Goal progress
  goalProgress: {
    completionRate: number;
    completed: number;
    inProgress: number;
    pending: number;
    total: number;
  };
  
  // Cross-module data for timeline
  timeline: Array<{
    id: string;
    type: "emotion" | "thought" | "journal" | "goal" | "reframe";
    date: Date;
    title: string;
    icon: string;
    color: string;
  }>;
  
  // Pattern recognition
  topCognitiveDistortion: {
    name: string;
    count: number;
    percentage: number;
  } | null;
  
  // Loading states
  isLoading: boolean;
  
  // Raw data for advanced calculations
  rawData: {
    emotions: EmotionRecord[];
    thoughts: ThoughtRecord[];
    journals: JournalEntry[];
    goals: Goal[];
    reframeResults: ReframePracticeResult[];
  };
}

export function useProgressInsights(userId: number | undefined, timeRange: "week" | "month" | "all" = "month"): ProgressInsights {
  // Fetch all module data
  const { data: emotions = [], isLoading: emotionsLoading } = useQuery<EmotionRecord[]>({
    queryKey: [`/api/users/${userId}/emotions`],
    enabled: !!userId,
  });
  
  const { data: thoughts = [], isLoading: thoughtsLoading } = useQuery<ThoughtRecord[]>({
    queryKey: [`/api/users/${userId}/thoughts`],
    enabled: !!userId,
  });
  
  const { data: journals = [], isLoading: journalsLoading } = useQuery<JournalEntry[]>({
    queryKey: [`/api/users/${userId}/journal`],
    enabled: !!userId,
  });
  
  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: [`/api/users/${userId}/goals`],
    enabled: !!userId,
  });
  
  const { data: reframeResults = [], isLoading: reframeLoading } = useQuery<ReframePracticeResult[]>({
    queryKey: [`/api/users/${userId}/reframe-coach/results`],
    enabled: !!userId,
  });
  
  const isLoading = emotionsLoading || thoughtsLoading || journalsLoading || goalsLoading || reframeLoading;
  
  // Filter data by time range - no generic, just use actual types
  const filterEmotions = (data: EmotionRecord[]): EmotionRecord[] => {
    if (timeRange === "all") return data;
    const now = new Date();
    const daysAgo = timeRange === "week" ? 7 : 30;
    const startDate = subDays(now, daysAgo);
    return data.filter(item => {
      const itemDate = new Date(item.timestamp || item.createdAt);
      return itemDate >= startDate;
    });
  };
  
  const filterThoughts = (data: ThoughtRecord[]): ThoughtRecord[] => {
    if (timeRange === "all") return data;
    const now = new Date();
    const daysAgo = timeRange === "week" ? 7 : 30;
    const startDate = subDays(now, daysAgo);
    return data.filter(item => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= startDate;
    });
  };
  
  const filterJournals = (data: JournalEntry[]): JournalEntry[] => {
    if (timeRange === "all") return data;
    const now = new Date();
    const daysAgo = timeRange === "week" ? 7 : 30;
    const startDate = subDays(now, daysAgo);
    return data.filter(item => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= startDate;
    });
  };
  
  const filterGoals = (data: Goal[]): Goal[] => {
    if (timeRange === "all") return data;
    const now = new Date();
    const daysAgo = timeRange === "week" ? 7 : 30;
    const startDate = subDays(now, daysAgo);
    return data.filter(item => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= startDate;
    });
  };
  
  const filterReframe = (data: ReframePracticeResult[]): ReframePracticeResult[] => {
    if (timeRange === "all") return data;
    const now = new Date();
    const daysAgo = timeRange === "week" ? 7 : 30;
    const startDate = subDays(now, daysAgo);
    return data.filter(item => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= startDate;
    });
  };
  
  const filteredEmotions = filterEmotions(emotions);
  const filteredThoughts = filterThoughts(thoughts);
  const filteredJournals = filterJournals(journals);
  const filteredGoals = filterGoals(goals);
  const filteredReframe = filterReframe(reframeResults);
  
  // Calculate activity counts
  const totalActivities = filteredEmotions.length + filteredThoughts.length + 
                          filteredJournals.length + filteredGoals.length + 
                          filteredReframe.length;
  
  // Calculate emotional balance (CBT evidence-based: separate positive/negative)
  const calculateEmotionalBalance = () => {
    if (filteredEmotions.length === 0) {
      return {
        negativeIntensity: { current: 0, previous: 0, change: 0, changePercent: 0 },
        positiveIntensity: { current: 0, previous: 0, change: 0, changePercent: 0 },
        negativeFrequency: 0,
        positiveFrequency: 0,
      };
    }
    
    // Split current period in half for comparison
    const midpoint = new Date();
    if (timeRange === "week") {
      midpoint.setDate(midpoint.getDate() - 3);
    } else if (timeRange === "month") {
      midpoint.setDate(midpoint.getDate() - 15);
    } else {
      midpoint.setDate(midpoint.getDate() - 30);
    }
    
    const recentEmotions = filteredEmotions.filter(e => 
      new Date(e.timestamp || e.createdAt) >= midpoint
    );
    const previousEmotions = filteredEmotions.filter(e => 
      new Date(e.timestamp || e.createdAt) < midpoint
    );
    
    // Calculate negative emotion intensity
    const calcAvgIntensity = (emos: EmotionRecord[], type: "negative" | "positive") => {
      const emotionList = type === "negative" ? NEGATIVE_EMOTIONS : POSITIVE_EMOTIONS;
      const filtered = emos.filter(e => emotionList.includes(e.coreEmotion));
      if (filtered.length === 0) return 0;
      return filtered.reduce((sum, e) => sum + e.intensity, 0) / filtered.length;
    };
    
    const currentNegative = calcAvgIntensity(recentEmotions, "negative");
    const previousNegative = calcAvgIntensity(previousEmotions, "negative");
    const negativeChange = currentNegative - previousNegative;
    const negativeChangePercent = previousNegative > 0 
      ? ((negativeChange / previousNegative) * 100) 
      : 0;
    
    const currentPositive = calcAvgIntensity(recentEmotions, "positive");
    const previousPositive = calcAvgIntensity(previousEmotions, "positive");
    const positiveChange = currentPositive - previousPositive;
    const positiveChangePercent = previousPositive > 0 
      ? ((positiveChange / previousPositive) * 100) 
      : 0;
    
    const negativeFrequency = filteredEmotions.filter(e => 
      NEGATIVE_EMOTIONS.includes(e.coreEmotion)
    ).length;
    const positiveFrequency = filteredEmotions.filter(e => 
      POSITIVE_EMOTIONS.includes(e.coreEmotion)
    ).length;
    
    return {
      negativeIntensity: {
        current: Math.round(currentNegative * 10) / 10,
        previous: Math.round(previousNegative * 10) / 10,
        change: Math.round(negativeChange * 10) / 10,
        changePercent: Math.round(negativeChangePercent),
      },
      positiveIntensity: {
        current: Math.round(currentPositive * 10) / 10,
        previous: Math.round(previousPositive * 10) / 10,
        change: Math.round(positiveChange * 10) / 10,
        changePercent: Math.round(positiveChangePercent),
      },
      negativeFrequency,
      positiveFrequency,
    };
  };
  
  // Calculate thought challenge rate (CBT evidence-based metric)
  const calculateThoughtChallengeRate = () => {
    if (filteredThoughts.length === 0) {
      return { rate: 0, challenged: 0, total: 0 };
    }
    
    const challenged = filteredThoughts.filter(t => 
      t.evidenceFor || t.evidenceAgainst || t.alternativePerspective
    ).length;
    
    const rate = Math.round((challenged / filteredThoughts.length) * 100);
    
    return { rate, challenged, total: filteredThoughts.length };
  };
  
  // Calculate goal progress
  const calculateGoalProgress = () => {
    if (filteredGoals.length === 0) {
      return { completionRate: 0, completed: 0, inProgress: 0, pending: 0, total: 0 };
    }
    
    const completed = filteredGoals.filter(g => 
      g.status === "completed" || g.status === "approved"
    ).length;
    const inProgress = filteredGoals.filter(g => g.status === "in_progress").length;
    const pending = filteredGoals.filter(g => g.status === "pending").length;
    const completionRate = Math.round((completed / filteredGoals.length) * 100);
    
    return {
      completionRate,
      completed,
      inProgress,
      pending,
      total: filteredGoals.length,
    };
  };
  
  // Build unified timeline
  const buildTimeline = () => {
    const timelineItems: ProgressInsights["timeline"] = [];
    
    // Add emotions
    filteredEmotions.forEach(emotion => {
      timelineItems.push({
        id: `emotion-${emotion.id}`,
        type: "emotion",
        date: new Date(emotion.timestamp || emotion.createdAt),
        title: `Tracked ${emotion.coreEmotion}`,
        icon: "Heart",
        color: "#3b82f6", // Blue
      });
    });
    
    // Add thoughts
    filteredThoughts.forEach(thought => {
      timelineItems.push({
        id: `thought-${thought.id}`,
        type: "thought",
        date: new Date(thought.createdAt),
        title: "Recorded thought",
        icon: "Brain",
        color: "#9333ea", // Purple
      });
    });
    
    // Add journals
    filteredJournals.forEach(journal => {
      timelineItems.push({
        id: `journal-${journal.id}`,
        type: "journal",
        date: new Date(journal.createdAt),
        title: journal.title,
        icon: "BookOpen",
        color: "#eab308", // Yellow
      });
    });
    
    // Add goals
    filteredGoals.forEach(goal => {
      timelineItems.push({
        id: `goal-${goal.id}`,
        type: "goal",
        date: new Date(goal.createdAt),
        title: `Created goal: ${goal.title}`,
        icon: "Target",
        color: "#6366f1", // Indigo
      });
    });
    
    // Add reframe practice
    filteredReframe.forEach(result => {
      timelineItems.push({
        id: `reframe-${result.id}`,
        type: "reframe",
        date: new Date(result.createdAt),
        title: `Practiced reframing (${result.score} pts)`,
        icon: "Lightbulb",
        color: "#16a34a", // Green
      });
    });
    
    // Sort by date (most recent first)
    return timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30);
  };
  
  // Find top cognitive distortion
  const findTopDistortion = () => {
    const distortionCounts: Record<string, number> = {};
    
    filteredThoughts.forEach(thought => {
      if (thought.cognitiveDistortions && Array.isArray(thought.cognitiveDistortions)) {
        thought.cognitiveDistortions.forEach((distortion: string) => {
          distortionCounts[distortion] = (distortionCounts[distortion] || 0) + 1;
        });
      }
    });
    
    const entries = Object.entries(distortionCounts);
    if (entries.length === 0) return null;
    
    const [name, count] = entries.reduce((max, entry) => 
      entry[1] > max[1] ? entry : max
    );
    
    const total = filteredThoughts.length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    
    // Format distortion name
    const formattedName = name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return { name: formattedName, count, percentage };
  };
  
  return {
    totalActivities,
    emotionCount: filteredEmotions.length,
    thoughtCount: filteredThoughts.length,
    journalCount: filteredJournals.length,
    goalCount: filteredGoals.length,
    reframeCount: filteredReframe.length,
    emotionalBalance: calculateEmotionalBalance(),
    thoughtChallengeRate: calculateThoughtChallengeRate(),
    goalProgress: calculateGoalProgress(),
    timeline: buildTimeline(),
    topCognitiveDistortion: findTopDistortion(),
    isLoading,
    rawData: {
      emotions: filteredEmotions,
      thoughts: filteredThoughts,
      journals: filteredJournals,
      goals: filteredGoals,
      reframeResults: filteredReframe,
    },
  };
}
