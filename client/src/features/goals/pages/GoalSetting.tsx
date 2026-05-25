import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import useActiveUser from "@/hooks/use-active-user";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import SmartGoalWizard from "@/features/goals/components/SmartGoalWizard";
import GoalInsights from "@/features/goals/components/GoalInsights";
import GoalCard from "@/features/goals/components/GoalCard";
import GoalForm, { goalSchema, GoalFormValues, milestoneSchema, MilestoneFormValues } from "@/features/goals/components/GoalForm";
import MilestoneList from "@/features/goals/components/MilestoneList";
import type { Goal, Milestone, MilestoneProgress } from "@/features/goals/types";
import {
  useGoals,
  useAllMilestones,
  useGoalMilestones,
  useCreateGoal,
  useCreateMilestone,
  useUpdateGoalStatus,
  useToggleMilestoneCompletion,
} from "@/features/goals/hooks/useGoals";

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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PlusCircle, Calendar as CalendarIcon, CheckCircle, Clock, Flag, HelpCircle, Target, TrendingUp, MoreVertical, Sparkles, BarChart3, MessageSquare } from "lucide-react";
import { useLocalization, DynamicTranslator } from "@/lib/localize";

export default function GoalSetting() {
  const { user } = useAuth();
  const { t, currentLanguage } = useLocalization();
  const { activeUserId, apiPath } = useActiveUser();
  const queryClient = useQueryClient();
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const [reflectionInsights, setReflectionInsights] = useState<string | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');

  const defaultTab = tabParam === 'insights'
    ? "insights"
    : tabParam === 'goals'
      ? "goals"
      : tabParam === 'set'
        ? "set"
        : (user?.role === 'therapist' || user?.role === 'admin') ? "goals" : "set";

  const [activeTab, setActiveTab] = useState(defaultTab);

  const { data: goals = [], isLoading, error } = useGoals(apiPath, activeUserId);

  const { data: allMilestones = [] } = useAllMilestones(apiPath, activeUserId, goals.length);

  const { data: milestones = [], isLoading: milestonesLoading } = useGoalMilestones(
    selectedGoal?.id,
  );

  const getMilestoneProgress = (goalId: number): MilestoneProgress => {
    const goalMilestones = allMilestones.filter((m: Milestone) => m.goalId === goalId);
    if (goalMilestones.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const completed = goalMilestones.filter((m: Milestone) => m.isCompleted).length;
    const total = goalMilestones.length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  };

  const overallStats = {
    totalGoals: goals.length,
    completedGoals: goals.filter((g: Goal) => g.status === 'completed').length,
    inProgressGoals: goals.filter((g: Goal) => g.status === 'in_progress' || g.status === 'approved').length,
    pendingGoals: goals.filter((g: Goal) => g.status === 'pending').length,
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

  const createGoalMutation = useCreateGoal(apiPath);
  const createMilestoneMutation = useCreateMilestone(apiPath, selectedGoal?.id);
  const updateGoalStatusMutation = useUpdateGoalStatus(apiPath);
  const toggleMilestoneCompletionMutation = useToggleMilestoneCompletion(apiPath, selectedGoal?.id);

  const onSubmitGoal = (data: GoalFormValues) => {
    if (!user || !activeUserId) return;
    createGoalMutation.mutate(
      { data, userId: user.id as number, activeUserId },
      {
        onSuccess: () => {
          goalForm.reset();
          setIsCreatingGoal(false);
        },
      },
    );
  };

  const onSubmitMilestone = (data: MilestoneFormValues) => {
    createMilestoneMutation.mutate(data, {
      onSuccess: () => {
        milestoneForm.reset();
        setIsAddingMilestone(false);
      },
    });
  };

  const getStatusBadge = (status: string, size: 'sm' | 'lg' = 'sm') => {
    const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className={`bg-yellow-100 text-yellow-800 hover:bg-yellow-100 ${sizeClasses}`}>
            <Clock className="h-3 w-3 me-1" />
            {t("Pending")}
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className={`bg-blue-100 text-blue-800 hover:bg-blue-100 ${sizeClasses}`}>
            <TrendingUp className="h-3 w-3 me-1" />
            {t("In Progress")}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className={`bg-teal-100 text-teal-800 hover:bg-teal-100 ${sizeClasses}`}>
            <CheckCircle className="h-3 w-3 me-1" />
            {t("Approved")}
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className={`bg-green-100 text-green-800 hover:bg-green-100 ${sizeClasses}`}>
            <CheckCircle className="h-3 w-3 me-1" />
            {t("Completed")}
          </Badge>
        );
      default:
        return <Badge variant="outline" className={sizeClasses}>{t(status)}</Badge>;
    }
  };

  const isSetTab = activeTab === "set";
  const showStats = goals.length > 0;

  return (
    <AppLayout title={t("Smart Goals")}>
      <div className="min-h-screen bg-slate-50">
        {/* Premium Hero Banner */}
        <div className="-mx-2 sm:-mx-4 bg-gradient-to-br from-slate-800 via-teal-900 to-teal-700 px-6 sm:px-10 pt-8 pb-10 relative overflow-hidden transition-all duration-300">
          <div className="absolute -top-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-12 w-52 h-52 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-5xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-teal-300" />
                  <span className="text-teal-300/80 text-xs font-bold tracking-widest uppercase">
                    {t("Personal Growth")}
                  </span>
                </div>
                <h1 className="font-bold text-white tracking-tight text-3xl md:text-4xl mb-2">
                  {t("Smart Goals")}
                </h1>
                <p className="text-teal-100/70 text-base max-w-md leading-relaxed">
                  {t("Set structured SMART goals to track your progress and celebrate achievements")}
                </p>
              </div>
              
              {showStats && (
                <div className="flex items-center gap-6 shrink-0 flex-wrap">
                  {[
                    { value: overallStats.totalGoals, label: t("Total Goals") },
                    { value: overallStats.completedGoals, label: t("Completed"), color: "text-emerald-400" },
                    { value: overallStats.inProgressGoals, label: t("In Progress"), color: "text-teal-300" },
                    { value: overallStats.pendingGoals, label: t("Pending"), color: "text-amber-400" },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className={cn("text-2xl font-bold", s.color || "text-white")}>{s.value}</div>
                      <div className="text-xs text-teal-300/80 font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Goal Achievement strip */}
            <div className="mt-6 bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-teal-200 uppercase tracking-widest">{t("Goal Achievement")}</span>
                </div>
                <span className="text-xs text-teal-300">{overallStats.completedGoals} {t("of")} {overallStats.totalGoals} {t("completed")}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-sky-400 rounded-full transition-all duration-700" style={{ width: `${overallStats.totalGoals > 0 ? Math.round((overallStats.completedGoals / overallStats.totalGoals) * 100) : 0}%` }} />
              </div>
              <p className="text-[11px] text-teal-300/60 mt-1.5">{t("Breaking big goals into milestones makes achievement feel attainable and sustainable.")}</p>
            </div>
          </div>
        </div>

        {/* Main Body Layout */}
        <div className="max-w-5xl mx-auto pb-10 pt-6 space-y-5">
          {/* Goal form dialog for manual additions if needed */}
          {user?.role === 'client' && (
            <GoalForm
              open={isCreatingGoal}
              onOpenChange={setIsCreatingGoal}
              form={goalForm}
              onSubmit={onSubmitGoal}
              isPending={createGoalMutation.isPending}
              reflectionInsights={reflectionInsights}
            />
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-5"
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5">
              <TabsList className="w-full h-auto bg-transparent p-0 gap-1 flex flex-wrap">
                {user?.role === 'client' && (
                  <TabsTrigger
                    value="set"
                    className={cn(
                      "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                      "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                      "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                    )}
                  >
                    <PlusCircle className="h-4 w-4 me-1.5 inline" />
                    {t("Set Goal")}
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="goals"
                  className={cn(
                    "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <Target className="h-4 w-4 me-1.5 inline" />
                  {user?.role === 'therapist' || user?.role === 'admin' ? t("Client's Goals") : t("My Goals")}
                </TabsTrigger>
                <TabsTrigger
                  value="insights"
                  className={cn(
                    "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <TrendingUp className="h-4 w-4 me-1.5 inline" />
                  {t("Insights")}
                </TabsTrigger>
              </TabsList>
            </div>

            {user?.role === 'client' && (
              <TabsContent value="set" className="mt-0">
                <SmartGoalWizard onGoalCreated={() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/users/${activeUserId}/goals`] });
                  setActiveTab("goals");
                }} />
              </TabsContent>
            )}

            <TabsContent value="goals" className="space-y-4 mt-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : error ? (
                <div className="bg-destructive/10 p-4 rounded-md text-center">
                  <p className="text-destructive font-medium">{t("Error loading goals")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("Please try again later")}</p>
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <h3 className="font-medium text-lg">{t("No Goals Yet")}</h3>
                  <p className="text-muted-foreground mt-1">
                    {user?.role === 'client'
                      ? t("Create your first goal to start tracking your progress.")
                      : t("Your client hasn't created any goals yet.")}
                  </p>
                  {user?.role === 'client' && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsCreatingGoal(true)}
                    >
                      <PlusCircle className="h-4 w-4 me-2" />
                      {t("Create Your First Goal")}
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
                <DialogContent dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'} aria-describedby={undefined} className={cn("max-w-5xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-0", currentLanguage === 'ar' && "rtl text-right")}>
                  <DialogTitle className="sr-only">{t("Goal Details")}</DialogTitle>
                  {/* ── Luxury Header ── */}
                  <div
                    className="relative overflow-hidden px-7 py-5"
                    style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)' }}
                  >
                    <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-indigo-700/15 blur-2xl pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shrink-0 mt-0.5">
                          <Target className="h-5 w-5 text-teal-100" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold text-white tracking-tight leading-tight"><DynamicTranslator text={selectedGoal?.title || ""} /></h2>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {getStatusBadge(selectedGoal?.status || 'pending', 'lg')}
                            {selectedGoal?.deadline && (
                              <span className="inline-flex items-center text-xs text-teal-100/80 gap-1">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {t("Target:")} {format(parseISO(selectedGoal?.deadline), "MMM d, yyyy")}
                              </span>
                            )}
                            {(() => {
                              const progress = getMilestoneProgress(selectedGoal?.id || 0);
                              return progress.total > 0 ? (
                                <span className="inline-flex items-center text-xs text-emerald-400 gap-1">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  {progress.completed}/{progress.total} {t("milestones")}
                                </span>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Body ── */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                      {/* Left column — SMART Breakdown */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">{t("SMART Breakdown")}</h3>
                        <div className="space-y-3">

                          {/* Specific */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0">
                                <Target className="h-3.5 w-3.5 text-teal-700" />
                              </div>
                              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">{t("S — Specific")}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed"><DynamicTranslator text={selectedGoal?.specific || ""} /></p>
                          </div>

                          {/* Measurable */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                                <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                              </div>
                              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t("M — Measurable")}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed"><DynamicTranslator text={selectedGoal?.measurable || ""} /></p>
                          </div>

                          {/* Achievable */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                              </div>
                              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{t("A — Achievable")}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed"><DynamicTranslator text={selectedGoal?.achievable || ""} /></p>
                          </div>

                          {/* Relevant */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                              </div>
                              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">{t("R — Relevant")}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed"><DynamicTranslator text={selectedGoal?.relevant || ""} /></p>
                          </div>

                          {/* Time-bound */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                                <Clock className="h-3.5 w-3.5 text-rose-600" />
                              </div>
                              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">{t("T — Time-bound")}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed"><DynamicTranslator text={selectedGoal?.timebound || ""} /></p>
                          </div>

                        </div>

                        {/* Therapist Feedback */}
                        {selectedGoal?.therapistComments && (
                          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                                <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                              </div>
                              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{t("Therapist Feedback")}</span>
                            </div>
                            <p className="text-sm italic text-indigo-800 leading-relaxed"><DynamicTranslator text={selectedGoal.therapistComments} /></p>
                          </div>
                        )}
                      </div>

                      {/* Right column — Milestones (unchanged) */}
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
                  </div>
                </DialogContent>
              </Dialog>

              {/* Add Milestone Dialog */}
              <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
                <DialogContent dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'} aria-describedby={undefined} className={cn("max-w-md p-0 rounded-2xl border-0 overflow-hidden", currentLanguage === 'ar' && "rtl text-right")}>
                  <DialogTitle className="sr-only">{t("Add Milestone")}</DialogTitle>

                  {/* Dark gradient header */}
                  <div
                    className="relative overflow-hidden px-7 py-5"
                    style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)" }}
                  >
                    <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-indigo-700/15 blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shrink-0">
                        <Flag className="h-5 w-5 text-teal-100" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-tight leading-tight">{t("Add Milestone")}</h2>
                        <p className="text-teal-100/80 text-xs mt-0.5 font-medium">
                          {t("Break your goal into smaller, achievable steps")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form body */}
                  <Form {...milestoneForm}>
                    <form onSubmit={milestoneForm.handleSubmit(onSubmitMilestone)}>
                      <div className="px-7 py-6 space-y-5 bg-white">

                        <FormField
                          control={milestoneForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {t("Milestone Title")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t("e.g. Complete first chapter…")}
                                  className="rounded-xl border-slate-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 bg-slate-50/60 h-11"
                                  {...field}
                                />
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
                              <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {t("Description")} <span className="text-slate-400 normal-case font-normal">({t("optional")})</span>
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={t("Add details about this milestone…")}
                                  rows={3}
                                  className="rounded-xl border-slate-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 bg-slate-50/60 resize-none"
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
                              <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {t("Due Date")} <span className="text-slate-400 normal-case font-normal">({t("optional")})</span>
                              </FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-start font-normal rounded-xl border-slate-200 bg-slate-50/60 hover:bg-slate-100 h-11",
                                        !field.value && "text-slate-400"
                                      )}
                                    >
                                      <CalendarIcon className="me-2 h-4 w-4 text-teal-600" />
                                      {field.value
                                        ? format(parseISO(field.value), "PPP")
                                        : t("Pick a date")}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? parseISO(field.value) : undefined}
                                    onSelect={(date) =>
                                      field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                                    }
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-end gap-2.5 px-7 py-4 border-t border-slate-100 bg-white">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddingMilestone(false)}
                          className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-9 px-5"
                        >
                          {t("Cancel")}
                        </Button>
                        <Button
                          type="submit"
                          disabled={createMilestoneMutation.isPending}
                          className="rounded-xl bg-teal-800 hover:bg-teal-700 text-white border-0 shadow-md h-9 px-5 gap-2"
                        >
                          {createMilestoneMutation.isPending ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {t("Adding…")}
                            </>
                          ) : (
                            <>
                              <Flag className="h-4 w-4 me-2" />
                              {t("Add Milestone")}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>

                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="insights" className="mt-0">
              {activeUserId && <GoalInsights userId={activeUserId} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
