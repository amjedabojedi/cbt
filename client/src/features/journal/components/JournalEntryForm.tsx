import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { JournalEntry } from "../types";

interface JournalEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEntry: JournalEntry | null;
  title: string;
  content: string;
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onSubmit: () => void;
  isCreating: boolean;
  isUpdating: boolean;
}

export function JournalEntryForm({
  open,
  onOpenChange,
  currentEntry,
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit,
  isCreating,
  isUpdating,
}: JournalEntryFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {currentEntry ? "Edit Journal Entry" : "Create Journal Entry"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
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
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Write about your thoughts, feelings, or experiences..."
              className="min-h-[200px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!title.trim() || !content.trim() || isCreating || isUpdating}
          >
            {isCreating || isUpdating ? (
              <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
            ) : currentEntry ? (
              "Save Changes"
            ) : (
              "Create Entry"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
