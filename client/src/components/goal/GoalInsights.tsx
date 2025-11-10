import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, Award, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, subYears, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from "date-fns";

interface GoalInsightsProps {
  userId: number;
}

const STATUS_COLORS = {
  completed: "#22c55e",
  in_progress: "#eab308",
  pending: "#94a3b8",
};

export default function GoalInsights({ userId }: GoalInsightsProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  // Fetch goals
  const { data: goals = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/goals`],
    enabled: !!userId,
  });

  // Fetch all milestones for all goals
  const { data: allMilestones = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/goals/milestones`],
    enabled: !!userId && goals.length > 0,
    queryFn: async () => {
      const milestonePromises = goals.map(async (goal) => {
        const response = await fetch(`/api/goals/${goal.id}/milestones`);
        const milestones = await response.json();
        return milestones.map((m: any) => ({ ...m, goalId: goal.id }));
      });
      const results = await Promise.all(milestonePromises);
      return results.flat();
    },
  });

  // Calculate completion rate
  const getCompletionRate = () => {
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const inProgress = goals.filter(g => g.status === 'in_progress').length;
    const pending = goals.filter(g => g.status === 'pending').length;
    
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
      { name: 'Completed', value: stats.completed, color: STATUS_COLORS.completed },
      { name: 'In Progress', value: stats.inProgress, color: STATUS_COLORS.in_progress },
      { name: 'Pending', value: stats.pending, color: STATUS_COLORS.pending },
    ].filter(item => item.value > 0);
  };

  // Calculate milestone completion count
  const getMilestoneStats = () => {
    const completedMilestones = allMilestones.filter(m => m.isCompleted);
    const pendingMilestones = allMilestones.filter(m => !m.isCompleted);
    
    return {
      totalCompleted: completedMilestones.length,
      totalPending: pendingMilestones.length,
      total: allMilestones.length,
    };
  };

  // Calculate goal progress over time with unified labeling
  const getProgressTrends = () => {
    let startDate: Date;
    
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
    } else {
      // year view
      startDate = subYears(new Date(), 1);
    }

    // For year view, group by months
    if (timeRange === "year") {
      const months = eachMonthOfInterval(
        { start: startDate, end: new Date() }
      );
      
      return months.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        
        // Count goals created up to the end of this month
        const totalGoals = goals.filter(g => 
          new Date(g.createdAt) <= monthEnd
        ).length;
        
        // Count completed goals up to the end of this month
        const completedGoals = goals.filter(g => 
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

    // For month view, group by weeks
    if (timeRange === "month") {
      const weeks = eachWeekOfInterval(
        { start: startDate, end: new Date() },
        { weekStartsOn: 0 }
      );
      
      return weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
        
        // Count goals created up to the end of this week
        const totalGoals = goals.filter(g => 
          new Date(g.createdAt) <= weekEnd
        ).length;
        
        // Count completed goals up to the end of this week
        const completedGoals = goals.filter(g => 
          g.status === 'completed' && new Date(g.createdAt) <= weekEnd
        ).length;
        
        return {
          date: `Week ${index + 1}`,
          total: totalGoals,
          completed: completedGoals,
          completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
        };
      });
    }

    // For week view, use daily grouping with day names
    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      
      // Count goals created up to this day
      const totalGoals = goals.filter(g => 
        new Date(g.createdAt) <= day
      ).length;
      
      // Count completed goals up to this day
      const completedGoals = goals.filter(g => 
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
      const dayMilestones = allMilestones.filter(m => 
        m.isCompleted && format(new Date(m.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      return {
        date: format(day, "MMM d"),
        count: dayMilestones.length,
      };
    });
  };

  // Calculate SMART completion patterns
  const getSMARTPatterns = () => {
    const completedGoals = goals.filter(g => g.status === 'completed');
    const incompleteGoals = goals.filter(g => g.status !== 'completed');
    
    return [
      {
        category: 'Completed Goals',
        count: completedGoals.length,
        avgFields: completedGoals.length > 0 ? 5 : 0, // All SMART goals have 5 fields
      },
      {
        category: 'Incomplete Goals',
        count: incompleteGoals.length,
        avgFields: incompleteGoals.length > 0 ? 5 : 0,
      },
    ];
  };

  // Calculate timeline analysis
  const getTimelineAnalysis = () => {
    const goalsWithDeadline = goals.filter(g => g.deadline);
    
    const onTime = goalsWithDeadline.filter(g => {
      if (g.status !== 'completed') return false;
      return new Date(g.updatedAt || g.createdAt) <= new Date(g.deadline);
    }).length;
    
    const late = goalsWithDeadline.filter(g => {
      if (g.status !== 'completed') return false;
      return new Date(g.updatedAt || g.createdAt) > new Date(g.deadline);
    }).length;
    
    return [
      { name: 'On Time', value: onTime, color: '#22c55e' },
      { name: 'Late', value: late, color: '#ef4444' },
    ].filter(item => item.value > 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No goals yet. Start setting goals to see insights!</p>
        </CardContent>
      </Card>
    );
  }

  const stats = getCompletionRate();
  const milestoneStats = getMilestoneStats();

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completed} of {stats.total} goals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Milestones Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{milestoneStats.totalCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">Total achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{milestoneStats.totalPending}</div>
            <p className="text-xs text-muted-foreground mt-1">Still in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goal Status Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Goal Status Distribution</CardTitle>
            </div>
            <CardDescription>Breakdown of your goal statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {getStatusDistribution().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getStatusDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getStatusDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>Timeline Performance</CardTitle>
            </div>
            <CardDescription>Goals completed on time vs late</CardDescription>
          </CardHeader>
          <CardContent>
            {getTimelineAnalysis().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getTimelineAnalysis()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getTimelineAnalysis().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No deadline data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Trends Over Time */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Progress Trends</CardTitle>
            </div>
            <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-auto">
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardDescription>Your goal completion progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getProgressTrends()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Total Goals"
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 30-Day Milestone Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>30-Day Milestone Activity</CardTitle>
          </div>
          <CardDescription>Milestones completed in the past month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1">
            {getMilestoneCalendar().map((day, i) => {
              const count = day.count;
              const bgColor = 
                count === 0 ? "bg-gray-100 dark:bg-gray-800" :
                count === 1 ? "bg-blue-200 dark:bg-blue-900" :
                count === 2 ? "bg-blue-400 dark:bg-blue-700" :
                "bg-blue-600 dark:bg-blue-500";
              
              return (
                <div
                  key={i}
                  className={`aspect-square rounded ${bgColor} flex items-center justify-center text-xs font-medium relative group`}
                  title={`${day.date}: ${count} milestones`}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {day.date}: {count} {count === 1 ? 'milestone' : 'milestones'}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
              <span>None</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-200 dark:bg-blue-900 rounded" />
              <span>1</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 dark:bg-blue-700 rounded" />
              <span>2</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded" />
              <span>3+</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
