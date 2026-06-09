import { useState } from "react";
import type { Goal, Milestone } from "@/features/goals/types";
import { useGoals, useAllMilestones } from "@/features/goals/hooks/useGoals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, Award, BarChart3, CheckCircle, Clock, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, subYears, eachDayOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, endOfMonth, isWithinInterval } from "date-fns";
import { useLocalization } from "@/lib/localize";

interface GoalInsightsProps {
  userId: number;
}

const STATUS_COLORS = {
  completed: "#10b981", // Emerald
  in_progress: "#f59e0b", // Amber
  pending: "#6366f1", // Indigo
};

export default function GoalInsights({ userId }: GoalInsightsProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const { t, tNum } = useLocalization();

  const { data: goals = [], isLoading } = useGoals(`/api/users/${userId}`, userId);

  const { data: allMilestones = [] } = useAllMilestones(
    `/api/users/${userId}`,
    userId,
    goals.length,
  );

  // Calculate completion rate
  const getCompletionRate = () => {
    const total = goals.length;
    const completed = goals.filter((g: Goal) => g.status === 'completed').length;
    const inProgress = goals.filter((g: Goal) => g.status === 'in_progress').length;
    const pending = goals.filter((g: Goal) => g.status === 'pending').length;
    
    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  };

  // Calculate status distribution
  const getStatusDistribution = () => {
    const stats = getCompletionRate();
    
    return [
      { name: t('Completed'), value: stats.completed, color: STATUS_COLORS.completed },
      { name: t('In Progress'), value: stats.inProgress, color: STATUS_COLORS.in_progress },
      { name: t('Pending'), value: stats.pending, color: STATUS_COLORS.pending },
    ].filter(item => item.value > 0);
  };

  // Calculate milestone completion count
  const getMilestoneStats = () => {
    const completedMilestones = allMilestones.filter((m: Milestone) => m.isCompleted);
    const pendingMilestones = allMilestones.filter((m: Milestone) => !m.isCompleted);
    
    return {
      totalCompleted: completedMilestones.length,
      totalPending: pendingMilestones.length,
      total: allMilestones.length,
    };
  };

  // Calculate goal progress over time
  const getProgressTrends = () => {
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
        
        const totalGoals = goals.filter((g: Goal) =>
          new Date(g.createdAt) <= monthEnd
        ).length;

        const completedGoals = goals.filter((g: Goal) =>
          g.status === 'completed' && new Date(g.createdAt) <= monthEnd
        ).length;
        
        return {
          date: format(monthStart, "MMM"),
          total: totalGoals,
          completed: completedGoals,
          completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
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
        
        const totalGoals = goals.filter((g: Goal) =>
          new Date(g.createdAt) <= weekEnd
        ).length;

        const completedGoals = goals.filter((g: Goal) =>
          g.status === 'completed' && new Date(g.createdAt) <= weekEnd
        ).length;
        
        return {
          date: `${t('Week')} ${index + 1}`,
          total: totalGoals,
          completed: completedGoals,
          completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
        };
      });
    }

    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const totalGoals = goals.filter((g: Goal) =>
        new Date(g.createdAt) <= day
      ).length;

      const completedGoals = goals.filter((g: Goal) =>
        g.status === 'completed' && new Date(g.createdAt) <= day
      ).length;
      
      return {
        date: format(day, "EEE"),
        total: totalGoals,
        completed: completedGoals,
        completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
      };
    });
  };

  // Calculate milestone completion calendar
  const getMilestoneCalendar = () => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayMilestones = allMilestones.filter((m: Milestone) =>
        m.isCompleted && format(new Date(m.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      return {
        date: format(day, "MMM d"),
        count: dayMilestones.length,
      };
    });
  };

  // Calculate timeline analysis
  const getTimelineAnalysis = () => {
    const goalsWithDeadline = goals.filter((g: Goal) => g.deadline);

    const onTime = goalsWithDeadline.filter((g: Goal) => {
      if (g.status !== 'completed') return false;
      return new Date(g.updatedAt || g.createdAt) <= new Date(g.deadline!);
    }).length;

    const late = goalsWithDeadline.filter((g: Goal) => {
      if (g.status !== 'completed') return false;
      return new Date(g.updatedAt || g.createdAt) > new Date(g.deadline!);
    }).length;
    
    return [
      { name: t('On Time'), value: onTime, color: '#10b981' },
      { name: t('Late'), value: late, color: '#ef4444' },
    ].filter(item => item.value > 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 bg-white/60 backdrop-blur border border-slate-100 rounded-3xl shadow-sm">
        <div className="animate-spin h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur rounded-3xl border border-slate-100 shadow-sm py-16 text-center px-6">
        <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="h-8 w-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">{t("SMART Goals Tracker")}</h3>
        <p className="text-slate-500 max-w-sm mx-auto text-sm">{t("No structured goals recorded yet. Begin setting SMART goals and key milestones to unlock visual trackers.")}</p>
      </div>
    );
  }

  const stats = getCompletionRate();
  const milestoneStats = getMilestoneStats();
  const insightCardClass = "bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden hover:shadow-md hover:border-teal-200/60 transition-all duration-300";

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-emerald-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Completion")}</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{tNum(stats.completionRate.toFixed(1))}%</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {tNum(stats.completed)} {t("of")} {tNum(stats.total)} {t("goals")}
            </p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-amber-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Active Goals")}</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{tNum(stats.inProgress)}</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{t("Currently working")}</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-blue-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">{t("Achieved Milestones")}</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{tNum(milestoneStats.totalCompleted)}</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{t("Steps completed")}</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-teal-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-teal-50 text-teal-700">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Remaining Tasks")}</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{tNum(milestoneStats.totalPending)}</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{t("Pending milestones")}</p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goal Status Distribution */}
        <div className={insightCardClass}>
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Target className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{t("Goal Status Distribution")}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("Breakdown of active, pending, and completed SMART goals")}</p>
          </div>
          <div className="p-6 flex items-center justify-center min-h-[260px]">
            {getStatusDistribution().length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getStatusDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${tNum((percent * 100).toFixed(0))}%`}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {getStatusDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="bg-white/95 backdrop-blur-md py-1.5 px-3 border border-purple-50 rounded-xl shadow-lg text-xs font-semibold text-slate-800">
                            {data.name}: <span className="font-extrabold text-indigo-600">{tNum(data.value as number)} {t("goals")}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                <AlertCircle className="h-6 w-6 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-semibold">{t("No status data available.")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Performance */}
        <div className={insightCardClass}>
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Award className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{t("Timeline Performance")}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("Review of completed goals completed relative to targets")}</p>
          </div>
          <div className="p-6 flex items-center justify-center min-h-[260px]">
            {getTimelineAnalysis().length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getTimelineAnalysis()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${tNum((percent * 100).toFixed(0))}%`}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {getTimelineAnalysis().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="bg-white/95 backdrop-blur-md py-1.5 px-3 border border-purple-50 rounded-xl shadow-lg text-xs font-semibold text-slate-800">
                            {data.name}: <span className="font-extrabold text-slate-700">{tNum(data.value as number)} {t("goals")}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                <AlertCircle className="h-6 w-6 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-semibold max-w-[200px]">{t("Goals must be completed with specified deadlines to analyze target shifts.")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Trends Over Time */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{t("Progress Trends")}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("Review net goals created vs absolute completions")}</p>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "week" | "month" | "year")} className="w-auto">
            <TabsList className="bg-slate-100 p-0.5 rounded-xl h-auto">
              <TabsTrigger value="week" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Week")}</TabsTrigger>
              <TabsTrigger value="month" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Month")}</TabsTrigger>
              <TabsTrigger value="year" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Year")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="p-6 overflow-visible">
          <ResponsiveContainer width="100%" height={300}>
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
                      <div className="bg-white/95 backdrop-blur-md p-3 border border-teal-100 rounded-xl shadow-xl">
                        <p className="font-bold text-slate-800 text-xs mb-1.5">{data.date}</p>
                        <div className="space-y-1 text-[11px] font-semibold">
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-teal-700">{t("Total Goals:")}</span>
                            <span className="text-slate-800 font-extrabold">{tNum(data.total)}</span>
                          </div>
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-emerald-600">{t("Completed:")}</span>
                            <span className="text-slate-800 font-extrabold">{tNum(data.completed)}</span>
                          </div>
                          <div className="flex items-center gap-2 justify-between pt-1 border-t border-slate-100">
                            <span className="text-indigo-600">{t("Completion Rate:")}</span>
                            <span className="text-slate-800 font-extrabold">{tNum(data.completionRate.toFixed(1))}%</span>
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
                stroke="#6366f1" 
                strokeWidth={3}
                name={t("Total SMART Goals")}
                dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#10b981" 
                strokeWidth={3}
                name={t("Completed Goals")}
                dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 30-Day Milestone Calendar */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{t("30-Day Milestone Activity")}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t("Calendar tracing of sub-tasks and milestones achieved over the past month")}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-10 gap-2">
            {getMilestoneCalendar().map((day, i) => {
              const count = day.count;
              
              let cellClass = "bg-slate-50 text-slate-300 border border-slate-100/50";
              if (count === 1) {
                cellClass = "bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm";
              } else if (count === 2) {
                cellClass = "bg-indigo-100 border border-indigo-200 text-indigo-800 shadow-sm";
              } else if (count >= 3) {
                cellClass = "bg-indigo-600 text-white border border-indigo-700 shadow-md shadow-indigo-100/40";
              }
              
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-xl ${cellClass} flex items-center justify-center text-[10px] font-bold relative group transition-all duration-300 hover:scale-105 cursor-default`}
                >
                  <span className="opacity-80">{tNum(day.date.split(' ')[1])}</span>
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] rounded-xl px-2.5 py-1.5 whitespace-nowrap z-10 shadow-xl border border-slate-800 pointer-events-none transition-all duration-200 font-medium">
                    {day.date}: {tNum(count)} {count === 1 ? t('milestone') : t('milestones')} {t('achieved')}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-500 font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-slate-50 border border-slate-100 rounded-md" />
              <span>{t("None")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-indigo-50 border border-indigo-100 rounded-md" />
              <span>{tNum(1)} {t("Milestone")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-indigo-100 border border-indigo-200 rounded-md" />
              <span>{tNum(2)} {t("Milestones")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-indigo-600 rounded-md shadow-sm" />
              <span>{tNum("3+")} {t("Milestones")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
