import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useClientContext } from "@/context/ClientContext";
import useActiveUser from "@/hooks/use-active-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BackToClientsButton } from "@/components/navigation/BackToClientsButton";
import { 
  CalendarIcon, 
  Plus, 
  Trash2, 
  MessageCircle, 
  MessageSquarePlus,
  Tag, 
  ChevronDown, 
  Edit, 
  User, 
  HelpCircle,
  Sparkles,
  Heart,
  Check,
  InfoIcon,
  X,
  CheckSquare,
  Lightbulb,
  Info,
  Link2,
  ExternalLink,
  BrainCircuit,
  Brain,
  Send,
  Unlink,
  BarChart,
  PieChart,
  BarChart3,
  LineChart,
  ArrowUpDown,
  Activity,
  CheckCircle
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
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import JournalWordCloud from "@/components/journal/JournalWordCloud";
import AppLayout from "@/components/layout/AppLayout";

import { getEmotionInfo } from '@/utils/emotionUtils';

// Helper function to provide descriptions for cognitive distortions
function getDistortionDescription(distortion: string): string {
  const distortions: Record<string, string> = {
    "all-or-nothing thinking": "Viewing situations in absolute, black-and-white categories without considering middle ground.",
    "catastrophizing": "Expecting the worst possible outcome and exaggerating the importance of negative events.",
    "emotional reasoning": "Believing that feelings reflect reality—'I feel it, therefore it must be true.'",
    "fortune telling": "Predicting negative outcomes without adequate evidence.",
    "labeling": "Attaching a negative label to yourself or others instead of describing specific behaviors.",
    "magnification": "Exaggerating the importance of problems or shortcomings while minimizing successes.",
    "mental filtering": "Focusing exclusively on negative aspects while filtering out all positive information.",
    "mind reading": "Assuming you know what others are thinking without sufficient evidence.",
    "overgeneralization": "Drawing broad negative conclusions based on a single incident.",
    "personalization": "Believing you're responsible for external events outside your control.",
    "should statements": "Imposing rigid demands on yourself or others with 'should', 'must', or 'ought to' statements.",
    "disqualifying the positive": "Rejecting positive experiences by insisting they 'don't count'.",
    "jumping to conclusions": "Making negative interpretations without supporting facts.",
    "minimization": "Downplaying or dismissing your positive qualities or achievements."
  };
  
  // Return the description if found, otherwise return a default message
  return distortions[distortion.toLowerCase()] || 
    "A pattern of thought that may distort your perception of reality or situations.";
}

interface JournalEntry {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  mood?: number | null;
  aiSuggestedTags?: string[];
  initialAiTags?: string[];
  aiAnalysis?: string;
  userSelectedTags?: string[];
  emotions?: string[];
  topics?: string[];
  detectedDistortions?: string[];
  userSelectedDistortions?: string[];
  sentimentPositive?: number;
  sentimentNegative?: number;
  sentimentNeutral?: number;
  isPrivate?: boolean;
  comments?: JournalComment[];
  relatedThoughtRecordIds?: number[];
}

interface JournalComment {
  id: number;
  journalEntryId: number;
  userId: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    username: string;
  }
}

interface JournalStats {
  totalEntries: number;
  emotions: Record<string, number>;
  topics: Record<string, number>;
  sentimentOverTime: Array<{
    date: string;
    positive: number;
    negative: number;
    neutral: number;
  }>;
  tagsFrequency: Record<string, number>;
  sentimentPatterns: {
    positive: number;
    neutral: number;
    negative: number;
  } | null;
}

interface ThoughtRecord {
  id: number;
  userId: number;
  emotionRecordId: number | null;
  automaticThoughts: string;
  cognitiveDistortions: string[];
  evidenceFor: string | null;
  evidenceAgainst: string | null;
  alternativePerspective: string | null;
  insightsGained: string | null;
  reflectionRating: number | null;
  rationalThoughts?: string;
  createdAt: string;
  updatedAt?: string;
  emotionIntensityBefore?: number;
  emotionIntensityAfter?: number;
  relatedJournalEntryIds?: number[];
}

