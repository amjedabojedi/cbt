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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InfoIcon, HelpCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import EmotionWheel from "./EmotionWheel";
import ReflectionWizard from "../reflection/ReflectionWizard";

// Define schema for the form
const formSchema = z.object({
  coreEmotion: z.string().min(1, "Core emotion is required"),
  primaryEmotion: z.string().min(1, "Primary emotion is required"),
  tertiaryEmotion: z.string().min(1, "Tertiary emotion is required"),
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
  const { isViewingClientData } = useActiveUser();
  const [showReflectionWizard, setShowReflectionWizard] = useState(false);
  const [recordedEmotion, setRecordedEmotion] = useState<any>(null);
  
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
    console.log("EmotionTrackingForm received selection:", selection);
    
    form.setValue("coreEmotion", selection.coreEmotion);
    form.setValue("primaryEmotion", selection.primaryEmotion);
    form.setValue("tertiaryEmotion", selection.tertiaryEmotion);
    
    // Force form validation update to make the button enabled immediately
    form.trigger("tertiaryEmotion");
    
    console.log("Updated form values:", {
      core: form.getValues("coreEmotion"),
      primary: form.getValues("primaryEmotion"),
      tertiary: form.getValues("tertiaryEmotion")
    });
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
        primaryEmotion: data.primaryEmotion,
        tertiaryEmotion: data.tertiaryEmotion,
        intensity: data.intensity,
        situation: data.situation.trim(), // Ensure it's not empty
        location: data.location || "", // Ensure it's not undefined
        company: data.company || "", // Ensure it's not undefined
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
      
      // Show success message
      toast({
        title: "Emotion Recorded",
        description: "Your emotion has been recorded successfully.",
      });
      
      // Store the recorded emotion
      setRecordedEmotion(recordedEmotion);
      
      // Only show reflection wizard if user is not viewing a client's data
      // Therapists should not be able to add reflections directly when viewing client data
      if (!isViewingClientData) {
        setShowReflectionWizard(true);
      }
      
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
        console.log("Could not parse error details:", e);
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Emotion Wheel</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <InfoIcon className="h-4 w-4" />
                      <span>About Emotions</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
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

            <EmotionWheel 
              language={language} 
              direction={direction} 
              onEmotionSelect={handleEmotionSelect} 
            />
            
            {!form.getValues("tertiaryEmotion") && (
              <div className="text-sm text-amber-600 mt-2">
                Please select an emotion from the wheel above
              </div>
            )}
            
            {form.getValues("tertiaryEmotion") && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <TooltipProvider>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Your Selected Emotion Path:</h4>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Moving from general to specific emotion categories helps you pinpoint your exact feeling state.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium bg-opacity-20 ${getEmotionColor(form.getValues("coreEmotion"))}`}>
                      {form.getValues("coreEmotion")}
                    </span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium bg-opacity-30 ${getEmotionColor(form.getValues("coreEmotion"))}`}>
                      {form.getValues("primaryEmotion")}
                    </span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium bg-opacity-40 ${getEmotionColor(form.getValues("coreEmotion"))}`}>
                      {form.getValues("tertiaryEmotion")}
                    </span>
                  </div>
                </TooltipProvider>
              </div>
            )}
          </div>
          
          {/* Emotion Intensity */}
          <FormField
            control={form.control}
            name="intensity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intensity (1-10)</FormLabel>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-neutral-500">Low</span>
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
                  <span className="text-xs text-neutral-500">High</span>
                  <span className="ml-2 w-8 text-center font-medium">{field.value}</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Situation Description */}
          <FormField
            control={form.control}
            name="situation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What happened? (Situation)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what happened that led to this emotion..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
          
          {/* Time */}
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!form.getValues("tertiaryEmotion")}
              className={form.getValues("tertiaryEmotion") ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"}
            >
              {form.getValues("tertiaryEmotion") ? "Record Emotion" : "Select an Emotion First"}
            </Button>
          </div>
          
          {/* Debug info - remove in production */}
          <div className="text-xs text-gray-400 mt-2">
            Tertiary emotion value: "{form.getValues("tertiaryEmotion")}"
          </div>
        </form>
      </Form>
      
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
