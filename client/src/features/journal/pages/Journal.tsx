import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useClientContext } from "@/context/ClientContext";
import useActiveUser from "@/hooks/use-active-user";
import { useRefreshData } from "@/hooks/use-refresh-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Plus,
  Trash2,
  MessageSquarePlus,
  Tag,
  Edit,
  HelpCircle,
  Sparkles,
  Heart,
  Check,
  X,
  CheckSquare,
  Lightbulb,
  Link2,
  ExternalLink,
  BrainCircuit,
  Brain,
  Unlink,
  Activity,
  CheckCircle,
  Book,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import JournalWordCloud from "@/features/journal/components/JournalWordCloud";
import JournalWizard from "@/features/journal/components/JournalWizard";
import JournalInsights from "@/features/journal/components/JournalInsights";
import AppLayout from "@/components/layout/AppLayout";
import { BackToClientsButton } from "@/features/dashboard/components/navigation/BackToClientsButton";
import { ClientDebug } from "@/features/admin/components/debug/ClientDebug";
import { cn } from "@/lib/utils";
import { JournalList } from "@/features/journal/components/JournalList";
import { JournalEntryForm } from "@/features/journal/components/JournalEntryForm";
import { JournalComments } from "@/features/journal/components/JournalComments";
import { JournalEntryCard } from "@/features/journal/components/JournalEntryCard";
import type { JournalEntry, ThoughtRecord } from "@/features/journal/types";
import {
  useJournalEntries,
  useJournalStats,
  useThoughtRecords,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
  useAddJournalComment,
  useUpdateJournalTags,
  useUpdateJournalDistortions,
  useLinkThoughtRecord,
  useUnlinkThoughtRecord,
} from "@/features/journal/hooks/useJournal";

import { getEmotionInfo } from '@/utils/emotionUtils';
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";
import { JournalTag } from "@/features/journal/components/JournalTag";
import {
  formatJournalTag,
  getDistortionDescription,
  formatDistortionTag,
} from "@/features/journal/utils/journalLabels";

