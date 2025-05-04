import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Info as InfoIcon,
  X,
  CheckSquare,
  Lightbulb,
  Info,
  Link2,
  ExternalLink,
  BrainCircuit,
  Brain,
  Send,
  Unlink
} from "lucide-react";
import InsightPanel from "@/components/journal/InsightPanel";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import AppLayout from "@/components/layout/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import JournalWordCloud from "@/components/journal/JournalWordCloud";
import { Separator } from "@/components/ui/separator";

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
  const userId = user?.id;
  
  const [activeTab, setActiveTab] = useState("list");
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
      const response = await apiRequest('POST', `/api/users/${userId}/journal`, newEntry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setShowEntryDialog(false);
      setTitle("");
      setContent("");
      toast({
        title: "Journal Entry Created",
        description: "Your journal entry has been saved."
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
      const response = await apiRequest('PATCH', `/api/users/${userId}/journal/${id}`, updates);
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
      await apiRequest('DELETE', `/api/users/${userId}/journal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setShowEntryDialog(false);
      setShowConfirmDelete(false);
      setCurrentEntry(null);
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
      
      const response = await apiRequest('PATCH', `/api/users/${userId}/journal/${currentEntry.id}`, {
        userSelectedTags: selectedTags
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        setCurrentEntry(data);
        queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
        
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
  
  const linkThoughtRecordMutation = useMutation({
    mutationFn: async ({ journalId, thoughtRecordId }: { journalId: number, thoughtRecordId: number }) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest('POST', `/api/users/${userId}/journal/${journalId}/link-thought`, { thoughtRecordId });
      return response.json();
    },
    onSuccess: (data) => {
      loadEntryWithRelatedRecords(data);
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/thoughts', userId] });
      
      toast({
        title: "Thought Record Linked",
        description: "The thought record has been connected to this journal entry."
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
    mutationFn: async ({ journalId, thoughtRecordId }: { journalId: number, thoughtRecordId: number }) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest('DELETE', `/api/users/${userId}/journal/${journalId}/link-thought/${thoughtRecordId}`);
      return response.json();
    },
    onSuccess: (data) => {
      loadEntryWithRelatedRecords(data);
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/thoughts', userId] });
      
      toast({
        title: "Thought Record Unlinked",
        description: "The thought record has been disconnected from this journal entry."
      });
    },
  });

  // Load already linked thought records when viewing an entry
  useEffect(() => {
    if (currentEntry && currentEntry.relatedThoughtRecordIds?.length && userId) {
      const fetchRelatedRecords = async () => {
        const recordPromises = currentEntry.relatedThoughtRecordIds!.map(id => 
          apiRequest('GET', `/api/users/${userId}/thoughts/${id}`)
            .then(res => res.json())
            .catch(() => null)
        );
        
        const recordResults = await Promise.all(recordPromises);
        const validRecords = recordResults.filter((r): r is ThoughtRecord => r !== null);
        setRelatedThoughtRecords(validRecords);
      };
      
      fetchRelatedRecords();
    } else {
      setRelatedThoughtRecords([]);
    }
  }, [currentEntry, userId]);
  
  const handleCreateEntry = () => {
    createEntryMutation.mutate({ title, content });
  };
  
  const handleUpdateEntry = () => {
    if (currentEntry) {
      updateEntryMutation.mutate({
        id: currentEntry.id,
        updates: { title, content }
      });
    }
  };
  
  const handleDeleteEntry = () => {
    if (currentEntry) {
      deleteEntryMutation.mutate(currentEntry.id);
    }
  };
  
  const handleAddComment = () => {
    if (currentEntry && commentContent.trim()) {
      addCommentMutation.mutate({
        entryId: currentEntry.id,
        comment: commentContent
      });
    }
  };
  
  const toggleTagSelection = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const handleUpdateTags = () => {
    updateTagsMutation.mutate();
  };
  
  const loadEntryWithRelatedRecords = async (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setSelectedTags(entry.userSelectedTags || []);
    
    if (entry.relatedThoughtRecordIds?.length && userId) {
      const recordPromises = entry.relatedThoughtRecordIds.map(id => 
        apiRequest('GET', `/api/users/${userId}/thoughts/${id}`)
          .then(res => res.json())
          .catch(() => null)
      );
      
      const recordResults = await Promise.all(recordPromises);
      const validRecords = recordResults.filter(r => r !== null);
      setRelatedThoughtRecords(validRecords);
    } else {
      setRelatedThoughtRecords([]);
    }
    
    setActiveTab("view");
  };
  
  const openThoughtRecordDialog = () => {
    setShowThoughtRecordDialog(true);
  };
  
  // Get available records that can be linked (not already linked)
  const availableThoughtRecords = userThoughtRecords.filter((record: ThoughtRecord) => 
    !currentEntry?.relatedThoughtRecordIds?.includes(record.id)
  );

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Journal</h1>
          <Button onClick={() => {
            setCurrentEntry(null);
            setTitle("");
            setContent("");
            setShowEntryDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="list" onClick={() => setActiveTab("list")}>Entries</TabsTrigger>
            <TabsTrigger value="view" disabled={!currentEntry}>View Entry</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : entries.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry: JournalEntry) => (
                  <Card key={entry.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-medium line-clamp-1">{entry.title || "Untitled Entry"}</CardTitle>
                        <div className="text-xs text-muted-foreground">
                          {entry.createdAt ? format(new Date(entry.createdAt), "MMM d, yyyy") : "No date available"}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {entry.content}
                      </p>
                      
                      {/* Show tags if any */}
                      {entry.userSelectedTags && entry.userSelectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {entry.userSelectedTags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {entry.userSelectedTags.length > 3 && (
                            <Badge variant="outline" className="bg-muted text-xs">
                              +{entry.userSelectedTags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Show comment count */}
                      {entry.comments && entry.comments.length > 0 && (
                        <div className="flex items-center mt-3 text-xs text-muted-foreground">
                          <MessageCircle size={14} className="mr-1" /> 
                          {entry.comments.length} comment{entry.comments.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-1">
                      <Button variant="ghost" size="sm" className="ml-auto" onClick={() => loadEntryWithRelatedRecords(entry)}>
                        View
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 px-6 border rounded-lg">
                <div className="text-muted-foreground mb-2">No journal entries yet</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Start writing your first journal entry to track your thoughts and emotions
                </p>
                <Button onClick={() => {
                  setCurrentEntry(null);
                  setTitle("");
                  setContent("");
                  setShowEntryDialog(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Create First Entry
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="view" className="mt-6">
            {!currentEntry ? (
              <div className="text-center py-12 text-muted-foreground">
                Select an entry to view its contents
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {currentEntry.title || "Untitled Entry"}
                  </h2>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                      {currentEntry.createdAt ? format(new Date(currentEntry.createdAt), "MMM d, yyyy • p") : "No date available"}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setTitle(currentEntry.title);
                        setContent(currentEntry.content);
                        setShowEntryDialog(true);
                      }}
                    >
                      <Edit size={16} />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setShowConfirmDelete(true)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left side: Journal content and comments */}
                  <div className="lg:col-span-2">
                    <div className="space-y-4">
                      {/* Journal Content */}
                      <div className="whitespace-pre-wrap p-4 border rounded-md bg-white shadow-sm">
                        {currentEntry.content}
                      </div>
                      
                      {/* Add new comment section */}
                      <div className="mt-8 pt-4 border-t">
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <MessageCircle size={16} className="text-green-500" />
                          Add Comment
                        </h4>
                        <div className="flex gap-3">
                          <Textarea
                            placeholder="Write a comment..."
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            size="sm" 
                            onClick={handleAddComment}
                            disabled={!commentContent.trim()}
                            className="self-end"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Post
                          </Button>
                        </div>
                      </div>
                      
                      {/* Comments section - Moved above AI Analysis */}
                      {currentEntry.comments && currentEntry.comments.length > 0 && (
                        <div className="mt-8 pt-4 border-t">
                          <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                            <MessageCircle size={16} className="text-blue-500" />
                            Comments {currentEntry.comments.length > 0 && `(${currentEntry.comments.length})`}
                          </h4>
                          
                          <div className="space-y-4">
                            {currentEntry.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3 p-3 bg-slate-50 rounded-md border">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {comment.user?.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-baseline justify-between">
                                    <h5 className="font-medium text-sm">
                                      {comment.user?.name || "User"}
                                    </h5>
                                    <span className="text-xs text-muted-foreground">
                                      {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, p") : "No date available"}
                                    </span>
                                  </div>
                                  <p className="text-sm mt-1">{comment.comment}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* AI Analysis - Moved below Comments */}
                      {currentEntry.aiAnalysis && (
                        <div className="mt-8 pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Sparkles size={16} className="text-yellow-500" />
                            AI Analysis
                          </h4>
                          <div className="p-4 bg-primary/5 rounded-md">
                            <p className="text-sm text-muted-foreground">
                              {currentEntry.aiAnalysis}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Cognitive Pattern Analysis - Above the Emotional Tone Analysis section */}
                      {relatedThoughtRecords.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <BrainCircuit size={16} className="text-primary" />
                            Cognitive Pattern Analysis
                          </h4>
                          
                          <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
                            {relatedThoughtRecords.length === 1 ? (
                              <p className="text-sm text-muted-foreground">
                                This journal entry is connected to a thought record, helping you track how your thoughts relate to this experience.
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {`This journal entry connects to ${relatedThoughtRecords.length} different thought records, revealing recurring patterns in your cognitive responses.`}
                              </p>
                            )}
                            
                            {/* Show patterns in cognitive distortions if present */}
                            {relatedThoughtRecords.some(r => r.cognitiveDistortions?.length > 0) && (
                              <div className="mt-3">
                                <p className="text-sm font-medium">Identified thinking patterns:</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {(() => {
                                    // Count distortion occurrences
                                    const distortionCounts: Record<string, number> = {};
                                    relatedThoughtRecords.forEach(record => {
                                      if (record.cognitiveDistortions) {
                                        record.cognitiveDistortions.forEach(d => {
                                          distortionCounts[d] = (distortionCounts[d] || 0) + 1;
                                        });
                                      }
                                    });
                                    
                                    // Sort by occurrence count
                                    return Object.entries(distortionCounts)
                                      .sort((a, b) => b[1] - a[1])
                                      .slice(0, 3)
                                      .map(([distortion, count]) => (
                                        <Badge 
                                          key={distortion} 
                                          className="text-sm bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
                                        >
                                          {distortion.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                          {count > 1 && ` (${count})`}
                                        </Badge>
                                      ));
                                  })()}
                                </div>
                                
                                {relatedThoughtRecords.length >= 2 && (
                                  <p className="mt-3 text-sm text-muted-foreground italic">
                                    These recurring patterns help identify your most common cognitive distortions across multiple situations.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    
                      {/* Insights Section - Always show, with different content based on linked records */}
                      <div className="mt-6 pt-4 border-t">
                        <Accordion type="single" collapsible defaultValue="insights" className="w-full">
                          <AccordionItem value="insights">
                            <AccordionTrigger className="py-2">
                              <span className="flex items-center gap-2 text-sm font-medium">
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                Emotional Tone Analysis
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              {currentEntry.sentimentPositive !== undefined && (
                                <div>
                                  <div className="flex flex-col gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs w-16">Positive:</span>
                                      <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-green-500" 
                                          style={{ width: `${currentEntry.sentimentPositive || 0}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs">{currentEntry.sentimentPositive || 0}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs w-16">Negative:</span>
                                      <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-red-500" 
                                          style={{ width: `${currentEntry.sentimentNegative || 0}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs">{currentEntry.sentimentNegative || 0}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs w-16">Neutral:</span>
                                      <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-blue-500" 
                                          style={{ width: `${currentEntry.sentimentNeutral || 0}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs">{currentEntry.sentimentNeutral || 0}%</span>
                                    </div>
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground">
                                    {currentEntry.aiAnalysis || "No analysis available"}
                                  </p>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                    
                    {/* Add comment form */}
                    <div className="mt-4 pt-2 border-t">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddComment();
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          placeholder="Add a comment..."
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="submit"
                          disabled={!commentContent.trim() || addCommentMutation.isPending}
                          size="sm"
                        >
                          {addCommentMutation.isPending ? (
                            <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                          ) : (
                            "Post"
                          )}
                        </Button>
                      </form>
                    </div>
                  </div>
                  
                  {/* Right side: Tags, emotions, and related thought records */}
                  <div className="space-y-6 p-4 border-l border-border hidden lg:block">
                    {/* Related Thought Records Section */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <CheckSquare size={16} className="text-emerald-500" />
                          Related Thought Records
                        </span>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon size={14} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[250px] p-4">
                              <p className="text-xs">
                                These thought records are connected to this journal entry. Link records to track thoughts and emotions across multiple entries.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </h4>
                      
                      <div className="mt-2 space-y-2">
                        {relatedThoughtRecords.length > 0 ? (
                          <>
                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                              {relatedThoughtRecords.map(record => (
                                <div key={record.id} className="flex flex-col rounded-md border p-3 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {record.createdAt ? format(new Date(record.createdAt), "MMM d, yyyy") : "No date available"}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-6 w-6 rounded-full"
                                        asChild
                                      >
                                        <a href={`/thoughts?record=${record.id}`} title="View thought record details">
                                          <ExternalLink size={14} />
                                        </a>
                                      </Button>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-6 w-6 rounded-full"
                                        onClick={() => 
                                          unlinkThoughtRecordMutation.mutate({
                                            journalId: currentEntry!.id,
                                            thoughtRecordId: record.id
                                          })
                                        }
                                        title="Unlink this thought record"
                                      >
                                        <X size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-1 font-medium text-xs">
                                    <span className="text-muted-foreground">Thoughts: </span>
                                    {record.automaticThoughts}
                                  </div>
                                  
                                  {record.cognitiveDistortions?.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {record.cognitiveDistortions.map(distortion => (
                                        <Badge key={distortion} variant="outline" className="text-xs">
                                          {distortion}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Show alternative perspective if available */}
                                  {record.alternativePerspective && (
                                    <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                                      <span className="font-medium">Alternative perspective: </span>
                                      <span className="italic line-clamp-2">{record.alternativePerspective}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* The Cognitive Pattern Analysis section has been moved under comments */}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center py-3 px-2 bg-slate-50 rounded-md border border-dashed">
                            <Brain className="h-10 w-10 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground mb-1">No thought records linked yet</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Linking thought records helps you track cognitive patterns and provides deeper insights about your emotional responses.
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={openThoughtRecordDialog}
                            >
                              <Link2 size={14} className="mr-1" />
                              Link Thought Record
                            </Button>
                          </div>
                        )}
                        
                        {/* Only show Link button if we already have thought records linked */}
                        {relatedThoughtRecords.length > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2 text-xs"
                            onClick={openThoughtRecordDialog}
                          >
                            <Plus size={14} className="mr-1" /> Link Another Thought Record
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Tag size={16} />
                          Selected Tags
                        </span>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon size={14} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[250px] p-4">
                              <p className="text-xs">
                                These are the tags that will be saved with your journal entry. Click on suggested emotions or topics below to add them, or create your own custom tags.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </h4>
                      
                      <div className="flex flex-wrap gap-2 mt-2 min-h-[40px]">
                        {selectedTags.length > 0 ? (
                          selectedTags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary"
                              className="bg-secondary/50 text-secondary-foreground hover:bg-secondary/60 cursor-pointer flex items-center gap-1"
                              onClick={() => toggleTagSelection(tag)}
                            >
                              {tag}
                              <X size={12} className="opacity-70" />
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic px-2">
                            No tags selected yet
                          </span>
                        )}
                      </div>
                      
                      {/* Add custom tag input */}
                      <div className="mt-4 mb-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Create your own custom tag..."
                            className="flex-1"
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
                      </div>
                      
                      <Button
                        onClick={handleUpdateTags}
                        disabled={updateTagsMutation.isPending}
                        className="w-full mt-3"
                        size="sm"
                      >
                        {updateTagsMutation.isPending ? "Saving..." : "Save Selected Tags"}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    {/* Always show the emotions section, with default text if no emotions detected */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Heart size={16} />
                        Suggested Emotions
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon size={14} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[250px] p-4">
                              <p className="text-xs">
                                These emotions are detected by AI based on your entry content. You can click on them to add to your selected tags.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </h4>
                      {currentEntry.emotions && currentEntry.emotions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {/* Deduplicate emotions before displaying them */}
                          {Array.from(new Set(currentEntry.emotions.map(e => e.toLowerCase())))
                            .map((emotion, index) => (
                              <Badge 
                                key={`${emotion}-${index}`}
                                variant="outline"
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                                onClick={() => toggleTagSelection(emotion)}
                              >
                                {emotion}
                              </Badge>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No emotions detected in this entry
                        </p>
                      )}
                    </div>
                    
                    {/* Topics section - similar to emotions */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Info size={16} />
                        Topics
                      </h4>
                      
                      {currentEntry.topics && currentEntry.topics.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {/* Deduplicate topics before displaying them */}
                          {Array.from(new Set(currentEntry.topics.map(t => t.toLowerCase())))
                            .map((topic, index) => (
                              <Badge 
                                key={`${topic}-${index}`}
                                variant="outline"
                                className="bg-purple-50 text-purple-600 hover:bg-purple-100 cursor-pointer"
                                onClick={() => toggleTagSelection(topic)}
                              >
                                {topic}
                              </Badge>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No topics detected
                        </p>
                      )}
                    </div>
                    
                    {/* Word cloud visualization of tags */}
                    {currentEntry.emotions && currentEntry.emotions.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold mb-3">Emotion Cloud</h4>
                        <div className="h-[150px] w-full">
                          {/* Prepare the data for the word cloud */}
                          {(() => {
                            // Create word frequency object
                            const uniqueEmotions = Array.from(new Set(currentEntry.emotions || []));
                            const tagsObject: Record<string, number> = {};
                            
                            uniqueEmotions.forEach(emotion => {
                              if (typeof emotion === 'string') {
                                tagsObject[emotion] = (tagsObject[emotion] || 0) + 1;
                              }
                            });
                            
                            return <JournalWordCloud tags={tagsObject} />;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Create/Edit Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentEntry ? "Edit Journal Entry" : "New Journal Entry"}
            </DialogTitle>
            <DialogDescription>
              {currentEntry 
                ? "Update your journal entry details below." 
                : "Write a new journal entry to track your thoughts and emotions."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-2">
            <div>
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-2"
              />
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntryDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={currentEntry ? handleUpdateEntry : handleCreateEntry}
              disabled={!content.trim() || createEntryMutation.isPending || updateEntryMutation.isPending}
            >
              {(createEntryMutation.isPending || updateEntryMutation.isPending) ? (
                <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
              ) : currentEntry ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Journal Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEntry}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Link Thought Record</DialogTitle>
            <DialogDescription>
              Connect a thought record to gain deeper insights by linking your thoughts and emotions across entries.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-1">
            <div className="space-y-4 py-2">
              {availableThoughtRecords.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-2">No available thought records to link</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    You've either linked all your thought records or need to create new ones.
                  </p>
                  <Button asChild>
                    <a href="/thoughts">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Thought Record
                    </a>
                  </Button>
                </div>
              ) : (
                availableThoughtRecords.map((record: ThoughtRecord) => (
                  <Card key={record.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium">
                          Thought Record
                        </CardTitle>
                        <div className="text-xs text-muted-foreground">
                          {record.createdAt ? format(new Date(record.createdAt), "MMM d, yyyy") : "No date available"}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-xs text-muted-foreground mb-1">Automatic Thoughts:</h4>
                          <p className="text-sm line-clamp-2">{record.automaticThoughts}</p>
                        </div>
                        
                        {record.cognitiveDistortions?.length > 0 && (
                          <div>
                            <h4 className="text-xs text-muted-foreground mb-1">Cognitive Distortions:</h4>
                            <div className="flex flex-wrap gap-1">
                              {record.cognitiveDistortions.map((distortion: string) => (
                                <Badge key={distortion} variant="outline" className="text-xs">
                                  {distortion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="bg-muted/20 pt-2">
                      <Button 
                        className="ml-auto"
                        size="sm"
                        onClick={() => {
                          linkThoughtRecordMutation.mutate({
                            journalId: currentEntry!.id,
                            thoughtRecordId: record.id
                          });
                          setShowThoughtRecordDialog(false);
                        }}
                      >
                        Link This Record
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setShowThoughtRecordDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}