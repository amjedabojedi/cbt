import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Send } from 'lucide-react';

interface Comment {
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

interface TherapistCommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
  isLoading?: boolean;
}

/**
 * Component for displaying and adding therapist comments on journal entries
 */
const TherapistCommentSection: React.FC<TherapistCommentSectionProps> = ({
  comments,
  onAddComment,
  isLoading = false
}) => {
  const [commentInput, setCommentInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentInput.trim()) {
      onAddComment(commentInput);
      setCommentInput('');
    }
  };

  return (
    <div className="space-y-4">
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {comment.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <h5 className="font-medium text-sm">
                    {comment.user?.name || 'User'}
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
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <Input
          placeholder="Add a comment..."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="sm"
          disabled={isLoading || !commentInput.trim()}
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </form>
    </div>
  );
};

export default TherapistCommentSection;