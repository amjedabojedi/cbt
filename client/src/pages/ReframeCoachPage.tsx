import React from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ThoughtRecordsList from "@/components/thought/ThoughtRecordsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <h2 className="text-2xl font-bold tracking-tight mb-6">Reframe Coach</h2>
        
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
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                You don't have any thought records yet. Create a thought record first to begin practicing reframing.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ReframeCoachPage;