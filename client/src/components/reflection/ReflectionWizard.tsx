// ReflectionWizard.tsx
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmotionRecord, ThoughtRecord } from "@shared/schema";
import useActiveUser from "@/hooks/use-active-user";
import { HelpCircle, PlusCircle } from "lucide-react";
import { useLocation } from "wouter";

import {
  Dialog,
  DialogContent,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Cognitive distortions list
const cognitiveDistortions = [
  { 
    value: "all-or-nothing", 
    label: "All-or-Nothing Thinking",
    description: "Seeing situations in black and white terms, with no middle ground.",
    example: "If I don't get a perfect score, I'm a complete failure.",
    reframe: "Most situations fall somewhere in between extremes. Look for partial successes."
  },
  { 
    value: "catastrophizing", 
    label: "Catastrophizing",
    description: "Expecting the worst possible outcome in a situation.",
    example: "If I make a mistake in my presentation, my career will be ruined.",
    reframe: "Consider the most realistic outcome, not just the worst case scenario."
  },
  { 
    value: "emotional-reasoning", 
    label: "Emotional Reasoning",
    description: "Assuming your emotions reflect reality: 'I feel it, therefore it must be true.'",
    example: "I feel anxious about the flight, so it must be dangerous.",
    reframe: "Emotions are not facts. They're responses that may or may not be proportionate."
  },
  { 
    value: "mind-reading", 
    label: "Mind Reading",
    description: "Assuming you know what others are thinking, usually negatively.",
    example: "She didn't smile at me, so she must dislike me.",
    reframe: "Without confirmation, we can't know what others think. Consider alternative explanations."
  },
  { 
    value: "overgeneralization", 
    label: "Overgeneralization",
    description: "Taking one negative event as evidence of endless pattern of defeat.",
    example: "I didn't get this job. I'll never find employment.",
    reframe: "One event is just one data point, not a universal pattern."
  },
  { 
    value: "personalization", 
    label: "Personalization",
    description: "Believing others' actions are specifically related to you.",
    example: "The team's project failed because of my contribution.",
    reframe: "Most outcomes result from many factors, not just your actions."
  },
  { 
    value: "should-statements", 
    label: "Should Statements",
    description: "Having rigid rules about how you and others 'should' behave.",
    example: "I should never make mistakes. They should always consider my feelings.",
    reframe: "Replace 'should' with more flexible preferences and realistic expectations."
  },
  { 
    value: "mental-filter", 
    label: "Mental Filter",
    description: "Focusing exclusively on negative details while ignoring positives.",
    example: "I got feedback on my report with 9 compliments and 1 criticism, but I can only think about the criticism.",
    reframe: "Consciously acknowledge the full picture, including positive aspects."
  },
  { 
    value: "disqualifying-positive", 
    label: "Disqualifying the Positive",
    description: "Rejecting positive experiences by insisting they don't count.",
    example: "I did well on the project, but that doesn't count because anyone could have done it.",
    reframe: "Accept compliments and achievements as legitimate parts of your experience."
  },
  { 
    value: "jumping-to-conclusions", 
    label: "Jumping to Conclusions",
    description: "Making negative interpretations without supporting facts.",
    example: "My friend hasn't replied to my message. Our friendship must be over.",
    reframe: "Wait for evidence before coming to conclusions. Consider alternative explanations."
  },
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
});

type ThoughtRecordFormValues = z.infer<typeof thoughtRecordSchema>;

interface ReflectionWizardProps {
  emotion: EmotionRecord;
  open: boolean;
  onClose: () => void;
}