export default function Journal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { viewingClientId } = useClientContext();
  const { activeUserId, isViewingSelf } = useActiveUser();
  
  // If viewing client data, use client's ID, otherwise use current user's ID
  const userId = activeUserId;
  
  const [activeTab, setActiveTab] = useState("list");
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showTaggingDialog, setShowTaggingDialog] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
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
  const { data: entries = [], isLoading } = useQuery({ 
    queryKey: ['/api/users/:userId/journal', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await apiRequest('GET', `/api/users/${userId}/journal`);
      const data = await response.json();
      return data;
    },
    enabled: !!userId,
  });
  
  // Get journal stats
  const { data: stats = { 
    totalEntries: 0, 
    emotions: {}, 
    topics: {}, 
    sentimentOverTime: [],
    tagsFrequency: {},
    sentimentPatterns: null
  }} = useQuery<JournalStats>({
    queryKey: ['/api/users/:userId/journal/stats', userId],
    queryFn: async () => {
      if (!userId) return {
        totalEntries: 0,
        emotions: {},
        topics: {},
        sentimentOverTime: [],
        tagsFrequency: {},
        sentimentPatterns: null
      };
      const response = await apiRequest('GET', `/api/users/${userId}/journal/stats`);
      const data = await response.json();
      return data;
    },
    enabled: !!userId,
  });
  
  // Get available thought records for linking
  const { data: userThoughtRecords = [] } = useQuery({ 
    queryKey: ['/api/users/:userId/thoughts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await apiRequest('GET', `/api/users/${userId}/thoughts`);
      const data = await response.json();
      return data;
    },
    enabled: !!userId,
  });
  
  const createEntryMutation = useMutation({
    mutationFn: async (newEntry: { title: string; content: string }) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest('POST', `/api/journal`, newEntry);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setShowEntryDialog(false);
      setTitle("");
      setContent("");
      
      // Instead of just viewing the entry, show the tagging dialog
      loadEntryWithRelatedRecords(data, true);
      
      toast({
        title: "Journal Entry Created",
        description: "Your journal entry has been saved. Please add emotions and topics to help categorize it."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Entry",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<JournalEntry> }) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest('PATCH', `/api/journal/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setShowEntryDialog(false);
      setTitle("");
      setContent("");
      toast({
        title: "Journal Entry Updated",
        description: "Your journal entry has been updated."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Entry",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!userId) throw new Error("User not authenticated");
      await apiRequest('DELETE', `/api/journal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setShowEntryDialog(false);
      setShowConfirmDelete(false);
      setCurrentEntry(null);
      setActiveTab("list"); // Switch back to list view after delete
      toast({
        title: "Journal Entry Deleted",
        description: "Your journal entry has been deleted."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Entry",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const addCommentMutation = useMutation({
    mutationFn: async ({ entryId, comment }: { entryId: number, comment: string }) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest('POST', `/api/users/${userId}/journal/${entryId}/comments`, { comment });
      return response.json();
    },
    onSuccess: (data) => {
      // Update the current entry with the new comment
      if (currentEntry) {
        const updatedComments = [...(currentEntry.comments || []), data];
        setCurrentEntry({
          ...currentEntry,
          comments: updatedComments
        });
        
        // Also invalidate the main query to ensure the list is updated
        queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
        setCommentContent("");
        
        toast({
          title: "Comment Added",
          description: "Your comment has been added to the journal entry."
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Adding Comment",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const updateTagsMutation = useMutation({
    mutationFn: async () => {
      if (!currentEntry || !userId) return null;
      
      const response = await apiRequest('PATCH', `/api/journal/${currentEntry.id}`, {
        userSelectedTags: selectedTags
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        setCurrentEntry(data);
        
        // Invalidate both journal entries and stats queries
        queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
        queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal/stats', userId] });
        
        // Force reload the stats tab if it's active
        if (activeTab === "stats") {
          setActiveTab("view");
          setTimeout(() => setActiveTab("stats"), 100);
        }
        
        toast({
          title: "Tags Updated",
          description: "Your tags have been updated."
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Tags",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const updateDistortionsMutation = useMutation({
    mutationFn: async () => {
      if (!currentEntry || !userId) return null;
      
      const response = await apiRequest('PATCH', `/api/journal/${currentEntry.id}`, {
        userSelectedDistortions: selectedDistortions
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        setCurrentEntry(data);
        
        // Invalidate both journal entries and stats queries
        queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
        queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal/stats', userId] });
        
        toast({
          title: "Cognitive Distortions Updated",
          description: "Your selected cognitive distortions have been updated."
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Distortions",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const linkThoughtRecordMutation = useMutation({
    mutationFn: async (thoughtRecordId: number) => {
      if (!currentEntry || !userId) return null;
      
      const response = await apiRequest('POST', `/api/users/${userId}/journal/${currentEntry.id}/link-record/${thoughtRecordId}`);
      return response.json();
    },
    onSuccess: (data) => {
      loadEntryWithRelatedRecords(data);
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/thoughts', userId] });
      
      setShowThoughtRecordDialog(false);
      
      toast({
        title: "Record Linked",
        description: "Thought record has been linked to this journal entry."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Linking Record",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const unlinkThoughtRecordMutation = useMutation({
    mutationFn: async (thoughtRecordId: number) => {
      if (!currentEntry || !userId) return null;
      
      const response = await apiRequest('DELETE', `/api/users/${userId}/journal/${currentEntry.id}/link-record/${thoughtRecordId}`);
      return response.json();
    },
    onSuccess: (data) => {
      loadEntryWithRelatedRecords(data);
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/thoughts', userId] });
      
      toast({
        title: "Record Unlinked",
        description: "Thought record has been unlinked from this journal entry."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Unlinking Record",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const loadEntryWithRelatedRecords = async (entry: JournalEntry, showTagging = false) => {
    setCurrentEntry(entry);
    
    // Set the suggested tags from the entry
    setSelectedTags(entry.userSelectedTags || entry.emotions || []);
    setSelectedDistortions(entry.userSelectedDistortions || entry.detectedDistortions || []);
    
    // If showTagging is true, show the tagging dialog instead of going to view
    if (showTagging) {
      setShowTaggingDialog(true);
    } else {
      setActiveTab("view");
    }
    
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
      updateEntryMutation.mutate({
        id: currentEntry.id,
        updates: { title, content }
      });
    } else {
      createEntryMutation.mutate({ title, content });
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
      deleteEntryMutation.mutate(currentEntry.id);
    }
  };
  
  const handleViewEntry = (entry: JournalEntry) => {
    loadEntryWithRelatedRecords(entry);
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
    updateTagsMutation.mutate();
  };
  
  // Handler for saving or skipping tags from the tagging dialog
  const handleTaggingComplete = (shouldSaveTags: boolean) => {
    if (shouldSaveTags && currentEntry) {
      updateTagsMutation.mutate();
    }
    setShowTaggingDialog(false);
    setActiveTab("view");
  };
  
  const handleUpdateDistortions = (e: React.FormEvent) => {
    e.preventDefault();
    updateDistortionsMutation.mutate();
  };
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !currentEntry) return;
    
    addCommentMutation.mutate({
      entryId: currentEntry.id,
      comment: commentContent
    });
  };
  
  const handleLinkThoughtRecord = (recordId: number) => {
    linkThoughtRecordMutation.mutate(recordId);
  };
  
  const handleUnlinkThoughtRecord = (recordId: number) => {
    unlinkThoughtRecordMutation.mutate(recordId);
  };
  
  // Determine if user can create new entries (only clients can create their own entries)
  // If viewing another user's data and current user is a therapist, they should only view
  const canCreateEntries = isViewingSelf || user?.role === 'client';
  
  return (
    <AppLayout title="Journal">
      <div className="container py-6 px-8 max-w-6xl ml-4">
        {/* Back to Clients button */}
        <BackToClientsButton />
        
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
        {canCreateEntries && (
          <Button onClick={() => {
            setCurrentEntry(null);
            setTitle("");
            setContent("");
            setShowEntryDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="list">
              <Tag className="mr-2 h-4 w-4" />
              Entries
            </TabsTrigger>
            {currentEntry && (
              <TabsTrigger value="view">
                <Edit className="mr-2 h-4 w-4" />
                View Entry
              </TabsTrigger>
            )}
            <TabsTrigger value="stats">
              <BarChart className="mr-2 h-4 w-4" />
              Stats & Insights
            </TabsTrigger>
          </TabsList>
        
          {/* List of Journal Entries */}
          <TabsContent value="list">
            {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-muted/50"></CardHeader>
                  <CardContent className="h-40 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : entries.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry: JournalEntry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{entry.title}</CardTitle>
                      {canCreateEntries && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(entry)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <CardDescription className="flex items-center text-xs">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {format(new Date(entry.createdAt), "MMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="cursor-pointer" onClick={() => handleViewEntry(entry)}>
                      <p className="text-sm line-clamp-3 mb-2">{entry.content}</p>
                    </div>
                    
                    {entry.userSelectedTags && entry.userSelectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.userSelectedTags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {entry.userSelectedTags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{entry.userSelectedTags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-muted-foreground p-0 h-auto"
                      onClick={() => handleViewEntry(entry)}
                    >
                      <Info className="mr-1 h-3 w-3" />
                      View Details
                    </Button>
                    
                    {entry.comments && entry.comments.length > 0 && (
                      <div className="ml-auto flex items-center text-xs text-muted-foreground">
                        <MessageCircle className="mr-1 h-3 w-3" />
                        {entry.comments.length}
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Journal Entries</CardTitle>
                <CardDescription>
                  You haven't created any journal entries yet. Click the "New Entry" button to get started.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
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
                        {currentEntry.title || "Untitled Entry"}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon size={14} />
                        <span>
                          {format(new Date(currentEntry.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                        </span>
                        {currentEntry.updatedAt && currentEntry.updatedAt !== currentEntry.createdAt && (
                          <span className="text-xs italic">
                            (edited {format(new Date(currentEntry.updatedAt), "MMM d, yyyy")})
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
                          <Edit size={16} className="mr-1" />
                          Edit
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
                    {currentEntry.content}
                  </div>

                  {/* Tag Editor Section */}
                  <div className="p-4 border rounded-md bg-slate-50/50">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Tag size={16} />
                      Tag Editor
                    </h4>

                    {/* Three column layout for emotions, topics, and selected tags */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Suggested Emotions Column */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold flex items-center gap-1">
                          <Heart size={14} className="text-red-500" />
                          Suggested Emotions
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
                              {emotion}
                              {selectedTags.includes(emotion) && (
                                <Check size={12} className="ml-1" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Suggested Topics Column */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold flex items-center gap-1">
                          <Lightbulb size={14} className="text-amber-500" />
                          Topics
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
                              {topic}
                              {selectedTags.includes(topic) && (
                                <Check size={12} className="ml-1" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Selected Tags Column */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold flex items-center gap-1">
                          <CheckSquare size={14} className="text-blue-500" />
                          Selected Tags
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedTags.length > 0 ? (
                            selectedTags.map((tag, i) => (
                              <Badge 
                                key={`selected-${i}`}
                                variant="outline" 
                                className="bg-blue-100 border-blue-200"
                              >
                                {tag}
                                <X 
                                  size={12} 
                                  className="ml-1 cursor-pointer" 
                                  onClick={() => toggleTagSelection(tag)}
                                />
                              </Badge>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">No tags selected yet</p>
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
                            placeholder="Add a custom tag..."
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
                            Add
                          </Button>
                        </div>

                        {/* Save button */}
                        <Button
                          onClick={handleUpdateTags}
                          disabled={updateTagsMutation.isPending}
                          className="w-full mt-3"
                          size="sm"
                        >
                          {updateTagsMutation.isPending ? "Saving..." : "Save Selected Tags"}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Cognitive Distortions Section */}
                  {currentEntry.detectedDistortions && currentEntry.detectedDistortions.length > 0 && (
                    <div className="p-4 border rounded-md bg-orange-50/50">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BrainCircuit size={16} className="text-orange-500" />
                        Detected Cognitive Distortions
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
                                  {distortion}
                                  {selectedDistortions.includes(distortion) && (
                                    <Check size={12} className="ml-1 text-orange-600" />
                                  )}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getDistortionDescription(distortion)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                      
                      {canCreateEntries && (
                        <Button
                          onClick={handleUpdateDistortions}
                          disabled={updateDistortionsMutation.isPending}
                          className="w-full"
                          size="sm"
                          variant="outline"
                        >
                          {updateDistortionsMutation.isPending ? "Saving..." : "Confirm Selected Distortions"}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* AI Analysis Section */}
                  {currentEntry.aiAnalysis && (
                    <div className="p-4 border rounded-md bg-violet-50/50">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Sparkles size={16} className="text-violet-500" />
                        AI Analysis
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">{currentEntry.aiAnalysis}</p>
                    </div>
                  )}
                  
                  {/* Related Thought Records Section */}
                  <div className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Brain size={16} />
                        Related Thought Records
                      </h4>
                      {canCreateEntries && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowThoughtRecordDialog(true)}
                        >
                          <Link2 size={14} className="mr-1" />
                          Link Record
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
                                  Thought Record
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
                                {format(new Date(record.createdAt), "MMM d, yyyy")}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <p className="text-xs font-medium mb-1">Automatic Thoughts:</p>
                              <p className="text-xs line-clamp-2 mb-2">{record.automaticThoughts}</p>
                              
                              {record.cognitiveDistortions && record.cognitiveDistortions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {record.cognitiveDistortions.slice(0, 2).map((d, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 bg-orange-50">
                                      {d}
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
                                <a href={`/thought-records/${record.id}`}>
                                  <ExternalLink size={12} className="mr-1" />
                                  View Full Record
                                </a>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 px-4 border border-dashed rounded">
                        <p className="text-sm text-muted-foreground">
                          No thought records linked to this journal entry yet.
                        </p>
                        {canCreateEntries && (
                          <Button 
                            variant="link" 
                            onClick={() => setShowThoughtRecordDialog(true)}
                            className="mt-2"
                          >
                            Link a thought record
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Comments Section */}
                  <div className="p-4 border rounded-md">
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <MessageCircle size={16} />
                      Comments
                    </h4>
                    
                    {/* Comment List */}
                    {currentEntry.comments && currentEntry.comments.length > 0 ? (
                      <div className="space-y-4 mb-4">
                        {currentEntry.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10">
                                {comment.user?.name?.substring(0, 2) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2">
                                <p className="text-sm font-medium">
                                  {comment.user?.name || 'User'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(comment.createdAt), "MMM d 'at' h:mm a")}
                                </p>
                              </div>
                              <p className="text-sm mt-1">{comment.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 mb-4">
                        <p className="text-sm text-muted-foreground">
                          No comments yet. Be the first to comment.
                        </p>
                      </div>
                    )}
                    
                    {/* Add Comment Form */}
                    <form onSubmit={handleAddComment} className="flex gap-2 items-start">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10">
                          {user?.username?.substring(0, 2) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          className="min-h-0 h-10 resize-none"
                        />
                        <Button 
                          type="submit" 
                          size="icon"
                          disabled={!commentContent.trim() || addCommentMutation.isPending}
                        >
                          {addCommentMutation.isPending ? (
                            <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                          ) : (
                            <Send size={16} />
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
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
                                  <p className="text-xs text-muted-foreground mt-1">{getDistortionDescription(distortion)}</p>
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
      </Tabs>
      
      {/* New/Edit Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{currentEntry ? "Edit Journal Entry" : "Create Journal Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="content" className="block text-sm font-medium">
                Content
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write about your thoughts, feelings, or experiences..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntryDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim() || createEntryMutation.isPending || updateEntryMutation.isPending}
            >
              {createEntryMutation.isPending || updateEntryMutation.isPending ? (
                <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
              ) : currentEntry ? "Save Changes" : "Create Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Journal Entry</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this journal entry? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteEntryMutation.isPending}
            >
              {deleteEntryMutation.isPending ? (
                <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
              ) : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Link Thought Record Dialog */}
      <Dialog open={showThoughtRecordDialog} onOpenChange={setShowThoughtRecordDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link a Thought Record</DialogTitle>
            <DialogDescription>
              Select a thought record to link to this journal entry.
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
                          Thought Record
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {format(new Date(record.createdAt), "MMM d, yyyy")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="text-xs font-medium mb-1">Automatic Thoughts:</p>
                        <p className="text-xs line-clamp-2 mb-2">{record.automaticThoughts}</p>
                        
                        {record.cognitiveDistortions && record.cognitiveDistortions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {record.cognitiveDistortions.slice(0, 2).map((d: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 bg-orange-50">
                                {d}
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
                <p>No thought records found. Create a thought record first to link it.</p>
                <Button asChild className="mt-4">
                  <a href="/thought-records/new">Create Thought Record</a>
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowThoughtRecordDialog(false)}>
              Cancel
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
            <DialogTitle>Add Tags to Your Journal Entry</DialogTitle>
            <DialogDescription>
              Tag your entry with emotions and topics to help organize and track your journal.
              {currentEntry?.aiAnalysis && (
                <div className="mt-2 p-3 bg-slate-50 rounded-md">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">AI-generated insights:</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{currentEntry.aiAnalysis}</p>
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
                    <CardTitle className="text-md">{currentEntry.title || "Untitled Entry"}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {currentEntry.content}
                    </p>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emotions Section */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center">
                        <Heart className="h-4 w-4 mr-2 text-rose-500" />
                        Emotions
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
                                    {emotion}
                                    {selectedTags.includes(emotion) && (
                                      <CheckCircle className="h-3 w-3 ml-1" />
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
                          <p className="text-sm text-muted-foreground">No emotions detected. Select emotions from topics or add custom tags below.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Topics Section */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-blue-500" />
                        Topics
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
                                    {topic}
                                    {selectedTags.includes(topic) && (
                                      <CheckCircle className="h-3 w-3 ml-1" />
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
                          <p className="text-sm text-muted-foreground">No topics detected. You can add custom tags below.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Custom Tag Input */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center">
                      <Plus className="h-4 w-4 mr-2 text-green-500" />
                      Add a Custom Tag
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
                        placeholder="Enter a custom tag"
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={!customTag.trim()}
                        size="sm"
                      >
                        Add
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Selected Tags Summary */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center">
                      <CheckSquare className="h-4 w-4 mr-2 text-purple-500" />
                      Selected Tags
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
                                    {tag}
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
                        No tags selected yet. Click on emotions or topics above to select them.
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
              Skip
            </Button>
            <Button 
              onClick={() => handleTaggingComplete(true)}
              disabled={updateTagsMutation.isPending}
            >
              {updateTagsMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Tags
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      </AppLayout>
  );
}