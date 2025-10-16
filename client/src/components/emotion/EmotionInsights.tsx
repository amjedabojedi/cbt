import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, PieChart as PieChartIcon, Calendar as CalendarIcon, Clock } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, parseISO } from "date-fns";

interface EmotionInsightsProps {
  userId: number;
}

const EMOTION_COLORS: Record<string, string> = {
  "Joy": "#FFC107",
  "Sadness": "#3F51B5",
  "Fear": "#8A65AA",
  "Anger": "#F44336",
  "Disgust": "#4CAF50",
  "Surprise": "#FF9800",
  "Love": "#E91E63",
};

export default function EmotionInsights({ userId }: EmotionInsightsProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");

  // Fetch emotion records
  const { data: emotions = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/emotions`],
    enabled: !!userId,
  });

  // Calculate emotion distribution
  const getEmotionDistribution = () => {
    const counts: Record<string, number> = {};
    emotions.forEach((e) => {
      counts[e.coreEmotion] = (counts[e.coreEmotion] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: EMOTION_COLORS[name] || "#999",
    }));
  };

  // Calculate mood trends over time
  const getMoodTrends = () => {
    let startDate: Date;
    
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
    } else {
      startDate = new Date(Math.min(...emotions.map(e => new Date(e.createdAt).getTime())));
    }

    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEmotions = emotions.filter(e => 
        format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      const avgIntensity = dayEmotions.length > 0
        ? dayEmotions.reduce((sum, e) => sum + e.intensity, 0) / dayEmotions.length
        : 0;
      
      return {
        date: format(day, "MMM d"),
        intensity: parseFloat(avgIntensity.toFixed(1)),
        count: dayEmotions.length,
      };
    });
  };

  // Calculate intensity heatmap data
  const getIntensityHeatmap = () => {
    const last30Days = eachDayOfInterval({ 
      start: subDays(new Date(), 29), 
      end: new Date() 
    });
    
    return last30Days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEmotions = emotions.filter(e => 
        format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      const avgIntensity = dayEmotions.length > 0
        ? dayEmotions.reduce((sum, e) => sum + e.intensity, 0) / dayEmotions.length
        : 0;
      
      return {
        date: format(day, "MMM d"),
        intensity: avgIntensity,
        count: dayEmotions.length,
      };
    });
  };

  // Calculate time of day patterns
  const getTimePatterns = () => {
    const timeSlots = {
      "Morning (6-12)": 0,
      "Afternoon (12-18)": 0,
      "Evening (18-24)": 0,
      "Night (0-6)": 0,
    };
    
    emotions.forEach(e => {
      const hour = new Date(e.createdAt).getHours();
      if (hour >= 6 && hour < 12) timeSlots["Morning (6-12)"]++;
      else if (hour >= 12 && hour < 18) timeSlots["Afternoon (12-18)"]++;
      else if (hour >= 18 && hour < 24) timeSlots["Evening (18-24)"]++;
      else timeSlots["Night (0-6)"]++;
    });
    
    return Object.entries(timeSlots).map(([time, count]) => ({
      time,
      count,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (emotions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No emotion data yet. Start tracking to see insights!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mood Trends Chart */}
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
          <CardDescription>Average emotional intensity over time</CardDescription>
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
                dataKey="intensity" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Avg Intensity"
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="# Tracked"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two-column layout for distribution and time patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emotion Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              <CardTitle>Emotion Distribution</CardTitle>
            </div>
            <CardDescription>Breakdown of tracked emotions</CardDescription>
          </CardHeader>
          <CardContent>
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time of Day Patterns */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Time Patterns</CardTitle>
            </div>
            <CardDescription>When you track emotions most</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTimePatterns()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Intensity Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <CardTitle>30-Day Intensity Calendar</CardTitle>
          </div>
          <CardDescription>Average emotional intensity per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1">
            {getIntensityHeatmap().map((day, i) => {
              const intensity = day.intensity;
              const bgColor = 
                intensity === 0 ? "bg-gray-100 dark:bg-gray-800" :
                intensity <= 3 ? "bg-green-200 dark:bg-green-900" :
                intensity <= 6 ? "bg-yellow-200 dark:bg-yellow-900" :
                "bg-red-200 dark:bg-red-900";
              
              return (
                <div
                  key={i}
                  className={`aspect-square rounded ${bgColor} flex items-center justify-center text-xs font-medium relative group`}
                  title={`${day.date}: ${intensity.toFixed(1)} avg intensity (${day.count} tracked)`}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {day.date}: {intensity.toFixed(1)} ({day.count})
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
              <span>Low (1-3)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-900 rounded" />
              <span>Med (4-6)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 dark:bg-red-900 rounded" />
              <span>High (7-10)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
