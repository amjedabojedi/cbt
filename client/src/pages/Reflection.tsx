import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { EmotionRecord, ThoughtRecord } from "@shared/schema";
import useActiveUser from "@/hooks/use-active-user";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, ChevronLeft, Loader2 } from "lucide-react";
import ReflectionWizard from "@/components/reflection/ReflectionWizard";

export default function Reflection() {
  const { user } = useAuth();
  const { activeUserId } = useActiveUser();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [thoughtRecordId, setThoughtRecordId] = useState<number | null>(null);
  const [thoughtRecord, setThoughtRecord] = useState<ThoughtRecord | null>(null);
  const [relatedEmotion, setRelatedEmotion] = useState<EmotionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  
  // On mount, check URL for edit parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get('edit');
    
    if (recordId) {
      setThoughtRecordId(parseInt(recordId, 10));
    } else {
      // If no edit parameter, go back to thought records page
      setLocation('/thoughts');
      toast({
        title: "No record selected",
        description: "Please select a thought record to edit.",
      });
    }
  }, [setLocation, toast]);
  
  // Fetch the specific thought record
  const { data: thoughtRecords, isLoading: isLoadingThoughts } = useQuery<ThoughtRecord[]>({
    queryKey: activeUserId && thoughtRecordId ? [`/api/users/${activeUserId}/thoughts`] : [],
    enabled: !!(activeUserId && thoughtRecordId)
  });
  
  // Process thought records when they change
  useEffect(() => {
    if (thoughtRecords && Array.isArray(thoughtRecords) && thoughtRecordId) {
      const record = thoughtRecords.find(r => r.id === thoughtRecordId);
      if (record) {
        setThoughtRecord(record);
      } else {
        toast({
          title: "Record not found",
          description: "The thought record you're trying to edit was not found.",
          variant: "destructive",
        });
        setLocation('/thoughts');
      }
    }
  }, [thoughtRecords, thoughtRecordId, toast, setLocation]);
  
  // Fetch emotions to find the related emotion
  const { data: emotions, isLoading: isLoadingEmotions } = useQuery<EmotionRecord[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!(activeUserId && thoughtRecord)
  });
  
  // Process emotions when they change
  useEffect(() => {
    if (emotions && Array.isArray(emotions) && thoughtRecord && thoughtRecord.emotionRecordId) {
      const emotion = emotions.find(e => e.id === thoughtRecord.emotionRecordId);
      if (emotion) {
        setRelatedEmotion(emotion);
      }
      setLoading(false);
    }
  }, [emotions, thoughtRecord]);
  
  // Handle wizard close
  const handleClose = () => {
    setLocation('/thoughts');
  };
  
  // Show loading state
  if (loading || isLoadingThoughts || isLoadingEmotions) {
    return (
      <AppLayout title="Edit Thought Record">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading thought record...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // If no record or related emotion found
  if (!thoughtRecord || !relatedEmotion) {
    return (
      <AppLayout title="Edit Thought Record">
        <div className="container mx-auto px-4 py-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/thoughts')}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Thought Records
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>Record Not Found</CardTitle>
              <CardDescription>
                The thought record you're trying to edit could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>The record may have been deleted or you may not have permission to view it.</p>
              <Button 
                className="mt-4" 
                onClick={() => setLocation('/thoughts')}
              >
                Return to Thought Records
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Edit Thought Record">
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/thoughts')}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Thought Records
        </Button>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Edit Thought Record
            </CardTitle>
            <CardDescription>
              Make changes to your thought record and save when finished
            </CardDescription>
          </CardHeader>
        </Card>
        
        {relatedEmotion && (
          <ReflectionWizard
            emotion={relatedEmotion}
            open={true}
            onClose={handleClose}
          />
        )}
      </div>
    </AppLayout>
  );
}