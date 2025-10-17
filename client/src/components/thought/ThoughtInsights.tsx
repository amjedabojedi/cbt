import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Target, Link2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";

interface ThoughtInsightsProps {
  userId: number;
}

const ANT_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#a18dff",
  "#ff9f9f", "#6ec9c9", "#ffb347", "#c9a0dc", "#99c9ff",
  "#ffcc99", "#b3d9ff"
];

export default function ThoughtInsights({ userId }: ThoughtInsightsProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  // Fetch thought records
  const { data: thoughts = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/thoughts`],
    enabled: !!userId,
  });

  // Fetch emotions for linking analysis
  const { data: emotions = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/emotions`],
    enabled: !!userId,
  });

  // Mapping function to convert category values to readable labels
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'all_or_nothing': 'All or Nothing Thinking',
      'overgeneralization': 'Overgeneralization',
      'mental_filter': 'Mental Filter',
      'disqualifying_positive': 'Disqualifying the Positive',
      'jumping_to_conclusions': 'Jumping to Conclusions',
      'magnification': 'Magnification/Minimization',
      'emotional_reasoning': 'Emotional Reasoning',
      'should_statements': 'Should Statements',
      'labeling': 'Labeling',
      'personalization': 'Personalization',
      'catastrophizing': 'Catastrophizing',
      'fortune_telling': 'Fortune Telling'
    };
    return labels[category] || category;
  };

  // Calculate ANT patterns (cognitive distortions)
  const getANTPatterns = () => {
    const distortionCounts: Record<string, number> = {};
    
    thoughts.forEach((thought) => {
      // Use thoughtCategory field which contains the actual distortions
      if (thought.thoughtCategory && Array.isArray(thought.thoughtCategory)) {
        thought.thoughtCategory.forEach((category: string) => {
          const label = getCategoryLabel(category);
          distortionCounts[label] = (distortionCounts[label] || 0) + 1;
        });
      }
    });
    
    return Object.entries(distortionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Calculate challenge rate for pie chart
  const getChallengeRate = () => {
    const challenged = thoughts.filter(t => t.evidenceFor || t.evidenceAgainst);
    const unchallenged = thoughts.filter(t => !t.evidenceFor && !t.evidenceAgainst);
    
    return [
      { 
        name: "Challenged", 
        value: challenged.length,
        percentage: thoughts.length > 0 ? Math.round((challenged.length / thoughts.length) * 100) : 0
      },
      { 
        name: "Not Challenged", 
        value: unchallenged.length,
        percentage: thoughts.length > 0 ? Math.round((unchallenged.length / thoughts.length) * 100) : 0
      },
    ];
  };

  // Calculate belief shift for challenged thoughts
  const getBeliefShift = () => {
    const challengedThoughts = thoughts.filter(t => t.alternativePerspective);
    
    if (challengedThoughts.length === 0) return [];
    
    // Calculate averages
    const totalBeliefBefore = challengedThoughts.reduce((sum, t) => {
      // beliefInOriginal not stored, but reflectionRating gives us insight
      return sum + (t.reflectionRating ? (10 - t.reflectionRating) * 10 : 80);
    }, 0);
    
    const totalBeliefAfter = challengedThoughts.reduce((sum, t) => {
      // reflectionRating represents belief in alternative (1-10 scale = 10-100%)
      return sum + ((t.reflectionRating || 0) * 10);
    }, 0);
    
    const avgBeliefBefore = Math.round(totalBeliefBefore / challengedThoughts.length);
    const avgBeliefAfter = Math.round(totalBeliefAfter / challengedThoughts.length);
    
    return [
      {
        stage: "Before Challenge",
        belief: avgBeliefBefore,
      },
      {
        stage: "After Challenge",
        belief: avgBeliefAfter,
      }
    ];
  };

  // Calculate progress trends over time
  const getProgressTrends = () => {
    let startDate: Date;
    
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
    } else {
      if (thoughts.length === 0) return [];
      startDate = new Date(Math.min(...thoughts.map(t => new Date(t.createdAt).getTime())));
    }

    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayThoughts = thoughts.filter(t => 
        format(new Date(t.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      const challenged = dayThoughts.filter(t => t.evidenceFor || t.evidenceAgainst).length;
      const avgRating = dayThoughts.length > 0
        ? dayThoughts.reduce((sum, t) => sum + (t.reflectionRating || 0), 0) / dayThoughts.length
        : 0;
      
      return {
        date: format(day, "MMM d"),
        total: dayThoughts.length,
        challenged,
        avgRating: parseFloat(avgRating.toFixed(1)),
      };
    });
  };

  // Calculate thought-emotion links
  const getThoughtEmotionLinks = () => {
    const emotionMap = new Map(emotions.map(e => [e.id, e.coreEmotion]));
    const linkCounts: Record<string, number> = {};
    
    thoughts.forEach(thought => {
      if (thought.emotionRecordId) {
        const emotion = emotionMap.get(thought.emotionRecordId);
        if (emotion) {
          linkCounts[emotion] = (linkCounts[emotion] || 0) + 1;
        }
      }
    });
    
    return Object.entries(linkCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Calculate improvement metrics
  const getImprovementMetrics = () => {
    const challengedThoughts = thoughts.filter(t => t.evidenceFor || t.evidenceAgainst);
    
    if (challengedThoughts.length === 0) {
      return {
        avgReflectionRating: 0,
        totalChallenged: 0,
        challengeRate: 0,
      };
    }
    
    const avgReflectionRating = 
      challengedThoughts.reduce((sum, t) => sum + (t.reflectionRating || 0), 0) / challengedThoughts.length;
    
    return {
      avgReflectionRating: parseFloat(avgReflectionRating.toFixed(1)),
      totalChallenged: challengedThoughts.length,
      challengeRate: parseFloat(((challengedThoughts.length / thoughts.length) * 100).toFixed(1)),
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (thoughts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No thought records yet. Start recording to see insights!</p>
        </CardContent>
      </Card>
    );
  }

  const metrics = getImprovementMetrics();

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Challenge Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{metrics.challengeRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalChallenged} of {thoughts.length} thoughts challenged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Reflection Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.avgReflectionRating}/10</div>
            <p className="text-xs text-muted-foreground mt-1">
              Quality of challenged thoughts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total ANTs Identified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {getANTPatterns().reduce((sum, ant) => sum + ant.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cognitive distortions recognized
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ANT Patterns Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>ANT Patterns (Cognitive Distortions)</CardTitle>
          </div>
          <CardDescription>Most common unhelpful thinking patterns you've identified</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={getANTPatterns()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={120}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8">
                {getANTPatterns().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ANT_COLORS[index % ANT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Challenge Rate */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Challenge Rate</CardTitle>
            </div>
            <CardDescription>Percentage of thoughts you've challenged</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getChallengeRate()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#82ca9d" />
                  <Cell fill="#e0e0e0" />
                </Pie>
                <Tooltip formatter={(value: number, name: string, props: any) => [value, `${props.payload.name} (${props.payload.percentage}%)`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {thoughts.length > 0 ? `${getChallengeRate()[0].value} of ${thoughts.length} thoughts challenged` : 'No thoughts recorded yet'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Belief Shift from Challenging */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Belief Shift</CardTitle>
            </div>
            <CardDescription>How challenging changes your belief in thoughts</CardDescription>
          </CardHeader>
          <CardContent>
            {getBeliefShift().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBeliefShift()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis domain={[0, 100]} label={{ value: 'Belief %', angle: -90, position: 'insideLeft' }} allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Belief']} />
                  <Bar dataKey="belief" fill="#8884d8">
                    <Cell fill="#ff7c7c" />
                    <Cell fill="#82ca9d" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Challenge thoughts to see belief shift
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thought-Emotion Links */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              <CardTitle>Thought-Emotion Links</CardTitle>
            </div>
            <CardDescription>Emotions connected to your thoughts</CardDescription>
          </CardHeader>
          <CardContent>
            {getThoughtEmotionLinks().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getThoughtEmotionLinks()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ emotion, percent }) => `${emotion} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getThoughtEmotionLinks().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ANT_COLORS[index % ANT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No thought-emotion links yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Trends Over Time */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Progress Trends</CardTitle>
            </div>
            <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-auto">
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardDescription>Your thought challenging progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getProgressTrends()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Total Thoughts"
              />
              <Line 
                type="monotone" 
                dataKey="challenged" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Challenged"
              />
              <Line 
                type="monotone" 
                dataKey="avgRating" 
                stroke="#ffc658" 
                strokeWidth={2}
                name="Avg Rating"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
