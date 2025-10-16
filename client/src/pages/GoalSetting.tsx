import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import useActiveUser from "@/hooks/use-active-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";
import ModuleHeader from "@/components/layout/ModuleHeader";
import SmartGoalWizard from "@/components/goal/SmartGoalWizard";
import { useToast } from "@/hooks/use-toast";
import { BackToClientsButton } from "@/components/navigation/BackToClientsButton";

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
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Calendar, CheckCircle, Clock, Flag, HelpCircle, Target, TrendingUp } from "lucide-react";

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
  const { activeUserId, apiPath } = useActiveUser();
  const queryClient = useQueryClient();
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  
  // Check if we have insights from a reflection
  const [reflectionInsights, setReflectionInsights] = useState<string | null>(null);
  
  // Fetch goals
  const { data: goals = [], isLoading, error } = useQuery<any[]>({
    queryKey: [`${apiPath}/goals`],
    enabled: !!activeUserId,
  });
  
  // Fetch all milestones for all goals to calculate progress
  const { data: allMilestones = [] } = useQuery<any[]>({
    queryKey: [`${apiPath}/goals/milestones`],
    enabled: !!activeUserId && goals.length > 0,
  });
  
  // Fetch milestones for selected goal
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery<any[]>({
    queryKey: selectedGoal ? [`/api/goals/${selectedGoal.id}/milestones`] : [],
    enabled: !!selectedGoal,
  });
  
  // Calculate milestone progress for a goal
  const getMilestoneProgress = (goalId: number) => {
    const goalMilestones = allMilestones.filter((m: any) => m.goalId === goalId);
    if (goalMilestones.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = goalMilestones.filter((m: any) => m.isCompleted).length;
    const total = goalMilestones.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };
  
  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return "bg-gray-300";
    if (percentage < 30) return "bg-red-500";
    if (percentage < 70) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  // Calculate overall stats
  const overallStats = {
    totalGoals: goals.length,
    completedGoals: goals.filter((g: any) => g.status === 'completed').length,
    inProgressGoals: goals.filter((g: any) => g.status === 'in_progress' || g.status === 'approved').length,
    pendingGoals: goals.filter((g: any) => g.status === 'pending').length,
  };
  
  // Goal form - moved up to avoid reference errors
  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      specific: "",
      measurable: reflectionInsights ? "Based on my reflection: " + reflectionInsights : "",
      achievable: "",
      relevant: "",
      timebound: "",
      deadline: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 30 days from now
    },
  });

  // Check for reflection insights in sessionStorage
  useEffect(() => {
    // Check if there are reflection insights stored from the reflection wizard
    const storedInsights = sessionStorage.getItem('reflection_insights');
    if (storedInsights) {
      setReflectionInsights(storedInsights);
      // Automatically open the goal creation dialog if we have insights
      setIsCreatingGoal(true);
      // Clear from session storage after using it
      sessionStorage.removeItem('reflection_insights');
    }
  }, []);
  
  // Update form field when reflectionInsights changes
  useEffect(() => {
    if (reflectionInsights) {
      goalForm.setValue('measurable', `Based on my reflection: ${reflectionInsights}`);
    }
  }, [reflectionInsights, goalForm]);
  
  
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
        `${apiPath}/goals`,
        {
          ...data,
          userId: activeUserId,
        }
      );
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/goals`] });
      goalForm.reset();
      setIsCreatingGoal(false);
      toast({
        title: "Goal Created",
        description: "Your goal has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create goal: ${error.message}`,
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
        }
      );
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${selectedGoal?.id}/milestones`] });
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/goals`] });
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/goals/milestones`] });
      milestoneForm.reset();
      setIsAddingMilestone(false);
      toast({
        title: "Milestone Added",
        description: "Milestone has been added to your goal.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add milestone: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update goal status mutation
  const updateGoalStatusMutation = useMutation({
    mutationFn: async ({ goalId, status, comments }: { goalId: number, status: string, comments?: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/goals/${goalId}/status`,
        { status, therapistComments: comments }
      );
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/goals`] });
      toast({
        title: "Goal Updated",
        description: "Goal status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update goal: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Toggle milestone completion mutation
  const toggleMilestoneCompletionMutation = useMutation({
    mutationFn: async ({ milestoneId, isCompleted }: { milestoneId: number, isCompleted: boolean }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/milestones/${milestoneId}/completion`,
        { isCompleted }
      );
      
      return await response.json();
    },
    onSuccess: () => {
      if (selectedGoal) {
        queryClient.invalidateQueries({ queryKey: [`/api/goals/${selectedGoal.id}/milestones`] });
      }
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/goals`] });
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/goals/milestones`] });
      toast({
        title: "Milestone Updated",
        description: "Milestone completion status has been updated.",
      });
    },
  });
  
  const onSubmitGoal = (data: GoalFormValues) => {
    createGoalMutation.mutate(data);
  };
  
  const onSubmitMilestone = (data: MilestoneFormValues) => {
    createMilestoneMutation.mutate(data);
  };
  
  const getStatusBadge = (status: string, size: 'sm' | 'lg' = 'sm') => {
    const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';
    
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className={`bg-yellow-100 text-yellow-800 hover:bg-yellow-100 ${sizeClasses}`}>
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className={`bg-blue-100 text-blue-800 hover:bg-blue-100 ${sizeClasses}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className={`bg-purple-100 text-purple-800 hover:bg-purple-100 ${sizeClasses}`}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className={`bg-green-100 text-green-800 hover:bg-green-100 ${sizeClasses}`}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline" className={sizeClasses}>{status}</Badge>;
    }
  };
  
  return (
    <AppLayout>
      <div className="container py-6">
        {/* Back to Clients button */}
        <BackToClientsButton />
        
        {/* Module Header */}
        <ModuleHeader
          title="Smart Goals"
          description="Set structured SMART goals to track your progress and celebrate achievements"
          badges={[]}
        />
        
        {/* Overall Progress Summary */}
        {!isLoading && goals.length > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Overall Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg" data-testid="stat-total-goals">
                  <div className="text-2xl font-bold text-primary">{overallStats.totalGoals}</div>
                  <div className="text-sm text-muted-foreground">Total Goals</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg" data-testid="stat-completed-goals">
                  <div className="text-2xl font-bold text-green-600">{overallStats.completedGoals}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg" data-testid="stat-in-progress-goals">
                  <div className="text-2xl font-bold text-blue-600">{overallStats.inProgressGoals}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg" data-testid="stat-pending-goals">
                  <div className="text-2xl font-bold text-yellow-600">{overallStats.pendingGoals}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Keep existing goal creation dialog for backward compatibility */}
        {user?.role === 'client' && (
          <Dialog open={isCreatingGoal} onOpenChange={setIsCreatingGoal}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 hidden" data-testid="button-new-goal">
                <PlusCircle className="h-4 w-4" />
                New Goal
              </Button>
            </DialogTrigger>
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
                      <Button type="submit" disabled={createGoalMutation.isPending}>
                        {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        
        <Tabs 
          defaultValue={
            (user?.role === 'therapist' || user?.role === 'admin') ? "goals" : "set"
          }
          className="w-full"
        >
          <TabsList>
            {/* Only show Set Goal tab for clients viewing their own data (NOT therapists) */}
            {user?.role === 'client' && (
              <TabsTrigger value="set">Set Goal</TabsTrigger>
            )}
            <TabsTrigger value="goals">
              {user?.role === 'therapist' || user?.role === 'admin' ? "Client's Goals" : "My Goals"}
            </TabsTrigger>
          </TabsList>
          
          {/* Set Goal tab - only accessible to clients */}
          {user?.role === 'client' && (
            <TabsContent value="set">
              {/* Educational Accordion */}
              <Accordion type="single" collapsible className="mb-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-4">
                <AccordionItem value="why-smart-goals" className="border-0">
                  <AccordionTrigger className="text-base font-medium hover:no-underline py-3">
                    <div className="flex items-center">
                      <HelpCircle className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Why SMART Goals?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p className="mb-3">
                      SMART goals provide structure and direction to your personal growth journey. Research shows that well-defined goals are significantly more likely to be achieved than vague intentions.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-slate-900/50 p-3 rounded-md">
                        <h4 className="font-medium text-foreground mb-1">For Mental Health</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                          <li>Provides a sense of purpose and direction</li>
                          <li>Creates structure and routine</li>
                          <li>Builds confidence through achievement</li>
                          <li>Reduces anxiety by breaking down challenges</li>
                        </ul>
                      </div>
                      
                      <div className="bg-white dark:bg-slate-900/50 p-3 rounded-md">
                        <h4 className="font-medium text-foreground mb-1">For Personal Growth</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                          <li>Helps identify important values and priorities</li>
                          <li>Develops self-discipline and focus</li>
                          <li>Creates a roadmap for steady improvement</li>
                          <li>Provides objective measures of progress</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <SmartGoalWizard onGoalCreated={() => {
                queryClient.invalidateQueries({ queryKey: [`/api/users/${activeUserId}/goals`] });
              }} />
            </TabsContent>
          )}
          
          <TabsContent value="goals" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : error ? (
              <div className="bg-destructive/10 p-4 rounded-md text-center">
                <p className="text-destructive font-medium">Error loading goals</p>
                <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <h3 className="font-medium text-lg">No Goals Yet</h3>
                <p className="text-muted-foreground mt-1">
                  {user?.role === 'client' 
                    ? "Create your first goal to start tracking your progress." 
                    : "Your client hasn't created any goals yet."}
                </p>
                {user?.role === 'client' && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsCreatingGoal(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Your First Goal
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => {
                  const progress = getMilestoneProgress(goal.id);
                  const progressColor = getProgressColor(progress.percentage);
                  
                  return (
                    <Card key={goal.id} className="overflow-hidden" data-testid={`goal-card-${goal.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg font-bold">{goal.title}</CardTitle>
                          <div>{getStatusBadge(goal.status, 'lg')}</div>
                        </div>
                        
                        {/* Milestone Progress */}
                        {progress.total > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Milestone Progress</span>
                              <span className="font-semibold" data-testid={`goal-progress-${goal.id}`}>
                                {progress.completed}/{progress.total} completed ({progress.percentage}%)
                              </span>
                            </div>
                            <Progress 
                              value={progress.percentage} 
                              className="h-2"
                              data-testid={`progress-bar-${goal.id}`}
                            />
                          </div>
                        )}
                        
                        {goal.deadline && (
                          <div className="flex items-center text-sm text-muted-foreground mt-2">
                            <Calendar className="h-4 w-4 mr-1" />
                            Target: {format(parseISO(goal.deadline), "MMM d, yyyy")}
                          </div>
                        )}
                      </CardHeader>
                      
                      <CardContent className="pb-3">
                        <div className="space-y-2">
                          <div>
                            <h4 className="text-sm font-medium text-primary">Specific</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{goal.specific}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-primary">Measurable</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{goal.measurable}</p>
                          </div>
                          
                          <div className="flex gap-3 mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-auto p-0 text-primary hover:text-primary/80 hover:bg-transparent"
                              onClick={() => setSelectedGoal(goal)}
                              data-testid={`button-view-details-${goal.id}`}
                            >
                              <Flag className="h-3.5 w-3.5 mr-1" />
                              View Details
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-auto p-0 text-primary hover:text-primary/80 hover:bg-transparent"
                              onClick={() => setSelectedGoal(goal)}
                              data-testid={`button-view-milestones-${goal.id}`}
                            >
                              <Target className="h-3.5 w-3.5 mr-1" />
                              View Milestones ({progress.total})
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    
                    {user?.role === 'therapist' && (
                      <CardFooter className="flex flex-col items-stretch pt-1 pb-3">
                        <div className="text-sm font-medium mb-2">Update Status:</div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant={goal.status === 'pending' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => updateGoalStatusMutation.mutate({ 
                              goalId: goal.id, 
                              status: 'pending',
                              comments: goal.therapistComments
                            })}
                          >
                            Pending
                          </Button>
                          <Button
                            variant={goal.status === 'in_progress' ? "default" : "outline"} 
                            size="sm" 
                            onClick={() => updateGoalStatusMutation.mutate({ 
                              goalId: goal.id, 
                              status: 'in_progress',
                              comments: goal.therapistComments
                            })}
                          >
                            In Progress
                          </Button>
                          <Button
                            variant={goal.status === 'approved' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => updateGoalStatusMutation.mutate({ 
                              goalId: goal.id, 
                              status: 'approved',
                              comments: goal.therapistComments
                            })}
                          >
                            Approved
                          </Button>
                          <Button
                            variant={goal.status === 'completed' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => updateGoalStatusMutation.mutate({ 
                              goalId: goal.id, 
                              status: 'completed',
                              comments: goal.therapistComments
                            })}
                          >
                            Completed
                          </Button>
                        </div>
                        
                        <div className="mt-4">
                          <div className="text-sm font-medium mb-2">Feedback:</div>
                          <Textarea 
                            placeholder="Add your feedback or suggestions here..."
                            defaultValue={goal.therapistComments || ""}
                            className="min-h-[80px]"
                            onBlur={(e) => {
                              if (e.target.value !== goal.therapistComments) {
                                updateGoalStatusMutation.mutate({ 
                                  goalId: goal.id, 
                                  status: goal.status,
                                  comments: e.target.value
                                });
                              }
                            }}
                          />
                        </div>
                      </CardFooter>
                    )}
                    </Card>
                  );
                })}
              </div>
            )}
            
            {/* Goal Details Dialog */}
            <Dialog open={!!selectedGoal} onOpenChange={(open) => !open && setSelectedGoal(null)}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedGoal?.title}</DialogTitle>
                  <DialogDescription className="flex items-center gap-3 flex-wrap">
                    {getStatusBadge(selectedGoal?.status || 'pending', 'lg')}
                    {selectedGoal?.deadline && (
                      <span className="inline-flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        Target: {format(parseISO(selectedGoal?.deadline), "MMM d, yyyy")}
                      </span>
                    )}
                    {(() => {
                      const progress = getMilestoneProgress(selectedGoal?.id || 0);
                      return progress.total > 0 ? (
                        <span className="inline-flex items-center text-sm font-medium text-primary">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {progress.completed}/{progress.total} milestones completed
                        </span>
                      ) : null;
                    })()}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-medium text-lg mb-3">Goal Details</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium">Specific</h4>
                        <p className="text-sm text-muted-foreground mt-1">{selectedGoal?.specific}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium">Measurable</h4>
                        <p className="text-sm text-muted-foreground mt-1">{selectedGoal?.measurable}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium">Achievable</h4>
                        <p className="text-sm text-muted-foreground mt-1">{selectedGoal?.achievable}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium">Relevant</h4>
                        <p className="text-sm text-muted-foreground mt-1">{selectedGoal?.relevant}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium">Time-bound</h4>
                        <p className="text-sm text-muted-foreground mt-1">{selectedGoal?.timebound}</p>
                      </div>
                    </div>
                    
                    {selectedGoal?.therapistComments && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium">Therapist Feedback</h4>
                        <p className="text-sm italic bg-muted/50 p-3 rounded-md mt-1">
                          {selectedGoal.therapistComments}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div id="milestones-section" className="bg-muted/30 p-6 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-xl">Milestones</h3>
                      </div>
                      
                      {user?.role === 'client' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => setIsAddingMilestone(true)}
                          data-testid="button-add-milestone"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Milestone
                        </Button>
                      )}
                    </div>
                    
                    {milestonesLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : milestones.length === 0 ? (
                      <div className="text-center p-6 border border-dashed rounded-lg">
                        <p className="text-muted-foreground text-sm">
                          No milestones created yet
                        </p>
                        {user?.role === 'client' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                            onClick={() => setIsAddingMilestone(true)}
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Add First Milestone
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {milestones.map((milestone, index) => (
                          <div 
                            key={milestone.id} 
                            className={`p-3 border rounded-md ${
                              milestone.isCompleted 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-background'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <div className="mt-0.5">
                                  {user?.role === 'client' ? (
                                    <Checkbox 
                                      checked={milestone.isCompleted} 
                                      onCheckedChange={(checked) => {
                                        toggleMilestoneCompletionMutation.mutate({
                                          milestoneId: milestone.id,
                                          isCompleted: !!checked,
                                        });
                                      }}
                                    />
                                  ) : (
                                    milestone.isCompleted ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                      <Clock className="h-5 w-5 text-yellow-600" />
                                    )
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1">
                                <h4 className={`font-medium ${
                                  milestone.isCompleted ? 'text-green-800' : ''
                                }`}>
                                  {milestone.title}
                                </h4>
                                
                                {milestone.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {milestone.description}
                                  </p>
                                )}
                                
                                {milestone.dueDate && (
                                  <div className="flex items-center text-xs text-muted-foreground mt-2">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(parseISO(milestone.dueDate), "MMM d, yyyy")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Add Milestone Dialog */}
            <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Milestone</DialogTitle>
                  <DialogDescription>
                    Break down your goal into smaller, achievable steps.
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
                              placeholder="Add details about this milestone..."
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
                      <Button type="submit" disabled={createMilestoneMutation.isPending}>
                        {createMilestoneMutation.isPending ? "Adding..." : "Add Milestone"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}