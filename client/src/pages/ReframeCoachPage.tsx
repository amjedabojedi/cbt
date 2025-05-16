import React from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart3 } from "lucide-react";
import ThoughtRecordsList from "@/components/thought/ThoughtRecordsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThoughtRecord } from "@shared/schema";
import AppLayout from "@/components/layout/AppLayout";

const ReframeCoachPage = () => {
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch thought records for the user
  const { data: thoughtRecords, isLoading } = useQuery<ThoughtRecord[]>({
    queryKey: [`/api/users/${userId}/thoughts`],
    enabled: !!userId,
  });

  return (
    <AppLayout title="Reframe Coach">
      <div className="container max-w-4xl py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Reframe Coach</h2>
          <Button 
            onClick={() => window.location.href = `/users/${userId}/reframe-history`}
            className="flex items-center"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            View Practice Results
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Practice Reframing Your Thoughts</CardTitle>
            <CardDescription>
              Select a thought record below to begin reframing practice exercises.
              These exercises will help you develop skills to identify and challenge cognitive distortions.
            </CardDescription>
          </CardHeader>
        </Card>

        {isLoading ? (
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
          <Card>
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
                  onClick={() => window.location.href = `/users/${userId}/thoughts/new`}
                  className="mt-2"
                >
                  Create Your First Thought Record
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ReframeCoachPage;