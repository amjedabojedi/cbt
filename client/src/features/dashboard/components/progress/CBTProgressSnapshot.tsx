import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Heart, Brain, Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CBTProgressSnapshotProps {
  totalActivities: number;
  emotionalBalance: {
    negativeIntensity: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    positiveIntensity: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    negativeFrequency: number;
    positiveFrequency: number;
  };
  thoughtChallengeRate: {
    rate: number;
    challenged: number;
    total: number;
  };
  goalProgress: {
    completionRate: number;
    completed: number;
    inProgress: number;
    pending: number;
    total: number;
  };
  isLoading: boolean;
}

const TrendIndicator = ({ value, inverse = false }: { value: number; inverse?: boolean }) => {
  if (value === 0) {
    return (
      <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100/50">
        <Minus className="h-3 w-3 mr-1" />
        <span>0%</span>
      </div>
    );
  }
  
  // For negative emotions, decrease is good (inverse = true)
  // For positive emotions, increase is good (inverse = false)
  const isPositiveChange = inverse ? value < 0 : value > 0;
  
  return (
    <div className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border",
      isPositiveChange 
        ? "bg-emerald-50 text-emerald-700 border-emerald-100/50" 
        : "bg-rose-50 text-rose-700 border-rose-100/50"
    )}>
      {value > 0 ? (
        <TrendingUp className="h-3 w-3 mr-1" />
      ) : (
        <TrendingDown className="h-3 w-3 mr-1" />
      )}
      <span>{Math.abs(value)}%</span>
    </div>
  );
};

export default function CBTProgressSnapshot({
  totalActivities,
  emotionalBalance,
  thoughtChallengeRate,
  goalProgress,
  isLoading,
}: CBTProgressSnapshotProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-white border border-slate-100 rounded-2xl">
            <CardContent className="pt-6">
              <div className="h-24 bg-slate-100 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Engagement Level (Behavioral Activation) */}
      <Card 
        className="bg-white rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between"
        data-testid="metric-activity-level"
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Engagement Level</span>
            <div className="bg-purple-50 text-purple-600 p-2 rounded-xl group-hover:bg-purple-100 transition-colors duration-300">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-5">
          <div className="text-3xl font-extrabold text-slate-800 mb-1">{totalActivities}</div>
          <p className="text-xs font-semibold text-slate-500 mb-3">total activities completed</p>
          <div className="pt-2.5 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <span>Behavioral Activation</span>
              <span className="text-purple-600 font-extrabold">Active</span>
            </div>
            <Progress value={Math.min((totalActivities / 20) * 100, 100)} className="h-1.5 [&>div]:bg-purple-600" />
          </div>
        </CardContent>
      </Card>
      
      {/* 2. Emotional Balance (Affect-based) */}
      <Card 
        className="bg-white rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between"
        data-testid="metric-emotional-balance"
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Emotional Balance</span>
            <div className="bg-rose-50 text-rose-500 p-2 rounded-xl group-hover:bg-rose-100 transition-colors duration-300">
              <Heart className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-rose-50/20 border border-rose-100/10 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Negative</span>
                <TrendIndicator value={emotionalBalance.negativeIntensity.changePercent} inverse={true} />
              </div>
              <div className="text-xl font-extrabold text-rose-600">
                {emotionalBalance.negativeIntensity.current > 0 
                  ? emotionalBalance.negativeIntensity.current.toFixed(1) 
                  : "—"}
              </div>
            </div>
            
            <div className="p-2 bg-emerald-50/20 border border-emerald-100/10 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Positive</span>
                <TrendIndicator value={emotionalBalance.positiveIntensity.changePercent} />
              </div>
              <div className="text-xl font-extrabold text-emerald-600">
                {emotionalBalance.positiveIntensity.current > 0 
                  ? emotionalBalance.positiveIntensity.current.toFixed(1) 
                  : "—"}
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Affect Intensity</span>
            <span className="text-rose-500 font-extrabold">1-10 Scale</span>
          </div>
        </CardContent>
      </Card>
      
      {/* 3. Thought Challenge Rate (Cognitive Restructuring) */}
      <Card 
        className="bg-white rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between"
        data-testid="metric-thought-challenge"
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Cognitive Restructuring</span>
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl group-hover:bg-indigo-100 transition-colors duration-300">
              <Brain className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-5">
          <div className="text-3xl font-extrabold text-slate-800 mb-1">{thoughtChallengeRate.rate}%</div>
          <p className="text-xs font-semibold text-slate-500 mb-3">examined with evidence</p>
          <div className="pt-2.5 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <span>Challenged Thoughts</span>
              <span className="text-indigo-600 font-extrabold">{thoughtChallengeRate.challenged} / {thoughtChallengeRate.total}</span>
            </div>
            <Progress value={thoughtChallengeRate.rate} className="h-1.5 [&>div]:bg-indigo-600" />
          </div>
        </CardContent>
      </Card>
      
      {/* 4. Goal Progress */}
      <Card 
        className="bg-white rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between"
        data-testid="metric-goal-progress"
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Goal Progress</span>
            <div className="bg-fuchsia-50 text-fuchsia-600 p-2 rounded-xl group-hover:bg-fuchsia-100 transition-colors duration-300">
              <Target className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-5">
          <div className="text-3xl font-extrabold text-slate-800 mb-1">{goalProgress.completionRate}%</div>
          <p className="text-xs font-semibold text-slate-500 mb-3">goal completion rate</p>
          <div className="pt-2.5 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <span>Completed Goals</span>
              <span className="text-fuchsia-600 font-extrabold">{goalProgress.completed} / {goalProgress.total}</span>
            </div>
            <Progress value={goalProgress.completionRate} className="h-1.5 [&>div]:bg-fuchsia-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
