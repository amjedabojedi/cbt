import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  
  // NEW APPROACH: Check the URL path first since it's more reliable
  // If URL contains '/practice/quick/', we're definitely in quick practice mode
  const isQuickPracticePath = location.includes('/practice/quick/');
  
  // Also check for explicit isQuickPractice query parameter as fallback
  const isQuickPracticeParam = queryParams.get('isQuickPractice');
  
  // Combine both methods: either path-based detection or query parameter
  const isQuickPractice = isQuickPracticePath || isQuickPracticeParam === 'true';
  
  // Add detailed logging for debugging
  console.log('Quick Practice Detection:', {
    currentPath: location,
    hasQuickInPath: isQuickPracticePath,
    queryParam: isQuickPracticeParam,
    finalIsQuickPractice: isQuickPractice
  });
  
  // Fetch thought record details if we have a thoughtId and userId
  const { data: thoughtRecord, isLoading: isLoadingThought, isError: isErrorThought, error: thoughtError } = useQuery({
    queryKey: [`/api/users/${userId || 0}/thoughts/${thoughtId || 0}`],
    enabled: !!thoughtId && !!userId,
    queryFn: async ({ queryKey }) => {
      const url = queryKey[0] as string;
      console.log("Fetching thought record with URL:", url);
      
      try {
        // Add backup auth headers
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        // Add backup auth headers if user is authenticated
        if (user) {
          console.log("Adding backup auth headers to thought record query", { userId: user.id });
          headers['x-auth-user-id'] = String(user.id);
          headers['x-auth-fallback'] = 'true';
          headers['x-auth-timestamp'] = String(Date.now());
        }
        
        const response = await fetch(url, { 
          method: 'GET',
          headers 
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch thought record: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Thought record retrieved successfully:", data);
        return data;
      } catch (error) {
        console.error("Error fetching thought record:", error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch assignment details if we have an assignmentId
  const { data: assignment, isLoading: isLoadingAssignment, error: assignmentError, isError: isAssignmentError } = useQuery({
    queryKey: [`/api/reframe-coach/assignments/${assignmentId || 0}`],
    enabled: !!assignmentId && !isQuickPractice,
    retry: 1, // Minimize retries to show error quicker
    retryDelay: 1000,
  });
  
  // For quick practice mode: fetch practice scenarios directly
  // More detailed logging about the query parameters
  console.log("Practice scenarios query params:", { 
    isQuickPractice, 
    isQuickPracticeParam,
    thoughtId, 
    userId, 
    enabled: isQuickPractice && !!thoughtId && !!userId,
    isAuthenticated: !!user,
    queryString: location.split('?')[1] || ''
  });
  
  // Enhanced query with more robust error handling and retries
  // Only enable when in Quick Practice mode and we have the required IDs
  const { data: practiceScenarios, isLoading: isLoadingScenarios, error: scenariosError, isError: isScenariosError } = useQuery({
    queryKey: [`/api/users/${userId || 0}/thoughts/${thoughtId || 0}/practice-scenarios?isQuickPractice=true`], // Add param to queryKey
    enabled: isQuickPractice === true && !!thoughtId && !!userId && !!user,
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
    // Log the thought record data to debug cognitive distortions
    if (thoughtRecord) {
      console.log("Thought record data:", {
        id: (thoughtRecord as any)?.id,
        automaticThoughts: (thoughtRecord as any)?.automaticThoughts?.substring(0, 30) + '...',
        cognitiveDistortions: (thoughtRecord as any)?.cognitiveDistortions,
        rawType: (thoughtRecord as any)?.cognitiveDistortions ? 
          typeof (thoughtRecord as any).cognitiveDistortions : 'undefined',
        isArray: Array.isArray((thoughtRecord as any)?.cognitiveDistortions)
      });
    }
  }, [practiceScenarios, scenariosError, thoughtRecord]);
  
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
  
  // Type definition for thought record to improve type safety
  interface ThoughtRecordType {
    id: number;
    userId: number;
    automaticThoughts: string;
    cognitiveDistortions?: string[];
    alternativePerspective?: string;
    evidenceFor?: string;
    evidenceAgainst?: string;
    createdAt: string;
  }
  
  // Create a default thought record for type safety
  const defaultThoughtRecord: ThoughtRecordType = {
    id: 0,
    userId: userId || 0,
    automaticThoughts: "No thought content available",
    cognitiveDistortions: ["unknown"],
    alternativePerspective: "Consider a more balanced view of the situation",
    evidenceFor: "",
    evidenceAgainst: "",
    createdAt: new Date().toISOString()
  };
  
  // Cast the thought record data to our defined type for better type safety
  const thoughtRecordData: ThoughtRecordType = thoughtRecord ? 
    { 
      id: (thoughtRecord as any)?.id || 0,
      userId: (thoughtRecord as any)?.userId || userId || 0,
      automaticThoughts: (thoughtRecord as any)?.automaticThoughts || "No thought content available",
      cognitiveDistortions: Array.isArray((thoughtRecord as any)?.cognitiveDistortions) ? 
        (thoughtRecord as any)?.cognitiveDistortions : ["unknown"],
      alternativePerspective: (thoughtRecord as any)?.alternativePerspective || "Consider a more balanced view of the situation",
      evidenceFor: (thoughtRecord as any)?.evidenceFor || "",
      evidenceAgainst: (thoughtRecord as any)?.evidenceAgainst || "",
      createdAt: (thoughtRecord as any)?.createdAt || new Date().toISOString()
    } : defaultThoughtRecord;
  
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
                    Return to Reframe Coach
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/thoughts'}
                  >
                    Return to Thought Records
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
                  {isQuickPractice && (
                    <CardDescription>
                      Working with your thought: <span className="font-medium">{thoughtRecordData.automaticThoughts.substring(0, 80)}...</span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This interactive exercise will help you practice identifying and challenging unhelpful thinking patterns.
                    You'll be presented with scenarios and asked to select the most helpful reframing option.
                  </p>
                  
                  {isQuickPractice && thoughtRecordData.cognitiveDistortions && thoughtRecordData.cognitiveDistortions.length > 0 && (
                    <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-100">
                      <h4 className="text-sm font-medium text-amber-800 mb-1">Cognitive Distortions Identified:</h4>
                      <div className="flex flex-wrap gap-1">
                        {thoughtRecordData.cognitiveDistortions.map((distortion: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                            {distortion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="mt-2 text-muted-foreground">
                    Each correct answer earns points, and you can track your progress over time.
                  </p>
                </CardContent>
              </Card>
              
              {/* Reframe Practice Component with explicitly passed parameters */}
              {isQuickPractice ? (
                // For quick practice, we'll directly generate scenarios in the component
                // instead of relying on separate API calls that may fail
                <ReframePractice 
                  userId={userId} 
                  thoughtRecordId={thoughtId}
                  practiceScenarios={{
                    scenarios: [
                      {
                        scenario: `Practice reframing this thought: "${thoughtRecordData.automaticThoughts}"`,
                        cognitiveDistortion: Array.isArray(thoughtRecordData.cognitiveDistortions) && 
                          thoughtRecordData.cognitiveDistortions.length > 0 ? 
                          thoughtRecordData.cognitiveDistortions[0] : "unknown",
                        emotionCategory: "unknown",
                        options: [
                          {
                            text: `${thoughtRecordData.alternativePerspective || "Consider a more balanced view of the situation."}`,
                            isCorrect: true,
                            explanation: "This is a more balanced perspective."
                          },
                          {
                            text: `${thoughtRecordData.automaticThoughts}`,
                            isCorrect: false,
                            explanation: "This repeats the unhelpful thought pattern."
                          },
                          {
                            text: "I should ignore these thoughts completely.",
                            isCorrect: false,
                            explanation: "Ignoring thoughts doesn't help address them constructively."
                          }
                        ]
                      }
                    ],
                    thoughtContent: thoughtRecordData.automaticThoughts,
                    generalFeedback: "Remember that practicing reframing takes time. Each attempt helps build your skills."
                  }}
                  isQuickPractice={true}
                />
              ) : (
                <ReframePractice 
                  userId={userId} 
                  thoughtRecordId={thoughtId}
                  assignmentId={assignmentId}
                  practiceScenarios={(assignment as any)?.reframeData}
                  isQuickPractice={isQuickPractice}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReframePracticePage;