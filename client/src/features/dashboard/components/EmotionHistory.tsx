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
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";
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
import ReflectionWizard from "@/features/therapy/components/reflection/ReflectionWizard";

interface EmotionHistoryProps {
  limit?: number;
}

// Helper to get emotion badge color
function getEmotionBadgeColor(emotion: string): string {
  const colorMap: Record<string, string> = {
    "Anger": "bg-red-100 text-red-800",
    "Sadness": "bg-blue-100 text-blue-800",
    "Surprise": "bg-teal-100 text-teal-800",
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
  const { t, tNum, isRTL } = useLocalization();
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
      return `${t("Today")}, ${tNum(format(emotionDate, "h:mm a"))}`;
    } else if (emotionDate.toDateString() === yesterday.toDateString()) {
      return `${t("Yesterday")}, ${tNum(format(emotionDate, "h:mm a"))}`;
    } else {
      return tNum(format(emotionDate, "MMM d, yyyy, h:mm a"));
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <div className="h-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-700"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <p className="text-center text-sm text-red-500">
          Error loading emotion history. Please try again later.
        </p>
      </div>
    );
  }
  
  const displayEmotions = limit && !showFullHistory && emotions ? emotions.slice(0, limit) : emotions;
  const emotionsArray = Array.isArray(emotions) ? emotions : [];

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="text-start">
            <h3 className="font-bold text-slate-800">{t("Recent Entries")}</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {t("Your recently recorded emotions and thoughts")}
            </p>
          </div>
          {limit && emotionsArray.length > limit && (
            <Button 
              variant="ghost" 
              onClick={() => setShowFullHistory(true)}
              className="text-sm text-teal-700 hover:text-slate-800 hover:bg-teal-50 rounded-xl"
            >
              {t("View All")}
            </Button>
          )}
        </div>
        <div className="p-5">
          {emotionsArray.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-4">
                <Heart className="h-7 w-7 text-rose-500" />
              </div>
              <p className="font-medium text-slate-600">{t("No emotion records yet")}</p>
              <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                {t("Use the emotion wheel to start tracking how you feel.")}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 text-start">
              {displayEmotions?.map((emotion) => (
                <div
                  key={emotion.id}
                  className="overflow-hidden rounded-xl border border-slate-100 hover:border-teal-200 hover:shadow-sm transition-all duration-200 bg-slate-50/30 text-start"
                >
                  <div className="px-4 pt-4 pb-2">
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
                        <DropdownMenuContent align={isRTL ? "start" : "end"} className="text-start">
                          <DropdownMenuItem onClick={() => handleViewDetails(emotion)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t("View Details")}
                          </DropdownMenuItem>
                          {!isViewingClientData && (
                            <>
                              <DropdownMenuItem onClick={() => handleEditEmotion(emotion)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t("Edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddThoughtRecord(emotion)}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                {t("Add Thought Record")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(emotion)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("Delete")}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="px-4 pb-4">
                    <div className="space-y-3">
                      {/* Emotion Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">{t("Emotion:")}</span>
                        <Badge className={getEmotionBadgeColor(emotion.tertiaryEmotion || emotion.primaryEmotion || emotion.coreEmotion)}>
                          <DynamicTranslator text={emotion.tertiaryEmotion || emotion.primaryEmotion || emotion.coreEmotion} />
                        </Badge>
                      </div>
                      
                      {/* Intensity */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">{t("Intensity:")}</span>
                        <span className="text-sm font-bold text-slate-800">{tNum(`${emotion.intensity}/10`)}</span>
                      </div>
                      
                      {/* Situation */}
                      <div>
                        <span className="text-sm text-slate-500 block mb-1">{t("Situation:")}</span>
                        <p className="text-sm text-slate-600 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                          <DynamicTranslator text={emotion.situation} />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Emotion Details Dialog */}
      {selectedEmotion && (
        <Dialog open={!!selectedEmotion && !showReflectionWizard} onOpenChange={() => setSelectedEmotion(null)}>
          <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl border-0 text-start">
            <DialogTitle className="sr-only">{t("Emotion Details")}</DialogTitle>
            {/* ── Luxury gradient header ── */}
            <div
              className="relative overflow-hidden px-7 py-5"
              style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)' }}
            >
              {/* Ambient orbs */}
              <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-purple-600/25 blur-3xl pointer-events-none" />
              <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-indigo-700/20 blur-2xl pointer-events-none" />
 
              <div className="relative z-10 flex items-center gap-3.5">
                {/* Glassmorphic emotion icon orb */}
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shrink-0">
                  {selectedEmotion.coreEmotion === 'Joy'     && <Smile      className="h-5 w-5 text-teal-200" />}
                  {selectedEmotion.coreEmotion === 'Sadness' && <Frown      className="h-5 w-5 text-teal-200" />}
                  {selectedEmotion.coreEmotion === 'Anger'   && <Flame      className="h-5 w-5 text-teal-200" />}
                  {selectedEmotion.coreEmotion === 'Fear'    && <AlertCircle className="h-5 w-5 text-teal-200" />}
                  {selectedEmotion.coreEmotion === 'Surprise'&& <Sparkles   className="h-5 w-5 text-teal-200" />}
                  {selectedEmotion.coreEmotion === 'Disgust' && <ThumbsDown className="h-5 w-5 text-teal-200" />}
                  {!['Joy','Sadness','Anger','Fear','Surprise','Disgust'].includes(selectedEmotion.coreEmotion) && (
                    <Heart className="h-5 w-5 text-teal-200" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{t("Emotion Details")}</h2>
                  <p className="text-teal-100/80 text-xs mt-0.5">
                    {t("Recorded on")} {formatDate(selectedEmotion.timestamp)}
                  </p>
                </div>
              </div>
            </div>
 
            {/* ── Body ── */}
            <div className="p-6 space-y-4">
 
              {/* Premium emotion visualization card */}
              {(() => {
                const emotionColor =
                  selectedEmotion.coreEmotion === 'Joy'     ? '#FFC107' :
                  selectedEmotion.coreEmotion === 'Sadness' ? '#7c3aed' :
                  selectedEmotion.coreEmotion === 'Anger'   ? '#F44336' :
                  selectedEmotion.coreEmotion === 'Fear'    ? '#4CAF50' :
                  selectedEmotion.coreEmotion === 'Surprise'? '#9C27B0' :
                  selectedEmotion.coreEmotion === 'Disgust' ? '#795548' : '#9E9E9E';
 
                const emotionBg =
                  selectedEmotion.coreEmotion === 'Joy'     ? 'bg-yellow-50/60'  :
                  selectedEmotion.coreEmotion === 'Sadness' ? 'bg-teal-50/60'  :
                  selectedEmotion.coreEmotion === 'Anger'   ? 'bg-red-50/60'     :
                  selectedEmotion.coreEmotion === 'Fear'    ? 'bg-green-50/60'   :
                  selectedEmotion.coreEmotion === 'Surprise'? 'bg-teal-50/60'  :
                  selectedEmotion.coreEmotion === 'Disgust' ? 'bg-amber-50/60'   : 'bg-slate-50/60';
 
                return (
                  <div
                    className={`rounded-xl border p-5 flex items-center gap-5 ${emotionBg}`}
                    style={{ borderColor: emotionColor + '55' }}
                  >
                    {/* Intensity ring */}
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: `conic-gradient(${emotionColor} ${selectedEmotion.intensity * 10}%, #e2e8f0 0)`,
                      }}
                    >
                      <div className="w-12 h-12 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-slate-800 leading-none">{tNum(`${selectedEmotion.intensity}/10`)}</span>
                      </div>
                    </div>
 
                    {/* Right side */}
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-bold text-slate-800 leading-tight">
                        <DynamicTranslator text={selectedEmotion.coreEmotion} />
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedEmotion.primaryEmotion && (
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getEmotionBadgeColor(selectedEmotion.primaryEmotion)}`}>
                            <DynamicTranslator text={selectedEmotion.primaryEmotion} />
                          </span>
                        )}
                        {selectedEmotion.tertiaryEmotion && (
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getEmotionBadgeColor(selectedEmotion.tertiaryEmotion)}`}>
                            <DynamicTranslator text={selectedEmotion.tertiaryEmotion} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
 
              {/* Context + Situation 2-col grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Context Details */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{t("Context Details")}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">{t("Location")}</div>
                      <div className="text-sm font-medium text-slate-700 capitalize">
                        {selectedEmotion.location ? t(selectedEmotion.location) : t("Not specified")}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">{t("Company")}</div>
                      <div className="text-sm font-medium text-slate-700 capitalize">
                        {selectedEmotion.company ? t(selectedEmotion.company) : t("Not specified")}
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* Situation */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{t("Situation")}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedEmotion.situation ? (
                      <DynamicTranslator text={selectedEmotion.situation} />
                    ) : (
                      t("No situation description provided")
                    )}
                  </p>
                </div>
              </div>
 
              {/* Footer: Related Records + CTA */}
              <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h4 className="text-sm font-medium text-neutral-500 mb-2">{t("Related Records")}</h4>
                </div>
 
                <div className="flex gap-2">
                  {!isViewingClientData && (
                    <Button
                      variant="default"
                      className="rounded-xl h-9 px-5 text-sm gap-2 text-white border-0 bg-teal-800 hover:bg-teal-700"
                      onClick={() => {
                        setShowReflectionWizard(true);
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                      {t("Create Thought Record")}
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
          if (!open) setShowEditEmotionDialog(false);
        }}>
          <DialogContent aria-describedby={undefined} className="max-w-lg p-0 rounded-2xl border-0 overflow-hidden text-start">
            <DialogTitle className="sr-only">{t("Edit Emotion Record")}</DialogTitle>
 
            {/* ── Dark gradient header ── */}
            <div
              className="relative overflow-hidden px-7 py-5"
              style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)' }}
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-indigo-700/15 blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shrink-0">
                  {selectedEmotion.coreEmotion === 'Joy'      && <Smile       className="h-5 w-5 text-teal-200" />}
                  {selectedEmotion.coreEmotion === 'Sadness'  && <Frown       className="h-5 w-5 text-teal-200" />}
                  {selectedEmotion.coreEmotion === 'Anger'    && <Flame       className="h-5 w-5 text-teal-200" />}
                  {selectedEmotion.coreEmotion === 'Fear'     && <AlertCircle className="h-5 w-5 text-teal-200" />}
                  {selectedEmotion.coreEmotion === 'Surprise' && <Sparkles   className="h-5 w-5 text-teal-200" />}
                  {selectedEmotion.coreEmotion === 'Disgust'  && <ThumbsDown className="h-5 w-5 text-teal-200" />}
                  {!['Joy','Sadness','Anger','Fear','Surprise','Disgust'].includes(selectedEmotion.coreEmotion) && (
                    <Heart className="h-5 w-5 text-teal-200" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight leading-tight">{t("Edit Emotion Record")}</h2>
                  <p className="text-teal-100/80 text-xs mt-0.5 font-medium">
                    {t("Recorded on")} {formatDate(selectedEmotion.timestamp)}
                  </p>
                </div>
              </div>
            </div>
 
            {/* ── Form body ── */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateEmotionMutation.mutate({
                id: selectedEmotion.id,
                intensity: parseInt(formData.get('intensity') as string) || selectedEmotion.intensity,
                situation: formData.get('situation') as string || selectedEmotion.situation,
                location:  formData.get('location')  as string || selectedEmotion.location,
                company:   formData.get('company')   as string || selectedEmotion.company,
              });
            }}>
              <div className="px-7 py-6 space-y-5 bg-white">
 
                {/* Read-only emotion snapshot */}
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: `conic-gradient(#7c3aed ${selectedEmotion.intensity * 10}%, #e2e8f0 0)`,
                    }}
                  >
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-slate-700 leading-none">{tNum(`${selectedEmotion.intensity}/10`)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-base">
                      <DynamicTranslator text={selectedEmotion.coreEmotion} />
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedEmotion.primaryEmotion && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getEmotionBadgeColor(selectedEmotion.primaryEmotion)}`}>
                          <DynamicTranslator text={selectedEmotion.primaryEmotion} />
                        </span>
                      )}
                      {selectedEmotion.tertiaryEmotion && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getEmotionBadgeColor(selectedEmotion.tertiaryEmotion)}`}>
                          <DynamicTranslator text={selectedEmotion.tertiaryEmotion} />
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Editable intensity */}
                  <div className="ml-auto flex flex-col items-end gap-1">
                    <label htmlFor="intensity" className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Intensity")}</label>
                    <input
                      type="number"
                      id="intensity"
                      name="intensity"
                      min="1"
                      max="10"
                      defaultValue={selectedEmotion.intensity}
                      className="w-16 text-center text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 outline-none"
                    />
                  </div>
                </div>
 
                {/* Situation */}
                <div className="space-y-1.5">
                  <label htmlFor="situation" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t("Situation")}
                  </label>
                  <textarea
                    id="situation"
                    name="situation"
                    defaultValue={selectedEmotion.situation}
                    placeholder="Describe what was happening when you felt this emotion…"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl min-h-[90px] bg-slate-50/60 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 outline-none resize-none leading-relaxed"
                  />
                </div>
 
                {/* Location + Company */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="location" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("Location")}
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      defaultValue={selectedEmotion.location || ''}
                      placeholder="e.g. Home, Work…"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/60 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="company" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("Company")}
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      defaultValue={selectedEmotion.company || ''}
                      placeholder="e.g. Alone, Friends…"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/60 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 outline-none"
                    />
                  </div>
                </div>
 
              </div>
 
              {/* ── Footer ── */}
              <div className="flex items-center justify-end gap-2.5 px-7 py-4 border-t border-slate-100 bg-white">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditEmotionDialog(false)}
                  className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-9 px-5"
                >
                  {t("Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={updateEmotionMutation.isPending}
                  className="rounded-xl bg-teal-800 hover:bg-teal-700 text-white border-0 shadow-md h-9 px-5 gap-2"
                >
                  {updateEmotionMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("Saving…")}
                    </>
                  ) : t("Save Changes")}
                </Button>
              </div>
            </form>
 
          </DialogContent>
        </Dialog>
      )}
      
      {/* Full History Dialog */}
      <Dialog open={showFullHistory} onOpenChange={setShowFullHistory}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto custom-scrollbar text-start">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
            <DialogTitle>{t("Emotion History")}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t("Date & Time")}</TableHead>
                  <TableHead className="text-start">{t("Emotion")}</TableHead>
                  <TableHead className="text-start">{t("Intensity")}</TableHead>
                  <TableHead className="text-start">{t("Situation")}</TableHead>
                  <TableHead className="text-start">{t("Location")}</TableHead>
                  <TableHead className="text-start">{t("Company")}</TableHead>
                  <TableHead className="text-start">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emotionsArray.map((emotion) => (
                  <TableRow key={emotion.id}>
                    <TableCell className="whitespace-nowrap text-sm text-start">
                      {formatDate(emotion.timestamp)}
                    </TableCell>
                    <TableCell className="text-start">
                      <span className={`px-2 py-1 text-xs rounded-full ${getEmotionBadgeColor(emotion.tertiaryEmotion || emotion.primaryEmotion || emotion.coreEmotion)}`}>
                        <DynamicTranslator text={emotion.tertiaryEmotion || emotion.primaryEmotion || emotion.coreEmotion} />
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-start">
                      {tNum(`${emotion.intensity}/10`)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-start">
                      <DynamicTranslator text={emotion.situation} />
                    </TableCell>
                    <TableCell className="text-sm capitalize text-start">
                      {emotion.location ? t(emotion.location) : "—"}
                    </TableCell>
                    <TableCell className="text-sm capitalize text-start">
                      {emotion.company ? t(emotion.company) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-start">
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
                            title={t("Edit")}
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
                            title={t("Add Thought Record")}
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
        <AlertDialogContent className="text-start">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Emotion Record")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete this emotion record? This will also remove any linked thought records and reflections.")}
              {" "}
              {t("This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmotionToDelete(null)}>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-none"
            >
              {deleteEmotionMutation.isPending ? 
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
