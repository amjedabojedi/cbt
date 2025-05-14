import React from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import ReframePractice from "@/components/reframeCoach/ReframePractice";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";

const ReframePracticePage = () => {
  const { user } = useAuth();
  const params = useParams();
  const [location] = useLocation();
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
  
  // Fetch thought record details if we have a thoughtId and userId
  const { data: thoughtRecord, isLoading: isLoadingThought } = useQuery({
    queryKey: [`/api/users/${userId || 0}/thoughts/${thoughtId || 0}`],
    enabled: !!thoughtId && !!userId,
  });

  // Fetch assignment details if we have an assignmentId
  const { data: assignment, isLoading: isLoadingAssignment, error: assignmentError } = useQuery({
    queryKey: [`/api/reframe-coach/assignments/${assignmentId || 0}`],
    enabled: !!assignmentId,
    retry: 2, // Limit retries to avoid too many failed requests
  });
  
  const isLoading = isLoadingThought || isLoadingAssignment;
  const hasError = assignmentError !== null;
  
  // Handle type safety for thought record
  const thoughtRecordData = thoughtRecord as any || {};
  
  // Debug logging to see parameter values
  console.log('ReframePracticePage params:', { 
    userId, 
    thoughtId, 
    assignmentId,
    pathUserId: params.userId,
    queryUserId: queryParams.get('userId'),
    pathThoughtId: params.thoughtId,
    queryThoughtId: queryParams.get('thoughtId'),
    pathAssignmentId: params.assignmentId,
    queryAssignmentId: queryParams.get('assignmentId'),
    user: user?.id,
    pathname: location.split('?')[0],
    fullLocation: location,
    fullParams: params
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
          ) : hasError ? (
            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Practice Assignment Not Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We couldn't find the practice assignment you're looking for. It may have been deleted or you may not have permission to access it.
                </p>
                <div className="mt-4">
                  <Button
                    variant="default"
                    onClick={() => window.location.href = '/reframe-coach'}
                  >
                    Return to Reframe Coach Dashboard
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
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReframePracticePage;