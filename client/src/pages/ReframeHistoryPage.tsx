import React from "react";
import { useParams, useLocation } from "wouter";
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
import { 
  Loader2, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  ThumbsUp, 
  UserCircle, 
  BrainCircuit, 
  ArrowLeft 
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

const ReframeHistoryPage = () => {
  const { userId } = useParams();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const parsedUserId = userId ? parseInt(userId) : user?.id;
  
  // Determine if the current user is viewing their own results or someone else's (as a therapist)
  const isViewingOwnResults = user?.id === parsedUserId;
  const isTherapist = user?.role === "therapist";
  
  const { data: results, isLoading } = useQuery({
    queryKey: [`/api/users/${parsedUserId}/reframe-coach/results`],
    enabled: !!parsedUserId,
  });
  
  // Get the client's name if a therapist is viewing their client's results
  const { data: clientData, isError: clientDataError } = useQuery({
    queryKey: [`/api/users/${parsedUserId}`],
    enabled: !isViewingOwnResults && isTherapist && !!parsedUserId,
  });
  
  // Determine the proper back button link
  const handleBackClick = () => {
    if (isViewingOwnResults) {
      navigate("/reframe-coach");
    } else if (isTherapist) {
      // If therapist is viewing a client's results, go back to client thought records
      console.log("Navigating back to client thought records:", `/users/${parsedUserId}/thoughts`);
      navigate(`/users/${parsedUserId}/thoughts`);
    } else {
      navigate("/");
    }
  };
  
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

  // Create a title based on who is viewing the page
  let pageTitle = isViewingOwnResults ? "Your Practice History" : "Client's Practice History";
  
  // Only try to use the client name if we successfully loaded the client data
  if (!isViewingOwnResults && clientData && typeof clientData === 'object' && 'name' in clientData && clientData.name) {
    pageTitle = `${clientData.name}'s Practice History`;
  }

  return (
    <AppLayout title="Practice History">
      <div className="container max-w-4xl py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{pageTitle}</h2>
          <Button onClick={handleBackClick}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isViewingOwnResults ? "Back to Reframe Coach" : "Back"}
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reframe Practice Results</CardTitle>
            <CardDescription>
              {isViewingOwnResults 
                ? "Review your past practice sessions and track your progress over time" 
                : "Review this client's practice sessions and track their progress over time"}
            </CardDescription>
          </CardHeader>
        </Card>
        
        {!results || !Array.isArray(results) || results.length === 0 ? (
          <Card className="border-dashed border-muted">
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground mb-4">
                {isViewingOwnResults 
                  ? "You haven't completed any practice sessions yet." 
                  : "This client hasn't completed any practice sessions yet."}
              </p>
              
              {isViewingOwnResults ? (
                <div className="flex flex-col items-center">
                  <div className="my-4 px-6 py-3 bg-muted/20 rounded-md max-w-md">
                    <h4 className="font-medium text-sm mb-2">How to get started:</h4>
                    <ol className="list-decimal text-left text-sm text-muted-foreground space-y-2 ml-4">
                      <li>First, create a thought record to document your thoughts</li>
                      <li>Then practice reframing those thoughts with exercises</li>
                      <li>Your practice results will appear here to track progress</li>
                    </ol>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => navigate(`/users/${parsedUserId}/thoughts/new`)}
                      className="sm:order-1"
                    >
                      Create a Thought Record
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/users/${parsedUserId}/thoughts`)}
                      className="sm:order-2"
                    >
                      View My Thought Records
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    You can assign practice exercises to help clients practice cognitive restructuring.
                  </p>
                  <Button 
                    className="mt-2" 
                    onClick={() => navigate(`/users/${parsedUserId}/thoughts`)}
                  >
                    View Client Thoughts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Array.isArray(results) && results.map((result: any) => (
              <Card key={result.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Practice Session
                    </CardTitle>
                    <div className="text-sm font-medium flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {result.formattedDate || format(new Date(result.createdAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  <CardDescription>
                    {result.thoughtRecordId 
                      ? `Practice based on thought record from ${format(new Date(result.createdAt), 'MMM d, yyyy')}` 
                      : 'Quick practice session'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                        {result.successRate || (result.totalQuestions > 0 ? 
                          Math.round(((result.correctAnswers || 0) / result.totalQuestions) * 100) : 0)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted/20 rounded-md">
                      <p className="text-muted-foreground text-sm">Time Spent</p>
                      <p className="text-2xl font-bold">
                        {result.timeSpent !== undefined && result.timeSpent !== null ? 
                          (result.timeSpent === 0 ? "< 1 min" : `${result.timeSpent} min`) 
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Display cognitive distortions practiced */}
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Cognitive Distortions Practiced:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.formattedDistortions && result.formattedDistortions.length > 0 ? (
                        result.formattedDistortions.map((distortion: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-primary/10">
                            <BrainCircuit className="mr-1 h-3 w-3" />
                            {distortion}
                          </Badge>
                        ))
                      ) : (
                        result.scenarioData && Array.isArray(result.scenarioData) ? (
                          Array.from(new Set(result.scenarioData
                            .map((scenario: any) => scenario.cognitiveDistortion)
                            .filter(Boolean)
                            .map((distortion: string) => {
                              return distortion
                                .replace(/-/g, ' ')
                                .split(' ')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                            })
                          )).map((distortion: string, index: number) => (
                            <Badge key={index} variant="outline" className="bg-primary/10">
                              <BrainCircuit className="mr-1 h-3 w-3" />
                              {distortion}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">Cognitive Restructuring</Badge>
                        )
                      )}
                    </div>
                  </div>
                  
                  {result.streakCount > 1 && (
                    <div className="flex items-center text-sm text-primary-foreground mt-4 bg-primary/10 p-2 rounded">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      <span>Streak: {result.streakCount} correct answers in a row!</span>
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