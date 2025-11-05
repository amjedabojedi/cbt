import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import ModuleHeader from "@/components/layout/ModuleHeader";
import ThoughtRecordsList from "@/components/thought/ThoughtRecordsList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ThoughtRecord } from "@shared/schema";
import { 
  Loader2, 
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Trophy,
  BadgeCheck
} from "lucide-react";
import useActiveUser from "@/hooks/use-active-user";
import { BackToClientsButton } from "@/components/navigation/BackToClientsButton";

export default function ReframeCoachPage() {
  const { user } = useAuth();
  const { isViewingClientData, activeUserId } = useActiveUser();
  const userId = activeUserId || user?.id;
  const [location, navigate] = useLocation();
  const [showIntro, setShowIntro] = useState(
    typeof window !== 'undefined' ? !localStorage.getItem('hideReframeIntro') : true
  );

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

  const handleDismissIntro = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hideReframeIntro', 'true');
    }
    setShowIntro(false);
  };

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
                <CardTitle className="text-lg">Your Progress</CardTitle>
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
        
        {/* Collapsible Intro Card */}
        {!isViewingClientData && (
          <Collapsible open={showIntro} onOpenChange={setShowIntro} className="mb-6">
            <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">What is Reframe Coach?</CardTitle>
                      <CardDescription>Learn how cognitive reframing works</CardDescription>
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid="button-toggle-intro">
                      {showIntro ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              
              <CollapsibleContent>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Strengthen your ability to challenge negative thoughts and develop healthier thinking patterns through interactive scenarios.
                  </p>

                  {/* Benefits Grid */}
                  <div className="grid gap-3 md:grid-cols-3 mb-4">
                    <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <ShieldAlert className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="font-semibold text-sm">Identify Distortions</h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Recognize unhelpful thinking patterns
                      </p>
                    </div>

                    <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                          <Zap className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        </div>
                        <h4 className="font-semibold text-sm">Practice Reframing</h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Create balanced, realistic perspectives
                      </p>
                    </div>

                    <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                          <Trophy className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h4 className="font-semibold text-sm">Track Progress</h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Build streaks and unlock achievements
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleDismissIntro}
                      data-testid="button-dismiss-intro"
                    >
                      Got it, don't show this again
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
        
        {/* Main Content: Thought Records with Practice */}
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
                    onClick={() => navigate(`/users/${userId}/thoughts`)}
                    data-testid="button-go-to-thoughts"
                  >
                    Create Your First Thought Record
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
