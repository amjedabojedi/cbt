import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, BarChart3, Calendar as CalendarIcon, Target } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface ReframeInsightsProps {
  userId: number;
}

export default function ReframeInsights({ userId }: ReframeInsightsProps) {
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

    // Calculate current streak (consecutive days with practice)
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

  // Calculate score trends over time with unified labeling
  const getScoreTrends = () => {
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
        
        const monthResults = results.filter(r => {
          const resultDate = new Date(r.createdAt);
          return isWithinInterval(resultDate, { start: monthStart, end: monthEnd });
        });
        
        const avgScore = monthResults.length > 0
          ? monthResults.reduce((sum, r) => sum + (r.score || 0), 0) / monthResults.length
          : 0;
        
        return {
          date: format(monthStart, "MMM"),
          score: parseFloat(avgScore.toFixed(1)),
          sessions: monthResults.length,
        };
      });
    }

    // For month view, group by weeks (exactly 4 weeks)
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
          date: `Week ${index + 1}`,
          score: parseFloat(avgScore.toFixed(1)),
          sessions: weekResults.length,
        };
      });
    }

    // For week view, use daily grouping with day names
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
        date: format(day, "EEE"),
        score: parseFloat(avgScore.toFixed(1)),
        sessions: dayResults.length,
      };
    });
  };

  // Calculate accuracy trends over time with unified labeling
  const getAccuracyTrends = () => {
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
        
        const monthResults = results.filter(r => {
          const resultDate = new Date(r.createdAt);
          return isWithinInterval(resultDate, { start: monthStart, end: monthEnd });
        });
        
        if (monthResults.length === 0) {
          return {
            date: format(monthStart, "MMM"),
            accuracy: 0,
            sessions: 0,
          };
        }

        const totalCorrect = monthResults.reduce((sum, r) => sum + (r.correctAnswers || r.correctCount || 0), 0);
        const totalQuestions = monthResults.reduce((sum, r) => sum + (r.totalQuestions || r.totalCount || 1), 0);
        const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        
        return {
          date: format(monthStart, "MMM"),
          accuracy: parseFloat(accuracy.toFixed(1)),
          sessions: monthResults.length,
        };
      });
    }

    // For month view, group by weeks (exactly 4 weeks)
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
            date: `Week ${index + 1}`,
            accuracy: 0,
            sessions: 0,
          };
        }

        const totalCorrect = weekResults.reduce((sum, r) => sum + (r.correctAnswers || r.correctCount || 0), 0);
        const totalQuestions = weekResults.reduce((sum, r) => sum + (r.totalQuestions || r.totalCount || 1), 0);
        const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        
        return {
          date: `Week ${index + 1}`,
          accuracy: parseFloat(accuracy.toFixed(1)),
          sessions: weekResults.length,
        };
      });
    }

    // For week view, use daily grouping with day names
    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayResults = results.filter(r => 
        format(new Date(r.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      if (dayResults.length === 0) {
        return {
          date: format(day, "EEE"),
          accuracy: 0,
          sessions: 0,
        };
      }

      const totalCorrect = dayResults.reduce((sum, r) => sum + (r.correctAnswers || r.correctCount || 0), 0);
      const totalQuestions = dayResults.reduce((sum, r) => sum + (r.totalQuestions || r.totalCount || 1), 0);
      const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
      
      return {
        date: format(day, "EEE"),
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
            const distortion = scenario.cognitiveDistortion
              .replace(/[-_]/g, ' ')
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            distortionCounts[distortion] = (distortionCounts[distortion] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(distortionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
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
        date: format(day, "MMM d"),
        score: avgScore,
        sessions: dayResults.length,
      };
    });
  };

  // Get intensity color for calendar heatmap
  const getIntensityColor = (score: number) => {
    if (score === 0) return "bg-muted";
    if (score < 0.3) return "bg-red-200 dark:bg-red-900";
    if (score < 0.5) return "bg-orange-200 dark:bg-orange-900";
    if (score < 0.7) return "bg-yellow-200 dark:bg-yellow-900";
    if (score < 0.9) return "bg-green-200 dark:bg-green-900";
    return "bg-emerald-400 dark:bg-emerald-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No practice data yet. Complete practice sessions to see insights!</p>
        </CardContent>
      </Card>
    );
  }

  const metrics = getKeyMetrics();
  const distortionsData = getDistortionsPracticed();
  const calendarData = getPracticeCalendar();

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{metrics.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">Practices completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.avgScore}</div>
            <p className="text-xs text-muted-foreground mt-1">Points per session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.avgAccuracy}%</div>
            <p className="text-xs text-muted-foreground mt-1">Correct answers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.currentStreak}</div>
            <p className="text-xs text-muted-foreground mt-1">Consecutive days</p>
          </CardContent>
        </Card>
      </div>

      {/* Score Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Score Trends</CardTitle>
            </div>
            <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-auto">
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardDescription>Practice scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getScoreTrends()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#10b981" 
                strokeWidth={2} 
                name="Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Accuracy Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Accuracy Trends</CardTitle>
          </div>
          <CardDescription>Answer accuracy over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getAccuracyTrends()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#8b5cf6" 
                strokeWidth={2} 
                name="Accuracy %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distortions Practiced Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Cognitive Distortions Practiced</CardTitle>
          </div>
          <CardDescription>Most frequently practiced thinking patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {distortionsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distortionsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Times Practiced" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No distortion data available</p>
          )}
        </CardContent>
      </Card>

      {/* 30-Day Practice Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <CardTitle>30-Day Practice Calendar</CardTitle>
          </div>
          <CardDescription>Your practice frequency and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1">
            {calendarData.map((day, idx) => (
              <div
                key={idx}
                className={`aspect-square rounded-sm ${getIntensityColor(day.score)} 
                  transition-colors hover:ring-2 hover:ring-primary cursor-pointer`}
                title={`${day.date}: ${day.sessions} session${day.sessions !== 1 ? 's' : ''}, Score: ${day.score.toFixed(2)}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>Less practice</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-muted rounded-sm" />
              <div className="w-3 h-3 bg-red-200 dark:bg-red-900 rounded-sm" />
              <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-900 rounded-sm" />
              <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded-sm" />
              <div className="w-3 h-3 bg-emerald-400 dark:bg-emerald-600 rounded-sm" />
            </div>
            <span>More practice</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
