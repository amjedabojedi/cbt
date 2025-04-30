import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function EmotionTrackingForm({
  language = "en",
  direction = "ltr",
  onEmotionRecorded,
}: EmotionTrackingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
    form.setValue("coreEmotion", selection.coreEmotion);
    form.setValue("primaryEmotion", selection.primaryEmotion);
    form.setValue("tertiaryEmotion", selection.tertiaryEmotion);
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
      
      // Format data for API
      const emotionData = {
        userId: user.id,
        coreEmotion: data.coreEmotion,
        primaryEmotion: data.primaryEmotion,
        tertiaryEmotion: data.tertiaryEmotion,
        intensity: data.intensity,
        situation: data.situation,
        location: data.location,
        company: data.company,
        timestamp: data.useCurrentTime ? new Date() : new Date(data.timestamp || ""),
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
      
      // Store the recorded emotion and show reflection wizard
      setRecordedEmotion(recordedEmotion);
      setShowReflectionWizard(true);
      
      // Notify parent component
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
            >
              Record Emotion
            </Button>
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
