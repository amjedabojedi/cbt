import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, Flame, Clock, BarChart3, Plus, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Component to display a list of reframe practice assignments
const AssignmentsList = ({ userId }: { userId: number }) => {
  const [_, navigate] = useLocation();
  
  const { data: assignments, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/reframe-coach/assignments`],
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!assignments || assignments.length === 0) {
    return (
      <Card className="border-dashed border-muted">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">
            No reframe practice assignments yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Health professionals can assign practice exercises based on your thought records.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {assignments.map((assignment: any) => (
        <Card key={assignment.id} className={`${assignment.status === 'completed' ? 'bg-muted/10' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">
                Reframe Practice Assignment
              </CardTitle>
              <div className={`px-2 py-1 rounded text-xs font-semibold ${
                assignment.status === 'completed' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : assignment.isPriority 
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {assignment.status === 'completed' 
                  ? 'Completed' 
                  : assignment.isPriority 
                    ? 'Priority' 
                    : 'Assigned'}
              </div>
            </div>
            <CardDescription>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Assigned {formatDistanceToNow(new Date(assignment.assignedAt), { addSuffix: true })}
              </div>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-3">
            {assignment.notes && (
              <p className="text-sm mb-3">{assignment.notes}</p>
            )}
            
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <span className="bg-muted px-2 py-1 rounded mr-2">
                {assignment.reframeData?.scenarios?.length || 0} scenarios
              </span>
              {assignment.reframeData?.cognitiveDistortions && (
                <span className="bg-muted px-2 py-1 rounded">
                  {assignment.reframeData.cognitiveDistortions}
                </span>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            {assignment.status === 'completed' ? (
              <div className="w-full grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" onClick={() => navigate(`/users/${userId}/reframe-coach/history/${assignment.id}`)}>
                  View Results
                </Button>
                <Button variant="default" className="w-full" onClick={() => navigate(`/users/${userId}/reframe-coach/practice/assignments/${assignment.id}`)}>
                  Practice Again
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={() => navigate(`/users/${userId}/reframe-coach/practice/assignments/${assignment.id}`)}>
                Start Practice
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

// Component to display practice history and results
const PracticeHistory = ({ userId }: { userId: number }) => {
  const { data: results, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/reframe-coach/results`],
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!results || results.length === 0) {
    return (
      <Card className="border-dashed border-muted">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">
            No practice results yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Complete practice exercises to see your results and track progress.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {results.map((result: any) => (
        <Card key={result.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">
                Practice Session
              </CardTitle>
              <div className="text-sm font-medium">
                {new Date(result.createdAt).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-muted/20 rounded-md">
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="font-bold">{result.score}</p>
              </div>
              <div className="text-center p-2 bg-muted/20 rounded-md">
                <p className="text-xs text-muted-foreground">Correct</p>
                <p className="font-bold">{result.correctAnswers}/{result.totalQuestions}</p>
              </div>
              <div className="text-center p-2 bg-muted/20 rounded-md">
                <p className="text-xs text-muted-foreground">Accuracy</p>
                <p className="font-bold">
                  {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Component for the game profile summary on the dashboard
const ProfileSummary = ({ userId }: { userId: number }) => {
  const [_, navigate] = useLocation();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/reframe-coach/profile`],
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!profile) return null;
  
  const { totalScore, level, practiceStreak, achievements = [] } = profile.profile;
  const { totalPractices = 0, accuracyRate = 0 } = profile.stats;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
          Your Progress
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{level}</div>
            <div className="text-xs text-muted-foreground">Level</div>
          </div>
          
          <div className="text-center">
            <div className="flex justify-center">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-lg font-bold">{practiceStreak}</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold">{totalPractices}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold">{accuracyRate}%</div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
          </div>
        </div>
        
        {achievements.length > 0 && (
          <div className="border-t pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recent Achievements</p>
            <div className="flex flex-wrap gap-1">
              {achievements.slice(0, 3).map((achievement: string) => (
                <div key={achievement} className="bg-primary/10 rounded px-2 py-1 text-xs flex items-center">
                  <Trophy className="h-3 w-3 text-yellow-500 mr-1" />
                  {achievement.replace(/_/g, ' ')}
                </div>
              ))}
              {achievements.length > 3 && (
                <div className="bg-muted rounded px-2 py-1 text-xs">
                  +{achievements.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => navigate(`/users/${userId}/reframe-coach/profile`)}
          >
            View Full Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main dashboard component with tabs
const ReframeCoachDashboard = ({ userId }: { userId: number }) => {
  const [_, navigate] = useLocation();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Reframe Coach</h2>
        <Button onClick={() => navigate(`/users/${userId}/thoughts`)}>
          <Plus className="h-4 w-4 mr-2" />
          New Practice
        </Button>
      </div>
      
      <ProfileSummary userId={userId} />
      
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Practice History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="assignments" className="space-y-4">
          <AssignmentsList userId={userId} />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <PracticeHistory userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReframeCoachDashboard;