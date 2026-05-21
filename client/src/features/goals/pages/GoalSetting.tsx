import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import useActiveUser from "@/hooks/use-active-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import ModulePageShell from "@/components/layout/ModulePageShell";
import SmartGoalWizard from "@/features/goals/components/SmartGoalWizard";
import GoalInsights from "@/features/goals/components/GoalInsights";
import GoalCard from "@/features/goals/components/GoalCard";
import GoalForm, { goalSchema, GoalFormValues, milestoneSchema, MilestoneFormValues } from "@/features/goals/components/GoalForm";
import MilestoneList from "@/features/goals/components/MilestoneList";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Calendar, CheckCircle, Clock, Flag, HelpCircle, Target, TrendingUp, MoreVertical } from "lucide-react";

export default function GoalSetting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeUserId, apiPath } = useActiveUser();
  const queryClient = useQueryClient();
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const [reflectionInsights, setReflectionInsights] = useState<string | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');

  const { data: goals = [], isLoading, error } = useQuery<any[]>({
    queryKey: [`${apiPath}/goals`],
    enabled: !!activeUserId,
  });

  const { data: allMilestones = [] } = useQuery<any[]>({
    queryKey: [`${apiPath}/goals/milestones`],
    enabled: !!activeUserId && goals.length > 0,
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery<any[]>({
    queryKey: selectedGoal ? [`/api/goals/${selectedGoal.id}/milestones`] : [],
    enabled: !!selectedGoal,
  });

  const getMilestoneProgress = (goalId: number) => {
    const goalMilestones = allMilestones.filter((m: any) => m.goalId === goalId);
    if (goalMilestones.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const completed = goalMilestones.filter((m: any) => m.isCompleted).length;
    const total = goalMilestones.length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return "bg-gray-300";
    if (percentage < 30) return "bg-red-500";
    if (percentage < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const overallStats = {
    totalGoals: goals.length,
    completedGoals: goals.filter((g: any) => g.status === 'completed').length,
    inProgressGoals: goals.filter((g: any) => g.status === 'in_progress' || g.status === 'approved').length,
    pendingGoals: goals.filter((g: any) => g.status === 'pending').length,
  };

  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      specific: "",
      measurable: reflectionInsights ? "Based on my reflection: " + reflectionInsights : "",
      achievable: "",
      relevant: "",
      timebound: "",
      deadline: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    },
  });

  useEffect(() => {
    const storedInsights = sessionStorage.getItem('reflection_insights');
    if (storedInsights) {
      setReflectionInsights(storedInsights);
      setIsCreatingGoal(true);
      sessionStorage.removeItem('reflection_insights');
    }
  }, []);

  useEffect(() => {
    if (reflectionInsights) {
      goalForm.setValue('measurable', `Based on my reflection: ${reflectionInsights}`);
    }
  }, [reflectionInsights, goalForm]);

  const milestoneForm = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
    },
  });

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
    <ModulePageShell
      title="Smart Goals"
      description="Set structured SMART goals to track your progress and celebrate achievements"
    >

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

      {user?.role === 'client' && (
        <>
          <Button size="sm" className="gap-1 hidden" data-testid="button-new-goal" onClick={() => setIsCreatingGoal(true)}>
            <PlusCircle className="h-4 w-4" />
            New Goal
          </Button>
          <GoalForm
            open={isCreatingGoal}
            onOpenChange={setIsCreatingGoal}
            form={goalForm}
            onSubmit={onSubmitGoal}
            isPending={createGoalMutation.isPending}
            reflectionInsights={reflectionInsights}
          />
        </>
      )}

      <Tabs
        defaultValue={
          tabParam === 'insights'
            ? "insights"
            : tabParam === 'goals'
              ? "goals"
              : tabParam === 'set'
                ? "set"
                : (user?.role === 'therapist' || user?.role === 'admin') ? "goals" : "set"
        }
        className="space-y-4"
      >
        <TabsList>
          {user?.role === 'client' && (
            <TabsTrigger value="set">Set Goal</TabsTrigger>
          )}
          <TabsTrigger value="goals">
            {user?.role === 'therapist' || user?.role === 'admin' ? "Client's Goals" : "My Goals"}
          </TabsTrigger>
          <TabsTrigger value="insights">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Insights
          </TabsTrigger>
        </TabsList>

        {user?.role === 'client' && (
          <TabsContent value="set">
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

                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    user={user}
                    progress={progress}
                    getStatusBadge={getStatusBadge}
                    onSelect={setSelectedGoal}
                    onUpdateStatus={({ goalId, status, comments }) =>
                      updateGoalStatusMutation.mutate({ goalId, status, comments })
                    }
                  />
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

                <MilestoneList
                  milestones={milestones}
                  isLoading={milestonesLoading}
                  user={user}
                  selectedGoal={selectedGoal}
                  isAddingMilestone={isAddingMilestone}
                  onSetAddingMilestone={setIsAddingMilestone}
                  onToggleCompletion={({ milestoneId, isCompleted }) =>
                    toggleMilestoneCompletionMutation.mutate({ milestoneId, isCompleted })
                  }
                />
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
                          <Input placeholder="Enter a title for this milestone" voiceInput {...field} />
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

        <TabsContent value="insights">
          {activeUserId && <GoalInsights userId={activeUserId} />}
        </TabsContent>
      </Tabs>
    </ModulePageShell>
  );
}
