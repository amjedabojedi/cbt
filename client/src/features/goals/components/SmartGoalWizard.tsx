import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useActiveUser from "@/hooks/use-active-user";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import WizardProgressHeader from "@/features/journal/components/wizard/WizardProgressHeader";
import WizardNavButtons from "@/features/journal/components/wizard/WizardNavButtons";
import { Calendar } from "@/components/ui/calendar";
import {
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
import { useLocalization } from "@/lib/localize";

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
  const { t, currentLanguage } = useLocalization();
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
      const goalResponse = await apiRequest("POST", `/api/users/${activeUserId}/goals`, {
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
            apiRequest("POST", `/api/goals/${goal.id}/milestones`, {
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

  return (
    <>
      <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white" dir={currentLanguage === "ar" ? "rtl" : "ltr"}>
        <WizardProgressHeader
          title={t("SMART Goal Wizard")}
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={[t("Title"), t("Specific"), t("Measurable"), t("Achievable"), t("Relevant"), t("Time-bound"), t("Milestones")]}
        />

        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Intro Step */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="inline-flex p-3 rounded-full bg-purple-50 text-purple-600 mb-3">
                      <Target className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#090514] mb-2">{t("Welcome to SMART Goal Setting")}</h2>
                    <p className="text-slate-600 text-base max-w-2xl mx-auto">
                      {t("SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound. This framework helps you create clear, actionable goals that you can actually achieve.")}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
                      {[
                        { title: t("Specific"), desc: t("Clear, precise and well-defined roadmap"), icon: Target, color: "text-purple-600 bg-purple-50" },
                        { title: t("Measurable"), desc: t("Concrete metrics to track your daily progress"), icon: Ruler, color: "text-indigo-600 bg-indigo-50" },
                        { title: t("Achievable"), desc: t("Realistic and attainable within your reach"), icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
                        { title: t("Relevant"), desc: t("Aligned with your life values and core priorities"), icon: LinkIcon, color: "text-amber-600 bg-amber-50" },
                        { title: t("Time-bound"), desc: t("Set clear target deadlines to maintain focus"), icon: Clock, color: "text-rose-600 bg-rose-50" },
                      ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <Card key={idx} className="h-full flex flex-col border border-slate-100 hover:border-purple-200 transition-all duration-300 shadow-sm hover:shadow-md">
                            <CardHeader className="pb-2 pt-4 px-3 flex flex-col items-center text-center">
                              <div className={cn("p-2 rounded-xl mb-2", item.color)}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <CardTitle className="text-base font-bold text-[#090514]">
                                {item.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-4 pt-1 flex-1 flex flex-col justify-center text-center">
                              <p className="text-sm font-medium text-slate-600 leading-snug">
                                {item.desc}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Title */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="md:col-span-2 bg-purple-50/50 p-5 rounded-2xl border border-purple-100/80 flex flex-col justify-center">
                    <div className="inline-flex p-2.5 rounded-xl bg-purple-100 text-purple-700 w-fit mb-3">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base text-[#090514] mb-2">
                      {t("Start with a Clear Vision")}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {t("Give your goal a memorable title that captures what you want to achieve. This will help you stay focused and motivated.")}
                    </p>
                  </div>

                  <div className="md:col-span-3 flex flex-col justify-center space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-[#090514] flex items-center gap-2">
                            {t("Goal Title")} <span className="text-red-500 text-sm">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("e.g., Run a 5K Marathon, Learn Spanish, Save $5000...")}
                              className="text-base bg-white border-slate-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl py-5"
                              voiceInput
                              {...field}
                              data-testid="input-goal-title"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">
                            {t("A clear, motivating title for your goal (at least 5 characters)")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Specific */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="md:col-span-2 bg-purple-50/50 p-5 rounded-2xl border border-purple-100/80 flex flex-col justify-center">
                    <div className="inline-flex p-2.5 rounded-xl bg-purple-100 text-purple-700 w-fit mb-3">
                      <Target className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base text-[#090514] mb-2">
                      {t("Be Specific")}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">
                      {t("Define exactly what you want to accomplish. Answer: What will I do? How will I do it? Where? With whom?")}
                    </p>
                    <div className="bg-white/80 p-3 rounded-xl border border-purple-100">
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block mb-1">{t("Example")}</span>
                      <p className="text-xs italic text-slate-600">
                        {t('"I will exercise 3 times per week at the gym" instead of "I want to be healthier"')}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex flex-col justify-center space-y-4">
                    <FormField
                      control={form.control}
                      name="specific"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-[#090514] flex items-center gap-2">
                            {t("What Specifically Will You Do?")} <span className="text-red-500 text-sm">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              value={watchedValues.specific}
                              onChange={(e) => form.setValue("specific", e.target.value)}
                              placeholder={t("Describe your goal in detail. What exactly will you accomplish? Be as specific as possible...")}
                              className="resize-none min-h-[110px] text-base bg-white border-slate-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                              data-testid="textarea-goal-specific"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">
                            {t("Be detailed and clear about what you'll do (at least 20 characters)")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Measurable */}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="md:col-span-2 bg-purple-50/50 p-5 rounded-2xl border border-purple-100/80 flex flex-col justify-center">
                    <div className="inline-flex p-2.5 rounded-xl bg-purple-100 text-purple-700 w-fit mb-3">
                      <Ruler className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base text-[#090514] mb-2">
                      {t("Make It Measurable")}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">
                      {t("How will you know when you've achieved your goal? Define concrete criteria to track your progress.")}
                    </p>
                    <div className="bg-white/80 p-3 rounded-xl border border-purple-100">
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block mb-1">{t("Example")}</span>
                      <p className="text-xs italic text-slate-600">
                        {t('"Complete 12 workout sessions" or "Save $100 per week"')}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex flex-col justify-center space-y-4">
                    <FormField
                      control={form.control}
                      name="measurable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-[#090514] flex items-center gap-2">
                            {t("How Will You Measure Progress?")} <span className="text-red-500 text-sm">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              value={watchedValues.measurable}
                              onChange={(e) => form.setValue("measurable", e.target.value)}
                              placeholder={t("What metrics or milestones will show your progress? How will you know you've succeeded?")}
                              className="resize-none min-h-[110px] text-base bg-white border-slate-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                              data-testid="textarea-goal-measurable"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">
                            {t("Define clear metrics to track progress (at least 20 characters)")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Achievable */}
              {currentStep === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="md:col-span-2 bg-purple-50/50 p-5 rounded-2xl border border-purple-100/80 flex flex-col justify-center">
                    <div className="inline-flex p-2.5 rounded-xl bg-purple-100 text-purple-700 w-fit mb-3">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base text-[#090514] mb-2">
                      {t("Keep It Achievable")}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">
                      {t("Is this goal realistic given your current resources, skills, and time? Challenge yourself, but stay practical.")}
                    </p>
                    <div className="bg-white/80 p-3 rounded-xl border border-purple-100">
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block mb-1">{t("Example")}</span>
                      <p className="text-xs italic text-slate-600">
                        {t('"I have gym membership and can commit 3 hours/week"')}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex flex-col justify-center space-y-4">
                    <FormField
                      control={form.control}
                      name="achievable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-[#090514] flex items-center gap-2">
                            {t("Why Is This Achievable?")} <span className="text-red-500 text-sm">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              value={watchedValues.achievable}
                              onChange={(e) => form.setValue("achievable", e.target.value)}
                              placeholder={t("What resources, skills, or support do you have? What makes this goal realistic for you?")}
                              className="resize-none min-h-[110px] text-base bg-white border-slate-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                              data-testid="textarea-goal-achievable"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">
                            {t("Explain why this goal is realistic for you (at least 20 characters)")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Relevant */}
              {currentStep === 5 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="md:col-span-2 bg-purple-50/50 p-5 rounded-2xl border border-purple-100/80 flex flex-col justify-center">
                    <div className="inline-flex p-2.5 rounded-xl bg-purple-100 text-purple-700 w-fit mb-3">
                      <LinkIcon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base text-[#090514] mb-2">
                      {t("Make It Relevant")}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">
                      {t("Why does this goal matter to you? How does it align with your values and life priorities?")}
                    </p>
                    <div className="bg-white/80 p-3 rounded-xl border border-purple-100">
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block mb-1">{t("Example")}</span>
                      <p className="text-xs italic text-slate-600">
                        {t('"Better health will give me energy to play with my kids"')}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex flex-col justify-center space-y-4">
                    <FormField
                      control={form.control}
                      name="relevant"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-[#090514] flex items-center gap-2">
                            {t("Why Does This Matter to You?")} <span className="text-red-500 text-sm">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              value={watchedValues.relevant}
                              onChange={(e) => form.setValue("relevant", e.target.value)}
                              placeholder={t("How will achieving this goal improve your life? Why is it important to you right now?")}
                              className="resize-none min-h-[110px] text-base bg-white border-slate-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                              data-testid="textarea-goal-relevant"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">
                            {t("Explain the personal meaning behind this goal (at least 20 characters)")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Time-bound */}
              {currentStep === 6 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="md:col-span-2 bg-purple-50/50 p-5 rounded-2xl border border-purple-100/80 flex flex-col justify-center">
                    <div className="inline-flex p-2.5 rounded-xl bg-purple-100 text-purple-700 w-fit mb-3">
                      <Clock className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base text-[#090514] mb-2">
                      {t("Set a Timeline")}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">
                      {t("When will you achieve this goal? A deadline creates urgency and helps you stay on track.")}
                    </p>
                    <div className="bg-white/80 p-3 rounded-xl border border-purple-100">
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block mb-1">{t("Example")}</span>
                      <p className="text-xs italic text-slate-600">
                        {t('"Complete within 3 months, tracking weekly milestones"')}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex flex-col justify-center space-y-4">
                    <FormField
                      control={form.control}
                      name="timebound"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-[#090514] flex items-center gap-2">
                            {t("What's Your Timeframe?")} <span className="text-red-500 text-sm">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              value={watchedValues.timebound}
                              onChange={(e) => form.setValue("timebound", e.target.value)}
                              placeholder={t("By when will you achieve this? Describe your timeline...")}
                              className="resize-none min-h-[90px] text-base bg-white border-slate-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                              data-testid="textarea-goal-timebound"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">
                            {t("Specify when you'll complete this goal (at least 10 characters)")}
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
                          <FormLabel className="text-base font-bold text-[#090514]">{t("Target Deadline (Optional)")}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-start font-normal bg-white border-slate-200 hover:bg-slate-50 rounded-xl"
                                  data-testid="button-select-deadline"
                                >
                                  <CalendarIcon className="me-2 h-4 w-4 text-purple-500" />
                                  {field.value ? format(field.value, "PPP") : <span>{t("Pick a date")}</span>}
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
                          <FormDescription className="text-xs text-slate-400">
                            {t("Optional: Select a specific target date")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 7: Milestones */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Form */}
                    <div className="space-y-4">
                      <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                        <h3 className="font-bold text-sm text-[#090514] mb-1 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-purple-600" />
                          {t("Break It Down")}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {t("Milestones are smaller checkpoints that help you track progress toward your main goal.")}
                        </p>
                      </div>

                      {/* Add Milestone Form */}
                      <Card className="border border-slate-100 shadow-sm">
                        <CardHeader className="pb-3 pt-4">
                          <CardTitle className="text-sm font-bold text-[#090514] flex items-center gap-2">
                            <Plus className="h-4 w-4 text-purple-600" />
                            {t("Add Milestone")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-4">
                          <Input
                            placeholder={t("Milestone title")}
                            value={newMilestone.title}
                            onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl"
                            data-testid="input-milestone-title"
                          />
                          <Textarea
                            placeholder={t("Description (optional)")}
                            value={newMilestone.description}
                            onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                            className="resize-none bg-white border-slate-200 rounded-xl"
                            rows={2}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start text-start font-normal bg-white border-slate-200 hover:bg-slate-50 rounded-xl text-xs">
                                  <CalendarIcon className="me-1.5 h-3.5 w-3.5 text-purple-500" />
                                  {newMilestone.dueDate ? format(newMilestone.dueDate, "MMM d") : <span>{t("Due date")}</span>}
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
                              className="w-full bg-[#090514] hover:bg-purple-950 text-white rounded-xl text-xs"
                              data-testid="button-add-milestone"
                            >
                              <Plus className="me-1.5 h-3.5 w-3.5" />
                              {t("Add")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column: List */}
                    <div className="flex flex-col h-full justify-between">
                      <Card className="border border-slate-100 shadow-sm flex-1 flex flex-col min-h-[300px]">
                        <CardHeader className="pb-3 pt-4">
                          <CardTitle className="text-sm font-bold text-[#090514] flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-purple-600" />
                            {t("Your Milestones")} ({milestones.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                          {milestones.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                              <ListChecks className="h-8 w-8 text-slate-300 mb-2" />
                              <p className="text-xs font-semibold text-slate-500">{t("No Milestones Added Yet")}</p>
                              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                                {t("Add checkpoints on the left to break down your main goal.")}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                              {milestones.map((milestone, index) => (
                                <div
                                  key={index}
                                  className="flex items-start justify-between p-3 bg-slate-50 border border-slate-100 hover:border-purple-100 rounded-xl transition-all duration-200"
                                >
                                  <div className="flex-1 min-w-0 pr-2">
                                    <p className="font-semibold text-sm text-[#090514] truncate">{milestone.title}</p>
                                    {milestone.description && (
                                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{milestone.description}</p>
                                    )}
                                    {milestone.dueDate && (
                                      <p className="text-[10px] text-purple-600 font-medium mt-1 inline-flex items-center">
                                        <CalendarIcon className="h-3 w-3 me-1" />
                                        {t("Due:")} {format(milestone.dueDate, "MMM d, yyyy")}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveMilestone(index)}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              <WizardNavButtons
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={handlePreviousStep}
                onNext={handleNextStep}
                onSubmit={() => form.handleSubmit(onSubmit)()}
                nextLabel={t("Next")}
                submitLabel={t("Create Goal")}
                nextButtonClassName="bg-[#090514] hover:bg-purple-950 text-white rounded-xl"
                submitButtonClassName="bg-[#090514] hover:bg-purple-950 text-white rounded-xl"
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        setShowSuccessDialog(open);
        if (!open) {
          handleReset();
        }
      }}>
        <DialogContent dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'} className={cn("sm:max-w-md", currentLanguage === 'ar' && "rtl text-right")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600 text-xl font-bold">
              <Check className="h-6 w-6 bg-purple-50 p-1 rounded-full text-purple-600" />
              {t("Goal Created Successfully!")}
            </DialogTitle>
            <DialogDescription>
              {t("Your SMART goal has been created")} {milestones.length > 0 ? `${t("with")} ${milestones.length} ${t(milestones.length !== 1 ? "milestones" : "milestone")}` : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="border border-slate-100 shadow-sm bg-slate-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t("Goal Summary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-bold text-lg text-[#090514]">{form.getValues("title")}</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p><strong>{t("Specific:")}</strong> {form.getValues("specific") ? form.getValues("specific").substring(0, 100) : ""}...</p>
                  {form.getValues("deadline") && (
                    <p><strong>{t("Deadline:")}</strong> {format(form.getValues("deadline")!, "PPP")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={handleReset} className="w-full bg-[#090514] hover:bg-purple-950 text-white rounded-xl">
              {t("Create Another Goal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
