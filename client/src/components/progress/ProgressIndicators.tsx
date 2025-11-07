import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface ProgressIndicatorsProps {
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
  totalActivities: number;
  isLoading: boolean;
}

export default function ProgressIndicators({
  emotionalBalance,
  thoughtChallengeRate,
  totalActivities,
  isLoading,
}: ProgressIndicatorsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-1/2" />
                <div className="h-2 bg-neutral-200 rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate clinical markers
  const isActivelyEngaged = totalActivities >= 10;
  const isChallengingThoughts = thoughtChallengeRate.rate >= 50;
  const isTrackingEmotions = emotionalBalance.negativeFrequency + emotionalBalance.positiveFrequency >= 7;
  const showsEmotionalImprovement = emotionalBalance.negativeIntensity.change < 0 || 
                                     emotionalBalance.positiveIntensity.change > 0;
  
  // Generate recommendations
  const recommendations: Array<{ type: "success" | "warning" | "info"; message: string }> = [];
  
  if (isActivelyEngaged) {
    recommendations.push({
      type: "success",
      message: "Excellent engagement! You're consistently using therapeutic tools.",
    });
  } else {
    recommendations.push({
      type: "info",
      message: "Try to engage with at least 2-3 modules weekly for better outcomes.",
    });
  }
  
  if (isChallengingThoughts) {
    recommendations.push({
      type: "success",
      message: "Great work challenging your thoughts! This is a key CBT skill.",
    });
  } else if (thoughtChallengeRate.total >= 5) {
    recommendations.push({
      type: "warning",
      message: "Consider examining evidence for/against more of your recorded thoughts.",
    });
  }
  
  if (showsEmotionalImprovement) {
    recommendations.push({
      type: "success",
      message: "Your emotional patterns show positive change. Keep it up!",
    });
  }
  
  if (!isTrackingEmotions && totalActivities > 5) {
    recommendations.push({
      type: "info",
      message: "Regular emotion tracking helps identify triggers and patterns.",
    });
  }
  
  return (
    <Card data-testid="progress-indicators">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Therapeutic Progress Indicators
        </CardTitle>
        <CardDescription>
          Evidence-based markers of your CBT progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Engagement Level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Engagement Level</span>
            <span className="text-sm text-neutral-600">{totalActivities} activities</span>
          </div>
          <Progress 
            value={Math.min((totalActivities / 20) * 100, 100)} 
            className="h-2"
          />
          <p className="text-xs text-neutral-500 mt-1">
            {isActivelyEngaged ? "Highly engaged" : "Building momentum"}
          </p>
        </div>
        
        {/* Cognitive Restructuring */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Cognitive Restructuring</span>
            <span className="text-sm text-neutral-600">{thoughtChallengeRate.rate}%</span>
          </div>
          <Progress 
            value={thoughtChallengeRate.rate} 
            className="h-2"
          />
          <p className="text-xs text-neutral-500 mt-1">
            {thoughtChallengeRate.challenged} of {thoughtChallengeRate.total} thoughts challenged
          </p>
        </div>
        
        {/* Emotional Awareness */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Emotional Awareness</span>
            <span className="text-sm text-neutral-600">
              {emotionalBalance.negativeFrequency + emotionalBalance.positiveFrequency} tracked
            </span>
          </div>
          <Progress 
            value={Math.min(((emotionalBalance.negativeFrequency + emotionalBalance.positiveFrequency) / 15) * 100, 100)} 
            className="h-2"
          />
          <p className="text-xs text-neutral-500 mt-1">
            {isTrackingEmotions ? "Good emotional tracking" : "Continue tracking emotions"}
          </p>
        </div>
        
        {/* Recommendations */}
        <div className="pt-4 border-t border-neutral-100">
          <h4 className="text-sm font-semibold text-neutral-700 mb-3">Personalized Recommendations</h4>
          <div className="space-y-2">
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    rec.type === "success" 
                      ? "bg-green-50 text-green-800" 
                      : rec.type === "warning"
                      ? "bg-amber-50 text-amber-800"
                      : "bg-blue-50 text-blue-800"
                  }`}
                >
                  {rec.type === "success" && <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  {rec.type === "warning" && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  {rec.type === "info" && <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  <p className="text-xs">{rec.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">Keep engaging with the tools to receive personalized guidance.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
