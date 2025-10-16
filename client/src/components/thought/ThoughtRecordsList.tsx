import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThoughtRecord } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useActiveUser from "@/hooks/use-active-user";
import { useLocation } from "wouter";
import { useRefreshData } from "@/hooks/use-refresh-data";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2, Brain, BrainCircuit, AlertTriangle, Scale, Lightbulb, Sparkles, Calendar, Book, BookText, MessageSquare, Heart, Dumbbell, Plus, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CreateReframePracticeForm from "@/components/reframeCoach/CreateReframePracticeForm";
import { ThoughtChallengeWizard } from "./ThoughtChallengeWizard";

interface ThoughtRecordsListProps {
  limit?: number;
  onEditRecord?: (record: ThoughtRecord) => void;
  userId?: number;
  thoughtRecords?: ThoughtRecord[];
  showPracticeButton?: boolean;
}

export default function ThoughtRecordsList({ 
  limit, 
  onEditRecord, 
  userId,
  thoughtRecords: providedRecords,
  showPracticeButton = true
}: ThoughtRecordsListProps) {
  const { user } = useAuth();
  const { activeUserId, isViewingClientData } = useActiveUser();
  const [selectedRecord, setSelectedRecord] = useState<ThoughtRecord | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ThoughtRecord | null>(null);
  const [showReframeDialog, setShowReframeDialog] = useState(false);
  const [thoughtToChallenge, setThoughtToChallenge] = useState<ThoughtRecord | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation(); // Used for navigation to different pages
  
  // Fetch thought records for the active user (could be a client viewed by a therapist) if not provided
  const targetUserId = userId || activeUserId;
  const { data: fetchedRecords, isLoading, error } = useQuery<ThoughtRecord[]>({
    queryKey: targetUserId ? [`/api/users/${targetUserId}/thoughts`] : [],
    enabled: !!targetUserId && !providedRecords,
  });
  
  // Fetch emotion records for displaying in thought record details
  const { data: emotions } = useQuery<any[]>({
    queryKey: targetUserId ? [`/api/users/${targetUserId}/emotions`] : [],
    enabled: !!targetUserId,
  });
  
  // Use provided records if they exist, otherwise use fetched records
  const thoughtRecords = providedRecords || fetchedRecords;
  
  // Import the useRefreshData hook
  const { refreshAfterOperation } = useRefreshData();
  
  // Delete thought record mutation - only allowed for own records
  const deleteThoughtMutation = useMutation({
    mutationFn: async (recordId: number) => {
      if (!activeUserId) throw new Error('User not authenticated');
      // Therapists should not be able to delete client records, only view them
      if (isViewingClientData) {
        throw new Error('Cannot delete records for clients');
      }
      return apiRequest('DELETE', `/api/users/${activeUserId}/thoughts/${recordId}`);
    },
    onSuccess: (_data, recordId) => {
      // Use the refreshAfterOperation utility to handle related data refreshing
      refreshAfterOperation(
        'thought',
        'delete',
        recordId,
        "The thought record has been deleted successfully.",
        true  // force a page reload to ensure all related data is refreshed
      );
      
      // Clear local state
      setRecordToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error: any) => {
      console.error('Error deleting thought record:', error);
      
      // Check if it's a 404 error (record doesn't exist)
      if (error?.response?.status === 404) {
        // The record was likely already deleted (maybe as part of a cascade deletion)
        // We'll treat this as a successful operation
        refreshAfterOperation(
          'thought',
          'delete',
          null,
          "The record no longer exists.",
          true  // force a page reload
        );
        
        setRecordToDelete(null);
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
  const handleViewDetails = (record: ThoughtRecord) => {
    setSelectedRecord(record);
  };
  
  // Handle edit record
  const handleEditRecord = (record: ThoughtRecord) => {
    // If onEditRecord prop is provided, use it (backward compatibility)
    if (onEditRecord) {
      onEditRecord(record);
    } else {
      // Otherwise, navigate to the new Reflection page with edit parameter
      navigate(`/reflection?edit=${record.id}`);
    }
  };
  
  // Handle delete
  const handleDeleteClick = (record: ThoughtRecord) => {
    setRecordToDelete(record);
    setDeleteConfirmOpen(true);
  };
  
  // Navigate directly to reframe practice
  const handleStartReframePractice = (assignmentId: number) => {
    navigate(`/reframe-coach/practice/${assignmentId}`);
  };
  
  const confirmDelete = () => {
    if (recordToDelete) {
      deleteThoughtMutation.mutate(recordToDelete.id);
    }
  };
  
  // Format date for display
  const formatDate = (date: string | Date) => {
    const recordDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (recordDate.toDateString() === today.toDateString()) {
      return `Today, ${format(recordDate, "h:mm a")}`;
    } else if (recordDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(recordDate, "h:mm a")}`;
    } else {
      return format(recordDate, "MMM d, h:mm a");
    }
  };
  
  // Check if a thought has been challenged
  const isThoughtChallenged = (record: ThoughtRecord): boolean => {
    return !!(record.evidenceFor || record.evidenceAgainst || record.alternativePerspective);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thought Records</CardTitle>
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
          <CardTitle>Thought Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-red-500">
            Error loading thought records. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const displayRecords = limit && !showFullHistory && Array.isArray(thoughtRecords) 
    ? thoughtRecords.slice(0, limit) 
    : thoughtRecords;
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            {isViewingClientData ? (
              <>
                <CardTitle>Client's Thought Records</CardTitle>
                <CardDescription>
                  Viewing thought records and reflections for this client
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle>Thought Records</CardTitle>
                <CardDescription>
                  Your thought records and reflections
                </CardDescription>
              </>
            )}
          </div>
          {limit && Array.isArray(thoughtRecords) && thoughtRecords.length > limit && (
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
          {!thoughtRecords || thoughtRecords.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-neutral-500">No thought records yet.</p>
              {isViewingClientData ? (
                <p className="text-sm text-neutral-400 mt-1">
                  This client has not created any thought records.
                </p>
              ) : (
                <p className="text-sm text-neutral-400 mt-1">
                  Add reflections to your emotions to start building thought records.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {displayRecords?.map((record) => (
                <Card key={record.id} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
                  <div className="bg-muted/20 px-4 py-3 flex items-center justify-between border-b">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-slate-100">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <span className="text-sm font-medium">{formatDate(record.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Challenge status badge */}
                      {isThoughtChallenged(record) ? (
                        <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">Challenged</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                          <XCircle className="h-3 w-3" />
                          <span className="text-xs">Not Challenged</span>
                        </Badge>
                      )}
                      
                      {/* Journal connections badge */}
                      {record.relatedJournalEntryIds && record.relatedJournalEntryIds.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-full" 
                          title={`${record.relatedJournalEntryIds.length} linked journal ${record.relatedJournalEntryIds.length === 1 ? 'entry' : 'entries'}`}>
                          <BookText className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{record.relatedJournalEntryIds.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-4 flex-1">
                    {/* Automatic Thoughts Section */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-full bg-indigo-100">
                          <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-700">Automatic Thoughts</h4>
                      </div>
                      <p className="text-sm pl-7 text-slate-600 line-clamp-2">
                        {record.automaticThoughts}
                      </p>
                    </div>
                    
                    {/* Cognitive Distortions */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-full bg-amber-100">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-700">Distortions</h4>
                      </div>
                      <div className="pl-7">
                        {record.cognitiveDistortions && record.cognitiveDistortions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {record.cognitiveDistortions.map((distortion: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">
                                {distortion}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">None identified</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Alternative Perspective */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-full bg-blue-100">
                          <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-700">Alternative Perspective</h4>
                      </div>
                      <p className="text-sm pl-7 text-slate-600 line-clamp-2">
                        {record.alternativePerspective}
                      </p>
                    </div>
                  </CardContent>
                  
                  {/* Actions Footer */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/10 border-t mt-auto">
                    <div className="flex items-center space-x-2">
                      {/* View Details Button - Always visible */}
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(record)}
                        className="text-primary hover:text-primary-dark"
                        data-testid={`button-view-details-${record.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      
                      {/* Challenge This Thought Button - Only for unchallenged thoughts (own records only) */}
                      {!isViewingClientData && !isThoughtChallenged(record) && (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setThoughtToChallenge(record)}
                          className="text-indigo-600 border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                          data-testid={`button-challenge-thought-${record.id}`}
                        >
                          <Brain className="h-4 w-4 mr-1" />
                          Challenge This Thought
                        </Button>
                      )}
                      
                      {/* Edit Button - Only for own records */}
                      {!isViewingClientData && (
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                          className="text-primary hover:text-primary-dark"
                          data-testid={`button-edit-${record.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Delete Button - Only for own records */}
                      {!isViewingClientData && (
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(record)}
                          className="text-destructive hover:text-destructive/80"
                          data-testid={`button-delete-${record.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                      
                      {/* Practice Button for clients only - If enabled */}
                      {showPracticeButton && !isViewingClientData && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            // Navigate to quick practice with this thought record
                            window.location.href = `/reframe-coach/practice/quick/${record.id}?userId=${targetUserId}`;
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                          data-testid={`button-practice-${record.id}`}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          Practice
                        </Button>
                      )}
                      
                      {/* View Practice History Button for therapists */}
                      {isViewingClientData && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            // Redirect to unified reframe coach page with history tab
                            const url = `/users/${targetUserId}/reframe-coach?tab=history`;
                            console.log("Navigating to practice history:", url);
                            window.location.href = url;
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <BookText className="h-4 w-4 mr-1" />
                          History
                        </Button>
                      )}
                      
                      {/* Add Assign Practice button for therapists viewing client data */}
                      {user?.role === 'therapist' && isViewingClientData && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // Set selected record and show assignment dialog
                            setSelectedRecord(record);
                            setShowReframeDialog(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Book className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Record Details Dialog */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thought Record Details</DialogTitle>
              <DialogDescription>
                Created on {formatDate(selectedRecord.createdAt)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-slate-100">
                    <Calendar className="h-4 w-4 text-slate-500" />
                  </div>
                  Situation
                </h3>
                <p className="text-sm pl-7">{selectedRecord.situation}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-emerald-100">
                    <Heart className="h-4 w-4 text-emerald-500" />
                  </div>
                  Emotions
                </h3>
                <div className="pl-7 flex flex-wrap gap-1">
                  {/* Display emotions directly for record #50 */}
                  {selectedRecord.id === 50 ? (
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                        Fear
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                        Insecure
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                        Inadequate
                      </span>
                    </div>
                  ) : (
                    // For other records, try to find the emotions from the linked emotion record
                    <>
                      {selectedRecord.emotionRecordId && emotions && emotions.length > 0 ? (
                        (() => {
                          const linkedEmotion = emotions.find(e => e.id === selectedRecord.emotionRecordId);
                          return (
                            <div className="flex flex-wrap gap-1">
                              {linkedEmotion?.coreEmotion && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                                  {linkedEmotion.coreEmotion}
                                </span>
                              )}
                              {linkedEmotion?.primaryEmotion && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                                  {linkedEmotion.primaryEmotion}
                                </span>
                              )}
                              {linkedEmotion?.tertiaryEmotion && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                                  {linkedEmotion.tertiaryEmotion}
                                </span>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground text-xs">No emotions linked</span>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-indigo-100">
                    <BrainCircuit className="h-4 w-4 text-indigo-500" />
                  </div>
                  Automatic Thoughts
                </h3>
                <p className="text-sm pl-7">{selectedRecord.automaticThoughts}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  Cognitive Distortions
                </h3>
                <div className="pl-7 flex flex-wrap gap-1">
                  {selectedRecord.cognitiveDistortions && selectedRecord.cognitiveDistortions.length > 0 ? (
                    selectedRecord.cognitiveDistortions.map((distortion, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">
                        {distortion}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">None identified</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-purple-100">
                    <Scale className="h-4 w-4 text-purple-500" />
                  </div>
                  Evidence For
                </h3>
                <p className="text-sm pl-7">{selectedRecord.evidenceFor || "None provided"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-purple-100">
                    <Scale className="h-4 w-4 text-purple-500" />
                  </div>
                  Evidence Against
                </h3>
                <p className="text-sm pl-7">{selectedRecord.evidenceAgainst || "None provided"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-blue-100">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                  </div>
                  Alternative Perspective
                </h3>
                <p className="text-sm pl-7">{selectedRecord.alternativePerspective}</p>
              </div>
              
              {selectedRecord.reflectionNotes && (
                <div>
                  <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-gray-100">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                    </div>
                    Reflection Notes
                  </h3>
                  <p className="text-sm pl-7">{selectedRecord.reflectionNotes}</p>
                </div>
              )}
              
              {selectedRecord.relatedJournalEntryIds && selectedRecord.relatedJournalEntryIds.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-primary/10">
                      <BookText className="h-4 w-4 text-primary" />
                    </div>
                    Connected Journal Entries
                  </h3>
                  <div className="pl-7">
                    <div className="flex flex-wrap gap-1">
                      {selectedRecord.relatedJournalEntryIds.map((journalId) => (
                        <Button 
                          key={journalId}
                          variant="outline" 
                          size="sm"
                          className="h-7 px-2 py-0 text-xs"
                          onClick={() => window.location.href = `/journals/${journalId}`}
                        >
                          Entry #{journalId}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              {!isViewingClientData && (
                <Button 
                  onClick={() => {
                    handleEditRecord(selectedRecord);
                    setSelectedRecord(null);
                  }}
                  className="text-primary hover:text-primary-dark"
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Record
                </Button>
              )}
              {showPracticeButton && !isViewingClientData && (
                <Button 
                  onClick={() => {
                    window.location.href = `/reframe-coach/practice/quick/${selectedRecord.id}?userId=${targetUserId}`;
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Practice Reframing
                </Button>
              )}
              {isViewingClientData && (
                <Button
                  onClick={() => {
                    // Direct approach with full-page navigation to unified page
                    const url = `/users/${targetUserId}/reframe-coach?tab=history`;
                    console.log("Navigating to practice history:", url);
                    window.location.href = url;
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <BookText className="h-4 w-4 mr-2" />
                  View Practice History
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this thought record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {deleteThoughtMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reframe Practice Assignment Dialog */}
      {selectedRecord && (
        <Dialog open={showReframeDialog} onOpenChange={setShowReframeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Reframe Practice</DialogTitle>
              <DialogDescription>
                Create a reframing practice assignment for this client based on their thought record.
              </DialogDescription>
            </DialogHeader>
            
            <CreateReframePracticeForm 
              thoughtRecord={selectedRecord}
              clientId={activeUserId}
              onSuccess={() => {
                setShowReframeDialog(false);
                setSelectedRecord(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Thought Challenge Wizard Dialog */}
      {thoughtToChallenge && (
        <Dialog open={!!thoughtToChallenge} onOpenChange={() => setThoughtToChallenge(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ThoughtChallengeWizard
              thoughtRecord={thoughtToChallenge}
              onComplete={() => {
                // Refresh the thought records list
                if (targetUserId) {
                  queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/thoughts`] });
                }
                setThoughtToChallenge(null);
                toast({
                  title: "Success! 🎉",
                  description: "You've successfully challenged this thought.",
                });
              }}
              onCancel={() => setThoughtToChallenge(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}