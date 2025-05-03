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
  Heart,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import useActiveUser from "@/hooks/use-active-user";

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
  }} = useQuery<JournalStats>({
    queryKey: [`${apiPath}/journal/stats`],
    queryFn: async () => {
      const response = await fetch(`${apiPath}/journal/stats`);
      if (!response.ok) {
        throw new Error("Failed to fetch journal stats");
      }
      return response.json();
    },
  });

  // Create or update journal entry
  const createJournalMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; id?: number }) => {
      // If id is provided, update existing entry, otherwise create new one
      const endpoint = data.id ? `/api/journal/${data.id}` : "/api/journal";
      const method = data.id ? "PUT" : "POST";
      
      const response = await apiRequest(method, endpoint, {
        title: data.title,
        content: data.content
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${data.id ? 'update' : 'create'} journal entry`);
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
            title: data.updatedAt !== data.createdAt ? "Journal Entry Updated" : "Journal Entry Created",
            description: data.updatedAt !== data.createdAt 
              ? "Your entry was updated successfully" 
              : "Your entry was analyzed and tags were automatically applied",
          });
        }, 1000); // Extended timeout to ensure AI processing completes
      } else {
        toast({
          title: "Success",
          description: "Journal entry saved successfully",
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

  // Store the ID of the entry being edited
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);

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
      id: editingEntryId || undefined,
      title: journalTitle,
      content: journalContent,
    });
    
    // Reset editing state
    setEditingEntryId(null);
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

  // Determine if a tag is likely a new suggestion by checking if it's not in the initial AI tags
  const isNewSuggestion = (tag: string) => {
    if (!currentEntry || !currentEntry.initialAiTags) return false;
    return currentEntry.aiSuggestedTags?.includes(tag) && 
           !currentEntry.initialAiTags.includes(tag);
  };

  // TagCloud component - inline implementation instead of imported component
  const TagCloud = ({ tags }: { tags: Record<string, number> }) => {
    // Find min/max values
    const values = Object.values(tags);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    
    return (
      <div className="flex flex-wrap justify-center gap-2 py-4">
        {Object.entries(tags).map(([tag, count]) => {
          // Calculate size between 12px and 28px
          const size = min === max
            ? 16
            : 12 + Math.floor(((count - min) / (max - min || 1)) * 16);
            
          // Calculate color: blue→purple→red based on frequency
          const normalizedValue = min === max ? 0.5 : (count - min) / (max - min);
          let colorClass = "text-blue-500";
          
          if (normalizedValue > 0.66) {
            colorClass = "text-red-500";
          } else if (normalizedValue > 0.33) {
            colorClass = "text-purple-500";
          }
          
          return (
            <span
              key={tag}
              className={`${colorClass} font-medium px-2 py-1`}
              style={{ fontSize: `${size}px` }}
              title={`${tag}: ${count} mentions`}
            >
              {tag}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <AppLayout title="Journal">
      <div className="container mx-auto px-4 py-6">
        {/* Journal Header */}
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
        
        {/* Journal Content */}
        <div className="container mx-auto">
          {/* Main Content */}
          <div className="w-full">
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
                                    <TagCloud tags={stats.tagsFrequency} />
                                  ) : (
                                    <p className="text-muted-foreground">No tag data available</p>
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
          </div>
        </div>
      </div>
      
      {/* Dialog for creating or updating a journal entry */}
      <Dialog open={openNewEntry} onOpenChange={setOpenNewEntry}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentEntry?.id ? "Edit Journal Entry" : "Create Journal Entry"}</DialogTitle>
            <DialogDescription>
              {currentEntry?.id 
                ? "Edit your journal entry below." 
                : "Write your thoughts and feelings. AI will analyze your entry to suggest tags."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="title"
                placeholder="Entry Title"
                className="col-span-4"
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Textarea
                id="content"
                placeholder="Write your thoughts here..."
                className="col-span-4 min-h-[200px] max-h-[400px] overflow-auto"
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleCreateJournal}
              disabled={createJournalMutation.isPending}
            >
              {createJournalMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                  {editingEntryId ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingEntryId ? "Save Changes" : "Create & Analyze"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for viewing a journal entry */}
      <Dialog
        open={!!currentEntry}
        onOpenChange={(open) => !open && setCurrentEntry(null)}
      >
        {currentEntry && (
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <DialogTitle className="text-2xl">{currentEntry.title}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Set edit state and initialize with current entry values
                      setJournalTitle(currentEntry.title);
                      setJournalContent(currentEntry.content);
                      setEditingEntryId(currentEntry.id);
                      setOpenNewEntry(true);
                      // This will close the current dialog
                      setCurrentEntry(null);
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteEntry}
                    disabled={deleteJournalMutation.isPending}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <DialogDescription className="flex items-center gap-1">
                <CalendarIcon size={14} />
                {format(new Date(currentEntry.createdAt), "PPP 'at' p")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left side: Journal content and comments */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {/* Journal Content */}
                  <div className="whitespace-pre-wrap">{currentEntry.content}</div>
                  
                  {/* AI Analysis */}
                  {currentEntry.aiAnalysis && (
                    <div className="mt-6 p-4 bg-primary/5 rounded-md">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Sparkles size={16} className="text-yellow-500" />
                        AI Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {currentEntry.aiAnalysis}
                      </p>
                    </div>
                  )}
                  
                  {/* Comments section */}
                  {currentEntry.comments && currentEntry.comments.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                        <MessageCircle size={16} />
                        Comments {currentEntry.comments.length > 0 && `(${currentEntry.comments.length})`}
                      </h4>
                      
                      <div className="space-y-4">
                        {currentEntry.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
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
                                  {format(new Date(comment.createdAt), "MMM d, p")}
                                </span>
                              </div>
                              <p className="text-sm mt-1">{comment.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
              
              {/* Right side: Tags and emotions */}
              <div className="space-y-4 p-4 border-l border-border hidden lg:block">
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Tag size={16} />
                      Tags
                    </span>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon size={14} className="text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px] p-4">
                          <p className="text-xs">
                            Tags with <span className="font-bold">✨ sparkles</span> are suggested by AI based on your comments. Click tags to select them.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h4>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentEntry.aiSuggestedTags && currentEntry.aiSuggestedTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      const isLikelyNewSuggestion = isNewSuggestion(tag);
                      
                      // Determine style based on selection and whether it's a new suggestion
                      const colorClass = isSelected 
                        ? "bg-primary/90 text-primary-foreground hover:bg-primary/100" 
                        : "bg-primary/10 text-primary hover:bg-primary/20";
                        
                      return (
                        <div
                          key={tag}
                          className={`inline-block m-1 px-3 py-1 rounded-full ${colorClass} transition-all relative
                            ${isLikelyNewSuggestion ? 'pl-6' : ''}
                          `}
                          onClick={() => toggleTagSelection(tag)}
                        >
                          {/* Show sparkle icon for tags that are likely new suggestions */}
                          {isLikelyNewSuggestion && (
                            <Sparkles 
                              size={14} 
                              className={`absolute left-1.5 top-1/2 transform -translate-y-1/2 text-amber-500 animate-pulse`} 
                            />
                          )}
                          {tag}
                        </div>
                      );
                    })}
                  </div>
                  
                  <Button
                    onClick={handleUpdateTags}
                    disabled={updateTagsMutation.isPending}
                    className="w-full mt-3"
                    size="sm"
                  >
                    {updateTagsMutation.isPending ? "Saving..." : "Save Tags"}
                  </Button>
                </div>
                
                <Separator />
                
                {currentEntry.emotions && currentEntry.emotions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Heart size={16} />
                      Identified Emotions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentEntry.emotions.map((emotion) => (
                        <Badge 
                          key={emotion} 
                          variant="outline"
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {currentEntry.topics && currentEntry.topics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Tag size={16} />
                      Key Topics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentEntry.topics.map((topic) => (
                        <Badge 
                          key={topic} 
                          variant="outline"
                          className="bg-purple-50 text-purple-600 hover:bg-purple-100"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {(currentEntry.sentimentPositive !== undefined || 
                  currentEntry.sentimentNegative !== undefined || 
                  currentEntry.sentimentNeutral !== undefined) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <User size={16} />
                      Sentiment Analysis
                    </h4>
                    <div className="space-y-2">
                      {currentEntry.sentimentPositive !== undefined && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-green-600">Positive</span>
                          <span className="font-medium">{Math.round(currentEntry.sentimentPositive * 100)}%</span>
                        </div>
                      )}
                      {currentEntry.sentimentNegative !== undefined && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-red-600">Negative</span>
                          <span className="font-medium">{Math.round(currentEntry.sentimentNegative * 100)}%</span>
                        </div>
                      )}
                      {currentEntry.sentimentNeutral !== undefined && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">Neutral</span>
                          <span className="font-medium">{Math.round(currentEntry.sentimentNeutral * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </AppLayout>
  );
}