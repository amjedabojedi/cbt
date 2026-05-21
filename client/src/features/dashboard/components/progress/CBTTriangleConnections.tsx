import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, AlertCircle } from "lucide-react";
import type { EmotionRecord, ThoughtRecord } from "@shared/schema";

interface CBTTriangleConnectionsProps {
  topCognitiveDistortion: {
    name: string;
    count: number;
    percentage: number;
  } | null;
  emotions: EmotionRecord[];
  thoughts: ThoughtRecord[];
  isLoading: boolean;
}

export default function CBTTriangleConnections({
  topCognitiveDistortion,
  emotions,
  thoughts,
  isLoading,
}: CBTTriangleConnectionsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-3/4" />
            <div className="h-4 bg-neutral-200 rounded w-full" />
            <div className="h-4 bg-neutral-200 rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate thought-feeling connections
  const emotionsWithThoughts = thoughts.filter(t => t.emotionRecordId !== null).length;
  const thoughtFeelingRate = thoughts.length > 0 
    ? Math.round((emotionsWithThoughts / thoughts.length) * 100) 
    : 0;
  
  return (
    <Card data-testid="cbt-triangle-connections">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Cross-Module Connections
        </CardTitle>
        <CardDescription>
          Understanding the CBT triangle: thoughts, feelings, and behaviors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Thought-Feeling Connection */}
        <div className="pb-4 border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
            <div className="flex-1">
              <h4 className="font-medium text-neutral-800 mb-1">Thought-Feeling Connection</h4>
              <p className="text-sm text-neutral-600">
                {thoughtFeelingRate}% of your thought records are linked to tracked emotions
              </p>
              {thoughtFeelingRate < 50 && thoughts.length > 3 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Consider tracking emotions before recording thoughts to strengthen the connection
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Pattern Recognition */}
        <div className="pb-4 border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
            <div className="flex-1">
              <h4 className="font-medium text-neutral-800 mb-1">Cognitive Pattern Recognition</h4>
              {topCognitiveDistortion ? (
                <div>
                  <p className="text-sm text-neutral-600">
                    Your most common thinking pattern is{" "}
                    <span className="font-semibold text-purple-600">
                      {topCognitiveDistortion.name}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Appears in {topCognitiveDistortion.percentage}% of your thought records ({topCognitiveDistortion.count} times)
                  </p>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  Record more thoughts to identify patterns in your thinking
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Activity-Emotion Link */}
        <div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2" />
            <div className="flex-1">
              <h4 className="font-medium text-neutral-800 mb-1">Activity-Mood Connection</h4>
              <p className="text-sm text-neutral-600">
                Tracking {emotions.length} emotions helps identify how activities affect your mood
              </p>
              {emotions.length > 10 && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Great progress! You're building a comprehensive picture of your emotional patterns
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
