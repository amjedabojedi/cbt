import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, subMonths, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { EmotionRecord } from "@shared/schema";
import useActiveUser from "@/hooks/use-active-user";

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

// Define core emotions directly from the emotion wheel
interface CoreEmotion {
  color: string;
  name: string;
  valence: 'positive' | 'negative' | 'neutral';
}

const CORE_EMOTIONS: Record<string, CoreEmotion> = {
  joy: {
    color: "#F9D71C", // Yellow
    name: "Joy",
    valence: 'positive'
  },
  sadness: {
    color: "#6D87C4", // Blue
    name: "Sadness",
    valence: 'negative'
  },
  fear: {
    color: "#8A65AA", // Purple
    name: "Fear",
    valence: 'negative'
  },
  anger: {
    color: "#E43D40", // Red
    name: "Anger",
    valence: 'negative'
  },
  disgust: {
    color: "#7DB954", // Green
    name: "Disgust",
    valence: 'negative'
  },
  surprise: {
    color: "#FF9500", // Orange
    name: "Surprise",
    valence: 'neutral'
  },
  trust: {
    color: "#4285F4", // Blue
    name: "Trust",
    valence: 'positive'
  },
  anticipation: {
    color: "#34A853", // Green
    name: "Anticipation",
    valence: 'positive'
  }
};

type TimeRange = "week" | "month" | "year";

interface DailyEmotionData {
  date: Date;
  formattedDate: string;
  count: number;
  emotionIntensities: Record<string, number[]>;
  [key: string]: any; // For emotion group counts
}

interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

export default function MoodTrends() {
  const { activeUserId, isViewingClientData } = useActiveUser();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  
  // Fetch emotion records for the active user (could be client viewed by therapist)
  const { data: emotions, isLoading, error } = useQuery<EmotionRecord[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!activeUserId,
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
    
    // Initialize data with all dates in range and core emotions
    const dataByDate: DailyEmotionData[] = dateRange.map(date => {
      const dataPoint: DailyEmotionData = {
        date,
        formattedDate: format(date, dateFormat),
        count: 0,
        emotionIntensities: {},
      };
      
      // Add a property for each core emotion with initial value 0
      Object.keys(CORE_EMOTIONS).forEach((emotionKey: string) => {
        dataPoint[CORE_EMOTIONS[emotionKey].name] = 0;
      });
      
      return dataPoint;
    });
    
    // Aggregate emotions by date and core emotion
    emotions.forEach((emotion: EmotionRecord) => {
      const emotionDate = startOfDay(new Date(emotion.timestamp));
      
      // Find matching day in our date range
      const dayIndex = dataByDate.findIndex(day => 
        startOfDay(day.date).getTime() === emotionDate.getTime()
      );
      
      if (dayIndex !== -1) {
        // Increment the count for the core emotion and track intensity
        const coreEmotion = emotion.coreEmotion;
        
        // If this emotion matches one of our core emotions
        if (coreEmotion) {
          // Increment count
          if (dataByDate[dayIndex][coreEmotion] !== undefined) {
            dataByDate[dayIndex][coreEmotion] += 1;
            dataByDate[dayIndex].count += 1;
            
            // Track emotion intensity
            if (!dataByDate[dayIndex].emotionIntensities[coreEmotion]) {
              dataByDate[dayIndex].emotionIntensities[coreEmotion] = [];
            }
            
            dataByDate[dayIndex].emotionIntensities[coreEmotion].push(emotion.intensity);
          }
        }
      }
    });
    
    // Format data for chart, calculating average intensity by core emotion
    return dataByDate.map(day => {
      const result: ChartDataPoint = {
        date: day.formattedDate,
      };
      
      // Always include all core emotions, even if they have no data
      Object.keys(CORE_EMOTIONS).forEach((emotionKey: string) => {
        const emotion = CORE_EMOTIONS[emotionKey];
        const emotionName = emotion.name;
        const intensities = day.emotionIntensities[emotionName] || [];
        
        if (day[emotionName] > 0) {
          // Calculate average intensity for days that have data
          const sum = intensities.reduce((acc: number, val: number) => acc + val, 0);
          const avg = intensities.length > 0 ? sum / intensities.length : 0;
          result[emotionName] = parseFloat(avg.toFixed(1));
        } else {
          // Include all emotion types with 0 value when no data exists
          result[emotionName] = 0;
        }
      });
      
      return result;
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
          <CardTitle>Mood Trends</CardTitle>
          <CardDescription>
            Track different emotion types separately over time
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
          <CardTitle>Mood Trends</CardTitle>
          <CardDescription>
            Track different emotion types separately over time
          </CardDescription>
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
            Track different emotion types separately over time
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
                
                {/* Render line for each core emotion */}
                {Object.keys(CORE_EMOTIONS).map(emotionKey => {
                  const emotion = CORE_EMOTIONS[emotionKey];
                  return (
                    <Line
                      key={emotionKey}
                      type="monotone"
                      dataKey={emotion.name}
                      name={emotion.name}
                      stroke={emotion.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  );
                })}
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
