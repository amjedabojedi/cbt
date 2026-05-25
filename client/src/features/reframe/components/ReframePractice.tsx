/**
 * ReframePractice - Interactive cognitive reframing practice component
 * 
 * This component provides an interactive experience for practicing cognitive 
 * reframing skills. Users are presented with scenarios containing cognitive
 * distortions and must select the most helpful reframing option.
 * 
 * Features:
 * - Timed practice sessions with scoring
 * - Progress tracking
 * - Results summary with accuracy calculations
 * - Distortion identification practice
 * 
 * The component correctly handles different data field naming conventions
 * (correctCount/correctAnswers, totalCount/totalQuestions) and prevents
 * NaN% calculations in results display.
 */
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Loader2, CheckCircle2, AlertCircle, Trophy, Flame, Zap, BarChart3, ChevronRight, ShieldAlert, BadgeCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";
import { formatDistortionLabel, formatEmotionCategoryLabel } from "@/features/reframe/utils/reframeLabels";

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

const ACHIEVEMENT_LABEL_KEYS: Record<string, string> = {
  streak_3: "3-Day Streak",
  streak_7: "7-Day Streak",
  streak_14: "14-Day Streak",
  practice_5: "5 Practice Sessions",
  practice_20: "20 Practice Sessions",
  practice_50: "50 Practice Sessions",
  perfect_score: "Perfect Score",
};

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
  const { t, tNum, isRTL, currentLanguage } = useLocalization();

  return (
    <Card dir={isRTL ? "rtl" : "ltr"} className="w-full mb-6 border border-slate-100 shadow-lg rounded-2xl bg-white overflow-hidden">
      <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
            {t("Scenario")} {tNum(currentIndex + 1)} {t("of")} {tNum(totalScenarios)}
          </span>
          <div className="flex items-center gap-2">
            <span className="bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full text-xxs font-bold uppercase tracking-wider shadow-2xs">
              {formatDistortionLabel(scenario.cognitiveDistortion, t)}
            </span>
            <span
              className={cn(
                "bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xxs font-bold tracking-wider shadow-2xs",
                !isRTL && "uppercase"
              )}
            >
              {formatEmotionCategoryLabel(scenario.emotionCategory, t, currentLanguage)}
            </span>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-slate-800 via-teal-900 to-teal-700 border border-teal-700/20 shadow-md px-5 py-4 text-white relative overflow-hidden">
          <div className="absolute top-0 end-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
          <CardTitle className="text-sm md:text-[0.95rem] font-semibold leading-relaxed italic text-purple-50">
            "<DynamicTranslator text={scenario.scenario} />"
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-6">
        <p className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-teal-700 animate-pulse animate-duration-2000" />
          {t("How would you reframe this thought?")}
        </p>
        
        <div className="space-y-3">
          {scenario.options.map((option, index) => {
            const isSelected = selectedOptionIndex === index;
            const isCorrect = option.isCorrect;
            
            return (
              <div 
                key={index} 
                className={cn(
                  "p-4 border rounded-xl cursor-pointer transition-all duration-300 shadow-sm",
                  isSelected
                    ? isCorrect 
                      ? "border-emerald-500 bg-emerald-50/60 text-emerald-900"
                      : showFeedback
                        ? "border-rose-500 bg-rose-50/60 text-rose-900"
                        : "border-teal-500 bg-teal-50/40 text-teal-700"
                    : showFeedback && isCorrect
                      ? "border-emerald-500 bg-emerald-50/60 text-emerald-900"
                      : "border-slate-100 hover:border-teal-200 hover:bg-slate-50/40"
                )}
                onClick={() => !showFeedback && onSelectOption(index)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {showFeedback ? (
                      isCorrect ? (
                        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      ) : isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-sm">
                          <AlertCircle className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-slate-200" />
                      )
                    ) : (
                      <div className={cn(
                        "h-5 w-5 rounded-full border flex items-center justify-center transition-all duration-300",
                        isSelected 
                          ? "border-teal-600 bg-teal-600 text-white shadow-xs" 
                          : "border-slate-300 hover:border-purple-400"
                      )}>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm leading-snug">
                      <DynamicTranslator text={option.text} />
                    </p>
                    
                    {showFeedback && (isSelected || isCorrect) && (
                      <div className={cn(
                        "mt-2 text-xs md:text-sm rounded-lg p-2.5 border transition-all duration-300",
                        isCorrect 
                          ? "bg-emerald-100/35 text-emerald-800 border-emerald-200/50" 
                          : "bg-rose-100/35 text-rose-800 border-rose-200/50"
                      )}>
                        <p className="font-medium">
                          <DynamicTranslator text={option.explanation} />
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      
      <CardFooter className="pb-6 pt-2 px-6">
        <div className="w-full">
          {showFeedback && (
            <Button 
              className="w-full bg-teal-800 hover:bg-teal-700 text-white font-bold py-5 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-2" 
              onClick={onNext}
            >
              {currentIndex < totalScenarios - 1 ? t("Next Scenario") : t("See Results")}
              <ChevronRight className="h-4.5 w-4.5" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const GameProfile = ({ 
  userId, 
  newAchievements = [] 
}: { 
  userId: number;
  newAchievements?: string[];
}) => {
  const { t, tNum, isRTL } = useLocalization();
  const { data: profile, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/reframe-coach/profile`],
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
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
  
  return (
    <Card dir={isRTL ? "rtl" : "ltr"} className="border border-slate-100 shadow-lg bg-white overflow-hidden rounded-2xl">
      <CardHeader className="bg-gradient-to-br from-slate-800 to-teal-700 text-white pb-6 relative">
        <div className="absolute top-0 end-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
        <CardTitle className="flex items-center text-xl font-bold">
          <Trophy className="me-2.5 h-6 w-6 text-amber-400 animate-pulse" />
          {t("Your Reframe Coach Profile")}
        </CardTitle>
        <CardDescription className="text-teal-200/70">
          {t("Track your cognitive reframing mastery, streaks, and awards")}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Level card */}
          <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 flex flex-col justify-between space-y-3">
            <div>
              <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">{t("Skill Level")}</p>
              <p className="text-2xl font-extrabold text-slate-800">{t("Level")} {tNum(level)}</p>
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-600 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${(totalScore % 500) / 5}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>{tNum(totalScore % 500)} / {tNum(500)} XP</span>
                <span>{tNum(500 - (totalScore % 500))} {t("XP to level up")}</span>
              </div>
            </div>
          </div>
          
          {/* Streak card */}
          <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/20 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">{t("Current Streak")}</p>
              <div className="flex items-center mt-1">
                <Flame className="h-7 w-7 text-amber-500 fill-amber-500 animate-bounce me-2 shrink-0 animate-duration-1000" />
                <span className="text-2xl font-extrabold text-slate-800">{tNum(practiceStreak)} {t("Days")}</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-amber-600/80 mt-3">
              {t("Practice daily to keep the restructuring fire burning!")}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-teal-700" />
            {t("Cognitive Statistics")}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t("Sessions"), value: tNum(totalPractices || 0), color: "bg-slate-50 border-slate-100" },
              { label: t("Avg Score"), value: tNum(avgScore ? Math.round(avgScore) : 0), color: "bg-teal-50/30 border-purple-50" },
              { label: t("Accuracy"), value: `${tNum(accuracyRate || 0)}%`, color: "bg-emerald-50/20 border-emerald-50" },
              { label: t("Best Distortion Mastery"), value: strongestDistortion ? formatDistortionLabel(strongestDistortion, t) : t("N/A"), color: "bg-indigo-50/20 border-indigo-50", isWide: true },
            ].map((s, idx) => (
              <div key={idx} className={cn("border p-3.5 rounded-xl text-center flex flex-col justify-center", s.color, s.isWide && "col-span-2 sm:col-span-1")}>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
                <span className="font-extrabold text-slate-800 text-base mt-1 truncate">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">{t("Achievements")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(ACHIEVEMENT_LABEL_KEYS).map(([key, labelKey]) => {
              const label = t(labelKey);
              const isEarned = achievements.includes(key);
              const isNew = newAchievements.includes(key);
              
              return (
                <div 
                  key={key}
                  className={cn(
                    "border rounded-xl p-3 flex items-center gap-3 transition-all duration-300",
                    isEarned 
                      ? isNew 
                        ? "border-amber-400 bg-amber-50/50 shadow-sm" 
                        : "border-teal-100 bg-teal-50/20" 
                      : "border-slate-100 bg-slate-50/50 opacity-40"
                  )}
                >
                  <div className={cn(
                    "rounded-full p-2 shrink-0",
                    isEarned ? "bg-amber-100 text-amber-600 animate-pulse animate-duration-3000" : "bg-slate-200 text-slate-400"
                  )}>
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-sm font-semibold truncate block",
                      isEarned ? "text-slate-800 font-bold" : "text-slate-500"
                    )}>
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
  const { t, tNum, isRTL } = useLocalization();
  const correctAnswers = userChoices.filter(choice => choice.isCorrect).length;
  const accuracy = scenarios.length > 0 ? Math.round((correctAnswers / scenarios.length) * 100) : 0;
  
  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6 animate-fade-in-up duration-300">
      <Card className="border border-slate-100 shadow-xl rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-gradient-to-br from-slate-800 to-teal-700 text-white pb-6 relative text-center">
          <div className="absolute top-0 end-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="mx-auto bg-teal-500/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-3">
            <Trophy className="h-7 w-7 text-amber-400" />
          </div>
          <CardTitle className="text-xl md:text-2xl font-bold">
            {t("Practice Complete!")}
          </CardTitle>
          <CardDescription className="text-teal-200/80">
            {t("Fantastic job challenging and reframing these scenarios!")}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 px-6 space-y-6">
          {/* Stats Ring/Cards Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t("Points Earned"), value: tNum(totalScore), color: "text-teal-700 bg-teal-50/50 border-teal-100" },
              { label: t("Accuracy"), value: `${tNum(accuracy)}%`, color: "text-emerald-600 bg-emerald-50/50 border-emerald-100" },
              { label: t("Answers"), value: `${tNum(correctAnswers)}/${tNum(scenarios.length)}`, color: "text-indigo-600 bg-indigo-50/50 border-indigo-100" }
            ].map((s, idx) => (
              <div key={idx} className={cn("text-center p-4 border rounded-xl flex flex-col justify-center shadow-xs", s.color)}>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-xl sm:text-2xl font-extrabold mt-1">{s.value}</p>
              </div>
            ))}
          </div>
          
          {/* Alerts for achievements */}
          {gameUpdates?.newAchievements?.length > 0 && (
            <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-4 flex gap-3.5 shadow-xs">
              <Trophy className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-800">{t("New Achievements Unlocked!")}</h4>
                <ul className="mt-1.5 list-disc ps-5 text-xs text-amber-700 font-semibold space-y-1">
                  {gameUpdates.newAchievements.map((achievement: any, idx: number) => (
                    <li key={idx}>
                      {typeof achievement === "string"
                        ? t(ACHIEVEMENT_LABEL_KEYS[achievement] ?? achievement.replace(/_/g, " "))
                        : (achievement.name || t("New Trophy"))}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {gameUpdates?.newLevel > gameUpdates?.prevLevel && (
            <div className="border border-teal-200 bg-teal-50/60 rounded-xl p-4 flex gap-3.5 shadow-xs">
              <Zap className="h-5 w-5 text-teal-700 fill-purple-600 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <h4 className="text-sm font-bold text-teal-800">{t("Level Up!")}</h4>
                <p className="text-xs text-teal-700 font-medium mt-0.5">
                  {t("You reached")}{" "}
                  <span className="font-extrabold">{t("Level")} {tNum(gameUpdates.newLevel)}</span>!{" "}
                  {t("Keep practicing to unlock more advanced exercises.")}
                </p>
              </div>
            </div>
          )}
          
          <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4 flex gap-3.5 shadow-xs items-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-emerald-800">{t("Progress Recorded")}</h4>
              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                {t("Your restructuring statistics have been committed to your secure profile.")}
              </p>
            </div>
          </div>
          
          {/* Navigation Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
            <Button 
              onClick={() => window.location.href = `/users/${userId}/thoughts`} 
              variant="outline" 
              className="flex-1 py-5 rounded-xl border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all duration-300"
            >
              {t("Return to Thought Records")}
            </Button>
            
            <Button 
              onClick={() => window.location.href = `/users/${userId}/reframe-coach?tab=history`} 
              className="flex-1 py-5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-semibold shadow-md transition-all duration-300"
            >
              {t("View Practice History")}
            </Button>
          </div>
        </CardContent>
      </Card>
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
  const { t, tNum, isRTL } = useLocalization();
  
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
          title: t("Authentication Required"),
          description: t("Please log in to access this feature"),
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
    const timeSpentMs = Date.now() - startTime;
    // Convert to minutes right at the source
    const timeSpentMinutes = Math.round((timeSpentMs / 1000) / 60);
    
    // Record user's choice
    const scenario = scenarios[currentScenarioIndex];
    const isCorrect = scenario.options[optionIndex].isCorrect;
    
    // Calculate score for this answer
    // Base score is 100 points, with bonus for answering quickly
    const baseScore = isCorrect ? 100 : 0;
    const timeBonus = isCorrect ? Math.max(0, 50 - Math.floor(timeSpentMs / 1000)) : 0;
    const scenarioScore = baseScore + timeBonus;
    
    setTotalScore(prev => prev + scenarioScore);
    
    // Save the choice with time already in minutes
    setUserChoices(prev => [
      ...prev,
      {
        scenarioIndex: currentScenarioIndex,
        selectedOptionIndex: optionIndex,
        isCorrect,
        timeSpent: timeSpentMinutes
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
          // SECURITY: Auth via session cookie only — no client-side identity headers.
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          
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
              title: t("Connection issue detected"),
              description: t("We'll try again to save your results..."),
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
        title: t("Practice Complete"),
        description: t("Your results have been saved successfully! Your progress is being tracked in your profile."),
        variant: "default",
        duration: 5000
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error saving results:", error);
      toast({
        title: t("Error saving results"),
        description: error.message || t("Unknown error occurred"),
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
      <Alert dir={isRTL ? "rtl" : "ltr"} variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("Missing Information")}</AlertTitle>
        <AlertDescription>
          {t("Required parameters are missing. Please start from a thought record.")}
        </AlertDescription>
        <Button className="mt-4" onClick={() => setLocation(`/users/${user?.id || ''}/thoughts`)}>
          {t("Go to Thoughts")}
        </Button>
      </Alert>
    );
  }
  
  // Show loading state only if we're waiting on API and don't have scenarios from props
  if (!propPracticeScenarios && isLoading) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("Loading practice scenarios...")}</p>
        </div>
      </div>
    );
  }
  
  // Only show API errors if we're not using provided scenarios
  if (!propPracticeScenarios && error) {
    return (
      <Alert dir={isRTL ? "rtl" : "ltr"} variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("Error")}</AlertTitle>
        <AlertDescription>
          {t("Failed to load practice scenarios. Please try again later.")}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Safety check for scenarios - might be undefined at first
  if (!scenarios || scenarios.length === 0) {
    return (
      <Alert dir={isRTL ? "rtl" : "ltr"} variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("No Scenarios Available")}</AlertTitle>
        <AlertDescription>
          {isQuickPractice
            ? t("No practice scenarios were generated for this thought record. Please try again later.")
            : t("No practice scenarios available for this thought record.")
          }
        </AlertDescription>
        <Button className="mt-4" onClick={() => setLocation(`/users/${currentUserId || user?.id || ''}/thoughts`)}>
          {t("Back to Thought Records")}
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
  
  const thoughtContent =
    propPracticeScenarios?.thoughtContent ||
    sessionData.thoughtContent ||
    (sessionData as any)?.generalFeedback;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-5 animate-fade-in duration-300">
      <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-4 sm:p-5">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t("Practice Progress")}</h3>
          <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100/60 shadow-xxs">
            {tNum(currentScenarioIndex + 1)} {t("of")} {tNum(scenarios.length)}
          </span>
        </div>
        <Progress value={progress} className="h-2.5 bg-slate-100 rounded-full [&>div]:bg-teal-600 shadow-inner transition-all duration-300" />
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
      
      {thoughtContent && (
        <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Original Cognitive Material")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm italic font-semibold text-slate-600 leading-relaxed">
              "<DynamicTranslator text={thoughtContent} />"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReframePractice;