import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, BarChart3, Target, Heart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/lib/auth";
import useActiveUser from "@/hooks/use-active-user";

export default function Analytics() {
  const { user } = useAuth();
  const { activeUser } = useActiveUser();
  const [timeRange, setTimeRange] = useState("week");

  // Determine which user data to fetch
  const targetUserId = activeUser?.id || user?.id;
  const isViewingClientData = activeUser && activeUser.id !== user?.id;

  // Fetch analytics data
  const { data: emotionAnalytics, isLoading: emotionsLoading } = useQuery({
    queryKey: ["/api/analytics/emotions", { timeRange, userId: targetUserId }],
    enabled: !!targetUserId,
  });

  const { data: moodTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ["/api/analytics/mood-trends", { timeRange, userId: targetUserId }],
    enabled: !!targetUserId,
  });

  const { data: progressMetrics, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/analytics/progress", { timeRange, userId: targetUserId }],
    enabled: !!targetUserId,
  });

  const isLoading = emotionsLoading || trendsLoading || progressLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">Loading analytics...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics - Simple Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emotions</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emotionAnalytics?.totalEmotions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Recorded this {timeRange}
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

        {/* Main Chart - Simple and Clean */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Emotional Patterns Over Time</CardTitle>
              <CardDescription>
                Track your mood trends and intensity patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {moodTrends && moodTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moodTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="avgIntensity" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        name="Average Intensity"
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">No mood data available for this period</p>
                      <Button variant="outline" asChild>
                        <a href="/emotions">Record Your First Emotion</a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights and Tips */}
        {emotionAnalytics?.totalEmotions > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Insights & Recommendations</CardTitle>
                <CardDescription>
                  Based on your recent emotional patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emotionAnalytics?.avgIntensity && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Intensity Level</h4>
                      <p className="text-blue-800 text-sm">
                        Your average emotion intensity is {emotionAnalytics.avgIntensity}/10. 
                        {emotionAnalytics.avgIntensity > 7 
                          ? " Consider practicing relaxation techniques."
                          : emotionAnalytics.avgIntensity > 4
                          ? " You're maintaining good emotional balance."
                          : " Great job managing emotional intensity."
                        }
                      </p>
                    </div>
                  )}
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Activity Level</h4>
                    <p className="text-green-800 text-sm">
                      {progressMetrics?.journalEntries > 0 || progressMetrics?.thoughtRecords > 0
                        ? "Excellent! You're actively engaging with therapeutic tools."
                        : "Try adding journal entries or thought records to boost your progress."
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}