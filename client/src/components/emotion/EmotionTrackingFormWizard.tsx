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
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Check, ArrowRight, RefreshCw, Home, TrendingUp, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import EmotionWheelResponsive from "./EmotionWheelResponsive";
import EmotionOnboardingTour from "./EmotionOnboardingTour";
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
}

// Helper function to get color class based on emotion
const getEmotionColor = (emotion: string): string => {
  const colorMap: Record<string, string> = {
    "Anger": "bg-red-500 text-white",
    "Sadness": "bg-blue-500 text-white",
    "Surprise": "bg-purple-500 text-white",
    "Joy": "bg-yellow-500 text-black",
    "Love": "bg-pink-500 text-white",
    "Fear": "bg-green-500 text-white",
    "default": "bg-gray-500 text-white"
  };
  return colorMap[emotion] || colorMap.default;
};

const EXAMPLE_SITUATIONS = [
  "My boss criticized my work in front of the team during the meeting",
  "My friend canceled our plans at the last minute without explanation",
  "I received unexpected positive feedback on my presentation",
  "Someone cut me off in traffic and nearly caused an accident",
  "I had a disagreement with my partner about household responsibilities"
];

export default function EmotionTrackingFormWizard({
  language = "en",
  direction = "ltr",
  onEmotionRecorded,
}: EmotionTrackingFormWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshAfterOperation } = useRefreshData();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [recordedEmotion, setRecordedEmotion] = useState<any>(null);
  const [, navigate] = useLocation();
  const [showTourComplete, setShowTourComplete] = useState(false);
  
  const totalSteps = 4;
  
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
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Handle previous step
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
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
      
      setCurrentStep(1);
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
  
  const progress = (currentStep / totalSteps) * 100;
  
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
      
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <CardTitle>Track Your Emotion</CardTitle>
              <CardDescription>Step {currentStep} of {totalSteps}</CardDescription>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" data-testid="progress-wizard" />
              <div className="flex justify-between text-xs text-gray-500">
                <span className={currentStep >= 1 ? "text-blue-600 font-medium" : ""}>
                  1. Select Emotion
                </span>
                <span className={currentStep >= 2 ? "text-blue-600 font-medium" : ""}>
                  2. Rate Intensity
                </span>
                <span className={currentStep >= 3 ? "text-blue-600 font-medium" : ""}>
                  3. Describe Situation
                </span>
                <span className={currentStep >= 4 ? "text-blue-600 font-medium" : ""}>
                  4. Add Details
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Select Emotion */}
              {currentStep === 1 && (
                <div className="space-y-4" data-testid="step-select-emotion">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-sm mb-2">💡 About This Step</h3>
                    <p className="text-sm text-gray-700">
                      Use the emotion wheel below to identify how you're feeling. Click on any section to select an emotion. 
                      The outer rings represent more specific emotions.
                    </p>
                  </div>
                  
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
                  
                  <EmotionWheelResponsive 
                    language={language} 
                    direction={direction} 
                    onEmotionSelect={handleEmotionSelect} 
                  />
                  
                  {!form.getValues("coreEmotion") && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                      ⚠️ Please select an emotion from the wheel above to continue
                    </div>
                  )}
                  
                  {form.getValues("coreEmotion") && (
                    <div className="mt-3 p-4 bg-green-50 rounded-md border border-green-200">
                      <h4 className="text-sm font-medium mb-2 text-green-900">✓ Emotion Selected:</h4>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`px-3 py-1.5 rounded font-medium ${getEmotionColor(form.getValues("coreEmotion"))}`}>
                          {form.getValues("coreEmotion")}
                        </span>
                        {form.getValues("primaryEmotion") && (
                          <>
                            <span className="text-gray-400">→</span>
                            <span className={`px-3 py-1.5 rounded font-medium ${getEmotionColor(form.getValues("coreEmotion"))} bg-opacity-80`}>
                              {form.getValues("primaryEmotion")}
                            </span>
                          </>
                        )}
                        {form.getValues("tertiaryEmotion") && (
                          <>
                            <span className="text-gray-400">→</span>
                            <span className={`px-3 py-1.5 rounded font-medium ${getEmotionColor(form.getValues("coreEmotion"))} bg-opacity-60`}>
                              {form.getValues("tertiaryEmotion")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Step 2: Rate Intensity */}
              {currentStep === 2 && (
                <div className="space-y-4" data-testid="step-rate-intensity">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-sm mb-2">💡 Why Rate Intensity?</h3>
                    <p className="text-sm text-gray-700">
                      Rating how strongly you felt an emotion helps you track patterns over time. 
                      A rating of 1 means you barely noticed it, while 10 means it was overwhelming.
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="intensity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">How intensely did you feel this emotion?</FormLabel>
                        <div className="mt-4 mb-2 flex flex-col space-y-4">
                          <div className="flex items-center space-x-3 w-full">
                            <span className="text-sm text-neutral-600 min-w-[80px]">Mild (1)</span>
                            <FormControl>
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                                className="flex-grow h-3 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600"
                                data-testid="slider-intensity"
                              />
                            </FormControl>
                            <span className="text-sm text-neutral-600 min-w-[120px]">Intense (10)</span>
                          </div>
                          <div className="flex justify-center">
                            <span className="px-6 py-3 rounded-full bg-blue-600 text-white text-2xl font-bold">
                              {field.value}
                            </span>
                          </div>
                        </div>
                        <FormDescription className="text-center">
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
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-sm mb-2">💡 Why Describe the Situation?</h3>
                    <p className="text-sm text-gray-700">
                      Documenting what triggered your emotion helps identify patterns and develop better coping strategies over time.
                      Be as specific as possible.
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="situation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg flex items-center gap-2">
                          What happened? (Situation) <span className="text-red-500 text-xl">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Example: My boss criticized my work in front of the team during the meeting..."
                            className="resize-none w-full min-h-[120px] text-base"
                            style={{ pointerEvents: 'auto' }}
                            rows={5}
                            {...field}
                            data-testid="textarea-situation"
                          />
                        </FormControl>
                        <FormDescription>
                          <div className="space-y-2 mt-2">
                            <p className="text-sm font-medium">Example situations:</p>
                            <ul className="text-xs text-gray-600 space-y-1 pl-4">
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
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-sm mb-2">💡 Additional Context (Optional)</h3>
                    <p className="text-sm text-gray-700">
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
              
              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1}
                  data-testid="button-previous-step"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={
                      (currentStep === 1 && !form.getValues("coreEmotion")) ||
                      (currentStep === 3 && (!form.getValues("situation") || form.getValues("situation").length < 10))
                    }
                    data-testid="button-next-step"
                  >
                    Next Step
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!form.getValues("coreEmotion") || !form.getValues("situation") || form.getValues("situation").length < 10}
                    data-testid="button-submit-emotion"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Record Emotion
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Success Dialog with Insights */}
      <Dialog open={showSuccessDialog && !!recordedEmotion} onOpenChange={(open) => !open && setShowSuccessDialog(false)}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto" data-testid="dialog-success">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              Emotion Recorded Successfully!
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Your emotion has been tracked. Here are your insights:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Insights Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">Total Tracked</CardDescription>
                  <CardTitle className="text-2xl">{totalEmotions + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {totalEmotions === 0 ? "First emotion!" : `${totalEmotions} before this`}
                  </p>
                </CardContent>
              </Card>
              
              {mostCommonEmotion && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Most Common</CardDescription>
                    <CardTitle className="text-lg">{mostCommonEmotion[0]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500">
                      {mostCommonEmotion[1]} times tracked
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">This Emotion</CardDescription>
                  <CardTitle className="text-lg">{currentEmotionName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-lg font-bold text-blue-600">{currentIntensity}</span>
                    <span>/10 intensity</span>
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {totalEmotions < 3 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-900 font-medium">
                  🎯 Track {3 - totalEmotions} more emotion{3 - totalEmotions > 1 ? 's' : ''} to unlock detailed pattern insights!
                </p>
              </div>
            )}
            
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              💡 <strong>Tip:</strong> You can connect thoughts to this emotion later by visiting your emotion history.
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg"
                variant="default" 
                className="flex items-center justify-center gap-2 h-12"
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
                className="flex items-center justify-center gap-2 h-12"
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
                className="flex items-center justify-center gap-2 h-12"
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
