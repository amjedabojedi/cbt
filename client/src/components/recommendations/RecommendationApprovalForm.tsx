import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AiRecommendation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, CheckCircle2 } from "lucide-react";

// Form schema
const formSchema = z.object({
  therapistNotes: z.string().min(5, "Please provide feedback for the client"),
});

type FormValues = z.infer<typeof formSchema>;

interface RecommendationApprovalFormProps {
  recommendation: AiRecommendation;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: number, notes: string) => void;
  onReject: (id: number, notes: string) => void;
}

export function RecommendationApprovalForm({
  recommendation,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: RecommendationApprovalFormProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      therapistNotes: "",
    },
  });
  
  const handleSubmit = (values: FormValues) => {
    if (action === "approve") {
      onApprove(recommendation.id, values.therapistNotes);
    } else if (action === "reject") {
      onReject(recommendation.id, values.therapistNotes);
    }
    form.reset();
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === "approve" ? "Approve Recommendation" : "Do Not Recommend"}
          </DialogTitle>
          <DialogDescription>
            {action === "approve" 
              ? "Add notes to provide context or specific instructions for the client."
              : "Please explain why this recommendation is not appropriate for the client."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="therapistNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        action === "approve"
                          ? "Add specific guidance or context for this recommendation..."
                          : "Explain why this recommendation isn't suitable..."
                      }
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              {action ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setAction(null)}>
                    Back
                  </Button>
                  <Button 
                    type="submit"
                    variant={action === "approve" ? "default" : "destructive"}
                  >
                    {action === "approve" ? "Approve & Send" : "Confirm Rejection"}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setAction("reject")}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Do Not Recommend
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setAction("approve")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}