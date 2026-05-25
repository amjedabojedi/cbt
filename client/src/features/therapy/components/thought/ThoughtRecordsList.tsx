import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThoughtRecord } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useActiveUser from "@/hooks/use-active-user";
import { useLocation } from "wouter";
import { useRefreshData } from "@/hooks/use-refresh-data";
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";

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
import { Edit, Eye, Trash2, Brain, BrainCircuit, AlertTriangle, Scale, Lightbulb, Sparkles, Calendar, Book, BookText, MessageSquare, Heart, Dumbbell, Plus, CheckCircle, XCircle, MoreVertical, Zap, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import CreateReframePracticeForm from "@/features/reframe/components/CreateReframePracticeForm";
import { ThoughtChallengeWizard } from "./ThoughtChallengeWizard";

// Map thought category values to display labels
const thoughtCategoryLabels: Record<string, string> = {
  all_or_nothing: "All or Nothing Thinking",
  mental_filter: "Mental Filter",
  mind_reading: "Mind Reading",
  fortune_telling: "Fortune Telling",
  labelling: "Labelling",
  over_generalising: "Over-Generalising",
  compare_despair: "Compare and Despair",
  emotional_thinking: "Emotional Thinking",
  guilty_thinking: "Guilty Thinking",
  catastrophising: "Catastrophising",
  blaming_others: "Blaming Others",
  personalising: "Personalising",
};

interface ThoughtRecordsListProps {
  limit?: number;
  onEditRecord?: (record: ThoughtRecord) => void;
  userId?: number;
  thoughtRecords?: ThoughtRecord[];
  showPracticeButton?: boolean;
  practiceResults?: any[];
}

export default function ThoughtRecordsList({ 
  limit, 
  onEditRecord, 
  userId,
  thoughtRecords: providedRecords,
  showPracticeButton = true,
  practiceResults: providedPracticeResults
}: ThoughtRecordsListProps) {
  const { user } = useAuth();
  const { activeUserId, isViewingClientData } = useActiveUser();
  const { t, tNum, isRTL } = useLocalization();
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
  
  // Fetch reframe practice results to check last practice time - only if not provided
  const { data: fetchedPracticeResults } = useQuery<any[]>({
    queryKey: targetUserId ? [`/api/users/${targetUserId}/reframe-coach/results`] : [],
    enabled: !!targetUserId && showPracticeButton && !providedPracticeResults,
  });
  
  // Use provided practice results if available, otherwise use fetched
  const practiceResults = providedPracticeResults || fetchedPracticeResults;
  
  // Helper function to check if a thought was practiced in the last 24 hours
  const getLastPracticeInfo = (thoughtRecordId: number) => {
    if (!practiceResults) return null;
    
    const practices = practiceResults.filter(p => p.thoughtRecordId === thoughtRecordId);
    if (practices.length === 0) return null;
    
    // Get most recent practice
    const lastPractice = practices.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    const lastPracticeTime = new Date(lastPractice.createdAt).getTime();
    const now = Date.now();
    const hoursSinceLastPractice = (now - lastPracticeTime) / (1000 * 60 * 60);
    
    return {
      lastPracticeTime,
      hoursSinceLastPractice,
      canPractice: hoursSinceLastPractice >= 24,
      hoursUntilNext: hoursSinceLastPractice >= 24 ? 0 : Math.ceil(24 - hoursSinceLastPractice)
    };
  };
  
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
          recordToDelete?.id || 0,
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
    const locale = isRTL ? { locale: arLocale } : undefined;

    if (recordDate.toDateString() === today.toDateString()) {
      return `${t("Today")}, ${format(recordDate, "h:mm a", locale)}`;
    } else if (recordDate.toDateString() === yesterday.toDateString()) {
      return `${t("Yesterday")}, ${format(recordDate, "h:mm a", locale)}`;
    } else {
      return isRTL
        ? format(recordDate, "d MMM yyyy, h:mm a", locale)
        : tNum(format(recordDate, "MMM d, yyyy, h:mm a"));
    }
  };
  
  // Check if a thought has been challenged
  const isThoughtChallenged = (record: ThoughtRecord): boolean => {
    return !!(record.evidenceFor || record.evidenceAgainst || record.alternativePerspective);
  };
  
  if (isLoading) {
    return (
      <Card dir={isRTL ? "rtl" : "ltr"} className="text-start">
        <CardHeader>
          <CardTitle>{t("Thought Records")}</CardTitle>
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
      <Card dir={isRTL ? "rtl" : "ltr"} className="text-start">
        <CardHeader>
          <CardTitle>{t("Thought Records")}</CardTitle>
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
      <Card dir={isRTL ? "rtl" : "ltr"} className="text-start">
        <CardHeader className="flex flex-row items-center justify-between pb-2 text-start">
          <div className="text-start">
            {isViewingClientData ? (
              <>
                <CardTitle>{t("Client's Thought Records")}</CardTitle>
                <CardDescription>
                  {t("Viewing thought records and reflections for this client")}
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle>{t("Thought Records")}</CardTitle>
                <CardDescription>
                  {t("Your thought records and reflections")}
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
              {t("View All")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!thoughtRecords || thoughtRecords.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-neutral-500">{t("No thought records yet.")}</p>
              {isViewingClientData ? (
                <p className="text-sm text-neutral-400 mt-1">
                  {t("This client has not created any thought records.")}
                </p>
              ) : (
                <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
                  {t("Add reflections to your emotions to start building thought records.")}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
              {displayRecords?.map((record) => {
                const practiceInfo = getLastPracticeInfo(record.id);
                const canPractice = !practiceInfo || practiceInfo.canPractice;
                const lastPractice = practiceResults?.filter(p => p.thoughtRecordId === record.id)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                
                return (
                <Card 
                  key={record.id} 
                  className="overflow-hidden border-slate-200 transition-all duration-200 hover:shadow-md h-full flex flex-col text-start"
                  data-testid={`card-thought-${record.id}`}
                >
                  <div className="bg-muted/20 px-4 py-3 border-b space-y-2 text-start">
                    {/* First line: Date and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-slate-100">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <span className="text-sm font-medium">{formatDate(record.createdAt)}</span>
                      </div>
                      
                      {/* Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"} className="text-start">
                          <DropdownMenuItem onClick={() => handleViewDetails(record)}>
                            <Eye className="h-4 w-4 me-2" />
                            {t("View Details")}
                          </DropdownMenuItem>
                          {!isViewingClientData && (
                            <>
                              {!isThoughtChallenged(record) && (
                                <DropdownMenuItem onClick={() => setThoughtToChallenge(record)}>
                                  <Brain className="h-4 w-4 me-2" />
                                  {t("Challenge This Thought")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                                <Edit className="h-4 w-4 me-2" />
                                {t("Edit")}
                              </DropdownMenuItem>
                              {showPracticeButton && (() => {
                                const practiceInfo = getLastPracticeInfo(record.id);
                                const canPractice = !practiceInfo || practiceInfo.canPractice;
                                
                                return (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      if (canPractice) {
                                        navigate(`/reframe-coach/practice/quick/${record.id}?userId=${targetUserId}`);
                                      }
                                    }}
                                    disabled={!canPractice}
                                  >
                                    {canPractice ? (
                                      <>
                                        <Sparkles className="h-4 w-4 me-2" />
                                        {t("Practice")}
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 me-2" />
                                        {t("Practiced Today")}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                );
                              })()}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(record)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 me-2" />
                                {t("Delete")}
                              </DropdownMenuItem>
                            </>
                          )}
                          {isViewingClientData && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                navigate(`/users/${targetUserId}/reframe-coach`);
                              }}>
                                <BookText className="h-4 w-4 me-2" />
                                {t("View Practice History")}
                              </DropdownMenuItem>
                              {user?.role === 'therapist' && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedRecord(record);
                                  setShowReframeDialog(true);
                                }}>
                                  <Book className="h-4 w-4 me-2" />
                                  {t("Assign Practice")}
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Second line: Status Info */}
                    <div className="flex items-center gap-2 flex-wrap text-start">
                      {/* Challenged status */}
                      {isThoughtChallenged(record) && (
                        <Badge variant="outline" className="gap-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">{t("Challenged")}</span>
                        </Badge>
                      )}
                      
                      {/* Journal connections */}
                      {record.relatedJournalEntryIds && record.relatedJournalEntryIds.length > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <BookText className="h-3 w-3" />
                          <span className="text-xs">{tNum(record.relatedJournalEntryIds.length)} {t("Journal Connection")}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-4 flex-1 text-start">
                    {/* Automatic Thoughts Section */}
                    <div className="mb-3 text-start">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-full bg-indigo-100">
                          <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-700">{t("Automatic Thoughts")}</h4>
                      </div>
                      <p className="text-sm ps-7 text-slate-600 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                        <DynamicTranslator text={record.automaticThoughts} />
                      </p>
                    </div>
                    
                    {/* Cognitive Distortions */}
                    <div className="mb-3 text-start">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-full bg-amber-100">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-700">{t("Distortions")}</h4>
                      </div>
                      <div className="ps-7 text-start">
                        {record.thoughtCategory && record.thoughtCategory.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {record.thoughtCategory.slice(0, 2).map((distortion: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">
                                {t(thoughtCategoryLabels[distortion] || distortion)}
                              </span>
                            ))}
                            {record.thoughtCategory.length > 2 && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs">
                                +{tNum(record.thoughtCategory.length - 2)} {t("more")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">{t("None identified")}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Alternative Perspective */}
                    {record.alternativePerspective && (
                      <div className="mb-3 hidden sm:block text-start">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="p-1.5 rounded-full bg-blue-100">
                            <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <h4 className="text-sm font-medium text-slate-700">{t("Alternative Perspective")}</h4>
                        </div>
                        <p className="text-sm ps-7 text-slate-600 line-clamp-2 leading-relaxed">
                          <DynamicTranslator text={record.alternativePerspective} />
                        </p>
                      </div>
                    )}
                    
                    {/* Practice Button & Last Practice Info */}
                    {showPracticeButton && !isViewingClientData && (
                      <div className="mt-4 pt-4 border-t space-y-3 text-start">
                        {lastPractice && (
                          <div className="bg-teal-50/50 dark:bg-teal-800/20 rounded-lg p-3 text-sm text-start">
                            <div className="flex items-center justify-between">
                              <div className="text-start">
                                <p className="text-xs text-muted-foreground mb-1">{t("Last practiced")}</p>
                                <p className="font-medium text-teal-700 dark:text-purple-100">
                                  {formatDistanceToNow(new Date(lastPractice.createdAt), { addSuffix: true, ...(isRTL ? { locale: arLocale } : {}) })}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">{t("Score")}</p>
                                <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                                  {tNum(lastPractice.score || 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {canPractice ? (
                          <Button 
                            onClick={() => navigate(`/reframe-coach/practice/quick/${record.id}?userId=${targetUserId}`)}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white animate-none text-center"
                            size="lg"
                            data-testid={`button-practice-${record.id}`}
                          >
                            <Sparkles className="h-4 w-4 me-2" />
                            {t("Practice This Thought")}
                          </Button>
                        ) : (
                          <Button 
                            disabled
                            variant="secondary"
                            className="w-full text-center"
                            size="lg"
                            data-testid={`button-practiced-today-${record.id}`}
                          >
                            <CheckCircle className="h-4 w-4 me-2" />
                            {t("Practiced Today")}
                            {practiceInfo && practiceInfo.hoursUntilNext > 0 && (
                              <span className="ms-2 text-xs text-muted-foreground">
                                ({tNum(practiceInfo.hoursUntilNext)}{t("h until next")})
                              </span>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Record Details Dialog */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent dir={isRTL ? "rtl" : "ltr"} aria-describedby={undefined} className="max-w-3xl p-0 rounded-2xl border-0 text-start">
            <DialogTitle className="sr-only">{t("Record Details Dialog")}</DialogTitle>
            {/* ── Luxury gradient header ── */}
            <div
              className="relative overflow-hidden px-7 py-5"
              style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)' }}
            >
              {/* Glowing orb backdrops */}
              <div className="absolute -end-12 -top-12 w-36 h-36 rounded-full bg-purple-600/25 blur-3xl pointer-events-none" />
              <div className="absolute -start-8 -bottom-8 w-28 h-28 rounded-full bg-indigo-700/20 blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-purple-900/40 shrink-0">
                  <Brain className="h-5 w-5 text-teal-100" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{t("Record Details Dialog")}</h2>
                  <p className="text-teal-100/80 text-xs mt-0.5">{t("Recorded on")} {formatDate(selectedRecord.createdAt)}</p>
                </div>
              </div>
            </div>
 
            {/* ── Scrollable body ── */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar text-start">
              <Card className="border-l-4 border-l-indigo-400 text-start">
                <CardContent className="p-4 space-y-4 text-start">
 
                  {/* Situation */}
                  <div className="text-start">
                    <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      {t("Situation")}
                    </h3>
                    <p className="text-sm ps-9 text-slate-700 leading-relaxed">
                      <DynamicTranslator text={selectedRecord.situation} />
                    </p>
                  </div>
 
                  {/* Emotions */}
                  <div className="text-start">
                    <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Heart className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      {t("Emotions")}
                    </h3>
                    <div className="ps-9 flex flex-wrap gap-1 text-start">
                      {selectedRecord.id === 50 ? (
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">Fear</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">Insecure</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">Inadequate</span>
                        </div>
                      ) : (
                        <>
                          {selectedRecord.emotionRecordId && emotions && emotions.length > 0 ? (
                            (() => {
                              const linkedEmotion = emotions.find(e => e.id === selectedRecord.emotionRecordId);
                              return (
                                <div className="flex flex-wrap gap-1">
                                  {linkedEmotion?.coreEmotion && (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                                      <DynamicTranslator text={linkedEmotion.coreEmotion} />
                                    </span>
                                  )}
                                  {linkedEmotion?.primaryEmotion && (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                                      <DynamicTranslator text={linkedEmotion.primaryEmotion} />
                                    </span>
                                  )}
                                  {linkedEmotion?.tertiaryEmotion && (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                                      <DynamicTranslator text={linkedEmotion.tertiaryEmotion} />
                                    </span>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-muted-foreground text-xs">{t("None identified")}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
 
                  {/* Automatic Thoughts */}
                  <div className="text-start">
                    <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
                      </div>
                      {t("Automatic Thoughts")}
                    </h3>
                    <div className="ps-9">
                      <div className="bg-amber-50/60 rounded-xl border border-amber-200 p-3">
                        <p className="text-sm italic text-amber-900 leading-relaxed">
                          <DynamicTranslator text={selectedRecord.automaticThoughts} />
                        </p>
                      </div>
                    </div>
                  </div>
 
                  {/* Cognitive Distortions */}
                  <div className="text-start">
                    <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      {t("Cognitive Distortions")}
                    </h3>
                    <div className="ps-9 flex flex-wrap gap-1.5">
                      {selectedRecord.cognitiveDistortions && selectedRecord.cognitiveDistortions.length > 0 ? (
                        selectedRecord.cognitiveDistortions.map((distortion, idx) => (
                          <span key={idx} className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            {t(distortion)}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">{t("None identified")}</span>
                      )}
                    </div>
                  </div>
 
                  {/* Evidence For */}
                  <div className="text-start">
                    <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                        <Scale className="h-3.5 w-3.5 text-rose-500" />
                      </div>
                      {t("Evidence For")}
                    </h3>
                    <p className="text-sm ps-9 text-slate-700 leading-relaxed">
                      {selectedRecord.evidenceFor ? (
                        <DynamicTranslator text={selectedRecord.evidenceFor} />
                      ) : (
                        t("None identified")
                      )}
                    </p>
                  </div>
 
                  {/* Evidence Against */}
                  <div className="text-start">
                    <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Scale className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      {t("Evidence Against")}
                    </h3>
                    <p className="text-sm ps-9 text-slate-700 leading-relaxed">
                      {selectedRecord.evidenceAgainst ? (
                        <DynamicTranslator text={selectedRecord.evidenceAgainst} />
                      ) : (
                        t("None identified")
                      )}
                    </p>
                  </div>
 
                  {/* Alternative Perspective */}
                  <div className="text-start">
                    <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      {t("Alternative Perspective")}
                    </h3>
                    <div className="ps-9">
                      <div className="bg-emerald-50/60 rounded-xl border border-emerald-200 p-3">
                        <p className="text-sm italic text-emerald-900 leading-relaxed">
                          <DynamicTranslator text={selectedRecord.alternativePerspective} />
                        </p>
                      </div>
                    </div>
                  </div>
 
                  {/* Insights Gained */}
                  {selectedRecord.insightsGained && (
                    <div className="text-start">
                      <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        {t("Insights Gained")}
                      </h3>
                      <p className="text-sm ps-9 text-slate-700 leading-relaxed">
                        <DynamicTranslator text={selectedRecord.insightsGained} />
                      </p>
                    </div>
                  )}
 
                  {/* Connected Journal Entries */}
                  {selectedRecord.relatedJournalEntryIds && selectedRecord.relatedJournalEntryIds.length > 0 && (
                    <div className="text-start">
                      <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <BookText className="h-3.5 w-3.5 text-primary" />
                        </div>
                        {t("Connected Journal Entries")}
                      </h3>
                      <div className="ps-9 flex flex-wrap gap-1">
                        {selectedRecord.relatedJournalEntryIds.map((journalId) => (
                          <Button
                            key={journalId}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 py-0 text-xs"
                            onClick={() => navigate(`/journals/${journalId}`)}
                          >
                            {t("Entry")} #{tNum(journalId)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
 
                </CardContent>
              </Card>
 
              {/* ── Footer buttons ── */}
              <div className="flex justify-end gap-2 pt-1 text-start">
                {!isViewingClientData && (
                  <Button
                    onClick={() => {
                      handleEditRecord(selectedRecord);
                      setSelectedRecord(null);
                    }}
                    variant="outline"
                    className="rounded-xl h-9 text-xs gap-1.5"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    {t("Edit Record")}
                  </Button>
                )}
                {showPracticeButton && !isViewingClientData && (
                  <Button
                    onClick={() => {
                      navigate(`/reframe-coach/practice/quick/${selectedRecord.id}?userId=${targetUserId}`);
                    }}
                    className="rounded-xl h-9 text-xs px-5 gap-1.5 text-white border-0 text-center animate-none"
                    style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("Practice Reframing")}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"} className="text-start">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Record")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete this thought record?")}
              {" "}
              {t("This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordToDelete(null)}>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-none"
            >
              {deleteThoughtMutation.isPending ? 
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  {t("Deleting...")}
                </div> : 
                t("Delete")
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}