export default function Journal() {
  const { user } = useAuth();
  const { viewingClientId } = useClientContext();
  const { activeUserId, isViewingSelf } = useActiveUser();
  const { refreshAfterOperation } = useRefreshData();
  const { t, isRTL, tNum, currentLanguage } = useLocalization();
  const dateLocale = isRTL ? ar : undefined;
  // If viewing client data, use client's ID, otherwise use current user's ID
  const userId = activeUserId;

  // Check URL parameters for tab
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');

  // Initialize tab based on URL param first, then role - therapists/admins should see history first
  const [activeTab, setActiveTab] = useState(
    tabParam === 'insights'
      ? "insights"
      : tabParam === 'history'
        ? "history"
        : tabParam === 'write'
          ? "write"
          : user?.role === 'therapist' || user?.role === 'admin' ? "history" : "write"
  );
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showTaggingDialog, setShowTaggingDialog] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDistortions, setSelectedDistortions] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showThoughtRecordDialog, setShowThoughtRecordDialog] = useState(false);
  const [relatedThoughtRecords, setRelatedThoughtRecords] = useState<ThoughtRecord[]>([]);

  // Get journal entries
  const { data: entries = [], isLoading } = useJournalEntries(userId);

  // Get journal stats
  const { data: stats = {
    totalEntries: 0,
    emotions: {},
    topics: {},
    sentimentOverTime: [],
    tagsFrequency: {},
    sentimentPatterns: null
  }} = useJournalStats(userId);

  // Get available thought records for linking
  const { data: userThoughtRecords = [] } = useThoughtRecords(userId);

  const createEntryMutation = useCreateJournalEntry();
  const updateEntryMutation = useUpdateJournalEntry();
  const deleteEntryMutation = useDeleteJournalEntry();
  const addCommentMutation = useAddJournalComment();
  const updateTagsMutation = useUpdateJournalTags(userId, currentEntry?.id, selectedTags);
  const updateDistortionsMutation = useUpdateJournalDistortions(userId, currentEntry?.id, selectedDistortions);
  const linkThoughtRecordMutation = useLinkThoughtRecord(currentEntry?.id, userId);
  const unlinkThoughtRecordMutation = useUnlinkThoughtRecord(currentEntry?.id, userId);

  const loadEntryWithRelatedRecords = async (entry: JournalEntry, showTagging = false) => {
    setCurrentEntry(entry);

    // Set the suggested tags from the entry
    setSelectedTags(entry.userSelectedTags || entry.emotions || []);
    setSelectedDistortions(entry.userSelectedDistortions || entry.detectedDistortions || []);

    // If showTagging is true, show the tagging dialog
    if (showTagging) {
      setShowTaggingDialog(true);
    }
    // Note: View tab has been removed in favor of 2-tab layout
    // Detailed viewing functionality to be implemented via dialog if needed

    // Fetch related thought records if they exist
    if (entry.relatedThoughtRecordIds && entry.relatedThoughtRecordIds.length > 0 && userThoughtRecords.length > 0) {
      const recordsToShow = userThoughtRecords.filter((record: ThoughtRecord) =>
        entry.relatedThoughtRecordIds?.includes(record.id)
      );
      setRelatedThoughtRecords(recordsToShow);
    } else {
      setRelatedThoughtRecords([]);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    if (currentEntry) {
      updateEntryMutation.mutate(
        { id: currentEntry.id, updates: { title, content } },
        {
          onSuccess: (_data) => {
            refreshAfterOperation(
              'journal',
              'update',
              currentEntry.id,
              "Your journal entry has been updated.",
              false
            );
            setShowEntryDialog(false);
            setTitle("");
            setContent("");
          },
        }
      );
    } else {
      createEntryMutation.mutate(
        { title, content },
        {
          onSuccess: (data) => {
            refreshAfterOperation(
              'journal',
              'create',
              data.id,
              "Journal entry created successfully! You can view it in your journal history.",
              false
            );
            setTitle("");
            setContent("");
            setActiveTab("history");
          },
        }
      );
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setShowEntryDialog(true);
  };

  const handleDelete = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (currentEntry) {
      deleteEntryMutation.mutate(currentEntry.id, {
        onSuccess: (_data, id) => {
          refreshAfterOperation(
            'journal',
            'delete',
            id,
            "Your journal entry has been deleted.",
            false
          );
          setShowEntryDialog(false);
          setShowConfirmDelete(false);
          setCurrentEntry(null);
          setActiveTab("list");
        },
      });
    }
  };

  const handleViewEntry = (entry: JournalEntry) => {
    // Fetch related thought records if they exist
    if (entry.relatedThoughtRecordIds && entry.relatedThoughtRecordIds.length > 0 && userThoughtRecords.length > 0) {
      const related = userThoughtRecords.filter((tr: ThoughtRecord) =>
        entry.relatedThoughtRecordIds?.includes(tr.id)
      );
      setRelatedThoughtRecords(related);
    } else {
      setRelatedThoughtRecords([]);
    }
    setSelectedViewEntry(entry);
  };

  const toggleTagSelection = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleDistortionSelection = (distortion: string) => {
    setSelectedDistortions(prev =>
      prev.includes(distortion)
        ? prev.filter(d => d !== distortion)
        : [...prev, distortion]
    );
  };

  const handleUpdateTags = (e: React.FormEvent) => {
    e.preventDefault();
    updateTagsMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data) {
          refreshAfterOperation(
            'journal_tags',
            'update',
            data.id,
            "Tags have been updated successfully.",
            false
          );
          setCurrentEntry(data);
          if (activeTab === "stats") {
            setActiveTab("view");
            setTimeout(() => setActiveTab("stats"), 100);
          }
        }
      },
    });
  };

  // Handler for saving or skipping tags from the tagging dialog
  const handleTaggingComplete = (shouldSaveTags: boolean) => {
    if (shouldSaveTags && currentEntry) {
      updateTagsMutation.mutate(undefined, {
        onSuccess: (data) => {
          if (data) {
            refreshAfterOperation(
              'journal_tags',
              'update',
              data.id,
              "Tags have been updated successfully.",
              false
            );
            setCurrentEntry(data);
          }
        },
      });
    }
    setShowTaggingDialog(false);
    setActiveTab("view");
  };

  const handleUpdateDistortions = (e: React.FormEvent) => {
    e.preventDefault();
    updateDistortionsMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data) {
          refreshAfterOperation(
            'journal_distortions',
            'update',
            data.id,
            "Your selected cognitive distortions have been updated.",
            false
          );
          setCurrentEntry(data);
        }
      },
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !currentEntry) return;

    console.log("Adding comment:", commentContent, "to entry:", currentEntry.id);

    addCommentMutation.mutate(
      { entryId: currentEntry.id, comment: commentContent },
      {
        onSuccess: (data) => {
          console.log("Comment added successfully:", data);
          refreshAfterOperation(
            'journal_comment',
            'create',
            currentEntry?.id,
            "Your comment has been added to the journal entry.",
            false
          );
          if (currentEntry) {
            const currentComments = Array.isArray(currentEntry.comments) ? currentEntry.comments : [];
            const updatedComments = [...currentComments, data];
            setCurrentEntry({
              ...currentEntry,
              comments: updatedComments
            });
            setCommentContent("");
          }
        },
      }
    );
  };

  const handleLinkThoughtRecord = (recordId: number) => {
    linkThoughtRecordMutation.mutate(recordId, {
      onSuccess: (data) => {
        console.log("Record linked successfully:", data);
        refreshAfterOperation(
          'journal_link_thought',
          'update',
          data.id,
          "Thought record has been linked to this journal entry.",
          false
        );
        loadEntryWithRelatedRecords(data);
        setShowThoughtRecordDialog(false);
      },
    });
  };

  const handleUnlinkThoughtRecord = (recordId: number) => {
    unlinkThoughtRecordMutation.mutate(recordId, {
      onSuccess: (data) => {
        console.log("Record unlinked successfully:", data);
        refreshAfterOperation(
          'journal_unlink_thought',
          'update',
          data.id,
          "Thought record has been unlinked from this journal entry.",
          false
        );
        loadEntryWithRelatedRecords(data);
      },
    });
  };

  // Determine if user can create new entries (only clients can create their own entries)
  // If viewing another user's data and current user is a therapist, they should only view
  const canCreateEntries = isViewingSelf || user?.role === 'client';

  const pageTitle = isViewingSelf || user?.role === 'client' ? t("Journal") : t("Client's Journal");
  const pageSubtitle = t("Process your emotions and experiences: Reflect on your thoughts and feelings through daily journaling");
  const isWriteTab = activeTab === "write";

  const mostCommonEmotion = Object.keys(stats.emotions).length > 0
    ? Object.entries(stats.emotions).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]
    : "None";
  const uniqueEmotionsCount = Object.keys(stats.emotions).length;

  return (
    <AppLayout title={pageTitle}>
      <div className="min-h-screen bg-slate-50" dir={isRTL ? "rtl" : "ltr"}>
        <ClientDebug />

        {/* Premium Hero Banner */}
        <div className="-mx-2 sm:-mx-4 bg-gradient-to-br from-slate-800 via-teal-900 to-teal-700 px-6 sm:px-10 relative overflow-hidden transition-all duration-300 pt-8 pb-10">
          <div className="absolute -top-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-12 w-52 h-52 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-5xl mx-auto relative text-start">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-teal-300" />
                  <span className="text-teal-300/80 text-xs font-bold tracking-widest uppercase">
                    {isViewingSelf || user?.role === 'client' ? t("Self Reflection") : t("Clinical Review")}
                  </span>
                </div>
                <h1 className="font-bold text-white tracking-tight text-3xl md:text-4xl mb-2">
                  {pageTitle}
                </h1>
                <p className="text-teal-100/70 text-base max-w-md leading-relaxed">
                  {pageSubtitle}
                </p>
              </div>
              
              {stats.totalEntries > 0 && (
                <div className="flex items-center gap-6 shrink-0 flex-wrap">
                  {[
                    { value: tNum(stats.totalEntries), label: t("Total Entries") },
                    { value: formatJournalTag(mostCommonEmotion, t, currentLanguage), label: t("Common Emotion") },
                    { value: tNum(uniqueEmotionsCount), label: t("Unique Emotions") },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-white">{s.value}</div>
                      <div className="text-xs text-teal-300/80 font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Journaling Habit strip */}
            <div className="mt-6 bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Book className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-teal-200 uppercase tracking-widest">{t("Journaling Habit")}</span>
                </div>
                <span className="text-xs text-teal-300">{tNum(stats.totalEntries)} {t("of")} {tNum(30)} {t("entries")}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-teal-400 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.round((stats.totalEntries / 30) * 100))}%` }} />
              </div>
              <p className="text-[11px] text-teal-300/60 mt-1.5">{t("Regular journaling deepens self-awareness and supports emotional processing and healing.")}</p>
            </div>
          </div>
        </div>

        {/* Main Body Layout */}
        <div className="max-w-5xl mx-auto pb-10 pt-6 space-y-5">
          <BackToClientsButton />

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            defaultValue={
              user?.role === 'therapist' || user?.role === 'admin' ? "history" : "write"
            }
            className="space-y-5"
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5">
              <TabsList className="w-full h-auto bg-transparent p-0 gap-1 flex flex-wrap">
                {/* Only show Write Entry tab for clients */}
                {user?.role === 'client' && (
                  <TabsTrigger
                    value="write"
                    className={cn(
                      "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                      "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                      "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                    )}
                  >
                    <MessageSquarePlus className="h-4 w-4 me-1.5 inline" />
                    {t("Write Entry")}
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="history"
                  className={cn(
                    "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <Tag className="h-4 w-4 me-1.5 inline" />
                  {user?.role === 'therapist' || user?.role === 'admin' ? t("Client's Journal") : t("My Journal")}
                </TabsTrigger>
                <TabsTrigger
                  value="insights"
                  className={cn(
                    "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <TrendingUp className="h-4 w-4 me-1.5 inline" />
                  {t("Insights")}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Write Entry tab - only for clients */}
            {user?.role === 'client' && (
              <TabsContent value="write" className="mt-0">
                <JournalWizard onEntryCreated={() => setActiveTab("history")} />
              </TabsContent>
            )}

          {/* Journal History tab */}
          <TabsContent value="history">
            <JournalList
              entries={entries}
              isLoading={isLoading}
              user={user}
              canCreateEntries={canCreateEntries}
              onViewEntry={handleViewEntry}
              onEditEntry={handleEdit}
              onDeleteEntry={handleDelete}
            />
          </TabsContent>

          {/* Single Entry Detailed View */}
          <TabsContent value="view">
            {currentEntry && (
              <div className="space-y-8">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight mb-1">
                        <DynamicTranslator text={currentEntry.title || "Untitled Entry"} />
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon size={14} />
                        <span>
                          {format(new Date(currentEntry.createdAt), "MMMM d, yyyy 'at' h:mm a", { locale: dateLocale })}
                        </span>
                        {currentEntry.updatedAt && currentEntry.updatedAt !== currentEntry.createdAt && (
                          <span className="text-xs italic">
                            ({t("edited")} {format(new Date(currentEntry.updatedAt), "MMM d, yyyy", { locale: dateLocale })})
                          </span>
                        )}
                      </div>
                    </div>

                    {canCreateEntries && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTitle(currentEntry.title);
                            setContent(currentEntry.content);
                            setShowEntryDialog(true);
                          }}
                        >
                          <Edit size={16} className="me-1" />
                          {t("Edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowConfirmDelete(true)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Journal Content */}
                  <div className="whitespace-pre-wrap p-4 border rounded-md bg-white shadow-sm">
                    <DynamicTranslator text={currentEntry.content} />
                  </div>

                  {/* Tag Editor Section */}
                  <div className="p-4 border rounded-md bg-slate-50/50">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Tag size={16} />
                      {t("Tag Editor")}
                    </h4>

                    {/* Three column layout for emotions, topics, and selected tags */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Suggested Emotions Column */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold flex items-center gap-1">
                          <Heart size={14} className="text-red-500" />
                          {t("Suggested Emotions")}
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {currentEntry.emotions?.map((emotion, i) => (
                            <Badge
                              key={`emotion-${i}`}
                              variant="outline"
                              className={`
                                cursor-pointer
                                ${selectedTags.includes(emotion)
                                  ? 'bg-red-100 border-red-200'
                                  : 'bg-white hover:bg-red-50'}
                              `}
                              onClick={() => toggleTagSelection(emotion)}
                            >
                              <JournalTag text={emotion} />
                              {selectedTags.includes(emotion) && (
                                <Check size={12} className="ms-1" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Suggested Topics Column */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold flex items-center gap-1">
                          <Lightbulb size={14} className="text-amber-500" />
                          {t("Topics")}
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {currentEntry.topics?.map((topic, i) => (
                            <Badge
                              key={`topic-${i}`}
                              variant="outline"
                              className={`
                                cursor-pointer
                                ${selectedTags.includes(topic)
                                  ? 'bg-amber-100 border-amber-200'
                                  : 'bg-white hover:bg-amber-50'}
                              `}
                              onClick={() => toggleTagSelection(topic)}
                            >
                              <JournalTag text={topic} />
                              {selectedTags.includes(topic) && (
                                <Check size={12} className="ms-1" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Selected Tags Column */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold flex items-center gap-1">
                          <CheckSquare size={14} className="text-blue-500" />
                          {t("Selected Tags")}
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedTags.length > 0 ? (
                            selectedTags.map((tag, i) => (
                              <Badge
                                key={`selected-${i}`}
                                variant="outline"
                                className="bg-blue-100 border-blue-200"
                              >
                                <JournalTag text={tag} />
                                <X
                                  size={12}
                                  className="ms-1 cursor-pointer"
                                  onClick={() => toggleTagSelection(tag)}
                                />
                              </Badge>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">{t("No tags selected yet")}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {canCreateEntries && (
                      <>
                        {/* Custom tag input */}
                        <div className="flex gap-2 mt-4">
                          <Input
                            type="text"
                            placeholder={t("Add a custom tag...")}
                            value={customTag}
                            onChange={(e) => setCustomTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && customTag.trim()) {
                                e.preventDefault();
                                toggleTagSelection(customTag.trim());
                                setCustomTag('');
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              if (customTag.trim()) {
                                toggleTagSelection(customTag.trim());
                                setCustomTag('');
                              }
                            }}
                          >
                            {t("Add")}
                          </Button>
                        </div>

                        {/* Save button */}
                        <Button
                          onClick={handleUpdateTags}
                          disabled={updateTagsMutation.isPending}
                          className="w-full mt-3 animate-none text-center"
                          size="sm"
                        >
                          {updateTagsMutation.isPending ? t("Saving…") : t("Save Selected Tags")}
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Cognitive Distortions Section */}
                  {currentEntry.detectedDistortions && currentEntry.detectedDistortions.length > 0 && (
                    <div className="p-4 border rounded-md bg-orange-50/50">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BrainCircuit size={16} className="text-orange-500" />
                        {t("Detected Cognitive Distortions")}
                      </h4>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {currentEntry.detectedDistortions.map((distortion) => (
                          <TooltipProvider key={distortion}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className={`
                                    cursor-pointer
                                    ${selectedDistortions.includes(distortion)
                                      ? 'bg-orange-200 border-orange-300'
                                      : 'bg-orange-50 border-orange-100 hover:bg-orange-100'}
                                  `}
                                  onClick={() => toggleDistortionSelection(distortion)}
                                >
                                  {formatDistortionTag(distortion, t)}
                                  {selectedDistortions.includes(distortion) && (
                                    <Check size={12} className="ms-1 text-orange-600" />
                                  )}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs">{getDistortionDescription(distortion, t)}</div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>

                      {canCreateEntries && (
                        <Button
                          onClick={handleUpdateDistortions}
                          disabled={updateDistortionsMutation.isPending}
                          className="w-full animate-none text-center"
                          size="sm"
                          variant="outline"
                        >
                          {updateDistortionsMutation.isPending ? t("Saving…") : t("Confirm Selected Distortions")}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* AI Analysis Section */}
                  {currentEntry.aiAnalysis && (
                    <div className="p-4 border rounded-md bg-violet-50/50">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Sparkles size={16} className="text-violet-500" />
                        {t("AI Analysis")}
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">
                        <DynamicTranslator text={currentEntry.aiAnalysis} />
                      </p>
                    </div>
                  )}

                  {/* Related Thought Records Section */}
                  <div className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Brain size={16} />
                        {t("Related Thought Records")}
                      </h4>
                      {canCreateEntries && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowThoughtRecordDialog(true)}
                        >
                          <Link2 size={14} className="me-1" />
                          {t("Link Record")}
                        </Button>
                      )}
                    </div>

                    {relatedThoughtRecords.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {relatedThoughtRecords.map((record) => (
                          <Card key={record.id} className="border">
                            <CardHeader className="p-3">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-sm">
                                  {t("Thought Record")}
                                </CardTitle>
                                {canCreateEntries && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleUnlinkThoughtRecord(record.id)}
                                  >
                                    <Unlink size={14} />
                                  </Button>
                                )}
                              </div>
                              <CardDescription className="text-xs">
                                {format(new Date(record.createdAt), "MMM d, yyyy", { locale: dateLocale })}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <p className="text-xs font-medium mb-1">{t("Automatic Thoughts")}:</p>
                              <p className="text-xs line-clamp-2 mb-2">
                                <DynamicTranslator text={record.automaticThoughts} />
                              </p>

                              {record.cognitiveDistortions && record.cognitiveDistortions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {record.cognitiveDistortions.slice(0, 2).map((d, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 bg-orange-50">
                                      {formatDistortionTag(d, t)}
                                    </Badge>
                                  ))}
                                  {record.cognitiveDistortions.length > 2 && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1">
                                      +{record.cognitiveDistortions.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="p-3 pt-0">
                              <Button
                                variant="link"
                                className="p-0 h-auto text-xs"
                                asChild
                              >
                                <a href={`/reflection?edit=${record.id}`}>
                                  <ExternalLink size={12} className="me-1" />
                                  {t("View Full Record")}
                                </a>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 px-4 border border-dashed rounded">
                        <p className="text-sm text-muted-foreground">
                          {t("No thought records linked to this journal entry yet.")}
                        </p>
                        {canCreateEntries && (
                          <Button
                            variant="link"
                            onClick={() => setShowThoughtRecordDialog(true)}
                            className="mt-2"
                          >
                            {t("Link a thought record")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <JournalComments
                    comments={currentEntry.comments}
                    user={user}
                    commentContent={commentContent}
                    onCommentChange={setCommentContent}
                    onAddComment={handleAddComment}
                    isPending={addCommentMutation.isPending}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Stats and Insights Tab */}
        <TabsContent value="stats">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Stats Overview */}
              <Card className="lg:col-span-12">
                <CardHeader>
                  <CardTitle className="text-xl">Journal Stats Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 p-4 border rounded-md">
                      <div className="bg-blue-100 p-3 rounded-md">
                        <Edit className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Entries</p>
                        <p className="text-2xl font-bold">{stats.totalEntries}</p>
                      </div>
                  </div>

                    <div className="flex items-center gap-2 p-4 border rounded-md">
                      <div className="bg-orange-100 p-3 rounded-md">
                        <BrainCircuit className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Identified Cognitive Patterns</p>
                        <p className="text-2xl font-bold">
                          {/* Count entries that have detected or user-selected distortions */}
                          {entries.filter((entry: JournalEntry) =>
                            (entry.detectedDistortions && entry.detectedDistortions.length > 0) ||
                            (entry.userSelectedDistortions && entry.userSelectedDistortions.length > 0)
                          ).length}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-4 border rounded-md">
                      <div className="bg-green-100 p-3 rounded-md">
                        <Activity className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Entry Length</p>
                        <p className="text-2xl font-bold">
                          {entries.length > 0
                            ? Math.round(entries.reduce((sum: number, entry: JournalEntry) => sum + entry.content.length, 0) / entries.length)
                            : 0}
                        </p>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>

            {/* Word Cloud */}
              <Card className="lg:col-span-12">
                <CardHeader>
                  <CardTitle className="text-lg">Emotions Word Cloud</CardTitle>
                  <CardDescription>Visual representation of emotions expressed in your journal entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 w-full">
                    {Object.keys(stats.emotions).length > 0 ? (
                      <JournalWordCloud words={stats.emotions} height={180} maxTags={40} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">Not enough emotions tracked in your journal entries yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
            </Card>

            {/* Emotional Patterns */}
              <Card className="lg:col-span-6">
                <CardHeader>
                  <CardTitle className="text-lg">Emotional Patterns</CardTitle>
                  <CardDescription>Most frequent emotions in your journal entries</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {Object.keys(stats.emotions).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(stats.emotions)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([emotion, count]) => (
                          <div key={emotion} className="flex items-center gap-2">
                            <div className="w-full flex-1">
                              <div className="flex justify-between mb-1">
                                <p className="text-sm font-medium">{emotion}</p>
                                <p className="text-sm text-muted-foreground">{count}</p>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{
                                    width: `${Math.min(100, count / Math.max(...Object.values(stats.emotions)) * 100)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Not enough data to display emotional patterns yet.</p>
                    </div>
                  )}
                </CardContent>
            </Card>

            {/* Sentiment Distribution */}
            <Card className="lg:col-span-6">
                <CardHeader>
                  <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
                  <CardDescription>Overall emotional tone of your journal entries</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {stats.sentimentPatterns ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center py-2">
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-md">
                          {/* Positive Sentiment */}
                          <div className="flex flex-col items-center">
                            <div className="h-16 w-16 sm:h-28 sm:w-28 rounded-full border-4 border-green-400 flex items-center justify-center">
                              <p className="text-base sm:text-2xl font-bold text-green-500">{stats.sentimentPatterns.positive}%</p>
                            </div>
                            <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium">Positive</p>
                          </div>

                          {/* Neutral Sentiment */}
                          <div className="flex flex-col items-center">
                            <div className="h-16 w-16 sm:h-28 sm:w-28 rounded-full border-4 border-gray-300 flex items-center justify-center">
                              <p className="text-base sm:text-2xl font-bold text-gray-500">{stats.sentimentPatterns.neutral}%</p>
                            </div>
                            <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium">Neutral</p>
                          </div>

                          {/* Negative Sentiment */}
                          <div className="flex flex-col items-center">
                            <div className="h-16 w-16 sm:h-28 sm:w-28 rounded-full border-4 border-red-400 flex items-center justify-center">
                              <p className="text-base sm:text-2xl font-bold text-red-500">{stats.sentimentPatterns.negative}%</p>
                            </div>
                            <p className="mt-2 text-sm font-medium">Negative</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-400 rounded-sm mr-1"></div>
                          Positive
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gray-300 rounded-sm mr-1"></div>
                          Neutral
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-400 rounded-sm mr-1"></div>
                          Negative
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Not enough data to display sentiment trends yet. Keep journaling!</p>
                    </div>
                  )}
                </CardContent>
            </Card>

            {/* Topics */}
              <Card className="lg:col-span-6">
                <CardHeader>
                  <CardTitle className="text-lg">Topics & Themes</CardTitle>
                  <CardDescription>Common themes in your journaling</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {Object.keys(stats.topics).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(stats.topics)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([topic, count]) => (
                          <div key={topic} className="flex items-center gap-2">
                            <div className="w-full flex-1">
                              <div className="flex justify-between mb-1">
                                <p className="text-sm font-medium">{topic}</p>
                                <p className="text-sm text-muted-foreground">{count}</p>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{
                                    width: `${Math.min(100, count / Math.max(...Object.values(stats.topics)) * 100)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Not enough data to display topics yet.</p>
                    </div>
                  )}
                </CardContent>
            </Card>

            {/* Cognitive Distortion Patterns */}
              <Card className="lg:col-span-12">
                <CardHeader>
                  <CardTitle className="text-lg">Cognitive Distortion Patterns</CardTitle>
                  <CardDescription>Thinking patterns identified in your journal entries</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Create a distortion frequency map from entries */}
                  {(() => {
                    const distortionMap: Record<string, number> = {};
                    entries.forEach((entry: JournalEntry) => {
                      // Count both detected and user-selected distortions
                      const distortions = [
                        ...(entry.detectedDistortions || []),
                        ...(entry.userSelectedDistortions || [])
                      ];

                      // Count unique distortions (no duplicates)
                      new Set(distortions).forEach(distortion => {
                        distortionMap[distortion] = (distortionMap[distortion] || 0) + 1;
                      });
                    });

                    if (Object.keys(distortionMap).length > 0) {
                      return (
                        <div className="space-y-3">
                          {Object.entries(distortionMap)
                            .sort((a, b) => b[1] - a[1])
                            .map(([distortion, count]) => (
                              <div key={distortion} className="flex items-center gap-2">
                                <div className="w-full flex-1">
                                  <div className="flex justify-between mb-1">
                                    <p className="text-sm font-medium">{distortion}</p>
                                    <p className="text-sm text-muted-foreground">{count}</p>
                                  </div>
                                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-orange-500 rounded-full"
                                      style={{
                                        width: `${Math.min(100, count / Math.max(...Object.values(distortionMap)) * 100)}%`
                                      }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{getDistortionDescription(distortion, t)}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">No cognitive distortions identified yet.</p>
                        </div>
                      );
                    }
                  })()}
                </CardContent>
            </Card>

            {/* Sentiment Over Time */}
              <Card className="lg:col-span-12">
                <CardHeader>
                  <CardTitle className="text-lg">Sentiment Over Time</CardTitle>
                  <CardDescription>Tracking your emotional tone across journal entries</CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  {stats.sentimentOverTime && stats.sentimentOverTime.length > 2 ? (
                    <div className="h-64 w-full">
                      {/* Simple sentiment chart visualization */}
                      <div className="h-full w-full grid grid-cols-1">
                        {stats.sentimentOverTime.map((day, index) => (
                          <div key={index} className="flex items-center w-full mb-2">
                            <div className="w-24 text-xs text-muted-foreground">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            <div className="flex-1 flex h-6 rounded-md overflow-hidden">
                              <div
                                className="bg-green-400"
                                style={{ width: `${day.positive * 100}%` }}
                                title={`Positive: ${Math.round(day.positive * 100)}%`}
                              ></div>
                              <div
                                className="bg-gray-300"
                                style={{ width: `${day.neutral * 100}%` }}
                                title={`Neutral: ${Math.round(day.neutral * 100)}%`}
                              ></div>
                              <div
                                className="bg-red-400"
                                style={{ width: `${day.negative * 100}%` }}
                                title={`Negative: ${Math.round(day.negative * 100)}%`}
                              ></div>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-end space-x-4 text-xs text-muted-foreground mt-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-400 rounded-sm mr-1"></div>
                            Positive
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-300 rounded-sm mr-1"></div>
                            Neutral
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-400 rounded-sm mr-1"></div>
                            Negative
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Not enough data to display sentiment trends yet. Keep journaling!</p>
                    </div>
                  )}
                </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights tab */}
        <TabsContent value="insights">
          {userId && <JournalInsights userId={userId} />}
        </TabsContent>
      </Tabs>

      <JournalEntryForm
        open={showEntryDialog}
        onOpenChange={setShowEntryDialog}
        currentEntry={currentEntry}
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={setContent}
        onSubmit={handleSubmit}
        isCreating={createEntryMutation.isPending}
        isUpdating={updateEntryMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("Delete Journal Entry")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{t("Are you sure you want to delete this journal entry? This action cannot be undone.")}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteEntryMutation.isPending}
            >
              {deleteEntryMutation.isPending ? (
                <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
              ) : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Thought Record Dialog */}
      <Dialog open={showThoughtRecordDialog} onOpenChange={setShowThoughtRecordDialog}>
        <DialogContent className="max-w-2xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("Link Thought Record")}</DialogTitle>
            <DialogDescription>
              {t("Select a thought record to link to this journal entry.")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {userThoughtRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1">
                {userThoughtRecords
                  .filter((record: ThoughtRecord) => !(currentEntry?.relatedThoughtRecordIds || []).includes(record.id))
                  .map((record: ThoughtRecord) => (
                    <Card key={record.id} className="cursor-pointer hover:border-primary" onClick={() => handleLinkThoughtRecord(record.id)}>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">
                          {t("Thought Record")}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {format(new Date(record.createdAt), "MMM d, yyyy", { locale: dateLocale })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="text-xs font-medium mb-1">{t("Automatic Thoughts")}:</p>
                        <p className="text-xs line-clamp-2 mb-2">
                          <DynamicTranslator text={record.automaticThoughts} />
                        </p>

                        {record.cognitiveDistortions && record.cognitiveDistortions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {record.cognitiveDistortions.slice(0, 2).map((d: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 bg-orange-50">
                                {formatDistortionTag(d, t)}
                              </Badge>
                            ))}
                            {record.cognitiveDistortions.length > 2 && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1">
                                +{record.cognitiveDistortions.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p>{t("No thought records found. Create a thought record first to link it.")}</p>
                <Button asChild className="mt-4">
                  <a href="/thought-records/new">{t("Create Thought Record")}</a>
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowThoughtRecordDialog(false)}>
              {t("Cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for tagging journal entries immediately after creation */}
      <Dialog open={showTaggingDialog} onOpenChange={(open) => {
        if (!open) {
          handleTaggingComplete(false);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("Add Tags to Your Journal Entry")}</DialogTitle>
            <DialogDescription>
              {t("Tag your entry with emotions and topics to help organize and track your journal.")}
              {currentEntry?.aiAnalysis && (
                <div className="mt-2 p-3 bg-slate-50 rounded-md">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">{t("AI-generated insights:")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <DynamicTranslator text={currentEntry.aiAnalysis} />
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-6 my-3">
            {currentEntry && (
              <div className="space-y-6">
                {/* Journal Content Preview */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-md">
                      <DynamicTranslator text={currentEntry.title || "Untitled Entry"} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      <DynamicTranslator text={currentEntry.content} />
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emotions Section */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center">
                        <Heart className="h-4 w-4 me-2 text-rose-500" />
                        {t("Emotions")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        {currentEntry.emotions?.map((emotion, i) => {
                          const { color, description } = getEmotionInfo(emotion);
                          return (
                            <TooltipProvider key={`${emotion}-${i}`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant={selectedTags.includes(emotion) ? "default" : "outline"}
                                    className={`cursor-pointer hover:opacity-80 transition-colors ${
                                      selectedTags.includes(emotion) ? "" : color
                                    }`}
                                    onClick={() => toggleTagSelection(emotion)}
                                  >
                                    <JournalTag text={emotion} />
                                    {selectedTags.includes(emotion) && (
                                      <CheckCircle className="h-3 w-3 ms-1" />
                                    )}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                        {(!currentEntry.emotions || currentEntry.emotions.length === 0) && (
                          <p className="text-sm text-muted-foreground">{t("No emotions detected. Select emotions from topics or add custom tags below.")}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Topics Section */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center">
                        <Tag className="h-4 w-4 me-2 text-blue-500" />
                        {t("Topics")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        {currentEntry.topics?.map((topic, i) => {
                          const { color, description } = getEmotionInfo(topic);
                          return (
                            <TooltipProvider key={`${topic}-${i}`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant={selectedTags.includes(topic) ? "default" : "outline"}
                                    className={`cursor-pointer hover:opacity-80 transition-colors ${
                                      selectedTags.includes(topic) ? "" : color
                                    }`}
                                    onClick={() => toggleTagSelection(topic)}
                                  >
                                    <JournalTag text={topic} />
                                    {selectedTags.includes(topic) && (
                                      <CheckCircle className="h-3 w-3 ms-1" />
                                    )}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                        {(!currentEntry.topics || currentEntry.topics.length === 0) && (
                          <p className="text-sm text-muted-foreground">{t("No topics detected. You can add custom tags below.")}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Custom Tag Input */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center">
                      <Plus className="h-4 w-4 me-2 text-green-500" />
                      {t("Add a Custom Tag")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (customTag.trim()) {
                        toggleTagSelection(customTag.trim());
                        setCustomTag("");
                      }
                    }} className="flex gap-2">
                      <Input
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        placeholder={t("Enter a custom tag")}
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={!customTag.trim()}
                        size="sm"
                      >
                        {t("Add")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Selected Tags Summary */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center">
                      <CheckSquare className="h-4 w-4 me-2 text-teal-600" />
                      {t("Selected Tags")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {selectedTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag, i) => {
                          const { color, description } = getEmotionInfo(tag);
                          return (
                            <TooltipProvider key={`selected-${tag}-${i}`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 cursor-pointer flex items-center gap-1"
                                    onClick={() => toggleTagSelection(tag)}
                                  >
                                    <JournalTag text={tag} />
                                    <X className="h-3 w-3" />
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("No tags selected yet. Click on emotions or topics above to select them.")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleTaggingComplete(false)}
            >
              {t("Skip")}
            </Button>
            <Button
              onClick={() => handleTaggingComplete(true)}
              disabled={updateTagsMutation.isPending}
            >
              {updateTagsMutation.isPending ? (
                <>
                  <svg className="animate-spin -ms-1 me-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("Saving...")}
                </>
              ) : (
                <>
                  <Check className="me-2 h-4 w-4" />
                  {t("Save Tags")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Journal Entry Details Dialog */}
      {selectedViewEntry && (
        <Dialog open={!!selectedViewEntry} onOpenChange={() => setSelectedViewEntry(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl border-0" dir={isRTL ? "rtl" : "ltr"}>
            {/* Luxury gradient header */}
            <div
              className="relative overflow-hidden px-7 py-5"
              style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)' }}
            >
              <div className="absolute -end-12 -top-12 w-36 h-36 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -start-8 -bottom-8 w-28 h-28 rounded-full bg-indigo-700/20 blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center">
                  <Book className="h-5 w-5 text-teal-100" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white truncate max-w-sm">
                    <DynamicTranslator text={selectedViewEntry.title || t("Untitled Entry")} />
                  </h2>
                  <p className="text-blue-300/80 text-xs mt-0.5">
                    {t("Created on")} {format(new Date(selectedViewEntry.createdAt), "MMM d, yyyy 'at' h:mm a", { locale: dateLocale })}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <Card className="border-s-4 border-s-blue-400 rounded-2xl shadow-sm">
                <CardContent className="p-5 space-y-5">

                  {/* Content */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-800 mb-2">{t("Content")}</h3>
                      <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                        <DynamicTranslator text={selectedViewEntry.content} />
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedViewEntry.userSelectedTags && selectedViewEntry.userSelectedTags.length > 0 && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Tag className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">{t("Tags")}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedViewEntry.userSelectedTags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200 font-medium"
                            >
                              <JournalTag text={tag} />
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Insights */}
                  {selectedViewEntry.aiAnalysis && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">{t("AI Insights")}</h3>
                        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 text-sm leading-relaxed text-amber-900">
                          <DynamicTranslator text={selectedViewEntry.aiAnalysis} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detected Emotions */}
                  {selectedViewEntry.emotions && selectedViewEntry.emotions.length > 0 && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Heart className="h-4 w-4 text-rose-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">{t("Detected Emotions")}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedViewEntry.emotions.map((emotion, index) => (
                            <span
                              key={index}
                              className="bg-rose-50 text-rose-700 border border-rose-200 rounded-full px-2.5 py-1 text-xs font-medium"
                            >
                              <JournalTag text={emotion} />
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detected Topics */}
                  {selectedViewEntry.topics && selectedViewEntry.topics.length > 0 && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Tag className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">{t("Detected Topics")}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedViewEntry.topics.map((topic, index) => (
                            <span
                              key={index}
                              className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1 text-xs font-medium"
                            >
                              <JournalTag text={topic} />
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cognitive Distortions */}
                  {selectedViewEntry.userSelectedDistortions && selectedViewEntry.userSelectedDistortions.length > 0 && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                        <BrainCircuit className="h-4 w-4 text-teal-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">{t("Cognitive Distortions")}</h3>
                        <div className="space-y-2">
                          {selectedViewEntry.userSelectedDistortions.map((distortion, index) => (
                            <div key={index} className="text-sm bg-teal-50/60 border border-teal-100 rounded-xl px-3.5 py-2.5">
                              <span className="font-semibold text-teal-800">{formatDistortionTag(distortion, t)}:</span>{" "}
                              <span className="text-purple-700">{getDistortionDescription(distortion, t)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Related Thought Records */}
                  {relatedThoughtRecords.length > 0 && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Brain className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">{t("Related Thought Records")}</h3>
                        <div className="space-y-2">
                          {relatedThoughtRecords.map((record) => (
                            <Card key={record.id} className="border border-indigo-100 rounded-xl bg-indigo-50/30 shadow-none">
                              <CardContent className="p-3">
                                <p className="text-sm font-medium text-indigo-900">
                                  <DynamicTranslator text={record.automaticThoughts} />
                                </p>
                                {record.situation && (
                                  <p className="text-xs text-indigo-600/80 mt-1">
                                    <DynamicTranslator text={record.situation} />
                                  </p>
                                )}
                                <p className="text-xs text-indigo-500/70 mt-1">
                                  {format(new Date(record.createdAt), "MMM d, yyyy", { locale: dateLocale })}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </div>
    </AppLayout>
  );
}
