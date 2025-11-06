import { useQuery } from "@tanstack/react-query";
import useActiveUser from "./use-active-user";

interface EmotionStats {
  total: number;
  averageIntensity: number;
  mostCommon: string;
}

interface ThoughtStats {
  total: number;
  challengedPercentage: number;
  topANT: string;
}

interface JournalStats {
  total: number;
  averageRating: number;
  emotionsDetected: number;
}

interface GoalStats {
  total: number;
  completed: number;
  completedPercentage: number;
  activeMilestones: number;
}

interface ReframeStats {
  totalPractices: number;
  averageScore: number;
  improvementPercentage: number;
}

export interface ModuleStats {
  emotions: EmotionStats;
  thoughts: ThoughtStats;
  journal: JournalStats;
  goals: GoalStats;
  reframe: ReframeStats;
}

export function useModuleStats() {
  const { activeUserId } = useActiveUser();

  // Fetch all data in parallel
  const { data: emotions = [] } = useQuery<any[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!activeUserId,
  });

  const { data: thoughts = [] } = useQuery<any[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/thoughts`] : [],
    enabled: !!activeUserId,
  });

  const { data: journalEntries = [] } = useQuery<any[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/journal`] : [],
    enabled: !!activeUserId,
  });

  const { data: journalStats } = useQuery<any>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/journal/stats`] : [],
    enabled: !!activeUserId,
  });

  const { data: goals = [] } = useQuery<any[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/goals`] : [],
    enabled: !!activeUserId,
  });

  const { data: reframePractices = [] } = useQuery<any[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/reframe-coach/results`] : [],
    enabled: !!activeUserId,
  });

  // Calculate Emotion Stats
  const emotionCounts = emotions.reduce((acc: Record<string, number>, e: any) => {
    const emotion = e.coreEmotion || e.primaryEmotion || "Unknown";
    acc[emotion] = (acc[emotion] || 0) + 1;
    return acc;
  }, {});
  
  const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => (b[1] as number) - (a[1] as number));

  const emotionStats: EmotionStats = {
    total: emotions.length,
    averageIntensity: emotions.length > 0
      ? Math.round(emotions.reduce((sum: number, e: any) => sum + (e.intensity || 0), 0) / emotions.length)
      : 0,
    mostCommon: sortedEmotions.length > 0 ? sortedEmotions[0][0] : "None",
  };

  // Calculate Thought Stats
  const thoughtCategoryLabels: Record<string, string> = {
    all_or_nothing: "All or Nothing",
    mental_filter: "Mental Filter",
    mind_reading: "Mind Reading",
    fortune_telling: "Fortune Telling",
    labelling: "Labelling",
    magnification: "Magnification",
    catastrophizing: "Catastrophizing",
    emotional_reasoning: "Emotional Reasoning",
    should_statements: "Should Statements",
    personalization: "Personalization",
    overgeneralization: "Overgeneralization",
    disqualifying_positive: "Disqualifying Positive",
  };

  const challengedThoughts = thoughts.filter((t: any) => t.evidenceFor || t.evidenceAgainst || t.alternativePerspective);
  
  const antCounts = thoughts.reduce((acc: Record<string, number>, thought: any) => {
    if (thought.thoughtCategory && Array.isArray(thought.thoughtCategory)) {
      thought.thoughtCategory.forEach((category: string) => {
        const label = thoughtCategoryLabels[category] || category;
        acc[label] = (acc[label] || 0) + 1;
      });
    }
    return acc;
  }, {});

  const sortedANTs = Object.entries(antCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
  const topANT = sortedANTs.length > 0 ? sortedANTs[0][0] : "None";

  const thoughtStats: ThoughtStats = {
    total: thoughts.length,
    challengedPercentage: thoughts.length > 0 
      ? Math.round((challengedThoughts.length / thoughts.length) * 100)
      : 0,
    topANT,
  };

  // Calculate Journal Stats
  const journalRatings = journalEntries.filter(j => j.reflectionRating).map(j => j.reflectionRating);
  const journalStats_: JournalStats = {
    total: journalEntries.length,
    averageRating: journalRatings.length > 0
      ? Math.round((journalRatings.reduce((sum, r) => sum + r, 0) / journalRatings.length) * 10) / 10
      : 0,
    emotionsDetected: journalStats?.emotions ? Object.keys(journalStats.emotions).length : 0,
  };

  // Calculate Goal Stats
  const completedGoals = goals.filter(g => g.status === 'completed');
  const goalStats: GoalStats = {
    total: goals.length,
    completed: completedGoals.length,
    completedPercentage: goals.length > 0
      ? Math.round((completedGoals.length / goals.length) * 100)
      : 0,
    activeMilestones: 0, // Will be calculated separately if needed
  };

  // Calculate Reframe Stats
  const scores = reframePractices.filter(p => p.score).map(p => p.score);
  const recentScores = scores.slice(-5); // Last 5 practices
  const olderScores = scores.slice(0, -5); // Earlier practices
  
  const recentAvg = recentScores.length > 0
    ? recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length
    : 0;
  
  const olderAvg = olderScores.length > 0
    ? olderScores.reduce((sum, s) => sum + s, 0) / olderScores.length
    : 0;
  
  const improvementPercentage = olderAvg > 0 && recentAvg > 0
    ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100)
    : 0;

  const reframeStats: ReframeStats = {
    totalPractices: reframePractices.length,
    averageScore: scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0,
    improvementPercentage,
  };

  return {
    emotions: emotionStats,
    thoughts: thoughtStats,
    journal: journalStats_,
    goals: goalStats,
    reframe: reframeStats,
    isLoading: false, // You can add individual loading states if needed
  };
}
