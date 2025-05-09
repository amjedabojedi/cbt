import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AiRecommendation } from "@shared/schema";
import { ThumbsUp, ThumbsDown, Loader2, Lightbulb } from "lucide-react";

// Define form schema
const approvalSchema = z.object({
  therapistNote: z.string().optional(),
});

const rejectionSchema = z.object({
  feedback: z.string().min(10, "Feedback must be at least 10 characters"),
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;
type RejectionFormValues = z.infer<typeof rejectionSchema>;

interface RecommendationApprovalFormProps {
  recommendation: AiRecommendation;
  onComplete?: () => void;
}

export function RecommendationApprovalForm({ 
  recommendation, 
  onComplete 
}: RecommendationApprovalFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"approve" | "reject">("approve");
  
  // Initialize forms
  const approvalForm = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      therapistNote: "",
    }
  });
  
  const rejectionForm = useForm<RejectionFormValues>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      feedback: "",
    }
  });
  
  // Handle approval submission
  const onApproveSubmit = async (data: ApprovalFormValues) => {
    if (!recommendation.id) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest("PATCH", `/api/recommendations/${recommendation.id}/status`, {
        status: "approved",
        therapistNotes: data.therapistNote
      });
      
      toast({
        title: "Recommendation approved",
        description: "The recommendation has been approved and is now visible to the client.",
      });
      
      // Invalidate recommendations queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      
      if (onComplete) onComplete();
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
  
  // Handle rejection submission
  const onRejectSubmit = async (data: RejectionFormValues) => {
    if (!recommendation.id) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest("PATCH", `/api/recommendations/${recommendation.id}/status`, {
        status: "rejected",
        therapistNotes: data.feedback
      });
      
      toast({
        title: "Recommendation rejected",
        description: "Your feedback has been recorded. This recommendation won't be shown to the client.",
      });
      
      // Invalidate recommendations queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      
      if (onComplete) onComplete();
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
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">{recommendation.title}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Pending Review
          </Badge>
        </div>
        <CardDescription>
          Review and decide whether to approve or reject this AI-generated recommendation
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 p-3 bg-muted rounded-md">
          <p className="text-sm">{recommendation.content}</p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1">Type</h4>
          <p className="text-sm text-muted-foreground">{recommendation.type.replace('_', ' ').charAt(0).toUpperCase() + recommendation.type.replace('_', ' ').slice(1)}</p>
        </div>
        
        {recommendation.aiReasoning && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">AI Reasoning</h4>
            <p className="text-sm text-muted-foreground">{recommendation.aiReasoning}</p>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "approve" | "reject")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="approve">Approve</TabsTrigger>
            <TabsTrigger value="reject">Reject</TabsTrigger>
          </TabsList>
          
          <TabsContent value="approve" className="pt-4">
            <Form {...approvalForm}>
              <form onSubmit={approvalForm.handleSubmit(onApproveSubmit)}>
                <FormField
                  control={approvalForm.control}
                  name="therapistNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add a note for the client (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add personalized context or implementation advice for the client"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end mt-4">
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Approve Recommendation
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="reject" className="pt-4">
            <Form {...rejectionForm}>
              <form onSubmit={rejectionForm.handleSubmit(onRejectSubmit)}>
                <FormField
                  control={rejectionForm.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rejection feedback (required)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Explain why this recommendation is not appropriate for this client"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end mt-4">
                  <Button 
                    type="submit"
                    variant="destructive"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        Reject Recommendation
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}