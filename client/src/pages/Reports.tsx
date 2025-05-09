import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { RecommendationList } from "@/components/recommendations/RecommendationList";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import {
  Download,
  FileText,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Lightbulb,
  Heart,
  AlertCircle,
} from "lucide-react";

// Define time range options
type TimeRange = "week" | "month" | "year" | "all";

export default function Reports() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  
  // Fetch emotion records
  const { data: emotions, isLoading: emotionsLoading } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/emotions`] : [],
    enabled: !!user,
  });
  
  // Fetch thought records
  const { data: thoughts, isLoading: thoughtsLoading } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/thoughts`] : [],
    enabled: !!user,
  });
  
  // Fetch goals
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/goals`] : [],
    enabled: !!user,
  });
  
  // Process emotions data for emotion distribution chart
  const getEmotionDistribution = () => {
    if (!emotions || emotions.length === 0) return [];
    
    // Filter emotions based on selected time range
    const filteredEmotions = filterDataByTimeRange(emotions, timeRange);
    
    // Count emotions by core type
    const emotionCounts: Record<string, number> = {};
    filteredEmotions.forEach(emotion => {
      const coreEmotion = emotion.coreEmotion;
      emotionCounts[coreEmotion] = (emotionCounts[coreEmotion] || 0) + 1;
    });
    
    // Convert to chart data format
    return Object.entries(emotionCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };
  
  // Process emotions data for intensity trend chart
  const getIntensityTrend = () => {
    if (!emotions || emotions.length === 0) return [];
    
    // Filter emotions based on selected time range
    const filteredEmotions = filterDataByTimeRange(emotions, timeRange);
    
    // Group emotions by date and calculate average intensity
    const emotionsByDate: Record<string, { total: number, count: number }> = {};
    
    filteredEmotions.forEach(emotion => {
      const date = format(new Date(emotion.timestamp), "yyyy-MM-dd");
      if (!emotionsByDate[date]) {
        emotionsByDate[date] = { total: 0, count: 0 };
      }
      emotionsByDate[date].total += emotion.intensity;
      emotionsByDate[date].count += 1;
    });
    
    // Sort by date and convert to chart data format
    return Object.entries(emotionsByDate)
      .map(([date, data]) => ({
        date: format(new Date(date), "MMM d"),
        intensity: parseFloat((data.total / data.count).toFixed(1)),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  // Process cognitive distortions data
  const getCognitiveDistortions = () => {
    if (!thoughts || thoughts.length === 0) return [];
    
    // Filter thoughts based on selected time range
    const filteredThoughts = filterDataByTimeRange(thoughts, timeRange);
    
    // Count cognitive distortions
    const distortionCounts: Record<string, number> = {};
    
    filteredThoughts.forEach(thought => {
      if (thought.cognitiveDistortions && thought.cognitiveDistortions.length > 0) {
        thought.cognitiveDistortions.forEach((distortion: string) => {
          const formattedDistortion = formatDistortionName(distortion);
          distortionCounts[formattedDistortion] = (distortionCounts[formattedDistortion] || 0) + 1;
        });
      }
    });
    
    // Convert to chart data format and sort by frequency
    return Object.entries(distortionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Get top 5
  };
  
  // Process goal status data
  const getGoalStatus = () => {
    if (!goals || goals.length === 0) return [];
    
    // Count goals by status
    const statusCounts: Record<string, number> = {
      "Pending": 0,
      "In Progress": 0,
      "Completed": 0,
      "Approved": 0,
    };
    
    goals.forEach(goal => {
      switch (goal.status) {
        case "pending":
          statusCounts["Pending"]++;
          break;
        case "in_progress":
          statusCounts["In Progress"]++;
          break;
        case "completed":
          statusCounts["Completed"]++;
          break;
        case "approved":
          statusCounts["Approved"]++;
          break;
      }
    });
    
    // Convert to chart data format
    return Object.entries(statusCounts)
      .filter(([_, value]) => value > 0) // Remove zero counts
      .map(([name, value]) => ({ name, value }));
  };
  
  // Helper function to filter data by time range
  const filterDataByTimeRange = (data: any[], range: TimeRange) => {
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case "week":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = subDays(now, 30);
        break;
      case "year":
        startDate = subMonths(now, 12);
        break;
      case "all":
      default:
        return data; // No filtering for "all"
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.timestamp || item.createdAt);
      return itemDate >= startDate && itemDate <= now;
    });
  };
  
  // Helper to format cognitive distortion names
  const formatDistortionName = (distortion: string) => {
    return distortion
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Colors for charts
  const COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8F44AD'];
  
  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-md shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">Count: <span className="font-medium">{payload[0].value}</span></p>
          <p className="text-sm">
            Percentage: <span className="font-medium">
              {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Calculate total counts
  const emotionCount = emotions?.length || 0;
  const thoughtCount = thoughts?.length || 0;
  const goalCount = goals?.length || 0;
  
  // Calculate completion percentage for goals
  const completedGoals = goals?.filter(goal => 
    goal.status === "completed" || goal.status === "approved"
  ).length || 0;
  const goalCompletionRate = goalCount > 0 
    ? parseFloat(((completedGoals / goalCount) * 100).toFixed(1)) 
    : 0;
  
  // Prepare data for charts
  const emotionDistributionData = getEmotionDistribution();
  const intensityTrendData = getIntensityTrend();
  const cognitiveDistortionsData = getCognitiveDistortions();
  const goalStatusData = getGoalStatus();
  
  // Adjust data with total count for percentage calculation in tooltip
  const emotionDistributionWithTotal = emotionDistributionData.map(item => ({
    ...item,
    total: emotionDistributionData.reduce((sum, item) => sum + item.value, 0),
  }));
  
  const isLoading = emotionsLoading || thoughtsLoading || goalsLoading;
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  return (
    <AppLayout title="Reports">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Progress Reports</h1>
            <p className="text-neutral-500">
              Analytics and insights to track your journey
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Select 
              value={timeRange} 
              onValueChange={(value) => setTimeRange(value as TimeRange)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline"
              disabled={isExporting}
              onClick={() => {
                setIsExporting(true);
                try {
                  // Show a toast notification that export is starting
                  toast({
                    title: "Starting export...",
                    description: "Your PDF report is being generated."
                  });
                  
                  // Create URL for the PDF export
                  const url = `/api/export/pdf?type=all`;
                  
                  // Create a hidden anchor element to trigger the download
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', ''); // The filename will be provided by the server
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  // Show success toast after a short delay to simulate completion
                  setTimeout(() => {
                    toast({
                      title: "Export complete",
                      description: "Your PDF report has been downloaded.",
                      variant: "default"
                    });
                    setIsExporting(false);
                  }, 2000);
                } catch (error) {
                  console.error('Export error:', error);
                  toast({
                    title: "Export failed",
                    description: "There was a problem generating your PDF report. Please try again later.",
                    variant: "destructive"
                  });
                  setIsExporting(false);
                }
              }}
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-neutral-500 text-sm">Total Emotions Recorded</p>
                  <h3 className="text-3xl font-bold text-neutral-800 mt-1">{emotionCount}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-neutral-500 text-sm">Thought Records Completed</p>
                  <h3 className="text-3xl font-bold text-neutral-800 mt-1">{thoughtCount}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-neutral-500 text-sm">Goal Completion Rate</p>
                  <h3 className="text-3xl font-bold text-neutral-800 mt-1">{goalCompletionRate}%</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Charts */}
        <Tabs defaultValue="emotions">
          <TabsList className="mb-6">
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="thoughts">Thoughts</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          {/* Emotions Tab */}
          <TabsContent value="emotions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Emotion Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
                    Emotion Distribution
                  </CardTitle>
                  <CardDescription>
                    Breakdown of your core emotions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : emotionDistributionData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-neutral-500">No emotion data available</p>
                    </div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={emotionDistributionWithTotal}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            labelLine={false}
                          >
                            {emotionDistributionWithTotal.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Emotion Intensity Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2 text-primary" />
                    Emotion Intensity Trend
                  </CardTitle>
                  <CardDescription>
                    Average intensity over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : intensityTrendData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-neutral-500">No intensity data available</p>
                    </div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={intensityTrendData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="intensity"
                            stroke="#4285F4"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Thoughts Tab */}
          <TabsContent value="thoughts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-primary" />
                  Top Cognitive Distortions
                </CardTitle>
                <CardDescription>
                  Most frequent thought patterns identified
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : cognitiveDistortionsData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-neutral-500">No cognitive distortion data available</p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={cognitiveDistortionsData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8F44AD" name="Frequency">
                          {cognitiveDistortionsData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
                  Goal Status Distribution
                </CardTitle>
                <CardDescription>
                  Current status of your SMART goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : goalStatusData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-neutral-500">No goal data available</p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={goalStatusData.map(item => ({
                            ...item,
                            total: goalStatusData.reduce((sum, item) => sum + item.value, 0),
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {goalStatusData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>
                  AI-powered suggestions based on your therapy journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-3">
                  <p className="text-sm text-neutral-700">
                    Below are personalized recommendations based on your therapy activities. 
                    Each recommendation has been reviewed by your therapist to ensure it's appropriate for your specific needs.
                  </p>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>
                        <strong>Important note:</strong> These recommendations are AI-generated to provide helpful insights, 
                        but always prioritize guidance from your professional therapist. The primary focus should be on 
                        following your personalized treatment plan.
                      </span>
                    </p>
                  </div>
                </div>
                <RecommendationList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// Note: Removed duplicate Heart icon component as it's already defined elsewhere in the file
