import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, PieChart as PieChartIcon, Calendar as CalendarIcon, Clock } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, parseISO, startOfDay } from "date-fns";

interface EmotionInsightsProps {
  userId: number;
}

const EMOTION_COLORS: Record<string, string> = {
  "Joy": "#eab308", // Amber/Gold
  "Sadness": "#3b82f6", // Soothing blue
  "Fear": "#10b981", // Emerald sage
  "Anger": "#ef4444", // Crimson red
  "Disgust": "#8b5cf6", // Royal purple
  "Surprise": "#f97316", // Sunset orange
  "Love": "#ec4899", // Fuchsia pink
};

// Define positive and negative emotions
const POSITIVE_EMOTIONS = ["Joy", "Love", "Surprise"];
const NEGATIVE_EMOTIONS = ["Sadness", "Fear", "Anger", "Disgust"];

export default function EmotionInsights({ userId }: EmotionInsightsProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

  // Fetch emotion records
  const { data: emotions = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/emotions`],
    enabled: !!userId,
  });

  // Calculate emotion distribution
  const getEmotionDistribution = () => {
    const counts: Record<string, number> = {};
    emotions.forEach((e) => {
      counts[e.coreEmotion] = (counts[e.coreEmotion] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: EMOTION_COLORS[name] || "#94a3b8",
    }));
  };

  // Calculate mood trends over time with positive/negative separation
  const getMoodTrends = () => {
    if (timeRange === "week") {
      const today = new Date();
      const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
      const currentWeekSunday = endOfWeek(today, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: currentWeekMonday, end: currentWeekSunday });
      
      return days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayEmotions = emotions.filter(e => 
          format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr
        );
        
        const positiveEmotions = dayEmotions.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion));
        const negativeEmotions = dayEmotions.filter(e => NEGATIVE_EMOTIONS.includes(e.coreEmotion));
        
        const avgPositiveIntensity = positiveEmotions.length > 0
          ? positiveEmotions.reduce((sum, e) => sum + e.intensity, 0) / positiveEmotions.length
          : 0;
        
        const avgNegativeIntensity = negativeEmotions.length > 0
          ? negativeEmotions.reduce((sum, e) => sum + e.intensity, 0) / negativeEmotions.length
          : 0;
        
        return {
          date: format(day, 'EEE'),
          positiveIntensity: parseFloat(avgPositiveIntensity.toFixed(1)),
          negativeIntensity: parseFloat(avgNegativeIntensity.toFixed(1)),
          count: dayEmotions.length,
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
        
        const weekEmotions = emotions.filter(e => {
          const emotionDate = new Date(e.createdAt);
          return emotionDate >= weekStart && emotionDate <= weekEnd;
        });
        
        const positiveEmotions = weekEmotions.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion));
        const negativeEmotions = weekEmotions.filter(e => NEGATIVE_EMOTIONS.includes(e.coreEmotion));
        
        const avgPositiveIntensity = positiveEmotions.length > 0
          ? positiveEmotions.reduce((sum, e) => sum + e.intensity, 0) / positiveEmotions.length
          : 0;
        
        const avgNegativeIntensity = negativeEmotions.length > 0
          ? negativeEmotions.reduce((sum, e) => sum + e.intensity, 0) / negativeEmotions.length
          : 0;
        
        return {
          date: `Week ${index + 1}`,
          positiveIntensity: parseFloat(avgPositiveIntensity.toFixed(1)),
          negativeIntensity: parseFloat(avgNegativeIntensity.toFixed(1)),
          count: weekEmotions.length,
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
        
        const monthEmotions = emotions.filter(e => {
          const emotionDate = new Date(e.createdAt);
          return emotionDate >= monthStart && emotionDate <= monthEnd;
        });
        
        const positiveEmotions = monthEmotions.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion));
        const negativeEmotions = monthEmotions.filter(e => NEGATIVE_EMOTIONS.includes(e.coreEmotion));
        
        const avgPositiveIntensity = positiveEmotions.length > 0
          ? positiveEmotions.reduce((sum, e) => sum + e.intensity, 0) / positiveEmotions.length
          : 0;
        
        const avgNegativeIntensity = negativeEmotions.length > 0
          ? negativeEmotions.reduce((sum, e) => sum + e.intensity, 0) / negativeEmotions.length
          : 0;
        
        return {
          date: monthStr,
          positiveIntensity: parseFloat(avgPositiveIntensity.toFixed(1)),
          negativeIntensity: parseFloat(avgNegativeIntensity.toFixed(1)),
          count: monthEmotions.length,
        };
      });
    }
  };

  // Calculate intensity heatmap data organized by weeks starting Monday
  const getIntensityHeatmap = () => {
    const today = startOfDay(new Date());
    const startDate = startOfWeek(subDays(today, 28), { weekStartsOn: 1 });
    const endDate = endOfWeek(today, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEmotions = emotions.filter(e => 
        format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      const positiveEmotions = dayEmotions.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion));
      const negativeEmotions = dayEmotions.filter(e => NEGATIVE_EMOTIONS.includes(e.coreEmotion));
      
      const avgPositiveIntensity = positiveEmotions.length > 0
        ? positiveEmotions.reduce((sum, e) => sum + e.intensity, 0) / positiveEmotions.length
        : 0;
      
      const avgNegativeIntensity = negativeEmotions.length > 0
        ? negativeEmotions.reduce((sum, e) => sum + e.intensity, 0) / negativeEmotions.length
        : 0;
      
      const netIntensity = avgPositiveIntensity - avgNegativeIntensity;
      const isFuture = day > today;
      
      return {
        fullDate: format(day, "MMM d"),
        dayName: format(day, "EEE"),
        positiveIntensity: avgPositiveIntensity,
        negativeIntensity: avgNegativeIntensity,
        netIntensity,
        count: dayEmotions.length,
        isFuture,
      };
    });
  };

  // Calculate time of day patterns
  const getTimePatterns = () => {
    const timeSlots = {
      "Morning (6-12)": 0,
      "Afternoon (12-18)": 0,
      "Evening (18-24)": 0,
      "Night (0-6)": 0,
    };
    
    emotions.forEach(e => {
      const hour = new Date(e.createdAt).getHours();
      if (hour >= 6 && hour < 12) timeSlots["Morning (6-12)"]++;
      else if (hour >= 12 && hour < 18) timeSlots["Afternoon (12-18)"]++;
      else if (hour >= 18 && hour < 24) timeSlots["Evening (18-24)"]++;
      else timeSlots["Night (0-6)"]++;
    });
    
    return Object.entries(timeSlots).map(([time, count]) => ({
      time,
      count,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 bg-white/60 backdrop-blur border border-slate-100 rounded-3xl shadow-sm">
        <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (emotions.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur rounded-3xl border border-slate-100 shadow-sm py-16 text-center px-6">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarIcon className="h-8 w-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">Begin Tracking</h3>
        <p className="text-slate-500 max-w-sm mx-auto text-sm">No emotion data found. Please log some of your current emotions to generate high-fidelity insights.</p>
      </div>
    );
  }

  const insightCardClass = "bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden hover:shadow-md hover:border-purple-200/60 transition-all duration-300";

  return (
    <div className="space-y-6">
      {/* Mood Trends Chart */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Mood Trends</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">Daily snapshot of positive and negative intensity scores</p>
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
            <LineChart data={getMoodTrends()} margin={{ left: -10, right: 10, bottom: 5, top: 10 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 10]} 
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
                      <div className="bg-white/95 backdrop-blur-md p-3 border border-purple-100 rounded-xl shadow-xl">
                        <p className="font-bold text-slate-800 text-xs mb-1.5">{data.date}</p>
                        <div className="space-y-1 text-[11px] font-semibold">
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-emerald-600">Positive Intensity:</span>
                            <span className="text-slate-800 font-extrabold">{data.positiveIntensity}</span>
                          </div>
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-rose-600">Negative Intensity:</span>
                            <span className="text-slate-800 font-extrabold">{data.negativeIntensity}</span>
                          </div>
                          <div className="flex items-center gap-2 justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Tracked Entries:</span>
                            <span className="text-slate-800 font-extrabold">{data.count}</span>
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
                dataKey="positiveIntensity" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Positive Emotions"
                dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="negativeIntensity" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Negative Emotions"
                dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emotion Distribution */}
        <div className={insightCardClass}>
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <PieChartIcon className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Emotion Distribution</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">Breakdown of positive and negative emotions logged</p>
          </div>
          <div className="p-6 flex items-center justify-center min-h-[300px]">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={getEmotionDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {getEmotionDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-white/95 backdrop-blur-md py-1.5 px-3 border border-purple-50 rounded-xl shadow-lg text-xs font-semibold text-slate-800">
                          {data.name}: <span className="font-extrabold text-purple-700">{data.value}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time of Day Patterns */}
        <div className={insightCardClass}>
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Time Patterns</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">Which parts of the day you track your feelings most</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={getTimePatterns()} margin={{ left: -20, right: 10, bottom: 5, top: 15 }}>
                <defs>
                  <linearGradient id="barPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.95}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.95}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f8fafc" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(124, 58, 237, 0.05)', radius: [6, 6, 0, 0] } as any}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-md py-1.5 px-3 border border-purple-50 rounded-xl shadow-lg text-xs font-semibold text-slate-800">
                          {data.time}: <span className="font-extrabold text-purple-700">{data.count} records</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="url(#barPurple)" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Intensity Heatmap */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Weekly Intensity Calendar</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Visual net wellness scale based on positive vs negative entries logged</p>
        </div>
        <div className="p-6">
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3 mb-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
            {getIntensityHeatmap().map((day, i) => {
              const { positiveIntensity, negativeIntensity, netIntensity, count, fullDate, isFuture } = day;
              
              // Determine styles based on net intensity (positive - negative)
              let cellClass = "bg-slate-50 text-slate-300 border border-slate-100";
              
              if (isFuture) {
                cellClass = "border border-dashed border-slate-200 bg-slate-50/20 text-slate-300/40 opacity-40 cursor-not-allowed";
              } else if (count > 0) {
                if (netIntensity > 0) {
                  if (netIntensity <= 3) {
                    cellClass = "bg-emerald-50 text-emerald-800 border border-emerald-100 hover:border-emerald-300 shadow-sm";
                  } else if (netIntensity <= 6) {
                    cellClass = "bg-emerald-100 text-emerald-900 border border-emerald-200 hover:border-emerald-400 shadow-sm";
                  } else {
                    cellClass = "bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600 shadow-md shadow-emerald-100/50";
                  }
                } else if (netIntensity < 0) {
                  const absNet = Math.abs(netIntensity);
                  if (absNet <= 3) {
                    cellClass = "bg-rose-50 text-rose-800 border border-rose-100 hover:border-rose-300 shadow-sm";
                  } else if (absNet <= 6) {
                    cellClass = "bg-rose-100 text-rose-900 border border-rose-200 hover:border-rose-400 shadow-sm";
                  } else {
                    cellClass = "bg-rose-500 text-white border border-rose-600 hover:bg-rose-600 shadow-md shadow-rose-100/50";
                  }
                } else {
                  cellClass = "bg-amber-100 text-amber-900 border border-amber-200 hover:border-amber-400 shadow-sm";
                }
              } else {
                cellClass = "bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-200";
              }
              
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-2xl ${cellClass} flex flex-col items-center justify-center text-[10px] sm:text-xs font-semibold relative group p-1 transition-all duration-300 hover:scale-[1.06] hover:-translate-y-0.5 cursor-default`}
                >
                  <span className="text-[9px] opacity-75">{fullDate.split(' ')[1]}</span>
                  {!isFuture && count > 0 && (
                    <span className="text-[10px] font-extrabold mt-0.5">{count}</span>
                  )}
                  {!isFuture && (
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] rounded-xl px-2.5 py-1.5 whitespace-nowrap z-10 shadow-xl border border-slate-800 pointer-events-none transition-all duration-200 font-medium">
                      <p className="font-bold text-slate-200 mb-1 border-b border-slate-700/60 pb-0.5">{fullDate}</p>
                      <div className="space-y-0.5 text-slate-300">
                        <p>Positive Intensity: <span className="text-emerald-400 font-bold">{positiveIntensity.toFixed(1)}</span></p>
                        <p>Negative Intensity: <span className="text-rose-400 font-bold">{negativeIntensity.toFixed(1)}</span></p>
                        <p>Total Entries: <span className="text-white font-bold">{count}</span></p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-500 font-semibold flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-slate-50 border border-slate-100 rounded-md" />
              <span>Unlogged</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-100 rounded-md" />
              <span>Low Positive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-emerald-500 rounded-md shadow-sm" />
              <span>High Positive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-amber-100 border border-amber-200 rounded-md" />
              <span>Balanced</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-rose-50 border border-rose-100 rounded-md" />
              <span>Low Negative</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-rose-500 rounded-md shadow-sm" />
              <span>High Negative</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
