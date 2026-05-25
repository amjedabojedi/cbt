import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThoughtRecord } from "@shared/schema";
import useActiveUser from "@/hooks/use-active-user";
import {
  Brain,
  CheckCircle2,
  Lightbulb,
  AlertCircle,
  X,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  Scale,
  TrendingDown,
  TrendingUp,
  Quote,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

// Form schema
const challengeSchema = z.object({
  evidenceFor: z.string().min(10, "Please provide at least 10 characters"),
  evidenceAgainst: z.string().min(10, "Please provide at least 10 characters"),
  alternativeThought: z.string().min(10, "Please provide at least 10 characters"),
  beliefInOriginal: z.number().min(0).max(100),
  beliefInAlternative: z.number().min(0).max(100),
});

type ChallengeFormValues = z.infer<typeof challengeSchema>;

interface ThoughtChallengeWizardProps {
  thoughtRecord: ThoughtRecord;
  onComplete: () => void;
  onCancel: () => void;
  open?: boolean;
}

// Step labels for progress indicator
const STEP_LABELS = ["Evidence", "Alternative", "Beliefs"];
const STEP_ICONS = [Scale, Lightbulb, Brain];

export function ThoughtChallengeWizard({
  thoughtRecord,
  onComplete,
  onCancel,
  open,
}: ThoughtChallengeWizardProps) {
  const { user } = useAuth();
  const { activeUserId } = useActiveUser();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const totalSteps = 3;

  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      evidenceFor: "",
      evidenceAgainst: "",
      alternativeThought: "",
      beliefInOriginal: 50,
      beliefInAlternative: 50,
    },
  });

  const watchedValues = form.watch();
  const progress = currentStep === 0 ? 0 : (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    let isValid = true;
    if (currentStep === 1) {
      isValid = await form.trigger(["evidenceFor", "evidenceAgainst"]);
    } else if (currentStep === 2) {
      isValid = await form.trigger("alternativeThought");
    }
    if (isValid) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: ChallengeFormValues) => {
    try {
      if (!activeUserId || !thoughtRecord.id) {
        toast({ title: "Error", description: "Missing required information", variant: "destructive" });
        return;
      }
      const updateData = {
        evidenceFor: data.evidenceFor,
        evidenceAgainst: data.evidenceAgainst,
        alternativePerspective: data.alternativeThought,
        reflectionRating: Math.round((data.beliefInAlternative / 100) * 10),
      };
      await apiRequest("PATCH", `/api/users/${activeUserId}/thoughts/${thoughtRecord.id}`, updateData);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${activeUserId}/thoughts`] });
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error saving challenge:", error);
      toast({ title: "Error", description: "Failed to save your thought challenge. Please try again.", variant: "destructive" });
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    form.reset();
    setCurrentStep(0);
    onComplete();
  };

  const handleSkip = () => {
    form.reset();
    setCurrentStep(0);
    onCancel();
  };

  // ─── Luxury Header ───────────────────────────────────────────────────────────
  const LuxuryHeader = () => (
    <div
      className="relative overflow-hidden rounded-t-2xl px-7 py-5"
      style={{ background: "linear-gradient(135deg, #090514 0%, #1a0838 50%, #0c071a 100%)" }}
    >
      {/* Glowing orb backdrops */}
      <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-purple-600/25 blur-3xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-indigo-700/20 blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-16 rounded-full bg-violet-800/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Icon orb */}
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-purple-900/40 shrink-0">
            <Brain className="h-5 w-5 text-purple-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
              Challenge Your Thought
            </h2>
            <p className="text-purple-300/80 text-xs mt-0.5 font-medium">
              {currentStep === 0
                ? "CBT Technique • Guided Walkthrough"
                : `Step ${currentStep} of ${totalSteps} · ${STEP_LABELS[currentStep - 1]}`}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/25 flex items-center justify-center transition-all duration-200 shrink-0 mt-0.5"
        >
          <X className="h-4 w-4 text-white/70" />
        </button>
      </div>

      {/* Progress stepper - only shown after intro */}
      {currentStep > 0 && (
        <div className="relative z-10 mt-5">
          {/* Progress track */}
          <div className="flex items-center gap-0">
            {STEP_LABELS.map((label, idx) => {
              const stepNum = idx + 1;
              const isCompleted = currentStep > stepNum;
              const isActive = currentStep === stepNum;
              const StepIcon = STEP_ICONS[idx];

              return (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                          : isActive
                          ? "bg-purple-500 shadow-lg shadow-purple-500/40 ring-2 ring-purple-400/40 ring-offset-1 ring-offset-transparent"
                          : "bg-white/10 border border-white/20"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : (
                        <StepIcon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-white/40"}`} />
                      )}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium tracking-wide transition-colors ${
                        isActive ? "text-purple-300" : isCompleted ? "text-emerald-400" : "text-white/30"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < STEP_LABELS.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-2 mb-4 transition-all duration-500 ${
                        isCompleted ? "bg-emerald-500/60" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Step 0: Intro ────────────────────────────────────────────────────────────
  const StepIntro = () => (
    <div className="p-6 space-y-0" data-testid="step-intro">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: Educational content */}
        <div className="space-y-3">
          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-purple-50/40 border border-purple-100/80 p-4">
            <div className="flex items-start gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight mt-1">
                What is Thought Challenging?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-9">
              A core CBT technique that helps you examine whether your automatic thoughts are accurate, helpful, and based on facts — not fears or assumptions.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            {[
              { icon: TrendingDown, label: "Reduce Emotional Distress", desc: "Negative thoughts lose their grip when examined objectively", color: "text-rose-500", bg: "bg-rose-50" },
              { icon: Scale, label: "See the Bigger Picture", desc: "Find overlooked evidence and balanced explanations", color: "text-indigo-500", bg: "bg-indigo-50" },
              { icon: TrendingUp, label: "Build Balanced Alternatives", desc: "Craft realistic, evidence-based replacement thoughts", color: "text-emerald-500", bg: "bg-emerald-50" },
            ].map(({ icon: Icon, label, desc, color, bg }) => (
              <div key={label} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white p-3 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
                <div className={`w-6 h-6 rounded-md ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Automatic thought + instructions */}
        <div className="space-y-3 flex flex-col">
          {/* Auto thought callout */}
          <div
            className="rounded-xl p-4 border border-purple-900/20 flex-1"
            style={{ background: "linear-gradient(135deg, #1a0838/80 0%, #0c071a 100%)", backgroundColor: "#12082a" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Quote className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Your Automatic Thought
              </span>
            </div>
            <p className="text-sm text-white/90 italic leading-relaxed font-medium">
              "{thoughtRecord.automaticThoughts}"
            </p>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[11px] text-purple-400/80 leading-snug">
                We'll examine this step-by-step using evidence-based CBT techniques.
              </p>
            </div>
          </div>

          {/* Steps preview */}
          <div
            className="rounded-xl border border-purple-500/20 p-4"
            style={{ backgroundColor: "#0f0624" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Your 3-Step Journey
              </span>
            </div>
            <div className="space-y-2">
              {[
                { step: "01", label: "Examine Evidence", desc: "What supports or contradicts this thought?", color: "text-rose-400" },
                { step: "02", label: "Create Alternative", desc: "Craft a balanced, realistic perspective", color: "text-amber-400" },
                { step: "03", label: "Rate Beliefs", desc: "Measure how your belief shifts through CBT", color: "text-emerald-400" },
              ].map(({ step, label, desc, color }) => (
                <div key={step} className="flex items-start gap-2.5">
                  <span className={`text-[10px] font-black ${color} mt-0.5 tabular-nums w-5 shrink-0`}>{step}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-white/90">{label}</p>
                    <p className="text-[10px] text-purple-400/70">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1"
        >
          Skip for now
        </button>
        <Button
          type="button"
          onClick={() => setCurrentStep(1)}
          data-testid="button-start-challenge"
          className="rounded-xl px-6 text-sm font-semibold h-9 gap-2"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
        >
          Start Challenge
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // ─── Step 1: Evidence ─────────────────────────────────────────────────────────
  const StepEvidence = () => (
    <div className="p-6 space-y-4" data-testid="step-evidence">
      {/* Context bar */}
      <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5">
        <Quote className="h-3.5 w-3.5 text-purple-500 shrink-0" />
        <p className="text-xs text-slate-600 italic leading-snug flex-1 truncate">
          "{thoughtRecord.automaticThoughts}"
        </p>
      </div>

      {/* Side-by-side evidence collectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* For */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-rose-100 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-rose-600" />
            </div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Evidence Supporting
            </label>
          </div>
          <p className="text-[11px] text-slate-500 pl-6">What facts support this thought?</p>
          <div className="relative">
            <Textarea
              placeholder="e.g., My manager gave me critical feedback on my last report..."
              className="resize-none w-full text-sm rounded-xl border-rose-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30 bg-rose-50/30 min-h-[130px]"
              rows={5}
              value={watchedValues.evidenceFor || ""}
              onChange={(e) => form.setValue("evidenceFor", e.target.value, { shouldValidate: true })}
              data-testid="textarea-evidence-for"
            />
          </div>
          <div className="flex justify-between items-center">
            {form.formState.errors.evidenceFor && (
              <p className="text-rose-500 text-[11px]">{form.formState.errors.evidenceFor.message}</p>
            )}
            <span className={`text-[11px] ml-auto tabular-nums font-medium ${(watchedValues.evidenceFor || "").length < 10 ? "text-rose-500" : "text-emerald-600"}`}>
              {(watchedValues.evidenceFor || "").length}/10 min
            </span>
          </div>
        </div>

        {/* Against */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
              <TrendingDown className="h-3 w-3 text-emerald-600" />
            </div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Evidence Against
            </label>
          </div>
          <p className="text-[11px] text-slate-500 pl-6">What facts contradict this thought?</p>
          <div className="relative">
            <Textarea
              placeholder="e.g., I've received positive feedback before. My colleague praised my work last month..."
              className="resize-none w-full text-sm rounded-xl border-emerald-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 bg-emerald-50/30 min-h-[130px]"
              rows={5}
              value={watchedValues.evidenceAgainst || ""}
              onChange={(e) => form.setValue("evidenceAgainst", e.target.value, { shouldValidate: true })}
              data-testid="textarea-evidence-against"
            />
          </div>
          <div className="flex justify-between items-center">
            {form.formState.errors.evidenceAgainst && (
              <p className="text-rose-500 text-[11px]">{form.formState.errors.evidenceAgainst.message}</p>
            )}
            <span className={`text-[11px] ml-auto tabular-nums font-medium ${(watchedValues.evidenceAgainst || "").length < 10 ? "text-rose-500" : "text-emerald-600"}`}>
              {(watchedValues.evidenceAgainst || "").length}/10 min
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-1">
        <Button type="button" variant="outline" onClick={handlePrevious} className="rounded-xl h-9 text-xs gap-1.5">
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          data-testid="button-next-step"
          className="rounded-xl h-9 text-xs px-5 gap-1.5"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
        >
          Next Step <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  // ─── Step 2: Alternative Thought ──────────────────────────────────────────────
  const StepAlternative = () => (
    <div className="p-6 space-y-4" data-testid="step-alternative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: Case Summary */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Case Summary</p>

          {/* Original thought */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-4 h-4 rounded bg-rose-500 flex items-center justify-center">
                <AlertCircle className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">Original Thought</span>
            </div>
            <p className="text-xs text-rose-800 italic leading-relaxed">
              "{thoughtRecord.automaticThoughts}"
            </p>
          </div>

          {/* Evidence against */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Evidence Against</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {form.watch("evidenceAgainst") || "No evidence collected yet..."}
            </p>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1.5">CBT Tips</p>
            <ul className="space-y-1">
              {[
                "Consider all evidence, not just negatives",
                "\"What would I tell a friend in this situation?\"",
                "Find the middle ground — avoid black/white thinking",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-1.5">
                  <span className="text-indigo-400 text-[10px] mt-0.5">•</span>
                  <p className="text-[11px] text-indigo-700 leading-snug">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT: Alternative Thought Input */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center">
              <Lightbulb className="h-3 w-3 text-purple-600" />
            </div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Balanced Alternative
            </label>
          </div>
          <p className="text-[11px] text-slate-500 pl-6">Write a realistic thought that considers all evidence</p>
          <Textarea
            placeholder="e.g., While I got some critical feedback, I've also received positive recognition. One criticism doesn't define my competence — it shows areas where I can grow..."
            className="resize-none w-full text-sm rounded-xl border-purple-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 bg-purple-50/20 flex-1 min-h-[180px]"
            rows={7}
            value={watchedValues.alternativeThought || ""}
            onChange={(e) => form.setValue("alternativeThought", e.target.value, { shouldValidate: true })}
            data-testid="textarea-alternative"
          />
          <div className="flex justify-between items-center">
            {form.formState.errors.alternativeThought && (
              <p className="text-rose-500 text-[11px]">{form.formState.errors.alternativeThought.message}</p>
            )}
            <span className={`text-[11px] ml-auto tabular-nums font-medium ${(watchedValues.alternativeThought || "").length < 10 ? "text-rose-500" : "text-emerald-600"}`}>
              {(watchedValues.alternativeThought || "").length}/10 min
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-1">
        <Button type="button" variant="outline" onClick={handlePrevious} className="rounded-xl h-9 text-xs gap-1.5">
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          data-testid="button-next-step"
          className="rounded-xl h-9 text-xs px-5 gap-1.5"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
        >
          Next Step <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  // ─── Step 3: Rate Beliefs ────────────────────────────────────────────────────
  const StepBeliefs = () => {
    const original = watchedValues.beliefInOriginal ?? 50;
    const alternative = watchedValues.beliefInAlternative ?? 50;
    const shift = alternative - original;
    const isPositiveShift = shift >= 0;

    return (
      <div className="p-6 space-y-5" data-testid="step-beliefs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* LEFT: Original Thought Belief */}
          <FormField
            control={form.control}
            name="beliefInOriginal"
            render={({ field }) => (
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-rose-500 flex items-center justify-center">
                      <AlertCircle className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Original Thought</p>
                  </div>
                  <p className="text-[11px] text-rose-800 italic leading-snug pl-7">
                    "{thoughtRecord.automaticThoughts}"
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-600 mb-3">How much do you believe this now?</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
                      <span>Not at all</span>
                      <span>Completely</span>
                    </div>
                    <Slider
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      min={0}
                      max={100}
                      step={5}
                      className="h-2"
                      data-testid="slider-belief-original"
                    />
                    <div className="flex justify-center">
                      <div
                        className="px-5 py-2 rounded-full text-white text-xl font-black shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${field.value > 60 ? "#ef4444" : field.value > 30 ? "#f59e0b" : "#10b981"} 0%, ${field.value > 60 ? "#dc2626" : field.value > 30 ? "#d97706" : "#059669"} 100%)`,
                        }}
                      >
                        {field.value}%
                      </div>
                    </div>
                  </div>
                </div>
                <FormMessage />
              </div>
            )}
          />

          {/* RIGHT: Alternative Thought Belief */}
          <FormField
            control={form.control}
            name="beliefInAlternative"
            render={({ field }) => (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
                      <Lightbulb className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Alternative Thought</p>
                  </div>
                  <p className="text-[11px] text-emerald-800 italic leading-snug pl-7">
                    "{form.watch("alternativeThought") || "Your alternative thought..."}"
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-600 mb-3">How much do you believe this?</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
                      <span>Not at all</span>
                      <span>Completely</span>
                    </div>
                    <Slider
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      min={0}
                      max={100}
                      step={5}
                      className="h-2"
                      data-testid="slider-belief-alternative"
                    />
                    <div className="flex justify-center">
                      <div
                        className="px-5 py-2 rounded-full text-white text-xl font-black shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${field.value > 60 ? "#10b981" : field.value > 30 ? "#f59e0b" : "#ef4444"} 0%, ${field.value > 60 ? "#059669" : field.value > 30 ? "#d97706" : "#dc2626"} 100%)`,
                        }}
                      >
                        {field.value}%
                      </div>
                    </div>
                  </div>
                </div>
                <FormMessage />
              </div>
            )}
          />
        </div>

        {/* Cognitive Shift Indicator */}
        <div
          className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
            isPositiveShift
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-amber-200 bg-amber-50/60"
          }`}
        >
          {isPositiveShift ? (
            <TrendingUp className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <TrendingDown className="h-5 w-5 text-amber-600 shrink-0" />
          )}
          <div>
            <p className={`text-xs font-bold ${isPositiveShift ? "text-emerald-700" : "text-amber-700"}`}>
              {isPositiveShift
                ? `+${shift}% positive cognitive shift detected`
                : `${Math.abs(shift)}% shift toward original thought`}
            </p>
            <p className={`text-[11px] ${isPositiveShift ? "text-emerald-600" : "text-amber-600"}`}>
              {isPositiveShift
                ? "Great work! Your belief in the balanced alternative is increasing."
                : "Try adjusting the sliders to reflect your genuine current beliefs."}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button type="button" variant="outline" onClick={handlePrevious} className="rounded-xl h-9 text-xs gap-1.5">
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>
          <Button
            type="submit"
            data-testid="button-save-challenge"
            className="rounded-xl h-9 text-xs px-6 gap-1.5"
            style={{ background: "linear-gradient(135deg, #059669 0%, #0891b2 100%)" }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Save Challenge
          </Button>
        </div>
      </div>
    );
  };

  // ─── Main content ────────────────────────────────────────────────────────────
  const content = (
    <>
      {!showSuccessDialog && (
        <div className="flex flex-col">
          <LuxuryHeader />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {currentStep === 0 && <StepIntro />}
              {currentStep === 1 && <StepEvidence />}
              {currentStep === 2 && <StepAlternative />}
              {currentStep === 3 && <StepBeliefs />}
            </form>
          </Form>
        </div>
      )}

      {/* ─── Success Overlay ─────────────────────────────────────────────── */}
      {showSuccessDialog && (
        <div className="flex flex-col">
          {/* Success header */}
          <div
            className="relative overflow-hidden rounded-t-2xl px-7 py-6"
            style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)" }}
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-emerald-300/20 blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-teal-400/15 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-300/30 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-emerald-900/40">
                <CheckCircle2 className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Challenge Complete!</h2>
                <p className="text-emerald-300/80 text-xs mt-0.5 font-medium">
                  You've successfully challenged your automatic thought
                </p>
              </div>
            </div>
          </div>

          {/* Success body */}
          <div className="p-6 space-y-4">
            {/* Accomplishment grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  icon: Scale,
                  label: "Evidence Examined",
                  sub: "Both sides considered",
                  color: "text-indigo-600",
                  bg: "bg-indigo-50",
                  border: "border-indigo-200",
                },
                {
                  icon: Lightbulb,
                  label: "Alternative Created",
                  sub: "Balanced perspective built",
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                  border: "border-amber-200",
                },
                {
                  icon: TrendingUp,
                  label: "Belief Shifted",
                  sub: `${Math.abs((watchedValues.beliefInOriginal ?? 50) - (watchedValues.beliefInAlternative ?? 50))}% cognitive change`,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                  border: "border-emerald-200",
                },
              ].map(({ icon: Icon, label, sub, color, bg, border }) => (
                <div key={label} className={`rounded-xl border ${border} ${bg} p-3.5 text-center`}>
                  <div className={`w-8 h-8 rounded-lg ${bg} border ${border} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <p className={`text-xs font-bold ${color}`}>{label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Clinical reminder */}
            <div
              className="rounded-xl border border-purple-900/20 p-4"
              style={{ backgroundColor: "#0f0624" }}
            >
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-purple-300 mb-1">Clinical Reminder</p>
                  <p className="text-[11px] text-purple-400/80 leading-relaxed">
                    The goal isn't positive thinking — it's <strong className="text-purple-300">realistic, balanced thinking</strong>. 
                    With regular practice, this process becomes second nature and builds lasting cognitive resilience.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleCloseSuccess}
                data-testid="button-close-success"
                className="rounded-xl h-9 px-7 text-sm font-semibold gap-2"
                style={{ background: "linear-gradient(135deg, #059669 0%, #0891b2 100%)" }}
              >
                <CheckCircle2 className="h-4 w-4" /> Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // If 'open' prop is provided, wrap content in Dialog
  if (open !== undefined) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}
