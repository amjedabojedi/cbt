import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Target, Award, BarChart3, AlertCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis } from "recharts";
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";

interface ThoughtInsightsProps {
  userId: number;
}

const ANT_COLORS = [
  "#a78bfa", // Violet
  "#6366f1", // Indigo
  "#ec4899", // Fuchsia
  "#14b8a6", // Teal
  "#3b82f6", // Soothing blue
  "#f59e0b", // Amber/Gold
  "#ef4444", // Crimson Rose
  "#10b981", // Emerald sage
  "#8b5cf6", // Royal purple
  "#f97316", // Orange
  "#06b6d4", // Cyan
  "#f43f5e", // Pinkish red
];

export default function ThoughtInsights({ userId }: ThoughtInsightsProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  // Fetch thought records
  const { data: thoughts = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/thoughts`],
    enabled: !!userId,
  });

  // Fetch emotions for linking analysis
  const { data: emotions = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/emotions`],
    enabled: !!userId,
  });

  // Mapping function to convert category values to readable labels
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'all_or_nothing': 'All or Nothing Thinking',
      'overgeneralization': 'Overgeneralization',
      'mental_filter': 'Mental Filter',
      'disqualifying_positive': 'Disqualifying the Positive',
      'jumping_to_conclusions': 'Jumping to Conclusions',
      'magnification': 'Magnification/Minimization',
      'emotional_reasoning': 'Emotional Reasoning',
      'should_statements': 'Should Statements',
      'labeling': 'Labeling',
      'personalization': 'Personalization',
      'catastrophizing': 'Catastrophizing',
      'fortune_telling': 'Fortune Telling'
    };
    return labels[category] || category;
  };

  // Calculate ANT patterns (cognitive distortions)
  const getANTPatterns = () => {
    const distortionCounts: Record<string, number> = {};
    
    thoughts.forEach((thought) => {
      if (thought.thoughtCategory && Array.isArray(thought.thoughtCategory)) {
        thought.thoughtCategory.forEach((category: string) => {
          const label = getCategoryLabel(category);
          distortionCounts[label] = (distortionCounts[label] || 0) + 1;
        });
      }
    });
    
    return Object.entries(distortionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Calculate challenge rate for pie chart
  const getChallengeRate = () => {
    const challenged = thoughts.filter(t => t.evidenceFor || t.evidenceAgainst);
    const unchallenged = thoughts.filter(t => !t.evidenceFor && !t.evidenceAgainst);
    
    return [
      { 
        name: "Challenged", 
        value: challenged.length,
        percentage: thoughts.length > 0 ? Math.round((challenged.length / thoughts.length) * 100) : 0
      },
      { 
        name: "Not Challenged", 
        value: unchallenged.length,
        percentage: thoughts.length > 0 ? Math.round((unchallenged.length / thoughts.length) * 100) : 0
      },
    ];
  };

  // Calculate belief shift for challenged thoughts
  const getBeliefShift = () => {
    const challengedThoughts = thoughts.filter(t => t.alternativePerspective);
    
    if (challengedThoughts.length === 0) return [];
    
    const totalBeliefBefore = challengedThoughts.reduce((sum, t) => {
      return sum + (t.reflectionRating ? (10 - t.reflectionRating) * 10 : 80);
    }, 0);
    
    const totalBeliefAfter = challengedThoughts.reduce((sum, t) => {
      return sum + ((t.reflectionRating || 0) * 10);
    }, 0);
    
    const avgBeliefBefore = Math.round(totalBeliefBefore / challengedThoughts.length);
    const avgBeliefAfter = Math.round(totalBeliefAfter / challengedThoughts.length);
    
    return [
      {
        stage: "Before Challenge",
        belief: avgBeliefBefore,
      },
      {
        stage: "After Challenge",
        belief: avgBeliefAfter,
      }
    ];
  };

  // Calculate progress trends over time
  const getProgressTrends = () => {
    if (timeRange === "week") {
      const today = new Date();
      const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
      const currentWeekSunday = endOfWeek(today, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: currentWeekMonday, end: currentWeekSunday });
      
      return days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayThoughts = thoughts.filter(t => 
          format(new Date(t.createdAt), "yyyy-MM-dd") === dayStr
        );
        
        const challenged = dayThoughts.filter(t => t.evidenceFor || t.evidenceAgainst).length;
        
        return {
          date: format(day, 'EEE'),
          total: dayThoughts.length,
          challenged,
        };
      });
    } else if (timeRange === "month") {
      const today = new Date();
      const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
      
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const weekMonday = subDays(currentWeekMonday, i * 7);
        weeks.push(weekMonday);
      }
      
      return weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        
        const weekThoughts = thoughts.filter(t => {
          const thoughtDate = new Date(t.createdAt);
          return thoughtDate >= weekStart && thoughtDate <= weekEnd;
        });
        
        const challenged = weekThoughts.filter(t => t.evidenceFor || t.evidenceAgainst).length;
        
        return {
          date: `Week ${index + 1}`,
          total: weekThoughts.length,
          challenged,
        };
      });
    } else {
      const today = new Date();
      const currentYear = today.getFullYear();
      
      const months = [];
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        months.push(new Date(currentYear, monthIndex, 1));
      }
      
      return months.map(monthDate => {
        const monthStr = format(monthDate, 'MMM');
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthThoughts = thoughts.filter(t => {
          const thoughtDate = new Date(t.createdAt);
          return thoughtDate >= monthStart && thoughtDate <= monthEnd;
        });
        
        const challenged = monthThoughts.filter(t => t.evidenceFor || t.evidenceAgainst).length;
        
        return {
          date: monthStr,
          total: monthThoughts.length,
          challenged,
        };
      });
    }
  };

  // Calculate distortion-emotion correlation for bubble chart
  const getDistortionEmotionCorrelation = () => {
    const emotionMap = new Map(emotions.map(e => [e.id, e.coreEmotion]));
    const correlationMap: Map<string, { distortion: string, emotion: string, count: number }> = new Map();
    
    thoughts.forEach(thought => {
      if (thought.emotionRecordId && thought.thoughtCategory && Array.isArray(thought.thoughtCategory)) {
        const coreEmotion = emotionMap.get(thought.emotionRecordId);
        
        if (coreEmotion) {
          thought.thoughtCategory.forEach((category: string) => {
            const distortionLabel = getCategoryLabel(category);
            const key = `${distortionLabel}|${coreEmotion}`;
            
            const existing = correlationMap.get(key);
            if (existing) {
              existing.count += 1;
            } else {
              correlationMap.set(key, {
                distortion: distortionLabel,
                emotion: coreEmotion,
                count: 1
              });
            }
          });
        }
      }
    });
    
    return Array.from(correlationMap.values());
  };

  // Get all possible distortions and emotions for axes
  const getAllDistortionsAndEmotions = () => {
    const allDistortions = [
      'All or Nothing Thinking',
      'Overgeneralization',
      'Mental Filter',
      'Disqualifying the Positive',
      'Jumping to Conclusions',
      'Magnification/Minimization',
      'Emotional Reasoning',
      'Should Statements',
      'Labeling',
      'Personalization',
      'Catastrophizing',
      'Fortune Telling'
    ];
    
    const allEmotions = [
      'Joy',
      'Sadness',
      'Fear',
      'Anger',
      'Love',
      'Surprise'
    ];
    
    return { allDistortions, allEmotions };
  };

  // Calculate improvement metrics
  const getImprovementMetrics = () => {
    const challengedThoughts = thoughts.filter(t => t.evidenceFor || t.evidenceAgainst);
    
    if (challengedThoughts.length === 0) {
      return {
        avgReflectionRating: 0,
        totalChallenged: 0,
        challengeRate: 0,
      };
    }
    
    const avgReflectionRating = 
      challengedThoughts.reduce((sum, t) => sum + (t.reflectionRating || 0), 0) / challengedThoughts.length;
    
    return {
      avgReflectionRating: parseFloat(avgReflectionRating.toFixed(1)),
      totalChallenged: challengedThoughts.length,
      challengeRate: parseFloat(((challengedThoughts.length / thoughts.length) * 100).toFixed(1)),
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 bg-white/60 backdrop-blur border border-slate-100 rounded-3xl shadow-sm">
        <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (thoughts.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur rounded-3xl border border-slate-100 shadow-sm py-16 text-center px-6">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="h-8 w-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">CBT Thought Journal</h3>
        <p className="text-slate-500 max-w-sm mx-auto text-sm">No cognitive distortions or thought logs recorded yet. Begin documenting unhelpful thoughts to explore analytics.</p>
      </div>
    );
  }

  const metrics = getImprovementMetrics();
  const insightCardClass = "bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden hover:shadow-md hover:border-purple-200/60 transition-all duration-300";

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-emerald-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Challenge Rate</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{metrics.challengeRate}%</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {metrics.totalChallenged} of {thoughts.length} thoughts reframed
            </p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-indigo-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Reflection</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{metrics.avgReflectionRating}<span className="text-sm font-semibold text-slate-400">/10</span></h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Quality of challenged scenarios
            </p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-fuchsia-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-fuchsia-50 text-fuchsia-600">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ANTs Identified</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">
              {getANTPatterns().reduce((sum, ant) => sum + ant.count, 0)}
            </h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Cognitive distortions identified
            </p>
          </div>
        </div>
      </div>

      {/* ANT Patterns Chart */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Brain className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">ANT Patterns (Cognitive Distortions)</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Breakdown of unhelpful cognitive distortion styles detected in thoughts</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={getANTPatterns()} margin={{ left: -20, right: 10, bottom: 40, top: 15 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f8fafc" vertical={false} />
              <XAxis 
                dataKey="name" 
                angle={-35} 
                textAnchor="end" 
                interval={0}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                height={60}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(139, 92, 246, 0.05)', radius: [4, 4, 0, 0] } as any}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-md py-2 px-3 border border-purple-100 rounded-xl shadow-lg text-xs font-semibold">
                        <span className="text-slate-800">{data.name}: </span>
                        <span className="font-extrabold text-purple-700">{data.count} times</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {getANTPatterns().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ANT_COLORS[index % ANT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Challenge Rate */}
        <div className={insightCardClass}>
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Target className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Challenge Rate</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">Percentage of negative thoughts systematically analyzed</p>
          </div>
          <div className="p-6 flex flex-col items-center justify-center min-h-[280px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={getChallengeRate()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#10b981" stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                  <Cell fill="#e2e8f0" stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-md py-1.5 px-3 border border-purple-50 rounded-xl shadow-lg text-xs font-semibold text-slate-800">
                          {data.name}: <span className="font-extrabold text-slate-700">{data.value} thoughts ({data.percentage}%)</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 text-center">
              <p className="text-xs font-semibold text-slate-500">
                {thoughts.length > 0 ? `${getChallengeRate()[0].value} of ${thoughts.length} thoughts reframed` : 'No scenario recorded'}
              </p>
            </div>
          </div>
        </div>

        {/* Belief Shift from Challenging */}
        <div className={insightCardClass}>
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Belief Shift</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">Average shift in belief conviction after restructuring exercises</p>
          </div>
          <div className="p-6 flex items-center justify-center min-h-[280px]">
            {getBeliefShift().length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={getBeliefShift()} margin={{ left: -20, right: 10, bottom: 5, top: 15 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f8fafc" vertical={false} />
                  <XAxis 
                    dataKey="stage" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-md py-1.5 px-3 border border-purple-50 rounded-xl shadow-lg text-xs font-semibold text-slate-800">
                            {data.stage}: <span className="font-extrabold text-indigo-600">{data.belief}% conviction</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="belief" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    <Cell fill="#f43f5e" />
                    <Cell fill="#10b981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                <AlertCircle className="h-6 w-6 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-semibold max-w-[200px]">Complete cognitive reframing scenarios to analyze shift patterns.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Distortion-Emotion Correlation Bubble Chart */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
              <Brain className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Distortion-Emotion Patterns</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Cross-connection mapping identifying which thinking biases spark specific core emotions</p>
        </div>
        <div className="p-6">
          {(() => {
            const correlationData = getDistortionEmotionCorrelation();
            const { allDistortions, allEmotions } = getAllDistortionsAndEmotions();
            
            if (correlationData.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center h-[280px] text-center p-4">
                  <AlertCircle className="h-6 w-6 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400 font-semibold max-w-sm">No connected distortion-emotion maps found. Complete thought challenges that reference emotion tracks.</p>
                </div>
              );
            }

            const distortionIndex = new Map(allDistortions.map((d, i) => [d, i]));
            const emotionIndex = new Map(allEmotions.map((e, i) => [e, i]));
            
            const scatterData = correlationData.map(item => ({
              x: distortionIndex.get(item.distortion),
              y: emotionIndex.get(item.emotion),
              z: item.count * 45,
              count: item.count,
              distortion: item.distortion,
              emotion: item.emotion,
            }));
            
            return (
              <>
                <ResponsiveContainer width="100%" height={380}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 90, left: 90 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      domain={[-0.5, allDistortions.length - 0.5]}
                      ticks={Array.from({ length: allDistortions.length }, (_, i) => i)}
                      tickFormatter={(value) => allDistortions[value] || ''}
                      angle={-30}
                      textAnchor="end"
                      height={90}
                      interval={0}
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y"
                      domain={[-0.5, allEmotions.length - 0.5]}
                      ticks={Array.from({ length: allEmotions.length }, (_, i) => i)}
                      tickFormatter={(value) => allEmotions[value] || ''}
                      width={80}
                      interval={0}
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ZAxis type="number" dataKey="z" range={[60, 420]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3', stroke: '#c084fc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-md p-3 border border-purple-100 rounded-xl shadow-xl">
                              <p className="font-bold text-slate-800 text-xs">{data.distortion}</p>
                              <p className="text-[11px] font-semibold text-purple-600 mt-0.5">{data.emotion} Emotion</p>
                              <div className="border-t border-slate-100 mt-1.5 pt-1 flex items-center justify-between gap-3 text-[11px] font-semibold">
                                <span className="text-slate-500">Occurrences:</span>
                                <span className="text-slate-800 font-extrabold">{data.count} times</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter 
                      data={scatterData} 
                      fill="#8b5cf6"
                      fillOpacity={0.65}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-purple-50/40 rounded-xl border border-purple-100/30 text-[11px] text-slate-500 text-center font-medium max-w-lg mx-auto">
                  <span className="font-bold text-purple-700">Analytics Tip:</span> Bubble size corresponds to pattern frequency. Larger nodes highlight common connection patterns between cognitive distortions and emotional triggers.
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Progress Trends Over Time */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Progress Trends</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">Review your absolute cognitive journaling volumes against challenged counts</p>
          </div>
          <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-auto">
            <TabsList className="bg-slate-100 p-0.5 rounded-xl h-auto">
              <TabsTrigger value="week" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#090514] data-[state=active]:shadow-sm text-slate-500 font-semibold">Week</TabsTrigger>
              <TabsTrigger value="month" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#090514] data-[state=active]:shadow-sm text-slate-500 font-semibold">Month</TabsTrigger>
              <TabsTrigger value="year" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#090514] data-[state=active]:shadow-sm text-slate-500 font-semibold">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="p-6 overflow-visible">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={getProgressTrends()} margin={{ left: -10, right: 10, bottom: 5, top: 10 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-md p-3 border border-purple-100 rounded-xl shadow-xl">
                        <p className="font-bold text-slate-800 text-xs mb-1.5">{data.date}</p>
                        <div className="space-y-1 text-[11px] font-semibold">
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-indigo-600">Total Thoughts Logged:</span>
                            <span className="text-slate-800 font-extrabold">{data.total}</span>
                          </div>
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-emerald-600">Thoughts Challenged:</span>
                            <span className="text-slate-800 font-extrabold">{data.challenged}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }} 
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                name="Total Thoughts Logged"
                dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="challenged" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Thoughts Challenged"
                dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
