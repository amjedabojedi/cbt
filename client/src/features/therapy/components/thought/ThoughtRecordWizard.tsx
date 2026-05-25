import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmotionRecord } from "@shared/schema";
import useActiveUser from "@/hooks/use-active-user";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { useLocation } from "wouter";
import { ThoughtChallengeWizard } from "./ThoughtChallengeWizard";
import { useLocalization } from "@/lib/localize.tsx";
import { translateEmotion } from "@/features/therapy/components/emotion/EmotionWheelFixed";

import {
  Brain,
  CheckCircle2,
  Info,
  Sparkles,
  RefreshCw,
  X,
  BrainCircuit,
  Scale,
  Lightbulb,
  HelpCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import WizardSuccessDialog from "@/features/journal/components/wizard/WizardSuccessDialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import WizardProgressHeader from "@/features/journal/components/wizard/WizardProgressHeader";
import WizardNavButtons from "@/features/journal/components/wizard/WizardNavButtons";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// ANT (Automatic Negative Thought) categories based on CBT
const thoughtCategories = [
  {
    value: "all_or_nothing",
    label: "All or Nothing Thinking",
    description: "Things are either right or wrong, good or bad. Can lead people to give up at the first small sign of failure.",
    examples: ["I failed this test. I am stupid so I am giving up", "Either we do it like this or not at all"]
  },
  {
    value: "mental_filter",
    label: "Mental Filter",
    description: "Seeing the world through a 'filter' which only lets you see the negative without recognising the positive.",
    examples: ["I only came second in the exam. I should have come first", "I have got more responsibilities so this will mean more work and longer hours"]
  },
  {
    value: "mind_reading",
    label: "Mind Reading",
    description: "Presuming we know what other people are thinking without looking at the evidence.",
    examples: ["Sarah didn't say hello. She must be mad with me"]
  },
  {
    value: "fortune_telling",
    label: "Fortune Telling",
    description: "Predicting the future and having negative expectations about what will happen.",
    examples: ["What's the point? I know I am going to do badly in this interview", "I am never going to lose weight so I may as well eat this cream cake"]
  },
  {
    value: "labelling",
    label: "Labelling",
    description: "Giving negative labels to ourselves or other people.",
    examples: ["I'm a loser. I am useless", "They are all idiots"]
  },
  {
    value: "over_generalising",
    label: "Over-Generalising",
    description: "Using words like 'always', 'never', 'nothing', 'every time'. If something bad happens once, you expect it to happen again and again.",
    examples: ["I am always bad at that", "Nothing good ever happens"]
  },
  {
    value: "compare_despair",
    label: "Compare and Despair",
    description: "Comparing yourself unfavourably to others.",
    examples: ["I am so disorganised I will never be able to juggle things like Jane", "Why can't I go on expensive holidays like Laura?"]
  },
  {
    value: "emotional_thinking",
    label: "Emotional Thinking",
    description: "Thinking that the way we feel about something must make it true.",
    examples: ["I feel like a failure so I must be", "I feel anxious about the presentation so I know it's going to go badly"]
  },
  {
    value: "guilty_thinking",
    label: "Guilty Thinking",
    description: "Using words like 'should', 'must', 'have to' and 'ought to' can allow guilt to build up.",
    examples: ["I must clean the house today", "I should have done that already", "I ought to have known that was wrong"]
  },
  {
    value: "catastrophising",
    label: "Catastrophising",
    description: "Thinking an unlikely disaster is going to happen or attaching too much importance to a negative experience.",
    examples: ["I have sent the wrong contract out. I am going to lose my job", "I think I left my hair straighteners on. The house is going to burn down"]
  },
  {
    value: "blaming_others",
    label: "Blaming Others",
    description: "Thinking others are always to blame for things that have gone wrong without taking responsibility.",
    examples: ["I would have got that promotion if it wasn't for her"]
  },
  {
    value: "personalising",
    label: "Personalising",
    description: "Blaming yourself for something that wasn't entirely your fault or thinking that something somebody says is a reaction to you.",
    examples: ["It's my fault we all missed the train", "Paul is in a bad mood today. It must be something I said to him"]
  },
];

// Schema for thought record form
const thoughtRecordSchema = z.object({
  automaticThought: z.string().min(10, "Please provide more detail (minimum 10 characters)"),
  thoughtCategory: z.array(z.string()).min(1, "Please select at least one category"),
  situation: z.string().min(10, "Please describe the situation (minimum 10 characters)"),
  emotionRecordId: z.number().optional().nullable(),
});

type ThoughtRecordFormValues = z.infer<typeof thoughtRecordSchema>;

interface ThoughtRecordWizardProps {
  onClose: () => void;
  preselectedEmotionId?: number;
}

export default function ThoughtRecordWizard({
  onClose,
  preselectedEmotionId,
}: ThoughtRecordWizardProps) {
  const { user } = useAuth();
  const { activeUserId } = useActiveUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { t, tNum, isRTL, currentLanguage } = useLocalization();
  const translateError = (message?: string) => (message ? t(message) : undefined);

  const formatEmotionLabel = (emotion: EmotionRecord) => {
    const primary = translateEmotion(
      emotion.primaryEmotion || emotion.coreEmotion || "",
      currentLanguage
    );
    const tertiary = emotion.tertiaryEmotion
      ? translateEmotion(emotion.tertiaryEmotion, currentLanguage)
      : null;
    const dateStr = format(
      new Date(emotion.timestamp),
      "MMM d, h:mm a",
      isRTL ? { locale: arLocale } : undefined
    );
    return tertiary ? `${primary} (${tertiary}) - ${dateStr}` : `${primary} - ${dateStr}`;
  };
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showChallengeWizard, setShowChallengeWizard] = useState(false);
  const [recordedThought, setRecordedThought] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 6;

  // Fetch recent emotions for linking
  const { data: emotions } = useQuery<EmotionRecord[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!activeUserId,
  });

  // Get recent emotions (last 10)
  const recentEmotions = emotions?.slice(0, 10) || [];

  const form = useForm<ThoughtRecordFormValues>({
    resolver: zodResolver(thoughtRecordSchema),
    mode: "onChange",
    defaultValues: {
      automaticThought: "",
      thoughtCategory: [],
      situation: "",
      emotionRecordId: preselectedEmotionId || null,
    },
  });

  // Watch all form values for direct binding (Edge compatibility fix)
  const watchedValues = form.watch();

  const onSubmit = async (data: ThoughtRecordFormValues) => {
    if (!activeUserId) return;
    
    // Prevent submission if not on the final step
    if (currentStep < totalSteps - 1) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest(
        "POST",
        `/api/users/${activeUserId}/thoughts`,
        {
          userId: activeUserId,
          automaticThoughts: data.automaticThought,
          thoughtCategory: data.thoughtCategory,
          situation: data.situation,
          emotionRecordId: data.emotionRecordId || null,
          cognitiveDistortions: [],
          evidenceFor: null,
          evidenceAgainst: null,
          alternativePerspective: null,
          insightsGained: null,
          reflectionRating: null,
        }
      );

      const thought = await response.json();
      setRecordedThought(thought);

      // Invalidate queries
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${activeUserId}/thoughts`] 
      });

      setShowSuccessDialog(true);
      
      toast({
        title: t("Success!"),
        description: t("Your thought has been recorded."),
      });
    } catch (error) {
      console.error("Error recording thought:", error);
      toast({
        title: t("Error"),
        description: t("Failed to record thought. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof ThoughtRecordFormValues)[] = [];
    
    if (currentStep === 0) {
      // Step 0 is intro - no validation needed
    } else if (currentStep === 1) {
      fieldsToValidate = ["automaticThought"];
    } else if (currentStep === 2) {
      // Step 2 is educational slide - no validation needed
    } else if (currentStep === 3) {
      fieldsToValidate = ["thoughtCategory"];
    } else if (currentStep === 4) {
      fieldsToValidate = ["situation"];
    } else if (currentStep === 5) {
      // Step 5 is optional emotion linking
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleReset = () => {
    form.reset({
      automaticThought: "",
      thoughtCategory: [],
      situation: "",
      emotionRecordId: null,
    });
    setCurrentStep(0);
    setShowSuccessDialog(false);
    setRecordedThought(null);
  };

  // Get selected emotion details
  const selectedEmotion = recentEmotions.find(
    (e) => e.id === form.watch("emotionRecordId")
  );

  // Step 1: Write your thought (simple language)
  const renderStep1 = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4" data-testid="step-write-thought">
      <div className="md:col-span-7 space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <Brain className="h-4.5 w-4.5 text-teal-700" />
            {t("What thought went through your mind?")} <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500">
            {t("Write down the exact thought that popped into your head. Be as specific as possible.")}
          </p>
          <Textarea
            placeholder={t("e.g., I'm going to embarrass myself in front of everyone...")}
            className="resize-none w-full min-h-[90px] text-sm py-2 px-3 rounded-xl"
            rows={3}
            value={watchedValues.automaticThought || ""}
            onChange={(e) => {
              form.setValue("automaticThought", e.target.value, { shouldValidate: true });
            }}
            data-testid="textarea-thought"
          />
          <div className="flex justify-between items-center text-xs mt-1">
            {form.formState.errors.automaticThought ? (
              <p className="text-red-500 text-xs">{translateError(form.formState.errors.automaticThought.message)}</p>
            ) : (
              <span />
            )}
            <span className={`font-medium ${(watchedValues.automaticThought || "").length < 10 ? 'text-red-500' : 'text-green-600'}`}>
              {tNum((watchedValues.automaticThought || "").length)}/10 {t("characters minimum")}
            </span>
          </div>
        </div>
      </div>

      <div className="md:col-span-5">
        <div className="bg-teal-50/40 border border-teal-100 p-3.5 rounded-xl space-y-3 shadow-2xs">
          <div className={`flex items-start ${isRTL ? "flex-row-reverse" : ""}`}>
            <Info className={`h-4.5 w-4.5 text-teal-700 mt-0.5 shrink-0 me-2`} />
            <div>
              <h4 className="font-bold text-teal-700 text-xs mb-0.5">{t("💡 Why This Step?")}</h4>
              <p className="text-[11px] text-teal-800/80 leading-relaxed">
                {t("Simply capture what went through your mind exactly as you thought it. Don't worry about accuracy yet.")}
              </p>
            </div>
          </div>
          <div className="border-t border-teal-100/50 pt-2.5">
            <h4 className="font-bold text-teal-800 text-xs mb-1.5">{t("Common Examples:")}</h4>
            <ul className="text-[11px] text-teal-700/70 space-y-1">
              <li>• {t("\"I'm not good enough\"")}</li>
              <li>• {t("\"Everyone will judge me\"")}</li>
              <li>• {t("\"I'll never succeed\"")}</li>
              <li>• {t("\"This is going to be a disaster\"")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Educational slide about automatic thoughts
  const renderStep2 = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4" data-testid="step-learn-automatic-thoughts">
      <div className="md:col-span-6">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50/30 border border-teal-100 p-3.5 rounded-xl shadow-2xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-5 w-5 text-teal-700 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-teal-700 mb-1.5">
                {t("What Are \"Automatic Thoughts\"?")}
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                {t("These are immediate, lightning-fast thoughts that pop into your mind in response to situations - often so quick you barely notice them!")}
              </p>
              <p className="text-[11px] font-semibold text-slate-800 mb-1">
                {t("Automatic thoughts are:")}
              </p>
              <ul className="text-[11px] text-slate-600 space-y-1 ml-2.5 leading-relaxed">
                <li>• <strong>{t("Lightning fast")}</strong> - {t("split-second occurrences")}</li>
                <li>• <strong>{t("Believable")}</strong> - {t("they feel like absolute truth")}</li>
                <li>• <strong>{t("Powerful")}</strong> - {t("strongly affect how you feel")}</li>
                <li>• <strong>{t("Sometimes unhelpful")}</strong> - {t("can be inaccurate")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-6 space-y-2">
        <h4 className="font-semibold text-slate-800 text-xs">{t("The 3-Step CBT Method:")}</h4>
        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
          <h4 className="font-bold text-slate-900 text-xs mb-0.5 flex items-center gap-1.5">
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">{tNum(1)}</span>
            {t("Catch the Thought")}
          </h4>
          <p className="text-[10px] text-slate-500 leading-normal">{t("Notice immediate negative thoughts exactly as they occur.")}</p>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
          <h4 className="font-bold text-slate-900 text-xs mb-0.5 flex items-center gap-1.5">
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">{tNum(2)}</span>
            {t("Identify the Pattern")}
          </h4>
          <p className="text-[10px] text-slate-500 leading-normal">{t("Categorize which unhelpful thinking pattern (ANT) it represents.")}</p>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
          <h4 className="font-bold text-slate-900 text-xs mb-0.5 flex items-center gap-1.5">
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">{tNum(3)}</span>
            {t("Challenge & Reframe")}
          </h4>
          <p className="text-[10px] text-slate-500 leading-normal">{t("Examine evidence and develop a balanced, healthy perspective.")}</p>
        </div>
      </div>
    </div>
  );

  // Step 3: Categorize the thought
  const renderStep3 = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4" data-testid="step-categorize-thought">
      <div className="md:col-span-8 space-y-3 flex flex-col">
        <div className="bg-teal-50/70 border border-teal-100/50 p-2.5 rounded-xl shadow-2xs">
          <p className="text-[10.5px] font-semibold text-teal-700 mb-0.5">{t("Your automatic thought:")}</p>
          <p className="text-[11px] italic text-slate-700">"{watchedValues.automaticThought}"</p>
        </div>

        <FormField
          control={form.control}
          name="thoughtCategory"
          render={() => (
            <FormItem className="flex-1 flex flex-col">
              <FormLabel className="text-sm font-semibold text-slate-900">
                {t("Read definitions, then select matches")} <span className="text-red-500">*</span>
              </FormLabel>
              <FormDescription className="text-xxs">
                {t("Select all unhelpful thinking styles that match your thought (scroll to view all 12)")}
              </FormDescription>
              <div className="space-y-1.5 mt-1.5 flex-1 overflow-y-auto pr-1 max-h-[220px] border border-slate-100 rounded-xl p-1.5 bg-slate-50/50 custom-scrollbar">
                {thoughtCategories.map((category) => (
                  <FormField
                    key={category.value}
                    control={form.control}
                    name="thoughtCategory"
                    render={({ field }) => (
                      <div className={`group relative p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                        field.value?.includes(category.value)
                          ? 'border-purple-500 bg-teal-50/60 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-3xs'
                      }`}>
                        <div className={`flex items-start ${isRTL ? "space-x-reverse" : ""} space-x-2.5`}>
                          <Checkbox
                            checked={field.value?.includes(category.value)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, category.value])
                                : field.onChange(
                                    field.value?.filter((value) => value !== category.value)
                                  );
                            }}
                            data-testid={`checkbox-${category.value}`}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <Label className="text-xs font-bold text-slate-900 cursor-pointer block mb-0.5">
                              {t(category.label)}
                            </Label>
                            <p className="text-[10.5px] text-slate-500 leading-normal">
                              {t(category.description)}
                            </p>
                            <span className="block mt-1 text-[10px] text-teal-700 font-medium italic">
                              {t("Example:")} "{t(category.examples[0])}"
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                ))}
              </div>
              {form.formState.errors.thoughtCategory && (
                <p className="text-red-500 text-sm font-medium">
                  {translateError(form.formState.errors.thoughtCategory.message)}
                </p>
              )}
            </FormItem>
          )}
        />
      </div>

      <div className="md:col-span-4">
        <div className="bg-teal-50/40 border border-teal-100 p-3.5 rounded-xl shadow-2xs">
          <div className={`flex items-start ${isRTL ? "flex-row-reverse" : ""}`}>
            <Info className={`h-4.5 w-4.5 text-teal-700 mt-0.5 shrink-0 me-2`} />
            <div>
              <h4 className="font-bold text-teal-700 text-xs mb-0.5">{t("💡 What are ANTs?")}</h4>
              <p className="text-[11px] text-teal-800/80 leading-relaxed mb-2">
                {t("Automatic thoughts can be unhelpful patterns called ANTs (Automatic Negative Thoughts).")}
              </p>
              <p className="text-[11px] text-teal-800/80 leading-relaxed font-medium">
                {t("Recognizing these styles is half the battle to reframing your mind!")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Describe Situation
  const renderStep4 = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4" data-testid="step-describe-situation">
      <div className="md:col-span-7 space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            {t("What was happening when you had this thought?")} <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500">
            {t("Describe the situation objectively - who, what, when, where")}
          </p>
          <Textarea
            placeholder={t("e.g., I was preparing for my presentation tomorrow and my manager asked to review my slides...")}
            className="resize-none w-full min-h-[90px] text-sm py-2 px-3 rounded-xl"
            rows={3}
            value={watchedValues.situation || ""}
            onChange={(e) => {
              form.setValue("situation", e.target.value, { shouldValidate: true });
            }}
            data-testid="textarea-situation"
          />
          <div className="flex justify-between items-center text-xs mt-1">
            {form.formState.errors.situation ? (
              <p className="text-red-500 text-xs">{translateError(form.formState.errors.situation.message)}</p>
            ) : (
              <span />
            )}
            <span className={`font-medium ${(watchedValues.situation || "").length < 10 ? 'text-red-500' : 'text-green-600'}`}>
              {tNum((watchedValues.situation || "").length)}/10 {t("characters minimum")}
            </span>
          </div>
        </div>
      </div>

      <div className="md:col-span-5">
        <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl space-y-3 shadow-2xs">
          <div className={`flex items-start ${isRTL ? "flex-row-reverse" : ""}`}>
            <Info className={`h-4.5 w-4.5 text-amber-600 mt-0.5 shrink-0 me-2`} />
            <div>
              <h4 className="font-bold text-amber-900 text-xs mb-0.5">{t("💡 Why Describe Situation?")}</h4>
              <p className="text-[11px] text-amber-800/80 leading-relaxed">
                {t("Context helps identify triggers. Try to stick completely to objective observable facts.")}
              </p>
            </div>
          </div>
          <div className="border-t border-amber-100/50 pt-2.5">
            <h4 className="font-bold text-amber-950 text-xs mb-1.5">{t("Observable Tips:")}</h4>
            <ul className="text-[11px] text-amber-900/70 space-y-1">
              <li>• {t("Stick to objective facts (who, what, when, where)")}</li>
              <li>• {t("Avoid subjective judgment words (e.g., \"terrible\")")}</li>
              <li>• {t("Keep descriptions concise and trigger-focused")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 5: Link to Emotion (Optional)
  const renderStep5 = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4" data-testid="step-link-emotion">
      <div className="md:col-span-7 space-y-3">
        <FormField
          control={form.control}
          name="emotionRecordId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-slate-900">
                {t("Link to a Recent Emotion (Optional)")}
              </FormLabel>
              <FormDescription className="text-xs">
                {t("Select an emotion you tracked recently, or skip this step")}
              </FormDescription>
              <Select
                value={field.value?.toString() || "none"}
                onValueChange={(value) => {
                  field.onChange(value === "none" ? null : parseInt(value));
                }}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-emotion-link" className="rounded-xl">
                    <SelectValue placeholder={t("No emotion linked")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{t("No emotion linked")}</SelectItem>
                  {recentEmotions.map((emotion) => (
                    <SelectItem key={emotion.id} value={emotion.id.toString()}>
                      {formatEmotionLabel(emotion)}
                    </SelectItem>
                  ))}
                  {recentEmotions.length === 0 && (
                    <SelectItem value="__empty" disabled>
                      {t("No recent emotions tracked")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedEmotion && (
          <div className="bg-green-50/40 border border-green-200/60 p-3 rounded-xl shadow-2xs mt-3">
            <h4 className="font-bold text-green-950 text-xs mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              {t("Linked Emotion")}
            </h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className="text-[10px] px-2 py-0">
                {translateEmotion(selectedEmotion.coreEmotion, currentLanguage)}
              </Badge>
              {selectedEmotion.primaryEmotion && (
                <Badge variant="outline" className="text-[10px] px-2 py-0">
                  {translateEmotion(selectedEmotion.primaryEmotion, currentLanguage)}
                </Badge>
              )}
              {selectedEmotion.tertiaryEmotion && (
                <Badge variant="outline" className="text-[10px] px-2 py-0">
                  {translateEmotion(selectedEmotion.tertiaryEmotion, currentLanguage)}
                </Badge>
              )}
              <span className="text-[10px] font-medium text-slate-600">
                {t("Intensity:")} {tNum(selectedEmotion.intensity)}/10
              </span>
            </div>
            {selectedEmotion.situation && (
              <p className="text-[10px] text-slate-650 mt-1.5 leading-normal">
                <strong>{t("Situation:")}</strong> {selectedEmotion.situation}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="md:col-span-5">
        <div className="bg-teal-50/40 border border-teal-100 p-3.5 rounded-xl shadow-2xs">
          <div className={`flex items-start ${isRTL ? "flex-row-reverse" : ""}`}>
            <Info className={`h-4.5 w-4.5 text-teal-700 mt-0.5 shrink-0 me-2`} />
            <div>
              <h4 className="font-bold text-teal-700 text-xs mb-0.5">{t("💡 Why Link to Emotion?")}</h4>
              <p className="text-[11px] text-teal-800/80 leading-relaxed">
                {t("Connecting thoughts to your tracked emotions reveals patterns between what you think and how you feel.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 0: Introduction
  const renderStep0 = () => (
    <div className="space-y-4" data-testid="step-intro">
      {/* Title & Description on separate line */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-xs shrink-0">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t("Record a Thought")}</h2>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {t("Capture and challenge automatic negative thoughts (ANTs) using clinical CBT techniques to improve mental well-being.")}
          </p>
        </div>
      </div>

      {/* Two columns underneath */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column: What You'll Do Next */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-purple-50/20 p-3.5 rounded-xl border border-indigo-100/30 shadow-xs flex flex-col justify-center">
          <h3 className="font-semibold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
            {t("What You'll Do Next")}
          </h3>
          <ol className="space-y-1.5 text-xxs text-slate-650 leading-normal">
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-indigo-600">{tNum(1)}.</span>
              <span>{t("Write down the automatic negative thought")}</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-indigo-600">{tNum(2)}.</span>
              <span>{t("Learn about automatic thoughts in CBT")}</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-indigo-600">{tNum(3)}.</span>
              <span>{t("Categorize matching thinking patterns (ANTs)")}</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-indigo-600">{tNum(4)}.</span>
              <span>{t("Describe the situation that triggered the thought")}</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-indigo-600">{tNum(5)}.</span>
              <span>{t("Optionally link to a tracked emotion")}</span>
            </li>
          </ol>
        </div>

        {/* Right column: Concept cards */}
        <div className="grid grid-cols-2 gap-2.5 h-full">
          {[
            { icon: Sparkles, color: "text-indigo-600 bg-indigo-50", titleKey: "Notice Thoughts", descKey: "Catch thoughts triggering moods." },
            { icon: BrainCircuit, color: "text-teal-700 bg-teal-50", titleKey: "Identify Patterns", descKey: "Recognize ANTs categories." },
            { icon: Scale, color: "text-blue-600 bg-blue-50", titleKey: "Examine Evidence", descKey: "Examine facts for & against." },
            { icon: Lightbulb, color: "text-amber-600 bg-amber-50", titleKey: "Gain Insights", descKey: "Develop healthy reframes." }
          ].map((item, idx) => (
            <Card key={idx} className="border-slate-100 bg-white p-3 shadow-2xs rounded-lg h-full flex flex-col justify-center">
              <CardHeader className="p-0 pb-1.5 flex flex-row items-center gap-2">
                <div className={`p-1.5 rounded-md ${item.color} shrink-0`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">{t(item.titleKey)}</span>
              </CardHeader>
              <CardContent className="p-0 mt-0.5">
                <p className="text-[11px] sm:text-xs text-slate-500 leading-normal sm:leading-relaxed">{t(item.descKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <>
      <Card dir={isRTL ? "rtl" : "ltr"} className="max-w-3xl mx-auto shadow-sm border-slate-100/80 overflow-hidden">
        <WizardProgressHeader
          title={t("Record a Thought")}
          icon={Brain}
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={[t("1. Situation"), t("2. Thought"), t("3. ANTs"), t("4. Link"), t("5. Review")]}
          accentClassName="text-indigo-600"
          onClose={onClose}
        />

        <CardContent className="p-4 sm:p-5 pt-0">
          {/* Step Content */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-2">
              {getStepContent()}

              <WizardNavButtons
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onSubmit={() => form.handleSubmit(onSubmit)()}
                isSubmitting={isSubmitting}
                submitLabel="Record Thought"
                introNextLabel="Get Started"
                submitIcon={CheckCircle2}
                nextButtonClassName="bg-teal-800 hover:bg-teal-700 text-white rounded-xl border-0 transition-all shadow-md"
                submitButtonClassName="bg-teal-800 hover:bg-teal-700 text-white rounded-xl border-0 transition-all shadow-md"
                extraActions={
                  <>
                    {currentStep === totalSteps - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.handleSubmit(onSubmit)()}
                        disabled={isSubmitting}
                        data-testid="button-skip-emotion"
                      >
                        {t("Skip & Record")}
                      </Button>
                    )}
                  </>
                }
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      <WizardSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title={t("Thought Recorded Successfully!")}
        description={t("Great job capturing your automatic thought. What would you like to do next?")}
        testId="dialog-thought-success"
      >
        <div className="flex flex-col gap-2.5">
          <Button
            size="lg"
            className="flex items-center justify-center gap-2 h-11 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold"
            onClick={() => {
              setShowSuccessDialog(false);
              setShowChallengeWizard(true);
            }}
            data-testid="button-challenge-thought"
          >
            <Sparkles className="h-4 w-4" />
            {t("Challenge This Thought (Optional)")}
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="flex items-center justify-center gap-2 h-11 rounded-xl border-slate-200 hover:border-teal-200 hover:bg-teal-50 text-sm"
            onClick={() => {
              handleReset();
            }}
            data-testid="button-record-another-thought"
          >
            <RefreshCw className="h-4 w-4" />
            {t("Record Another Thought")}
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="flex items-center justify-center gap-2 h-11 rounded-xl border-slate-200 hover:border-teal-200 hover:bg-teal-50 text-sm"
            onClick={() => {
              setShowSuccessDialog(false);
              onClose();
            }}
            data-testid="button-close-wizard"
          >
            <X className="h-4 w-4" />
            {t("Close")}
          </Button>
        </div>
      </WizardSuccessDialog>

      {/* Thought Challenge Wizard */}
      {recordedThought && (
        <ThoughtChallengeWizard
          open={showChallengeWizard}
          thoughtRecord={recordedThought}
          onComplete={() => {
            setShowChallengeWizard(false);
            onClose();
          }}
          onCancel={() => {
            setShowChallengeWizard(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
