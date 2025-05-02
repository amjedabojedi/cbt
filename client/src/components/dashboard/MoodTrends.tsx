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
  BarChart,
  Bar,
  Cell,
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

// Define core emotions directly from the emotion wheel 
// AND include all emotions that might be in our data
// Define the main core emotions to show on the chart (keep it simple)
const CORE_EMOTIONS: Record<string, CoreEmotion> = {
  // Primary emotions from the wheel - keep these at the top
  joy: {
    color: "#FFC107", // Bright yellow
    name: "Joy",
    valence: 'positive'
  },
  sadness: {
    color: "#3F51B5", // Indigo
    name: "Sadness",
    valence: 'negative'
  },
  fear: {
    color: "#8A65AA", // Purple
    name: "Fear",
    valence: 'negative'
  },
  anger: {
    color: "#F44336", // Bright red
    name: "Anger",
    valence: 'negative'
  },
  disgust: {
    color: "#4CAF50", // Bright green
    name: "Disgust",
    valence: 'negative'
  },
  
  // Add the actual emotions that appear in our data
  love: {
    color: "#E91E63", // Bright pink
    name: "Love",
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
    
    // Log all emotions to see what data we have
    console.log("Emotions data:", emotions);
    
    // Add a log to check what core emotions are defined
    const coreEmotionNames = Object.keys(CORE_EMOTIONS).map(key => CORE_EMOTIONS[key].name);
    console.log("Available core emotions:", coreEmotionNames);
    
    let startDate: Date;
    let dateFormat: string;
    
    switch (timeRange) {
      case "week":
        // Start 7 days ago, but ensure we include today
        startDate = subDays(new Date(), 7);
        dateFormat = "EEE"; // Just weekday (Mon, Tue, etc)
        break;
      case "month":
        // Start 30 days ago, but ensure we include today
        startDate = subDays(new Date(), 30);
        dateFormat = "MMM d"; // Month + date (Apr 1, etc)
        break;
      case "year":
        // Start 12 months ago, but ensure we include today
        startDate = subMonths(new Date(), 12);
        dateFormat = "MMM"; // Just month name (Jan, Feb, etc)
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
    
    // For month/year views, limit number of data points to avoid overcrowding
    const maxBars = timeRange === "year" ? 12 : (timeRange === "month" ? 30 : 7);
    
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
    
    // Log the generated date range
    console.log("Date range:", dateRange.map(d => format(d, 'yyyy-MM-dd')));
    
    // Aggregate emotions by date and core emotion
    emotions.forEach((emotion: EmotionRecord) => {
      const emotionDate = startOfDay(new Date(emotion.timestamp));
      console.log("Processing emotion:", emotion.coreEmotion, "recorded at", emotion.timestamp, "date:", format(emotionDate, 'yyyy-MM-dd'));
      
      // Find matching day in our date range
      const dayIndex = dataByDate.findIndex(day => 
        startOfDay(day.date).getTime() === emotionDate.getTime()
      );
      
      console.log("Found matching day?", dayIndex !== -1 ? "Yes" : "No");
      
      if (dayIndex !== -1) {
        // Increment the count for the core emotion and track intensity
        const coreEmotion = emotion.coreEmotion;
        
        console.log("Core emotion:", coreEmotion, "Does property exist?", dataByDate[dayIndex][coreEmotion] !== undefined);
        
        // If this emotion matches one of our core emotions
        if (coreEmotion) {
          // Check if this emotion name already exists as a property
          if (dataByDate[dayIndex][coreEmotion] !== undefined) {
            dataByDate[dayIndex][coreEmotion] += 1;
            dataByDate[dayIndex].count += 1;
            
            // Track emotion intensity
            if (!dataByDate[dayIndex].emotionIntensities[coreEmotion]) {
              dataByDate[dayIndex].emotionIntensities[coreEmotion] = [];
            }
            
            dataByDate[dayIndex].emotionIntensities[coreEmotion].push(emotion.intensity);
            console.log("Updated emotion data for", coreEmotion, "intensity:", emotion.intensity);
          } else {
            // The emotion name doesn't match exactly with our core emotions list
            console.log("Core emotion", coreEmotion, "doesn't match any of our defined core emotions");
            
            // Try to map to one of our core emotions
            const matchedEmotion = Object.keys(CORE_EMOTIONS).find(key => 
              CORE_EMOTIONS[key].name.toLowerCase() === coreEmotion.toLowerCase()
            );
            
            if (matchedEmotion) {
              const emotionName = CORE_EMOTIONS[matchedEmotion].name;
              console.log("Matched to standard core emotion:", emotionName);
              
              // Use the matched emotion name
              dataByDate[dayIndex][emotionName] += 1;
              dataByDate[dayIndex].count += 1;
              
              if (!dataByDate[dayIndex].emotionIntensities[emotionName]) {
                dataByDate[dayIndex].emotionIntensities[emotionName] = [];
              }
              
              dataByDate[dayIndex].emotionIntensities[emotionName].push(emotion.intensity);
            }
          }
        }
      }
    });
    
    // For month/year views, group data by month or year
    if (timeRange === "month" || timeRange === "year") {
      // Create monthly or yearly buckets for aggregation
      const groupKey = timeRange === "month" 
        ? (date: Date) => format(date, 'MMM') // Just month name (Apr, May, etc)
        : (date: Date) => format(date, 'yyyy'); // Just year (2025, 2026, etc)
      
      // Group data points by month or year
      const groupedData: Record<string, DailyEmotionData[]> = {};
      
      dataByDate.forEach(day => {
        const key = groupKey(day.date);
        if (!groupedData[key]) {
          groupedData[key] = [];
        }
        groupedData[key].push(day);
      });
      
      // Aggregate data for each group
      return Object.keys(groupedData).map(periodKey => {
        const daysInPeriod = groupedData[periodKey];
        const result: ChartDataPoint = {
          date: periodKey,
        };
        
        // Aggregate emotions for this period
        Object.keys(CORE_EMOTIONS).forEach((emotionKey: string) => {
          const emotion = CORE_EMOTIONS[emotionKey];
          const emotionName = emotion.name;
          
          // Collect all intensities for this emotion in this period
          const allIntensities: number[] = [];
          daysInPeriod.forEach(day => {
            const dayIntensities = day.emotionIntensities[emotionName] || [];
            allIntensities.push(...dayIntensities);
          });
          
          if (allIntensities.length > 0) {
            // Calculate average intensity for the period
            const sum = allIntensities.reduce((acc, val) => acc + val, 0);
            const avg = sum / allIntensities.length;
            result[emotionName] = parseFloat(avg.toFixed(1));
          } else {
            // No data for this emotion in this period
            result[emotionName] = 0;
          }
        });
        
        return result;
      });
    } else {
      // For weekly view, keep daily data points
      return dataByDate.map(day => {
        const result: ChartDataPoint = {
          date: day.formattedDate,
        };
        
        // Process all core emotions
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
    }
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
  console.log("Final chart data:", chartData);
  
  // We have valid data if there are emotions records 
  // AND they contain at least one data point with a value > 0
  const hasNonZeroData = chartData.some(day => {
    // Check if any emotion has a value > 0
    return Object.keys(day).some(key => {
      if (key === 'date') return false;
      const value = day[key];
      return typeof value === 'number' && value > 0;
    });
  });
  
  console.log("Has non-zero data:", hasNonZeroData);
  const hasData = emotions && emotions.length > 0 && hasNonZeroData;

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
        <div className="h-80 relative">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barGap={2}
                barSize={timeRange === "week" ? 20 : (timeRange === "month" ? 12 : 8)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  interval={timeRange === "week" ? 0 : (timeRange === "month" ? 2 : 1)}
                  angle={timeRange === "month" ? -45 : 0}
                  textAnchor={timeRange === "month" ? "end" : "middle"}
                  height={timeRange === "month" ? 60 : 30}
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  align="center" 
                  verticalAlign="top" 
                  wrapperStyle={{ 
                    paddingBottom: 15,
                    paddingTop: 5,
                    fontWeight: 'bold'
                  }}
                  iconSize={10}
                  iconType="square"
                />
                
                {/* Render bar for each core emotion */}
                {Object.keys(CORE_EMOTIONS).map((emotionKey) => {
                  const emotion = CORE_EMOTIONS[emotionKey];
                  return (
                    <Bar
                      key={emotionKey}
                      dataKey={emotion.name}
                      name={emotion.name}
                      fill={emotion.color}
                      radius={[2, 2, 0, 0]}
                      // Add custom cursor for better interaction
                      activeBar={{ stroke: '#fff', strokeWidth: 2 }}
                      // Animate the chart
                      isAnimationActive={true}
                      animationBegin={200}
                      animationDuration={1000}
                      // Set a border to make bars more visible
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  );
                })}
              </BarChart>
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
