import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { EmotionRecord } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useActiveUser from "@/hooks/use-active-user";
import { useAuth } from "@/lib/auth";
import { useRefreshData } from "@/hooks/use-refresh-data";
import { 
  ArrowRight, 
  Smile, 
  Frown, 
  Flame, 
  AlertCircle, 
  Sparkles, 
  ThumbsDown, 
  Heart,
  MapPin,
  MessageSquare,
  Edit,
  Eye,
  Trash2,
  HelpCircle,
  MoreVertical,
  Calendar
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReflectionWizard from "../reflection/ReflectionWizard";

interface EmotionHistoryProps {
  limit?: number;
}

// Helper to get emotion badge color
function getEmotionBadgeColor(emotion: string): string {
  const colorMap: Record<string, string> = {
    "Anger": "bg-red-100 text-red-800",
    "Sadness": "bg-blue-100 text-blue-800",
    "Surprise": "bg-purple-100 text-purple-800",
    "Joy": "bg-yellow-100 text-yellow-800",
    "Love": "bg-pink-100 text-pink-800",
    "Fear": "bg-green-100 text-green-800",
    "Disgust": "bg-emerald-100 text-emerald-800",
    
    // Default fallback
    "default": "bg-gray-100 text-gray-800"
  };
  
  return colorMap[emotion] || colorMap.default;
}

export default function EmotionHistory({ limit }: EmotionHistoryProps) {
  const { activeUserId, isViewingClientData } = useActiveUser();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionRecord | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showReflectionWizard, setShowReflectionWizard] = useState(false);
  const [showEditEmotionDialog, setShowEditEmotionDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [emotionToDelete, setEmotionToDelete] = useState<EmotionRecord | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refreshAfterOperation } = useRefreshData();
  
  // Check if there's an emotion ID in the URL to auto-select
  const urlParams = new URLSearchParams(window.location.search);
  const emotionIdParam = urlParams.get('id');
  
  // Fetch emotion records for the active user (could be a client viewed by a therapist)
  const { data: emotions = [], isLoading, error } = useQuery<EmotionRecord[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!activeUserId
  });
  
  // When emotion data changes, check for URL parameter to auto-select
  useEffect(() => {
    if (emotionIdParam && emotions.length > 0) {
      const emotionId = parseInt(emotionIdParam, 10);
      const foundEmotion = emotions.find((e: EmotionRecord) => e.id === emotionId);
      if (foundEmotion) {
        setSelectedEmotion(foundEmotion);
      }
    }
  }, [emotions, emotionIdParam]);
  
  // Update emotion mutation - only allowed for own records
  const updateEmotionMutation = useMutation({
    mutationFn: async (emotion: Partial<EmotionRecord> & { id: number }) => {
      if (!activeUserId) throw new Error('User not authenticated');
      return apiRequest('PATCH', `/api/users/${activeUserId}/emotions/${emotion.id}`, emotion);
    },
    onSuccess: (_data, emotion) => {
      // Use the refreshAfterOperation utility to handle data refreshing consistently
      refreshAfterOperation(
        'emotion',
        'update',
        emotion.id,
        "The emotion record has been updated successfully.",
        false  // don't force a page reload
      );
      
      setShowEditEmotionDialog(false);
    },
    onError: (error: any) => {
      console.error('Error updating emotion record:', error);
      
      toast({
        title: "Update failed",
        description: "There was a problem updating the emotion record. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete emotion mutation - only allowed for own records
  const deleteEmotionMutation = useMutation({
    mutationFn: async (emotionId: number) => {
      if (!activeUserId) throw new Error('User not authenticated');
      return apiRequest('DELETE', `/api/users/${activeUserId}/emotions/${emotionId}`);
    },
    onSuccess: (_data, emotionId) => {
      // Use the refreshAfterOperation utility for consistent data refreshing
      refreshAfterOperation(
        'emotion',
        'delete',
        emotionId,
        "The emotion record has been deleted successfully.",
        false // don't force a page reload
      );
      
      setEmotionToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error: any) => {
      console.error('Error deleting emotion record:', error);
      
      // Check if it's a 404 error (record doesn't exist)
      if (error?.response?.status === 404) {
        // The record was likely already deleted
        // We'll treat this as a successful operation and use our refresh utility
        refreshAfterOperation(
          'emotion',
          'delete',
          emotionToDelete?.id || 0,
          "The record no longer exists.",
          false // don't force a page reload
        );
        setEmotionToDelete(null);
        setDeleteConfirmOpen(false);
        return;
      }
      
      // For other errors, show the error message
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
  
  // Handle emotion edit 
  const handleEditEmotion = (emotion: EmotionRecord) => {
    setSelectedEmotion(emotion);
    setShowEditEmotionDialog(true);
  };
  
  // Handle adding a new thought record for an emotion
  const handleAddThoughtRecord = (emotion: EmotionRecord) => {
    // Use router navigation instead of directly setting state
    if (!isViewingClientData) {
      // Navigate to the ThoughtNew page with the emotion ID
      navigate(`/thoughts/new?emotionId=${emotion.id}`);
    }
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
      return format(emotionDate, "MMM d, yyyy, h:mm a");
    }
  };
  
  // Get emotion badge color
  const getEmotionBadgeColor = (emotion: string | null | undefined) => {
    if (!emotion) return "bg-gray-100 text-gray-800";
    
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
  
  const displayEmotions = limit && !showFullHistory && emotions ? emotions.slice(0, limit) : emotions;
  const emotionsArray = Array.isArray(emotions) ? emotions : [];

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
          {limit && emotionsArray.length > limit && (
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
          {emotionsArray.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-neutral-500">No emotion records yet.</p>
              <p className="text-sm text-neutral-400 mt-1">
                Use the emotion wheel to start tracking how you feel.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {displayEmotions?.map((emotion) => (
                <Card key={emotion.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{formatDate(emotion.timestamp)}</span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(emotion)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {!isViewingClientData && (
                            <>
                              <DropdownMenuItem onClick={() => handleEditEmotion(emotion)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddThoughtRecord(emotion)}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Add Thought Record
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(emotion)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-3">
                    <div className="space-y-3">
                      {/* Emotion Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Emotion:</span>
                        <Badge className={getEmotionBadgeColor(emotion.tertiaryEmotion || emotion.primaryEmotion || emotion.coreEmotion)}>
                          {emotion.tertiaryEmotion || emotion.primaryEmotion || emotion.coreEmotion}
                        </Badge>
                      </div>
                      
                      {/* Intensity */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Intensity:</span>
                        <span className="text-sm font-semibold">{emotion.intensity}/10</span>
                      </div>
                      
                      {/* Situation */}
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Situation:</span>
                        <p className="text-sm line-clamp-2">{emotion.situation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Emotion Details Dialog */}
      {selectedEmotion && (
        <Dialog open={!!selectedEmotion && !showReflectionWizard} onOpenChange={() => setSelectedEmotion(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto custom-scrollbar">
            <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className={`p-2 rounded-full ${getEmotionBadgeColor(selectedEmotion.coreEmotion).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                  {selectedEmotion.coreEmotion === 'Joy' && <Smile className="h-5 w-5" />}
                  {selectedEmotion.coreEmotion === 'Sadness' && <Frown className="h-5 w-5" />}
                  {selectedEmotion.coreEmotion === 'Anger' && <Flame className="h-5 w-5" />}
                  {selectedEmotion.coreEmotion === 'Fear' && <AlertCircle className="h-5 w-5" />}
                  {selectedEmotion.coreEmotion === 'Surprise' && <Sparkles className="h-5 w-5" />}
                  {selectedEmotion.coreEmotion === 'Disgust' && <ThumbsDown className="h-5 w-5" />}
                  {!['Joy', 'Sadness', 'Anger', 'Fear', 'Surprise', 'Disgust'].includes(selectedEmotion.coreEmotion) && <Heart className="h-5 w-5" />}
                </div>
                Emotion Details
              </DialogTitle>
              <DialogDescription>
                Recorded on {format(new Date(selectedEmotion.timestamp), "MMMM d, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 pr-1">
              {/* Emotion visualization card */}
              <Card className="border-l-4 overflow-hidden" style={{
                borderLeftColor: selectedEmotion.coreEmotion === 'Joy' ? '#FFC107' : 
                                 selectedEmotion.coreEmotion === 'Sadness' ? '#2196F3' : 
                                 selectedEmotion.coreEmotion === 'Anger' ? '#F44336' : 
                                 selectedEmotion.coreEmotion === 'Fear' ? '#4CAF50' : 
                                 selectedEmotion.coreEmotion === 'Surprise' ? '#9C27B0' : 
                                 selectedEmotion.coreEmotion === 'Disgust' ? '#795548' : '#9E9E9E'
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full w-16 h-16 flex items-center justify-center"
                      style={{
                        background: `conic-gradient(${selectedEmotion.coreEmotion === 'Joy' ? '#FFC107' : 
                                 selectedEmotion.coreEmotion === 'Sadness' ? '#2196F3' : 
                                 selectedEmotion.coreEmotion === 'Anger' ? '#F44336' : 
                                 selectedEmotion.coreEmotion === 'Fear' ? '#4CAF50' : 
                                 selectedEmotion.coreEmotion === 'Surprise' ? '#9C27B0' : 
                                 selectedEmotion.coreEmotion === 'Disgust' ? '#795548' : '#9E9E9E'} ${selectedEmotion.intensity * 10}%, #f1f5f9 0)`
                      }}>
                      <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-semibold">
                        {selectedEmotion.intensity}/10
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Core Emotion</span>
                        <span className="font-medium">{selectedEmotion.coreEmotion}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {selectedEmotion.primaryEmotion && (
                          <span className={`px-2 py-1 text-xs rounded-full ${getEmotionBadgeColor(selectedEmotion.primaryEmotion)}`}>
                            {selectedEmotion.primaryEmotion}
                          </span>
                        )}
                        {selectedEmotion.tertiaryEmotion && (
                          <span className={`px-2 py-1 text-xs rounded-full ${getEmotionBadgeColor(selectedEmotion.tertiaryEmotion)}`}>
                            {selectedEmotion.tertiaryEmotion}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      Context Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Location</div>
                        <div className="text-sm font-medium capitalize">{selectedEmotion.location || "Not specified"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Company</div>
                        <div className="text-sm font-medium capitalize">{selectedEmotion.company || "Not specified"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                      Situation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm">
                      {selectedEmotion.situation || "No situation description provided"}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex flex-wrap justify-between gap-2 pt-4">
                {/* Show linked thought records if they exist */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-500 mb-2">Related Records</h4>
                  {/* We'll add thought record links in a separate update */}
                </div>
                
                <div className="flex gap-2">
                  {/* Only show Add Thought Record button if this is the user's own data (not a therapist viewing client data) */}
                  {!isViewingClientData && (
                    <Button 
                      variant="default"
                      onClick={() => {
                        setShowReflectionWizard(true);
                      }}
                    >
                      <ArrowRight className="mr-1 h-4 w-4" />
                      Create Thought Record
                    </Button>
                  )}
                </div>
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
      
      {/* Edit Emotion Dialog */}
      {selectedEmotion && (
        <Dialog open={showEditEmotionDialog} onOpenChange={(open) => {
          if (!open) {
            setShowEditEmotionDialog(false);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto custom-scrollbar">
            <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className={`p-2 rounded-full ${getEmotionBadgeColor(selectedEmotion.coreEmotion)}`}>
                  {selectedEmotion.coreEmotion === 'Joy' && <Smile className="h-5 w-5" />}
                  {selectedEmotion.coreEmotion === 'Sadness' && <Frown className="h-5 w-5" />}
                  {selectedEmotion.coreEmotion === 'Anger' && <Flame className="h-5 w-5" />}
                  {selectedEmotion.coreEmotion === 'Fear' && <AlertCircle className="h-5 w-5" />}
                  {selectedEmotion.coreEmotion === 'Surprise' && <Sparkles className="h-5 w-5" />}
                  {selectedEmotion.coreEmotion === 'Disgust' && <ThumbsDown className="h-5 w-5" />}
                  {!['Joy', 'Sadness', 'Anger', 'Fear', 'Surprise', 'Disgust'].includes(selectedEmotion.coreEmotion) && <Heart className="h-5 w-5" />}
                </div>
                Edit Emotion Record
              </DialogTitle>
              <DialogDescription>
                Update the details of your emotion recorded on {format(new Date(selectedEmotion.timestamp), "MMMM d, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedEmotion = {
                id: selectedEmotion.id,
                intensity: parseInt(formData.get('intensity') as string) || selectedEmotion.intensity,
                situation: formData.get('situation') as string || selectedEmotion.situation,
                location: formData.get('location') as string || selectedEmotion.location,
                company: formData.get('company') as string || selectedEmotion.company,
              };
              
              updateEmotionMutation.mutate(updatedEmotion);
            }}>
              <div className="space-y-6 py-4">
                {/* Emotion visualization card */}
                <Card className="border-l-4 overflow-hidden" style={{
                  borderLeftColor: selectedEmotion.coreEmotion === 'Joy' ? '#FFC107' : 
                                   selectedEmotion.coreEmotion === 'Sadness' ? '#2196F3' : 
                                   selectedEmotion.coreEmotion === 'Anger' ? '#F44336' : 
                                   selectedEmotion.coreEmotion === 'Fear' ? '#4CAF50' : 
                                   selectedEmotion.coreEmotion === 'Surprise' ? '#9C27B0' : 
                                   selectedEmotion.coreEmotion === 'Disgust' ? '#795548' : '#9E9E9E'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full w-16 h-16 flex items-center justify-center relative">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `conic-gradient(${selectedEmotion.coreEmotion === 'Joy' ? '#FFC107' : 
                                     selectedEmotion.coreEmotion === 'Sadness' ? '#2196F3' : 
                                     selectedEmotion.coreEmotion === 'Anger' ? '#F44336' : 
                                     selectedEmotion.coreEmotion === 'Fear' ? '#4CAF50' : 
                                     selectedEmotion.coreEmotion === 'Surprise' ? '#9C27B0' : 
                                     selectedEmotion.coreEmotion === 'Disgust' ? '#795548' : '#9E9E9E'} ${selectedEmotion.intensity * 10}%, #f1f5f9 0)`
                          }}
                        />
                        <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-semibold z-10">
                          <input 
                            type="number"
                            id="intensity" 
                            name="intensity"
                            min="1" 
                            max="10"
                            className="w-7 border-none text-center p-0 bg-transparent"
                            defaultValue={selectedEmotion.intensity}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-muted-foreground">Core Emotion</span>
                          <span className="font-medium">{selectedEmotion.coreEmotion}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {selectedEmotion.primaryEmotion && (
                            <span className={`px-2 py-1 text-xs rounded-full ${getEmotionBadgeColor(selectedEmotion.primaryEmotion)}`}>
                              {selectedEmotion.primaryEmotion}
                            </span>
                          )}
                          {selectedEmotion.tertiaryEmotion && (
                            <span className={`px-2 py-1 text-xs rounded-full ${getEmotionBadgeColor(selectedEmotion.tertiaryEmotion)}`}>
                              {selectedEmotion.tertiaryEmotion}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="situation" className="text-sm font-medium flex items-center gap-2">
                      Situation
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div>Describe what happened when you experienced this emotion</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>
                    <textarea 
                      id="situation" 
                      name="situation"
                      className="w-full px-3 py-2 border rounded-md min-h-[80px]" 
                      defaultValue={selectedEmotion.situation}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                        Location
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div>Where were you when you felt this emotion?</div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </label>
                      <input 
                        type="text" 
                        id="location" 
                        name="location"
                        className="w-full px-3 py-2 border rounded-md" 
                        defaultValue={selectedEmotion.location || ''}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="company" className="text-sm font-medium flex items-center gap-2">
                        Company
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div>Who were you with when this happened?</div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </label>
                      <input 
                        type="text" 
                        id="company" 
                        name="company"
                        className="w-full px-3 py-2 border rounded-md" 
                        defaultValue={selectedEmotion.company || ''}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditEmotionDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateEmotionMutation.isPending}
                >
                  {updateEmotionMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Full History Dialog */}
      <Dialog open={showFullHistory} onOpenChange={setShowFullHistory}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
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
                {emotionsArray.map((emotion) => (
                  <TableRow key={emotion.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(emotion.timestamp)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getEmotionBadgeColor(emotion.tertiaryEmotion || emotion.primaryEmotion || emotion.coreEmotion)}`}>
                        {emotion.tertiaryEmotion || emotion.primaryEmotion || emotion.coreEmotion}
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
                        {/* Only show edit button if viewing own data */}
                        {!isViewingClientData && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedEmotion(emotion);
                              setShowEditEmotionDialog(true);
                              setShowFullHistory(false);
                            }}
                            className="text-primary hover:text-primary-dark"
                            title="Edit emotion"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Only show add thought record option if viewing own data */}
                        {!isViewingClientData && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedEmotion(emotion);
                              setShowReflectionWizard(true);
                              setShowFullHistory(false);
                            }}
                            className="text-primary hover:text-primary-dark"
                            title="Add thought record"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Always show view details */}
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
                        {/* Only show delete option if viewing own data */}
                        {!isViewingClientData && (
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
                        )}
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