// Helper function to get color based on emotion
const getEmotionColor = (emotion: string): string => {
  const colorMap: Record<string, string> = {
    // Core emotions
    "Joy": "#F9D71C",
    "Sadness": "#6D87C4",
    "Fear": "#8A65AA",
    "Disgust": "#7DB954",
    "Anger": "#E43D40",
    // Secondary/tertiary fallbacks
    "Happy": "#F9D71C",
    "Excited": "#E8B22B",
    "Proud": "#D6A338",
    "Content": "#C8953F",
    "Hopeful": "#BAA150",
    "Depressed": "#6D87C4",
    "Lonely": "#5D78B5",
    "Guilty": "#4C69A6",
    "Disappointed": "#3B5A97",
    "Hurt": "#2A4B88",
    "Nervous": "#8A65AA",
    "Worried": "#7C5D9F",
    "Anxious": "#6D5595",
    "Insecure": "#5F4D8A",
    "Terrified": "#50457F",
    "Disgusted": "#7DB954",
    "Judgemental": "#6FA94B",
    "Disapproving": "#629A41",
    "Awful": "#548B38",
    "Avoidant": "#457C2F",
    "Angry": "#E43D40",
    "Frustrated": "#D23B3E",
    "Irritated": "#C0393B",
    "Critical": "#AE3639",
    "Distant": "#9C3436"
  };
  
  return colorMap[emotion] || "#808080"; // Default to gray if emotion not found
};

