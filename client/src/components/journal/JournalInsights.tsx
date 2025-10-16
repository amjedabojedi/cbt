import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, TrendingUp, Calendar as CalendarIcon, Tag } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";

interface JournalInsightsProps {
  userId: number;
}

const EMOTION_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#a18dff",
  "#ff9f9f", "#6ec9c9", "#ffb347", "#c9a0dc", "#99c9ff",
];

export default function JournalInsights({ userId }: JournalInsightsProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  // Fetch journal entries
  const { data: entries = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/journal-entries`],
    enabled: !!userId,
  });

  // Calculate sentiment trends
  const getSentimentTrends = () => {
    let startDate: Date;
    
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
    } else {
      if (entries.length === 0) return [];
      startDate = new Date(Math.min(...entries.map(e => new Date(e.createdAt).getTime())));
    }

    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEntries = entries.filter(e => 
        format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      const avgPositive = dayEntries.length > 0
        ? (dayEntries.reduce((sum, e) => sum + (e.sentimentPositive || 0), 0) / dayEntries.length) * 100
        : 0;
      
      const avgNegative = dayEntries.length > 0
        ? (dayEntries.reduce((sum, e) => sum + (e.sentimentNegative || 0), 0) / dayEntries.length) * 100
        : 0;
      
      const avgNeutral = dayEntries.length > 0
        ? (dayEntries.reduce((sum, e) => sum + (e.sentimentNeutral || 0), 0) / dayEntries.length) * 100
        : 0;
      
      return {
        date: format(day, "MMM d"),
        positive: parseFloat(avgPositive.toFixed(1)),
        negative: parseFloat(avgNegative.toFixed(1)),
        neutral: parseFloat(avgNeutral.toFixed(1)),
        count: dayEntries.length,
      };
    });
  };

  // Calculate writing frequency
  const getWritingFrequency = () => {
    const last30Days = eachDayOfInterval({ 
      start: subDays(new Date(), 29), 
      end: new Date() 
    });
    
    return last30Days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEntries = entries.filter(e => 
        format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      return {
        date: format(day, "MMM d"),
        count: dayEntries.length,
      };
    });
  };

  // Calculate emotion distribution
  const getEmotionDistribution = () => {
    const emotionCounts: Record<string, number> = {};
    
    entries.forEach(entry => {
      if (entry.emotions && Array.isArray(entry.emotions)) {
        entry.emotions.forEach((emotion: string) => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
      }
    });
    
    return Object.entries(emotionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 emotions
  };

  // Calculate topic analysis
  const getTopicAnalysis = () => {
    const topicCounts: Record<string, number> = {};
    
    entries.forEach(entry => {
      if (entry.topics && Array.isArray(entry.topics)) {
        entry.topics.forEach((topic: string) => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });
    
    return Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 topics
  };

  // Calculate mood trends
  const getMoodTrends = () => {
    let startDate: Date;
    
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
    } else {
      if (entries.length === 0) return [];
      startDate = new Date(Math.min(...entries.map(e => new Date(e.createdAt).getTime())));
    }

    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEntries = entries.filter(e => 
        format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr && e.mood
      );
      
      const avgMood = dayEntries.length > 0
        ? dayEntries.reduce((sum, e) => sum + (e.mood || 0), 0) / dayEntries.length
        : 0;
      
      return {
        date: format(day, "MMM d"),
        mood: parseFloat(avgMood.toFixed(1)),
        count: dayEntries.length,
      };
    });
  };

  // Calculate overall stats
  const getOverallStats = () => {
    const totalEntries = entries.length;
    const avgSentimentPositive = entries.length > 0
      ? (entries.reduce((sum, e) => sum + (e.sentimentPositive || 0), 0) / entries.length) * 100
      : 0;
    
    const avgMood = entries.filter(e => e.mood).length > 0
      ? entries.filter(e => e.mood).reduce((sum, e) => sum + (e.mood || 0), 0) / entries.filter(e => e.mood).length
      : 0;
    
    const mostCommonEmotion = getEmotionDistribution()[0]?.name || "None";
    
    return {
      totalEntries,
      avgPositivity: parseFloat(avgSentimentPositive.toFixed(1)),
      avgMood: parseFloat(avgMood.toFixed(1)),
      mostCommonEmotion,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No journal entries yet. Start writing to see insights!</p>
        </CardContent>
      </Card>
    );
  }

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalEntries}</div>
            <p className="text-xs text-muted-foreground mt-1">Journal entries written</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Positivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.avgPositivity}%</div>
            <p className="text-xs text-muted-foreground mt-1">Positive sentiment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Mood</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.avgMood}/10</div>
            <p className="text-xs text-muted-foreground mt-1">Self-reported mood</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Most Common</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.mostCommonEmotion}</div>
            <p className="text-xs text-muted-foreground mt-1">Detected emotion</p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Sentiment Trends</CardTitle>
            </div>
            <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-auto">
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardDescription>AI-detected sentiment in your journal entries</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getSentimentTrends()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="positive" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Positive %"
              />
              <Line 
                type="monotone" 
                dataKey="negative" 
                stroke="#ff7c7c" 
                strokeWidth={2}
                name="Negative %"
              />
              <Line 
                type="monotone" 
                dataKey="neutral" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Neutral %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emotion Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Detected Emotions</CardTitle>
            </div>
            <CardDescription>AI-identified emotions in your writing</CardDescription>
          </CardHeader>
          <CardContent>
            {getEmotionDistribution().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getEmotionDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getEmotionDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EMOTION_COLORS[index % EMOTION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No emotions detected yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Topic Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <CardTitle>Topic Analysis</CardTitle>
            </div>
            <CardDescription>Common themes in your journal</CardDescription>
          </CardHeader>
          <CardContent>
            {getTopicAnalysis().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTopicAnalysis()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No topics detected yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Writing Frequency Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <CardTitle>30-Day Writing Calendar</CardTitle>
          </div>
          <CardDescription>Your journaling consistency over the past month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1">
            {getWritingFrequency().map((day, i) => {
              const count = day.count;
              const bgColor = 
                count === 0 ? "bg-gray-100 dark:bg-gray-800" :
                count === 1 ? "bg-green-200 dark:bg-green-900" :
                count === 2 ? "bg-green-400 dark:bg-green-700" :
                "bg-green-600 dark:bg-green-500";
              
              return (
                <div
                  key={i}
                  className={`aspect-square rounded ${bgColor} flex items-center justify-center text-xs font-medium relative group`}
                  title={`${day.date}: ${count} entries`}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {day.date}: {count} {count === 1 ? 'entry' : 'entries'}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
              <span>None</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded" />
              <span>1 entry</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 dark:bg-green-700 rounded" />
              <span>2 entries</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-600 dark:bg-green-500 rounded" />
              <span>3+ entries</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mood Trends */}
      {entries.some(e => e.mood) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Mood Trends</CardTitle>
              </div>
              <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-auto">
                <TabsList>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="all">All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>Your self-reported mood ratings over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getMoodTrends()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Mood Rating"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
