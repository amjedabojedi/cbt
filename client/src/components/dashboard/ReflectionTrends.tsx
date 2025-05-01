import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ReflectionTrendsProps {
  userId: number;
  days?: number;
}

interface EmotionCount {
  emotion: string;
  count: number;
  color: string;
}

interface ReflectionRatingData {
  date: string;
  rating: number;
}

export default function ReflectionTrends({ userId, days = 30 }: ReflectionTrendsProps) {
  const { user } = useAuth();
  const [emotionCounts, setEmotionCounts] = useState<EmotionCount[]>([]);
  const [reflectionRatings, setReflectionRatings] = useState<ReflectionRatingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchReflectionData = async () => {
      try {
        setLoading(true);
        
        // Fetch emotion distribution
        const emotionsResponse = await apiRequest(
          "GET",
          `/api/users/${userId}/emotions/stats?days=${days}`
        );
        const emotionsData = await emotionsResponse.json();
        
        // Fetch reflection ratings over time
        const ratingsResponse = await apiRequest(
          "GET",
          `/api/users/${userId}/thoughts/ratings?days=${days}`
        );
        const ratingsData = await ratingsResponse.json();
        
        setEmotionCounts(emotionsData);
        setReflectionRatings(ratingsData);
      } catch (error) {
        console.error("Error fetching reflection trends:", error);
        setError("Failed to load reflection trends data");
      } finally {
        setLoading(false);
      }
    };

    fetchReflectionData();
  }, [user, userId, days]);

  // Gets color based on emotion for chart
  const getEmotionColor = (emotion: string): string => {
    const colorMap: Record<string, string> = {
      // Core emotions
      "Joy": "#F9D71C",
      "Sadness": "#6D87C4",
      "Fear": "#8A65AA",
      "Disgust": "#7DB954",
      "Anger": "#E43D40",
      // Add more colors for secondary/tertiary emotions if needed
    };
    
    return colorMap[emotion] || "#888888";
  };

  if (loading) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-primary border-r-neutral-200 border-b-neutral-200 border-l-neutral-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-neutral-600">Loading reflection data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-[300px]">
        <CardHeader>
          <CardTitle>Reflection Trends</CardTitle>
          <CardDescription>Analysis of your emotional reflections</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reflection Trends</CardTitle>
        <CardDescription>Analysis of your emotional reflections over the past {days} days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Emotion Distribution Chart */}
          <div>
            <h3 className="text-sm font-medium mb-3">Emotion Distribution</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionCounts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="emotion" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar 
                    dataKey="count" 
                    fill="#8884d8"
                    name="Occurrences"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  >
                    {emotionCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getEmotionColor(entry.emotion)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Reflection Rating Trend Chart */}
          <div>
            <h3 className="text-sm font-medium mb-3">Reflection Effectiveness Over Time</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reflectionRatings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="rating" 
                    stroke="#8884d8" 
                    name="Effectiveness Rating"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Pattern Analysis Section */}
          <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
            <h3 className="text-sm font-medium mb-2">Pattern Analysis</h3>
            <p className="text-sm text-neutral-600">
              {reflectionRatings.length > 0 
                ? "Your reflections show increasing effectiveness over time, indicating growth in your emotional processing skills."
                : "Start recording reflections to see pattern analysis."}
            </p>
            {emotionCounts.length > 0 && (
              <div className="mt-2 text-sm text-neutral-600">
                <p>
                  <span className="font-medium">Most frequent emotion:</span>{" "}
                  {emotionCounts.sort((a, b) => b.count - a.count)[0]?.emotion}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}