import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import ReframePractice from "@/components/reframeCoach/ReframePractice";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

const ReframePracticePage = () => {
  const { user } = useAuth();
  const params = useParams();
  const [location, setLocation] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  
  // Extract user ID from authenticated user if not in params
  // Use default null check to avoid NaN
  const userIdParam = params.userId || queryParams.get('userId');
  const userId = userIdParam && !isNaN(parseInt(userIdParam)) 
    ? parseInt(userIdParam) 
    : user?.id;
  
  // Extract thoughtId and assignmentId from either path params or query params
  // with proper null checks to avoid NaN
  const thoughtIdParam = params.thoughtId || queryParams.get('thoughtId');
  const thoughtId = thoughtIdParam && !isNaN(parseInt(thoughtIdParam)) 
    ? parseInt(thoughtIdParam) 
    : undefined;
      
  const assignmentIdParam = params.assignmentId || queryParams.get('assignmentId');
  const assignmentId = assignmentIdParam && !isNaN(parseInt(assignmentIdParam)) 
    ? parseInt(assignmentIdParam) 
    : undefined;
    
  // IMPORTANT: This determines if we are in quick practice mode (direct from thought record)
  // or in assignment practice mode (from an assignment)
  // Check for explicit isQuickPractice query parameter first
  const isQuickPracticeParam = queryParams.get('isQuickPractice');
  const isQuickPractice = isQuickPracticeParam === 'true' ? true : (!!thoughtId && !assignmentId);
  
  // Fetch thought record details if we have a thoughtId and userId
  const { data: thoughtRecord, isLoading: isLoadingThought } = useQuery({
    queryKey: [`/api/users/${userId || 0}/thoughts/${thoughtId || 0}`],
    enabled: !!thoughtId && !!userId,
  });

  // Fetch assignment details if we have an assignmentId
  const { data: assignment, isLoading: isLoadingAssignment, error: assignmentError, isError: isAssignmentError } = useQuery({
    queryKey: [`/api/reframe-coach/assignments/${assignmentId || 0}`],
    enabled: !!assignmentId && !isQuickPractice,
    retry: 1, // Minimize retries to show error quicker
    retryDelay: 1000,
  });
  
  // For quick practice mode: fetch practice scenarios directly
  console.log("Practice scenarios query params:", { 
    isQuickPractice, 
    thoughtId, 
    userId, 
    enabled: isQuickPractice && !!thoughtId && !!userId,
    isAuthenticated: !!user
  });
  
  // Enhanced query with more robust error handling and retries
  const { data: practiceScenarios, isLoading: isLoadingScenarios, error: scenariosError, isError: isScenariosError } = useQuery({
    queryKey: [`/api/users/${userId || 0}/thoughts/${thoughtId || 0}/practice-scenarios`],
    enabled: isQuickPractice && !!thoughtId && !!userId && !!user,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });
  
  // Log results for debugging
  useEffect(() => {
    if (practiceScenarios) {
      console.log("Practice scenarios loaded successfully:", practiceScenarios);
    }
    if (scenariosError) {
      console.error("Failed to load practice scenarios:", scenariosError);
    }
  }, [practiceScenarios, scenariosError]);
  
  // Only show loading state if we're loading and don't have an error
  const isLoading = (isLoadingThought || isLoadingAssignment || isLoadingScenarios) && !(isAssignmentError || isScenariosError);
  const hasError = (isAssignmentError && !isQuickPractice) || (isScenariosError && isQuickPractice);
  
  // Redirect to thought records page if accessed directly without needed parameters
  const [navigateToThoughts, setNavigateToThoughts] = useState(false);
  
  useEffect(() => {
    // If no parameters are provided and we're not loading, redirect to thoughts
    if (!thoughtId && !assignmentId && !isLoading) {
      setNavigateToThoughts(true);
      setTimeout(() => {
        setLocation(`/users/${user?.id || ''}/thoughts`);
      }, 1500);
    }
  }, [thoughtId, assignmentId, isLoading, user?.id, setLocation]);
  
  // Handle type safety for thought record
  const thoughtRecordData = thoughtRecord as any || {};
  
  // Debug logging to see parameter values
  console.log('ReframePracticePage params:', { 
    userId, 
    thoughtId, 
    assignmentId,
    isQuickPractice,
    isQuickPracticeParam,
    pathUserId: params.userId,
    queryUserId: queryParams.get('userId'),
    pathThoughtId: params.thoughtId,
    queryThoughtId: queryParams.get('thoughtId'),
    pathAssignmentId: params.assignmentId,
    queryAssignmentId: queryParams.get('assignmentId'),
    user: user?.id,
    pathname: location.split('?')[0],
    fullLocation: location
  });
  
  const title = assignment 
    ? "Reframe Practice Assignment" 
    : thoughtRecordData.automaticThoughts 
      ? `Practice: ${thoughtRecordData.automaticThoughts.slice(0, 50)}${thoughtRecordData.automaticThoughts.length > 50 ? '...' : ''}`
      : "Reframe Practice";

  return (
    <div>
      <Header title={title} />

      <div className="container max-w-4xl py-6">
        <div className="mb-6">
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : navigateToThoughts ? (
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Redirecting to Thought Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The Reframe Coach practice feature must be started from a thought record. You are being redirected to your thought records.
                </p>
                <div className="flex justify-center my-4">
                  <div className="h-2 w-full max-w-sm bg-amber-100 dark:bg-amber-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 animate-pulse rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : hasError ? (
            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  {isQuickPractice ? "Failed to Load Practice Scenarios" : "Practice Assignment Not Found"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {isQuickPractice 
                    ? `We couldn't generate practice scenarios for thought record #${thoughtId}. Please try again later.`
                    : `We couldn't find practice assignment #${assignmentId}. It may have been deleted or you may not have permission to access it.`
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Error: {isQuickPractice 
                    ? (scenariosError?.message || "Failed to generate practice scenarios") 
                    : (assignmentError?.message || "Assignment not found")
                  }
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="default"
                    onClick={() => window.location.href = '/reframe-coach'}
                  >
                    Return to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Go Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Introduction card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Cognitive Restructuring Practice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This interactive exercise will help you practice identifying and challenging unhelpful thinking patterns.
                    You'll be presented with scenarios and asked to select the most helpful reframing option.
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Each correct answer earns points, and you can track your progress over time.
                  </p>
                </CardContent>
              </Card>
              
              {/* Reframe Practice Component with explicitly passed parameters */}
              <ReframePractice 
                userId={userId} 
                thoughtRecordId={thoughtId}
                assignmentId={assignmentId}
                practiceScenarios={isQuickPractice ? practiceScenarios : (assignment?.reframeData || undefined)}
                isQuickPractice={isQuickPractice}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReframePracticePage;