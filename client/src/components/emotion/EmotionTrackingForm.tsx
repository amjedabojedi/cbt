import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import useActiveUser from "@/hooks/use-active-user";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InfoIcon, HelpCircle, ArrowRight, Check, RefreshCw, Home } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResearchTooltip } from "@/components/ui/research-tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import EmotionWheelResponsive from "./EmotionWheelResponsive";
import ReflectionWizard from "../reflection/ReflectionWizard";

// Define schema for the form
const formSchema = z.object({
  coreEmotion: z.string().min(1, "Core emotion is required"),
  primaryEmotion: z.string().optional(),
  tertiaryEmotion: z.string().optional(),
  intensity: z.number().min(1).max(10),
  situation: z.string().min(3, "Please describe the situation"),
  location: z.string().optional(),
  company: z.string().optional(),
  timestamp: z.string().optional(),
  useCurrentTime: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface EmotionTrackingFormProps {
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
    
    // Default fallback
    "default": "bg-gray-500 text-white"
  };
  
  return colorMap[emotion] || colorMap.default;
};

export default function EmotionTrackingForm({
  language = "en",
  direction = "ltr",
  onEmotionRecorded,
}: EmotionTrackingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isViewingSelf } = useActiveUser();
  const [showReflectionWizard, setShowReflectionWizard] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [recordedEmotion, setRecordedEmotion] = useState<any>(null);
  const [, navigate] = useLocation();
  
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
    
    // Force form validation update to make the button enabled immediately
    form.trigger("coreEmotion");
  };
  
  // Handle current time checkbox change
  const handleCurrentTimeChange = (checked: boolean) => {
    form.setValue("useCurrentTime", checked);
    if (checked) {
      form.setValue("timestamp", format(new Date(), "yyyy-MM-dd'T'HH:mm"));
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
      
      // Validate required fields manually before sending to server
      if (!data.situation || data.situation.trim() === "") {
        form.setError("situation", {
          type: "manual",
          message: "Please describe the situation that led to this emotion"
        });
        toast({
          title: "Missing information",
          description: "Please describe the situation that led to this emotion",
          variant: "destructive",
        });
        return;
      }
      
      // Format data for API
      const emotionData = {
        userId: user.id,
        coreEmotion: data.coreEmotion,
        // Only include fields if they actually have values
        ...(data.primaryEmotion ? { primaryEmotion: data.primaryEmotion } : {}),
        ...(data.tertiaryEmotion ? { tertiaryEmotion: data.tertiaryEmotion } : {}),
        intensity: data.intensity,
        situation: data.situation.trim(), // Ensure it's not empty
        location: data.location || null, // Use null instead of empty string
        company: data.company || null, // Use null instead of empty string
        // Send ISO string - schema will convert it to Date
        timestamp: data.useCurrentTime 
          ? new Date().toISOString() 
          : new Date(data.timestamp || "").toISOString(),
      };
      
      // Submit to API
      const response = await apiRequest(
        "POST", 
        `/api/users/${user.id}/emotions`, 
        emotionData
      );
      
      const recordedEmotion = await response.json();
      
      // Invalidate emotion records query to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/emotions`] });
      
      // Reset form to default values
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
      
      // Show success message
      toast({
        title: "Emotion Recorded",
        description: "Your emotion has been recorded successfully.",
      });
      
      // Store the recorded emotion
      setRecordedEmotion(recordedEmotion);
      
      // Show success dialog instead of immediately going to reflection wizard
      setShowSuccessDialog(true);
      
      // Notify parent component
      if (onEmotionRecorded) {
        onEmotionRecorded();
      }
    } catch (error) {
      console.error("Error recording emotion:", error);
      
      // Try to extract more detailed error information if available
      let errorMsg = "Failed to record emotion. Please try again.";
      try {
        if (error instanceof Response || (error as any).json) {
          const errorData = await (error as Response).json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
            if (errorData.errors && Array.isArray(errorData.errors)) {
              errorMsg += ": " + errorData.errors.map((e: any) => e.message).join(", ");
            }
          }
        }
      } catch (e) {
        // If parsing the error response fails, fall back to generic error
      }
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Emotion Wheel Section */}
          <div className="space-y-4">
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
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Educational Component */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium">Emotion Wheel</h3>
                  <ResearchTooltip 
                    content="People who can identify specific emotions are better at managing stress and react less impulsively to difficult situations."
                    research="Kashdan, Barrett, & McKnight (2015)" 
                  />
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1 w-full sm:w-auto justify-center">
                      <InfoIcon className="h-4 w-4" />
                      <span>About Emotions</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Understanding the Emotion Wheel</DialogTitle>
                      <DialogDescription>
                        The emotion wheel helps you identify and differentiate between emotions with greater precision.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 my-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Why Emotional Awareness Matters</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm">
                            Recognizing your emotions with precision is a key skill in cognitive behavioral therapy. 
                            When you can accurately identify what you're feeling, you can better understand your 
                            thoughts and behaviors, and work more effectively on changing patterns that aren't serving you well.
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Accordion type="single" collapsible>
                        <AccordionItem value="core-emotions">
                          <AccordionTrigger className="text-base font-medium">Core Emotions (Inner Ring)</AccordionTrigger>
                          <AccordionContent className="text-sm">
                            <p className="mb-2">
                              The six core emotions represented in the inner ring are foundational emotional experiences shared across cultures:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li><strong className="text-red-500">Anger</strong> - A strong feeling of displeasure, usually arising from a perceived wrong or threat</li>
                              <li><strong className="text-blue-500">Sadness</strong> - Feelings of loss, disappointment, or helplessness</li>
                              <li><strong className="text-purple-500">Surprise</strong> - A brief emotional state experienced as the result of an unexpected event</li>
                              <li><strong className="text-yellow-500">Joy</strong> - A feeling of great pleasure and happiness</li>
                              <li><strong className="text-pink-500">Love</strong> - A deep feeling of affection, attachment, or devotion</li>
                              <li><strong className="text-green-500">Fear</strong> - An unpleasant emotion caused by the threat of danger, pain, or harm</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="primary-emotions">
                          <AccordionTrigger className="text-base font-medium">Primary Emotions (Middle Ring)</AccordionTrigger>
                          <AccordionContent className="text-sm">
                            <p className="mb-2">
                              Primary emotions are more specific variations of core emotions. They help narrow down exactly what you're feeling:
                            </p>
                            <p className="mb-2">
                              For example, "Sadness" as a core emotion branches into primary emotions like:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li><strong>Suffering</strong> - Experiencing pain or distress</li>
                              <li><strong>Disappointment</strong> - Feeling let down by unfulfilled expectations</li>
                              <li><strong>Shameful</strong> - Feeling embarrassed or humiliated</li>
                              <li><strong>Neglected</strong> - Feeling ignored or uncared for</li>
                              <li><strong>Despair</strong> - Complete loss of hope</li>
                            </ul>
                            <p className="mt-2">
                              By identifying the primary emotion, you gain more insight into what's driving your feelings.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="tertiary-emotions">
                          <AccordionTrigger className="text-base font-medium">Tertiary Emotions (Outer Ring)</AccordionTrigger>
                          <AccordionContent className="text-sm">
                            <p className="mb-2">
                              Tertiary emotions are the most specific and nuanced expressions of emotion. They provide the most precise language for your experience:
                            </p>
                            <p className="mb-2">
                              For example, if you identify "Disappointment" as your primary emotion, you might further specify whether you're feeling:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li><strong>Dismayed</strong> - Upset and worried by an unpleasant surprise</li>
                              <li><strong>Displeased</strong> - Feeling annoyed or dissatisfied</li>
                            </ul>
                            <p className="mt-2">
                              These subtle distinctions help you communicate more clearly with yourself and others about your emotional experience.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="tracking-benefits">
                          <AccordionTrigger className="text-base font-medium">Benefits of Emotion Tracking</AccordionTrigger>
                          <AccordionContent className="text-sm">
                            <ul className="list-disc pl-5 space-y-1">
                              <li><strong>Increased self-awareness</strong> - Recognizing patterns in your emotional responses</li>
                              <li><strong>Improved emotional regulation</strong> - Better ability to manage strong feelings</li>
                              <li><strong>Enhanced communication</strong> - More precise language to express your needs</li>
                              <li><strong>Better therapy outcomes</strong> - More effective work with thoughts and behaviors</li>
                              <li><strong>Reduced emotional reactivity</strong> - Less likely to be overwhelmed by feelings</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                <span>Click on the wheel to select your current emotion</span>
              </div>
            </div>

            <EmotionWheelResponsive 
              language={language} 
              direction={direction} 
              onEmotionSelect={handleEmotionSelect} 
            />
            
            {!form.getValues("coreEmotion") && (
              <div className="text-sm text-amber-600 mt-2">
                Please select an emotion from the wheel above
              </div>
            )}
            
            {form.getValues("coreEmotion") && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <TooltipProvider>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Your Selected Emotion:</h4>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div>You can select emotions from any level - core emotions (inner ring), primary emotions (middle ring), or tertiary emotions (outer ring).</div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium bg-opacity-20 ${getEmotionColor(form.getValues("coreEmotion"))}`}>
                      {form.getValues("coreEmotion")}
                    </span>
                    
                    {form.getValues("primaryEmotion") && (
                      <>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium bg-opacity-30 ${getEmotionColor(form.getValues("coreEmotion"))}`}>
                          {form.getValues("primaryEmotion")}
                        </span>
                      </>
                    )}
                    
                    {form.getValues("tertiaryEmotion") && (
                      <>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium bg-opacity-40 ${getEmotionColor(form.getValues("coreEmotion"))}`}>
                          {form.getValues("tertiaryEmotion")}
                        </span>
                      </>
                    )}
                  </div>
                </TooltipProvider>
              </div>
            )}
          </div>
          
          {/* Emotion Intensity - Enhanced for mobile */}
          <FormField
            control={form.control}
            name="intensity"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-wrap items-center gap-1">
                  <FormLabel className="text-base">Intensity (1-10)</FormLabel>
                  <ResearchTooltip 
                    content="Rating the intensity of emotions helps build self-awareness and improves emotion regulation."
                    research="Linehan (1993) in Dialectical Behavior Therapy" 
                  />
                </div>
                <div className="mt-2 mb-1 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <div className="flex items-center space-x-2 w-full mb-2 sm:mb-0">
                    <span className="text-xs text-neutral-500 min-w-[30px]">Low</span>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        defaultValue={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        className="flex-grow h-2 intensity-slider bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600"
                      />
                    </FormControl>
                    <span className="text-xs text-neutral-500 min-w-[30px]">High</span>
                  </div>
                  <div className="flex justify-center sm:justify-start">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-center font-medium min-w-[40px]">
                      {field.value}
                    </span>
                  </div>
                </div>
                <FormDescription className="text-xs sm:text-sm">
                  How strongly did you feel this emotion?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Situation Description - Improved mobile experience */}
          <FormField
            control={form.control}
            name="situation"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-wrap items-center gap-1">
                  <FormLabel className="text-base">What happened? (Situation)</FormLabel>
                  <ResearchTooltip 
                    content="Documenting the situation that triggered your emotion helps identify patterns and develop more effective responses."
                    research="Beck & Haigh (2014) on cognitive models of emotional disorders" 
                  />
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Describe what happened that led to this emotion..."
                    className="resize-none w-full min-h-[80px]"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs sm:text-sm">
                  Be specific about what triggered your emotion
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Location and Company in a responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location Dropdown */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Where were you?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
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
            
            {/* Company Dropdown */}
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Who were you with?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
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
          
          {/* Time Selection with Responsive Layout */}
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
                      />
                    </FormControl>
                    <Label htmlFor="current-time" className="text-sm text-neutral-600">
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Submit Button - Full width on mobile, right-aligned on larger screens */}
          <div className="flex sm:justify-end mt-2">
            <Button 
              type="submit" 
              disabled={!form.getValues("coreEmotion")}
              className={`w-full sm:w-auto ${form.getValues("coreEmotion") ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"}`}
            >
              {form.getValues("coreEmotion") ? "Record Emotion" : "Select an Emotion First"}
            </Button>
          </div>
          
          {/* Debug info - remove in production */}
          <div className="text-xs text-gray-400 mt-2">
            Selected emotion: {form.getValues("coreEmotion") ? `${form.getValues("coreEmotion")}${form.getValues("primaryEmotion") ? ` → ${form.getValues("primaryEmotion")}` : ''}${form.getValues("tertiaryEmotion") ? ` → ${form.getValues("tertiaryEmotion")}` : ''}` : "None"}
          </div>
        </form>
      </Form>
      
      {/* Success Dialog with Options */}
      <Dialog open={showSuccessDialog && !!recordedEmotion} onOpenChange={(open) => !open && setShowSuccessDialog(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Check className="h-6 w-6 text-green-500 mr-2" />
              Emotion Recorded Successfully
            </DialogTitle>
            <DialogDescription>
              Your emotion has been tracked. What would you like to do next?
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <p className="text-sm text-gray-500">
              The emotion you recorded has been saved. Remember that you can always connect thoughts to emotions later by visiting your emotion history.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <Button 
                variant="default" 
                className="flex items-center justify-center gap-2"
                onClick={() => {
                  setShowSuccessDialog(false);
                  if (recordedEmotion) {
                    window.location.href = `/thoughts/new?emotionId=${recordedEmotion.id}`;
                  }
                }}
              >
                <ArrowRight className="h-4 w-4" />
                Add Thought Record
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2"
                onClick={() => {
                  setShowSuccessDialog(false);
                  // Reset form to create a new emotion record
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
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Record Another
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2"
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate("/");
                }}
              >
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Reflection Wizard Modal */}
      {showReflectionWizard && recordedEmotion && (
        <ReflectionWizard
          emotion={recordedEmotion}
          open={showReflectionWizard}
          onClose={() => setShowReflectionWizard(false)}
        />
      )}
    </>
  );
}
