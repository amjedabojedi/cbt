import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Trash2, MessageCircle, Tag, ChevronDown, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

interface JournalEntry {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  mood?: number | null;
  aiSuggestedTags?: string[];
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
  content: string;
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
  const { data: stats } = useQuery<JournalStats>({
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
        setTimeout(() => {
          loadEntryWithComments(data);
          
          toast({
            title: "Journal Entry Created",
            description: "Your entry was analyzed for emotions and suggested tags",
          });
        }, 500);
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
      
      // Reload the entire entry with updated comments
      if (currentEntry) {
        await loadEntryWithComments(currentEntry);
      }
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the journal entry",
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
      setCurrentEntry(data);
      if (data.aiSuggestedTags && data.userSelectedTags) {
        setSelectedTags(data.userSelectedTags);
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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Journal</h1>
        <Button 
          onClick={() => setOpenNewEntry(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> New Entry
        </Button>
      </div>

      <Tabs defaultValue="entries">
        <TabsList>
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
                          <AccordionTrigger>Most Used Tags</AccordionTrigger>
                          <AccordionContent>
                            {Object.keys(stats.tagsFrequency).length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(stats.tagsFrequency)
                                  .sort((a, b) => b[1] - a[1])
                                  .slice(0, 15)
                                  .map(([tag, count]) => (
                                    <Badge key={tag} className="bg-green-100 text-green-800 hover:bg-green-200">
                                      {tag} ({count})
                                    </Badge>
                                  ))}
                              </div>
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

      {/* New Entry Dialog */}
      <Dialog open={openNewEntry} onOpenChange={setOpenNewEntry}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Journal Entry</DialogTitle>
            <DialogDescription>
              Write your thoughts, feelings, and experiences. Our AI will analyze your entry to suggest relevant tags.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
                placeholder="Give your entry a title"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">Content</label>
              <Textarea
                id="content"
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder="Write your journal entry here..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewEntry(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateJournal}
              disabled={createJournalMutation.isPending}
            >
              {createJournalMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      {currentEntry && (
        <Dialog open={!!currentEntry} onOpenChange={(open) => !open && setCurrentEntry(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <DialogTitle>{currentEntry.title}</DialogTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={handleDeleteEntry}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <DialogDescription className="flex items-center gap-1">
                <CalendarIcon size={14} className="mr-1" />
                {format(new Date(currentEntry.createdAt), "PPP 'at' p")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Journal content */}
              <div className="space-y-2">
                <p className="whitespace-pre-wrap">{currentEntry.content}</p>
              </div>
              
              {/* AI analysis */}
              {currentEntry.aiAnalysis && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">AI Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3">
                    <p className="text-sm">{currentEntry.aiAnalysis}</p>
                    
                    {currentEntry.emotions && currentEntry.emotions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Detected Emotions:</p>
                        <div className="flex flex-wrap gap-1">
                          {currentEntry.emotions.map((emotion) => (
                            <Badge key={emotion} variant="secondary" className="text-xs">
                              {emotion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {currentEntry.topics && currentEntry.topics.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Topics:</p>
                        <div className="flex flex-wrap gap-1">
                          {currentEntry.topics.map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Tag selection */}
              {currentEntry.aiSuggestedTags && currentEntry.aiSuggestedTags.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Tag size={16} className="mr-2" />
                      Select Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3">
                    <p className="text-xs mb-2">Select tags that best describe this entry:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentEntry.aiSuggestedTags.map((tag) => (
                        <Badge 
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTagSelection(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <Button 
                        size="sm"
                        onClick={handleUpdateTags}
                        disabled={updateTagsMutation.isPending}
                      >
                        {updateTagsMutation.isPending ? "Saving..." : "Save Tags"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Comments section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <MessageCircle size={18} className="mr-2" />
                  Comments
                </h3>
                
                <div className="space-y-4">
                  {currentEntry.comments && currentEntry.comments.length > 0 ? (
                    currentEntry.comments.map((comment) => (
                      <Card key={comment.id} className="bg-muted/30">
                        <CardHeader className="py-3">
                          <div className="flex justify-between">
                            <CardTitle className="text-sm font-medium">
                              {comment.user?.name || "User"}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {format(new Date(comment.createdAt), "PPP 'at' p")}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="py-0 pb-3">
                          <p className="text-sm">{comment.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  )}
                  
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!commentContent.trim() || addCommentMutation.isPending}
                      >
                        {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}