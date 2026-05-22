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
  const { user } = useAuth();
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
      
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <WizardProgressHeader
          title="Track Your Emotion"
          icon={Heart}
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={["Select", "Rate", "Describe", "Details"]}
          accentClassName="text-purple-900"
          hideProgressOnIntro
          trailing={
            onLanguageToggle ? (
              <button
                type="button"
                onClick={onLanguageToggle}
                className="flex items-center gap-1.5 text-slate-500 hover:text-purple-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-purple-200 bg-white text-sm font-medium transition-colors"
              >
                <Globe className="h-4 w-4" />
                {languageLabel}
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
                    <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] shrink-0 bg-gradient-to-br from-rose-500 via-purple-600 to-[#090514] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/15 mx-auto sm:mx-0">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <div className="min-w-0 text-center sm:text-left">
                      <h2 className="text-2xl sm:text-[1.65rem] font-bold text-[#090514] tracking-tight leading-tight">
                        Welcome to Emotion Tracking
                      </h2>
                      <p className="text-base text-slate-500 mt-2 leading-relaxed max-w-xl mx-auto sm:mx-0">
                        Log how you feel in four short steps. This builds self-awareness and helps you spot patterns over time.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {INTRO_STEPS.map(({ n, label, hint }) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 flex flex-col items-center sm:items-start text-center sm:text-left"
                      >
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#090514] text-sm font-bold text-white mb-3">
                          {n}
                        </span>
                        <p className="font-bold text-base text-slate-800">{label}</p>
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{hint}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-5">
                      <div className="p-2.5 h-fit rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-base text-slate-800">Identify patterns</p>
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                          See which emotions show up most and what tends to trigger them.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
                      <div className="p-2.5 h-fit rounded-xl bg-purple-100 text-purple-600 border border-purple-200">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-base text-slate-800">Build awareness</p>
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                          Naming emotions clearly is a core skill in CBT and everyday wellbeing.
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
                      <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-100/80">
                        <div className="flex items-center gap-2 text-purple-900 font-semibold text-sm mb-1.5">
                          <Sparkles className="h-4 w-4" />
                          <span>{language === "ar" ? "نصيحة تفاعلية" : "Interactive Guide"}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {language === "ar" 
                            ? "اضغط على أي جزء في عجلة المشاعر. الدوائر الخارجية توضح مشاعر أكثر دقة وتفصيلاً."
                            : "Tap any segment on the emotion wheel. The outer rings reveal more specific, granular feelings."}
                        </p>
                      </div>

                      {/* Live feedback card for selection */}
                      <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-4 space-y-3 min-h-[140px] flex flex-col justify-center">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {language === "ar" ? "التحديد الحالي" : "Current Selection"}
                        </div>
                        
                        {selectedCore ? (
                          <div className="flex flex-col gap-2">
                            {/* Horizontal breadcrumb trail using stylized badges */}
                            <div className="flex items-center gap-1.5 flex-wrap text-sm text-slate-700 font-medium">
                              <span className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all duration-300",
                                selectedCore === "Anger" && "bg-red-50 text-red-700 border border-red-100",
                                selectedCore === "Sadness" && "bg-blue-50 text-blue-700 border border-blue-100",
                                selectedCore === "Surprise" && "bg-purple-50 text-purple-700 border border-purple-100",
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
                                    selectedCore === "Surprise" && "bg-purple-100/60 text-purple-800 border border-purple-200/50",
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
                                    selectedCore === "Surprise" && "bg-purple-500 text-white shadow-purple-100",
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
                              {language === "ar"
                                ? `لقد حددت شعور ${translateEmotion(selectedTertiary || selectedPrimary || selectedCore, language)}.`
                                : `You've selected the feeling of ${translateEmotion(selectedTertiary || selectedPrimary || selectedCore, language)}.`}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600/90 text-sm">
                            <span className="animate-pulse h-2 w-2 rounded-full bg-amber-500" />
                            <span>
                              {language === "ar"
                                ? "الرجاء النقر على العجلة لاختيار شعورك"
                                : "Please tap a segment on the wheel to select your feeling"}
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
                        className="text-xs text-slate-400 hover:text-purple-900 hover:underline transition-colors w-fit text-left"
                      >
                        {language === "ar" ? "✕ إعادة تعيين الاختيار" : "✕ Clear Selection"}
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Step 2: Rate Intensity */}
              {currentStep === 2 && (
                <div className="space-y-4" data-testid="step-rate-intensity">
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <h3 className="font-semibold text-sm text-purple-900 mb-1.5">Why rate intensity?</h3>
                    <p className="text-sm text-slate-600">
                      Rating how strongly you felt an emotion helps you track patterns over time. 
                      A rating of 1 means you barely noticed it, while 10 means it was overwhelming.
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="intensity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-700">How intensely did you feel this emotion?</FormLabel>
                        <div className="mt-4 mb-2 flex flex-col space-y-4">
                          <div className="flex items-center space-x-3 w-full">
                            <span className="text-xs sm:text-sm text-slate-500 sm:min-w-[80px]">Mild (1)</span>
                            <FormControl>
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                                className="flex-grow h-3 [&_[role=slider]]:bg-[#090514] [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-rose-300 [&_.bg-primary]:via-purple-500 [&_.bg-primary]:to-[#090514]"
                                data-testid="slider-intensity"
                              />
                            </FormControl>
                            <span className="text-xs sm:text-sm text-slate-500 sm:min-w-[120px] text-right">Intense (10)</span>
                          </div>
                          <div className="flex justify-center">
                            <span className="px-6 py-3 rounded-2xl bg-[#090514] text-white text-2xl font-bold shadow-sm">
                              {field.value}
                            </span>
                          </div>
                        </div>
                        <FormDescription className="text-center text-slate-500">
                          Current rating: <strong>{field.value}/10</strong>
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
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <h3 className="font-semibold text-sm text-purple-900 mb-1.5">Why describe the situation?</h3>
                    <p className="text-sm text-slate-600">
                      Documenting what triggered your emotion helps identify patterns and develop better coping strategies over time.
                      Be as specific as possible.
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="situation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-700 flex items-center gap-2">
                          What happened? (Situation) <span className="text-rose-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Example: My boss criticized my work in front of the team during the meeting..."
                            className="resize-none w-full min-h-[120px] text-base rounded-xl border-slate-200 focus-visible:ring-purple-500"
                            rows={5}
                            {...field}
                            data-testid="textarea-situation"
                          />
                        </FormControl>
                        <FormDescription>
                          <div className="space-y-2 mt-2">
                            <p className="text-sm font-medium">Example situations:</p>
                            <ul className="text-xs text-slate-500 space-y-1 pl-4">
                              <li>• "{EXAMPLE_SITUATIONS[0]}"</li>
                              <li>• "{EXAMPLE_SITUATIONS[1]}"</li>
                              <li>• "{EXAMPLE_SITUATIONS[2]}"</li>
                            </ul>
                          </div>
                        </FormDescription>
                        <FormMessage />
                        {field.value && field.value.length < 10 && (
                          <p className="text-sm text-amber-600 mt-2">
                            Please provide more detail ({field.value.length}/10 characters minimum)
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
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <h3 className="font-semibold text-sm text-purple-900 mb-1.5">Additional context (optional)</h3>
                    <p className="text-sm text-slate-600">
                      These optional details help you understand when and where certain emotions tend to occur.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Where were you?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-location">
                                <SelectValue placeholder="Select a location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="home">Home</SelectItem>
                              <SelectItem value="work">Work</SelectItem>
                              <SelectItem value="school">School</SelectItem>
                              <SelectItem value="public">Public Place</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
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
                          <FormLabel>Who were you with?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-company">
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="alone">Alone</SelectItem>
                              <SelectItem value="family">Family</SelectItem>
                              <SelectItem value="friends">Friends</SelectItem>
                              <SelectItem value="coworkers">Coworkers</SelectItem>
                              <SelectItem value="strangers">Strangers</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
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
                          <FormLabel>When did this happen?</FormLabel>
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
                              Use current time
                            </Label>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="timestamp"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              disabled={form.getValues("useCurrentTime")}
                              className="w-full"
                              {...field}
                              data-testid="input-timestamp"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
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
                submitLabel="Record Emotion"
                nextButtonClassName="bg-[#090514] hover:bg-purple-950 text-white"
                submitButtonClassName="bg-[#090514] hover:bg-purple-950 text-white"
                extraActions={
                  currentStep === totalSteps - 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.handleSubmit(onSubmit)()}
                      disabled={!form.getValues("coreEmotion") || !form.getValues("situation") || form.getValues("situation").length < 10}
                      data-testid="button-skip-context"
                    >
                      Skip & Record
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
        title="Emotion Recorded Successfully!"
        description="Your emotion has been tracked. Here are your insights:"
      >
          <>
            {/* Insights Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Tracked</p>
                <p className="text-2xl font-bold text-rose-500 mt-1">{totalEmotions + 1}</p>
                <p className="text-xs text-slate-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {totalEmotions === 0 ? "First emotion!" : `${totalEmotions} before this`}
                </p>
              </div>

              {mostCommonEmotion && (
                <div className="bg-white rounded-xl border border-slate-100 p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Most Common</p>
                  <p className="text-lg font-bold text-purple-600 mt-1 truncate">{mostCommonEmotion[0]}</p>
                  <p className="text-xs text-slate-500 mt-1">{mostCommonEmotion[1]} times tracked</p>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This Emotion</p>
                <p className="text-lg font-bold text-[#090514] mt-1 truncate">{currentEmotionName}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <span className="text-lg font-bold text-purple-600">{currentIntensity}</span>
                  <span>/10 intensity</span>
                </p>
              </div>
            </div>

            {totalEmotions < 3 && (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-900 font-medium">
                  Track {3 - totalEmotions} more emotion{3 - totalEmotions > 1 ? "s" : ""} to unlock detailed pattern insights.
                </p>
              </div>
            )}

            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <strong className="text-slate-700">Tip:</strong> You can connect thoughts to this emotion later by visiting your emotion history.
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="flex items-center justify-center gap-2 h-12 bg-[#090514] hover:bg-purple-950 text-white rounded-xl"
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
                <RefreshCw className="h-5 w-5" />
                Track Another Emotion
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="flex items-center justify-center gap-2 h-12 rounded-xl border-slate-200 hover:border-purple-200 hover:bg-purple-50"
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate("/emotions?tab=history");
                }}
                data-testid="button-view-history"
              >
                <Calendar className="h-5 w-5" />
                View Emotion History
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="flex items-center justify-center gap-2 h-12 rounded-xl border-slate-200 hover:border-purple-200 hover:bg-purple-50"
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate("/dashboard");
                }}
                data-testid="button-go-dashboard"
              >
                <Home className="h-5 w-5" />
                Back to Dashboard
              </Button>
            </div>
          </>
      </WizardSuccessDialog>
    </>
  );
}
