import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import ThoughtRecordsList from "@/components/thought/ThoughtRecordsList";
import { format } from "date-fns";
import { ThoughtRecord } from "@shared/schema";
import useActiveUser from "@/hooks/use-active-user";
import { ClientDebug } from "@/components/debug/ClientDebug";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ClipboardList } from "lucide-react";

export default function ThoughtRecords() {
  const { user } = useAuth();
  const { isViewingClientData, activeUserId } = useActiveUser();
  const [selectedThought, setSelectedThought] = useState<ThoughtRecord | null>(null);
  
  // Fetch related emotion records for the active user (could be a client viewed by a therapist)
  const { data: emotions } = useQuery({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!activeUserId,
  });
  
  // Format date for display
  const formatDate = (date: string | Date) => {
    return format(new Date(date), "MMM d, yyyy h:mm a");
  };
  
  // Find related emotion for a thought record
  const findRelatedEmotion = (emotionRecordId: number) => {
    if (!emotions || !Array.isArray(emotions)) return undefined;
    return emotions.find((emotion: any) => emotion.id === emotionRecordId);
  };
  
  // Handle edit a thought record
  const handleEditThought = (thought: ThoughtRecord) => {
    setSelectedThought(thought);
  };

  return (
    <AppLayout title="Thought Records">
      <div className="container mx-auto px-4 py-6">
        {/* Debug Information (Development Only) */}
        <ClientDebug />
        
        <div className="flex flex-col space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                {isViewingClientData ? (
                  <>
                    <CardTitle>Client's Thought Records</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <ClipboardList size={16} />
                        View thought records and reflections for this client
                      </div>
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle>Thought Records</CardTitle>
                    <CardDescription>
                      Review and analyze your thought patterns
                    </CardDescription>
                  </>
                )}
              </div>
              
              {/* Only show New Record button if user is viewing their own data AND is not a therapist */}
              {!isViewingClientData && user?.role !== 'therapist' && (
                <Button asChild>
                  <a href="/emotions">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Record
                  </a>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!isViewingClientData && user?.role !== 'therapist' && (
                <div className="text-center py-4 text-sm text-neutral-500">
                  Start with an emotion entry, then add reflections to create thought records.
                </div>
              )}
              {!isViewingClientData && user?.role === 'therapist' && (
                <div className="text-center py-4 text-sm text-neutral-500">
                  As a therapist, you can view client records but cannot create your own records.
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Thought Records List Component */}
          <ThoughtRecordsList onEditRecord={handleEditThought} />
        </div>
        
        {/* Thought Record Details Dialog */}
        {selectedThought && (
          <Dialog open={!!selectedThought} onOpenChange={() => setSelectedThought(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thought Record Details</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500">Date</h4>
                    <p>{formatDate(selectedThought.createdAt)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500">Related Emotion</h4>
                    <p>
                      {findRelatedEmotion(selectedThought.emotionRecordId)?.tertiaryEmotion || "None"}
                      {findRelatedEmotion(selectedThought.emotionRecordId) && (
                        <span className="text-sm text-neutral-500 ml-1">
                          ({findRelatedEmotion(selectedThought.emotionRecordId)?.intensity}/10)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-neutral-500 mb-1">Automatic Thoughts</h4>
                  <p className="text-sm p-3 bg-neutral-50 rounded border border-neutral-200">
                    {selectedThought.automaticThoughts}
                  </p>
                </div>
                
                {selectedThought.cognitiveDistortions && selectedThought.cognitiveDistortions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-1">Cognitive Distortions</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedThought.cognitiveDistortions.map((distortion, idx) => (
                        <Badge key={idx} className="text-xs">
                          {formatDistortionName(distortion)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedThought.evidenceFor && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-1">Evidence For</h4>
                      <p className="text-sm p-3 bg-neutral-50 rounded border border-neutral-200">
                        {selectedThought.evidenceFor}
                      </p>
                    </div>
                  )}
                  
                  {selectedThought.evidenceAgainst && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-1">Evidence Against</h4>
                      <p className="text-sm p-3 bg-neutral-50 rounded border border-neutral-200">
                        {selectedThought.evidenceAgainst}
                      </p>
                    </div>
                  )}
                </div>
                
                {selectedThought.alternativePerspective && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-1">Alternative Perspective</h4>
                    <p className="text-sm p-3 bg-neutral-50 rounded border border-neutral-200">
                      {selectedThought.alternativePerspective}
                    </p>
                  </div>
                )}
                
                {selectedThought.insightsGained && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-1">Insights Gained</h4>
                    <p className="text-sm p-3 bg-neutral-50 rounded border border-neutral-200">
                      {selectedThought.insightsGained}
                    </p>
                  </div>
                )}
                
                {selectedThought.reflectionRating !== null && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-1">Reflection Rating</h4>
                    <div className="flex items-center">
                      <div className="w-full bg-neutral-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${(selectedThought.reflectionRating / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{selectedThought.reflectionRating}/10</span>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}

// Helper to format cognitive distortion names
function formatDistortionName(distortion: string) {
  return distortion
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Brain icon component
function Brain(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-1.98-2 2.5 2.5 0 0 1-1.32-4.24 2.5 2.5 0 0 1 .34-3.3 2.5 2.5 0 0 1 1.43-4.35A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 1.98-2 2.5 2.5 0 0 0 1.32-4.24 2.5 2.5 0 0 0-.34-3.3 2.5 2.5 0 0 0-1.43-4.35A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}
