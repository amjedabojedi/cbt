import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import GettingStarted from "@/components/dashboard/GettingStarted";
import QuickActions from "@/components/dashboard/QuickActions";
import EmotionHistory from "@/components/dashboard/EmotionHistory";
import MoodTrends from "@/components/dashboard/MoodTrends";
import ReflectionTrends from "@/components/dashboard/ReflectionTrends";
import ReflectionInsights from "@/components/dashboard/ReflectionInsights";
import CrossComponentInsights from "@/components/dashboard/CrossComponentInsights";
import { PracticeResultsSummary } from "@/components/dashboard/PracticeResultsSummary";
import TherapistStats from "@/components/dashboard/TherapistStats";
import useActiveUser from "@/hooks/use-active-user";
import { useClientContext } from "@/context/ClientContext";
import { ClientDebug } from "@/components/debug/ClientDebug";

export default function Dashboard() {
  const { user } = useAuth();
  const { activeUserId, isViewingClientData } = useActiveUser();
  const { viewingClientName } = useClientContext();
  
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
        
        {/* Mood Trends and Reflection Trends Charts */}
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
        
        {/* Practice Results Summary - displayed below charts */}
        {((isClient && !isTherapist) || (isTherapist && isViewingClientData)) && (
          <div className="mb-6">
            <PracticeResultsSummary />
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
