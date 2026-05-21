import { format } from "date-fns";
import { Send, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { JournalComment } from "../types";

interface JournalCommentsProps {
  comments: JournalComment[] | undefined;
  user: { username?: string } | null | undefined;
  commentContent: string;
  onCommentChange: (v: string) => void;
  onAddComment: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function JournalComments({
  comments,
  user,
  commentContent,
  onCommentChange,
  onAddComment,
  isPending,
}: JournalCommentsProps) {
  return (
    <div className="p-4 border rounded-md">
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <MessageCircle size={16} />
        Comments
      </h4>

      {comments && comments.length > 0 ? (
        <div className="space-y-4 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10">
                  {comment.user?.name?.substring(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium">
                    {comment.user?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
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

      <form onSubmit={onAddComment} className="flex gap-2 items-start">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-primary/10">
            {user?.username?.substring(0, 2) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={commentContent}
            onChange={(e) => onCommentChange(e.target.value)}
            className="min-h-0 h-10 resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!commentContent.trim() || isPending}
          >
            {isPending ? (
              <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
