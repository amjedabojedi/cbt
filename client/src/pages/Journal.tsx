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
  Edit,
  Info,
  Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JournalEntry {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userSelectedTags?: string[];
  aiSuggestedTags?: string[];
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

export default function Journal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
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
  
  const createEntryMutation = useMutation({
    mutationFn: async (newEntry: { title: string; content: string }) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest('POST', `/api/journal`, newEntry);
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
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
        <Button onClick={() => {
          setCurrentEntry(null);
          setTitle("");
          setContent("");
          setShowEntryDialog(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry: JournalEntry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{entry.title}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(entry)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="flex items-center text-xs">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {format(new Date(entry.createdAt), "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">{entry.content}</p>
                
                {entry.userSelectedTags && entry.userSelectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.userSelectedTags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex items-center text-xs text-muted-foreground">
                  <MessageCircle className="mr-1 h-3 w-3" />
                  {entry.comments?.length || 0} comments
                </div>
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
    </div>
  );
}