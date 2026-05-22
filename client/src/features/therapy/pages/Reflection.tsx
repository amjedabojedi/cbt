import { useEffect } from "react";
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
import ReflectionWizard from "@/features/therapy/components/reflection/ReflectionWizard";

export default function Reflection() {
  const { user } = useAuth();
  const { activeUserId } = useActiveUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Parse the edit ID synchronously — no useEffect delay
  const editParam = new URLSearchParams(window.location.search).get('edit');
  const thoughtRecordId = editParam ? parseInt(editParam, 10) : null;

  // Redirect on mount if no ID
  useEffect(() => {
    if (!thoughtRecordId) {
      setLocation('/thoughts');
      toast({ title: "No record selected", description: "Please select a thought record to edit." });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch thoughts and emotions in parallel — not sequentially
  const { data: thoughtRecords, isLoading: isLoadingThoughts } = useQuery<ThoughtRecord[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/thoughts`] : [],
    enabled: !!(activeUserId && thoughtRecordId),
  });

  const { data: emotions, isLoading: isLoadingEmotions } = useQuery<EmotionRecord[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!(activeUserId && thoughtRecordId),
  });

  // Derive records synchronously from query results — no useEffect processing
  const thoughtRecord = thoughtRecords?.find(r => r.id === thoughtRecordId) ?? null;
  const relatedEmotion = (thoughtRecord?.emotionRecordId && emotions)
    ? (emotions.find(e => e.id === thoughtRecord.emotionRecordId) ?? null)
    : null;

  // Stub emotion for thought records that have no linked emotion.
  // ReflectionWizard requires an EmotionRecord prop; in edit mode it uses
  // existingThoughtRecord.emotionRecordId for submission, so the stub is display-only.
  const emotionForWizard: EmotionRecord = relatedEmotion ?? {
    id: 0,
    userId: activeUserId ?? 0,
    coreEmotion: "",
    primaryEmotion: null,
    tertiaryEmotion: null,
    intensity: 5,
    situation: "",
    location: null,
    company: null,
    timestamp: new Date(),
    createdAt: new Date(),
  };

  // Navigate away only when the thought record itself is missing after load
  useEffect(() => {
    if (!isLoadingThoughts && thoughtRecords && !thoughtRecord) {
      toast({
        title: "Record not found",
        description: "The thought record you're trying to edit was not found.",
        variant: "destructive",
      });
      setLocation('/thoughts');
    }
  }, [isLoadingThoughts, thoughtRecords, thoughtRecord, toast, setLocation]);

  const handleClose = () => setLocation('/thoughts');

  // Wait for thoughts; only also wait for emotions if the record has a linked emotion
  const needsEmotion = !!thoughtRecord?.emotionRecordId;
  const isLoading = isLoadingThoughts || (needsEmotion && isLoadingEmotions);

  if (!thoughtRecordId || isLoading) {
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

  if (!thoughtRecord) {
    return (
      <AppLayout title="Edit Thought Record">
        <div className="container mx-auto px-4 py-6">
          <Button variant="outline" onClick={() => setLocation('/thoughts')} className="mb-4">
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
              <Button className="mt-4" onClick={() => setLocation('/thoughts')}>
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
        <Button variant="outline" onClick={() => setLocation('/thoughts')} className="mb-4">
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

        <ReflectionWizard
          emotion={emotionForWizard}
          open={true}
          onClose={handleClose}
          existingThoughtRecord={thoughtRecord}
          isEditMode={true}
        />
      </div>
    </AppLayout>
  );
}
