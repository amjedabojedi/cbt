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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Calendar, CheckCircle, Clock, Flag } from "lucide-react";

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
  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: [`${getPathPrefix()}/goals`],
    enabled: !!activeUserId,
  });
  
  // Fetch milestones for selected goal
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
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
      
      const response = await apiRequest(
        "POST",
        `/api/users/${user.id}/goals`,
        {
          ...data,
          userId: user.id,
          status: "pending",
        }
      );
      
      return response.json();
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/goals`] });
      }
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
                        
                        {selectedGoal.therapistComments && (
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