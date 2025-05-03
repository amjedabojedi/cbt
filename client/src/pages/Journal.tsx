import { useState } from "react";
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
  Tag, 
  ChevronDown, 
  Edit, 
  User, 
  HelpCircle,
  Sparkles,
  Info as InfoIcon
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

interface JournalEntry {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  mood?: number | null;
  aiSuggestedTags?: string[];
  // Store the initial AI-suggested tags from when the entry was first created
  // This will help us track which tags were added from comments later
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
}

interface JournalComment {
  id: number;
  journalEntryId: number;
  userId: number;
  comment: string; // Changed from content to match backend
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
}

export default function Journal() {
  const { user } = useAuth();
  const apiPath = `/api/users/${user?.id}`;
  const [openNewEntry, setOpenNewEntry] = useState(false);
  const [journalTitle, setJournalTitle] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [activeSection, setActiveSection] = useState<string>("recent");
  const [activeTab, setActiveTab] = useState<string>("entries");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch journal entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: [`${apiPath}/journal`],
    queryFn: async () => {
      const response = await fetch(`${apiPath}/journal`);
      if (!response.ok) {
        throw new Error("Failed to fetch journal entries");
      }
      return response.json();
    },
  });

  // Fetch journal stats
  const { data: stats = { 
    totalEntries: 0, 
    emotions: {}, 
    topics: {}, 
    sentimentOverTime: [],
    tagsFrequency: {}
  } } = useQuery<JournalStats>({
    queryKey: [`${apiPath}/journal/stats`],
    queryFn: async () => {
      const response = await fetch(`${apiPath}/journal/stats`);
      if (!response.ok) {
        throw new Error("Failed to fetch journal stats");
      }
      return response.json();
    },
  });

  // Create journal entry
  const createJournalMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await apiRequest("POST", "/api/journal", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create journal entry");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/journal`] });
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/journal/stats`] });
      setOpenNewEntry(false);
      setJournalTitle("");
      setJournalContent("");
      
      // Load the entry with AI analysis and suggested tags
      if (data && data.id) {
        // Wait a moment to ensure AI processing completes
        setTimeout(async () => {
          await loadEntryWithComments(data);
          
          // Auto-select all suggested tags and save them
          if (currentEntry && currentEntry.aiSuggestedTags && currentEntry.aiSuggestedTags.length > 0) {
            setSelectedTags(currentEntry.aiSuggestedTags);
            
            // Auto-save all suggested tags
            await updateTagsMutation.mutateAsync({
              entryId: currentEntry.id,
              tags: currentEntry.aiSuggestedTags
            });
          }
          
          toast({
            title: "Journal Entry Created",
            description: "Your entry was analyzed and tags were automatically applied",
          });
        }, 1000); // Extended timeout to ensure AI processing completes
      } else {
        toast({
          title: "Success",
          description: "Journal entry created successfully",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update tags
  const updateTagsMutation = useMutation({
    mutationFn: async ({
      entryId,
      tags,
    }: {
      entryId: number;
      tags: string[];
    }) => {
      const response = await apiRequest("POST", `/api/journal/${entryId}/tags`, {
        selectedTags: tags,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update tags");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/journal`] });
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/journal/stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/journal/${data.id}`] });
      toast({
        title: "Tags Updated",
        description: "Your selected tags have been saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add comment
  const addCommentMutation = useMutation({
    mutationFn: async ({
      entryId,
      content,
    }: {
      entryId: number;
      content: string;
    }) => {
      const response = await apiRequest("POST", `/api/journal/${entryId}/comments`, {
        content,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add comment");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Clear the comment input
      setCommentContent("");
      
      // Notify user that comment has been added and AI analysis is running
      toast({
        title: "Comment Added",
        description: "Your comment has been added and AI is analyzing the content",
      });
      
      // Give the server a moment to process the AI analysis for the new comment
      // This is important because the server combines entry content + all comments
      // to generate new tags and analysis
      setTimeout(async () => {
        // Reload the entire entry with updated comments and new AI tags
        if (currentEntry) {
          await loadEntryWithComments(currentEntry);
          
          // If the entry now has new AI suggested tags that aren't in the user's selected tags,
          // show a notification about the new suggestions
          if (currentEntry.aiSuggestedTags) {
            const newTags = currentEntry.aiSuggestedTags.filter(
              tag => !selectedTags.includes(tag)
            );
            
            if (newTags.length > 0) {
              toast({
                title: "New Tags Suggested",
                description: `AI analysis found ${newTags.length} new tags based on your comment.`,
              });
            }
          }
        }
      }, 1500); // Wait for the AI processing to complete
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete journal entry
  const deleteJournalMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const response = await apiRequest("DELETE", `/api/journal/${entryId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete journal entry");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/journal`] });
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/journal/stats`] });
      setCurrentEntry(null);
      toast({
        title: "Entry Deleted",
        description: "Journal entry has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Load full entry with comments
  const loadEntryWithComments = async (entry: JournalEntry) => {
    try {
      const response = await fetch(`/api/journal/${entry.id}`);
      if (!response.ok) {
        throw new Error("Failed to load journal entry");
      }
      const data = await response.json();
      
      // Track if there are new AI-suggested tags that haven't been selected yet
      const oldAiTags = currentEntry?.aiSuggestedTags || [];
      const newAiTags = data.aiSuggestedTags || [];
      
      // If this is the first time loading this entry, store the initial tags
      // This helps us track which tags were added from the original AI analysis
      // versus those added later from comments
      if (!data.initialAiTags && newAiTags.length > 0) {
        data.initialAiTags = [...newAiTags];
      }
      
      // Check if we have new tags that weren't in the previous entry
      const hasNewAiTags = newAiTags.some((tag: string) => !oldAiTags.includes(tag));
      
      // Update current entry data
      setCurrentEntry(data);
      
      // Update selected tags (preserving user's selections)
      if (data.userSelectedTags) {
        setSelectedTags(data.userSelectedTags);
      }
      
      // Notify about new AI-suggested tags if this is an update (not first load)
      if (currentEntry && hasNewAiTags && newAiTags.length > oldAiTags.length) {
        const newTagCount = newAiTags.length - oldAiTags.length;
        toast({
          title: "AI Analysis Updated",
          description: `${newTagCount} new tag suggestion${newTagCount > 1 ? 's' : ''} available based on recent comments.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load journal entry details",
        variant: "destructive",
      });
    }
  };

  const handleCreateJournal = () => {
    if (!journalTitle.trim() || !journalContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and content for your journal entry",
        variant: "destructive",
      });
      return;
    }

    createJournalMutation.mutate({
      title: journalTitle,
      content: journalContent,
    });
  };

  const handleAddComment = () => {
    if (!currentEntry || !commentContent.trim()) return;

    addCommentMutation.mutate({
      entryId: currentEntry.id,
      content: commentContent,
    });
  };

  const handleUpdateTags = () => {
    if (!currentEntry) return;

    updateTagsMutation.mutate({
      entryId: currentEntry.id,
      tags: selectedTags,
    });
  };

  const handleDeleteEntry = () => {
    if (!currentEntry) return;
    
    if (confirm("Are you sure you want to delete this journal entry? This action cannot be undone.")) {
      deleteJournalMutation.mutate(currentEntry.id);
    }
  };

  const toggleTagSelection = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <AppLayout title="Journal">
      <div className="container mx-auto px-4 py-6">
        {/* Journal page controls */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Journal</h1>
            <p className="text-muted-foreground">Track your thoughts and feelings</p>
          </div>
          <Button 
            onClick={() => setOpenNewEntry(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> New Entry
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Journal sidebar navigation - now as a card in the grid */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-1">
                  <li>
                    <Button 
                      variant={activeSection === "recent" ? "secondary" : "ghost"} 
                      className="w-full justify-start text-left"
                      onClick={() => setActiveSection("recent")}
                    >
                      Recent Entries
                    </Button>
                  </li>
                  <li>
                    <Button 
                      variant={activeSection === "favorites" ? "secondary" : "ghost"} 
                      className="w-full justify-start text-left"
                      onClick={() => setActiveSection("favorites")}
                    >
                      Favorites
                    </Button>
                  </li>
                  <li>
                    <Button 
                      variant={activeSection === "insights" ? "secondary" : "ghost"} 
                      className="w-full justify-start text-left"
                      onClick={() => {
                        setActiveSection("insights");
                        setActiveTab("insights");
                      }}
                    >
                      Insights & Analysis
                    </Button>
                  </li>
                </ul>
              
                {entries.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Common Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(stats.tagsFrequency || {})
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([tag, count]) => (
                          <Badge key={tag} variant="outline" className="text-xs cursor-pointer">
                            {tag} ({count})
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-3">
        <div className="container mx-auto py-6 md:py-8">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h1 className="text-3xl font-bold hidden md:block">
              {activeSection === "insights" ? "Journal Insights" : "Journal Entries"}
            </h1>
            <div className="md:hidden h-8">
              {/* Spacer for mobile */}
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="entries">Journal Entries</TabsTrigger>
              <TabsTrigger value="insights">Insights & Stats</TabsTrigger>
            </TabsList>
        
            <TabsContent value="entries" className="space-y-4 mt-4">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No journal entries yet. Create your first entry to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entries.map((entry: JournalEntry) => (
                    <Card key={entry.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl line-clamp-1">{entry.title}</CardTitle>
                        </div>
                        <CardDescription className="flex items-center gap-1 text-xs">
                          <CalendarIcon size={12} />
                          {format(new Date(entry.createdAt), "PPP")}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <p className="line-clamp-3 text-sm text-muted-foreground">{entry.content}</p>
                        
                        {entry.aiAnalysis && (
                          <div className="mt-2 text-xs italic text-muted-foreground">
                            {entry.aiAnalysis}
                          </div>
                        )}
                        
                        {entry.userSelectedTags && entry.userSelectedTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.userSelectedTags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {entry.userSelectedTags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{entry.userSelectedTags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="pt-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => loadEntryWithComments(entry)}
                        >
                          View Full Entry
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="insights" className="mt-4">
              {!stats ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Journal Summary</CardTitle>
                      <CardDescription>Overview of your journaling activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium">{stats.totalEntries} Total Entries</p>
                      
                      {stats.totalEntries > 0 && (
                        <div className="mt-4 space-y-4">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="emotions">
                              <AccordionTrigger>Common Emotions</AccordionTrigger>
                              <AccordionContent>
                                {Object.keys(stats.emotions).length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(stats.emotions)
                                      .sort((a, b) => b[1] - a[1])
                                      .slice(0, 10)
                                      .map(([emotion, count]) => (
                                        <Badge key={emotion} className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                          {emotion} ({count})
                                        </Badge>
                                      ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">No emotion data available</p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="topics">
                              <AccordionTrigger>Common Topics</AccordionTrigger>
                              <AccordionContent>
                                {Object.keys(stats.topics).length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(stats.topics)
                                      .sort((a, b) => b[1] - a[1])
                                      .slice(0, 10)
                                      .map(([topic, count]) => (
                                        <Badge key={topic} className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                                          {topic} ({count})
                                        </Badge>
                                      ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">No topic data available</p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="tags">
                              <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                  Tags Word Cloud
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle size={14} className="text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-[250px] p-4">
                                        <p className="text-xs">
                                          <span className="font-bold">Larger tags</span> appear more frequently in your journal entries.
                                          <br /><br />
                                          <span className="font-bold">Tags with ✨ sparkles</span> appear less often and may have been suggested from recent comments.
                                          <br /><br />
                                          Colors indicate frequency from blue (less common) to red (most common).
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                {Object.keys(stats.tagsFrequency).length > 0 ? (
                                  <div className="flex flex-wrap gap-2 justify-center py-4">
                                    {Object.entries(stats.tagsFrequency)
                                      .sort((a, b) => b[1] - a[1])
                                      .map(([tag, count]) => {
                                        // Calculate font size based on frequency (min 12px, max 32px)
                                        const maxCount = Math.max(...Object.values(stats.tagsFrequency));
                                        const minSize = 12;
                                        const maxSize = 32;
                                        const size = minSize + ((count / maxCount) * (maxSize - minSize));
                                        
                                        // Assign color based on frequency
                                        const colorIndex = Math.floor((count / maxCount) * 5);
                                        const colors = [
                                          "bg-blue-50 text-blue-800", 
                                          "bg-green-50 text-green-800",
                                          "bg-purple-50 text-purple-800",
                                          "bg-amber-50 text-amber-800",
                                          "bg-red-50 text-red-800"
                                        ];
                                        const colorClass = colors[Math.min(colorIndex, colors.length - 1)];
                                        
                                        // Check if this tag is likely a new suggestion from comments
                                        // We can't know for sure in the stats view, but we can make an educated guess
                                        // based on frequency - less frequent tags are more likely to be newer suggestions
                                        const isLikelyNewSuggestion = count === 1 || count < maxCount * 0.3;
                                        
                                        return (
                                          <div
                                            key={tag}
                                            className={`inline-block m-1 px-3 py-1 rounded-full ${colorClass} transition-all relative
                                              ${isLikelyNewSuggestion ? 'pl-6' : ''}
                                            `}
                                            style={{ 
                                              fontSize: `${size}px`,
                                              fontWeight: count > maxCount / 2 ? "bold" : "normal",
                                            }}
                                          >
                                            {isLikelyNewSuggestion && (
                                              <Sparkles 
                                                size={Math.max(10, size * 0.6)} 
                                                className="absolute left-1 text-amber-500" 
                                              />
                                            )}
                                            {tag}
                                          </div>
                                        );
                                      })}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">No tags data available</p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* New Entry Dialog */}
          <Dialog open={openNewEntry} onOpenChange={setOpenNewEntry}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Journal Entry</DialogTitle>
                <DialogDescription>
                  Write down your thoughts, feelings, and experiences. Your entry will be analyzed to identify emotions and themes.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Entry Title"
                    value={journalTitle}
                    onChange={(e) => setJournalTitle(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Textarea
                    placeholder="Write your journal entry here..."
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    className="min-h-[200px] w-full"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenNewEntry(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJournal}>
                  Save & Analyze
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Entry Detail Dialog */}
          <Dialog open={!!currentEntry} onOpenChange={(open) => !open && setCurrentEntry(null)}>
            {currentEntry && (
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex justify-between items-center">
                    {currentEntry.title}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={handleDeleteEntry}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-1">
                    <CalendarIcon size={12} />
                    {format(new Date(currentEntry.createdAt), "PPP")}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p>{currentEntry.content}</p>
                  </div>
                  
                  {currentEntry.aiAnalysis && (
                    <div className="bg-muted p-4 rounded-md">
                      <h4 className="text-sm font-medium mb-2">AI Analysis</h4>
                      <p className="text-sm text-muted-foreground">{currentEntry.aiAnalysis}</p>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Tag size={16} />
                        <h4 className="text-sm font-medium">Tags</h4>
                      </div>
                      
                      {/* Show tooltip explaining tag sourcing */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle size={14} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[250px] p-4">
                            <p className="text-xs">
                              <span className="font-bold">Dark tags</span> are selected and saved.
                              <br /><br />
                              <span className="font-bold">Tags with ✨ sparkles</span> were suggested from recent comments and conversations.
                              <br /><br />
                              All tags are AI-generated based on the content in your journal and comments.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentEntry.aiSuggestedTags && currentEntry.aiSuggestedTags.map((tag) => {
                        // Determine if this is a new tag added from comments
                        // Compare with initial tags (if they exist)
                        const isNewSuggestion = currentEntry.initialAiTags && 
                          !currentEntry.initialAiTags.includes(tag);
                        
                        return (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            className={`cursor-pointer transition-all duration-200 ${
                              selectedTags.includes(tag) 
                                ? 'font-medium' 
                                : 'opacity-80'
                            } ${
                              isNewSuggestion 
                                ? "border-amber-500 pl-6 relative" 
                                : ""
                            }`}
                            onClick={() => toggleTagSelection(tag)}
                          >
                            {isNewSuggestion && (
                              <Sparkles 
                                size={14} 
                                className="absolute left-1.5 text-amber-500 animate-pulse" 
                              />
                            )}
                            {tag}
                          </Badge>
                        );
                      })}
                    </div>
                    
                    <Button size="sm" onClick={handleUpdateTags}>
                      Save Selected Tags
                    </Button>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <MessageCircle size={16} />
                      <h4 className="text-sm font-medium">Comments & Feedback</h4>
                    </div>
                    
                    <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                      {currentEntry.comments && currentEntry.comments.length > 0 ? (
                        currentEntry.comments.map((comment) => (
                          <div key={comment.id} className="bg-muted p-3 rounded-md">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                {comment.user?.name ? comment.user.name.substring(0, 1).toUpperCase() : <User size={12} />}
                              </div>
                              <div className="text-sm font-medium">{comment.user?.name || "User"}</div>
                              <div className="text-xs text-muted-foreground ml-auto">
                                {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                              </div>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 items-start">
                      <Textarea
                        placeholder="Add a comment..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <Button onClick={handleAddComment} className="flex-shrink-0">
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}