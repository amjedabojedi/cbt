import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import GettingStarted from "@/components/dashboard/GettingStarted";
import QuickActions from "@/components/dashboard/QuickActions";
import EmotionHistory from "@/components/dashboard/EmotionHistory";
import MoodTrends from "@/components/dashboard/MoodTrends";
import ReflectionTrends from "@/components/dashboard/ReflectionTrends";

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <AppLayout title="Dashboard">
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-neutral-500">
            Track your emotions, thoughts, and progress on your journey to clarity.
          </p>
        </div>
        
        {/* Getting Started Checklist */}
        <GettingStarted />
        
        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions />
        </div>
        
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
            {user && <ReflectionTrends userId={user.id} days={30} />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
