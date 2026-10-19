import { useQuery } from "@tanstack/react-query";
import type { EmotionRecord, ThoughtRecord, Goal, JournalEntry, ReframePracticeResult } from "@shared/schema";
import { subDays } from "date-fns";
import { emotionalBalance, goalProgress, type EmotionalBalance } from "@shared/progress-metrics";

export interface ProgressDataStatus {
  available: boolean;
  loading: boolean;
  refreshing: boolean;
  error: boolean;
}

export type ProgressModules = Record<"emotions" | "thoughts" | "journals" | "goals" | "reframe", ProgressDataStatus>;

export function combineProgressStatus(statuses: ProgressDataStatus[]): ProgressDataStatus {
  return {
    available: statuses.every(status => status.available),
    loading: statuses.some(status => status.loading),
    refreshing: statuses.some(status => status.refreshing),
    error: statuses.some(status => status.error),
  };
}

interface ProgressInsights {
  modules: ProgressModules;
  status: ProgressDataStatus;
  retry: () => Promise<unknown>;
  // Activity metrics
  totalActivities: number;
  emotionCount: number;
  thoughtCount: number;
  journalCount: number;
  goalCount: number;
  reframeCount: number;
  
  // Emotional balance (evidence-based: positive vs negative separation)
  emotionalBalance: EmotionalBalance;
  
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
  const emotionsQuery = useQuery<EmotionRecord[]>({
    queryKey: [`/api/users/${userId}/emotions`],
    enabled: !!userId,
  });
  
  const thoughtsQuery = useQuery<ThoughtRecord[]>({
    queryKey: [`/api/users/${userId}/thoughts`],
    enabled: !!userId,
  });
  
  const journalsQuery = useQuery<JournalEntry[]>({
    queryKey: [`/api/users/${userId}/journal`],
    enabled: !!userId,
  });
  
  const goalsQuery = useQuery<Goal[]>({
    queryKey: [`/api/users/${userId}/goals`],
    enabled: !!userId,
  });
  
  const reframeQuery = useQuery<ReframePracticeResult[]>({
    queryKey: [`/api/users/${userId}/reframe-coach/results`],
    enabled: !!userId,
  });
  
  const queries = { emotions: emotionsQuery, thoughts: thoughtsQuery, journals: journalsQuery, goals: goalsQuery, reframe: reframeQuery };
  const modules = Object.fromEntries(Object.entries(queries).map(([key, query]) => [key, {
    available: query.data !== undefined,
    loading: query.data === undefined && query.isPending,
    refreshing: query.isFetching,
    error: query.isError,
  }])) as ProgressModules;
  const status = combineProgressStatus(Object.values(modules));
  const retry = () => Promise.all(Object.values(queries)
    .filter(query => query.isError && !query.isFetching)
    .map(query => query.refetch()));
  const emotions = emotionsQuery.data ?? [];
  const thoughts = thoughtsQuery.data ?? [];
  const journals = journalsQuery.data ?? [];
  const goals = goalsQuery.data ?? [];
  const reframeResults = reframeQuery.data ?? [];
  const isLoading = status.loading;
  
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
    return emotionalBalance(filteredEmotions, timeRange);
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
    return goalProgress(filteredGoals);
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
    modules,
    status,
    retry,
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
