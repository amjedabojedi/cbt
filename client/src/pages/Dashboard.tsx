import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import GettingStarted from "@/components/dashboard/GettingStarted";
import QuickActions from "@/components/dashboard/QuickActions";
import EmotionHistory from "@/components/dashboard/EmotionHistory";
import MoodTrends from "@/components/dashboard/MoodTrends";
import ReflectionTrends from "@/components/dashboard/ReflectionTrends";
import ReflectionInsights from "@/components/dashboard/ReflectionInsights";
import useActiveUser from "@/hooks/use-active-user";
import { useClientContext } from "@/context/ClientContext";

export default function Dashboard() {
  const { user } = useAuth();
  const { activeUserId, isViewingClientData } = useActiveUser();
  const { viewingClientName } = useClientContext();
  
  // Determine whose name to display
  const displayName = isViewingClientData 
    ? viewingClientName 
    : user?.name?.split(' ')[0] || 'there';
    
  // Different message based on whether viewing own or client's dashboard
  const welcomeMessage = isViewingClientData
    ? `${displayName}'s Dashboard`
    : `Welcome back, ${displayName}`;
    
  const subMessage = isViewingClientData
    ? "You are viewing this client's emotion tracking and reflection data."
    : "Track your emotions, thoughts, and progress on your journey to clarity.";
  
  return (
    <AppLayout title="Dashboard">
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">
            {welcomeMessage}
          </h1>
          <p className="text-neutral-500">
            {subMessage}
          </p>
        </div>
        
        {/* Getting Started Checklist - only show for user's own dashboard */}
        {!isViewingClientData && <GettingStarted />}
        
        {/* Quick Actions - only show for user's own dashboard */}
        {!isViewingClientData && (
          <div className="mb-6">
            <QuickActions />
          </div>
        )}
        
        {/* Recent Emotion History */}
        <div className="mb-6">
          <EmotionHistory limit={3} />
        </div>
        
        {/* Mood Trends and Reflection Trends Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <MoodTrends />
          </div>
          <div>
            {activeUserId && <ReflectionTrends userId={activeUserId} days={30} />}
          </div>
        </div>
        
        {/* Reflection Insights */}
        <div className="mb-6">
          <ReflectionInsights />
        </div>
      </div>
    </AppLayout>
  );
}