export default function ReflectionWizard({ emotion, open, onClose }: ReflectionWizardProps) {
  const { user } = useAuth();
  const { isViewingSelf } = useActiveUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Step state
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI state
  const [expandedReflectionView, setExpandedReflectionView] = useState(false);
  const [selectedDistortion, setSelectedDistortion] = useState<string | null>(null);
  
  // Protective factors and coping strategies state
  const [selectedProtectiveFactors, setSelectedProtectiveFactors] = useState<number[]>([]);
  const [selectedCopingStrategies, setSelectedCopingStrategies] = useState<number[]>([]);
  const [showAddProtectiveFactorForm, setShowAddProtectiveFactorForm] = useState(false);
  const [showAddCopingStrategyForm, setShowAddCopingStrategyForm] = useState(false);
  const [newProtectiveFactor, setNewProtectiveFactor] = useState("");
  const [newCopingStrategy, setNewCopingStrategy] = useState("");
  
  // Data state
  const [protectiveFactors, setProtectiveFactors] = useState<Array<{id: number, name: string}>>([]);
  const [copingStrategies, setCopingStrategies] = useState<Array<{id: number, name: string}>>([]);
  const [previousReflections, setPreviousReflections] = useState<ThoughtRecord[]>([]);
  
  // Create mutable refs for textareas
  const automaticThoughtsRef = useRef<HTMLTextAreaElement | null>(null);
  const evidenceForRef = useRef<HTMLTextAreaElement | null>(null);
  const evidenceAgainstRef = useRef<HTMLTextAreaElement | null>(null);
  const alternativePerspectiveRef = useRef<HTMLTextAreaElement | null>(null);
  const insightsGainedRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Progress calculation
  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;
  
  // Initialize form with default values
  const form = useForm<ThoughtRecordFormValues>({
    resolver: zodResolver(thoughtRecordSchema),
    mode: "onChange",
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
  
  // Add form value listener for debugging
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Form changed:", value);
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Fetch protective factors and coping strategies
  useEffect(() => {
    if (user) {
      // Fetch protective factors
      const fetchProtectiveFactors = async () => {
        try {
          const response = await apiRequest(
            "GET",
            `/api/users/${user.id}/protective-factors`
          );
          const data = await response.json();
          setProtectiveFactors(data);
        } catch (error) {
          console.error("Error fetching protective factors:", error);
          toast({
            title: "Error",
            description: "Failed to load protective factors",
            variant: "destructive",
          });
        }
      };
      
      // Fetch coping strategies
      const fetchCopingStrategies = async () => {
        try {
          const response = await apiRequest(
            "GET",
            `/api/users/${user.id}/coping-strategies`
          );
          const data = await response.json();
          setCopingStrategies(data);
        } catch (error) {
          console.error("Error fetching coping strategies:", error);
          toast({
            title: "Error",
            description: "Failed to load coping strategies",
            variant: "destructive",
          });
        }
      };
      
      fetchProtectiveFactors();
      fetchCopingStrategies();
    }
  }, [user, toast]);
  
  // Fetch previous reflections for this emotion
  useEffect(() => {
    if (user && emotion) {
      const fetchPreviousReflections = async () => {
        try {
          const response = await apiRequest(
            "GET",
            `/api/users/${user.id}/thoughts?emotionRecordId=${emotion.id}`
          );
          const data = await response.json();
          setPreviousReflections(data);
        } catch (error) {
          console.error("Error fetching previous reflections:", error);
        }
      };
      
      fetchPreviousReflections();
    }
  }, [user, emotion]);
  
  // Handle next step
  const handleNext = () => {
    if (step === 1) {
      form.trigger(["automaticThoughts"]);
      if (form.formState.errors.automaticThoughts) return;
    }
    setStep(step + 1);
    console.log("Current form values:", form.getValues());
  };
  
  // Handle back button
  const handleBack = () => {
    setStep(step - 1);
  };
  
  // Handler for toggling protective factors
  const toggleProtectiveFactor = (id: number) => {
    setSelectedProtectiveFactors(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };
  
  // Handler for toggling coping strategies
  const toggleCopingStrategy = (id: number) => {
    setSelectedCopingStrategies(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };
  
  // Handler for adding new protective factor
  const handleAddProtectiveFactor = async () => {
    if (!newProtectiveFactor.trim() || !user) return;
    
    try {
      const response = await apiRequest(
        "POST",
        `/api/users/${user.id}/protective-factors`,
        {
          userId: user.id,
          name: newProtectiveFactor,
          description: "",
          isGlobal: false
        }
      );
      
      const factor = await response.json();
      
      setProtectiveFactors(prevFactors => [...prevFactors, factor]);
      setSelectedProtectiveFactors(prev => [...prev, factor.id]);
      
      setNewProtectiveFactor("");
      setShowAddProtectiveFactorForm(false);
      
      toast({
        title: "Success",
        description: "Added new protective factor",
      });
    } catch (error) {
      console.error("Error adding protective factor:", error);
      toast({
        title: "Error",
        description: "Failed to add protective factor",
        variant: "destructive",
      });
    }
  };
  
  // Handler for adding new coping strategy
  const handleAddCopingStrategy = async () => {
    if (!newCopingStrategy.trim() || !user) return;
    
    try {
      const response = await apiRequest(
        "POST",
        `/api/users/${user.id}/coping-strategies`,
        {
          userId: user.id,
          name: newCopingStrategy,
          description: "",
          isGlobal: false
        }
      );
      
      const strategy = await response.json();
      
      setCopingStrategies(prevStrategies => [...prevStrategies, strategy]);
      setSelectedCopingStrategies(prev => [...prev, strategy.id]);
      
      setNewCopingStrategy("");
      setShowAddCopingStrategyForm(false);
      
      toast({
        title: "Success",
        description: "Added new coping strategy",
      });
    } catch (error) {
      console.error("Error adding coping strategy:", error);
      toast({
        title: "Error",
        description: "Failed to add coping strategy",
        variant: "destructive",
      });
    }
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
    
    // Validate required fields
    if (!data.automaticThoughts || data.automaticThoughts.trim().length < 3) {
      toast({
        title: "Error",
        description: "Please enter your automatic thoughts",
        variant: "destructive",
      });
      setStep(1); // Return to the first step where automatic thoughts are entered
      return;
    }
    
    // Prevent therapists from adding reflections to client emotion records
    if (!isViewingSelf) {
      toast({
        title: "Permission Denied",
        description: "Therapists cannot add reflections to client emotion records",
        variant: "destructive",
      });
      onClose();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get form values from the DOM as fallback since we're using native textareas
      const evidenceForEl = document.querySelector('textarea[placeholder="List facts that support this thought..."]') as HTMLTextAreaElement;
      const evidenceAgainstEl = document.querySelector('textarea[placeholder="List facts that don\'t support this thought..."]') as HTMLTextAreaElement;
      const alternativePerspectiveEl = document.querySelector('textarea[placeholder="A more realistic way to see this situation might be..."]') as HTMLTextAreaElement;
      const insightsGainedEl = document.querySelector('textarea[placeholder="What I\'ve learned from this reflection..."]') as HTMLTextAreaElement;
      
      console.log("Text values:", {
        evidenceFor: evidenceForEl?.value,
        evidenceAgainst: evidenceAgainstEl?.value,
        alternativePerspective: alternativePerspectiveEl?.value,
        insightsGained: insightsGainedEl?.value
      });
      
      // Format data for API
      const thoughtRecordData = {
        userId: user.id,
        emotionRecordId: emotion.id,
        automaticThoughts: data.automaticThoughts,
        cognitiveDistortions: data.cognitiveDistortions || [],
        evidenceFor: evidenceForEl?.value || data.evidenceFor || "",
        evidenceAgainst: evidenceAgainstEl?.value || data.evidenceAgainst || "",
        alternativePerspective: alternativePerspectiveEl?.value || data.alternativePerspective || "",
        insightsGained: insightsGainedEl?.value || data.insightsGained || "",
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

  // Step 1: Automatic Thoughts & Cognitive Distortions
  const renderStepOne = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="automaticThoughts"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What thoughts are going through your mind?</FormLabel>
            <FormDescription>
              Write down any automatic thoughts that came up when you experienced {emotion.primaryEmotion} ({emotion.tertiaryEmotion}).
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="I think that..."
                className="min-h-[120px] focus:border-primary focus:ring-1 focus:ring-primary w-full"
                value={field.value || ''}
                onChange={(e) => {
                  // Fixed event handling to ensure text is correctly processed
                  const value = e.target.value;
                  field.onChange(value);
                  form.setValue("automaticThoughts", value, { 
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true 
                  });
                }}
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
          <FormItem className="space-y-4">
            <div className="mb-2">
              <FormLabel className="text-lg">Identify any cognitive distortions in your thinking:</FormLabel>
              <FormDescription>
                These are patterns of thinking that can reinforce negative thoughts and emotions.
                Select any that apply to your situation.
              </FormDescription>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {cognitiveDistortions.map((distortion) => {
                const isChecked = form.getValues("cognitiveDistortions")?.includes(distortion.value);
                return (
                  <FormItem
                    key={distortion.value}
                    className="flex flex-row items-start space-x-3 space-y-0"
                  >
                    <FormControl>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const current = form.getValues("cognitiveDistortions") || [];
                          const updated = checked
                            ? [...current, distortion.value]
                            : current.filter((value) => value !== distortion.value);
                          form.setValue("cognitiveDistortions", updated);
                          
                          // Set the selected distortion for the info panel
                          if (checked) {
                            setSelectedDistortion(distortion.value);
                          } else if (selectedDistortion === distortion.value) {
                            setSelectedDistortion(null);
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel 
                        className={`font-medium cursor-pointer ${isChecked ? "text-primary" : ""}`}
                        onClick={() => setSelectedDistortion(selectedDistortion === distortion.value ? null : distortion.value)}
                      >
                        {distortion.label}
                      </FormLabel>
                    </div>
                  </FormItem>
                );
              })}
            </div>
            
            {/* Distortion Information Panel */}
            {selectedDistortion && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-muted-foreground/20">
                {cognitiveDistortions.filter(d => d.value === selectedDistortion).map((distortion) => (
                  <div key={distortion.value} className="space-y-2">
                    <h4 className="font-semibold text-primary">{distortion.label}</h4>
                    <p className="text-sm">{distortion.description}</p>
                    <div className="bg-muted/70 p-3 rounded-md mt-2">
                      <p className="text-sm font-medium">Example:</p>
                      <p className="text-sm italic">"{distortion.example}"</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-md mt-2">
                      <p className="text-sm font-medium text-primary">How to reframe:</p>
                      <p className="text-sm">{distortion.reframe}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FormItem>
        )}
      />
    </div>
  );

  // Step 2: Evidence For/Against
  const renderStepTwo = () => (
    <div className="space-y-4">
      <div className="p-4 bg-neutral-100 rounded-md mb-4">
        <div className="flex flex-col">
          <p className="text-sm font-medium mb-2">Your thoughts:</p>
          <p className="text-sm p-3 bg-white rounded border border-neutral-200">
            {form.getValues("automaticThoughts")}
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="evidenceFor" className="text-sm font-medium">What evidence supports this thought?</label>
        <p className="text-sm text-muted-foreground">
          List facts that actually support your thought. Focus on objective information, not feelings.
        </p>
        <textarea
          id="evidenceFor"
          name="evidenceFor"
          placeholder="List facts that support this thought..."
          rows={3}
          value={form.getValues("evidenceFor") || ''}
          onChange={(e) => {
            form.setValue("evidenceFor", e.target.value, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true
            });
          }}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="evidenceAgainst" className="text-sm font-medium">What evidence contradicts this thought?</label>
        <p className="text-sm text-muted-foreground">
          List facts that challenge your thought. Look for alternative explanations and realities.
        </p>
        <textarea
          id="evidenceAgainst"
          name="evidenceAgainst"
          placeholder="List facts that don't support this thought..."
          rows={3}
          value={form.getValues("evidenceAgainst") || ''}
          onChange={(e) => {
            form.setValue("evidenceAgainst", e.target.value, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true
            });
          }}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <Label>What protective factors can help you with this situation?</Label>
            <p className="text-xs text-muted-foreground mt-1">Protective factors are resources, strengths, or skills that help you manage difficult emotions</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            type="button"
            className="text-primary hover:text-primary/80"
            onClick={(e) => {
              // Prevent default button behavior that might submit forms
              e.preventDefault();
              e.stopPropagation();
              
              // Show information toast instead of closing dialog
              toast({
                title: "About Protective Factors",
                description: "Protective factors are personal resources, skills, or relationships that help you cope with stress and build resilience.",
              });
            }}
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Learn More
          </Button>
        </div>

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
          
          {showAddProtectiveFactorForm ? (
            <div className="flex items-center gap-2">
              <Input
                className="w-48"
                placeholder="Enter new factor..."
                value={newProtectiveFactor}
                onChange={(e) => setNewProtectiveFactor(e.target.value)}
              />
              <Button 
                size="sm" 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddProtectiveFactor();
                }}
                disabled={!newProtectiveFactor.trim()}
              >
                Add
              </Button>
              <Button 
                size="sm" 
                type="button"
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAddProtectiveFactorForm(false);
                  setNewProtectiveFactor("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div 
              className="px-3 py-2 text-sm border border-dashed border-neutral-400 rounded-full cursor-pointer hover:border-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddProtectiveFactorForm(true);
              }}
            >
              + Add New
            </div>
          )}
        </div>

        {selectedProtectiveFactors.length > 0 && (
          <div className="mt-2 p-3 bg-muted/40 rounded-lg text-sm">
            <h5 className="font-medium mb-1">Why protective factors matter:</h5>
            <p>Identifying and using your protective factors can build resilience and help you handle difficult situations more effectively.</p>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className="bg-background p-2 rounded-md">
                <span className="font-medium">Examples of protective factors:</span>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Social support - Friends, family, community connections</li>
                  <li>Personal skills - Problem-solving abilities, emotional awareness</li>
                  <li>Resources - Access to healthcare, stable housing, education</li>
                  <li>Activities - Exercise, creative outlets, spiritual practices</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Step 3: Alternative Perspective & Coping Strategies
  const renderStepThree = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="alternativePerspective" className="text-sm font-medium">What's a more balanced perspective?</label>
        <p className="text-sm text-muted-foreground">
          Consider the evidence for and against your thoughts to create a more balanced view.
        </p>
        <textarea
          id="alternativePerspective"
          name="alternativePerspective"
          placeholder="A more realistic way to see this situation might be..."
          rows={4}
          value={form.getValues("alternativePerspective") || ''}
          onChange={(e) => {
            form.setValue("alternativePerspective", e.target.value, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true
            });
          }}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <Label>What coping strategies might help you deal with this?</Label>
            <p className="text-xs text-muted-foreground mt-1">Coping strategies are specific actions or techniques you can use to manage stress and difficult emotions</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            type="button"
            className="text-primary hover:text-primary/80"
            onClick={(e) => {
              // Prevent default button behavior that might submit forms
              e.preventDefault();
              e.stopPropagation();
              
              // Show information toast instead of closing dialog
              toast({
                title: "About Coping Strategies",
                description: "Coping strategies are specific techniques that help you manage stress, regulate emotions, and maintain well-being during difficult situations.",
              });
            }}
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Learn More
          </Button>
        </div>

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
          
          {showAddCopingStrategyForm ? (
            <div className="flex items-center gap-2">
              <Input
                className="w-48"
                placeholder="Enter new strategy..."
                value={newCopingStrategy}
                onChange={(e) => setNewCopingStrategy(e.target.value)}
              />
              <Button 
                size="sm" 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddCopingStrategy();
                }}
                disabled={!newCopingStrategy.trim()}
              >
                Add
              </Button>
              <Button 
                size="sm" 
                type="button"
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAddCopingStrategyForm(false);
                  setNewCopingStrategy("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div 
              className="px-3 py-2 text-sm border border-dashed border-neutral-400 rounded-full cursor-pointer hover:border-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddCopingStrategyForm(true);
              }}
            >
              + Add New
            </div>
          )}
        </div>

        {selectedCopingStrategies.length > 0 && (
          <div className="mt-2 p-3 bg-muted/40 rounded-lg text-sm">
            <h5 className="font-medium mb-1">How to use coping strategies:</h5>
            <p>Effective coping strategies can help you manage stress, regulate emotions, and solve problems more effectively.</p>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className="bg-background p-2 rounded-md">
                <span className="font-medium">Types of coping strategies:</span>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong>Emotional coping</strong> - Managing feelings (deep breathing, mindfulness, journaling)</li>
                  <li><strong>Problem-focused coping</strong> - Taking action (making plans, seeking information, solving problems)</li>
                  <li><strong>Social coping</strong> - Connecting with others (talking to friends, joining support groups)</li>
                  <li><strong>Physical coping</strong> - Taking care of your body (exercise, proper sleep, healthy eating)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Step 4: Insights & Reflection Rating
  const renderStepFour = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="insightsGained" className="text-sm font-medium">What insights did you gain from this reflection?</label>
        <p className="text-sm text-muted-foreground">
          Summarize what you've learned about your thoughts, feelings, and reactions.
        </p>
        <textarea
          id="insightsGained"
          name="insightsGained"
          placeholder="What I've learned from this reflection..."
          rows={4}
          value={form.getValues("insightsGained") || ''}
          onChange={(e) => {
            form.setValue("insightsGained", e.target.value, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true
            });
          }}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      
      <FormField
        control={form.control}
        name="reflectionRating"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              How helpful was this reflection? (1 = Not helpful, 10 = Very helpful)
            </FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Slider
                  value={[field.value || 5]}
                  min={1}
                  max={10}
                  step={1}
                  defaultValue={[5]}
                  onValueChange={(values) => {
                    field.onChange(values[0]);
                    form.setValue("reflectionRating", values[0], {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true
                    });
                  }}
                />
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Not helpful</span>
                  <span>Somewhat helpful</span>
                  <span>Very helpful</span>
                </div>
                <div className="text-center text-lg font-medium text-primary">
                  {field.value || 5}/10
                </div>
              </div>
            </FormControl>
          </FormItem>
        )}
      />

      {/* SMART Goals Section */}
      <div className="mt-8 rounded-lg border p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Turn Your Insights Into Action</h3>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => {
              // Store any reflection insights in sessionStorage to use in goal setting
              const insights = form.getValues().insightsGained;
              if (insights) {
                sessionStorage.setItem('reflection_insights', insights);
              }
              
              // Navigate to goal setting using wouter (doesn't close dialog prematurely)
              setLocation('/goal-setting');
              
              // Close the dialog after navigation
              onClose();
            }}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Goal</span>
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Consider creating a SMART goal based on your reflections to help you move forward.
          </p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="smart">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                  SMART Goal Framework
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm">
                <div className="space-y-4">
                  <p>
                    SMART is an acronym to help you create effective goals:
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 rounded-md bg-background">
                      <h4 className="font-medium">Specific</h4>
                      <p>Your goal should be clear and specific, answering the five "W" questions: What, Why, Who, Where, and Which.</p>
                      <p className="text-xs mt-1 italic">Example: "I will practice deep breathing for 5 minutes each morning" instead of "I will manage stress better."</p>
                    </div>
                    
                    <div className="p-3 rounded-md bg-background">
                      <h4 className="font-medium">Measurable</h4>
                      <p>Include specific metrics to track your progress and know when you've reached your goal.</p>
                      <p className="text-xs mt-1 italic">Example: "I will walk 30 minutes daily for 5 days a week" instead of "I will exercise more."</p>
                    </div>
                    
                    <div className="p-3 rounded-md bg-background">
                      <h4 className="font-medium">Achievable</h4>
                      <p>Your goal should stretch your abilities but still be attainable.</p>
                      <p className="text-xs mt-1 italic">Example: "I will meditate for 10 minutes daily" instead of "I will meditate for 2 hours daily."</p>
                    </div>
                    
                    <div className="p-3 rounded-md bg-background">
                      <h4 className="font-medium">Relevant</h4>
                      <p>Your goal should align with your broader life objectives and personal values.</p>
                      <p className="text-xs mt-1 italic">Example: "I will practice assertive communication at work" if career advancement is important to you.</p>
                    </div>
                    
                    <div className="p-3 rounded-md bg-background">
                      <h4 className="font-medium">Time-bound</h4>
                      <p>Your goal needs a target date to create urgency and maintain focus.</p>
                      <p className="text-xs mt-1 italic">Example: "I will reduce my anxiety levels by 30% within 6 weeks" instead of "I will feel less anxious someday."</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
  
  // Get content based on current step
  const getStepContent = () => {
    switch (step) {
      case 1: return renderStepOne();
      case 2: return renderStepTwo();
      case 3: return renderStepThree();
      case 4: return renderStepFour();
      default: return null;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: getEmotionColor(emotion.primaryEmotion) }}
            ></div>
            Reflect on {emotion.primaryEmotion} ({emotion.tertiaryEmotion})
          </DialogTitle>
          <div className="text-sm text-neutral-500 mt-1">
            {new Date(emotion.timestamp).toLocaleString()}
          </div>
        </DialogHeader>
        
        <div className="mt-2">
          <Progress value={progress} className="h-2 mb-4" />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {getStepContent()}
            </form>
          </Form>
        </div>
        
        <DialogFooter className="flex justify-between items-center pt-4 border-t">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={() => {
                  const formValues = form.getValues();
                  // Validate required fields before submitting
                  if (!formValues.automaticThoughts || formValues.automaticThoughts.trim().length < 3) {
                    toast({
                      title: "Error",
                      description: "Please enter your automatic thoughts",
                      variant: "destructive",
                    });
                    setStep(1); // Return to the first step
                    return;
                  }
                  form.handleSubmit(onSubmit)();
                }}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Complete Reflection"
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}