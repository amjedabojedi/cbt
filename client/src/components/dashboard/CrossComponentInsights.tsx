import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis
} from 'recharts';
import { Separator } from '@/components/ui/separator';
import useActiveUser from '@/hooks/use-active-user';
import { Link2, Lightbulb, ArrowRightLeft, Maximize2 } from 'lucide-react';

// Type to represent connected data insights
interface ConnectedInsight {
  emotionName: string;
  journalCount: number;
  thoughtRecordCount: number;
  totalEntries: number;
  averageIntensity: number;
  averageImprovement: number;
  color: string;
}

// Define emotion colors for consistency
const EMOTION_COLORS: Record<string, string> = {
  'Joy': '#F9D71C',
  'Sadness': '#6D87C4',
  'Fear': '#8A65AA',
  'Disgust': '#7DB954',
  'Anger': '#E43D40',
  'Surprise': '#F47B20',
  'Trust': '#8DC4BD',
  'Love': '#E91E63',
  'Anxiety': '#9C27B0',
  'Anticipation': '#FF9800'
};

export default function CrossComponentInsights() {
  const { activeUserId } = useActiveUser();
  const [activeTab, setActiveTab] = useState('connections');

  // Fetch emotion records
  const { data: emotions, isLoading: isLoadingEmotions } = useQuery({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!activeUserId,
  });

  // Fetch thought records
  const { data: thoughtRecords, isLoading: isLoadingThoughts } = useQuery({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/thoughts`] : [],
    enabled: !!activeUserId,
  });

  // Fetch journal entries
  const { data: journalEntries, isLoading: isLoadingJournal } = useQuery({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/journal`] : [],
    enabled: !!activeUserId,
  });

  // Process data for connected insights
  const processConnectedInsights = (): ConnectedInsight[] => {
    if (!emotions || !thoughtRecords || !journalEntries) return [];

    // Create a map to track emotions across different data sources
    const emotionMap: Record<string, ConnectedInsight> = {};

    // Process emotions from emotion records
    if (Array.isArray(emotions)) {
      emotions.forEach((record: any) => {
        const emotionName = record.coreEmotion;
        
        if (emotionName && !emotionMap[emotionName]) {
          emotionMap[emotionName] = {
            emotionName,
            journalCount: 0,
            thoughtRecordCount: 0,
            totalEntries: 0,
            averageIntensity: 0,
            averageImprovement: 0,
            color: EMOTION_COLORS[emotionName] || '#CCCCCC'
          };
        }
        
        if (emotionName) {
          emotionMap[emotionName].totalEntries++;
          // Sum intensities for later averaging
          emotionMap[emotionName].averageIntensity += record.intensity || 0;
        }
      });
    }

    // Process thought records to count associated emotions
    if (Array.isArray(thoughtRecords)) {
      thoughtRecords.forEach((record: any) => {
        const emotionName = record.emotion;
        
        if (emotionName && emotionMap[emotionName]) {
          emotionMap[emotionName].thoughtRecordCount++;
          
          // If there's before/after ratings, calculate improvement
          if (record.beforeRating && record.afterRating) {
            const improvement = record.afterRating - record.beforeRating;
            emotionMap[emotionName].averageImprovement += improvement;
          }
        }
      });
    }

    // Process journal entries to count tagged emotions
    if (Array.isArray(journalEntries)) {
      journalEntries.forEach((entry: any) => {
        // Use user selected tags if available, otherwise use AI suggested
        const tags = Array.isArray(entry.userSelectedTags) ? entry.userSelectedTags : 
                    Array.isArray(entry.selectedTags) ? entry.selectedTags : 
                    Array.isArray(entry.aiSuggestedTags) ? entry.aiSuggestedTags : [];
        
        // Check each tag to see if it matches an emotion
        if (Array.isArray(tags)) {
          tags.forEach((tag: string) => {
            // Convert to lowercase for case-insensitive matching
            const lowerTag = tag.toLowerCase();
            
            // Check if this tag matches any emotion name (case-insensitive)
            Object.keys(emotionMap).forEach(emotionName => {
              if (lowerTag === emotionName.toLowerCase() || 
                  emotionName.toLowerCase().includes(lowerTag) || 
                  lowerTag.includes(emotionName.toLowerCase())) {
                emotionMap[emotionName].journalCount++;
              }
            });
          });
        }
      });
    }

    // Calculate averages and create final array
    return Object.values(emotionMap)
      .map(insight => {
        if (insight.totalEntries > 0) {
          insight.averageIntensity = insight.averageIntensity / insight.totalEntries;
        }
        
        if (insight.thoughtRecordCount > 0) {
          insight.averageImprovement = insight.averageImprovement / insight.thoughtRecordCount;
        }
        
        return insight;
      })
      .filter(insight => insight.totalEntries > 0) // Only include emotions with data
      .sort((a, b) => b.totalEntries - a.totalEntries); // Sort by total entries descending
  };

  // Data for charts
  const connectedInsights = processConnectedInsights();
  
  // Data for connection strength chart - only emotions that appear in multiple components
  const connectionStrengthData = connectedInsights
    .filter(insight => (insight.journalCount > 0 && insight.thoughtRecordCount > 0))
    .map(insight => ({
      emotion: insight.emotionName,
      journalEntries: insight.journalCount,
      thoughtRecords: insight.thoughtRecordCount,
      totalRecords: insight.totalEntries,
      color: insight.color
    }));

  // Data for improvement chart
  const improvementData = connectedInsights
    .filter(insight => insight.averageImprovement !== 0)
    .map(insight => ({
      emotion: insight.emotionName,
      improvement: parseFloat(insight.averageImprovement.toFixed(1)),
      color: insight.color
    }));

  // Data for scatter plot showing relationship between intensity and improvement
  const intensityImprovementData = connectedInsights
    .filter(insight => insight.averageImprovement !== 0)
    .map(insight => ({
      emotion: insight.emotionName,
      intensity: parseFloat(insight.averageIntensity.toFixed(1)),
      improvement: parseFloat(insight.averageImprovement.toFixed(1)),
      size: insight.totalEntries, // Size of dots based on entry count
      color: insight.color
    }));

  // Loading state
  const isLoading = isLoadingEmotions || isLoadingThoughts || isLoadingJournal;

  // Check if we have meaningful data
  const hasData = connectedInsights.length > 0;
  const hasConnectionData = connectionStrengthData.length > 0;
  const hasImprovementData = improvementData.length > 0;

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-md shadow-sm">
          <p className="font-medium">{label}</p>
          <div className="mt-1 space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm flex items-center">
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

  // Custom tooltip for scatter chart
  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-md shadow-sm">
          <p className="font-medium">{data.emotion}</p>
          <div className="mt-1 space-y-1">
            <p className="text-sm">Intensity: {data.intensity}/10</p>
            <p className="text-sm">Improvement: {data.improvement} points</p>
            <p className="text-sm">Total entries: {data.size}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Cross-Component Insights
        </CardTitle>
        <CardDescription>
          Discover patterns between your emotions, journal entries, and thought records
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <Lightbulb className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-neutral-500">Not enough data to generate insights yet.</p>
            <p className="text-sm text-neutral-400 mt-1">
              Continue tracking emotions, adding journal entries, and creating thought records to see connections.
            </p>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="connections">
                  Connection Strength
                </TabsTrigger>
                <TabsTrigger value="improvements">
                  Emotion Improvement
                </TabsTrigger>
                <TabsTrigger value="patterns">
                  Intensity vs. Improvement
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="connections" className="space-y-4">
                {!hasConnectionData ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center">
                    <ArrowRightLeft className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-neutral-500">No connections found yet.</p>
                    <p className="text-sm text-neutral-400 mt-1">
                      Try recording the same emotions in both journal entries and thought records.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      This chart shows emotions that appear in multiple components, revealing how your tracked emotions connect across different tools.
                    </p>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={connectionStrengthData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
                          barGap={4}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="emotion" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ paddingTop: 10 }} />
                          <Bar 
                            yAxisId="left"
                            dataKey="journalEntries" 
                            name="Journal Entries" 
                            fill="#8884d8" 
                            radius={[2, 2, 0, 0]}
                          />
                          <Bar 
                            yAxisId="left"
                            dataKey="thoughtRecords" 
                            name="Thought Records" 
                            fill="#82ca9d" 
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="improvements" className="space-y-4">
                {!hasImprovementData ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center">
                    <Maximize2 className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-neutral-500">No improvement data available yet.</p>
                    <p className="text-sm text-neutral-400 mt-1">
                      Complete thought records with before/after ratings to see emotional improvement.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      This chart shows the average improvement in emotion ratings from before to after using coping strategies.
                    </p>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={improvementData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
                          barGap={4}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="emotion" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="improvement" 
                            name="Average Improvement" 
                            radius={[2, 2, 0, 0]}
                          >
                            {improvementData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="patterns" className="space-y-4">
                {!hasImprovementData ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center">
                    <Maximize2 className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-neutral-500">No pattern data available yet.</p>
                    <p className="text-sm text-neutral-400 mt-1">
                      Continue recording emotions and completing thought records to reveal patterns.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      This chart shows the relationship between emotion intensity and improvement, revealing which emotions respond best to your coping strategies.
                    </p>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            type="number" 
                            dataKey="intensity" 
                            name="Intensity" 
                            domain={[0, 10]} 
                            tick={{ fontSize: 12 }}
                            label={{ 
                              value: 'Emotion Intensity', 
                              position: 'bottom', 
                              offset: 0,
                              style: { textAnchor: 'middle' }
                            }}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="improvement" 
                            name="Improvement" 
                            tick={{ fontSize: 12 }}
                            label={{ 
                              value: 'Improvement Score', 
                              position: 'left', 
                              angle: -90, 
                              offset: 10,
                              style: { textAnchor: 'middle' }
                            }}
                          />
                          <ZAxis 
                            type="number" 
                            dataKey="size" 
                            range={[50, 500]} 
                            name="Total Entries" 
                          />
                          <Tooltip content={<ScatterTooltip />} />
                          <Scatter name="Emotions" data={intensityImprovementData}>
                            {intensityImprovementData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
            
            <Separator className="my-4" />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Key Takeaways:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {connectionStrengthData.length > 0 && (
                  <li>
                    <span className="font-medium text-primary">
                      {connectionStrengthData[0]?.emotion}
                    </span> appears most frequently across your records.
                  </li>
                )}
                {improvementData.length > 0 && (
                  <li>
                    <span className="font-medium text-primary">
                      {improvementData.sort((a, b) => b.improvement - a.improvement)[0]?.emotion}
                    </span> shows the highest improvement after using coping strategies.
                  </li>
                )}
                {intensityImprovementData.length > 0 && (
                  <li>
                    Higher intensity emotions 
                    {intensityImprovementData.some(item => item.intensity > 7 && item.improvement > 0)
                      ? " generally show greater improvement"
                      : " may be more challenging to address"} 
                    after using coping strategies.
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}