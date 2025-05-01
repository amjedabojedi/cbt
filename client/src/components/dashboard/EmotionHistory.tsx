import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmotionRecord } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit, Eye, Trash2 } from "lucide-react";
import ReflectionWizard from "../reflection/ReflectionWizard";

interface EmotionHistoryProps {
  limit?: number;
}

export default function EmotionHistory({ limit }: EmotionHistoryProps) {
  const { user } = useAuth();
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionRecord | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showReflectionWizard, setShowReflectionWizard] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [emotionToDelete, setEmotionToDelete] = useState<EmotionRecord | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch emotion records
  const { data: emotions, isLoading, error } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/emotions`] : [],
    enabled: !!user,
  });
  
  // Delete emotion mutation
  const deleteEmotionMutation = useMutation({
    mutationFn: async (emotionId: number) => {
      if (!user) throw new Error('User not authenticated');
      return apiRequest(`/api/users/${user.id}/emotions/${emotionId}`, 'DELETE');
    },
    onSuccess: () => {
      // Invalidate and refetch emotions
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/emotions`] });
      
      toast({
        title: "Record deleted",
        description: "The emotion record has been deleted successfully.",
        variant: "default",
      });
      
      setEmotionToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error) => {
      console.error('Error deleting emotion record:', error);
      toast({
        title: "Error",
        description: "Failed to delete the record. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle view details
  const handleViewDetails = (emotion: EmotionRecord) => {
    setSelectedEmotion(emotion);
  };
  
  // Handle edit/reflection
  const handleEditEmotion = (emotion: EmotionRecord) => {
    setSelectedEmotion(emotion);
    setShowReflectionWizard(true);
  };
  
  // Handle delete
  const handleDeleteClick = (emotion: EmotionRecord) => {
    setEmotionToDelete(emotion);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (emotionToDelete) {
      deleteEmotionMutation.mutate(emotionToDelete.id);
    }
  };
  
  // Format date for display
  const formatDate = (date: string | Date) => {
    const emotionDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (emotionDate.toDateString() === today.toDateString()) {
      return `Today, ${format(emotionDate, "h:mm a")}`;
    } else if (emotionDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(emotionDate, "h:mm a")}`;
    } else {
      return format(emotionDate, "MMM d, h:mm a");
    }
  };
  
  // Get emotion badge color
  const getEmotionBadgeColor = (emotion: string) => {
    if (emotion.includes("Joy") || emotion.includes("Happy") || emotion.includes("Optimistic")) {
      return "bg-yellow-100 text-yellow-800";
    } else if (emotion.includes("Anger") || emotion.includes("Frustrat") || emotion.includes("Annoyed")) {
      return "bg-red-100 text-red-800";
    } else if (emotion.includes("Sad") || emotion.includes("Depress") || emotion.includes("Lonely")) {
      return "bg-blue-100 text-blue-800";
    } else if (emotion.includes("Fear") || emotion.includes("Anx") || emotion.includes("Worried")) {
      return "bg-green-100 text-green-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-red-500">
            Error loading emotion history. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const displayEmotions = limit && !showFullHistory ? emotions?.slice(0, limit) : emotions;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>
              Your recently recorded emotions and thoughts
            </CardDescription>
          </div>
          {limit && emotions?.length > limit && (
            <Button 
              variant="ghost" 
              onClick={() => setShowFullHistory(true)}
              className="text-sm text-primary hover:text-primary-dark"
            >
              View All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {emotions?.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-neutral-500">No emotion records yet.</p>
              <p className="text-sm text-neutral-400 mt-1">
                Use the emotion wheel to start tracking how you feel.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Emotion</TableHead>
                    <TableHead>Intensity</TableHead>
                    <TableHead>Situation</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayEmotions?.map((emotion) => (
                    <TableRow key={emotion.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(emotion.timestamp)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${getEmotionBadgeColor(emotion.tertiaryEmotion)}`}>
                          {emotion.tertiaryEmotion}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {emotion.intensity}/10
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {emotion.situation}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditEmotion(emotion)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewDetails(emotion)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteClick(emotion)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Emotion Details Dialog */}
      {selectedEmotion && (
        <Dialog open={!!selectedEmotion && !showReflectionWizard} onOpenChange={() => setSelectedEmotion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Emotion Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Date & Time</h4>
                  <p>{formatDate(selectedEmotion.timestamp)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Emotion</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getEmotionBadgeColor(selectedEmotion.tertiaryEmotion)}`}>
                      {selectedEmotion.tertiaryEmotion}
                    </span>
                    <span className="text-sm text-neutral-500">
                      ({selectedEmotion.intensity}/10)
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-neutral-500">Situation</h4>
                  <p className="text-sm">{selectedEmotion.situation}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Location</h4>
                  <p className="text-sm capitalize">{selectedEmotion.location || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Company</h4>
                  <p className="text-sm capitalize">{selectedEmotion.company || "Not specified"}</p>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button onClick={() => {
                  setShowReflectionWizard(true);
                  // Keep selectedEmotion set
                }}>
                  Add Reflection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Reflection Wizard */}
      {selectedEmotion && showReflectionWizard && (
        <ReflectionWizard
          emotion={selectedEmotion}
          open={showReflectionWizard}
          onClose={() => {
            setShowReflectionWizard(false);
            setSelectedEmotion(null);
          }}
        />
      )}
      
      {/* Full History Dialog */}
      <Dialog open={showFullHistory} onOpenChange={setShowFullHistory}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Emotion History</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Emotion</TableHead>
                  <TableHead>Intensity</TableHead>
                  <TableHead>Situation</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emotions?.map((emotion) => (
                  <TableRow key={emotion.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(emotion.timestamp)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getEmotionBadgeColor(emotion.tertiaryEmotion)}`}>
                        {emotion.tertiaryEmotion}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {emotion.intensity}/10
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {emotion.situation}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {emotion.location || "—"}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {emotion.company || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedEmotion(emotion);
                            setShowReflectionWizard(true);
                            setShowFullHistory(false);
                          }}
                          className="text-primary hover:text-primary-dark"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setSelectedEmotion(emotion);
                            setShowFullHistory(false);
                          }}
                          className="text-primary hover:text-primary-dark"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            handleDeleteClick(emotion);
                            setShowFullHistory(false);
                          }}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Emotion Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this emotion record? This will also remove any linked thought records and reflections.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmotionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEmotionMutation.isPending ? 
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </div> : 
                "Delete"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
