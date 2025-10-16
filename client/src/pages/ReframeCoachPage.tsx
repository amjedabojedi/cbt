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
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import useActiveUser from "@/hooks/use-active-user";
import { BackToClientsButton } from "@/components/navigation/BackToClientsButton";

export default function ReframeCoachPage() {
  const { user } = useAuth();
  const { isViewingClientData, activeUserId } = useActiveUser();
  const userId = activeUserId || user?.id;
  const [location, navigate] = useLocation();
  
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

  // Progress badges for ModuleHeader
  const badges = [
    { label: "Total Sessions", value: `${totalSessions}`, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
    { label: "Avg Score", value: `${avgScore} pts`, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
    { label: "Streak", value: `${currentStreak} days`, color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  ];

  return (
    <AppLayout title="Reframe Coach">
      <div className="container mx-auto px-4 py-6">
        {/* Back to Clients button */}
        <BackToClientsButton />
        
        {/* Module Header */}
        <ModuleHeader
          title="Reframe Coach"
          description="Practice cognitive reframing with interactive exercises based on your thought records"
          badges={badges}
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
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
