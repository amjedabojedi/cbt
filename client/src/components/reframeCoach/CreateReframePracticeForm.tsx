import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Schema for the reframe practice form
const reframePracticeSchema = z.object({
  thoughtRecordId: z.number(),
  assignedTo: z.number(),
  isPriority: z.boolean().default(false),
  notes: z.string().optional(),
  customInstructions: z.string().optional()
});

type ReframePracticeFormValues = z.infer<typeof reframePracticeSchema>;

// Props for the component
interface CreateReframePracticeFormProps {
  thoughtRecord: any;
  clientId: number;
  isOpen: boolean;
  onClose: () => void;
}

// The form component
const CreateReframePracticeForm = ({
  thoughtRecord,
  clientId,
  isOpen,
  onClose
}: CreateReframePracticeFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  
  // Form setup with default values
  const form = useForm<ReframePracticeFormValues>({
    resolver: zodResolver(reframePracticeSchema),
    defaultValues: {
      thoughtRecordId: thoughtRecord?.id,
      assignedTo: clientId,
      isPriority: false,
      notes: "",
      customInstructions: ""
    },
  });
  
  // Mutation for creating a reframe practice assignment
  const createPracticeMutation = useMutation({
    mutationFn: async (values: ReframePracticeFormValues) => {
      const res = await apiRequest(
        "POST",
        "/api/reframe-coach/assignments", 
        values
      );
      return await res.json();
    },
    onSuccess: (data) => {
      // Show success message
      toast({
        title: "Practice assignment created",
        description: "The reframe practice has been assigned to the client.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${clientId}/resources/assignments`] 
      });
      
      // Reset form and close dialog
      form.reset();
      onClose();
      
      // If the assignment has an ID, navigate to the practice page
      if (data && data.id) {
        navigate(`/reframe-coach/practice/${data.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating assignment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: ReframePracticeFormValues) => {
    createPracticeMutation.mutate(values);
  };
  
  // Helper function to get distortion names as string
  const getDistortionsString = () => {
    if (!thoughtRecord?.cognitiveDistortions || thoughtRecord.cognitiveDistortions.length === 0) {
      return "None identified";
    }
    return thoughtRecord.cognitiveDistortions.join(", ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Reframe Practice Assignment</DialogTitle>
          <DialogDescription>
            Create a customized cognitive restructuring practice based on this thought record.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
          <div className="rounded-md bg-muted p-3 mb-4 text-sm">
            <h4 className="font-medium">Thought Record Details</h4>
            <p className="mt-1 text-muted-foreground">
              <strong>Thought:</strong> {thoughtRecord?.automaticThoughts}
            </p>
            <p className="mt-1 text-muted-foreground">
              <strong>Cognitive Distortions:</strong> {getDistortionsString()}
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="isPriority"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as priority</FormLabel>
                      <FormDescription>
                        Priority assignments will be highlighted for the client.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes for Client</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes or context for the client about this practice assignment"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These notes will be visible to the client.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any custom instructions for the AI when generating practice scenarios"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These instructions will guide the AI in generating scenarios.
                      For example: "Focus on social anxiety situations" or "Include examples related to work stress."
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={createPracticeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPracticeMutation.isPending}
                >
                  {createPracticeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Assignment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReframePracticeForm;