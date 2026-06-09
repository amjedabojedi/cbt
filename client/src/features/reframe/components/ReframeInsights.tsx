import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, BarChart3, Calendar as CalendarIcon, Target, Award, CheckCircle, Zap, AlertCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, eachDayOfInterval, eachMonthOfInterval, subDays, subYears, startOfWeek, endOfWeek, endOfMonth, isWithinInterval } from "date-fns";
import { ar } from "date-fns/locale";
import { useLocalization } from "@/lib/localize.tsx";
import { formatDistortionLabel } from "@/features/reframe/utils/reframeLabels";

interface ReframeInsightsProps {
  userId: number;
}

export default function ReframeInsights({ userId }: ReframeInsightsProps) {
  const { t, tNum, isRTL } = useLocalization();
  const dateLocale = isRTL ? ar : undefined;
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  // Fetch practice results
  const { data: results = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/reframe-coach/results`],
    enabled: !!userId,
  });

  // Calculate key metrics
  const getKeyMetrics = () => {
    if (results.length === 0) return { totalSessions: 0, avgScore: 0, avgAccuracy: 0, currentStreak: 0 };

    const totalSessions = results.length;
    const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
    const totalCorrect = results.reduce((sum, r) => sum + (r.correctAnswers || r.correctCount || 0), 0);
    const totalQuestions = results.reduce((sum, r) => sum + (r.totalQuestions || r.totalCount || 1), 0);
    const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Calculate current streak
    const sortedDates = results
      .map(r => format(new Date(r.createdAt), "yyyy-MM-dd"))
      .sort()
      .reverse();
    
    let streak = 0;
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    
    if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
      const uniqueDates = Array.from(new Set(sortedDates));
      for (let i = 0; i < uniqueDates.length; i++) {
        const checkDate = format(subDays(new Date(), i), "yyyy-MM-dd");
        if (uniqueDates.includes(checkDate)) {
          streak++;
        } else {
          break;
        }
      }
    }

    return {
      totalSessions,
      avgScore: parseFloat(avgScore.toFixed(1)),
      avgAccuracy: parseFloat(avgAccuracy.toFixed(1)),
      currentStreak: streak,
    };
  };

  // Calculate score trends over time
  const getScoreTrends = () => {
    let startDate: Date;
    
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
    } else {
      startDate = subYears(new Date(), 1);
    }

    if (timeRange === "year") {
      const months = eachMonthOfInterval({ start: startDate, end: new Date() });
      
      return months.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthResults = results.filter(r => {
          const resultDate = new Date(r.createdAt);
          return isWithinInterval(resultDate, { start: monthStart, end: monthEnd });
        });
        
        const avgScore = monthResults.length > 0
          ? monthResults.reduce((sum, r) => sum + (r.score || 0), 0) / monthResults.length
          : 0;
        
        return {
          date: format(monthStart, "MMM", { locale: dateLocale }),
          score: parseFloat(avgScore.toFixed(2)),
          sessions: monthResults.length,
        };
      });
    }

    if (timeRange === "month") {
      const today = new Date();
      const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
      
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const weekMonday = subDays(currentWeekMonday, i * 7);
        weeks.push(weekMonday);
      }
      
      return weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekResults = results.filter(r => {
          const resultDate = new Date(r.createdAt);
          return resultDate >= weekStart && resultDate <= weekEnd;
        });
        
        const avgScore = weekResults.length > 0
          ? weekResults.reduce((sum, r) => sum + (r.score || 0), 0) / weekResults.length
          : 0;
        
        return {
          date: `${t("Week")} ${tNum(index + 1)}`,
          score: parseFloat(avgScore.toFixed(2)),
          sessions: weekResults.length,
        };
      });
    }

    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayResults = results.filter(r => 
        format(new Date(r.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      const avgScore = dayResults.length > 0
        ? dayResults.reduce((sum, r) => sum + (r.score || 0), 0) / dayResults.length
        : 0;
      
      return {
        date: format(day, "EEE", { locale: dateLocale }),
        score: parseFloat(avgScore.toFixed(2)),
        sessions: dayResults.length,
      };
    });
  };

  // Calculate accuracy trends over time
  const getAccuracyTrends = () => {
    let startDate: Date;
    
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
    } else {
      startDate = subYears(new Date(), 1);
    }

    if (timeRange === "year") {
      const months = eachMonthOfInterval({ start: startDate, end: new Date() });
      
      return months.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthResults = results.filter(r => {
          const resultDate = new Date(r.createdAt);
          return isWithinInterval(resultDate, { start: monthStart, end: monthEnd });
        });
        
        if (monthResults.length === 0) {
          return {
            date: format(monthStart, "MMM", { locale: dateLocale }),
            accuracy: 0,
            sessions: 0,
          };
        }

        const totalCorrect = monthResults.reduce((sum, r) => sum + (r.correctAnswers || r.correctCount || 0), 0);
        const totalQuestions = monthResults.reduce((sum, r) => sum + (r.totalQuestions || r.totalCount || 1), 0);
        const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        
        return {
          date: format(monthStart, "MMM", { locale: dateLocale }),
          accuracy: parseFloat(accuracy.toFixed(1)),
          sessions: monthResults.length,
        };
      });
    }

    if (timeRange === "month") {
      const today = new Date();
      const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
      
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const weekMonday = subDays(currentWeekMonday, i * 7);
        weeks.push(weekMonday);
      }
      
      return weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekResults = results.filter(r => {
          const resultDate = new Date(r.createdAt);
          return resultDate >= weekStart && resultDate <= weekEnd;
        });
        
        if (weekResults.length === 0) {
          return {
            date: `${t("Week")} ${tNum(index + 1)}`,
            accuracy: 0,
            sessions: 0,
          };
        }

        const totalCorrect = weekResults.reduce((sum, r) => sum + (r.correctAnswers || r.correctCount || 0), 0);
        const totalQuestions = weekResults.reduce((sum, r) => sum + (r.totalQuestions || r.totalCount || 1), 0);
        const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        
        return {
          date: `${t("Week")} ${tNum(index + 1)}`,
          accuracy: parseFloat(accuracy.toFixed(1)),
          sessions: weekResults.length,
        };
      });
    }

    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayResults = results.filter(r => 
        format(new Date(r.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      if (dayResults.length === 0) {
        return {
          date: format(day, "EEE", { locale: dateLocale }),
          accuracy: 0,
          sessions: 0,
        };
      }

      const totalCorrect = dayResults.reduce((sum, r) => sum + (r.correctAnswers || r.correctCount || 0), 0);
      const totalQuestions = dayResults.reduce((sum, r) => sum + (r.totalQuestions || r.totalCount || 1), 0);
      const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
      
      return {
        date: format(day, "EEE", { locale: dateLocale }),
        accuracy: parseFloat(accuracy.toFixed(1)),
        sessions: dayResults.length,
      };
    });
  };

  // Calculate cognitive distortions practiced
  const getDistortionsPracticed = () => {
    const distortionCounts: Record<string, number> = {};
    
    results.forEach(result => {
      if (result.scenarioData && Array.isArray(result.scenarioData)) {
        result.scenarioData.forEach((scenario: any) => {
          if (scenario.cognitiveDistortion) {
            const raw = String(scenario.cognitiveDistortion);
            distortionCounts[raw] = (distortionCounts[raw] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(distortionCounts)
      .map(([raw, count]) => ({
        raw,
        name: formatDistortionLabel(raw, t),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  // Calculate 30-day practice calendar
  const getPracticeCalendar = () => {
    const last30Days = eachDayOfInterval({ 
      start: subDays(new Date(), 29), 
      end: new Date() 
    });
    
    return last30Days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayResults = results.filter(r => 
        format(new Date(r.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      const avgScore = dayResults.length > 0
        ? dayResults.reduce((sum, r) => sum + (r.score || 0), 0) / dayResults.length
        : 0;
      
      return {
        date: format(day, "MMM d", { locale: dateLocale }),
        dayNum: format(day, "d", { locale: dateLocale }),
        score: avgScore,
        sessions: dayResults.length,
      };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 bg-white/60 backdrop-blur border border-slate-100 rounded-3xl shadow-sm" dir={isRTL ? "rtl" : "ltr"}>
        <div className="animate-spin h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur rounded-3xl border border-slate-100 shadow-sm py-16 text-center px-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="h-8 w-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">{t("Reframe Training")}</h3>
        <p className="text-slate-500 max-w-sm mx-auto text-sm">
          {t("No reframing training scenarios completed yet. Complete a practice module with the Reframe Coach to activate analytics.")}
        </p>
      </div>
    );
  }

  const metrics = getKeyMetrics();
  const distortionsData = getDistortionsPracticed();
  const calendarData = getPracticeCalendar();
  const insightCardClass = "bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden hover:shadow-md hover:border-teal-200/60 transition-all duration-300";

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-teal-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-teal-50 text-teal-700">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Total Sessions")}</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{tNum(metrics.totalSessions)}</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{t("Trainings completed")}</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-indigo-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Avg Score")}</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{tNum(metrics.avgScore)}</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{t("Points per module")}</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-emerald-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Accuracy")}</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{tNum(metrics.avgAccuracy)}%</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{t("Correct selections")}</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-fuchsia-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-fuchsia-50 text-fuchsia-600">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Current Streak")}</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{tNum(metrics.currentStreak)}</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{t("Days in a row")}</p>
          </div>
        </div>
      </div>

      {/* Score Trends Chart */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{t("Score Trends")}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("Timeline tracing points and score parameters achieved per session")}</p>
          </div>
          <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-auto">
            <TabsList className="bg-slate-100 p-0.5 rounded-xl h-auto">
              <TabsTrigger value="week" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Week")}</TabsTrigger>
              <TabsTrigger value="month" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Month")}</TabsTrigger>
              <TabsTrigger value="year" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Year")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="p-6 overflow-visible">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={getScoreTrends()} margin={{ left: -20, right: 10, bottom: 5, top: 10 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 1]} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => tNum(v)}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-md p-3 border border-teal-100 rounded-xl shadow-xl" dir={isRTL ? "rtl" : "ltr"}>
                        <p className="font-bold text-slate-800 text-xs mb-1.5">{data.date}</p>
                        <div className="space-y-1 text-[11px] font-semibold">
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-teal-700">{t("Average Score:")}</span>
                            <span className="text-slate-800 font-extrabold">{tNum(data.score)}</span>
                          </div>
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-slate-500">{t("Completed Sessions:")}</span>
                            <span className="text-slate-800 font-extrabold">{tNum(data.sessions)}</span>
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
                dataKey="score" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name={t("Score Achievement")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accuracy Trends Chart */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Target className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{t("Accuracy Trends")}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t("Accuracy rate timeline showing percentage of correct scenario selections")}</p>
        </div>
        <div className="p-6 overflow-visible">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={getAccuracyTrends()} margin={{ left: -20, right: 10, bottom: 5, top: 10 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => tNum(v)}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-md p-3 border border-teal-100 rounded-xl shadow-xl" dir={isRTL ? "rtl" : "ltr"}>
                        <p className="font-bold text-slate-800 text-xs mb-1.5">{data.date}</p>
                        <div className="space-y-1 text-[11px] font-semibold">
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-emerald-600">{t("Accuracy Rate:")}</span>
                            <span className="text-slate-800 font-extrabold">{tNum(data.accuracy)}%</span>
                          </div>
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-slate-500">{t("Completed Sessions:")}</span>
                            <span className="text-slate-800 font-extrabold">{tNum(data.sessions)}</span>
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
                dataKey="accuracy" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name={t("Accuracy Rate %")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distortions Practiced Chart */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{t("Cognitive Distortions Reframed")}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t("Review of which unhelpful cognitive thinking styles were practiced most")}</p>
        </div>
        <div className="p-6">
          {distortionsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart 
                data={distortionsData} 
                layout="vertical"
                margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="barIndigo" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.95}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.95}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => tNum(v)} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(79, 70, 229, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as { name?: string; count?: number };
                      return (
                        <div className="bg-white/95 backdrop-blur-md py-1.5 px-3 border border-indigo-50 rounded-xl shadow-lg text-xs font-semibold text-slate-800" dir={isRTL ? "rtl" : "ltr"}>
                          {data.name}: <span className="font-extrabold text-indigo-600">{tNum(data.count ?? 0)} {t("scenarios solved")}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="url(#barIndigo)" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <AlertCircle className="h-6 w-6 text-slate-300 mb-2" />
              <p className="text-xs text-slate-400 font-semibold">{t("No scenario data available.")}</p>
            </div>
          )}
        </div>
      </div>

      {/* 30-Day Practice Calendar */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-fuchsia-50 text-fuchsia-600">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{t("30-Day Practice Calendar")}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t("Calendar tracking tracing reframing consistency and training frequency")}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-10 gap-2">
            {calendarData.map((day, idx) => {
              const score = day.score;
              let cellClass = "bg-slate-50 text-slate-300 border border-slate-100/50";
              
              if (day.sessions > 0) {
                if (score < 0.3) {
                  cellClass = "bg-teal-50 border border-teal-100 text-teal-700 shadow-sm";
                } else if (score < 0.6) {
                  cellClass = "bg-teal-100 border border-teal-200 text-teal-800 shadow-sm";
                } else if (score < 0.85) {
                  cellClass = "bg-purple-300 border border-purple-400 text-teal-700 shadow-sm";
                } else {
                  cellClass = "bg-teal-600 text-white border border-teal-700 shadow-md shadow-teal-100/40";
                }
              }

              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl ${cellClass} flex items-center justify-center text-[10px] font-bold relative group transition-all duration-300 hover:scale-105 cursor-default`}
                >
                  <span className="opacity-80">{day.dayNum}</span>
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] rounded-xl px-2.5 py-1.5 whitespace-nowrap z-10 shadow-xl border border-slate-800 pointer-events-none transition-all duration-200 font-medium" dir={isRTL ? "rtl" : "ltr"}>
                    <p className="font-bold text-slate-200 mb-1 border-b border-slate-700/60 pb-0.5">{day.date}</p>
                    <div className="space-y-0.5 text-slate-300">
                      <p>{t("Completed:")} <span className="text-white font-bold">{tNum(day.sessions)} {t("sessions")}</span></p>
                      {day.sessions > 0 && (
                        <p>{t("Average Score:")} <span className="text-teal-100 font-bold">{tNum(score.toFixed(2))}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-6 text-xs text-slate-500 font-semibold">
            <span>{t("Inactive")}</span>
            <div className="flex gap-1.5">
              <div className="w-3.5 h-3.5 bg-slate-50 border border-slate-100/50 rounded-md" />
              <div className="w-3.5 h-3.5 bg-teal-50 border border-teal-100 rounded-md" />
              <div className="w-3.5 h-3.5 bg-teal-100 border border-teal-200 rounded-md" />
              <div className="w-3.5 h-3.5 bg-purple-300 border border-purple-400 rounded-md" />
              <div className="w-3.5 h-3.5 bg-teal-600 rounded-md shadow-sm" />
            </div>
            <span>{t("High Performance")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
