import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Brain, Target, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
      <div className="flex items-center text-neutral-500">
        <Minus className="h-4 w-4 mr-1" />
        <span className="text-sm">No change</span>
      </div>
    );
  }
  
  // For negative emotions, decrease is good (inverse = true)
  // For positive emotions, increase is good (inverse = false)
  const isPositiveChange = inverse ? value < 0 : value > 0;
  
  return (
    <div className={`flex items-center ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
      {value > 0 ? (
        <TrendingUp className="h-4 w-4 mr-1" />
      ) : (
        <TrendingDown className="h-4 w-4 mr-1" />
      )}
      <span className="text-sm font-medium">{Math.abs(value)}%</span>
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
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-24 bg-neutral-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-800 mb-1">CBT Progress Snapshot</h2>
        <p className="text-sm text-neutral-500">Evidence-based metrics tracking your therapeutic journey</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Activity Level (BADS-aligned) */}
        <Card data-testid="metric-activity-level">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-neutral-600">Activity Level</CardTitle>
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-800 mb-1">{totalActivities}</div>
            <p className="text-xs text-neutral-500">entries logged</p>
            <div className="mt-2 text-xs text-neutral-600">
              Across all 5 therapeutic modules
            </div>
          </CardContent>
        </Card>
        
        {/* 2. Emotional Balance (Evidence-based: positive vs negative) */}
        <Card data-testid="metric-emotional-balance">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-neutral-600">Emotional Balance</CardTitle>
              <Heart className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600">Negative intensity:</span>
                  <TrendIndicator value={emotionalBalance.negativeIntensity.changePercent} inverse={true} />
                </div>
                <div className="text-lg font-bold text-red-600">
                  {emotionalBalance.negativeIntensity.current > 0 
                    ? emotionalBalance.negativeIntensity.current.toFixed(1) 
                    : "—"}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600">Positive intensity:</span>
                  <TrendIndicator value={emotionalBalance.positiveIntensity.changePercent} />
                </div>
                <div className="text-lg font-bold text-green-600">
                  {emotionalBalance.positiveIntensity.current > 0 
                    ? emotionalBalance.positiveIntensity.current.toFixed(1) 
                    : "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 3. Thought Challenge Rate (CBT evidence-based) */}
        <Card data-testid="metric-thought-challenge">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-neutral-600">Thought Challenge Practice</CardTitle>
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-800 mb-1">{thoughtChallengeRate.rate}%</div>
            <p className="text-xs text-neutral-500">challenge rate</p>
            <div className="mt-2 text-xs text-neutral-600">
              {thoughtChallengeRate.challenged} of {thoughtChallengeRate.total} thoughts challenged
            </div>
          </CardContent>
        </Card>
        
        {/* 4. Goal Progress */}
        <Card data-testid="metric-goal-progress">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-neutral-600">Goal Progress</CardTitle>
              <Target className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-800 mb-1">{goalProgress.completionRate}%</div>
            <p className="text-xs text-neutral-500">completion rate</p>
            <div className="mt-2 text-xs text-neutral-600">
              {goalProgress.completed}/{goalProgress.total} goals completed
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
