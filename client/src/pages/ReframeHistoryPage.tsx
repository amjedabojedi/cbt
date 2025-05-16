import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3, Clock, CheckCircle, ThumbsUp } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";

const ReframeHistoryPage = () => {
  const { userId } = useParams();
  const parsedUserId = userId ? parseInt(userId) : undefined;
  
  const { data: results, isLoading } = useQuery({
    queryKey: [`/api/users/${parsedUserId}/reframe-coach/results`],
    enabled: !!parsedUserId,
  });
  
  if (isLoading) {
    return (
      <AppLayout title="Practice History">
        <div className="container max-w-4xl py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Practice History">
      <div className="container max-w-4xl py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Practice History</h2>
          <Button onClick={() => window.history.back()}>
            Back
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Reframe Practice Results</CardTitle>
            <CardDescription>
              Review your past practice sessions and track your progress over time
            </CardDescription>
          </CardHeader>
        </Card>
        
        {!results || results.length === 0 ? (
          <Card className="border-dashed border-muted">
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground mb-4">
                No practice results yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Complete practice exercises to see your results and track progress.
              </p>
              <Button 
                className="mt-6" 
                onClick={() => window.location.href = `/users/${parsedUserId}/thoughts`}
              >
                Start Practice
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {results.map((result: any) => (
              <Card key={result.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Practice Session
                    </CardTitle>
                    <div className="text-sm font-medium flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(result.createdAt).toLocaleDateString()} at {format(new Date(result.createdAt), 'h:mm a')}
                    </div>
                  </div>
                  <CardDescription>
                    {result.thoughtRecordId ? `From thought record #${result.thoughtRecordId}` : 'Quick practice session'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-muted/20 rounded-md">
                      <p className="text-muted-foreground text-sm">Score</p>
                      <p className="text-2xl font-bold">{result.score}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/20 rounded-md">
                      <p className="text-muted-foreground text-sm">Correct</p>
                      <p className="text-2xl font-bold">{result.correctAnswers} / {result.totalQuestions}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/20 rounded-md">
                      <p className="text-muted-foreground text-sm">Accuracy</p>
                      <p className="text-2xl font-bold">
                        {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
                      </p>
                    </div>
                  </div>
                  
                  {result.streakCount > 1 && (
                    <div className="flex items-center text-sm text-primary-foreground mt-2 bg-primary/10 p-2 rounded">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      <span>Streak: {result.streakCount} correct in a row!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ReframeHistoryPage;