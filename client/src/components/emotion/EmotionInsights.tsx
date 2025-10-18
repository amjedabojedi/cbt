import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, PieChart as PieChartIcon, Calendar as CalendarIcon, Clock } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, parseISO, startOfDay } from "date-fns";

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

// Define positive and negative emotions
const POSITIVE_EMOTIONS = ["Joy", "Love", "Surprise"];
const NEGATIVE_EMOTIONS = ["Sadness", "Fear", "Anger", "Disgust"];

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

  // Calculate mood trends over time with positive/negative separation - grouped by week
  const getMoodTrends = () => {
    let weeksToShow = 4;
    
    if (timeRange === "week") {
      weeksToShow = 1;
    } else if (timeRange === "month") {
      weeksToShow = 4;
    } else {
      if (emotions.length === 0) return [];
      const oldestDate = new Date(Math.min(...emotions.map(e => new Date(e.createdAt).getTime())));
      const now = new Date();
      const daysDiff = Math.ceil((now.getTime() - oldestDate.getTime()) / (24 * 60 * 60 * 1000));
      weeksToShow = Math.ceil(daysDiff / 7);
    }

    // Get the Monday of the current week as the end point
    const today = new Date();
    const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
    
    // Generate weeks
    const weeks = [];
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekMonday = subDays(currentWeekMonday, i * 7);
      weeks.push(weekMonday);
    }
    
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Get all emotions in this week
      const weekEmotions = emotions.filter(e => {
        const emotionDate = new Date(e.createdAt);
        return emotionDate >= weekStart && emotionDate <= weekEnd;
      });
      
      // Separate positive and negative emotions
      const positiveEmotions = weekEmotions.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion));
      const negativeEmotions = weekEmotions.filter(e => NEGATIVE_EMOTIONS.includes(e.coreEmotion));
      
      const avgPositiveIntensity = positiveEmotions.length > 0
        ? positiveEmotions.reduce((sum, e) => sum + e.intensity, 0) / positiveEmotions.length
        : 0;
      
      const avgNegativeIntensity = negativeEmotions.length > 0
        ? negativeEmotions.reduce((sum, e) => sum + e.intensity, 0) / negativeEmotions.length
        : 0;
      
      // Format week range
      const startMonth = format(weekStart, 'MMM');
      const endMonth = format(weekEnd, 'MMM');
      const weekRange = startMonth === endMonth 
        ? `${startMonth} ${format(weekStart, 'd')}-${format(weekEnd, 'd')}`
        : `${startMonth} ${format(weekStart, 'd')}-${endMonth} ${format(weekEnd, 'd')}`;
      
      return {
        date: weekRange,
        positiveIntensity: parseFloat(avgPositiveIntensity.toFixed(1)),
        negativeIntensity: parseFloat(avgNegativeIntensity.toFixed(1)),
        count: weekEmotions.length,
      };
    });
  };

  // Calculate intensity heatmap data with positive/negative separation - organized by weeks starting Monday
  const getIntensityHeatmap = () => {
    const today = startOfDay(new Date());
    // Get the Monday of 4 weeks ago
    const startDate = startOfWeek(subDays(today, 28), { weekStartsOn: 1 }); // 1 = Monday
    // Get the Sunday of current week
    const endDate = endOfWeek(today, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEmotions = emotions.filter(e => 
        format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      // Separate positive and negative emotions
      const positiveEmotions = dayEmotions.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion));
      const negativeEmotions = dayEmotions.filter(e => NEGATIVE_EMOTIONS.includes(e.coreEmotion));
      
      const avgPositiveIntensity = positiveEmotions.length > 0
        ? positiveEmotions.reduce((sum, e) => sum + e.intensity, 0) / positiveEmotions.length
        : 0;
      
      const avgNegativeIntensity = negativeEmotions.length > 0
        ? negativeEmotions.reduce((sum, e) => sum + e.intensity, 0) / negativeEmotions.length
        : 0;
      
      // Calculate overall intensity as difference (positive - negative)
      const netIntensity = avgPositiveIntensity - avgNegativeIntensity;
      
      const isFuture = day > today;
      
      return {
        fullDate: format(day, "MMM d"), // e.g., "Oct 14"
        dayName: format(day, "EEE"), // e.g., "Mon"
        positiveIntensity: avgPositiveIntensity,
        negativeIntensity: avgNegativeIntensity,
        netIntensity, // Can be positive or negative
        count: dayEmotions.length,
        isFuture, // Flag for future dates
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
          <CardDescription>Weekly positive vs negative emotional intensity trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={getMoodTrends()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis domain={[0, 10]} label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow-lg">
                        <p className="font-semibold">{data.date}</p>
                        <p className="text-green-600">Positive: {data.positiveIntensity}</p>
                        <p className="text-red-600">Negative: {data.negativeIntensity}</p>
                        <p className="text-gray-600">Tracked: {data.count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="positiveIntensity" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Positive Emotions"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="negativeIntensity" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Negative Emotions"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Emotion Distribution - Full Width */}
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

      {/* Time of Day Patterns - Full Width */}
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

      {/* Intensity Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <CardTitle>Weekly Intensity Calendar</CardTitle>
          </div>
          <CardDescription>Positive (green) vs negative (red) emotional intensity - organized by week starting Monday</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {getIntensityHeatmap().map((day, i) => {
              const { positiveIntensity, negativeIntensity, netIntensity, count, fullDate, isFuture } = day;
              
              // Determine color based on net intensity (positive - negative)
              let bgColor = "bg-gray-100 dark:bg-gray-800";
              
              if (isFuture) {
                bgColor = "bg-gray-50 dark:bg-gray-900 opacity-40";
              } else if (count > 0) {
                if (netIntensity > 0) {
                  // More positive emotions
                  if (netIntensity <= 3) bgColor = "bg-green-200 dark:bg-green-900";
                  else if (netIntensity <= 6) bgColor = "bg-green-400 dark:bg-green-700";
                  else bgColor = "bg-green-600 dark:bg-green-500 text-white";
                } else if (netIntensity < 0) {
                  // More negative emotions
                  const absNet = Math.abs(netIntensity);
                  if (absNet <= 3) bgColor = "bg-red-200 dark:bg-red-900";
                  else if (absNet <= 6) bgColor = "bg-red-400 dark:bg-red-700";
                  else bgColor = "bg-red-600 dark:bg-red-500 text-white";
                } else {
                  // Equal positive and negative
                  bgColor = "bg-yellow-200 dark:bg-yellow-900";
                }
              }
              
              return (
                <div
                  key={i}
                  className={`aspect-square rounded ${bgColor} flex flex-col items-center justify-center text-[10px] font-medium relative group p-1`}
                  title={isFuture ? `${fullDate} (Future)` : `${fullDate}: Pos ${positiveIntensity.toFixed(1)} / Neg ${negativeIntensity.toFixed(1)} (${count} tracked)`}
                >
                  <div className="text-[9px] opacity-70">{fullDate}</div>
                  {!isFuture && count > 0 && (
                    <div className="text-[8px] mt-0.5">{count}</div>
                  )}
                  {!isFuture && (
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-20 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {fullDate}<br />
                      Positive: {positiveIntensity.toFixed(1)}<br />
                      Negative: {negativeIntensity.toFixed(1)}<br />
                      ({count} tracked)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
              <span>None</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded" />
              <span>Low Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-600 text-white rounded" />
              <span>High Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-900 rounded" />
              <span>Balanced</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 dark:bg-red-900 rounded" />
              <span>Low Negative</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600 text-white rounded" />
              <span>High Negative</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
