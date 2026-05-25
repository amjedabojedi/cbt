import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useRefreshData } from "@/hooks/use-refresh-data";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Check, ArrowRight, RefreshCw, Home, TrendingUp, Calendar, Heart, Globe, Sparkles, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import EmotionWheelResponsive from "./EmotionWheelResponsive";
import { translateEmotion } from "./EmotionWheelFixed";
import EmotionOnboardingTour from "./EmotionOnboardingTour";
import WizardProgressHeader from "@/features/journal/components/wizard/WizardProgressHeader";
import WizardNavButtons from "@/features/journal/components/wizard/WizardNavButtons";
import WizardSuccessDialog from "@/features/journal/components/wizard/WizardSuccessDialog";
import type { EmotionRecord } from "@shared/schema";
import { useLocalization } from "@/lib/localize.tsx";

// Define schema for the form
const formSchema = z.object({
  coreEmotion: z.string().min(1, "Please select an emotion from the wheel"),
  primaryEmotion: z.string().optional(),
  tertiaryEmotion: z.string().optional(),
  intensity: z.number().min(1).max(10),
  situation: z.string().min(10, "Please describe the situation in at least 10 characters"),
  location: z.string().optional(),
  company: z.string().optional(),
  timestamp: z.string().optional(),
  useCurrentTime: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface EmotionTrackingFormWizardProps {
  language?: "en" | "ar";
  direction?: "ltr" | "rtl";
  onEmotionRecorded?: () => void;
  onLanguageToggle?: () => void;
  languageLabel?: string;
}

const EXAMPLE_SITUATIONS = [
  "My boss criticized my work in front of the team during the meeting",
  "My friend canceled our plans at the last minute without explanation",
  "I received unexpected positive feedback on my presentation",
  "Someone cut me off in traffic and nearly caused an accident",
  "I had a disagreement with my partner about household responsibilities"
];

const INTRO_STEPS = [
  { n: 1, label: "Select", hint: "Choose on the emotion wheel" },
  { n: 2, label: "Rate", hint: "How intense it felt (1–10)" },
  { n: 3, label: "Describe", hint: "What triggered the feeling" },
  { n: 4, label: "Details", hint: "Location, company, time (optional)" },
] as const;

export default function EmotionTrackingFormWizard({
  language = "en",
  direction = "ltr",
  onEmotionRecorded,
  onLanguageToggle,
  languageLabel = "English",
}: EmotionTrackingFormWizardProps) {
  const { t, isRTL, tNum, currentLanguage } = useLocalization();
  const { user } = useAuth();

  const formatTimestamp = (val: string | undefined) => {
    if (!val) return "";
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return val;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      if (currentLanguage === "ar") {
        const ampm = hours >= 12 ? "م" : "ص";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHours = String(hours).padStart(2, '0');
        return tNum(`${day}/${month}/${year}، ${formattedHours}:${minutes} ${ampm}`);
      } else {
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHours = String(hours).padStart(2, '0');
        return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${ampm}`;
      }
    } catch (e) {
      return val;
    }
  };
  const { toast } = useToast();
  const { refreshAfterOperation } = useRefreshData();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [recordedEmotion, setRecordedEmotion] = useState<any>(null);
  const [, navigate] = useLocation();
  const [showTourComplete, setShowTourComplete] = useState(false);
  
  const totalSteps = 5;
  
  // Fetch emotion stats for insights
  const { data: emotions = [] } = useQuery<EmotionRecord[]>({
    queryKey: user ? [`/api/users/${user.id}/emotions`] : [],
    enabled: !!user,
  });
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coreEmotion: "",
      primaryEmotion: "",
      tertiaryEmotion: "",
      intensity: 5,
      situation: "",
      location: "",
      company: "",
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      useCurrentTime: true,
    },
  });
  
  const selectedCore = form.watch("coreEmotion");
  const selectedPrimary = form.watch("primaryEmotion");
  const selectedTertiary = form.watch("tertiaryEmotion");
  
  // Handle emotion wheel selection
  const handleEmotionSelect = (selection: { 
    coreEmotion: string; 
    primaryEmotion: string; 
    tertiaryEmotion: string 
  }) => {
    form.setValue("coreEmotion", selection.coreEmotion);
    form.setValue("primaryEmotion", selection.primaryEmotion);
    form.setValue("tertiaryEmotion", selection.tertiaryEmotion);
    form.trigger("coreEmotion");
  };
  
  // Handle current time checkbox change
  const handleCurrentTimeChange = (checked: boolean) => {
    form.setValue("useCurrentTime", checked);
    if (checked) {
      form.setValue("timestamp", format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    }
  };
  
  // Validate current step
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 0:
        return true; // Intro step - no validation
      case 1:
        return await form.trigger("coreEmotion");
      case 2:
        return await form.trigger("intensity");
      case 3:
        return await form.trigger("situation");
      case 4:
        return true; // Optional fields
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
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    // Only allow submission at the final step (Step 4)
    if (currentStep < totalSteps - 1) {
      return; // Prevent submission if not at final step
    }
    
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to record emotions",
          variant: "destructive",
        });
        return;
      }
      
      const emotionData = {
        userId: user.id,
        coreEmotion: data.coreEmotion,
        ...(data.primaryEmotion ? { primaryEmotion: data.primaryEmotion } : {}),
        ...(data.tertiaryEmotion ? { tertiaryEmotion: data.tertiaryEmotion } : {}),
        intensity: data.intensity,
        situation: data.situation.trim(),
        location: data.location || null,
        company: data.company || null,
        timestamp: data.useCurrentTime 
          ? new Date().toISOString() 
          : new Date(data.timestamp || "").toISOString(),
      };
      
      const response = await apiRequest(
        "POST", 
        `/api/users/${user.id}/emotions`, 
        emotionData
      );
      
      const recordedEmotion = await response.json();
      
      refreshAfterOperation(
        'emotion',
        'create',
        recordedEmotion.id,
        "Your emotion has been recorded successfully",
        false
      );
      
      // Reset form
      form.reset({
        coreEmotion: "",
        primaryEmotion: "",
        tertiaryEmotion: "",
        intensity: 5,
        situation: "",
        location: "",
        company: "",
        timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        useCurrentTime: true,
      });
      
      setCurrentStep(0);
      setRecordedEmotion(recordedEmotion);
      setShowSuccessDialog(true);
      
      if (onEmotionRecorded) {
        onEmotionRecorded();
      }
    } catch (error) {
      console.error("Error recording emotion:", error);
      toast({
        title: "Error",
        description: "Failed to record emotion. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Calculate insights
  const totalEmotions = emotions.length;
  const emotionCounts = emotions.reduce((acc, e) => {
    acc[e.coreEmotion] = (acc[e.coreEmotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostCommonEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
  
  // Get the recorded emotion's intensity and name for display
  const currentIntensity = recordedEmotion?.intensity || 0;
  const currentEmotionName = recordedEmotion?.tertiaryEmotion || recordedEmotion?.primaryEmotion || recordedEmotion?.coreEmotion || "Emotion";
  
  return (
    <>
      <EmotionOnboardingTour onComplete={() => setShowTourComplete(true)} />
      
      <div dir={isRTL ? "rtl" : "ltr"} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <WizardProgressHeader
          title={t("Track Your Emotion")}
          icon={Heart}
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={[t("Select"), t("Rate"), t("Describe"), t("Details")]}
          accentClassName="text-teal-700"
          hideProgressOnIntro
          trailing={
            onLanguageToggle ? (
              <button
                type="button"
                onClick={onLanguageToggle}
                className="flex items-center gap-1.5 text-slate-500 hover:text-teal-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-teal-200 bg-white text-sm font-medium transition-colors"
              >
                <Globe className="h-4 w-4" />
                {t(languageLabel)}
              </button>
            ) : undefined
          }
        />

        <CardContent
          className={
            currentStep === 0
              ? "px-6 sm:px-8 pb-6 pt-6"
              : currentStep === 1
                ? "px-5 sm:px-6 pb-4 pt-4"
                : "px-5 sm:px-6 pb-5 pt-5"
          }
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={currentStep === 0 ? "space-y-6" : "space-y-5"}>
              {/* Step 0: Intro */}
              {currentStep === 0 && (
                <div className="space-y-7" data-testid="step-intro">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
                    <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] shrink-0 bg-gradient-to-br from-rose-500 via-rose-600 to-rose-800 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-900/15 mx-auto sm:mx-0">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <div className={cn("min-w-0 text-center", isRTL ? "sm:text-right" : "sm:text-left")}>
                      <h2 className="text-2xl sm:text-[1.65rem] font-bold text-slate-800 tracking-tight leading-tight">
                        {t("Welcome to Emotion Tracking")}
                      </h2>
                      <p className={cn("text-base text-slate-500 mt-2 leading-relaxed max-w-xl mx-auto", isRTL ? "sm:mr-0 text-right" : "sm:ml-0 text-left")}>
                        {t("Log how you feel in four short steps. This builds self-awareness and helps you spot patterns over time.")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {INTRO_STEPS.map(({ n, label, hint }) => (
                      <div
                        key={label}
                        className={cn(
                          "rounded-2xl border border-slate-100 bg-slate-50/80 p-5 flex flex-col items-center text-center",
                          isRTL ? "sm:items-end sm:text-right" : "sm:items-start sm:text-left"
                        )}
                      >
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-800 text-sm font-bold text-white mb-3">
                          {tNum(n)}
                        </span>
                        <p className="font-bold text-base text-slate-800">{t(label)}</p>
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{t(hint)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-5">
                      <div className="p-2.5 h-fit rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-base text-slate-800">{t("Identify patterns")}</p>
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                          {t("See which emotions show up most and what tends to trigger them.")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 rounded-2xl border border-teal-100 bg-teal-50/50 p-5">
                      <div className="p-2.5 h-fit rounded-xl bg-teal-100 text-teal-700 border border-teal-200">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-base text-slate-800">{t("Build awareness")}</p>
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                          {t("Naming emotions clearly is a core skill in CBT and everyday wellbeing.")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 1: Select Emotion */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center" data-testid="step-select-emotion">
                  {/* Left column: Enlarged Emotion Wheel */}
                  <div className="md:col-span-7 flex justify-center items-center">
                    <EmotionWheelResponsive
                      compact
                      language={language}
                      direction={direction}
                      onEmotionSelect={handleEmotionSelect}
                      hideBreadcrumb
                      hideStatus
                    />
                  </div>

                  {/* Right column: Interactive guide and current selection preview */}
                  <div className="md:col-span-5 flex flex-col space-y-4 h-full justify-between py-2">
                    {/* Keep form fields hidden */}
                    <FormField
                      control={form.control}
                      name="coreEmotion"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="primaryEmotion"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tertiaryEmotion"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Styled guide and live selected emotion path */}
                    <div className="space-y-4">
                      <div className="bg-teal-50/70 p-4 rounded-xl border border-teal-100/80">
                        <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm mb-1.5">
                          <Sparkles className="h-4 w-4" />
                          <span>{t("Interactive Guide")}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {t("Tap any segment on the emotion wheel. The outer rings reveal more specific, granular feelings.")}
                        </p>
                      </div>

                      {/* Live feedback card for selection */}
                      <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-4 space-y-3 min-h-[140px] flex flex-col justify-center">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {t("Current Selection")}
                        </div>
                        
                        {selectedCore ? (
                          <div className="flex flex-col gap-2">
                            {/* Horizontal breadcrumb trail using stylized badges */}
                            <div className="flex items-center gap-1.5 flex-wrap text-sm text-slate-700 font-medium">
                              <span className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all duration-300",
                                selectedCore === "Anger" && "bg-red-50 text-red-700 border border-red-100",
                                selectedCore === "Sadness" && "bg-blue-50 text-blue-700 border border-blue-100",
                                selectedCore === "Surprise" && "bg-teal-50 text-purple-700 border border-teal-100",
                                selectedCore === "Joy" && "bg-amber-50 text-amber-700 border border-amber-100",
                                selectedCore === "Love" && "bg-pink-50 text-pink-700 border border-pink-100",
                                selectedCore === "Fear" && "bg-green-50 text-green-700 border border-green-100"
                              )}>
                                {translateEmotion(selectedCore, language)}
                              </span>
                              
                              {selectedPrimary && (
                                <>
                                  <span className="text-slate-300">→</span>
                                  <span className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all duration-300",
                                    selectedCore === "Anger" && "bg-red-100/60 text-red-800 border border-red-200/50",
                                    selectedCore === "Sadness" && "bg-blue-100/60 text-blue-800 border border-blue-200/50",
                                    selectedCore === "Surprise" && "bg-teal-100/60 text-teal-800 border border-teal-200/50",
                                    selectedCore === "Joy" && "bg-amber-100/60 text-amber-800 border border-amber-200/50",
                                    selectedCore === "Love" && "bg-pink-100/60 text-pink-800 border border-pink-200/50",
                                    selectedCore === "Fear" && "bg-green-100/60 text-green-800 border border-green-200/50"
                                  )}>
                                    {translateEmotion(selectedPrimary, language)}
                                  </span>
                                </>
                              )}
                              
                              {selectedTertiary && (
                                <>
                                  <span className="text-slate-300">→</span>
                                  <span className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all duration-300",
                                    selectedCore === "Anger" && "bg-red-500 text-white shadow-red-100",
                                    selectedCore === "Sadness" && "bg-blue-500 text-white shadow-blue-100",
                                    selectedCore === "Surprise" && "bg-teal-500 text-white shadow-purple-100",
                                    selectedCore === "Joy" && "bg-amber-500 text-neutral-900 shadow-amber-100",
                                    selectedCore === "Love" && "bg-pink-500 text-white shadow-pink-100",
                                    selectedCore === "Fear" && "bg-green-500 text-white shadow-green-100"
                                  )}>
                                    {translateEmotion(selectedTertiary, language)}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            <p className="text-xs text-slate-500 italic mt-1">
                              {isRTL
                                ? `لقد حددت شعور ${translateEmotion(selectedTertiary || selectedPrimary || selectedCore, "ar")}.`
                                : `You've selected the feeling of ${translateEmotion(selectedTertiary || selectedPrimary || selectedCore, "en")}.`}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600/90 text-sm">
                            <span className="animate-pulse h-2 w-2 rounded-full bg-amber-500" />
                            <span>
                              {t("Please tap a segment on the wheel to select your feeling")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action to clear the current selection path */}
                    {selectedCore && (
                      <button
                        type="button"
                        onClick={() => {
                          form.setValue("coreEmotion", "");
                          form.setValue("primaryEmotion", "");
                          form.setValue("tertiaryEmotion", "");
                          form.trigger("coreEmotion");
                        }}
                        className={cn("text-xs text-slate-400 hover:text-teal-700 hover:underline transition-colors w-fit", isRTL ? "text-right" : "text-left")}
                      >
                        {t("✕ Clear Selection")}
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Step 2: Rate Intensity */}
              {currentStep === 2 && (
                <div className="space-y-4" data-testid="step-rate-intensity">
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                    <h3 className="font-semibold text-sm text-teal-700 mb-1.5">{t("Why rate intensity?")}</h3>
                    <p className="text-sm text-slate-600">
                      {t("Rating how strongly you felt an emotion helps you track patterns over time. A rating of 1 means you barely noticed it, while 10 means it was overwhelming.")}
                    </p>
                  </div>
                  
                  <FormField
                     control={form.control}
                    name="intensity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-700">{t("How intensely did you feel this emotion?")}</FormLabel>
                        <div className="mt-4 mb-2 flex flex-col space-y-4">
                          <div className="flex items-center space-x-3 rtl:space-x-reverse w-full">
                            <span className="text-xs sm:text-sm text-slate-500 sm:min-w-[80px]">{t("Mild (1)")}</span>
                            <FormControl>
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                                className="flex-grow h-3 [&_[role=slider]]:bg-teal-800 [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-rose-300 [&_.bg-primary]:via-rose-500 [&_.bg-primary]:to-rose-700"
                                data-testid="slider-intensity"
                              />
                            </FormControl>
                            <span className={cn("text-xs sm:text-sm text-slate-500 sm:min-w-[120px]", isRTL ? "text-left" : "text-right")}>{t("Intense (10)")}</span>
                          </div>
                          <div className="flex justify-center">
                            <span className="px-6 py-3 rounded-2xl bg-teal-800 text-white text-2xl font-bold shadow-sm">
                              {tNum(field.value)}
                            </span>
                          </div>
                        </div>
                        <FormDescription className="text-center text-slate-500">
                          {t("Current rating:")} <strong>{tNum(field.value)}/{tNum(10)}</strong>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Step 3: Describe Situation */}
              {currentStep === 3 && (
                <div className="space-y-4" data-testid="step-describe-situation">
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                    <h3 className="font-semibold text-sm text-teal-700 mb-1.5">{t("Why describe the situation?")}</h3>
                    <p className="text-sm text-slate-600">
                      {t("Documenting what triggered your emotion helps identify patterns and develop better coping strategies over time. Be as specific as possible.")}
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="situation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-700 flex items-center gap-2">
                          {t("What happened? (Situation)")} <span className="text-rose-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("Example: My boss criticized my work in front of the team during the meeting...")}
                            className="resize-none w-full min-h-[120px] text-base rounded-xl border-slate-200 focus-visible:ring-purple-500"
                            rows={5}
                            {...field}
                            data-testid="textarea-situation"
                          />
                        </FormControl>
                        <FormDescription>
                          <div className="space-y-2 mt-2">
                            <p className="text-sm font-medium">{t("Example situations:")}</p>
                            <ul className="text-xs text-slate-500 space-y-1 pl-4">
                              <li>• "{t(EXAMPLE_SITUATIONS[0])}"</li>
                              <li>• "{t(EXAMPLE_SITUATIONS[1])}"</li>
                              <li>• "{t(EXAMPLE_SITUATIONS[2])}"</li>
                            </ul>
                          </div>
                        </FormDescription>
                        <FormMessage />
                        {field.value && field.value.length < 10 && (
                          <p className="text-sm text-amber-600 mt-2">
                            {t("Please provide more detail")} ({tNum(field.value.length)}/{tNum(10)} {t("characters minimum")})
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Step 4: Add Context */}
              {currentStep === 4 && (
                <div className="space-y-4" data-testid="step-add-context">
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                    <h3 className="font-semibold text-sm text-teal-700 mb-1.5">{t("Additional context (optional)")}</h3>
                    <p className="text-sm text-slate-600">
                      {t("These optional details help you understand when and where certain emotions tend to occur.")}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Where were you?")}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-location">
                                <SelectValue placeholder={t("Select a location")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="home">{t("Home")}</SelectItem>
                              <SelectItem value="work">{t("Work")}</SelectItem>
                              <SelectItem value="school">{t("School")}</SelectItem>
                              <SelectItem value="public">{t("Public Place")}</SelectItem>
                              <SelectItem value="other">{t("Other")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Who were you with?")}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-company">
                                <SelectValue placeholder={t("Select an option")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="alone">{t("Alone")}</SelectItem>
                              <SelectItem value="family">{t("Family")}</SelectItem>
                              <SelectItem value="friends">{t("Friends")}</SelectItem>
                              <SelectItem value="coworkers">{t("Coworkers")}</SelectItem>
                              <SelectItem value="strangers">{t("Strangers")}</SelectItem>
                              <SelectItem value="other">{t("Other")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="useCurrentTime"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>{t("When did this happen?")}</FormLabel>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(!!checked);
                                  handleCurrentTimeChange(!!checked);
                                }}
                                data-testid="checkbox-current-time"
                              />
                            </FormControl>
                            <Label htmlFor="current-time" className="text-sm text-neutral-600 cursor-pointer">
                              {t("Use current time")}
                            </Label>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="timestamp"
                      render={({ field }) => {
                        const isDisabled = form.getValues("useCurrentTime");
                        const formattedDisplay = formatTimestamp(field.value);

                        return (
                          <FormItem>
                            <FormControl>
                              <div className="relative w-full">
                                {/* Visually gorgeous custom premium input */}
                                <div className="relative w-full">
                                  <Input
                                    type="text"
                                    readOnly
                                    disabled={isDisabled}
                                    value={formattedDisplay}
                                    className="w-full pl-3 pr-10 cursor-pointer bg-white"
                                    data-testid="input-timestamp-display"
                                  />
                                  <div className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Calendar className="h-4 w-4" />
                                  </div>
                                </div>
                                
                                {/* Hidden actual native datetime-local input filled completely over it */}
                                {!isDisabled && (
                                  <input
                                    type="datetime-local"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    data-testid="input-timestamp"
                                  />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </div>
              )}
              
              <WizardNavButtons
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={handlePreviousStep}
                onNext={handleNextStep}
                onSubmit={() => form.handleSubmit(onSubmit)()}
                footerClassName={currentStep === 0 ? "pt-5 mt-1" : undefined}
                nextDisabled={
                  (currentStep === 1 && !form.getValues("coreEmotion")) ||
                  (currentStep === 3 && (!form.getValues("situation") || form.getValues("situation").length < 10))
                }
                submitDisabled={
                  !form.getValues("coreEmotion") ||
                  !form.getValues("situation") ||
                  form.getValues("situation").length < 10
                }
                submitLabel={t("Record Emotion")}
                nextButtonClassName="bg-teal-800 hover:bg-teal-700 text-white"
                submitButtonClassName="bg-teal-800 hover:bg-teal-700 text-white"
                extraActions={
                  currentStep === totalSteps - 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.handleSubmit(onSubmit)()}
                      disabled={!form.getValues("coreEmotion") || !form.getValues("situation") || form.getValues("situation").length < 10}
                      data-testid="button-skip-context"
                    >
                      {t("Skip & Record")}
                    </Button>
                  ) : null
                }
              />
            </form>
          </Form>
        </CardContent>
      </div>
      
      {/* Success Dialog with Insights */}
      <WizardSuccessDialog
        open={showSuccessDialog && !!recordedEmotion}
        onOpenChange={(open) => !open && setShowSuccessDialog(false)}
        title={t("Emotion Recorded Successfully!")}
        description={t("Your emotion has been tracked. Here are your insights:")}
      >
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{t("Total Tracked")}</p>
              <p className="text-2xl font-bold text-rose-500 mt-2">{tNum(totalEmotions + 1)}</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {totalEmotions === 0 ? t("First emotion!") : `${tNum(totalEmotions)} ${t("before this")}`}
                </span>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{t("Most Common")}</p>
              <p className="text-base font-bold text-teal-700 mt-2 truncate">
                {mostCommonEmotion ? translateEmotion(mostCommonEmotion[0], currentLanguage) : "—"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {mostCommonEmotion ? `${tNum(mostCommonEmotion[1])} ${t("times tracked")}` : ""}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{t("This Emotion")}</p>
              <p className="text-base font-bold text-slate-800 mt-2 truncate">
                {translateEmotion(currentEmotionName, currentLanguage)}
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-0.5 mt-1">
                <span className="font-bold text-teal-700">{tNum(currentIntensity)}</span>
                <span>/{tNum(10)}</span>
              </p>
            </div>
          </div>

          {totalEmotions < 3 && (
            <div className="bg-teal-50 px-4 py-3 rounded-xl border border-teal-100">
              <p className="text-sm text-teal-700 font-medium">
                {t("Track")} {tNum(3 - totalEmotions)} {t("more emotion(s) to unlock detailed pattern insights.")}
              </p>
            </div>
          )}

          <div className="text-sm text-slate-500 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
            <strong className="text-slate-700">{t("Tip:")}</strong>{" "}
            {t("You can connect thoughts to this emotion later by visiting your emotion history.")}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-1">
            <Button
              size="lg"
              className="flex items-center justify-center gap-2 h-11 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold"
              onClick={() => {
                setShowSuccessDialog(false);
                form.reset({
                  coreEmotion: "",
                  primaryEmotion: "",
                  tertiaryEmotion: "",
                  intensity: 5,
                  situation: "",
                  location: "",
                  company: "",
                  timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                  useCurrentTime: true,
                });
                setCurrentStep(1);
              }}
              data-testid="button-record-another"
            >
              <RefreshCw className="h-4 w-4" />
              {t("Track Another Emotion")}
            </Button>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                size="lg"
                variant="outline"
                className="flex items-center justify-center gap-2 h-11 rounded-xl border-slate-200 hover:border-teal-200 hover:bg-teal-50 text-sm"
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate("/emotions?tab=history");
                }}
                data-testid="button-view-history"
              >
                <Calendar className="h-4 w-4" />
                {t("View Emotion History")}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="flex items-center justify-center gap-2 h-11 rounded-xl border-slate-200 hover:border-teal-200 hover:bg-teal-50 text-sm"
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate("/dashboard");
                }}
                data-testid="button-go-dashboard"
              >
                <Home className="h-4 w-4" />
                {t("Back to Dashboard")}
              </Button>
            </div>
          </div>
        </>
      </WizardSuccessDialog>
    </>
  );
}
