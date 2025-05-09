import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ThumbsUp, ThumbsDown, AlertCircle, Lightbulb, ChevronRight, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AiRecommendation } from "@shared/schema";

interface RecommendationItemProps {
  recommendation: AiRecommendation;
  isTherapistView?: boolean;
  onStatusChange?: () => void;
}

export function RecommendationItem({ 
  recommendation, 
  isTherapistView = false,
  onStatusChange
}: RecommendationItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [therapistNote, setTherapistNote] = useState(recommendation.therapistNotes || "");
  const [rejectionFeedback, setRejectionFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isTherapist = user?.role === "therapist";
  const isAdmin = user?.role === "admin";
  const canApprove = (isTherapist || isAdmin) && recommendation.status === "pending";
  
  // Format date for display
  const formattedDate = recommendation.createdAt 
    ? format(new Date(recommendation.createdAt), "MMM d, yyyy")
    : "Not available";
  
  // Get status badge color and label
  const getStatusBadge = () => {
    switch(recommendation.status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Review</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case "implemented":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Implemented</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Handle approve action
  const handleApprove = async () => {
    if (!recommendation.id) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/recommendations/${recommendation.id}/approve`, {
        therapistNotes: therapistNote
      });
      
      toast({
        title: "Recommendation approved",
        description: "The recommendation has been approved and is now visible to the client.",
      });
      
      setApprovalDialogOpen(false);
      if (onStatusChange) onStatusChange();
    } catch (error) {
      toast({
        title: "Error approving recommendation",
        description: "Failed to approve recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle reject action
  const handleReject = async () => {
    if (!recommendation.id || !rejectionFeedback.trim()) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/recommendations/${recommendation.id}/reject`, {
        rejectionFeedback: rejectionFeedback
      });
      
      toast({
        title: "Recommendation rejected",
        description: "Your feedback has been recorded. This recommendation won't be shown to the client.",
      });
      
      setFeedbackDialogOpen(false);
      if (onStatusChange) onStatusChange();
    } catch (error) {
      toast({
        title: "Error rejecting recommendation",
        description: "Failed to reject recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle implement action
  const handleImplement = async () => {
    if (!recommendation.id) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/recommendations/${recommendation.id}/implement`);
      
      toast({
        title: "Recommendation implemented",
        description: "Great job! This recommendation has been marked as implemented.",
      });
      
      if (onStatusChange) onStatusChange();
    } catch (error) {
      toast({
        title: "Error updating recommendation",
        description: "Failed to mark recommendation as implemented. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-primary" />
              <CardTitle className="text-lg font-semibold text-primary">
                {recommendation.title}
              </CardTitle>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {getStatusBadge()}
              <Badge variant="outline" className="bg-gray-50 border-gray-200">
                {recommendation.type.replace('_', ' ').charAt(0).toUpperCase() + recommendation.type.replace('_', ' ').slice(1)}
              </Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {formattedDate}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className={`prose prose-sm max-w-none ${!isExpanded ? 'line-clamp-3' : ''}`}>
          <p>{recommendation.content}</p>
        </div>
        
        {recommendation.therapistNotes && recommendation.status !== "rejected" && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Note from your therapist:</h4>
            <p className="text-sm text-blue-700">{recommendation.therapistNotes}</p>
          </div>
        )}
        
        {recommendation.rejectionFeedback && recommendation.status === "rejected" && isTherapistView && (
          <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-100">
            <h4 className="text-sm font-medium text-red-800 mb-1">Rejection feedback:</h4>
            <p className="text-sm text-red-700">{recommendation.rejectionFeedback}</p>
          </div>
        )}
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="text-sm text-muted-foreground flex items-center mt-2 hover:text-primary transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronDown size={16} className="mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronRight size={16} className="mr-1" />
              Show more
            </>
          )}
        </button>
      </CardContent>
      
      <CardFooter className="flex justify-between py-3 border-t bg-muted/10">
        {/* Client view actions */}
        {!isTherapistView && recommendation.status === "approved" && (
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
            onClick={handleImplement}
            disabled={isSubmitting}
          >
            <ThumbsUp size={16} className="mr-1" />
            Mark as Implemented
          </Button>
        )}
        
        {/* Therapist view actions */}
        {isTherapistView && recommendation.status === "pending" && (
          <div className="flex gap-2">
            <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                >
                  <ThumbsUp size={16} className="mr-1" />
                  Approve
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Recommendation</DialogTitle>
                  <DialogDescription>
                    Add an optional note to help the client understand how to implement this recommendation.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="Add a personalized note for the client (optional)"
                    value={therapistNote}
                    onChange={(e) => setTherapistNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    {isSubmitting ? "Approving..." : "Approve Recommendation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <ThumbsDown size={16} className="mr-1" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Recommendation</DialogTitle>
                  <DialogDescription>
                    Please provide feedback on why this recommendation is not appropriate.
                    This will help improve future recommendations.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="Explain why this recommendation is not suitable (required)"
                    value={rejectionFeedback}
                    onChange={(e) => setRejectionFeedback(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleReject}
                    disabled={isSubmitting || !rejectionFeedback.trim()}
                  >
                    {isSubmitting ? "Rejecting..." : "Reject Recommendation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        
        {/* For rejected recommendations in therapist view */}
        {isTherapistView && recommendation.status === "rejected" && (
          <div className="flex items-center text-sm text-muted-foreground">
            <AlertCircle size={16} className="mr-1 text-red-500" />
            Rejected
          </div>
        )}
        
        {/* For approved recommendations in therapist view */}
        {isTherapistView && recommendation.status === "approved" && (
          <div className="flex items-center text-sm text-muted-foreground">
            <CheckCircle2 size={16} className="mr-1 text-green-500" />
            Approved
          </div>
        )}
        
        {/* For implemented recommendations in therapist view */}
        {isTherapistView && recommendation.status === "implemented" && (
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle2 size={16} className="mr-1" />
            Implemented by client
          </div>
        )}
        
        {/* Empty div to maintain layout when no buttons are shown */}
        {(!canApprove && !isTherapistView && recommendation.status !== "approved") && <div></div>}
        
        {/* Category tag on right side */}
        <div className="text-sm text-muted-foreground">
          Source: AI Analysis
        </div>
      </CardFooter>
    </Card>
  );
}