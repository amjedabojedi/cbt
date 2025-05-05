import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
  Check,
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
  Unlink,
  BarChart,
  PieChart,
  BarChart3,
  LineChart,
  ArrowUpDown,
  Activity,
  CheckCircle
} from "lucide-react";
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
  const userId = user?.id;
  
  const [activeTab, setActiveTab] = useState("list");
  const [showEntryDialog, setShowEntryDialog] = useState(false);
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
      
      // Immediately load the created entry to view it
      loadEntryWithRelatedRecords(data);
      
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
  
  const loadEntryWithRelatedRecords = async (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setActiveTab("view");
    setSelectedTags(entry.userSelectedTags || []);
    setSelectedDistortions(entry.userSelectedDistortions || []);
    
    // Fetch related thought records if they exist
    if (entry.relatedThoughtRecordIds && entry.relatedThoughtRecordIds.length > 0) {
      const recordIds = entry.relatedThoughtRecordIds;
      const records = userThoughtRecords.filter(
        (record: ThoughtRecord) => recordIds.includes(record.id)
      );
      setRelatedThoughtRecords(records);
    } else {
      setRelatedThoughtRecords([]);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      toast({
        title: "Empty Entry",
        description: "Please provide either a title or content for your journal entry.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentEntry) {
      updateEntryMutation.mutate({
        id: currentEntry.id,
        updates: { title, content }
      });
    } else {
      createEntryMutation.mutate({ title, content });
    }
  };
  
  const toggleTagSelection = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const toggleDistortionSelection = (distortion: string) => {
    if (selectedDistortions.includes(distortion)) {
      setSelectedDistortions(selectedDistortions.filter(d => d !== distortion));
    } else {
      setSelectedDistortions([...selectedDistortions, distortion]);
    }
  };
  
  const handleUpdateTags = () => {
    updateTagsMutation.mutate();
  };
  
  const handleUpdateDistortions = () => {
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
  
  // Used to determine which thought records can be linked
  const availableThoughtRecords = userThoughtRecords.filter((record: ThoughtRecord) => 
    !(currentEntry?.relatedThoughtRecordIds || []).includes(record.id)
  );
  
  return (
    <AppLayout>
      <div className="container py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
          <Button onClick={() => {
            setCurrentEntry(null);
            setTitle("");
            setContent("");
            setShowEntryDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Button>
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
                        <div>
                          <CardTitle className="text-lg">{entry.title || "Untitled Entry"}</CardTitle>
                          <CardDescription>
                            {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {/* Truncated content */}
                      <p className="mb-3 text-sm line-clamp-3">
                        {entry.content}
                      </p>
                      
                      {/* Display tags if there are any */}
                      {entry.userSelectedTags && entry.userSelectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.userSelectedTags.slice(0, 3).map((tag, i) => (
                            <Badge key={`${tag}-${i}`} variant="outline" className="text-xs bg-secondary/30">
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
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Entry
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* View/Edit Journal Entry */}
          <TabsContent value="view">
            {currentEntry && (
              <div className="grid grid-cols-1 gap-6">
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
                </div>
                
                <div className="mt-6 space-y-6">
                  {/* Journal Content */}
                  <div className="whitespace-pre-wrap p-4 border rounded-md bg-white shadow-sm">
                    {currentEntry.content}
                  </div>

                  {/* Tag Editor Section - moved from sidebar to directly under content */}
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
                          {currentEntry.emotions && currentEntry.emotions.length > 0 ? (
                            Array.from(new Set(currentEntry.emotions.map(e => e.toLowerCase())))
                              .map((emotion, index) => (
                                <Badge 
                                  key={`${emotion}-${index}`}
                                  variant="outline"
                                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                                  onClick={() => toggleTagSelection(emotion)}
                                >
                                  {emotion}
                                </Badge>
                              ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              None detected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Topics Column */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold flex items-center gap-1">
                          <Info size={14} className="text-purple-500" />
                          Topics
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {currentEntry.topics && currentEntry.topics.length > 0 ? (
                            Array.from(new Set(currentEntry.topics.map(t => t.toLowerCase())))
                              .map((topic, index) => (
                                <Badge 
                                  key={`${topic}-${index}`}
                                  variant="outline"
                                  className="bg-purple-50 text-purple-600 hover:bg-purple-100 cursor-pointer"
                                  onClick={() => toggleTagSelection(topic)}
                                >
                                  {topic}
                                </Badge>
                              ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              None detected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected Tags Column */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold flex items-center gap-1">
                          <CheckCircle size={14} className="text-green-500" />
                          Selected Tags
                        </h5>
                        <div className="flex flex-wrap gap-1 min-h-[28px]">
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
                            <span className="text-xs text-muted-foreground italic">
                              None selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Custom tag input row */}
                    <div className="flex gap-2 mt-3">
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

                    {/* Save button */}
                    <Button
                      onClick={handleUpdateTags}
                      disabled={updateTagsMutation.isPending}
                      className="w-full mt-3"
                      size="sm"
                    >
                      {updateTagsMutation.isPending ? "Saving..." : "Save Selected Tags"}
                    </Button>
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
                      
                      <p className="text-xs text-muted-foreground mb-3">
                        Select the cognitive distortions you think are present in your thinking.
                      </p>
                      
                      <Button
                        onClick={handleUpdateDistortions}
                        disabled={updateDistortionsMutation.isPending}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        {updateDistortionsMutation.isPending ? "Saving..." : "Save Selected Distortions"}
                      </Button>
                    </div>
                  )}
                  
                  {/* AI Analysis Section */}
                  {currentEntry.aiAnalysis && (
                    <div className="p-4 border rounded-md bg-blue-50/30">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Sparkles size={16} className="text-blue-500" />
                        AI Analysis
                      </h4>
                      <div className="text-sm space-y-2">
                        {currentEntry.aiAnalysis}
                      </div>
                    </div>
                  )}
                  
                  {/* Related Thought Records Section */}
                  <div className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Link2 size={16} className="text-indigo-500" />
                        Related Thought Records
                      </h4>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setShowThoughtRecordDialog(true)}
                      >
                        Link Record
                      </Button>
                    </div>
                    
                    {relatedThoughtRecords.length > 0 ? (
                      <div className="space-y-3">
                        {relatedThoughtRecords.map((record: ThoughtRecord) => (
                          <Card key={record.id} className="overflow-hidden">
                            <CardHeader className="py-3">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-sm">
                                  {format(new Date(record.createdAt), "MMM d, yyyy")}
                                </CardTitle>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => unlinkThoughtRecordMutation.mutate(record.id)}
                                >
                                  <Unlink size={14} />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="py-0">
                              <p className="text-sm text-muted-foreground mb-2">
                                <span className="font-medium">Thoughts:</span>
                              </p>
                              <p className="text-sm mb-3 line-clamp-2">
                                {record.automaticThoughts}
                              </p>
                              
                              {record.cognitiveDistortions && record.cognitiveDistortions.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground mb-1">Cognitive Distortions:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {record.cognitiveDistortions.slice(0, 2).map((distortion, i) => (
                                      <Badge key={i} variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                        {distortion}
                                      </Badge>
                                    ))}
                                    {record.cognitiveDistortions.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{record.cognitiveDistortions.length - 2} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="pt-0">
                              <Button variant="link" className="p-0 h-auto" size="sm">
                                <Link className="flex items-center text-xs">
                                  View Complete Record
                                  <ExternalLink size={12} className="ml-1" />
                                </Link>
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
                        <Button 
                          variant="link" 
                          onClick={() => setShowThoughtRecordDialog(true)}
                          className="mt-2"
                        >
                          Link a thought record
                        </Button>
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
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="text-xs bg-primary/10">
                          {user?.username?.substring(0, 2) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Add a comment..."
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          className="resize-none"
                          rows={2}
                        />
                        <div className="flex justify-end mt-2">
                          <Button 
                            type="submit"
                            size="sm"
                            disabled={!commentContent.trim() || addCommentMutation.isPending}
                          >
                            {addCommentMutation.isPending ? (
                              <div className="flex items-center gap-1">
                                <div className="h-3 w-3 border-2 border-t-transparent rounded-full animate-spin"></div>
                                <span>Posting...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Send size={14} /> Post
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Stats & Insights Tab */}
          <TabsContent value="stats">
            {!stats.totalEntries ? (
              <div className="text-center py-10 px-6 border rounded-lg">
                <p className="text-muted-foreground mb-4">
                  You need to add a few journal entries before we can generate statistics and insights.
                </p>
                <Button onClick={() => {
                  setCurrentEntry(null);
                  setTitle("");
                  setContent("");
                  setShowEntryDialog(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Create Journal Entry
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emotions & Tags Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Emotional Patterns</CardTitle>
                    <CardDescription>
                      Most common emotions in your journal entries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(stats.emotions).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(stats.emotions)
                          .sort(([, countA], [, countB]) => countB - countA)
                          .slice(0, 5)
                          .map(([emotion, count]) => (
                            <div key={emotion} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Heart className="h-4 w-4 text-red-500" />
                                <span className="text-sm">{emotion}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-36 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="bg-primary h-full"
                                    style={{ 
                                      width: `${Math.min(100, (count / stats.totalEntries) * 100)}%` 
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm text-muted-foreground">{count}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No emotions have been detected yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Tag Cloud */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tag Cloud</CardTitle>
                    <CardDescription>
                      Selected tags from your journal entries
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[200px]">
                    {Object.keys(stats.tagsFrequency).length > 0 ? (
                      <JournalWordCloud tags={stats.tagsFrequency} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-center text-muted-foreground">
                          Start adding tags to your entries to see them here.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Sentiment Analysis */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Sentiment Over Time</CardTitle>
                    <CardDescription>
                      Tracking positive, negative, and neutral tones in your writing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.sentimentOverTime.length > 0 ? (
                      <div className="h-[300px]">
                        {/* Component for sentiment chart would go here */}
                        <div className="flex h-full items-center justify-center">
                          <p className="text-center text-muted-foreground">
                            Sentiment visualization will appear here
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-[200px] items-center justify-center">
                        <p className="text-center text-muted-foreground">
                          Add more journal entries to see sentiment patterns over time.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Topic Trends */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Common Topics</CardTitle>
                    <CardDescription>
                      Frequently discussed subjects in your journal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(stats.topics).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(stats.topics)
                          .sort(([, countA], [, countB]) => countB - countA)
                          .slice(0, 6)
                          .map(([topic, count]) => (
                            <div key={topic} className="border rounded-md p-3">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">{topic}</h4>
                                <Badge variant="secondary">{count}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Appears in {Math.round((count / stats.totalEntries) * 100)}% of entries
                              </p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          No common topics have been identified yet.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
              />
            </div>
            <div>
              <Textarea
                placeholder="Write your thoughts here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntryDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createEntryMutation.isPending || updateEntryMutation.isPending}
            >
              {createEntryMutation.isPending || updateEntryMutation.isPending 
                ? "Saving..." 
                : currentEntry ? "Update Entry" : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
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
              onClick={() => currentEntry && deleteEntryMutation.mutate(currentEntry.id)}
              disabled={deleteEntryMutation.isPending}
            >
              {deleteEntryMutation.isPending ? "Deleting..." : "Delete Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Link Thought Record Dialog */}
      <Dialog open={showThoughtRecordDialog} onOpenChange={setShowThoughtRecordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link Thought Record</DialogTitle>
            <DialogDescription>
              Select a thought record to link with this journal entry.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-80">
            <div className="space-y-3 pr-4">
              {availableThoughtRecords.length === 0 ? (
                <div className="text-center p-4 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    No available thought records to link.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create new thought records in the Thought Records section.
                  </p>
                </div>
              ) : (
                availableThoughtRecords.map((record: ThoughtRecord) => (
                  <Card key={record.id} className="overflow-hidden">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        {format(new Date(record.createdAt), "MMM d, yyyy")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-0">
                      <p className="text-sm line-clamp-2">
                        {record.automaticThoughts}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="ml-auto"
                        onClick={() => linkThoughtRecordMutation.mutate(record.id)}
                      >
                        Link
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