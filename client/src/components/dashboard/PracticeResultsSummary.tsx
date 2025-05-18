/**
 * PracticeResultsSummary - Dashboard card displaying reframe practice results
 * 
 * This component shows a summary of the user's reframe practice history,
 * including total practices completed, accuracy rate, and average score.
 * It handles different data field naming conventions (correctCount/correctAnswers,
 * totalCount/totalQuestions) and prevents NaN% values in calculations.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Award, BarChart3, ArrowRight } from 'lucide-react';
import useActiveUser from '@/hooks/use-active-user';
import { cn } from '@/lib/utils';

type PracticeResultsSummaryProps = {
  className?: string;
};

export function PracticeResultsSummary({ className }: PracticeResultsSummaryProps) {
  const { activeUserId } = useActiveUser();

  const { data: results, isLoading } = useQuery({
    queryKey: [`/api/users/${activeUserId}/reframe-coach/results`],
    enabled: !!activeUserId,
  });

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Practice Results Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // If no results are available yet
  if (!results || !Array.isArray(results) || results.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="py-6">
          <h3 className="text-lg font-semibold mb-1">Practice History</h3>
          <p className="text-sm text-muted-foreground">
            No practice history available. When you complete practice sessions, your results will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary stats - handle both field naming conventions
  const totalCompleted = results.filter((result: any) => 
    result.completed || (result.correctAnswers > 0 || result.correctCount > 0)
  ).length || 0;
  
  // Calculate average score safely with fallbacks for different field names
  const averageScore = totalCompleted > 0 ? 
    Math.round(results.reduce((sum: number, result: any) => {
      const correct = result.correctAnswers || result.correctCount || 0;
      const total = result.totalQuestions || result.totalCount || 1;
      return sum + ((correct / total) * 100);
    }, 0) / results.length) : 0;
  
  // Get the most recent result
  const mostRecent = results[0];
  const mostRecentDate = new Date(mostRecent.createdAt).toLocaleDateString();
  const correct = mostRecent.correctAnswers || mostRecent.correctCount || 0;
  const total = mostRecent.totalQuestions || mostRecent.totalCount || 1;
  const mostRecentScore = Math.round((correct / total) * 100);

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-1">Practice History</h3>
        <p className="text-sm text-muted-foreground mb-4">Past practice session results</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted/30 p-3 rounded-md text-center">
            <div className="text-2xl font-semibold text-primary">
              {totalCompleted}
            </div>
            <div className="text-xs text-muted-foreground">
              Completed Sessions
            </div>
          </div>
          <div className="bg-muted/30 p-3 rounded-md text-center">
            <div className="text-2xl font-semibold text-primary">
              {Math.round(averageScore)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Average Score
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Most Recent:</span>
            <span className="text-xs text-muted-foreground">{mostRecentDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Score: <span className="font-medium">{mostRecentScore}%</span></span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => window.location.href = '/users/' + activeUserId + '/reframe-history'}
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1" />
              View Full History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}