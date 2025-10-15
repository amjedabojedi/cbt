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
import { useLocation } from "wouter";
import { ThoughtChallengeWizard } from "./ThoughtChallengeWizard";

import {
  Brain,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
  Sparkles,
  Home,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Schema for thought record form
const thoughtRecordSchema = z.object({
  automaticThought: z.string().min(10, "Please provide more detail (minimum 10 characters)"),
  emotionRecordId: z.number().optional().nullable(),
  situation: z.string().min(10, "Please describe the situation (minimum 10 characters)"),
});

type ThoughtRecordFormValues = z.infer<typeof thoughtRecordSchema>;

interface ThoughtRecordWizardProps {
  open: boolean;
  onClose: () => void;
  preselectedEmotionId?: number;
}

export default function ThoughtRecordWizard({ 
  open, 
  onClose,
  preselectedEmotionId,
}: ThoughtRecordWizardProps) {
  const { user } = useAuth();
  const { activeUserId } = useActiveUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showChallengeWizard, setShowChallengeWizard] = useState(false);
  const [recordedThought, setRecordedThought] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Fetch recent emotions for linking
  const { data: emotions } = useQuery<EmotionRecord[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!activeUserId && open,
  });

  // Get recent emotions (last 10)
  const recentEmotions = emotions?.slice(0, 10) || [];

  const form = useForm<ThoughtRecordFormValues>({
    resolver: zodResolver(thoughtRecordSchema),
    mode: "onChange",
    defaultValues: {
      automaticThought: "",
      emotionRecordId: preselectedEmotionId || null,
      situation: "",
    },
  });

  const onSubmit = async (data: ThoughtRecordFormValues) => {
    if (!activeUserId) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest(
        "POST",
        `/api/users/${activeUserId}/thoughts`,
        {
          userId: activeUserId,
          automaticThoughts: data.automaticThought,
          emotionRecordId: data.emotionRecordId || null,
          situation: data.situation,
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
        title: "Success!",
        description: "Your thought has been recorded.",
      });
    } catch (error) {
      console.error("Error recording thought:", error);
      toast({
        title: "Error",
        description: "Failed to record thought. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof ThoughtRecordFormValues)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ["automaticThought"];
    } else if (currentStep === 2) {
      // Step 2 is optional emotion linking
    } else if (currentStep === 3) {
      fieldsToValidate = ["situation"];
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleReset = () => {
    form.reset({
      automaticThought: "",
      emotionRecordId: null,
      situation: "",
    });
    setCurrentStep(1);
    setShowSuccessDialog(false);
    setRecordedThought(null);
  };

  // Get selected emotion details
  const selectedEmotion = recentEmotions.find(
    (e) => e.id === form.watch("emotionRecordId")
  );

  // Step 1: Write Automatic Thought
  const renderStep1 = () => (
    <div className="space-y-6" data-testid="step-write-thought">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">💡 What is an Automatic Thought?</h4>
            <p className="text-sm text-blue-800">
              Automatic thoughts are the immediate, often unconscious thoughts that pop into your mind in response to a situation. They can be positive or negative and significantly influence how you feel.
            </p>
            <p className="text-sm text-blue-800 mt-2">
              <strong>Example:</strong> "I'm going to fail this presentation" or "Nobody likes me" or "I can't handle this"
            </p>
          </div>
        </div>
      </div>

      <FormField
        control={form.control}
        name="automaticThought"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5" />
              What automatic thought did you have? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription>
              Write down the exact thought that came to mind. Be as specific as possible.
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="e.g., I'm going to embarrass myself in front of everyone..."
                className="resize-none w-full min-h-[120px] text-base"
                rows={5}
                {...field}
                data-testid="textarea-automatic-thought"
              />
            </FormControl>
            <div className="flex justify-between items-center text-sm">
              <FormMessage />
              <span className={`${(field.value || "").length < 10 ? 'text-red-500' : 'text-green-600'}`}>
                {(field.value || "").length}/10 characters minimum
              </span>
            </div>
          </FormItem>
        )}
      />

      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium mb-2">Common Automatic Thoughts:</h4>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• "I'm not good enough"</li>
          <li>• "Everyone will judge me"</li>
          <li>• "I'll never succeed"</li>
          <li>• "This is going to be a disaster"</li>
          <li>• "I always mess things up"</li>
        </ul>
      </div>
    </div>
  );

  // Step 2: Link to Emotion (Optional)
  const renderStep2 = () => (
    <div className="space-y-6" data-testid="step-link-emotion">
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-md">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-purple-900 mb-1">💡 Why Link to an Emotion?</h4>
            <p className="text-sm text-purple-800">
              Connecting your thought to a specific emotion you tracked helps you see patterns between what you think and how you feel. This is <strong>optional</strong> but can provide valuable insights.
            </p>
          </div>
        </div>
      </div>

      <FormField
        control={form.control}
        name="emotionRecordId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">
              Link to a Recent Emotion (Optional)
            </FormLabel>
            <FormDescription>
              Select an emotion you tracked recently, or skip this step
            </FormDescription>
            <Select
              value={field.value?.toString() || "none"}
              onValueChange={(value) => {
                field.onChange(value === "none" ? null : parseInt(value));
              }}
            >
              <FormControl>
                <SelectTrigger data-testid="select-emotion-link">
                  <SelectValue placeholder="No emotion linked" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">No emotion linked</SelectItem>
                {recentEmotions.map((emotion) => (
                  <SelectItem key={emotion.id} value={emotion.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{emotion.primaryEmotion || emotion.coreEmotion}</span>
                      {emotion.tertiaryEmotion && (
                        <span className="text-gray-500">({emotion.tertiaryEmotion})</span>
                      )}
                      <span className="text-xs text-gray-400">
                        - {format(new Date(emotion.timestamp), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {recentEmotions.length === 0 && (
                  <SelectItem value="none" disabled>
                    No recent emotions tracked
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedEmotion && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-md">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Linked Emotion
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-sm">
              {selectedEmotion.coreEmotion}
            </Badge>
            {selectedEmotion.primaryEmotion && (
              <Badge variant="outline" className="text-sm">
                {selectedEmotion.primaryEmotion}
              </Badge>
            )}
            {selectedEmotion.tertiaryEmotion && (
              <Badge variant="outline" className="text-sm">
                {selectedEmotion.tertiaryEmotion}
              </Badge>
            )}
            <span className="text-sm text-gray-600">
              Intensity: {selectedEmotion.intensity}/10
            </span>
          </div>
          {selectedEmotion.situation && (
            <p className="text-sm text-gray-700 mt-2">
              <strong>Situation:</strong> {selectedEmotion.situation}
            </p>
          )}
        </div>
      )}
    </div>
  );

  // Step 3: Describe Situation
  const renderStep3 = () => (
    <div className="space-y-6" data-testid="step-describe-situation">
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">💡 Why Describe the Situation?</h4>
            <p className="text-sm text-amber-800">
              Understanding the context helps you identify triggers and patterns. What was happening when you had this thought?
            </p>
          </div>
        </div>
      </div>

      <FormField
        control={form.control}
        name="situation"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">
              What was happening when you had this thought? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription>
              Describe the situation objectively - who, what, when, where, why
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="e.g., I was preparing for my presentation tomorrow and my manager asked to review my slides..."
                className="resize-none w-full min-h-[120px] text-base"
                rows={5}
                {...field}
                data-testid="textarea-situation"
              />
            </FormControl>
            <div className="flex justify-between items-center text-sm">
              <FormMessage />
              <span className={`${(field.value || "").length < 10 ? 'text-red-500' : 'text-green-600'}`}>
                {(field.value || "").length}/10 characters minimum
              </span>
            </div>
          </FormItem>
        )}
      />

      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium mb-2">Tips for Describing Situations:</h4>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• Stick to observable facts, not interpretations</li>
          <li>• Include who was there, what was said/done</li>
          <li>• Note the time and place if relevant</li>
          <li>• Avoid judgment words like "terrible" or "unfair"</li>
        </ul>
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open && !showSuccessDialog} onOpenChange={(isOpen) => !isOpen && onClose()} modal={false}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-7 w-7 text-primary" />
              Record Automatic Thought
            </DialogTitle>
            <DialogDescription>
              Capture and understand your automatic thoughts
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="space-y-2" data-testid="progress-wizard">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Step {currentStep} of {totalSteps}</span>
              <span className="text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {getStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t">
                <div>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={isSubmitting}
                      data-testid="button-previous-step"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      data-testid="button-next-step"
                    >
                      Next Step
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      data-testid="button-submit-thought"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                          Recording...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Record Thought
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Thought Recorded Successfully!
              </h3>
              <p className="text-gray-600">
                Great job capturing your automatic thought. What would you like to do next?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                size="lg"
                variant="default"
                className="flex items-center justify-center gap-2 h-12"
                onClick={() => {
                  setShowSuccessDialog(false);
                  setShowChallengeWizard(true);
                }}
                data-testid="button-challenge-thought"
              >
                <Sparkles className="h-5 w-5" />
                Challenge This Thought (Optional)
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="flex items-center justify-center gap-2 h-12"
                onClick={() => {
                  handleReset();
                }}
                data-testid="button-record-another-thought"
              >
                <RefreshCw className="h-5 w-5" />
                Record Another Thought
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="flex items-center justify-center gap-2 h-12"
                onClick={() => {
                  setShowSuccessDialog(false);
                  onClose();
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

      {/* Thought Challenge Wizard */}
      {recordedThought && (
        <ThoughtChallengeWizard
          open={showChallengeWizard}
          onClose={() => {
            setShowChallengeWizard(false);
            onClose();
          }}
          thoughtRecord={recordedThought}
        />
      )}
    </>
  );
}
