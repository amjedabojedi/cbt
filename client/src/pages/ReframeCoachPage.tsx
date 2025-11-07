import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import ModuleHeader from "@/components/layout/ModuleHeader";
import ThoughtRecordsList from "@/components/thought/ThoughtRecordsList";
import ReframePracticeHistory from "@/components/reframeCoach/ReframePracticeHistory";
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
import { ThoughtRecord } from "@shared/schema";
import { 
  Loader2, 
  Target,
  Zap,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  History
} from "lucide-react";
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

  // Fetch thought records
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
          description="Practice balanced thinking with interactive exercises based on the thoughts and distortions you've already recorded"
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
          defaultValue={
            tabParam === 'insights'
              ? "insights"
              : tabParam === 'history'
                ? "history"
                : "practice"
          }
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="practice" data-testid="tab-practice">
              <Zap className="h-4 w-4 mr-1.5" />
              Practice
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-1.5" />
              History
            </TabsTrigger>
            <TabsTrigger value="insights" data-testid="tab-insights">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="practice">
            {/* Educational Accordion */}
            <Accordion type="single" collapsible className="mb-6 bg-green-50 dark:bg-green-950/30 rounded-lg px-4">
              <AccordionItem value="why-reframe" className="border-0">
                <AccordionTrigger className="text-base font-medium hover:no-underline py-3">
                  <div className="flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    Why Practice Reframing?
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  <p className="mb-3">
                    Cognitive reframing is a core CBT skill that helps you challenge and change unhelpful thinking patterns. By practicing with scenarios based on your actual thought records, you build the muscle to recognize and reframe distorted thoughts in real-time.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-slate-900/50 p-3 rounded-md">
                      <h4 className="font-medium text-foreground mb-1">Practice with Real Thoughts</h4>
                      <p>Work through interactive scenarios based on your recorded thoughts and distortions.</p>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900/50 p-3 rounded-md">
                      <h4 className="font-medium text-foreground mb-1">Build Reframing Skills</h4>
                      <p>Learn to create balanced, helpful perspectives through guided practice.</p>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900/50 p-3 rounded-md">
                      <h4 className="font-medium text-foreground mb-1">Track Progress</h4>
                      <p>Monitor your scores and improvement over time in the Insights tab.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Thought Records</CardTitle>
                <CardDescription>
                  {isViewingClientData 
                    ? "View client's thought records and practice history"
                    : "Select a thought record to practice cognitive reframing"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {thoughtsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (thoughtRecords && thoughtRecords.length > 0) ? (
                  <ThoughtRecordsList 
                    thoughtRecords={thoughtRecords} 
                    userId={userId}
                    showPracticeButton={true}
                    practiceResults={results}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full">
                      <ShieldAlert className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Thought Records Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {isViewingClientData
                        ? "This client hasn't created any thought records yet."
                        : "Create a thought record first to begin practicing cognitive reframing."}
                    </p>
                    {!isViewingClientData && (
                      <Button 
                        onClick={() => navigate(`/thoughts`)}
                        data-testid="button-go-to-thoughts"
                      >
                        Create Your First Thought Record
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <ReframePracticeHistory userId={userId!} />
          </TabsContent>
          
          <TabsContent value="insights">
            <ReframeInsights userId={userId!} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
