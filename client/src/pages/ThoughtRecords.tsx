import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, PlusCircle } from "lucide-react";

export default function ThoughtRecords() {
  const { user } = useAuth();
  const [selectedThought, setSelectedThought] = useState<any>(null);
  
  // Fetch thought records
  const { data: thoughts, isLoading, error } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/thoughts`] : [],
    enabled: !!user,
  });
  
  // Fetch related emotion records
  const { data: emotions } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/emotions`] : [],
    enabled: !!user,
  });
  
  // Handle view details
  const handleViewDetails = (thought: any) => {
    setSelectedThought(thought);
  };
  
  // Format date for display
  const formatDate = (date: string | Date) => {
    return format(new Date(date), "MMM d, yyyy h:mm a");
  };
  
  // Find related emotion for a thought record
  const findRelatedEmotion = (emotionRecordId: number) => {
    return emotions?.find(emotion => emotion.id === emotionRecordId);
  };
  
  if (isLoading) {
    return (
      <AppLayout title="Thought Records">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (error) {
    return (
      <AppLayout title="Thought Records">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-red-500">
                Error loading thought records. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Thought Records">
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Thought Records</CardTitle>
              <CardDescription>
                Review and analyze your thought patterns
              </CardDescription>
            </div>
            <Button asChild>
              <a href="/emotions">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Record
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            {thoughts?.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">No thought records yet</h3>
                <p className="text-neutral-500 max-w-md mx-auto mb-6">
                  Start by recording an emotion, then complete the reflection process to create your first thought record.
                </p>
                <Button asChild>
                  <a href="/emotions">Record an Emotion</a>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Related Emotion</TableHead>
                      <TableHead>Thoughts</TableHead>
                      <TableHead>Cognitive Distortions</TableHead>
                      <TableHead>Reflection Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {thoughts?.map((thought) => {
                      const relatedEmotion = findRelatedEmotion(thought.emotionRecordId);
                      
                      return (
                        <TableRow key={thought.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDate(thought.createdAt)}
                          </TableCell>
                          <TableCell>
                            {relatedEmotion ? (
                              <Badge variant="outline" className="capitalize">
                                {relatedEmotion.tertiaryEmotion}
                              </Badge>
                            ) : (
                              <Badge variant="outline">No emotion</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm">
                            {thought.automaticThoughts}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {thought.cognitiveDistortions.length > 0 ? (
                                thought.cognitiveDistortions.slice(0, 2).map((distortion: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {formatDistortionName(distortion)}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-neutral-400">None</span>
                              )}
                              {thought.cognitiveDistortions.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{thought.cognitiveDistortions.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {thought.reflectionRating ? (
                              <span className="text-sm font-medium">{thought.reflectionRating}/10</span>
                            ) : (
                              <span className="text-sm text-neutral-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(thought)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
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
                      {selectedThought.cognitiveDistortions.map((distortion: string, idx: number) => (
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
                
                {selectedThought.reflectionRating && (
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
