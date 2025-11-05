import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import ModuleHeader from "@/components/layout/ModuleHeader";
import ThoughtRecordsList from "@/components/thought/ThoughtRecordsList";
import ReframeInsights from "@/components/reframeCoach/ReframeInsights";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThoughtRecord } from "@shared/schema";
import { 
  Loader2, 
  BarChart3, 
  Clock, 
  BrainCircuit, 
  ThumbsUp, 
  TrendingUp,
  HelpCircle,
  Target,
  Brain,
  Sparkles,
  Zap,
  ShieldAlert,
  BadgeCheck,
  ChevronRight,
  Trophy
} from "lucide-react";
import { format } from "date-fns";
import useActiveUser from "@/hooks/use-active-user";
import { BackToClientsButton } from "@/components/navigation/BackToClientsButton";

export default function ReframeCoachPage() {
  const { user } = useAuth();
  const { isViewingClientData, activeUserId } = useActiveUser();
  const userId = activeUserId || user?.id;
  const [location, navigate] = useLocation();
  const [showPracticeIntro, setShowPracticeIntro] = useState(true);
  
  // Check URL parameters for tab
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  
  // Controlled tab state - prioritize URL param, then default based on viewing context
  const [activeTab, setActiveTab] = useState<string>(
    tabParam === 'history' 
      ? "history" 
      : tabParam === 'insights'
        ? "insights"
        : isViewingClientData 
          ? "history" 
          : "practice"
  );
  
  // Handle tab change - update both state and URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    
    // Update URL with new tab parameter
    const currentPath = location.split('?')[0];
    const newUrl = `${currentPath}?tab=${newTab}`;
    navigate(newUrl, { replace: true });
  };
  
  // Sync tab state with URL parameter changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    
    // Determine the desired tab based on URL and viewing context
    let desiredTab: string;
    if (tab === 'history' || tab === 'insights') {
      desiredTab = tab;
    } else if (!isViewingClientData) {
      desiredTab = 'practice';
    } else {
      desiredTab = 'history';
    }
    
    // First, normalize the URL if it has the wrong tab parameter
    if (tab !== desiredTab) {
      const currentPath = location.split('?')[0];
      const newUrl = `${currentPath}?tab=${desiredTab}`;
      navigate(newUrl, { replace: true });
    }
    
    // Then, update state if needed
    if (desiredTab !== activeTab) {
      setActiveTab(desiredTab);
    }
  }, [location, isViewingClientData, activeTab, navigate]);
  
  // Re-sync tab when user role or viewing context changes - update both state and URL
  useEffect(() => {
    // If practice tab is not available (viewing client data) and we're on it, switch to history
    const isPracticeTabAvailable = !isViewingClientData;
    if (!isPracticeTabAvailable && activeTab === 'practice') {
      handleTabChange('history');
    }
  }, [isViewingClientData, activeTab]);

  // Fetch thought records for practice selection
  const { data: thoughtRecords, isLoading: thoughtsLoading } = useQuery<ThoughtRecord[]>({
    queryKey: [`/api/users/${userId}/thoughts`],
    enabled: !!userId,
  });

  // Fetch practice profile for stats
  const { data: profileData, isLoading: profileLoading } = useQuery<any>({
    queryKey: [`/api/users/${userId}/reframe-coach/profile`],
    enabled: !!userId,
  });

  // Fetch practice results for history
  const { data: results = [], isLoading: resultsLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/reframe-coach/results`],
    enabled: !!userId,
  });

  // Extract stats from profile
  const totalSessions = profileData?.stats?.totalPractices || 0;
  const avgScore = (profileData?.stats?.avgScore && typeof profileData.stats.avgScore === 'number')
    ? profileData.stats.avgScore.toFixed(1)
    : "0";
  const currentStreak = profileData?.profile?.practiceStreak || 0;

  return (
    <AppLayout title="Reframe Coach">
      <div className="container mx-auto px-4 py-6">
        {/* Back to Clients button */}
        <BackToClientsButton />
        
        {/* Module Header */}
        <ModuleHeader
          title="Reframe Coach"
          description="Practice cognitive reframing with interactive exercises based on your thought records"
        />
        
        {/* Overall Progress Summary */}
        {totalSessions > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Overall Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Sessions Completed</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{avgScore}</div>
                  <div className="text-sm text-muted-foreground">Avg Score</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{currentStreak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs 
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList>
            {!isViewingClientData && (
              <TabsTrigger value="practice">Start Practice</TabsTrigger>
            )}
            <TabsTrigger value="history">
              {isViewingClientData ? "Client's Practice History" : "Practice History"}
            </TabsTrigger>
            <TabsTrigger value="insights">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Insights
            </TabsTrigger>
          </TabsList>
          
          {/* Tab 1: Start Practice */}
          {!isViewingClientData && (
            <TabsContent value="practice">
              {showPracticeIntro ? (
                <Card className="w-full max-w-4xl mx-auto">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {/* Hero Section */}
                      <div className="text-center space-y-4 py-6">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Zap className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Practice Cognitive Reframing</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                          Strengthen your ability to challenge negative thoughts and develop healthier thinking patterns through interactive scenarios.
                        </p>
                      </div>

                      {/* Benefits Grid */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <ShieldAlert className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              Identify Cognitive Distortions
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-gray-700 dark:text-gray-300">
                            Recognize common thinking traps like all-or-nothing thinking, catastrophizing, and mental filtering.
                          </CardContent>
                        </Card>

                        <Card className="border-pink-200 bg-pink-50/50 dark:border-pink-800 dark:bg-pink-950/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                                <Zap className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                              </div>
                              Practice Reframing Skills
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-gray-700 dark:text-gray-300">
                            Learn to challenge unhelpful thoughts and create more balanced, realistic perspectives.
                          </CardContent>
                        </Card>

                        <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                <Trophy className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              Earn Points & Track Progress
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-gray-700 dark:text-gray-300">
                            Score points for correct answers, build streaks, and unlock achievements as you improve your reframing skills.
                          </CardContent>
                        </Card>

                        <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                                <BadgeCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                              </div>
                              Build Resilience
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-gray-700 dark:text-gray-300">
                            Develop long-term skills to manage negative thinking patterns and improve emotional well-being.
                          </CardContent>
                        </Card>
                      </div>

                      {/* What You'll Do Section */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          What You'll Do Next
                        </h3>
                        <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-semibold text-xs">1</span>
                            <span><strong>Select a thought</strong> - Choose one of your thought records to practice with</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-semibold text-xs">2</span>
                            <span><strong>Review scenarios</strong> - Read situations with automatic thoughts</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-semibold text-xs">3</span>
                            <span><strong>Choose reframes</strong> - Select the most balanced, helpful alternative thought</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-semibold text-xs">4</span>
                            <span><strong>Get feedback & results</strong> - Learn why certain reframes work and see your score</span>
                          </li>
                        </ol>
                      </div>

                      {/* Educational Tip */}
                      <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 dark:border-blue-600 p-4 rounded">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <strong className="font-semibold">💡 CBT Research:</strong> Cognitive reframing is one of the most effective techniques in Cognitive Behavioral Therapy. Regular practice can reduce anxiety and depression symptoms by up to 50% in clinical studies.
                        </p>
                      </div>

                      {/* Continue Button */}
                      <div className="flex justify-center pt-4">
                        <Button
                          size="lg"
                          onClick={() => setShowPracticeIntro(false)}
                          className="px-8"
                          data-testid="button-continue-to-select-thought"
                        >
                          Continue to Select Thought
                          <ChevronRight className="h-5 w-5 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Practice Reframing Your Thoughts</CardTitle>
                    <CardDescription>
                      Select a thought record below to begin reframing practice exercises
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Educational Accordion */}
                    <Accordion type="single" collapsible className="mb-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-4">
                      <AccordionItem value="why-practice" className="border-0">
                        <AccordionTrigger className="text-base font-medium hover:no-underline py-3">
                          <div className="flex items-center">
                            <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                            Why Practice Reframing?
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4 space-y-3">
                          <p>
                            <strong className="text-foreground">Reframing</strong> is a core skill in Cognitive Behavioral Therapy (CBT) that helps you:
                          </p>
                          <ul className="list-disc list-inside space-y-2 ml-2">
                            <li>
                              <strong className="text-foreground">Identify cognitive distortions</strong> - Recognize unhelpful thinking patterns that affect your mood
                            </li>
                            <li>
                              <strong className="text-foreground">Challenge negative thoughts</strong> - Question the validity of automatic negative thoughts
                            </li>
                            <li>
                              <strong className="text-foreground">Develop balanced perspectives</strong> - Create more realistic and helpful ways of thinking
                            </li>
                            <li>
                              <strong className="text-foreground">Build resilience</strong> - Strengthen your ability to respond to difficult situations
                            </li>
                          </ul>
                          <div className="mt-4 p-3 bg-primary/10 rounded-md border border-primary/20">
                            <p className="text-sm">
                              <Brain className="h-4 w-4 inline mr-1" />
                              <strong className="text-foreground">Practice Tip:</strong> Regular practice helps these skills become automatic, making it easier to manage difficult emotions in real-time.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Thought Records List */}
                    {thoughtsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (thoughtRecords && thoughtRecords.length > 0) ? (
                      <ThoughtRecordsList 
                        thoughtRecords={thoughtRecords} 
                        userId={userId}
                        showPracticeButton={true} 
                      />
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="pt-6 text-center">
                          <p className="text-muted-foreground mb-4">
                            You don't have any thought records yet. Create a thought record first to begin practicing reframing.
                          </p>
                          <div className="flex flex-col items-center">
                            <div className="mb-4 px-6 py-3 bg-muted/20 rounded-md max-w-md">
                              <ol className="list-decimal text-left text-sm text-muted-foreground space-y-2 ml-4">
                                <li>Create a thought record to capture your automatic thoughts</li>
                                <li>Practice reframing those thoughts with cognitive restructuring exercises</li>
                                <li>Track your progress and build skills over time</li>
                              </ol>
                            </div>
                            <Button 
                              onClick={() => window.location.href = `/users/${userId}/thoughts`}
                              className="mt-2"
                            >
                              Go to Thought Records
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
          
          {/* Tab 2: Practice History */}
          <TabsContent value="history">
            {resultsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !results || results.length === 0 ? (
              <Card className="border-dashed border-muted">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {isViewingClientData 
                      ? "This client hasn't completed any practice sessions yet." 
                      : "You haven't completed any practice sessions yet."}
                  </p>
                  {!isViewingClientData && (
                    <div className="flex flex-col items-center">
                      <div className="my-4 px-6 py-3 bg-muted/20 rounded-md max-w-md">
                        <h4 className="font-medium text-sm mb-2">How to get started:</h4>
                        <ol className="list-decimal text-left text-sm text-muted-foreground space-y-2 ml-4">
                          <li>First, create a thought record to document your thoughts</li>
                          <li>Then practice reframing those thoughts with exercises</li>
                          <li>Your practice results will appear here to track progress</li>
                        </ol>
                      </div>
                      <Button 
                        onClick={() => window.location.href = `/users/${userId}/thoughts`}
                      >
                        Go to Thought Records
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {results.map((result: any) => (
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
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-4 bg-muted/20 rounded-md">
                          <p className="text-muted-foreground text-sm">Score</p>
                          <p className="text-2xl font-bold">{result.score}</p>
                        </div>
                        <div className="text-center p-4 bg-muted/20 rounded-md">
                          <p className="text-muted-foreground text-sm">Correct</p>
                          <p className="text-2xl font-bold">
                            {result.correctAnswers || result.correctCount || 0} / {result.totalQuestions || result.totalCount || 0}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-muted/20 rounded-md">
                          <p className="text-muted-foreground text-sm">Accuracy</p>
                          <p className="text-2xl font-bold">
                            {result.successRate || (
                              (result.totalQuestions || result.totalCount) > 0 ? 
                              Math.round(((result.correctAnswers || result.correctCount || 0) / 
                                (result.totalQuestions || result.totalCount)) * 100) : 0
                            )}%
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
                              (Array.from(new Set(result.scenarioData
                                .map((scenario: any) => scenario.cognitiveDistortion)
                                .filter(Boolean)
                                .map((distortion: string) => {
                                  return distortion
                                    .replace(/-/g, ' ')
                                    .split(' ')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ');
                                })
                              )) as string[]).map((distortion: string, index: number) => (
                                <Badge key={index} variant="outline" className="bg-primary/10">
                                  <BrainCircuit className="mr-1 h-3 w-3" />
                                  {String(distortion)}
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
          </TabsContent>
          
          {/* Tab 3: Insights */}
          <TabsContent value="insights">
            <ReframeInsights userId={userId!} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
