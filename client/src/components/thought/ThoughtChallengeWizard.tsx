import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThoughtRecord } from "@shared/schema";
import useActiveUser from "@/hooks/use-active-user";
import { Brain, CheckCircle2, Lightbulb, AlertCircle } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

// Cognitive distortions list with descriptions
const cognitiveDistortions = [
  {
    value: "all-or-nothing",
    label: "All-or-Nothing Thinking",
    description: "Seeing things in black and white - no middle ground",
    example: "If I don't get a perfect score, I'm a complete failure",
  },
  {
    value: "catastrophizing",
    label: "Catastrophizing",
    description: "Expecting the worst possible outcome",
    example: "One mistake means my career is ruined",
  },
  {
    value: "emotional-reasoning",
    label: "Emotional Reasoning",
    description: "Believing feelings are facts",
    example: "I feel anxious, so it must be dangerous",
  },
  {
    value: "mind-reading",
    label: "Mind Reading",
    description: "Assuming you know what others think",
    example: "They didn't smile, so they must hate me",
  },
  {
    value: "overgeneralization",
    label: "Overgeneralization",
    description: "One event = endless pattern",
    example: "I failed once, so I'll always fail",
  },
  {
    value: "personalization",
    label: "Personalization",
    description: "Everything is about you",
    example: "The project failed because of me",
  },
  {
    value: "should-statements",
    label: "Should Statements",
    description: "Rigid rules about how things 'should' be",
    example: "I should never make mistakes",
  },
  {
    value: "mental-filter",
    label: "Mental Filter",
    description: "Focusing only on negatives",
    example: "Got 9 compliments, but I only remember the 1 criticism",
  },
];

// Form schema
const challengeSchema = z.object({
  cognitiveDistortions: z.array(z.string()).min(1, "Please select at least one thinking error"),
  evidenceFor: z.string().min(10, "Please provide at least 10 characters"),
  evidenceAgainst: z.string().min(10, "Please provide at least 10 characters"),
  alternativeThought: z.string().min(10, "Please provide at least 10 characters"),
  beliefInOriginal: z.number().min(0).max(100),
  beliefInAlternative: z.number().min(0).max(100),
});

type ChallengeFormValues = z.infer<typeof challengeSchema>;

interface ThoughtChallengeWizardProps {
  open: boolean;
  onClose: () => void;
  thoughtRecord: ThoughtRecord;
}

