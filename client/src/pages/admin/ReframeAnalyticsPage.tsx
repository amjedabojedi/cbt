import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3, Database } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";

export default function ReframeAnalyticsPage() {
  // Fetch debug data for reframe coach results
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/debug/reframe-coach/results"],
  });

  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-8">Reframe Coach Analytics</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-800">Error loading analytics data: {String(error)}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Reframe Practice Results Overview
                </CardTitle>
                <CardDescription>
                  Overview of practice results from all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-secondary/20 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Practice Sessions</h3>
                    <p className="text-3xl font-bold">{data?.totalCount || 0}</p>
                  </div>
                  <div className="bg-secondary/20 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-muted-foreground">Recent Sessions</h3>
                    <p className="text-3xl font-bold">{data?.recentResultsCount || 0}</p>
                  </div>
                  <div className="bg-secondary/20 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-muted-foreground">Avg. Score</h3>
                    <p className="text-3xl font-bold">
                      {data?.recentResults?.length > 0 
                        ? Math.round(data.recentResults.reduce((acc, result) => acc + result.score, 0) / data.recentResults.length) 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Recent Practice Results
                </CardTitle>
                <CardDescription>
                  Most recent practice sessions from all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data?.recentResults?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-2 text-left">ID</th>
                          <th className="px-4 py-2 text-left">User ID</th>
                          <th className="px-4 py-2 text-left">Score</th>
                          <th className="px-4 py-2 text-left">Correct/Total</th>
                          <th className="px-4 py-2 text-left">Time Spent (sec)</th>
                          <th className="px-4 py-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentResults.map((result) => (
                          <tr key={result.id} className="border-b border-muted hover:bg-muted/30">
                            <td className="px-4 py-2">{result.id}</td>
                            <td className="px-4 py-2">{result.userId}</td>
                            <td className="px-4 py-2">{result.score}</td>
                            <td className="px-4 py-2">
                              {result.correctAnswers}/{result.totalQuestions}
                              <span className="ml-2 text-xs">
                                ({Math.round((result.correctAnswers / result.totalQuestions) * 100)}%)
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {Math.round(result.timeSpent / 1000) || 'N/A'}
                            </td>
                            <td className="px-4 py-2">
                              {new Date(result.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No practice results found
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}