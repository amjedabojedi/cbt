/**
 * ReframePracticePage - Page for interactive cognitive reframing practice
 * 
 * This page provides an interactive practice experience for cognitive reframing.
 * It can be used to practice with scenarios generated from an existing thought 
 * record or with general reframing scenarios.
 * 
 * Key components:
 * - Practice interface with scenario presentation
 * - Multiple-choice reframe selection
 * - Score tracking and results display
 * - History of previous practice sessions
 * 
 * The component supports different data formats and prevents calculation errors
 * when working with completions data.
 */
import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import ReframePractice from "@/components/reframeCoach/ReframePractice";
import ReframePracticeHistory from "@/components/reframeCoach/ReframePracticeHistory";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";

// Helper function to format cognitive distortion names for display
function formatCognitiveDistortion(distortion: string): string {
  if (!distortion) return "Unknown";
  
  // Handle special cases like hyphenated names
  if (distortion === "emotional-reasoning") return "Emotional Reasoning";
  if (distortion === "mind-reading") return "Mind Reading";
  if (distortion === "fortune-telling") return "Fortune Telling";
  if (distortion === "all-or-nothing") return "All or Nothing";
  if (distortion === "should-statements") return "Should Statements";
  if (distortion === "unknown") return "Cognitive Distortion";
  
  // General case: convert kebab-case or snake_case to Title Case
  return distortion
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
  
  // Extended type to include fromCache flag
  interface ExtendedPracticeSession {
    scenarios: any[];
    thoughtContent: string;
    generalFeedback: string;
    fromCache?: boolean;
  }
  
  // Check if the results are coming from cache
  const isFromCache = (practiceScenarios as ExtendedPracticeSession | undefined)?.fromCache === true;
  
  // Log results for debugging
  useEffect(() => {
    if (practiceScenarios) {
      const scenariosWithCache = practiceScenarios as ExtendedPracticeSession;
      console.log(`Practice scenarios loaded successfully (${scenariosWithCache.fromCache ? 'from cache' : 'new generation'})`, scenariosWithCache);
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
    automaticThoughts: "",
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
      automaticThoughts: (thoughtRecord as any)?.automaticThoughts || "",
      cognitiveDistortions: Array.isArray((thoughtRecord as any)?.cognitiveDistortions) ? 
        (thoughtRecord as any)?.cognitiveDistortions : [],
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
  
  // Make sure we never display "No thought content available" in the title
  const title = assignment 
    ? "Reframe Practice Assignment" 
    : (thoughtRecordData.automaticThoughts && thoughtRecordData.automaticThoughts !== "No thought content available")
      ? `Practice: ${thoughtRecordData.automaticThoughts.slice(0, 50)}${thoughtRecordData.automaticThoughts.length > 50 ? '...' : ''}`
      : "Cognitive Restructuring Practice";

  return (
    <AppLayout title={title}>
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
          
          {/* Practice History Component - Shows practice history for this thought record */}
          {thoughtId && userId && !isLoadingScenarios && !isLoadingThought && (
            <div className="mb-6">
              <ReframePracticeHistory 
                userId={userId} 
                thoughtId={thoughtId} 
              />
            </div>
          )}
          
          {isLoading || isLoadingScenarios ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground text-center font-medium">
                {isLoadingScenarios ? (
                  isFromCache ? 
                    "Retrieving practice scenarios from cache..." : 
                    "Generating practice scenarios based on your thought record. This may take up to 30 seconds..."
                ) : "Loading..."}
              </p>
              {isLoadingScenarios && !isFromCache && (
                <div className="max-w-md mt-6 w-full bg-muted rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                  <div className="bg-primary h-3 rounded-full animate-progress"></div>
                </div>
              )}
              {isLoadingScenarios && isFromCache && (
                <>
                  <div className="max-w-md mt-4 w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full h-3 overflow-hidden">
                    <div className="bg-emerald-500 h-3 rounded-full animate-quick-progress"></div>
                  </div>
                  <div className="max-w-md mt-2 flex items-center gap-2 justify-center animate-pulse-slow">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Using cached results for faster loading</span>
                  </div>
                </>
              )}
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
                <CardDescription className="text-red-700 dark:text-red-400">
                  Error encountered at {new Date().toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {isQuickPractice 
                      ? `We couldn't generate practice scenarios for this thought record. It may have insufficient content or no cognitive distortions identified. Try selecting a different thought record with clearer cognitive distortions.`
                      : `We couldn't find practice assignment #${assignmentId}. It may have been deleted or you may not have permission to access it.`
                    }
                  </p>
                  
                  <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-md border border-red-200 dark:border-red-800">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Error Details:</p>
                    <pre className="text-xs mt-1 bg-white/50 dark:bg-black/20 p-2 rounded overflow-auto max-h-24">
                      {isQuickPractice 
                        ? (scenariosError?.message || "Failed to generate practice scenarios") 
                        : (assignmentError?.message || "Assignment not found")
                      }
                    </pre>
                  </div>
                  
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                      className="flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Try Again
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => window.location.href = isQuickPractice ? `/users/${userId}/thoughts` : '/reframe-coach'}
                    >
                      Return to {isQuickPractice ? "Thought Records" : "Reframe Coach"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => window.history.back()}
                    >
                      Go Back
                    </Button>
                  </div>
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
                      Working with your thought: <span className="font-medium">
                        {thoughtRecord && (thoughtRecord as any).automaticThoughts && (thoughtRecord as any).automaticThoughts !== "No thought content available"
                          ? `${(thoughtRecord as any).automaticThoughts.substring(0, 80)}${(thoughtRecord as any).automaticThoughts.length > 80 ? '...' : ''}` 
                          : practiceScenarios && Array.isArray((practiceScenarios as any)?.scenarios) && (practiceScenarios as any).scenarios.length > 0
                            ? "Practice scenarios based on cognitive distortions found in your thought record" 
                            : 'Please select a thought record'}
                      </span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This interactive exercise will help you practice identifying and challenging unhelpful thinking patterns.
                    You'll be presented with scenarios and asked to select the most helpful reframing option.
                  </p>
                  
                  {isQuickPractice && practiceScenarios && Array.isArray((practiceScenarios as any)?.scenarios) && (practiceScenarios as any).scenarios.length > 0 ? (
                    <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-100">
                      <h4 className="text-sm font-medium text-amber-800 mb-1">Cognitive Distortions Identified:</h4>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          // Create a set of unique distortions
                          const uniqueDistortions = new Set<string>();
                          
                          // Add distortions from scenarios
                          (practiceScenarios as any).scenarios.forEach((scenario: any) => {
                            if (scenario.cognitiveDistortion) {
                              uniqueDistortions.add(formatCognitiveDistortion(scenario.cognitiveDistortion));
                            }
                          });
                          
                          // Add distortions from thought record
                          if (thoughtRecordData.cognitiveDistortions && thoughtRecordData.cognitiveDistortions.length > 0) {
                            thoughtRecordData.cognitiveDistortions.forEach((distortion: string) => {
                              uniqueDistortions.add(formatCognitiveDistortion(distortion));
                            });
                          }
                          
                          // Return array of JSX elements with unique distortions
                          return Array.from(uniqueDistortions).map((distortion, idx) => (
                            <span key={`distortion-${idx}`} className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                              {distortion}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  ) : null}
                  
                  <p className="mt-2 text-muted-foreground">
                    Each correct answer earns points, and you can track your progress over time.
                  </p>
                </CardContent>
              </Card>
              
              {/* Reframe Practice Component with explicitly passed parameters */}
              {isQuickPractice ? (
                // For quick practice, we'll use the API-generated scenarios from the server
                // This ensures we get content relevant to the actual thought record
                practiceScenarios ? (
                  <ReframePractice 
                    userId={userId} 
                    thoughtRecordId={thoughtId}
                    isQuickPractice={true}
                    practiceScenarios={practiceScenarios}
                  />
                ) : (
                  // Show loading state while waiting for scenarios to be generated
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Generating relevant practice scenarios...</span>
                  </div>
                )
              ) : (
                // For assignment-based practice
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
    </AppLayout>
  );
};

export default ReframePracticePage;