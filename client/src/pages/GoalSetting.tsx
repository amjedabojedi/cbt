import { useState } from "react";
import { useAuth } from "@/lib/auth";
import useActiveUser from "@/hooks/use-active-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Calendar, CheckCircle, Clock, Flag, HelpCircle } from "lucide-react";

// Schema for goal creation
const goalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  specific: z.string().min(10, "Please provide more specific details"),
  measurable: z.string().min(10, "Please provide measurable criteria"),
  achievable: z.string().min(10, "Please explain why this is achievable"),
  relevant: z.string().min(10, "Please explain why this is relevant"),
  timebound: z.string().min(10, "Please provide a timeframe"),
  deadline: z.string().optional(),
});

// Schema for milestone creation
const milestoneSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;
type MilestoneFormValues = z.infer<typeof milestoneSchema>;

export default function GoalSetting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeUserId, getPathPrefix } = useActiveUser();
  const queryClient = useQueryClient();
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  
  // Fetch goals
  const { data: goals = [], isLoading, error } = useQuery<any[]>({
    queryKey: [`${getPathPrefix()}/goals`],
    enabled: !!activeUserId,
  });
  
  // Fetch milestones for selected goal
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery<any[]>({
    queryKey: selectedGoal ? [`/api/goals/${selectedGoal.id}/milestones`] : [],
    enabled: !!selectedGoal,
  });
  
  // Goal form
  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timebound: "",
      deadline: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 30 days from now
    },
  });
  
  // Milestone form
  const milestoneForm = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
    },
  });
  
  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormValues) => {
      if (!user) throw new Error("User not authenticated");
      if (!activeUserId) throw new Error("No active user");
      
      const response = await apiRequest(
        "POST",
        `${getPathPrefix()}/goals`,
        {
          ...data,
          userId: activeUserId,
          status: "pending",
        }
      );
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${getPathPrefix()}/goals`] });
      setIsCreatingGoal(false);
      toast({
        title: "Goal Created",
        description: "Your SMART goal has been created successfully.",
      });
      goalForm.reset();
    },
    onError: (error) => {
      console.error("Error creating goal:", error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Create milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: async (data: MilestoneFormValues) => {
      if (!selectedGoal) throw new Error("No goal selected");
      
      const response = await apiRequest(
        "POST",
        `/api/goals/${selectedGoal.id}/milestones`,
        {
          ...data,
          goalId: selectedGoal.id,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        }
      );
      
      return response.json();
    },
    onSuccess: () => {
      if (selectedGoal) {
        queryClient.invalidateQueries({ queryKey: [`/api/goals/${selectedGoal.id}/milestones`] });
      }
      setIsAddingMilestone(false);
      toast({
        title: "Milestone Added",
        description: "The milestone has been added to your goal.",
      });
      milestoneForm.reset();
    },
    onError: (error) => {
      console.error("Error creating milestone:", error);
      toast({
        title: "Error",
        description: "Failed to add milestone. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update milestone completion mutation
  const updateMilestoneCompletionMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/milestones/${id}/completion`,
        { isCompleted }
      );
      
      return response.json();
    },
    onSuccess: () => {
      if (selectedGoal) {
        queryClient.invalidateQueries({ queryKey: [`/api/goals/${selectedGoal.id}/milestones`] });
      }
      toast({
        title: "Milestone Updated",
        description: "The milestone status has been updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating milestone:", error);
      toast({
        title: "Error",
        description: "Failed to update milestone. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update goal status mutation
  const updateGoalStatusMutation = useMutation({
    mutationFn: async ({ id, status, therapistComments }: { id: number; status: string; therapistComments?: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/goals/${id}/status`,
        { status, therapistComments }
      );
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${getPathPrefix()}/goals`] });
      setSelectedGoal(null);
      toast({
        title: "Goal Updated",
        description: "The goal status has been updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating goal status:", error);
      toast({
        title: "Error",
        description: "Failed to update goal status. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle goal creation
  const onSubmitGoal = (data: GoalFormValues) => {
    createGoalMutation.mutate(data);
  };
  
  // Handle milestone creation
  const onSubmitMilestone = (data: MilestoneFormValues) => {
    createMilestoneMutation.mutate(data);
  };
  
  // Handle milestone completion toggle
  const toggleMilestoneCompletion = (id: number, currentStatus: boolean) => {
    updateMilestoneCompletionMutation.mutate({
      id,
      isCompleted: !currentStatus,
    });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (error) {
      return "No date set";
    }
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "approved":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "approved":
        return "Approved";
      default:
        return status;
    }
  };
  
  if (isLoading) {
    return (
      <AppLayout title="SMART Goals">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (error) {
    return (
      <AppLayout title="SMART Goals">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-red-500">
                Error loading goals. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="SMART Goals">
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="goals">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="goals">My Goals</TabsTrigger>
              {user?.role !== 'therapist' && (
                <TabsTrigger value="create">Create Goal</TabsTrigger>
              )}
            </TabsList>
            
            <Dialog open={isCreatingGoal} onOpenChange={setIsCreatingGoal}>
              {user?.role !== 'therapist' && (
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Goal
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create a SMART Goal</DialogTitle>
                  <DialogDescription>
                    SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound.
                  </DialogDescription>
                </DialogHeader>
                
                {/* Educational Content */}
                <div className="mb-6">
                  <Accordion type="single" collapsible className="bg-muted/50 rounded-lg p-2">
                    <AccordionItem value="smart-goals">
                      <AccordionTrigger className="text-base font-medium">
                        <div className="flex items-center">
                          <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                          Understanding SMART Goals
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm">
                        <p className="mb-2">
                          SMART is an acronym used to guide goal setting. It stands for Specific, Measurable, Achievable, Relevant, and Time-bound.
                        </p>
                        
                        <div className="space-y-3 mt-3">
                          <div>
                            <h4 className="font-medium">Specific</h4>
                            <p>Your goal should clearly define what you want to accomplish. The more specific, the better.</p>
                            <p className="text-xs mt-1 italic">Example: "I will walk 10,000 steps daily" instead of "I will exercise more."</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Measurable</h4>
                            <p>You need concrete criteria to track your progress and measure success.</p>
                            <p className="text-xs mt-1 italic">Example: "I will save $300 per month" instead of "I will save money."</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Achievable</h4>
                            <p>Your goal should be realistic and attainable with the resources available to you.</p>
                            <p className="text-xs mt-1 italic">Example: "I will read one book per month" instead of "I will read 100 books this year."</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Relevant</h4>
                            <p>Your goal should align with your broader life objectives and personal values.</p>
                            <p className="text-xs mt-1 italic">Example: "I will take a coding course to advance my career" instead of pursuing a goal unrelated to your interests or needs.</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Time-bound</h4>
                            <p>Your goal needs a target date or deadline to create urgency and maintain focus.</p>
                            <p className="text-xs mt-1 italic">Example: "I will complete this project by June 30th" instead of "I will do this project someday."</p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-medium">Benefits of SMART Goals:</h4>
                          <ul className="list-disc pl-5 space-y-1 mt-1">
                            <li>Provides clear direction and focus</li>
                            <li>Makes it easier to track progress</li>
                            <li>Increases motivation and commitment</li>
                            <li>Helps prioritize your efforts and resources</li>
                            <li>Creates accountability</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="milestones">
                      <AccordionTrigger className="text-base font-medium">
                        <div className="flex items-center">
                          <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                          The Power of Milestones
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm">
                        <p className="mb-2">
                          Milestones are smaller, manageable targets that mark your progress toward a larger goal.
                        </p>
                        
                        <div className="space-y-3 mt-3">
                          <div>
                            <h4 className="font-medium">Why Use Milestones?</h4>
                            <ul className="list-disc pl-5 space-y-1 mt-1">
                              <li><strong>Break down complexity</strong> - Large goals become less overwhelming</li>
                              <li><strong>Track progress</strong> - Regular feedback on how you're doing</li>
                              <li><strong>Celebrate small wins</strong> - Boost motivation along the journey</li>
                              <li><strong>Adjust as needed</strong> - Early warning if something needs to change</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Creating Effective Milestones:</h4>
                            <ul className="list-disc pl-5 space-y-1 mt-1">
                              <li>Make them specific and concrete</li>
                              <li>Set realistic timeframes</li>
                              <li>Ensure they build logically toward your main goal</li>
                              <li>Keep them achievable but challenging</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                
                <Form {...goalForm}>
                  <form onSubmit={goalForm.handleSubmit(onSubmitGoal)} className="space-y-4">
                    <FormField
                      control={goalForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goal Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a title for your goal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={goalForm.control}
                      name="specific"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific</FormLabel>
                          <FormDescription>
                            What exactly do you want to accomplish?
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Be precise about what you want to achieve..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={goalForm.control}
                      name="measurable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Measurable</FormLabel>
                          <FormDescription>
                            How will you track progress and measure success?
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Define criteria to measure progress..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={goalForm.control}
                      name="achievable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Achievable</FormLabel>
                          <FormDescription>
                            Is this goal realistic? Do you have the resources and capabilities?
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Explain why this goal is attainable..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={goalForm.control}
                      name="relevant"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relevant</FormLabel>
                          <FormDescription>
                            Why is this goal important to you? How does it align with your values?
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Describe why this goal matters to you..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={goalForm.control}
                      name="timebound"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time-bound</FormLabel>
                          <FormDescription>
                            What's your time frame for accomplishing this goal?
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your timeline and deadlines..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={goalForm.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Completion Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreatingGoal(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createGoalMutation.isPending}
                      >
                        {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <TabsContent value="goals" className="space-y-4">
            {goals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Flag className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No goals yet</h3>
                  <p className="text-neutral-500 text-center max-w-md mb-6">
                    Setting SMART goals helps you clarify your ideas, focus your efforts, and use your time and resources productively.
                  </p>
                  {user?.role !== 'therapist' && (
                    <Button onClick={() => setIsCreatingGoal(true)}>
                      Create Your First Goal
                    </Button>
                  )}
                  {user?.role === 'therapist' && (
                    <p className="text-amber-700 text-center mt-2">
                      As a therapist, you can only provide feedback on client goals.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Goals List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goals.map((goal: any) => (
                    <Card 
                      key={goal.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedGoal(goal)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{goal.title}</CardTitle>
                          <Badge className={getStatusBadgeColor(goal.status)}>
                            {formatStatus(goal.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-neutral-600 line-clamp-2">{goal.specific}</p>
                          
                          <div className="flex items-center text-xs text-neutral-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>
                              {goal.deadline ? formatDate(goal.deadline) : "No deadline set"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Selected Goal Details */}
                {selectedGoal && (
                  <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <div className="flex items-center justify-between">
                          <DialogTitle>{selectedGoal.title}</DialogTitle>
                          <Badge className={getStatusBadgeColor(selectedGoal.status)}>
                            {formatStatus(selectedGoal.status)}
                          </Badge>
                        </div>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-neutral-500 mb-1">Specific</h4>
                            <p className="text-sm p-3 bg-neutral-50 rounded border border-neutral-200">
                              {selectedGoal.specific}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-neutral-500 mb-1">Measurable</h4>
                            <p className="text-sm p-3 bg-neutral-50 rounded border border-neutral-200">
                              {selectedGoal.measurable}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-neutral-500 mb-1">Achievable</h4>
                            <p className="text-sm p-3 bg-neutral-50 rounded border border-neutral-200">
                              {selectedGoal.achievable}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-neutral-500 mb-1">Relevant</h4>
                            <p className="text-sm p-3 bg-neutral-50 rounded border border-neutral-200">
                              {selectedGoal.relevant}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-neutral-500 mb-1">Time-bound</h4>
                          <p className="text-sm p-3 bg-neutral-50 rounded border border-neutral-200">
                            {selectedGoal.timebound}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-neutral-500" />
                          <span className="text-sm text-neutral-700">
                            Target completion date: <strong>{selectedGoal.deadline ? formatDate(selectedGoal.deadline) : "Not set"}</strong>
                          </span>
                        </div>
                        
                        {/* Therapist goal status update */}
                        {user?.role === 'therapist' && (
                          <div className="border rounded-md p-4 bg-gray-50 mt-4">
                            <h4 className="font-medium mb-3">Therapist Feedback</h4>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Update Goal Status</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <Button 
                                    variant={selectedGoal.status === "in_progress" ? "default" : "outline"} 
                                    size="sm"
                                    onClick={() => updateGoalStatusMutation.mutate({
                                      id: selectedGoal.id,
                                      status: "in_progress",
                                      therapistComments: selectedGoal.therapistComments
                                    })}
                                  >
                                    Mark In Progress
                                  </Button>
                                  
                                  <Button 
                                    variant={selectedGoal.status === "approved" ? "default" : "outline"} 
                                    size="sm"
                                    onClick={() => updateGoalStatusMutation.mutate({
                                      id: selectedGoal.id,
                                      status: "approved",
                                      therapistComments: selectedGoal.therapistComments
                                    })}
                                  >
                                    Approve Goal
                                  </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <Button 
                                    variant={selectedGoal.status === "completed" ? "default" : "outline"} 
                                    size="sm"
                                    onClick={() => updateGoalStatusMutation.mutate({
                                      id: selectedGoal.id,
                                      status: "completed",
                                      therapistComments: selectedGoal.therapistComments
                                    })}
                                  >
                                    Mark as Completed
                                  </Button>
                                  
                                  <Button 
                                    variant={selectedGoal.status === "pending" ? "default" : "outline"} 
                                    size="sm"
                                    onClick={() => updateGoalStatusMutation.mutate({
                                      id: selectedGoal.id,
                                      status: "pending",
                                      therapistComments: selectedGoal.therapistComments
                                    })}
                                  >
                                    Reset to Pending
                                  </Button>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Therapist Comments</label>
                                <Textarea 
                                  placeholder="Add your feedback about this goal"
                                  className="mt-1"
                                  defaultValue={selectedGoal.therapistComments || ""}
                                  onBlur={(e) => {
                                    const comments = e.target.value;
                                    if (comments !== selectedGoal.therapistComments) {
                                      updateGoalStatusMutation.mutate({
                                        id: selectedGoal.id,
                                        status: selectedGoal.status,
                                        therapistComments: comments
                                      });
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Display therapist comments for clients */}
                        {user?.role !== 'therapist' && selectedGoal.therapistComments && (
                          <div>
                            <h4 className="text-sm font-medium text-neutral-500 mb-1">Therapist Comments</h4>
                            <p className="text-sm p-3 bg-neutral-50 rounded border border-neutral-200">
                              {selectedGoal.therapistComments}
                            </p>
                          </div>
                        )}
                        
                        <div className="border-t border-neutral-200 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Milestones</h4>
                            
                            {user?.role !== 'therapist' ? (
                              <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <PlusCircle className="h-4 w-4 mr-1" />
                                    Add Milestone
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Add a Milestone</DialogTitle>
                                    <DialogDescription>
                                      Break down your goal into manageable steps
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <Form {...milestoneForm}>
                                    <form onSubmit={milestoneForm.handleSubmit(onSubmitMilestone)} className="space-y-4">
                                      <FormField
                                        control={milestoneForm.control}
                                        name="title"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Milestone Title</FormLabel>
                                            <FormControl>
                                              <Input placeholder="Enter a title for this milestone" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <FormField
                                        control={milestoneForm.control}
                                        name="description"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Description (Optional)</FormLabel>
                                            <FormControl>
                                              <Textarea
                                                placeholder="Add more details about this milestone..."
                                                rows={3}
                                                {...field}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <FormField
                                        control={milestoneForm.control}
                                        name="dueDate"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Due Date (Optional)</FormLabel>
                                            <FormControl>
                                              <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <DialogFooter>
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          onClick={() => setIsAddingMilestone(false)}
                                        >
                                          Cancel
                                        </Button>
                                        <Button 
                                          type="submit"
                                          disabled={createMilestoneMutation.isPending}
                                        >
                                          {createMilestoneMutation.isPending ? "Adding..." : "Add Milestone"}
                                        </Button>
                                      </DialogFooter>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <p className="text-xs text-amber-600">
                                Therapists cannot add milestones
                              </p>
                            )}
                          </div>
                          
                          {milestonesLoading ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {milestones.length === 0 ? (
                                <p className="text-sm text-neutral-500 italic">
                                  No milestones yet. Add some to track your progress.
                                </p>
                              ) : (
                                milestones.map((milestone: any) => (
                                  <div 
                                    key={milestone.id} 
                                    className="flex items-start p-3 bg-neutral-50 rounded border border-neutral-200"
                                  >
                                    <Checkbox
                                      checked={milestone.isCompleted}
                                      onCheckedChange={() => toggleMilestoneCompletion(milestone.id, milestone.isCompleted)}
                                      className="mt-0.5 mr-3"
                                    />
                                    <div className="flex-1">
                                      <div className="flex justify-between">
                                        <p className={`font-medium ${milestone.isCompleted ? "line-through text-neutral-400" : ""}`}>
                                          {milestone.title}
                                        </p>
                                        {milestone.dueDate && (
                                          <span className="text-xs text-neutral-500">
                                            Due: {formatDate(milestone.dueDate)}
                                          </span>
                                        )}
                                      </div>
                                      {milestone.description && (
                                        <p className={`text-sm mt-1 ${milestone.isCompleted ? "line-through text-neutral-400" : "text-neutral-600"}`}>
                                          {milestone.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create a SMART Goal</CardTitle>
                <CardDescription>
                  SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Educational Content */}
                <div className="mb-6">
                  <Accordion type="single" collapsible className="mb-6">
                    <AccordionItem value="smart-goals-guide">
                      <AccordionTrigger className="text-base font-medium">
                        <div className="flex items-center">
                          <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                          Goal Setting Guide
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-sm">
                          <div>
                            <h4 className="font-medium text-base">Why Set SMART Goals?</h4>
                            <p className="mt-1">
                              Setting SMART goals provides structure and direction to your personal growth journey. Research shows that well-defined goals are significantly more likely to be achieved than vague intentions.
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-muted/30 p-3 rounded-lg">
                              <h5 className="font-medium">For Mental Health</h5>
                              <ul className="list-disc pl-5 space-y-1 mt-1">
                                <li>Provides a sense of purpose and direction</li>
                                <li>Creates structure and routine</li>
                                <li>Builds confidence through achievement</li>
                                <li>Reduces anxiety by breaking down challenges</li>
                              </ul>
                            </div>
                            
                            <div className="bg-muted/30 p-3 rounded-lg">
                              <h5 className="font-medium">For Personal Growth</h5>
                              <ul className="list-disc pl-5 space-y-1 mt-1">
                                <li>Helps identify important values and priorities</li>
                                <li>Develops self-discipline and focus</li>
                                <li>Creates a roadmap for steady improvement</li>
                                <li>Provides objective measures of progress</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-base">Goal-Setting Process</h4>
                            <ol className="list-decimal pl-5 space-y-2 mt-1">
                              <li>
                                <strong>Reflect on values and priorities</strong> - What matters most to you right now?
                              </li>
                              <li>
                                <strong>Identify areas for growth</strong> - Where would change be most beneficial?
                              </li>
                              <li>
                                <strong>Draft your goal</strong> - Create a preliminary statement of what you want to achieve
                              </li>
                              <li>
                                <strong>Apply the SMART criteria</strong> - Refine your goal to be specific, measurable, achievable, relevant, and time-bound
                              </li>
                              <li>
                                <strong>Break into milestones</strong> - Create smaller steps that lead to your goal
                              </li>
                              <li>
                                <strong>Review regularly</strong> - Track progress and adjust as needed
                              </li>
                            </ol>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="example-goals">
                      <AccordionTrigger className="text-base font-medium">
                        <div className="flex items-center">
                          <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                          Goal Examples and Templates
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-sm">
                          <p>
                            Below are examples of well-formed SMART goals in different areas of life. Use these as templates to help formulate your own goals.
                          </p>
                          
                          <div className="space-y-3">
                            <div className="border-l-4 border-primary/80 pl-3 py-1">
                              <h5 className="font-medium">Emotional Regulation Example</h5>
                              <p className="italic text-sm mt-1">
                                "I will practice mindfulness meditation for 10 minutes each morning before work for the next 30 days, tracking my emotional reactivity scores before and after to reduce my anxiety levels by at least 30%."
                              </p>
                              <ul className="text-xs mt-2 space-y-1">
                                <li><strong>Specific:</strong> Clearly defines the action (mindfulness meditation)</li>
                                <li><strong>Measurable:</strong> 10 minutes daily, with tracked anxiety scores</li>
                                <li><strong>Achievable:</strong> A modest time commitment that can fit into most schedules</li>
                                <li><strong>Relevant:</strong> Directly addresses emotional regulation</li>
                                <li><strong>Time-bound:</strong> 30-day commitment with clear success metrics</li>
                              </ul>
                            </div>
                            
                            <div className="border-l-4 border-primary/80 pl-3 py-1">
                              <h5 className="font-medium">Communication Skills Example</h5>
                              <p className="italic text-sm mt-1">
                                "I will practice active listening in at least one conversation per day for the next 8 weeks, noting three specific techniques I used and getting feedback from my conversation partner on my effectiveness."
                              </p>
                              <ul className="text-xs mt-2 space-y-1">
                                <li><strong>Specific:</strong> Focuses on active listening techniques</li>
                                <li><strong>Measurable:</strong> One conversation daily with documented techniques</li>
                                <li><strong>Achievable:</strong> Requires minimal time commitment</li>
                                <li><strong>Relevant:</strong> Directly improves relationship skills</li>
                                <li><strong>Time-bound:</strong> 8-week timeframe with ongoing assessment</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                
                <Form {...goalForm}>
                  <form onSubmit={goalForm.handleSubmit(onSubmitGoal)} className="space-y-4">
                    <FormField
                      control={goalForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goal Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a title for your goal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={goalForm.control}
                        name="specific"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific</FormLabel>
                            <FormDescription>
                              What exactly do you want to accomplish?
                            </FormDescription>
                            <FormControl>
                              <Textarea
                                placeholder="Be precise about what you want to achieve..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={goalForm.control}
                        name="measurable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Measurable</FormLabel>
                            <FormDescription>
                              How will you track progress and measure success?
                            </FormDescription>
                            <FormControl>
                              <Textarea
                                placeholder="Define criteria to measure progress..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={goalForm.control}
                        name="achievable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Achievable</FormLabel>
                            <FormDescription>
                              Is this goal realistic? Do you have the resources?
                            </FormDescription>
                            <FormControl>
                              <Textarea
                                placeholder="Explain why this goal is attainable..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={goalForm.control}
                        name="relevant"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relevant</FormLabel>
                            <FormDescription>
                              Why is this goal important to you?
                            </FormDescription>
                            <FormControl>
                              <Textarea
                                placeholder="Describe why this goal matters to you..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={goalForm.control}
                      name="timebound"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time-bound</FormLabel>
                          <FormDescription>
                            What's your time frame for accomplishing this goal?
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your timeline and deadlines..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={goalForm.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Completion Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit"
                      disabled={createGoalMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}