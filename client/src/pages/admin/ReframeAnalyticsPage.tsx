import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, Activity, BarChart3, Clock } from "lucide-react";
import { format } from "date-fns";

// Type for an individual practice result
interface PracticeResult {
  id: number;
  userId: number;
  username: string;
  email: string;
  assignmentId?: number;
  thoughtRecordId?: number;
  correctCount: number;
  totalCount: number;
  timeSpent: number;
  completed: boolean;
  createdAt: string;
}

// Type for cognitive distortion statistics
interface DistortionStat {
  distortion: string;
  count: number;
}

// Type for the analytics response data
interface AnalyticsData {
  totalCount: number;
  completedCount: number;
  completionRate: number;
  recentResultsCount: number;
  recentResults: PracticeResult[];
  recentWeekCount: number;
  distortionStats: DistortionStat[];
}

export default function ReframeAnalyticsPage() {
  // Fetch practice results data
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/debug/reframe-coach/results"],
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Failed to load Reframe Coach analytics data. Please try again later.</p>
              <pre className="mt-4 p-4 bg-muted rounded-md text-sm overflow-auto">
                {(error as Error).message}
              </pre>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // Calculate usage statistics
  const totalCount = data?.totalCount || 0;
  const completionRate = totalCount ? Math.round((data?.completedCount || 0) / totalCount * 100) : 0;
  
  // Calculate recent results (last 7 days)
  const recentResultsCount = data?.recentResultsCount || 0;
  
  // Calculate average scores
  const averageScorePercentage = data?.recentResults && data.recentResults.length > 0 
    ? Math.round(data.recentResults.reduce((acc: number, result) => 
        acc + (result.correctCount / result.totalCount) * 100, 0
      ) / data.recentResults.length) 
    : 0;
  
  // Format data for charts
  const dailyActivityData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = format(date, "MM/dd");
    const count = data?.recentResults 
      ? data.recentResults.filter(result => 
          new Date(result.createdAt).toDateString() === date.toDateString()
        ).length 
      : 0;
    
    return { date: dateStr, count };
  }).reverse();

  // Calculate distortion distribution for pie chart
  const distortionData = data?.distortionStats || [];

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Reframe Coach Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Key stats cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Activity className="mr-2 h-4 w-4" />
                Total Practice Sessions
              </CardTitle>
              <CardDescription>All time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalCount}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                Completion Rate
              </CardTitle>
              <CardDescription>Percentage of completed sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{completionRate}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Average Score
              </CardTitle>
              <CardDescription>Average correct answers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{averageScorePercentage}%</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity">
          <TabsList className="mb-6">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="distortions">Cognitive Distortions</TabsTrigger>
            <TabsTrigger value="details">Detailed Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Daily Practice Activity (Last 7 Days)</CardTitle>
                <CardDescription>
                  Number of practice sessions completed per day
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="distortions">
            <Card>
              <CardHeader>
                <CardTitle>Cognitive Distortion Distribution</CardTitle>
                <CardDescription>
                  Most common cognitive distortions in practice scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {distortionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distortionData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="distortion"
                        label={({ distortion }) => distortion}
                      >
                        {distortionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No distortion data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Recent Practice Results</CardTitle>
                <CardDescription>
                  Showing the last {data?.recentResults?.length || 0} practice results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">User</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-right">Score</th>
                        <th className="px-4 py-2 text-right">Time Spent</th>
                        <th className="px-4 py-2 text-center">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.recentResults?.map((result) => (
                        <tr key={result.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-2">{result.username || result.email}</td>
                          <td className="px-4 py-2">
                            {format(new Date(result.createdAt), "MMM d, yyyy HH:mm")}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {result.correctCount}/{result.totalCount} 
                            ({Math.round((result.correctCount / result.totalCount) * 100)}%)
                          </td>
                          <td className="px-4 py-2 text-right">
                            {Math.round(result.timeSpent / 1000)} seconds
                          </td>
                          <td className="px-4 py-2 text-center">
                            {result.completed ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">✗</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!data?.recentResults || data.recentResults.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            No recent practice results found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}