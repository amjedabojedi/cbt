import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, TrendingUp, Calendar as CalendarIcon, Tag } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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
    queryKey: [`/api/users/${userId}/journal`],
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
      
      // Sentiment values are already percentages (0-100)
      const avgPositive = dayEntries.length > 0
        ? dayEntries.reduce((sum, e) => sum + (e.sentimentPositive || 0), 0) / dayEntries.length
        : 0;
      
      const avgNegative = dayEntries.length > 0
        ? dayEntries.reduce((sum, e) => sum + (e.sentimentNegative || 0), 0) / dayEntries.length
        : 0;
      
      const avgNeutral = dayEntries.length > 0
        ? dayEntries.reduce((sum, e) => sum + (e.sentimentNeutral || 0), 0) / dayEntries.length
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
    // Sentiment values are already stored as percentages (0-100), so no need to multiply by 100
    const avgSentimentPositive = entries.length > 0
      ? entries.reduce((sum, e) => sum + (e.sentimentPositive || 0), 0) / entries.length
      : 0;
    
    const avgSentimentNegative = entries.length > 0
      ? entries.reduce((sum, e) => sum + (e.sentimentNegative || 0), 0) / entries.length
      : 0;
    
    const avgSentimentNeutral = entries.length > 0
      ? entries.reduce((sum, e) => sum + (e.sentimentNeutral || 0), 0) / entries.length
      : 0;
    
    const avgMood = entries.filter(e => e.mood).length > 0
      ? entries.filter(e => e.mood).reduce((sum, e) => sum + (e.mood || 0), 0) / entries.filter(e => e.mood).length
      : 0;
    
    const mostCommonEmotion = getEmotionDistribution()[0]?.name || "None";
    
    return {
      totalEntries,
      avgPositivity: parseFloat(avgSentimentPositive.toFixed(1)),
      avgNegativity: parseFloat(avgSentimentNegative.toFixed(1)),
      avgNeutrality: parseFloat(avgSentimentNeutral.toFixed(1)),
      avgMood: parseFloat(avgMood.toFixed(1)),
      mostCommonEmotion,
    };
  };

  // Get radial gauge data for sentiment scores
  const getRadialGaugeData = () => {
    const stats = getOverallStats();
    return [
      {
        name: 'Positive',
        value: stats.avgPositivity,
        fill: '#22c55e',
      },
      {
        name: 'Negative',
        value: stats.avgNegativity,
        fill: '#ef4444',
      },
      {
        name: 'Neutral',
        value: stats.avgNeutrality,
        fill: '#6b7280',
      },
    ];
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

      {/* Radial Gauges - Overall Sentiment Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-center">Positive Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                barSize={20}
                data={[{ value: stats.avgPositivity, fill: '#22c55e' }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: '#e5e7eb' }}
                  dataKey="value"
                  cornerRadius={10}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-current text-3xl font-bold"
                  fill="#22c55e"
                >
                  {stats.avgPositivity}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Average positive emotion detected across all journal entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-center">Negative Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                barSize={20}
                data={[{ value: stats.avgNegativity, fill: '#ef4444' }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: '#e5e7eb' }}
                  dataKey="value"
                  cornerRadius={10}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-current text-3xl font-bold"
                  fill="#ef4444"
                >
                  {stats.avgNegativity}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Average negative emotion detected across all journal entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-center">Neutral Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                barSize={20}
                data={[{ value: stats.avgNeutrality, fill: '#6b7280' }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: '#e5e7eb' }}
                  dataKey="value"
                  cornerRadius={10}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-current text-3xl font-bold"
                  fill="#6b7280"
                >
                  {stats.avgNeutrality}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Average neutral emotion detected across all journal entries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stacked Area Chart - Sentiment Composition Over Time */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Sentiment Composition Over Time</CardTitle>
            </div>
            <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-auto">
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardDescription>Stacked view of sentiment distribution in your journal entries</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={getSentimentTrends()}>
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                label={{ value: 'Sentiment %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Area 
                type="monotone" 
                dataKey="positive" 
                stackId="1"
                stroke="#22c55e" 
                fill="url(#colorPositive)"
                strokeWidth={2}
                name="Positive %"
              />
              <Area 
                type="monotone" 
                dataKey="neutral" 
                stackId="1"
                stroke="#6b7280" 
                fill="url(#colorNeutral)"
                strokeWidth={2}
                name="Neutral %"
              />
              <Area 
                type="monotone" 
                dataKey="negative" 
                stackId="1"
                stroke="#ef4444" 
                fill="url(#colorNegative)"
                strokeWidth={2}
                name="Negative %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Original Sentiment Trends (Line Chart) */}
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

      {/* Emotion Word Cloud */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle>Emotion Word Cloud</CardTitle>
          </div>
          <CardDescription>Visual representation of emotions tagged in your entries</CardDescription>
        </CardHeader>
        <CardContent>
          {getEmotionDistribution().length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-3 p-6 min-h-[300px]">
              {getEmotionDistribution().map((emotion, index) => {
                const maxValue = Math.max(...getEmotionDistribution().map(e => e.value));
                const minValue = Math.min(...getEmotionDistribution().map(e => e.value));
                const range = maxValue - minValue || 1;
                const size = ((emotion.value - minValue) / range) * 3 + 1; // Scale from 1-4rem
                
                return (
                  <div
                    key={index}
                    className="inline-block px-3 py-2 rounded-lg transition-all hover:scale-110 cursor-default"
                    style={{
                      fontSize: `${size}rem`,
                      color: EMOTION_COLORS[index % EMOTION_COLORS.length],
                      fontWeight: 600,
                      opacity: 0.7 + (size / 8), // More frequent emotions are more opaque
                    }}
                    title={`${emotion.name}: ${emotion.value} times`}
                  >
                    {emotion.name}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No emotions detected yet
            </div>
          )}
        </CardContent>
      </Card>

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
