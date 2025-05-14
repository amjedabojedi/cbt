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
  const userId = params.userId && !isNaN(parseInt(params.userId)) 
    ? parseInt(params.userId) 
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
    queryKey: thoughtId && userId ? [`/api/users/${userId}/thoughts/${thoughtId}`] : null,
    enabled: !!thoughtId && !!userId,
  });

  // Fetch assignment details if we have an assignmentId
  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: assignmentId ? [`/api/reframe-coach/assignments/${assignmentId}`] : null,
    enabled: !!assignmentId,
  });
  
  const isLoading = isLoadingThought || isLoadingAssignment;
  const title = assignment 
    ? "Reframe Practice Assignment" 
    : thoughtRecord 
      ? `Practice: ${thoughtRecord.automaticThoughts.slice(0, 50)}${thoughtRecord.automaticThoughts.length > 50 ? '...' : ''}`
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