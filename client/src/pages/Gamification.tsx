import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/layout/AppLayout";
import AchievementsList from "@/components/gamification/AchievementsList";
import ProgressTracker from "@/components/gamification/ProgressTracker";
import { useAuth } from "@/hooks/auth";
import { Loader2 } from "lucide-react";

export default function Gamification() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container py-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-2">Your Progress</h1>
        <p className="text-muted-foreground mb-6">
          Track your journey and unlock achievements
        </p>
        
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList>
            <TabsTrigger value="progress">Progress Tracker</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="progress">
            <ProgressTracker />
          </TabsContent>
          
          <TabsContent value="achievements">
            <AchievementsList />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}