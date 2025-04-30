import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, subMonths, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { EmotionRecord } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from "recharts";

type TimeRange = "week" | "month" | "year";

export default function MoodTrends() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  
  // Fetch emotion records
  const { data: emotions, isLoading, error } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/emotions`] : [],
    enabled: !!user,
  });
  
  // Process data for chart based on selected time range
  const getChartData = () => {
    if (!emotions || emotions.length === 0) return [];
    
    let startDate: Date;
    let dateFormat: string;
    
    switch (timeRange) {
      case "week":
        startDate = subDays(new Date(), 7);
        dateFormat = "EEE";
        break;
      case "month":
        startDate = subDays(new Date(), 30);
        dateFormat = "MMM d";
        break;
      case "year":
        startDate = subMonths(new Date(), 12);
        dateFormat = "MMM";
        break;
      default:
        startDate = subDays(new Date(), 7);
        dateFormat = "EEE";
    }
    
    // Generate date range
    const dateRange = eachDayOfInterval({
      start: startDate,
      end: new Date()
    });
    
    // Initialize data with all dates in range
    const dataByDate = dateRange.map(date => ({
      date,
      formattedDate: format(date, dateFormat),
      emotionIntensity: 0,
      count: 0,
      emotions: {} as Record<string, number>
    }));
    
    // Aggregate emotions by date
    emotions.forEach(emotion => {
      const emotionDate = startOfDay(new Date(emotion.timestamp));
      
      // Find matching day in our date range
      const dayIndex = dataByDate.findIndex(day => 
        startOfDay(day.date).getTime() === emotionDate.getTime()
      );
      
      if (dayIndex !== -1) {
        // Add emotion intensity to the day
        dataByDate[dayIndex].emotionIntensity += emotion.intensity;
        dataByDate[dayIndex].count += 1;
        
        // Track count by emotion type
        const emotionType = emotion.coreEmotion;
        if (!dataByDate[dayIndex].emotions[emotionType]) {
          dataByDate[dayIndex].emotions[emotionType] = 1;
        } else {
          dataByDate[dayIndex].emotions[emotionType] += 1;
        }
      }
    });
    
    // Calculate average intensity and format data for chart
    return dataByDate.map(day => {
      const avgIntensity = day.count > 0 ? day.emotionIntensity / day.count : 0;
      
      // Count emotions by core type
      const joyCount = day.emotions.Joy || 0;
      const angerCount = day.emotions.Anger || 0;
      const sadnessCount = day.emotions.Sadness || 0;
      const fearCount = day.emotions.Fear || 0;
      
      return {
        date: day.formattedDate,
        "Average Intensity": parseFloat(avgIntensity.toFixed(1)),
        Joy: joyCount,
        Anger: angerCount,
        Sadness: sadnessCount,
        Fear: fearCount,
        count: day.count
      };
    });
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-md shadow-sm">
          <p className="font-medium text-sm">{label}</p>
          <div className="mt-1 space-y-1">
            {payload.map((entry, index) => (
              <p key={index} className="text-xs flex items-center">
                <span className="h-2 w-2 rounded-full mr-1" style={{ backgroundColor: entry.color }}></span>
                <span>{entry.name}: </span>
                <span className="ml-1 font-medium">{entry.value}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as TimeRange);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Mood Trends</CardTitle>
          <CardDescription>
            Track your emotional patterns over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Mood Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-neutral-500">Error loading mood trends. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const chartData = getChartData();
  const hasData = emotions && emotions.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Mood Trends</CardTitle>
          <CardDescription>
            Track your emotional patterns over time
          </CardDescription>
        </div>
        <Tabs defaultValue="week" value={timeRange} onValueChange={handleTimeRangeChange}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend align="right" verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
                <Line
                  type="monotone"
                  dataKey="Average Intensity"
                  stroke="#4285F4"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line type="monotone" dataKey="Joy" stroke="#FBBC05" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="Anger" stroke="#EA4335" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="Sadness" stroke="#4285F4" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="Fear" stroke="#34A853" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-neutral-400 mb-2">No mood data available</p>
                <Button size="sm" variant="outline" asChild>
                  <a href="/emotions">Record an emotion</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
