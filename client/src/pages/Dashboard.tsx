import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import GettingStarted from "@/components/dashboard/GettingStarted";
import QuickActions from "@/components/dashboard/QuickActions";
import TherapistStats from "@/components/dashboard/TherapistStats";
import ModuleSummaryCard from "@/components/dashboard/ModuleSummaryCard";
import { useModuleStats } from "@/hooks/use-module-stats";
import useActiveUser from "@/hooks/use-active-user";
import { useClientContext } from "@/context/ClientContext";
import { ClientDebug } from "@/components/debug/ClientDebug";
import { Heart, Brain, Lightbulb, BookOpen, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { user } = useAuth();
  const { activeUserId, isViewingClientData } = useActiveUser();
  const { viewingClientName } = useClientContext();
  const moduleStats = useModuleStats();
  
  const isTherapist = user?.role === "therapist"; // DB role still "therapist"
  const isClient = user?.role === "client";
  const isAdmin = user?.role === "admin";
  
  // For admins, redirect to admin pages or show admin-specific content
  if (isAdmin) {
    return (
      <AppLayout title="Admin Dashboard">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-800">
              Admin Dashboard
            </h1>
            <p className="text-neutral-500">
              Manage users and system settings from the navigation menu.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Administrative Functions</h2>
            <p className="text-blue-700 mb-4">Use the navigation menu to access:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>User Management - View and manage all users</li>
              <li>System Statistics - Monitor application usage</li>
              <li>Subscription Plans - Manage subscription tiers</li>
            </ul>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // Determine whose name to display
  const displayName = isViewingClientData 
    ? viewingClientName 
    : user?.name?.split(' ')[0] || 'there';
    
  // Different welcome message based on role and viewing context
  let welcomeMessage = `Welcome back, ${displayName}`;
  let subMessage = "Track your emotions, thoughts, and progress on your journey to clarity.";
  
  if (isTherapist && !isViewingClientData) {
    welcomeMessage = `Welcome back, ${displayName}`;
    subMessage = "Manage your practice and view insights about your clients.";
  } else if (isViewingClientData) {
    welcomeMessage = `${displayName}'s Dashboard`;
    subMessage = "You are viewing this client's emotion tracking and reflection data.";
  }

  // Calculate overall progress
  const totalActivities = moduleStats.emotions.total + 
                         moduleStats.thoughts.total + 
                         moduleStats.journal.total + 
                         moduleStats.goals.total +
                         moduleStats.reframe.totalPractices;
  
  const engagementScore = Math.min(100, Math.round((totalActivities / 50) * 100)); // 50 activities = 100%
  
  return (
    <AppLayout title="Dashboard">
      <div className="container mx-auto px-4 py-6">
        {/* Debug Information (Development Only) */}
        <ClientDebug />
        
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">
            {welcomeMessage}
          </h1>
          <p className="text-neutral-500">
            {subMessage}
          </p>
        </div>
        
        {/* Therapist-specific view */}
        {isTherapist && !isViewingClientData && (
          <div className="mb-6">
            <TherapistStats />
          </div>
        )}
        
        {/* Getting Started Checklist - only for client's own dashboard */}
        {isClient && !isViewingClientData && <GettingStarted />}
        
        {/* Quick Actions - for clients and when a therapist is viewing client data */}
        {((isClient && !isTherapist) || (isTherapist && isViewingClientData)) && (
          <div className="mb-6">
            <QuickActions />
          </div>
        )}
        
        {/* Overall Progress Section */}
        {((isClient && !isTherapist) || (isTherapist && isViewingClientData)) && (
          <Card className="mb-6" data-testid="overall-progress-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Engagement Score</span>
                  <span className="text-sm font-bold text-primary">{engagementScore}%</span>
                </div>
                <Progress value={engagementScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {totalActivities} total activities completed across all modules
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{moduleStats.emotions.total}</div>
                  <div className="text-xs text-muted-foreground">Emotions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{moduleStats.thoughts.total}</div>
                  <div className="text-xs text-muted-foreground">Thoughts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{moduleStats.reframe.totalPractices}</div>
                  <div className="text-xs text-muted-foreground">Practices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{moduleStats.journal.total}</div>
                  <div className="text-xs text-muted-foreground">Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{moduleStats.goals.total}</div>
                  <div className="text-xs text-muted-foreground">Goals</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Module Summary Cards */}
        {((isClient && !isTherapist) || (isTherapist && isViewingClientData)) && (
          <div className="space-y-6 mb-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Your Modules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Emotion Tracking */}
                <ModuleSummaryCard
                  title="Emotion Tracking"
                  icon={Heart}
                  color="#3b82f6"
                  backgroundColor="#dbeafe"
                  linkTo="/emotions"
                  metrics={[
                    { label: "Total", value: moduleStats.emotions.total },
                    { label: "Avg. Intensity", value: moduleStats.emotions.averageIntensity },
                    { label: "Most Common", value: moduleStats.emotions.mostCommon },
                  ]}
                />
                
                {/* Thought Records */}
                <ModuleSummaryCard
                  title="Thought Records"
                  icon={Brain}
                  color="#9333ea"
                  backgroundColor="#f3e8ff"
                  linkTo="/thought-records"
                  metrics={[
                    { label: "Total", value: moduleStats.thoughts.total },
                    { label: "Challenged", value: `${moduleStats.thoughts.challengedPercentage}%` },
                    { label: "Top ANT", value: moduleStats.thoughts.topANT },
                  ]}
                />
                
                {/* Reframe Coach */}
                <ModuleSummaryCard
                  title="Reframe Coach"
                  icon={Lightbulb}
                  color="#16a34a"
                  backgroundColor="#dcfce7"
                  linkTo="/reframe-coach"
                  metrics={[
                    { label: "Practices", value: moduleStats.reframe.totalPractices },
                    { label: "Avg. Score", value: moduleStats.reframe.averageScore },
                    { label: "Improvement", value: `${moduleStats.reframe.improvementPercentage > 0 ? '+' : ''}${moduleStats.reframe.improvementPercentage}%` },
                  ]}
                />
                
                {/* Journal */}
                <ModuleSummaryCard
                  title="Journal"
                  icon={BookOpen}
                  color="#eab308"
                  backgroundColor="#fef9c3"
                  linkTo="/journal"
                  metrics={[
                    { label: "Total", value: moduleStats.journal.total },
                    { label: "Avg. Rating", value: moduleStats.journal.averageRating },
                    { label: "Emotions", value: moduleStats.journal.emotionsDetected },
                  ]}
                />
                
                {/* Smart Goals */}
                <ModuleSummaryCard
                  title="Smart Goals"
                  icon={Target}
                  color="#6366f1"
                  backgroundColor="#e0e7ff"
                  linkTo="/goals"
                  metrics={[
                    { label: "Total", value: moduleStats.goals.total },
                    { label: "Completed", value: moduleStats.goals.completed },
                    { label: "Success Rate", value: `${moduleStats.goals.completedPercentage}%` },
                  ]}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
