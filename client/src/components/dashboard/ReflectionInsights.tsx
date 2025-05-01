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
import { ThoughtRecord, EmotionRecord } from '@shared/schema';
import useActiveUser from '@/hooks/use-active-user';

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
  const { activeUserId, isViewingClientData, currentUser } = useActiveUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [emotionGroups, setEmotionGroups] = useState<EmotionGroup[]>([]);
  const [emotionRecords, setEmotionRecords] = useState<EmotionRecord[]>([]);
  const [reflectionRecords, setReflectionRecords] = useState<ThoughtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create state for storing protective factors and coping strategies usage
  const [protectiveFactorUsage, setProtectiveFactorUsage] = useState<{[thoughtId: number]: {id: number, name: string}[]}>({});
  const [copingStrategyUsage, setCopingStrategyUsage] = useState<{[thoughtId: number]: {id: number, name: string}[]}>({});
  
  useEffect(() => {
    if (!activeUserId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all emotion records for the active user
        const emotionsResponse = await apiRequest('GET', `/api/users/${activeUserId}/emotions`);
        const emotions: EmotionRecord[] = await emotionsResponse.json();
        setEmotionRecords(emotions);

        // Fetch all thought records for the active user
        const thoughtsResponse = await apiRequest('GET', `/api/users/${activeUserId}/thoughts`);
        const thoughts: ThoughtRecord[] = await thoughtsResponse.json();
        setReflectionRecords(thoughts);
        
        // Fetch protective factors and coping strategies for each thought record
        const protectiveFactorsMap: {[thoughtId: number]: {id: number, name: string}[]} = {};
        const copingStrategiesMap: {[thoughtId: number]: {id: number, name: string}[]} = {};
        
        // Parallel fetch for all thought records' protective factors
        await Promise.all(thoughts.map(async (thought) => {
          try {
            const pfResponse = await apiRequest('GET', 
              `/api/users/${activeUserId}/thoughts/${thought.id}/protective-factors`);
            const pfData = await pfResponse.json();
            protectiveFactorsMap[thought.id] = pfData;
          } catch (err) {
            console.error('Error fetching protective factors for thought:', thought.id, err);
            protectiveFactorsMap[thought.id] = [];
          }
        }));
        
        // Parallel fetch for all thought records' coping strategies
        await Promise.all(thoughts.map(async (thought) => {
          try {
            const csResponse = await apiRequest('GET', 
              `/api/users/${activeUserId}/thoughts/${thought.id}/coping-strategies`);
            const csData = await csResponse.json();
            copingStrategiesMap[thought.id] = csData;
          } catch (err) {
            console.error('Error fetching coping strategies for thought:', thought.id, err);
            copingStrategiesMap[thought.id] = [];
          }
        }));
        
        setProtectiveFactorUsage(protectiveFactorsMap);
        setCopingStrategyUsage(copingStrategiesMap);

        // Process the data
        processData(emotions, thoughts, protectiveFactorsMap, copingStrategiesMap);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeUserId]);

  const processData = (
    emotions: EmotionRecord[], 
    thoughts: ThoughtRecord[],
    protectiveFactorsMap: {[thoughtId: number]: {id: number, name: string}[]},
    copingStrategiesMap: {[thoughtId: number]: {id: number, name: string}[]}
  ) => {
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
        
      // Calculate most used strategies (both protective factors and coping strategies)
      const strategyCounts: Record<string, number> = {};
      
      // Count protective factors
      group.reflections.forEach(reflection => {
        const pfUsage = protectiveFactorsMap[reflection.id] || [];
        pfUsage.forEach(pf => {
          strategyCounts[pf.name] = (strategyCounts[pf.name] || 0) + 1;
        });
      });
      
      // Count coping strategies
      group.reflections.forEach(reflection => {
        const csUsage = copingStrategiesMap[reflection.id] || [];
        csUsage.forEach(cs => {
          strategyCounts[cs.name] = (strategyCounts[cs.name] || 0) + 1;
        });
      });
      
      // Sort strategies by usage count
      group.mostUsedStrategies = Object.entries(strategyCounts)
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
    
    // Customize message based on whether we're viewing client data or personal data
    const insightMessage = isViewingClientData
      ? "Showing frequency of each core emotion in this client's records."
      : "Showing frequency of each core emotion in your records.";
    
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
            {insightMessage}
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
  
  // Helper function to prepare data for strategies chart
  const prepareStrategiesData = () => {
    const strategyCounts: Record<string, number> = {};
    
    // Combine all strategies from all emotion groups
    emotionGroups.forEach(group => {
      group.mostUsedStrategies.forEach(strategy => {
        strategyCounts[strategy.name] = (strategyCounts[strategy.name] || 0) + strategy.count;
      });
    });
    
    // Convert to array format for chart
    return Object.entries(strategyCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };
  
  const renderStrategiesTab = () => {
    const strategiesData = prepareStrategiesData();
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Coping Strategies & Protective Factors</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isViewingClientData 
            ? "This shows the strategies the client uses most frequently and for which emotions."
            : "This shows the strategies you use most frequently and for which emotions."}
        </p>
        
        {strategiesData.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={strategiesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => entry.name}
                    >
                      {strategiesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="self-center">
                <h4 className="text-md font-medium mb-2">Top Strategies</h4>
                <ul className="space-y-2">
                  {strategiesData.slice(0, 5).map((strategy, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span>{strategy.name}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        Used {strategy.value} times
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <h4 className="text-md font-medium mt-6 mb-3">Strategies by Emotion</h4>
            <div className="space-y-4">
              {emotionGroups.map((group) => (
                <Card key={group.coreEmotion} className="overflow-hidden">
                  <div 
                    className="h-2" 
                    style={{ backgroundColor: EMOTION_COLORS[group.coreEmotion] || '#8884d8' }}
                  />
                  <CardHeader className="pb-2">
                    <CardTitle>{group.coreEmotion}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h5 className="text-sm font-medium mb-2">Most used strategies:</h5>
                      <div className="flex flex-wrap gap-2">
                        {group.mostUsedStrategies.length > 0 ? (
                          group.mostUsedStrategies.map((strategy, i) => (
                            <Badge key={i} variant="secondary">
                              {strategy.name} ({strategy.count})
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No strategies recorded</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="p-6 border rounded-lg text-center">
            <p>No strategies have been recorded yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start using protective factors and coping strategies in your reflections to see them here.
            </p>
          </div>
        )}
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
            <h3 className="text-lg font-medium mb-2">Understanding {isViewingClientData ? "Their" : "Your"} Patterns</h3>
            <p className="text-sm text-muted-foreground">
              {isViewingClientData 
                ? "Recognizing the client's most common thinking patterns can help guide your therapy approach. Focus on addressing these top cognitive distortions in future sessions."
                : "Recognizing your most common thinking patterns can help you become more aware of them in the moment. Focus on challenging your top cognitive distortions in future reflections."}
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
          {isViewingClientData 
            ? "Patterns and trends from client's thought reflections"
            : "Patterns and trends from your thought reflections"}
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