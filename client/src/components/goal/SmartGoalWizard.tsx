import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useActiveUser from "@/hooks/use-active-user";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Target,
  Ruler,
  TrendingUp,
  Link as LinkIcon,
  Clock,
  ListChecks,
  Plus,
  X,
  HelpCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Form schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  specific: z.string().min(20, "Please be more specific (at least 20 characters)"),
  measurable: z.string().min(20, "Please describe how you'll measure progress (at least 20 characters)"),
  achievable: z.string().min(20, "Please explain why this is achievable (at least 20 characters)"),
  relevant: z.string().min(20, "Please explain why this matters to you (at least 20 characters)"),
  timebound: z.string().min(10, "Please specify a timeframe (at least 10 characters)"),
  deadline: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Milestone {
  title: string;
  description?: string;
  dueDate?: Date;
}

interface SmartGoalWizardProps {
  onGoalCreated?: () => void;
}

export default function SmartGoalWizard({ onGoalCreated }: SmartGoalWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeUserId } = useActiveUser();
  const [currentStep, setCurrentStep] = useState(0); // 0 = intro
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState({ title: "", description: "", dueDate: undefined as Date | undefined });
  const [createdGoal, setCreatedGoal] = useState<any>(null);
  
  const totalSteps = 8; // Intro + 6 SMART steps + Milestones

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timebound: "",
      deadline: undefined,
    },
  });

  // Get watched values for direct binding (Microsoft Edge fix)
  const watchedValues = form.watch();

  // Validate current step
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 0:
        return true; // Intro - no validation
      case 1:
        return await form.trigger("title");
      case 2:
        return await form.trigger("specific");
      case 3:
        return await form.trigger("measurable");
      case 4:
        return await form.trigger("achievable");
      case 5:
        return await form.trigger("relevant");
      case 6:
        return await form.trigger(["timebound", "deadline"]);
      case 7:
        return true; // Milestones - optional
      default:
        return false;
    }
  };

  // Handle next step
  const handleNextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Add milestone
  const handleAddMilestone = () => {
    if (newMilestone.title.trim()) {
      setMilestones([...milestones, { ...newMilestone }]);
      setNewMilestone({ title: "", description: "", dueDate: undefined });
    }
  };

  // Remove milestone
  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  // Submit goal
  const onSubmit = async (values: FormValues) => {
    if (!activeUserId) return;

    try {
      // Create goal
      const goalResponse = await apiRequest("POST", "/api/goals", {
        userId: activeUserId,
        title: values.title,
        specific: values.specific,
        measurable: values.measurable,
        achievable: values.achievable,
        relevant: values.relevant,
        timebound: values.timebound,
        deadline: values.deadline?.toISOString(),
        status: "pending",
      });

      const goal = await goalResponse.json();
      setCreatedGoal(goal);

      // Create milestones if any
      if (milestones.length > 0) {
        await Promise.all(
          milestones.map((milestone) =>
            apiRequest("POST", "/api/milestones", {
              goalId: goal.id,
              title: milestone.title,
              description: milestone.description || null,
              dueDate: milestone.dueDate?.toISOString() || null,
              isCompleted: false,
            })
          )
        );
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${activeUserId}/goals`] });

      setShowSuccessDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    }
  };

  // Reset wizard
  const handleReset = () => {
    form.reset();
    setCurrentStep(0);
    setMilestones([]);
    setCreatedGoal(null);
    setShowSuccessDialog(false);
    
    if (onGoalCreated) {
      onGoalCreated();
    }
  };

  const progress = (currentStep / (totalSteps - 1)) * 100;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle>SMART Goal Wizard</CardTitle>
              <CardDescription>
                {currentStep === 0 ? "Introduction" : `Step ${currentStep} of ${totalSteps - 1}`}
              </CardDescription>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span className={currentStep >= 1 ? "text-blue-600 font-medium" : ""}>Title</span>
              <span className={currentStep >= 2 ? "text-blue-600 font-medium" : ""}>Specific</span>
              <span className={currentStep >= 3 ? "text-blue-600 font-medium" : ""}>Measurable</span>
              <span className={currentStep >= 4 ? "text-blue-600 font-medium" : ""}>Achievable</span>
              <span className={currentStep >= 5 ? "text-blue-600 font-medium" : ""}>Relevant</span>
              <span className={currentStep >= 6 ? "text-blue-600 font-medium" : ""}>Time-bound</span>
              <span className={currentStep >= 7 ? "text-blue-600 font-medium" : ""}>Milestones</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Intro Step */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <Target className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h2 className="text-2xl font-bold mb-3">Welcome to SMART Goal Setting</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                      SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound. This framework helps you create clear, actionable goals that you can actually achieve.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Specific
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Clear and well-defined</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Measurable
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Track your progress</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Achievable
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Realistic and attainable</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Relevant
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Matters to you</p>
                        </CardContent>
                      </Card>
                      <Card className="md:col-span-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Time-bound
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Has a clear deadline</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Title */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Start with a Clear Vision
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Give your goal a memorable title that captures what you want to achieve. This will help you stay focused and motivated.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg flex items-center gap-2">
                          Goal Title <span className="text-red-500 text-xl">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Run a 5K Marathon, Learn Spanish, Save $5000..."
                            className="text-base"
                            {...field}
                            data-testid="input-goal-title"
                          />
                        </FormControl>
                        <FormDescription>
                          A clear, motivating title for your goal (at least 5 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Specific */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Be Specific
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Define exactly what you want to accomplish. Answer: What will I do? How will I do it? Where? With whom?
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Example: "I will exercise 3 times per week at the gym" instead of "I want to be healthier"
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="specific"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg flex items-center gap-2">
                          What Specifically Will You Do? <span className="text-red-500 text-xl">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            value={watchedValues.specific}
                            onChange={(e) => form.setValue("specific", e.target.value)}
                            placeholder="Describe your goal in detail. What exactly will you accomplish? Be as specific as possible..."
                            className="resize-none min-h-[120px] text-base"
                            data-testid="textarea-goal-specific"
                          />
                        </FormControl>
                        <FormDescription>
                          Be detailed and clear about what you'll do (at least 20 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Measurable */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Make It Measurable
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      How will you know when you've achieved your goal? Define concrete criteria to track your progress.
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Example: "Complete 12 workout sessions" or "Save $100 per week"
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="measurable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg flex items-center gap-2">
                          How Will You Measure Progress? <span className="text-red-500 text-xl">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            value={watchedValues.measurable}
                            onChange={(e) => form.setValue("measurable", e.target.value)}
                            placeholder="What metrics or milestones will show your progress? How will you know you've succeeded?"
                            className="resize-none min-h-[120px] text-base"
                            data-testid="textarea-goal-measurable"
                          />
                        </FormControl>
                        <FormDescription>
                          Define clear metrics to track progress (at least 20 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 4: Achievable */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Keep It Achievable
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Is this goal realistic given your current resources, skills, and time? Challenge yourself, but stay practical.
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Example: "I have gym membership and can commit 3 hours/week" or "I currently save $50/week and can increase to $100"
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="achievable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg flex items-center gap-2">
                          Why Is This Achievable? <span className="text-red-500 text-xl">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            value={watchedValues.achievable}
                            onChange={(e) => form.setValue("achievable", e.target.value)}
                            placeholder="What resources, skills, or support do you have? What makes this goal realistic for you?"
                            className="resize-none min-h-[120px] text-base"
                            data-testid="textarea-goal-achievable"
                          />
                        </FormControl>
                        <FormDescription>
                          Explain why this goal is realistic for you (at least 20 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 5: Relevant */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Make It Relevant
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Why does this goal matter to you? How does it align with your values and life priorities?
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Example: "Better health will give me energy to play with my kids" or "Financial security reduces my stress"
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="relevant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg flex items-center gap-2">
                          Why Does This Matter to You? <span className="text-red-500 text-xl">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            value={watchedValues.relevant}
                            onChange={(e) => form.setValue("relevant", e.target.value)}
                            placeholder="How will achieving this goal improve your life? Why is it important to you right now?"
                            className="resize-none min-h-[120px] text-base"
                            data-testid="textarea-goal-relevant"
                          />
                        </FormControl>
                        <FormDescription>
                          Explain the personal meaning behind this goal (at least 20 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 6: Time-bound */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Set a Timeline
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      When will you achieve this goal? A deadline creates urgency and helps you stay on track.
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Example: "Complete by end of Q3" or "Achieve within 3 months"
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="timebound"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg flex items-center gap-2">
                          What's Your Timeframe? <span className="text-red-500 text-xl">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            value={watchedValues.timebound}
                            onChange={(e) => form.setValue("timebound", e.target.value)}
                            placeholder="By when will you achieve this? Describe your timeline..."
                            className="resize-none min-h-[100px] text-base"
                            data-testid="textarea-goal-timebound"
                          />
                        </FormControl>
                        <FormDescription>
                          Specify when you'll complete this goal (at least 10 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">Target Deadline (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                data-testid="button-select-deadline"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Optional: Select a specific target date
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 7: Milestones */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Break It Down (Optional)
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Milestones are smaller checkpoints that help you track progress toward your main goal. They keep you motivated and on track.
                    </p>
                  </div>

                  {/* Add Milestone Form */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Milestone
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        placeholder="Milestone title"
                        value={newMilestone.title}
                        onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                        data-testid="input-milestone-title"
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={newMilestone.description}
                        onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                        className="resize-none"
                        rows={2}
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newMilestone.dueDate ? format(newMilestone.dueDate, "PPP") : <span>Due date (optional)</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newMilestone.dueDate}
                            onSelect={(date) => setNewMilestone({ ...newMilestone, dueDate: date })}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        onClick={handleAddMilestone}
                        disabled={!newMilestone.title.trim()}
                        className="w-full"
                        data-testid="button-add-milestone"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Milestone
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Milestones List */}
                  {milestones.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ListChecks className="h-4 w-4" />
                          Your Milestones ({milestones.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {milestones.map((milestone, index) => (
                            <div
                              key={index}
                              className="flex items-start justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{milestone.title}</p>
                                {milestone.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                                )}
                                {milestone.dueDate && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Due: {format(milestone.dueDate, "PPP")}
                                  </p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMilestone(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentStep === 0 ? (
                  <Button type="button" onClick={handleNextStep}>
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : currentStep < totalSteps - 1 ? (
                  <Button type="button" onClick={handleNextStep}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" data-testid="button-create-goal">
                    <Check className="mr-2 h-4 w-4" />
                    Create Goal
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Goal Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Your SMART goal has been created{milestones.length > 0 ? ` with ${milestones.length} milestone${milestones.length !== 1 ? "s" : ""}` : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Goal Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-bold text-lg">{form.getValues("title")}</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><strong>Specific:</strong> {form.getValues("specific").substring(0, 100)}...</p>
                  {form.getValues("deadline") && (
                    <p><strong>Deadline:</strong> {format(form.getValues("deadline")!, "PPP")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={handleReset}>
              Create Another Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
