import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Send, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { JournalComment } from "../types";
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";

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
  const { t, isRTL } = useLocalization();
  const dateLocale = isRTL ? ar : undefined;

  return (
    <div className="p-4 border rounded-md" dir={isRTL ? "rtl" : "ltr"}>
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <MessageCircle size={16} />
        {t("Comments")}
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
                    {comment.user?.name || t("User")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a", {
                      locale: dateLocale,
                    })}
                  </p>
                </div>
                <p className="text-sm mt-1">
                  <DynamicTranslator text={comment.comment} />
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 mb-4">
          <p className="text-sm text-muted-foreground">
            {t("No comments yet. Be the first to comment.")}
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
            placeholder={t("Add a comment...")}
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