export function ThoughtChallengeWizard({
  open,
  onClose,
  thoughtRecord,
}: ThoughtChallengeWizardProps) {
  const { user } = useAuth();
  const { activeUserId } = useActiveUser();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0); // 0 = intro, 1-4 = steps
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const totalSteps = 4;

  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      cognitiveDistortions: [],
      evidenceFor: "",
      evidenceAgainst: "",
      alternativeThought: "",
      beliefInOriginal: 50,
      beliefInAlternative: 50,
    },
  });

  const progress = currentStep === 0 ? 0 : (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    let isValid = true;

    if (currentStep === 1) {
      isValid = await form.trigger("cognitiveDistortions");
    } else if (currentStep === 2) {
      isValid = await form.trigger(["evidenceFor", "evidenceAgainst"]);
    } else if (currentStep === 3) {
      isValid = await form.trigger("alternativeThought");
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ChallengeFormValues) => {
    try {
      if (!activeUserId || !thoughtRecord.id) {
        toast({
          title: "Error",
          description: "Missing required information",
          variant: "destructive",
        });
        return;
      }

      // Update the thought record with challenge data
      const updateData = {
        cognitiveDistortions: data.cognitiveDistortions,
        evidenceFor: data.evidenceFor,
        evidenceAgainst: data.evidenceAgainst,
        alternativePerspective: data.alternativeThought,
        reflectionRating: Math.round((data.beliefInAlternative / 100) * 10),
      };

      await apiRequest(
        "PATCH",
        `/api/users/${activeUserId}/thoughts/${thoughtRecord.id}`,
        updateData
      );

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: [`/api/users/${activeUserId}/thoughts`] });

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error saving challenge:", error);
      toast({
        title: "Error",
        description: "Failed to save your thought challenge. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    form.reset();
    setCurrentStep(0);
    onClose();
  };

  const handleSkip = () => {
    form.reset();
    setCurrentStep(0);
    onClose();
  };

  return (
    <>
      {/* Main Challenge Dialog */}
      <Dialog open={open && !showSuccessDialog} onOpenChange={handleSkip} modal={false}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Challenge Your Thought
            </DialogTitle>
            <DialogDescription>
              {currentStep === 0 ? (
                "Learn about cognitive behavioral therapy"
              ) : (
                `Step ${currentStep} of ${totalSteps}`
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar (only show after intro) */}
          {currentStep > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" data-testid="progress-challenge" />
              <div className="flex justify-between text-xs text-gray-500">
                <span className={currentStep >= 1 ? "text-purple-600 font-medium" : ""}>
                  1. Thinking Errors
                </span>
                <span className={currentStep >= 2 ? "text-purple-600 font-medium" : ""}>
                  2. Evidence
                </span>
                <span className={currentStep >= 3 ? "text-purple-600 font-medium" : ""}>
                  3. Alternative
                </span>
                <span className={currentStep >= 4 ? "text-purple-600 font-medium" : ""}>
                  4. Beliefs
                </span>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* INTRO STEP - Educational Content */}
              {currentStep === 0 && (
                <div className="space-y-6" data-testid="step-intro">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold mb-2">What is Thought Challenging?</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Thought challenging is a core technique from Cognitive Behavioral Therapy (CBT).
                          It helps you examine whether your automatic thoughts are accurate, helpful, and based on facts.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-base">Why Challenge Your Thoughts?</h4>
                    <div className="grid gap-3">
                      <div className="flex gap-3 bg-white p-4 rounded-lg border">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Reduce Emotional Distress</p>
                          <p className="text-sm text-gray-600">
                            When you question negative thoughts, they often lose their power over your emotions
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 bg-white p-4 rounded-lg border">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">See the Bigger Picture</p>
                          <p className="text-sm text-gray-600">
                            Find evidence you might have overlooked and consider alternative explanations
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 bg-white p-4 rounded-lg border">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Break Thinking Patterns</p>
                          <p className="text-sm text-gray-600">
                            Identify unhelpful thinking errors (cognitive distortions) and replace them with balanced thoughts
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-sm mb-1">Your Automatic Thought:</h4>
                        <p className="text-sm text-gray-700 italic">"{thoughtRecord.automaticThoughts}"</p>
                        <p className="text-xs text-gray-500 mt-2">
                          We'll guide you through examining this thought step-by-step
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={handleSkip}>
                      Skip for Now
                    </Button>
                    <Button type="button" onClick={() => setCurrentStep(1)} data-testid="button-start-challenge">
                      Start Challenge <CheckCircle2 className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 1: Identify Thinking Errors */}
              {currentStep === 1 && (
                <div className="space-y-4" data-testid="step-thinking-errors">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="font-medium text-sm mb-2">💡 Why Identify Thinking Errors?</h3>
                    <p className="text-sm text-gray-700">
                      Recognizing patterns in how you think helps you understand why certain thoughts cause distress.
                      Select all that apply to your thought.
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm font-medium mb-1">Your thought:</p>
                    <p className="text-sm italic text-gray-700">"{thoughtRecord.automaticThoughts}"</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="cognitiveDistortions"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Which thinking errors apply? <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormDescription>
                          Select at least one cognitive distortion that fits your thought
                        </FormDescription>
                        <div className="space-y-3 mt-3">
                          {cognitiveDistortions.map((distortion) => (
                            <FormField
                              key={distortion.value}
                              control={form.control}
                              name="cognitiveDistortions"
                              render={({ field }) => (
                                <div className="flex items-start space-x-3 bg-white p-4 rounded-lg border hover:border-purple-300 transition-colors">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(distortion.value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, distortion.value])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== distortion.value)
                                            );
                                      }}
                                      data-testid={`checkbox-${distortion.value}`}
                                    />
                                  </FormControl>
                                  <div className="flex-1">
                                    <Label className="font-semibold text-sm cursor-pointer">
                                      {distortion.label}
                                    </Label>
                                    <p className="text-xs text-gray-600 mt-1">{distortion.description}</p>
                                    <p className="text-xs text-gray-500 italic mt-1">
                                      Example: {distortion.example}
                                    </p>
                                  </div>
                                </div>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handlePrevious}>
                      Previous
                    </Button>
                    <Button type="button" onClick={handleNext} data-testid="button-next-step">
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: Examine Evidence */}
              {currentStep === 2 && (
                <div className="space-y-4" data-testid="step-evidence">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="font-medium text-sm mb-2">💡 Why Examine Evidence?</h3>
                    <p className="text-sm text-gray-700">
                      Looking at both sides helps you see if your thought is based on facts or assumptions.
                      Be honest and objective.
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm font-medium mb-1">Your thought:</p>
                    <p className="text-sm italic text-gray-700">"{thoughtRecord.automaticThoughts}"</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="evidenceFor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Evidence supporting this thought <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormDescription>
                          What facts or experiences support this thought?
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., My manager gave me critical feedback on my last report..."
                            className="resize-none w-full min-h-[100px] text-base relative z-[100]"
                            style={{ color: '#000000' }}
                            rows={4}
                            {...field}
                            data-testid="textarea-evidence-for"
                          />
                        </FormControl>
                        <div className="flex justify-end text-sm">
                          <span className={`${(field.value || "").length < 10 ? 'text-red-500' : 'text-green-600'}`}>
                            {(field.value || "").length}/10 characters minimum
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evidenceAgainst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Evidence against this thought <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormDescription>
                          What facts or experiences contradict this thought?
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., I've received positive feedback on my work before. My colleague said I did great work last month..."
                            className="resize-none w-full min-h-[100px] text-base relative z-[100]"
                            style={{ color: '#000000' }}
                            rows={4}
                            {...field}
                            data-testid="textarea-evidence-against"
                          />
                        </FormControl>
                        <div className="flex justify-end text-sm">
                          <span className={`${(field.value || "").length < 10 ? 'text-red-500' : 'text-green-600'}`}>
                            {(field.value || "").length}/10 characters minimum
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handlePrevious}>
                      Previous
                    </Button>
                    <Button type="button" onClick={handleNext} data-testid="button-next-step">
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: Generate Alternative Thought */}
              {currentStep === 3 && (
                <div className="space-y-4" data-testid="step-alternative">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="font-medium text-sm mb-2">💡 Why Create an Alternative?</h3>
                    <p className="text-sm text-gray-700">
                      Based on the evidence, create a more balanced, realistic thought that considers all the facts.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                      <p className="text-xs font-medium mb-1 text-red-800">Original thought:</p>
                      <p className="text-sm italic text-gray-700">"{thoughtRecord.automaticThoughts}"</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <p className="text-xs font-medium mb-1 text-green-800">Evidence against:</p>
                      <p className="text-sm text-gray-700">{form.watch("evidenceAgainst") || "..."}</p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="alternativeThought"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Alternative, balanced thought <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormDescription>
                          Write a more realistic thought that considers all evidence
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., While I got some critical feedback, I've also done good work that was praised. One piece of criticism doesn't mean I'm incompetent - it means I have room to improve in this area..."
                            className="resize-none w-full min-h-[120px] text-base relative z-[100]"
                            style={{ color: '#000000' }}
                            rows={5}
                            {...field}
                            data-testid="textarea-alternative"
                          />
                        </FormControl>
                        <div className="flex justify-end text-sm">
                          <span className={`${(field.value || "").length < 10 ? 'text-red-500' : 'text-green-600'}`}>
                            {(field.value || "").length}/10 characters minimum
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-sm mb-2">Tips for Alternative Thoughts:</h4>
                    <ul className="text-xs space-y-1 text-gray-700">
                      <li>• Consider all the evidence, not just what supports the negative thought</li>
                      <li>• Ask "What would I tell a friend in this situation?"</li>
                      <li>• Look for middle ground - avoid black and white thinking</li>
                      <li>• Be compassionate with yourself</li>
                    </ul>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handlePrevious}>
                      Previous
                    </Button>
                    <Button type="button" onClick={handleNext} data-testid="button-next-step">
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 4: Rate Beliefs */}
              {currentStep === 4 && (
                <div className="space-y-4" data-testid="step-beliefs">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="font-medium text-sm mb-2">💡 Why Rate Your Beliefs?</h3>
                    <p className="text-sm text-gray-700">
                      Rating how much you believe each thought shows how much the challenge process helped shift your perspective.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="beliefInOriginal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            How much do you believe your original thought now?
                          </FormLabel>
                          <FormDescription className="text-xs italic text-gray-600 mb-2">
                            "{thoughtRecord.automaticThoughts}"
                          </FormDescription>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600 min-w-[120px]">Not at all (0%)</span>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  min={0}
                                  max={100}
                                  step={5}
                                  className="flex-grow h-3 bg-gradient-to-r from-green-200 via-yellow-400 to-red-600"
                                  data-testid="slider-belief-original"
                                />
                              </FormControl>
                              <span className="text-sm text-gray-600 min-w-[120px]">Completely (100%)</span>
                            </div>
                            <div className="flex justify-center">
                              <span className="px-6 py-3 rounded-full bg-purple-600 text-white text-2xl font-bold">
                                {field.value}%
                              </span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="beliefInAlternative"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            How much do you believe your alternative thought?
                          </FormLabel>
                          <FormDescription className="text-xs italic text-gray-600 mb-2">
                            "{form.watch("alternativeThought") || "Your alternative thought..."}"
                          </FormDescription>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600 min-w-[120px]">Not at all (0%)</span>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  min={0}
                                  max={100}
                                  step={5}
                                  className="flex-grow h-3 bg-gradient-to-r from-red-200 via-yellow-400 to-green-600"
                                  data-testid="slider-belief-alternative"
                                />
                              </FormControl>
                              <span className="text-sm text-gray-600 min-w-[120px]">Completely (100%)</span>
                            </div>
                            <div className="flex justify-center">
                              <span className="px-6 py-3 rounded-full bg-green-600 text-white text-2xl font-bold">
                                {field.value}%
                              </span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handlePrevious}>
                      Previous
                    </Button>
                    <Button type="submit" data-testid="button-save-challenge">
                      Save Challenge <CheckCircle2 className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={handleCloseSuccess} modal={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Thought Challenge Complete!
            </DialogTitle>
            <DialogDescription>
              You've successfully challenged your automatic thought
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm font-medium mb-2">What you accomplished:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✅ Identified {form.watch("cognitiveDistortions")?.length || 0} thinking error(s)</li>
                <li>✅ Examined evidence on both sides</li>
                <li>✅ Created a balanced alternative perspective</li>
                <li>✅ Shifted your belief by {Math.abs((form.watch("beliefInOriginal") || 50) - (form.watch("beliefInAlternative") || 50))}%</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium mb-1">💡 Remember:</p>
              <p className="text-sm text-gray-700">
                The goal isn't to think positive thoughts, but to think more realistic, balanced thoughts.
                With practice, this becomes easier!
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button onClick={handleCloseSuccess} data-testid="button-close-success">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
