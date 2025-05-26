import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, BarChart3, Target, Heart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import useActiveUser from "@/hooks/use-active-user";

export default function Analytics() {
  const { user } = useAuth();
  const { activeUserId, isViewingClientData } = useActiveUser();
  const [timeRange, setTimeRange] = useState("30");

  // Fetch emotion analytics data
  const { data: emotionAnalytics, isLoading: emotionsLoading } = useQuery({
    queryKey: ['/api/analytics/emotions', activeUserId, timeRange],
    enabled: !!activeUserId,
  });

  // Fetch mood trends
  const { data: moodTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/analytics/mood-trends', activeUserId, timeRange],
    enabled: !!activeUserId,
  });

  // Fetch progress metrics
  const { data: progressMetrics, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/analytics/progress', activeUserId, timeRange],
    enabled: !!activeUserId,
  });

  const emotionColors = {
    Joy: '#FFD700',
    Sadness: '#4682B4', 
    Fear: '#228B22',
    Anger: '#FF4500',
    Surprise: '#9932CC',
    Love: '#FF69B4',
  };

  const isLoading = emotionsLoading || trendsLoading || progressLoading;

  if (isLoading) {
    return (
      <AppLayout title="Analytics">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">Loading analytics...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Analytics">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isViewingClientData ? "Client Analytics" : "Your Progress"}
            </h1>
            <p className="text-gray-600 mt-2">
              Track emotional patterns and therapeutic progress
            </p>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Key Metrics Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emotions</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emotionAnalytics?.totalEmotions || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{emotionAnalytics?.changeFromPrevious || 0}% from previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Intensity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emotionAnalytics?.avgIntensity || 0}</div>
              <p className="text-xs text-muted-foreground">
                Out of 10 scale
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progressMetrics?.journalEntries || 0}</div>
              <p className="text-xs text-muted-foreground">
                Reflection activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thought Records</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progressMetrics?.thoughtRecords || 0}</div>
              <p className="text-xs text-muted-foreground">
                CBT exercises completed
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Mood Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Mood Trends Over Time</CardTitle>
              <CardDescription>
                Track emotional intensity patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moodTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="avgIntensity" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Average Intensity"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Emotion Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Emotion Distribution</CardTitle>
              <CardDescription>
                Breakdown of core emotions experienced
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={emotionAnalytics?.emotionDistribution || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(emotionAnalytics?.emotionDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={emotionColors[entry.emotion as keyof typeof emotionColors] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity Overview</CardTitle>
            <CardDescription>
              Track therapeutic activities and engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressMetrics?.dailyActivity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="emotions" fill="#3B82F6" name="Emotions Tracked" />
                <Bar dataKey="journals" fill="#10B981" name="Journal Entries" />
                <Bar dataKey="thoughts" fill="#F59E0B" name="Thought Records" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Insights Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emotionAnalytics?.insights?.map((insight: string, index: number) => (
                  <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">{insight}</p>
                  </div>
                ))}
                
                {!emotionAnalytics?.insights?.length && (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Continue tracking emotions to generate personalized insights</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}