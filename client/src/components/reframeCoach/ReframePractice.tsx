import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Loader2, CheckCircle2, AlertCircle, Trophy, Flame, Zap, BarChart3, ChevronRight, ShieldAlert, BadgeCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Helper function to format cognitive distortion names for display
function formatCognitiveDistortion(distortion: string): string {
  if (!distortion) return "Unknown";
  
  // Handle special cases like hyphenated names
  if (distortion === "emotional-reasoning") return "Emotional Reasoning";
  if (distortion === "mind-reading") return "Mind Reading";
  if (distortion === "fortune-telling") return "Fortune Telling";
  if (distortion === "all-or-nothing") return "All or Nothing";
  if (distortion === "unknown") return "Cognitive Distortion";
  
  // General case: convert kebab-case or snake_case to Title Case
  return distortion
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to format emotion category names for display
function formatEmotionCategory(category: string): string {
  if (!category) return "Unknown";
  if (category === "unknown") return "Emotion";
  
  // Convert to Title Case
  return category
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Types for practice scenario data
interface PracticeOption {
  text: string;
  isCorrect: boolean;
  explanation: string;
}

interface PracticeScenario {
  scenario: string;
  options: PracticeOption[];
  cognitiveDistortion: string;
  emotionCategory: string;
}

interface PracticeSession {
  scenarios: PracticeScenario[];
  thoughtContent: string;
  generalFeedback: string;
}

interface UserChoice {
  scenarioIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeSpent: number;
}

// Component for displaying a single practice scenario
const PracticeScenario = ({ 
  scenario, 
  currentIndex, 
  totalScenarios, 
  onSelectOption,
  selectedOptionIndex,
  showFeedback,
  onNext
}: {
  scenario: PracticeScenario;
  currentIndex: number;
  totalScenarios: number;
  onSelectOption: (optionIndex: number) => void;
  selectedOptionIndex: number | null;
  showFeedback: boolean;
  onNext: () => void;
}) => {
  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Scenario {currentIndex + 1} of {totalScenarios}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
              {formatCognitiveDistortion(scenario.cognitiveDistortion)}
            </span>
            <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
              {formatEmotionCategory(scenario.emotionCategory)}
            </span>
          </div>
        </div>
        <CardTitle className="text-xl">{scenario.scenario}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="font-medium mb-4">How would you reframe this thought?</p>
        
        {scenario.options.map((option, index) => (
          <div 
            key={index} 
            className={`p-4 border rounded-md cursor-pointer transition-all ${
              selectedOptionIndex === index
                ? option.isCorrect 
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                  : showFeedback
                    ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                    : "border-primary bg-primary/5"
                : "hover:border-primary/50"
            } ${showFeedback && option.isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950/30" : ""}`}
            onClick={() => !showFeedback && onSelectOption(index)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {showFeedback ? (
                  option.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    selectedOptionIndex === index ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : null
                  )
                ) : (
                  <div className={`h-5 w-5 rounded-full border ${selectedOptionIndex === index ? "bg-primary border-primary" : "border-muted-foreground"}`}></div>
                )}
              </div>
              <div>
                <p className="font-medium">{option.text}</p>
                
                {showFeedback && (selectedOptionIndex === index || option.isCorrect) && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>{option.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="w-full">
          {showFeedback && (
            <Button 
              className="mt-4 w-full" 
              onClick={onNext}
            >
              {currentIndex < totalScenarios - 1 ? "Next Scenario" : "See Results"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

// Game profile component to show achievements and stats
const GameProfile = ({ 
  userId, 
  newAchievements = [] 
}: { 
  userId: number;
  newAchievements?: string[];
}) => {
  const { data: profile, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/reframe-coach/profile`],
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!profile) return null;
  
  // Use safe type assertion to handle potential missing properties
  const profileData = profile as any || {};
  const profileInfo = profileData.profile || {};
  const statsInfo = profileData.stats || {};
  
  const { totalScore, level, practiceStreak, achievements = [] } = profileInfo;
  const { 
    totalPractices, 
    avgScore, 
    accuracyRate, 
    strongestDistortion 
  } = statsInfo;
  
  const achievementLabels: Record<string, string> = {
    "streak_3": "3-Day Streak",
    "streak_7": "7-Day Streak",
    "streak_14": "14-Day Streak",
    "practice_5": "5 Practice Sessions",
    "practice_20": "20 Practice Sessions",
    "practice_50": "50 Practice Sessions",
    "perfect_score": "Perfect Score"
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
          Your Reframe Coach Profile
        </CardTitle>
        <CardDescription>Track your progress and achievements</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Level</p>
            <p className="text-2xl font-bold">Level {level}</p>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ 
                  width: `${(totalScore % 500) / 5}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">
              {500 - (totalScore % 500)} points to next level
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <div className="flex items-center">
              <Flame className="h-6 w-6 text-orange-500 mr-2" />
              <span className="text-2xl font-bold">{practiceStreak} days</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Practice daily to maintain your streak
            </p>
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          <h3 className="font-medium text-sm">Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Practice Sessions</span>
              <span className="font-semibold">{totalPractices || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Avg. Score</span>
              <span className="font-semibold">{avgScore ? Math.round(avgScore) : 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Accuracy</span>
              <span className="font-semibold">{accuracyRate || 0}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Best At</span>
              <span className="font-semibold">{strongestDistortion ? formatCognitiveDistortion(strongestDistortion) : "N/A"}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Achievements</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(achievementLabels).map(([key, label]) => {
              const isEarned = achievements.includes(key);
              const isNew = newAchievements.includes(key);
              
              return (
                <div 
                  key={key}
                  className={`border rounded-md p-2 ${isEarned 
                    ? isNew 
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30" 
                      : "border-primary bg-primary/5" 
                    : "border-muted bg-muted/20 opacity-50"}`}
                >
                  <div className="flex items-center">
                    <div className={`rounded-full p-1 mr-2 ${isEarned ? "bg-primary/10" : "bg-muted"}`}>
                      <Trophy className={`h-4 w-4 ${isEarned ? "text-yellow-500" : "text-muted-foreground"}`} />
                    </div>
                    <span className={`text-sm font-medium ${isNew ? "text-yellow-700 dark:text-yellow-400" : ""}`}>
                      {label}
                      {isNew && " 🎉"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Results component to show after completing all scenarios
const PracticeResults = ({ 
  userChoices, 
  scenarios, 
  totalScore, 
  userId,
  gameUpdates,
  onStartNew,
  assignmentId,
  thoughtRecordId,
  isQuickPractice
}: { 
  userChoices: UserChoice[];
  scenarios: PracticeScenario[];
  totalScore: number;
  userId: number | undefined;
  gameUpdates: any;
  onStartNew: () => void;
  assignmentId?: number;
  thoughtRecordId?: number;
  isQuickPractice?: boolean;
}) => {
  const correctAnswers = userChoices.filter(choice => choice.isCorrect).length;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Practice Results
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-muted/20 rounded-md">
              <p className="text-muted-foreground text-sm">Score</p>
              <p className="text-2xl font-bold">{totalScore}</p>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-md">
              <p className="text-muted-foreground text-sm">Correct</p>
              <p className="text-2xl font-bold">{correctAnswers} / {scenarios.length}</p>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-md">
              <p className="text-muted-foreground text-sm">Accuracy</p>
              <p className="text-2xl font-bold">
                {Math.round((correctAnswers / scenarios.length) * 100)}%
              </p>
            </div>
          </div>
          
          {gameUpdates?.newAchievements?.length > 0 && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <AlertTitle>New Achievements!</AlertTitle>
              <AlertDescription>
                You earned {gameUpdates.newAchievements.length} new {gameUpdates.newAchievements.length === 1 ? 'achievement' : 'achievements'}:
                <ul className="mt-2 list-disc pl-5">
                  {gameUpdates.newAchievements.map((achievement: string) => (
                    <li key={achievement}>{achievement.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {gameUpdates?.newLevel > gameUpdates?.prevLevel && (
            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <Zap className="h-4 w-4 text-blue-500" />
              <AlertTitle>Level Up!</AlertTitle>
              <AlertDescription>
                You've reached level {gameUpdates.newLevel}! Keep practicing to unlock more achievements.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-center flex-col items-center">
            <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Results Saved</AlertTitle>
              <AlertDescription>
                Your practice results have been saved successfully. Your progress is being tracked!
              </AlertDescription>
            </Alert>
            
            <Button onClick={onStartNew} className="mt-2 px-6 py-2 text-base">
              {isQuickPractice ? "Return to Thought Records" : "Back to Reframe Coach Dashboard"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Simplified game profile - no userId required */}
      {gameUpdates && gameUpdates.newAchievements && gameUpdates.newAchievements.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>New Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {gameUpdates.newAchievements.map((achievement: any, idx: number) => (
                <Alert key={idx} className="bg-green-50 border-green-200">
                  <BadgeCheck className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-800">Achievement Unlocked!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {achievement.name} - {achievement.description}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Props interface for the ReframePractice component
interface ReframePracticeProps {
  userId?: number;
  thoughtRecordId?: number;
  assignmentId?: number;
  practiceScenarios?: any;
  isQuickPractice?: boolean;
}

// Main component for the reframe practice feature
const ReframePractice = ({ 
  userId: propUserId, 
  thoughtRecordId: propThoughtRecordId, 
  assignmentId: propAssignmentId,
  practiceScenarios: propPracticeScenarios,
  isQuickPractice = false
}: ReframePracticeProps) => {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  // Check authentication status
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    // Check if auth has completed loading
    if (!authLoading) {
      setAuthChecked(true);
      
      // Log authentication status for debugging
      console.log("Authentication status:", {
        isAuthenticated: !!user,
        userId: user?.id,
        propUserId,
        authLoading
      });
      
      // Validate if the user is authenticated
      if (!user) {
        console.error("User not authenticated in ReframePractice component");
        toast({
          title: "Authentication Required",
          description: "Please log in to access this feature",
          variant: "destructive"
        });
      }
    }
  }, [user, authLoading, propUserId, toast]);
  const queryClient = useQueryClient();
  
  // Get query parameters
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  
  // Check if we're in quick practice mode from URL
  const urlQuickPractice = queryParams.get('isQuickPractice') === 'true';
  // Use either the prop value or URL value
  const effectiveIsQuickPractice = isQuickPractice || urlQuickPractice;
  
  // Log the quick practice status
  console.log("ReframePractice parameters:", {
    userId: propUserId,
    isQuickPractice: effectiveIsQuickPractice,
    propIsQuickPractice: isQuickPractice,
    urlIsQuickPractice: urlQuickPractice,
    hasPropPracticeScenarios: !!propPracticeScenarios,
    practiceScenarios: propPracticeScenarios,
    queryParamUserId: queryParams.get('userId'),
    queryParamThoughtId: queryParams.get('thoughtId')
  });
  
  // Safely extract userId - priority: props, then params, then query params, then user context
  const userIdParam = propUserId !== undefined 
    ? String(propUserId) 
    : (params.userId || queryParams.get('userId'));
    
  const userId = userIdParam && !isNaN(parseInt(userIdParam))
    ? parseInt(userIdParam)
    : user?.id;
    
  // Safely extract assignmentId - priority: props, then params, then query params
  const assignmentIdParam = propAssignmentId !== undefined
    ? String(propAssignmentId)
    : (params.assignmentId || queryParams.get('assignmentId'));
    
  const assignmentId = assignmentIdParam && !isNaN(parseInt(assignmentIdParam))
    ? parseInt(assignmentIdParam)
    : undefined;
    
  // Safely extract thoughtRecordId - priority: props, then params, then query params
  const thoughtIdParam = propThoughtRecordId !== undefined
    ? String(propThoughtRecordId)
    : (params.thoughtId || queryParams.get('thoughtId'));
    
  const thoughtRecordId = thoughtIdParam && !isNaN(parseInt(thoughtIdParam))
    ? parseInt(thoughtIdParam)
    : undefined;
  
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userChoices, setUserChoices] = useState<UserChoice[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [gameUpdates, setGameUpdates] = useState<any>(null);
  
  // Fix: We want to use the effectiveIsQuickPractice value we calculated earlier,
  // not the prop value which might not have been updated
  const isQuickPracticeMode = effectiveIsQuickPractice;

  // Get secure user ID from auth context as fallback if still undefined
  const currentUserId = userId || user?.id;

  // Fetch the practice scenarios, with proper validation for required parameters
  // Skip API fetch if we already have practice scenarios provided via props
  const { data: session, isLoading, error } = useQuery({
    queryKey: assignmentId 
      ? [`/api/reframe-coach/assignments/${assignmentId}`]
      : [`/api/users/${currentUserId || 0}/thoughts/${thoughtRecordId || 0}/practice-scenarios`],
    enabled: !propPracticeScenarios && !!(assignmentId || (currentUserId && thoughtRecordId)),
    // Adding a retry to give more time for params to be processed
    retry: 3,
    staleTime: 0
  });
  
  // Extract the scenarios - handling both assignment, direct generation, and provided scenarios
  // With a more careful check to avoid TypeScript errors
  const sessionData = session as any || {};
  
  // First check if scenarios were provided directly via props
  // Then fallback to API response data
  let scenarios: PracticeScenario[] = [];
  
  if (propPracticeScenarios) {
    // Use provided scenarios from props (for quick practice mode)
    scenarios = propPracticeScenarios.scenarios || [];
    console.log('Using provided practice scenarios:', scenarios);
  } else if (assignmentId) {
    // For assignment-based practice
    scenarios = (sessionData.reframeData?.scenarios || []);
  } else {
    // For direct scenarios generation
    scenarios = (sessionData.scenarios || []);
  }
  
  // Function to handle selecting an option
  const handleSelectOption = (optionIndex: number) => {
    if (showFeedback) return;
    
    setSelectedOptionIndex(optionIndex);
    setShowFeedback(true);
    
    // Calculate time spent on this scenario
    const timeSpent = Date.now() - startTime;
    
    // Record user's choice
    const scenario = scenarios[currentScenarioIndex];
    const isCorrect = scenario.options[optionIndex].isCorrect;
    
    // Calculate score for this answer
    // Base score is 100 points, with bonus for answering quickly
    const baseScore = isCorrect ? 100 : 0;
    const timeBonus = isCorrect ? Math.max(0, 50 - Math.floor(timeSpent / 1000)) : 0;
    const scenarioScore = baseScore + timeBonus;
    
    setTotalScore(prev => prev + scenarioScore);
    
    // Save the choice
    setUserChoices(prev => [
      ...prev,
      {
        scenarioIndex: currentScenarioIndex,
        selectedOptionIndex: optionIndex,
        isCorrect,
        timeSpent
      }
    ]);
  };
  
  // Function to move to the next scenario
  const handleNext = () => {
    if (currentScenarioIndex < scenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setShowFeedback(false);
      setStartTime(Date.now());
    } else {
      // All scenarios complete, show results
      setPracticeComplete(true);
    }
  };
  
  // Mutation to record practice results
  const recordResultsMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting practice results:", {
        thoughtRecordId: data.thoughtRecordId,
        userId: data.userId,
        assignmentId: data.assignmentId,
        score: data.score,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
      });
      
      // Implement retry logic for better reliability
      const maxRetries = 3;
      let retryCount = 0;
      let lastError: any = null;
      
      while (retryCount < maxRetries) {
        try {
          // Add authentication headers as backup
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          
          // Add backup auth headers if user is authenticated 
          if (user?.id) {
            console.log(`Attempt ${retryCount + 1}: Adding backup auth headers to results submission`, { userId: user.id });
            headers['x-auth-user-id'] = String(user.id);
            headers['x-auth-fallback'] = 'true';
            headers['x-auth-timestamp'] = String(Date.now());
          }
          
          // Back up the results in localStorage before making the request
          try {
            localStorage.setItem('pendingPracticeResults', JSON.stringify({
              timestamp: Date.now(),
              userId: data.userId,
              score: data.score,
              correctAnswers: data.correctAnswers,
              totalQuestions: data.totalQuestions,
              thoughtRecordId: data.thoughtRecordId || null,
              assignmentId: data.assignmentId || null
            }));
          } catch (e) {
            console.warn("Could not backup practice results to localStorage", e);
          }
          
          console.log(`Attempt ${retryCount + 1} of ${maxRetries} to save practice results...`);
          const res = await fetch('/api/reframe-coach/results', {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error(`Attempt ${retryCount + 1}: Error saving results:`, {
              status: res.status,
              statusText: res.statusText,
              errorResponse: errorText
            });
            
            throw new Error(`Failed to save results: ${res.status} ${res.statusText}`);
          }
          
          // On success, clear the backup
          localStorage.removeItem('pendingPracticeResults');
          console.log("Results saved successfully on attempt", retryCount + 1);
          return await res.json();
          
        } catch (error) {
          lastError = error;
          retryCount++;
          console.warn(`Failed to save results (attempt ${retryCount} of ${maxRetries})`, error);
          
          // Only show toast on first error to avoid multiple notifications
          if (retryCount === 1) {
            toast({
              title: "Connection issue detected",
              description: "We'll try again to save your results...",
              variant: "destructive"
            });
          }
          
          // Wait before retrying (exponential backoff)
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
          }
        }
      }
      
      console.error("All attempts to save results failed");
      throw lastError || new Error("Failed to save practice results after multiple attempts");
    },
    onSuccess: (data) => {
      console.log("Practice results saved successfully:", data);
      setGameUpdates(data.gameUpdates);
      
      // Invalidate relevant queries to refresh data
      if (currentUserId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/users/${currentUserId}/reframe-coach/profile`] 
        });
        
        if (assignmentId) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/users/${currentUserId}/reframe-coach/assignments`] 
          });
        }
      }
      
      // Show confirmation toast with more detailed information
      toast({
        title: "Practice Complete",
        description: "Your results have been saved successfully! Your progress is being tracked in your profile.",
        variant: "default", // Using default instead of success as it's in the allowed variants
        duration: 5000 // Show for 5 seconds to ensure user sees it
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error saving results:", error);
      toast({
        title: "Error saving results",
        description: error.message || "Unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Effect to record results when practice is complete
  React.useEffect(() => {
    if (practiceComplete && !recordResultsMutation.isPending && !gameUpdates) {
      const correctAnswers = userChoices.filter(choice => choice.isCorrect).length;
      
      console.log("Preparing to save practice results:", {
        userChoices,
        thoughtRecordId,
        assignmentId,
        userChoicesCount: userChoices.length,
        scenariosCount: scenarios.length,
        correctAnswers
      });
      
      // Create a simplified version of userChoices for debugging
      const userChoicesForSubmission = userChoices.map((choice) => ({
        scenarioIndex: choice.scenarioIndex,
        selectedOptionIndex: choice.selectedOptionIndex,
        isCorrect: choice.isCorrect,
        timeSpent: choice.timeSpent || 0
      }));
      
      // Create submission payload
      const submissionData = {
        ...(assignmentId ? { assignmentId } : {}),
        thoughtRecordId: thoughtRecordId || null,
        userId: currentUserId || null,
        score: totalScore,
        correctAnswers,
        totalQuestions: scenarios.length,
        streakCount: 1, // This will be calculated on the server based on previous results
        timeSpent: userChoicesForSubmission.reduce((total, choice) => total + (choice.timeSpent || 0), 0),
        scenarioData: scenarios || [],
        userChoices: userChoicesForSubmission || [],
      };
      
      console.log("Submitting practice results:", submissionData);
      
      recordResultsMutation.mutate(submissionData);
    }
  }, [practiceComplete, recordResultsMutation.isPending, gameUpdates]);
  
  // Function to start a new practice session
  const handleStartNew = () => {
    // Navigate back to thought records or reframe coach dashboard
    console.log("Starting new practice - navigating back", {
      currentUserId,
      userId: user?.id,
      isQuickPractice,
      thoughtRecordId
    });
    
    // Make sure we have a valid user ID to navigate with
    const validUserId = currentUserId || user?.id || 0;
    
    // Determine the destination based on practice type
    const destination = isQuickPractice 
      ? `/users/${validUserId}/thoughts`
      : `/users/${validUserId}/reframe-coach`;
    
    console.log(`Navigating to: ${destination}`);
    
    // Use direct window location navigation for reliability
    window.location.href = destination;
  };
  
  // First check for missing required parameters - but only after we've loaded
  // This prevents flashing the error message before params are fully processed
  // Skip this check if we have practice scenarios directly provided via props
  if (!propPracticeScenarios && !isLoading && (!currentUserId || (!thoughtRecordId && !assignmentId))) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Missing Information</AlertTitle>
        <AlertDescription>
          Required parameters are missing. Please start from a thought record.
        </AlertDescription>
        <Button className="mt-4" onClick={() => setLocation(`/users/${user?.id || ''}/thoughts`)}>
          Go to Thoughts
        </Button>
      </Alert>
    );
  }
  
  // Show loading state only if we're waiting on API and don't have scenarios from props
  if (!propPracticeScenarios && isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading practice scenarios...</p>
        </div>
      </div>
    );
  }
  
  // Only show API errors if we're not using provided scenarios
  if (!propPracticeScenarios && error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load practice scenarios. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Safety check for scenarios - might be undefined at first
  if (!scenarios || scenarios.length === 0) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Scenarios Available</AlertTitle>
        <AlertDescription>
          {isQuickPractice 
            ? "No practice scenarios were generated for this thought record. Please try again later."
            : "No practice scenarios available for this thought record."
          }
        </AlertDescription>
        <Button className="mt-4" onClick={() => setLocation(`/users/${currentUserId || user?.id || ''}/thoughts`)}>
          Back to Thought Records
        </Button>
      </Alert>
    );
  }
  
  if (practiceComplete) {
    return (
      <PracticeResults 
        userChoices={userChoices}
        scenarios={scenarios}
        totalScore={totalScore}
        userId={userId || 0}
        gameUpdates={gameUpdates}
        onStartNew={handleStartNew}
        assignmentId={assignmentId}
        thoughtRecordId={thoughtRecordId}
        isQuickPractice={isQuickPractice}
      />
    );
  }
  
  // Calculate progress (with safety check for division by zero)
  const scenariosCount = scenarios.length || 1; // Avoid division by zero
  const progress = ((currentScenarioIndex + (showFeedback ? 0.5 : 0)) / scenariosCount) * 100;
  
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Progress</h3>
          <span className="text-sm text-muted-foreground">
            {currentScenarioIndex + 1} of {scenarios.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <PracticeScenario
        scenario={scenarios[currentScenarioIndex]}
        currentIndex={currentScenarioIndex}
        totalScenarios={scenarios.length}
        onSelectOption={handleSelectOption}
        selectedOptionIndex={selectedOptionIndex}
        showFeedback={showFeedback}
        onNext={handleNext}
      />
      
      {/* Original thought display */}
      {sessionData.thoughtContent && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Original Thought</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic">{sessionData.thoughtContent}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReframePractice;