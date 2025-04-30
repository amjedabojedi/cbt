import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { EmotionRecord, ThoughtRecord } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

// Cognitive distortions list
const cognitiveDistortions = [
  { value: "all-or-nothing", label: "All-or-Nothing Thinking" },
  { value: "catastrophizing", label: "Catastrophizing" },
  { value: "emotional-reasoning", label: "Emotional Reasoning" },
  { value: "mind-reading", label: "Mind Reading" },
  { value: "overgeneralization", label: "Overgeneralization" },
  { value: "personalization", label: "Personalization" },
  { value: "should-statements", label: "Should Statements" },
  { value: "mental-filter", label: "Mental Filter" },
  { value: "disqualifying-positive", label: "Disqualifying the Positive" },
  { value: "jumping-to-conclusions", label: "Jumping to Conclusions" },
];

// Define schema for the thought record form
const thoughtRecordSchema = z.object({
  automaticThoughts: z.string().min(3, "Please enter your thoughts"),
  cognitiveDistortions: z.array(z.string()).default([]),
  evidenceFor: z.string().default(""),
  evidenceAgainst: z.string().default(""),
  alternativePerspective: z.string().default(""),
  insightsGained: z.string().default(""),
  reflectionRating: z.number().min(1).max(10).default(5),
  // Fields for protective factors and coping strategies will be handled separately
});

type ThoughtRecordFormValues = z.infer<typeof thoughtRecordSchema>;

interface ReflectionWizardProps {
  emotion: EmotionRecord;
  open: boolean;
  onClose: () => void;
}

export default function ReflectionWizard({ emotion, open, onClose }: ReflectionWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProtectiveFactors, setSelectedProtectiveFactors] = useState<number[]>([]);
  const [selectedCopingStrategies, setSelectedCopingStrategies] = useState<number[]>([]);
  
  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;
  
  // Initialize form with default values
  const form = useForm<ThoughtRecordFormValues>({
    resolver: zodResolver(thoughtRecordSchema),
    defaultValues: {
      automaticThoughts: "",
      cognitiveDistortions: [],
      evidenceFor: "",
      evidenceAgainst: "",
      alternativePerspective: "",
      insightsGained: "",
      reflectionRating: 5,
    },
  });
  
  // Mock data for protective factors and coping strategies
  // In real app, this would be fetched from the API
  const protectiveFactors = [
    { id: 1, name: "Supportive relationships" },
    { id: 2, name: "Problem-solving skills" },
    { id: 3, name: "Self-care routine" },
    { id: 4, name: "Positive self-talk" },
    { id: 5, name: "Meaningful activities" },
  ];
  
  const copingStrategies = [
    { id: 1, name: "Deep breathing" },
    { id: 2, name: "Progressive muscle relaxation" },
    { id: 3, name: "Mindfulness meditation" },
    { id: 4, name: "Physical exercise" },
    { id: 5, name: "Journaling" },
  ];
  
  // Handle next step
  const handleNext = () => {
    if (step === 1) {
      form.trigger(["automaticThoughts"]);
      if (form.formState.errors.automaticThoughts) return;
    }
    // Steps 2 and 3 have optional fields, so we don't need to validate them
    
    setStep(step + 1);
    
    // Log form values for debugging
    console.log("Current form values:", form.getValues());
  };
  
  // Handle back button
  const handleBack = () => {
    setStep(step - 1);
  };
  
  // Handle toggling protective factors
  const toggleProtectiveFactor = (id: number) => {
    setSelectedProtectiveFactors(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };
  
  // Handle toggling coping strategies
  const toggleCopingStrategy = (id: number) => {
    setSelectedCopingStrategies(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };
  
  // Handle form submission
  const onSubmit = async (data: ThoughtRecordFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to record thoughts",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format data for API
      const thoughtRecordData = {
        userId: user.id,
        emotionRecordId: emotion.id,
        automaticThoughts: data.automaticThoughts,
        cognitiveDistortions: data.cognitiveDistortions || [],
        evidenceFor: data.evidenceFor || "",
        evidenceAgainst: data.evidenceAgainst || "",
        alternativePerspective: data.alternativePerspective || "",
        insightsGained: data.insightsGained || "",
        reflectionRating: data.reflectionRating || 5,
      };
      
      // Submit thought record to API
      const response = await apiRequest(
        "POST", 
        `/api/users/${user.id}/thoughts`, 
        thoughtRecordData
      );
      
      const thoughtRecord = await response.json();
      
      // Record protective factor usages
      if (selectedProtectiveFactors.length > 0) {
        await Promise.all(selectedProtectiveFactors.map(factorId => 
          apiRequest(
            "POST",
            `/api/users/${user.id}/protective-factor-usage`,
            {
              userId: user.id,
              thoughtRecordId: thoughtRecord.id,
              protectiveFactorId: factorId,
            }
          )
        ));
      }
      
      // Record coping strategy usages
      if (selectedCopingStrategies.length > 0) {
        await Promise.all(selectedCopingStrategies.map(strategyId => 
          apiRequest(
            "POST",
            `/api/users/${user.id}/coping-strategy-usage`,
            {
              userId: user.id,
              thoughtRecordId: thoughtRecord.id,
              copingStrategyId: strategyId,
            }
          )
        ));
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/thoughts`] });
      
      // Show success message
      toast({
        title: "Reflection Completed",
        description: "Your reflection has been recorded successfully.",
      });
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error("Error recording thought reflection:", error);
      toast({
        title: "Error",
        description: "Failed to record reflection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render different step content based on current step
  const renderStepContent = () => {
    switch (step) {
      case 1: // Automatic Thoughts & Cognitive Distortions
        return (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-100 rounded-md mb-4">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" 
                     style={{ backgroundColor: getEmotionColor(emotion.tertiaryEmotion) }}>
                  <span className="text-white">😊</span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    You recorded feeling: <span className="text-primary">{emotion.tertiaryEmotion} ({emotion.intensity}/10)</span>
                  </p>
                  <p className="text-sm text-neutral-600 mt-1">
                    Situation: {emotion.situation}
                  </p>
                </div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="automaticThoughts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What thoughts went through your mind?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your thoughts here..."
                      rows={4}
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cognitiveDistortions"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel>Identify any cognitive distortions in your thinking:</FormLabel>
                    <FormDescription>
                      These are patterns of thinking that can reinforce negative thoughts and emotions.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {cognitiveDistortions.map((distortion) => (
                      <FormItem
                        key={distortion.value}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={form.getValues("cognitiveDistortions")?.includes(distortion.value)}
                            onCheckedChange={(checked) => {
                              const current = form.getValues("cognitiveDistortions") || [];
                              const updated = checked
                                ? [...current, distortion.value]
                                : current.filter((value) => value !== distortion.value);
                              form.setValue("cognitiveDistortions", updated);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {distortion.label}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </div>
                </FormItem>
              )}
            />
          </div>
        );
      
      case 2: // Evidence For/Against
        return (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-100 rounded-md mb-4">
              <div className="flex flex-col">
                <p className="text-sm font-medium mb-2">Your thoughts:</p>
                <p className="text-sm p-3 bg-white rounded border border-neutral-200">
                  {form.getValues("automaticThoughts")}
                </p>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="evidenceFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What evidence supports this thought?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List facts that support this thought..."
                      rows={3}
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="evidenceAgainst"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What evidence contradicts this thought?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List facts that don't support this thought..."
                      rows={3}
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-3">
              <Label>What protective factors can help you with this situation?</Label>
              <div className="flex flex-wrap gap-2">
                {protectiveFactors.map((factor) => (
                  <div 
                    key={factor.id}
                    className={`px-3 py-2 text-sm border rounded-full cursor-pointer transition-colors ${
                      selectedProtectiveFactors.includes(factor.id)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-neutral-700 border-neutral-300 hover:border-primary"
                    }`}
                    onClick={() => toggleProtectiveFactor(factor.id)}
                  >
                    {factor.name}
                  </div>
                ))}
                <div className="px-3 py-2 text-sm border border-dashed border-neutral-400 rounded-full cursor-pointer hover:border-primary">
                  + Add New
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3: // Alternative Perspective & Coping Strategies
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="alternativePerspective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What's a more balanced perspective?</FormLabel>
                  <FormDescription>
                    Consider the evidence for and against your thoughts to create a more balanced view.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="A more realistic way to see this situation might be..."
                      rows={4}
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-3">
              <Label>What coping strategies could help you in this situation?</Label>
              <div className="flex flex-wrap gap-2">
                {copingStrategies.map((strategy) => (
                  <div 
                    key={strategy.id}
                    className={`px-3 py-2 text-sm border rounded-full cursor-pointer transition-colors ${
                      selectedCopingStrategies.includes(strategy.id)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-neutral-700 border-neutral-300 hover:border-primary"
                    }`}
                    onClick={() => toggleCopingStrategy(strategy.id)}
                  >
                    {strategy.name}
                  </div>
                ))}
                <div className="px-3 py-2 text-sm border border-dashed border-neutral-400 rounded-full cursor-pointer hover:border-primary">
                  + Add New
                </div>
              </div>
            </div>
            
            {/* Before/After Emotion Chart */}
            <div className="mt-6 p-4 bg-neutral-100 rounded-md">
              <h4 className="text-sm font-medium mb-3">Emotion Intensity</h4>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-xs">Before</p>
                  <div className="w-20 h-8 bg-primary-light rounded-md flex items-center justify-center">
                    <span className="font-medium">{emotion.intensity}/10</span>
                  </div>
                </div>
                <div className="h-8 flex items-center">
                  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 12H38M38 12L28 2M38 12L28 22" stroke="#9E9E9E" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-xs">After</p>
                  <div className="w-20 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <span className="font-medium">?/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 4: // Final Reflection & Insights
        return (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-100 rounded-md mb-4">
              <h4 className="text-sm font-medium mb-2">Summary</h4>
              <div className="space-y-3 text-sm">
                <p><strong>Original Thought:</strong> {form.getValues("automaticThoughts")}</p>
                <p><strong>Alternative Perspective:</strong> {form.getValues("alternativePerspective")}</p>
                <p><strong>Protective Factors:</strong> {selectedProtectiveFactors.map(id => 
                  protectiveFactors.find(f => f.id === id)?.name
                ).join(", ")}</p>
                <p><strong>Coping Strategies:</strong> {selectedCopingStrategies.map(id => 
                  copingStrategies.find(s => s.id === id)?.name
                ).join(", ")}</p>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="insightsGained"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What insights did you gain from this reflection?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What did you learn that you can apply in the future..."
                      rows={3}
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reflectionRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How helpful was this reflection? (1-10)</FormLabel>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-neutral-500">Not Helpful</span>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        defaultValue={[field.value || 5]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        className="flex-grow"
                      />
                    </FormControl>
                    <span className="text-xs text-neutral-500">Very Helpful</span>
                    <span className="ml-2 w-8 text-center font-medium">{field.value || 5}</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Helper function to get color based on emotion
  const getEmotionColor = (emotion: string) => {
    const emotionColorMap: Record<string, string> = {
      "Joy": "#FBBC05",
      "Happiness": "#F9CB9C",
      "Contentment": "#F9CB9C",
      "Optimistic": "#FFF2CC",
      "Cheerful": "#FFF2CC",
      "Proud": "#FFF2CC",
      "Peaceful": "#FFF2CC",
      "Satisfied": "#FFF2CC",
      "Grateful": "#FFF2CC",
      
      "Anger": "#EA4335",
      "Rage": "#F28B82",
      "Frustration": "#F28B82",
      "Furious": "#FADBD8",
      "Irritated": "#FADBD8",
      "Annoyed": "#FADBD8",
      "Aggravated": "#FADBD8",
      "Impatient": "#FADBD8",
      "Resentful": "#FADBD8",
      
      "Sadness": "#4285F4",
      "Despair": "#A4C2F4",
      "Melancholy": "#A4C2F4",
      "Hopeless": "#D2E3FC",
      "Miserable": "#D2E3FC",
      "Lonely": "#D2E3FC",
      "Nostalgic": "#D2E3FC",
      "Disappointed": "#D2E3FC",
      "Regretful": "#D2E3FC",
      
      "Fear": "#34A853",
      "Anxiety": "#93C47D",
      "Terror": "#93C47D",
      "Worried": "#D9EAD3",
      "Nervous": "#D9EAD3",
      "Uneasy": "#D9EAD3",
      "Horrified": "#D9EAD3",
      "Scared": "#D9EAD3",
      "Panicked": "#D9EAD3",
    };
    
    return emotionColorMap[emotion] || "#9E9E9E";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guided Reflection</DialogTitle>
          <DialogDescription>
            Follow the steps to reflect on your thoughts and emotions.
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-neutral-500">
              <span className={step >= 1 ? "font-medium text-primary" : ""}>Thoughts</span>
              <span className={step >= 2 ? "font-medium text-primary" : ""}>Evidence</span>
              <span className={step >= 3 ? "font-medium text-primary" : ""}>Alternatives</span>
              <span className={step >= 4 ? "font-medium text-primary" : ""}>Action</span>
            </div>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {renderStepContent()}
            
            <div className="flex justify-between mt-6">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
              ) : (
                <div></div>
              )}
              
              {step < totalSteps ? (
                <Button type="button" onClick={handleNext}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Complete Reflection"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
