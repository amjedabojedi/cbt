import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Loader2, CheckCircle2, AlertCircle, Trophy, Flame, Zap, BarChart3, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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
              {scenario.cognitiveDistortion}
            </span>
            <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
              {scenario.emotionCategory}
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
  
  const { totalScore, level, practiceStreak, achievements = [] } = profile.profile;
  const { 
    totalPractices, 
    avgScore, 
    accuracyRate, 
    strongestDistortion 
  } = profile.stats;
  
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
              <span className="font-semibold">{strongestDistortion || "N/A"}</span>
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
  thoughtRecordId
}: { 
  userChoices: UserChoice[];
  scenarios: PracticeScenario[];
  totalScore: number;
  userId: number;
  gameUpdates: any;
  onStartNew: () => void;
  assignmentId?: number;
  thoughtRecordId: number;
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
          
          <div className="flex justify-center">
            <Button onClick={onStartNew} className="mt-4">
              Start New Practice
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <GameProfile userId={userId} newAchievements={gameUpdates?.newAchievements || []} />
    </div>
  );
};

// Props interface for the ReframePractice component
interface ReframePracticeProps {
  userId?: number;
  thoughtRecordId?: number;
  assignmentId?: number;
}

// Main component for the reframe practice feature
const ReframePractice = ({ 
  userId: propUserId, 
  thoughtRecordId: propThoughtRecordId, 
  assignmentId: propAssignmentId 
}: ReframePracticeProps = {}) => {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get query parameters
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  
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
  
  // Fetch the practice scenarios, with proper validation for required parameters
  const { data: session, isLoading, error } = useQuery({
    queryKey: assignmentId 
      ? [`/api/reframe-coach/assignments/${assignmentId}`]
      : (userId && thoughtRecordId)
        ? [`/api/users/${userId}/thoughts/${thoughtRecordId}/practice-scenarios`]
        : null,
    enabled: !!(assignmentId || (userId && thoughtRecordId)),
    onSuccess: () => {
      // Reset the timer when scenarios are loaded
      setStartTime(Date.now());
    }
  });
  
  // Extract the scenarios - handling both assignment and direct generation
  // With a more careful check to avoid TypeScript errors
  const scenarios = assignmentId
    ? (session && 'reframeData' in session && session.reframeData && 'scenarios' in session.reframeData 
        ? session.reframeData.scenarios 
        : [])
    : (session && 'scenarios' in session ? session.scenarios : []);
  
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
      const res = await apiRequest(
        "POST",
        "/api/reframe-coach/results",
        data
      );
      return await res.json();
    },
    onSuccess: (data) => {
      setGameUpdates(data.gameUpdates);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${userId}/reframe-coach/profile`] 
      });
      
      if (assignmentId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/users/${userId}/reframe-coach/assignments`] 
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving results",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Effect to record results when practice is complete
  React.useEffect(() => {
    if (practiceComplete && !recordResultsMutation.isPending && !gameUpdates) {
      const correctAnswers = userChoices.filter(choice => choice.isCorrect).length;
      
      recordResultsMutation.mutate({
        assignmentId,
        thoughtRecordId,
        score: totalScore,
        correctAnswers,
        totalQuestions: scenarios.length,
        streakCount: 1, // This will be calculated on the server based on previous results
        timeSpent: userChoices.reduce((total, choice) => total + choice.timeSpent, 0),
        scenarioData: scenarios,
        userChoices
      });
    }
  }, [practiceComplete, recordResultsMutation.isPending, gameUpdates]);
  
  // Function to start a new practice session
  const handleStartNew = () => {
    // Navigate back to thought records
    setLocation(`/users/${userId}/thoughts`);
  };
  
  // First check for missing required parameters
  if (!userId || (!thoughtRecordId && !assignmentId)) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Missing Information</AlertTitle>
        <AlertDescription>
          Required parameters are missing. Please start from a thought record.
        </AlertDescription>
        <Button className="mt-4" onClick={() => setLocation('/thoughts')}>
          Go to Thoughts
        </Button>
      </Alert>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading practice scenarios...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
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
  
  if (scenarios.length === 0) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Scenarios Available</AlertTitle>
        <AlertDescription>
          No practice scenarios available for this thought record.
        </AlertDescription>
        <Button className="mt-4" onClick={() => setLocation(`/users/${userId}/thoughts`)}>
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
        userId={userId}
        gameUpdates={gameUpdates}
        onStartNew={handleStartNew}
        assignmentId={assignmentId}
        thoughtRecordId={thoughtRecordId}
      />
    );
  }
  
  // Calculate progress
  const progress = ((currentScenarioIndex + (showFeedback ? 0.5 : 0)) / scenarios.length) * 100;
  
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
      {session?.thoughtContent && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Original Thought</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic">{session.thoughtContent}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReframePractice;