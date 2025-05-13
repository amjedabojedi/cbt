import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import useActiveUser from "@/hooks/use-active-user";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, BrainCircuit, Loader2 } from "lucide-react";
import ReflectionWizard from "@/components/reflection/ReflectionWizard";
import { EmotionRecord } from "@shared/schema";

export default function ThoughtNew() {
  const { user } = useAuth();
  const { activeUserId } = useActiveUser();
  const [location, setLocation] = useLocation();
  const [emotionId, setEmotionId] = useState<number | null>(null);
  const [relatedEmotion, setRelatedEmotion] = useState<EmotionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  
  // On mount, check URL for emotionId parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('emotionId');
    
    if (id) {
      setEmotionId(parseInt(id, 10));
    } else {
      // If no emotion ID parameter, prompt user to select an emotion
      setLoading(false);
    }
  }, []);
  
  // Fetch emotions to find the related emotion
  const { data: emotions, isLoading: isLoadingEmotions } = useQuery<EmotionRecord[]>({
    queryKey: activeUserId && emotionId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!(activeUserId && emotionId)
  });
  
  // Process emotions when they change
  useEffect(() => {
    if (emotions && Array.isArray(emotions) && emotionId) {
      const emotion = emotions.find(e => e.id === emotionId);
      if (emotion) {
        setRelatedEmotion(emotion);
      }
      setLoading(false);
    }
  }, [emotions, emotionId]);
  
  // Handle wizard close
  const handleClose = () => {
    setLocation('/thoughts');
  };
  
  // Show loading state
  if (loading || isLoadingEmotions) {
    return (
      <AppLayout title="New Thought Record">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // If no emotion was found
  if (!relatedEmotion && emotionId) {
    return (
      <AppLayout title="New Thought Record">
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
              <CardTitle>Emotion Not Found</CardTitle>
              <CardDescription>
                The emotion you're trying to associate with this thought record could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>The emotion may have been deleted or you may not have permission to view it.</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button onClick={() => setLocation('/thoughts')}>
                  Return to Thought Records
                </Button>
                <Button variant="outline" onClick={() => setLocation('/emotion-tracking')}>
                  Go to Emotion Tracking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  // If no emotion ID was provided
  if (!emotionId) {
    return (
      <AppLayout title="New Thought Record">
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
                Create Thought Record
              </CardTitle>
              <CardDescription>
                Please select an emotion from your history to associate with this thought record.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Thought records work best when they're linked to a specific emotion you've experienced.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => setLocation('/emotion-tracking?tab=history')}>
                  Select from Emotion History
                </Button>
                <Button variant="outline" onClick={() => setLocation('/emotion-tracking')}>
                  Record a New Emotion First
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout title="New Thought Record">
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
              Create Thought Record
            </CardTitle>
            <CardDescription>
              Record your thoughts related to the selected emotion
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