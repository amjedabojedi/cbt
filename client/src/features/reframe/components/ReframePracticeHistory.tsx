/**
 * ReframePracticeHistory - Displays a history of reframe practice results
 * 
 * This component shows recent practice sessions with details like:
 * - Score and accuracy percentage
 * - Completion date
 * - Time taken to complete
 * - Number of correct answers
 * 
 * It handles both naming conventions for data fields (correctCount/correctAnswers
 * and totalCount/totalQuestions) and properly prevents NaN% calculations.
 */
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Loader2, BarChart3, Clock, BrainCircuit, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

interface ReframePracticeHistoryProps {
  userId: number;
  thoughtId?: number;
  className?: string;
  limit?: number;
}

const ReframePracticeHistory: React.FC<ReframePracticeHistoryProps> = ({ 
  userId, 
  thoughtId,
  className,
  limit = 3
}) => {
  const { user } = useAuth();
  
  // Fetch practice results for this user
  const { data: results, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/reframe-coach/results`],
    enabled: !!userId,
  });

  // Filter results by thoughtId if provided
  const filteredResults = React.useMemo(() => {
    if (!results || !Array.isArray(results)) return [];
    
    let filtered = results;
    if (thoughtId) {
      filtered = results.filter((result: any) => result.thoughtRecordId === thoughtId);
    }
    
    // Sort by date (newest first) and apply limit
    return filtered
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [results, thoughtId, limit]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading practice history...</p>
        </CardContent>
      </Card>
    );
  }

  if (!filteredResults.length) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <h3 className="text-lg font-semibold mb-1">Practice History</h3>
          <p className="text-sm text-muted-foreground">
            No practice sessions found for this thought record. Complete a practice session to see your results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Practice History</CardTitle>
        <CardDescription>
          Your recent practice results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredResults.map((result: any) => (
          <Card key={result.id} className="border border-muted/60">
            <CardContent className="py-4 px-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Practice Session</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  {format(new Date(result.createdAt), 'MMM d, yyyy')}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 my-3">
                <div className="text-center p-2 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-lg font-bold">{result.score}</p>
                </div>
                <div className="text-center p-2 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Correct</p>
                  <p className="text-lg font-bold">
                    {result.correctAnswers || result.correctCount || 0} / {result.totalQuestions || result.totalCount || 0}
                  </p>
                </div>
                <div className="text-center p-2 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="text-lg font-bold">
                    {Math.round(((result.correctAnswers || result.correctCount || 0) / 
                      (result.totalQuestions || result.totalCount || 1)) * 100)}%
                  </p>
                </div>
              </div>
              
              {/* Display cognitive distortions practiced */}
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {result.scenarioData && Array.isArray(result.scenarioData) ? (
                    Array.from(
                      new Set(
                        result.scenarioData
                          .map((scenario: any) => scenario.cognitiveDistortion)
                          .filter(Boolean)
                      )
                    ).map((distortion: any, index: number) => (
                      <Badge key={index} variant="outline" className="bg-primary/10 text-xs">
                        <BrainCircuit className="mr-1 h-3 w-3" />
                        {String(distortion)}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs">Cognitive Restructuring</Badge>
                  )}
                </div>
              </div>
              
              {result.streakCount > 1 && (
                <div className="flex items-center text-xs text-primary-foreground mt-2 bg-primary/10 p-2 rounded">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  <span>Streak: {result.streakCount} correct answers in a row!</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default ReframePracticeHistory;