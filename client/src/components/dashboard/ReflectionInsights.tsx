import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { ThoughtRecord, EmotionRecord } from '@shared/schema';

type EmotionGroup = {
  coreEmotion: string;
  emotions: EmotionRecord[];
  reflections: ThoughtRecord[];
  count: number;
  totalIntensity: number;
  averageIntensity: number;
  // Add more aggregate data here as needed
  commonDistortions: { name: string; count: number }[];
  mostUsedStrategies: { name: string; count: number }[];
  averageRating: number;
  improvementRate: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const EMOTION_COLORS: Record<string, string> = {
  'Joy': '#F9D71C',
  'Sadness': '#6D87C4',
  'Fear': '#8A65AA',
  'Disgust': '#7DB954',
  'Anger': '#E43D40',
  'Surprise': '#F47B20',
  'Trust': '#8DC4BD'
};

const DEFAULT_TABS = ['overview', 'emotions', 'strategies', 'distortions'];

export default function ReflectionInsights() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [emotionGroups, setEmotionGroups] = useState<EmotionGroup[]>([]);
  const [emotionRecords, setEmotionRecords] = useState<EmotionRecord[]>([]);
  const [reflectionRecords, setReflectionRecords] = useState<ThoughtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all emotion records
        const emotionsResponse = await apiRequest('GET', `/api/users/${user.id}/emotions`);
        const emotions: EmotionRecord[] = await emotionsResponse.json();
        setEmotionRecords(emotions);

        // Fetch all thought records
        const thoughtsResponse = await apiRequest('GET', `/api/users/${user.id}/thoughts`);
        const thoughts: ThoughtRecord[] = await thoughtsResponse.json();
        setReflectionRecords(thoughts);

        // Process the data
        processData(emotions, thoughts);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const processData = (emotions: EmotionRecord[], thoughts: ThoughtRecord[]) => {
    // Group emotions by core emotion
    const groupedEmotions: Record<string, EmotionGroup> = {};

    // Initialize emotion groups
    emotions.forEach(emotion => {
      const coreEmotion = emotion.coreEmotion;
      if (!groupedEmotions[coreEmotion]) {
        groupedEmotions[coreEmotion] = {
          coreEmotion,
          emotions: [],
          reflections: [],
          count: 0,
          totalIntensity: 0,
          averageIntensity: 0,
          commonDistortions: [],
          mostUsedStrategies: [],
          averageRating: 0,
          improvementRate: 0
        };
      }

      groupedEmotions[coreEmotion].emotions.push(emotion);
      groupedEmotions[coreEmotion].count += 1;
      groupedEmotions[coreEmotion].totalIntensity += emotion.intensity;
    });

    // Add related reflections to each emotion group
    thoughts.forEach(thought => {
      const matchingEmotion = emotions.find(e => e.id === thought.emotionRecordId);
      if (matchingEmotion) {
        const coreEmotion = matchingEmotion.coreEmotion;
        if (groupedEmotions[coreEmotion]) {
          groupedEmotions[coreEmotion].reflections.push(thought);
        }
      }
    });

    // Calculate averages and other metrics
    Object.values(groupedEmotions).forEach(group => {
      // Calculate average intensity
      group.averageIntensity = group.totalIntensity / group.count;

      // Calculate common cognitive distortions
      const distortionCounts: Record<string, number> = {};
      group.reflections.forEach(reflection => {
        if (reflection.cognitiveDistortions) {
          reflection.cognitiveDistortions.forEach(distortion => {
            distortionCounts[distortion] = (distortionCounts[distortion] || 0) + 1;
          });
        }
      });
      group.commonDistortions = Object.entries(distortionCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate average reflection rating
      if (group.reflections.length > 0) {
        const totalRating = group.reflections.reduce(
          (sum, reflection) => sum + (reflection.reflectionRating || 0), 
          0
        );
        group.averageRating = totalRating / group.reflections.length;
      }

      // Calculate average improvement (difference between emotion intensity and reflection rating)
      if (group.reflections.length > 0) {
        let totalImprovement = 0;
        let countWithBoth = 0;

        group.reflections.forEach(reflection => {
          const matchingEmotion = emotions.find(e => e.id === reflection.emotionRecordId);
          if (matchingEmotion && reflection.reflectionRating) {
            // Convert to same scale (assuming both are 1-10)
            const emotionIntensity = matchingEmotion.intensity;
            const reflectionRating = reflection.reflectionRating;
            
            // Calculate improvement (lower intensity or higher rating is better)
            // For consistency, we'll say positive values mean improvement
            const improvement = reflectionRating - emotionIntensity;
            
            totalImprovement += improvement;
            countWithBoth++;
          }
        });

        if (countWithBoth > 0) {
          group.improvementRate = totalImprovement / countWithBoth;
        }
      }
    });

    // Convert to array and sort by count (most frequent emotions first)
    const groupsArray = Object.values(groupedEmotions).sort((a, b) => b.count - a.count);
    setEmotionGroups(groupsArray);
  };

  // Prepare data for the overview chart
  const prepareEmotionData = () => {
    return emotionGroups.map(group => ({
      name: group.coreEmotion,
      count: group.count,
      averageIntensity: parseFloat(group.averageIntensity.toFixed(1)),
      improvement: parseFloat(group.improvementRate.toFixed(1)),
      fill: EMOTION_COLORS[group.coreEmotion] || '#8884d8'
    }));
  };

  // Prepare data for cognitive distortions chart
  const prepareDistortionsData = () => {
    const distortionCounts: Record<string, number> = {};
    
    // Collect all distortions across all reflections
    reflectionRecords.forEach(reflection => {
      if (reflection.cognitiveDistortions) {
        reflection.cognitiveDistortions.forEach(distortion => {
          distortionCounts[distortion] = (distortionCounts[distortion] || 0) + 1;
        });
      }
    });
    
    // Convert to array format for chart
    return Object.entries(distortionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Render charts and insights based on active tab
  const renderTabContent = () => {
    if (loading) {
      return <div className="p-4 text-center">Loading insights...</div>;
    }

    if (error) {
      return <div className="p-4 text-center text-red-500">Error loading insights: {error.message}</div>;
    }

    if (emotionGroups.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="mb-4">No reflection data available yet.</p>
          <p className="text-sm">Complete more reflections to see insights here.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'emotions':
        return renderEmotionsTab();
      case 'strategies':
        return renderStrategiesTab();
      case 'distortions':
        return renderDistortionsTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => {
    const emotionData = prepareEmotionData();
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Emotion Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={emotionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" name="Frequency" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-sm text-muted-foreground">
            Showing frequency of each core emotion in your records.
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Reflections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reflectionRecords.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Most Common Emotion</CardTitle>
            </CardHeader>
            <CardContent>
              {emotionGroups.length > 0 && (
                <div>
                  <p className="text-xl font-bold">{emotionGroups[0].coreEmotion}</p>
                  <p className="text-sm text-muted-foreground">Recorded {emotionGroups[0].count} times</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Avg. Improvement</CardTitle>
              <CardDescription>After reflection</CardDescription>
            </CardHeader>
            <CardContent>
              {emotionGroups.length > 0 && (
                <p className="text-2xl font-bold">
                  {(emotionGroups.reduce((sum, group) => sum + group.improvementRate, 0) / emotionGroups.length).toFixed(1)} 
                  <span className="text-sm font-normal text-muted-foreground ml-1">points</span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderEmotionsTab = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Emotion Analysis</h3>
        
        {emotionGroups.map((group) => (
          <Card key={group.coreEmotion} className="overflow-hidden">
            <div 
              className="h-2" 
              style={{ backgroundColor: EMOTION_COLORS[group.coreEmotion] || '#8884d8' }}
            />
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{group.coreEmotion}</CardTitle>
                <Badge variant="outline">{group.count} records</Badge>
              </div>
              <CardDescription>
                Average intensity: {group.averageIntensity.toFixed(1)}/10
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Most common situations:</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.emotions.length > 0 ? (
                      group.emotions
                        .filter(e => e.situation)
                        .slice(0, 3)
                        .map((emotion, i) => (
                          <Badge key={i} variant="secondary">
                            {emotion.situation}
                          </Badge>
                        ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No situations recorded</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Common distortions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.commonDistortions.length > 0 ? (
                      group.commonDistortions.slice(0, 3).map((distortion, i) => (
                        <Badge key={i} variant="outline">
                          {distortion.name} ({distortion.count})
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No distortions recorded</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Improvement after reflection:</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                      {group.improvementRate > 0 ? '+' : ''}{group.improvementRate.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">points on average</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  const renderStrategiesTab = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Coping Strategies Effectiveness</h3>
        <p className="text-sm text-muted-foreground">
          This section will show which coping strategies you use most frequently 
          and how effective they are for different emotions.
        </p>
        
        <div className="p-6 border rounded-lg text-center">
          <p>This feature will be available once you've recorded more reflections.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Continue using coping strategies in your reflections to see their effectiveness here.
          </p>
        </div>
      </div>
    );
  };
  
  const renderDistortionsTab = () => {
    const distortionData = prepareDistortionsData();
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Cognitive Distortion Patterns</h3>
          
          {distortionData.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distortionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => entry.name}
                    >
                      {distortionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="self-center">
                <h4 className="text-md font-medium mb-2">Top Distortions</h4>
                <ul className="space-y-2">
                  {distortionData.slice(0, 5).map((distortion, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="font-medium">{distortion.name}:</span>
                      <span>{distortion.value} occurrences</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-6 border rounded-lg text-center">
              <p>No cognitive distortions recorded yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Identify distortions in your reflections to see patterns here.
              </p>
            </div>
          )}
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Understanding Your Patterns</h3>
            <p className="text-sm text-muted-foreground">
              Recognizing your most common thinking patterns can help you become more aware 
              of them in the moment. Focus on challenging your top cognitive distortions in future reflections.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reflection Insights</CardTitle>
        <CardDescription>
          Patterns and trends from your thought reflections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="distortions">Distortions</TabsTrigger>
          </TabsList>
          {DEFAULT_TABS.map(tab => (
            <TabsContent key={tab} value={tab}>
              {renderTabContent()}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}