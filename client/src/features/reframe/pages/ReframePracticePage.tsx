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
import ReframePractice from "@/features/reframe/components/ReframePractice";
import ReframePracticeHistory from "@/features/reframe/components/ReframePracticeHistory";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";
import { formatDistortionLabel } from "@/features/reframe/utils/reframeLabels";

const ReframePracticePage = () => {
  const { user } = useAuth();
  const { t, tNum, isRTL } = useLocalization();
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
        // SECURITY: Auth via session cookie only — no client-side identity headers.
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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
    thoughtCategory?: string[];
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
    alternativePerspective: t("Consider a more balanced view of the situation"),
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
      cognitiveDistortions: Array.isArray((thoughtRecord as any)?.cognitiveDistortions)
        ? (thoughtRecord as any)?.cognitiveDistortions
        : [],
      thoughtCategory: Array.isArray((thoughtRecord as any)?.thoughtCategory)
        ? (thoughtRecord as any)?.thoughtCategory
        : [],
      alternativePerspective: (thoughtRecord as any)?.alternativePerspective || t("Consider a more balanced view of the situation"),
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
    ? t("Reframe Practice Assignment")
    : t("Cognitive Restructuring Practice");

  return (
    <AppLayout title={title}>
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50">
        {/* Premium Hero Banner */}
        <div className="-mx-2 sm:-mx-4 bg-gradient-to-br from-slate-800 via-teal-900 to-teal-700 px-6 sm:px-10 pt-8 pb-8 relative overflow-hidden transition-all duration-300 border-b border-teal-700/30">
          <div className="absolute -top-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-12 w-52 h-52 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-5xl mx-auto relative">
            <div className="flex flex-col gap-4">
              <div>
                <Button
                  variant="ghost"
                  className="text-teal-100 hover:text-white hover:bg-white/10 -ml-2 mb-2 font-medium"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="me-2 h-4 w-4" />
                  {t("Back to Coach")}
                </Button>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-teal-300 animate-pulse" />
                  <span className="text-teal-300/80 text-xs font-bold tracking-widest uppercase">
                    {t("Interactive Restructuring")}
                  </span>
                </div>
                <h1 className="font-extrabold text-white tracking-tight text-2xl md:text-3xl mb-2">
                  {title}
                </h1>
                <p className="text-teal-200/70 text-sm md:text-base max-w-2xl leading-relaxed">
                  {t("Challenge unhelpful automatic patterns, identify cognitive distortions, and practice building balanced reframes.")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main body layout */}
        <div className="max-w-5xl mx-auto pb-10 pt-6 px-4 space-y-6">
          {/* Practice History Component - Shows practice history for this thought record */}
          {thoughtId && userId && !isLoadingScenarios && !isLoadingThought && (
            <ReframePracticeHistory 
              userId={userId} 
              thoughtId={thoughtId} 
            />
          )}
          
          {isLoading || isLoadingScenarios ? (
            <div className="flex flex-col justify-center items-center py-16 bg-white border border-slate-100 shadow-sm rounded-2xl p-8">
              <Loader2 className="h-8 w-8 animate-spin text-teal-700 mb-4" />
              <p className="text-slate-600 text-center font-semibold text-sm">
                {isLoadingScenarios ? (
                  isFromCache
                    ? t("Retrieving practice scenarios from cache...")
                    : t("Generating practice scenarios based on your thought record. This may take up to 30 seconds...")
                ) : t("Loading...")}
              </p>
              {isLoadingScenarios && !isFromCache && (
                <div className="max-w-md mt-6 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-teal-600 h-2.5 rounded-full animate-progress"></div>
                </div>
              )}
              {isLoadingScenarios && isFromCache && (
                <>
                  <div className="max-w-md mt-4 w-full bg-emerald-100/50 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-500 h-2.5 rounded-full animate-quick-progress"></div>
                  </div>
                  <div className="max-w-md mt-3 flex items-center gap-2 justify-center animate-pulse-slow">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-semibold">{t("Using cached results for faster loading")}</span>
                  </div>
                </>
              )}
            </div>
          ) : navigateToThoughts ? (
            <Card className="bg-amber-50/50 border-amber-200/60 shadow-sm mb-6 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 font-bold">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  {t("Redirecting to Thought Records")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 font-medium text-sm">
                  {t("The Reframe Coach practice feature must be started from a thought record. You are being redirected to your thought records.")}
                </p>
                <div className="flex justify-center my-4">
                  <div className="h-2 w-full max-w-sm bg-amber-100/50 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 animate-pulse rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : hasError ? (
            <Card className="bg-rose-50/50 border-rose-200/60 shadow-sm mb-6 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rose-800 font-bold">
                  <AlertCircle className="h-5 w-5 text-rose-500" />
                  {isQuickPractice ? t("Failed to Load Practice Scenarios") : t("Practice Assignment Not Found")}
                </CardTitle>
                <CardDescription className="text-rose-700/80 font-medium">
                  {t("Error encountered at")} {new Date().toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 font-medium text-sm">
                  {isQuickPractice
                    ? (scenariosError?.message
                        || t("We couldn't generate practice scenarios for this thought record. It may have insufficient content or no cognitive distortions identified. Try selecting a different thought record with clearer cognitive distortions."))
                    : `${t("We couldn't find practice assignment #")}${tNum(assignmentId ?? 0)}. ${t("It may have been deleted or you may not have permission to access it.")}`
                  }
                </p>
                
                <div className="bg-rose-100/30 p-3.5 rounded-xl border border-rose-200/40">
                  <p className="text-xs font-bold text-rose-800">{t("Error Details:")}</p>
                  <pre className="text-xxs mt-1 bg-white/60 p-2 rounded-lg overflow-auto max-h-24 text-rose-900 font-mono">
                    {isQuickPractice
                      ? (scenariosError?.message || t("Failed to generate practice scenarios"))
                      : (assignmentError?.message || t("Assignment not found"))
                    }
                  </pre>
                </div>
                
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="flex items-center rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t("Try Again")}
                  </Button>
                  <Button
                    variant="default"
                    className="bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                    onClick={() => window.location.href = isQuickPractice ? `/users/${userId}/thoughts` : '/reframe-coach'}
                  >
                    {isQuickPractice ? t("Return to Thought Records") : t("Return to Reframe Coach")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Introduction card */}
              <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-slate-800">{t("Cognitive Restructuring Practice")}</CardTitle>
                  {isQuickPractice && thoughtRecordData.automaticThoughts && thoughtRecordData.automaticThoughts !== "No thought content available" && (
                    <div className="mt-3">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t("Original Automatic Thought:")}</p>
                      <div className="rounded-xl bg-teal-50/40 border border-teal-100/50 p-4 relative overflow-hidden">
                        <div className="absolute top-0 end-0 w-16 h-16 bg-teal-600/5 rounded-full blur-lg pointer-events-none" />
                        <p className="text-slate-700 italic font-semibold text-sm leading-relaxed">
                          "<DynamicTranslator text={thoughtRecordData.automaticThoughts} />"
                        </p>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    {t("This interactive restructuring exercise will help you practice identifying and challenging unhelpful thinking patterns in real-time. You will be presented with specific scenarios and asked to select the most balanced, healthy reframing option.")}
                  </p>
                  
                  {isQuickPractice && practiceScenarios && Array.isArray((practiceScenarios as any)?.scenarios) && (practiceScenarios as any).scenarios.length > 0 ? (
                    <div className="mt-4 p-4 rounded-2xl bg-teal-50/20 border border-teal-100/50">
                      <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">{t("Cognitive Distortions Identified:")}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          const uniqueDistortionKeys = new Set<string>();
                          
                          (practiceScenarios as any).scenarios.forEach((scenario: any) => {
                            if (scenario.cognitiveDistortion) {
                              uniqueDistortionKeys.add(scenario.cognitiveDistortion);
                            }
                          });
                          
                          const recordDistortions = [
                            ...(thoughtRecordData.thoughtCategory ?? []),
                            ...(thoughtRecordData.cognitiveDistortions ?? []),
                          ];
                          recordDistortions.forEach((distortion: string) => {
                            if (distortion) uniqueDistortionKeys.add(distortion);
                          });
                          
                          const seenLabels = new Set<string>();
                          return Array.from(uniqueDistortionKeys)
                            .map((distortionKey) => formatDistortionLabel(distortionKey, t))
                            .filter((label) => {
                              if (seenLabels.has(label)) return false;
                              seenLabels.add(label);
                              return true;
                            })
                            .map((label, idx) => (
                            <span 
                              key={`distortion-${idx}`} 
                              className="px-2.5 py-1 text-xs rounded-lg bg-teal-50 text-teal-700 border border-teal-100/60 font-semibold shadow-2xs"
                            >
                              {label}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  ) : null}
                  
                  <p className="text-slate-400 font-medium text-xs">
                    {t("Each successful restructuring earns you points towards your Coach Level. Your stats are tracked securely in your clinical profile.")}
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
                  <div className="flex justify-center items-center py-16 bg-white border border-slate-100 shadow-sm rounded-2xl p-8">
                    <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
                    <span className="ms-3 text-slate-600 font-semibold text-sm">{t("Generating relevant practice scenarios...")}</span>
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