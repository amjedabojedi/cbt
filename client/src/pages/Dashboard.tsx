import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import GettingStarted from "@/components/dashboard/GettingStarted";
import QuickActions from "@/components/dashboard/QuickActions";
import EmotionHistory from "@/components/dashboard/EmotionHistory";
import MoodTrends from "@/components/dashboard/MoodTrends";
import ReflectionTrends from "@/components/dashboard/ReflectionTrends";
import ReflectionInsights from "@/components/dashboard/ReflectionInsights";
import CrossComponentInsights from "@/components/dashboard/CrossComponentInsights";
import TherapistStats from "@/components/dashboard/TherapistStats";
import useActiveUser from "@/hooks/use-active-user";
import { useClientContext } from "@/context/ClientContext";
import { ClientDebug } from "@/components/debug/ClientDebug";

export default function Dashboard() {
  const { user } = useAuth();
  const { activeUserId, isViewingClientData } = useActiveUser();
  const { viewingClientName } = useClientContext();
  
  const isTherapist = user?.role === "therapist";
  const isClient = user?.role === "client";
  
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
        
        {/* Recent Emotion History - for clients and when a therapist is viewing client data */}
        {((isClient && !isTherapist) || (isTherapist && isViewingClientData)) && (
          <div className="mb-6">
            <EmotionHistory limit={3} />
          </div>
        )}
        
        {/* Mood Trends and Reflection Trends Charts - for clients and when a therapist is viewing client data */}
        {((isClient && !isTherapist) || (isTherapist && isViewingClientData)) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <MoodTrends />
            </div>
            <div>
              {activeUserId && <ReflectionTrends userId={activeUserId} days={30} />}
            </div>
          </div>
        )}
        
        {/* Reflection Insights - for clients and when a therapist is viewing client data */}
        {((isClient && !isTherapist) || (isTherapist && isViewingClientData)) && (
          <div className="mb-6">
            <ReflectionInsights />
          </div>
        )}
        
        {/* Cross-Component Insights - for clients and when a therapist is viewing client data */}
        {((isClient && !isTherapist) || (isTherapist && isViewingClientData)) && (
          <div className="mb-6">
            <CrossComponentInsights />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
