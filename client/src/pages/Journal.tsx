import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart,
  CalendarIcon,
  CheckCircle,
  Edit,
  Heart,
  Info,
  Link as LinkIcon,
  MessageCircle,
  Plus,
  Tag,
  TagIcon,
  Trash2,
  X,
} from "lucide-react";

// Import word cloud library
import { TagCloud } from 'react-tagcloud';

// Add type declaration for react-tagcloud
declare module 'react-tagcloud' {
  export interface Tag {
    value: string;
    count: number;
  }
  
  export interface TagCloudProps {
    minSize?: number;
    maxSize?: number;
    tags: Tag[];
    renderer?: (tag: Tag, size: number, color: string) => JSX.Element;
  }
  
  export const TagCloud: React.FC<TagCloudProps>;
}
import useActiveUser from "@/hooks/use-active-user";

function getDistortionDescription(distortion: string): string {
  // Object mapping distortions to their descriptions
  const distortions: Record<string, string> = {
    "all-or-nothing thinking": "Seeing things in black and white categories without middle ground.",
    "overgeneralization": "Viewing a single negative event as a never-ending pattern of defeat.",
    "mental filtering": "Focusing exclusively on negatives while filtering out positives.",
    "catastrophizing": "Exaggerating potential problems or consequences.",
    "magnification": "Magnifying negative aspects of a situation while minimizing positive ones.",
    "personalization": "Attributing external events as being due to yourself without evidence.",
    "emotional reasoning": "Assuming that negative emotions reflect reality ('I feel it, so it must be true').",
    "fortune telling": "Predicting negative outcomes without adequate evidence.",
    "mind reading": "Assuming others are reacting negatively without verification.",
    "labeling": "Attaching global negative labels to yourself or others.",
    "shoulding": "Having rigid rules about how you or others 'should' be.",
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
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showThoughtRecordDialog, setShowThoughtRecordDialog] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDistortions, setSelectedDistortions] = useState<string[]>([]);
  
  const { isViewingClientData, activeUserId } = useActiveUser();
  
  // Get journal entries
  const { data: entries = [], isLoading } = useQuery({ 
    queryKey: ['/api/users/:userId/journal', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await apiRequest('GET', `/api/users/${userId}/journal`);
      return await response.json();
    },
    enabled: !!userId
  });

  // Get journal stats
  const { data: stats = { 
    totalEntries: 0, 
    emotions: {}, 
    topics: {}, 
    sentimentOverTime: [],
    tagsFrequency: {},
    sentimentPatterns: null
  }, isLoading: statsLoading } = useQuery({
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
      return await response.json();
    },
    enabled: !!userId && activeTab === 'stats'
  });

  // Get thought records data for linking
  const { data: userThoughtRecords = [] } = useQuery({
    queryKey: ['/api/users/:userId/thought-records', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await apiRequest('GET', `/api/users/${userId}/thought-records`);
      return await response.json();
    },
    enabled: !!userId
  });
  
  // Create journal entry
  const createEntryMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      if (!userId) throw new Error('User not authenticated');
      const response = await apiRequest('POST', `/api/users/${userId}/journal`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      setShowEntryDialog(false);
      toast({
        title: "Journal Entry Created",
        description: "Your journal entry has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setCurrentEntry(data);
      setTitle("");
      setContent("");
      setActiveTab("view");
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Entry",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update journal entry
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<JournalEntry> }) => {
      if (!userId) throw new Error('User not authenticated');
      const response = await apiRequest('PATCH', `/api/users/${userId}/journal/${id}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      setShowEntryDialog(false);
      toast({
        title: "Journal Entry Updated",
        description: "Your changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setCurrentEntry(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Entry",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete journal entry
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!userId) throw new Error('User not authenticated');
      await apiRequest('DELETE', `/api/users/${userId}/journal/${id}`);
      return id;
    },
    onSuccess: () => {
      setShowConfirmDelete(false);
      toast({
        title: "Journal Entry Deleted",
        description: "Your journal entry has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setCurrentEntry(null);
      setActiveTab("list");
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Entry",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update tags on journal entry
  const updateTagsMutation = useMutation({
    mutationFn: async ({ id, tags }: { id: number; tags: string[] }) => {
      if (!userId) throw new Error('User not authenticated');
      if (!id) throw new Error('Journal entry ID is required');
      const response = await apiRequest('PATCH', `/api/users/${userId}/journal/${id}/tags`, { tags });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tags Updated",
        description: "Your selected tags have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setCurrentEntry(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Tags",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update distortions on journal entry
  const updateDistortionsMutation = useMutation({
    mutationFn: async ({ id, distortions }: { id: number; distortions: string[] }) => {
      if (!userId) throw new Error('User not authenticated');
      if (!id) throw new Error('Journal entry ID is required');
      const response = await apiRequest('PATCH', `/api/users/${userId}/journal/${id}/distortions`, { distortions });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cognitive Distortions Updated",
        description: "Your selections have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setCurrentEntry(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Distortions",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Link a thought record to journal entry
  const linkThoughtRecordMutation = useMutation({
    mutationFn: async (thoughtRecordId: number) => {
      if (!userId || !currentEntry) throw new Error('Missing required information');
      
      const response = await apiRequest('POST', `/api/users/${userId}/journal/${currentEntry.id}/link-thought-record`, { 
        thoughtRecordId 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setShowThoughtRecordDialog(false);
      toast({
        title: "Thought Record Linked",
        description: "The thought record has been linked to this journal entry.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setCurrentEntry(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Linking Record",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Unlink a thought record from journal entry
  const unlinkThoughtRecordMutation = useMutation({
    mutationFn: async (thoughtRecordId: number) => {
      if (!userId || !currentEntry) throw new Error('Missing required information');
      
      const response = await apiRequest('DELETE', `/api/users/${userId}/journal/${currentEntry.id}/link-thought-record/${thoughtRecordId}`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Thought Record Unlinked",
        description: "The thought record has been removed from this journal entry.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/:userId/journal', userId] });
      setCurrentEntry(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Unlinking Record",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Empty Content",
        description: "Please write some content for your journal entry.",
        variant: "destructive",
      });
      return;
    }

    if (currentEntry) {
      updateEntryMutation.mutate({
        id: currentEntry.id,
        data: { title, content }
      });
    } else {
      createEntryMutation.mutate({ title, content });
    }
  };

  // Toggle tag selection
  const toggleTagSelection = (tag: string) => {
    if (!currentEntry) return;
    
    let newTags: string[];
    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter(t => t !== tag);
    } else {
      newTags = [...selectedTags, tag];
    }
    
    setSelectedTags(newTags);
    updateTagsMutation.mutate({ id: currentEntry.id, tags: newTags });
  };

  // Toggle distortion selection
  const toggleDistortionSelection = (distortion: string) => {
    if (!currentEntry) return;
    
    let newDistortions: string[];
    if (selectedDistortions.includes(distortion)) {
      newDistortions = selectedDistortions.filter(d => d !== distortion);
    } else {
      newDistortions = [...selectedDistortions, distortion];
    }
    
    setSelectedDistortions(newDistortions);
    updateDistortionsMutation.mutate({ id: currentEntry.id, distortions: newDistortions });
  };

  // When viewing a specific entry, load its tags and related thought records
  useEffect(() => {
    if (currentEntry) {
      setTitle(currentEntry.title);
      setContent(currentEntry.content);
      setSelectedTags(currentEntry.userSelectedTags || []);
      setSelectedDistortions(currentEntry.userSelectedDistortions || []);
    } else {
      setTitle("");
      setContent("");
      setSelectedTags([]);
      setSelectedDistortions([]);
    }
  }, [currentEntry]);

  const loadEntryWithRelatedRecords = async (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setActiveTab("view");
    
    // Load related thought records if entry has them
    if (entry.relatedThoughtRecordIds && entry.relatedThoughtRecordIds.length > 0) {
      // Find the related records in the cached data
      const recordIds = entry.relatedThoughtRecordIds;
      const relatedRecords = userThoughtRecords.filter(
        (record: ThoughtRecord) => recordIds.includes(record.id)
      );
      
      if (relatedRecords.length > 0) {
        // Additional handling for related records could go here
        console.log("Related thought records:", relatedRecords);
      }
    }
  };

  // Filter thought records that aren't already linked
  const availableThoughtRecords = userThoughtRecords.filter((record: ThoughtRecord) => 
    !(currentEntry?.relatedThoughtRecordIds || []).includes(record.id)
  );
  
  return (
    <div className="container py-6 px-8 max-w-6xl ml-4">
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

                  {/* Cognitive Distortions Section */}
                  {currentEntry.detectedDistortions && currentEntry.detectedDistortions.length > 0 && (
                    <div className="mt-6">
                      <h5 className="text-xs font-semibold mb-2">
                        Potential Cognitive Distortions
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Array.from(new Set(currentEntry.detectedDistortions.map(d => d.toLowerCase())))
                          .map((distortion, index) => {
                            const isSelected = selectedDistortions.includes(distortion);
                            return (
                              <div 
                                key={`${distortion}-${index}`}
                                className={`border ${isSelected ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'} 
                                  rounded-md p-2 flex items-start space-x-2 cursor-pointer`}
                                onClick={() => toggleDistortionSelection(distortion)}
                              >
                                <div className={`mt-0.5 ${isSelected ? 'text-orange-500' : 'text-slate-400'}`}>
                                  {isSelected ? (
                                    <CheckCircle size={16} className="fill-orange-400 text-white" />
                                  ) : (
                                    <CheckCircle size={16} />
                                  )}
                                </div>
                                <div>
                                  <p className={`text-sm font-medium ${isSelected ? 'text-orange-800' : 'text-slate-700'}`}>
                                    {distortion.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {getDistortionDescription(distortion)}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  )}
                </div>
                
                {/* AI Analysis section */}
                {currentEntry.aiAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI Analysis</CardTitle>
                      <CardDescription>
                        Automated insights generated from your journal entry
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm">
                        <div className="whitespace-pre-wrap">
                          {currentEntry.aiAnalysis}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Related Thought Records */}
                {currentEntry.relatedThoughtRecordIds && currentEntry.relatedThoughtRecordIds.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Related Thought Records</CardTitle>
                      <CardDescription>
                        Thought records linked to this journal entry
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {userThoughtRecords
                          .filter(record => currentEntry.relatedThoughtRecordIds?.includes(record.id))
                          .map((record: ThoughtRecord) => (
                            <div key={record.id} className="border rounded-md p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium text-sm">
                                    {format(new Date(record.createdAt), "MMM d, yyyy")}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {record.automaticThoughts.substring(0, 60)}
                                    {record.automaticThoughts.length > 60 ? "..." : ""}
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7" 
                                  onClick={() => unlinkThoughtRecordMutation.mutate(record.id)}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setShowThoughtRecordDialog(true)}
                        disabled={!availableThoughtRecords.length}
                      >
                        <LinkIcon size={14} className="mr-1" />
                        Link Another Thought Record
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {/* Show link button even if no records are linked yet */}
                {(!currentEntry.relatedThoughtRecordIds || currentEntry.relatedThoughtRecordIds.length === 0) && (
                  <Button
                    variant="outline"
                    onClick={() => setShowThoughtRecordDialog(true)}
                    disabled={!availableThoughtRecords.length}
                  >
                    <LinkIcon size={16} className="mr-2" />
                    Link to Thought Record
                    {!availableThoughtRecords.length && (
                      <span className="ml-2 text-xs opacity-70">
                        (No available records)
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Stats and Insights Tab */}
        <TabsContent value="stats">
          {statsLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-muted/50"></CardHeader>
                  <CardContent className="h-40 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Top Emotions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Predominant Emotions</CardTitle>
                  <CardDescription>
                    Emotions that appear frequently in your journal entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.emotions).length > 0 ? (
                    <div className="w-full flex justify-center">
                      <div style={{ width: '100%', maxWidth: '400px' }}>
                        <TagCloud
                          minSize={16}
                          maxSize={32}
                          tags={Object.entries(stats.emotions).map(([emotion, count]) => ({
                            value: emotion,
                            count: count as number,
                          }))}
                          renderer={(tag, size, color) => (
                            <span 
                              key={tag.value}
                              style={{ 
                                fontSize: `${size}px`,
                                margin: '3px',
                                padding: '2px 8px',
                                display: 'inline-block',
                                borderRadius: '16px',
                                background: 'rgba(63, 81, 181, 0.1)',
                                color: '#4051b5',
                              }} 
                            >
                              {tag.value}
                            </span>
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">
                        Not enough data to display emotion patterns.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Common Topics */}
              <Card>
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
                        .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
                        .slice(0, 6)
                        .map(([topic, count]) => (
                          <div key={topic} className="border rounded-md p-3">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">{topic}</h4>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Appears in {Math.round((count as number / stats.totalEntries) * 100)}% of entries
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
    </div>
  );
}
