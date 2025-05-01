import { useState, useEffect, useRef } from "react";
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
  const [showAddProtectiveFactorForm, setShowAddProtectiveFactorForm] = useState(false);
  const [showAddCopingStrategyForm, setShowAddCopingStrategyForm] = useState(false);
  const [newProtectiveFactor, setNewProtectiveFactor] = useState("");
  const [newCopingStrategy, setNewCopingStrategy] = useState("");
  const [expandedReflectionView, setExpandedReflectionView] = useState(false);
  
  // Create refs for all textareas at the component top level to avoid hook order issues
  const automaticThoughtsRef = useRef<HTMLTextAreaElement>(null);
  const evidenceForRef = useRef<HTMLTextAreaElement>(null);
  const evidenceAgainstRef = useRef<HTMLTextAreaElement>(null);
  const alternativePerspectiveRef = useRef<HTMLTextAreaElement>(null);
  const insightsGainedRef = useRef<HTMLTextAreaElement>(null);
  
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
  
  // Force update on input fields for better responsiveness
  const [formKey, setFormKey] = useState(Date.now());
  
  // State for protective factors and coping strategies
  const [protectiveFactors, setProtectiveFactors] = useState([
    { id: 1, name: "Supportive relationships" },
    { id: 2, name: "Problem-solving skills" },
    { id: 3, name: "Self-care routine" },
    { id: 4, name: "Positive self-talk" },
    { id: 5, name: "Meaningful activities" },
  ]);
  
  const [copingStrategies, setCopingStrategies] = useState([
    { id: 1, name: "Deep breathing" },
    { id: 2, name: "Progressive muscle relaxation" },
    { id: 3, name: "Mindfulness meditation" },
    { id: 4, name: "Physical exercise" },
    { id: 5, name: "Journaling" },
  ]);
  
  // State for previous reflections
  const [previousReflections, setPreviousReflections] = useState<ThoughtRecord[]>([]);
  
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
          // Set previous reflections excluding the current one
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
  
  // Handle adding a new protective factor
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
      
      // Add new factor to the list and select it
      setProtectiveFactors(prevFactors => [...prevFactors, factor]);
      setSelectedProtectiveFactors(prev => [...prev, factor.id]);
      
      // Reset form
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
  
  // Handle adding a new coping strategy
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
      
      // Add new strategy to the list and select it
      setCopingStrategies(prevStrategies => [...prevStrategies, strategy]);
      setSelectedCopingStrategies(prev => [...prev, strategy.id]);
      
      // Reset form
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
  
  // Debug function to log current form state
  const logFormState = () => {
    console.log("Form values:", {
      automaticThoughts: form.getValues("automaticThoughts"),
      evidenceFor: form.getValues("evidenceFor"),
      evidenceAgainst: form.getValues("evidenceAgainst"),
      alternativePerspective: form.getValues("alternativePerspective"),
      insightsGained: form.getValues("insightsGained"),
      errors: form.formState.errors
    });
  };

  // Add form value listener 
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Form changed:", value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
      "Worried": "#8A65AA",
      "Anxious": "#7A569B",
      "Insecure": "#6A478C",
      "Rejected": "#5A387D",
      "Overwhelmed": "#4A296E",
      "Disgusted": "#7DB954",
      "Judgmental": "#6DAA45",
      "Disapproving": "#5D9B36",
      "Critical": "#4D8C27",
      "Repulsed": "#3D7D18",
      "Furious": "#E43D40",
      "Annoyed": "#D42E31",
      "Frustrated": "#C41F22",
      "Irritated": "#B41013",
      "Resentful": "#A40104"
    };
    
    // Default color if emotion not found
    return colorMap[emotion] || "#888888";
  };

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
              
              {previousReflections.length > 0 && (
                <div className="mt-3 border-t border-neutral-200 pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">Previous reflections on this emotion:</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7 px-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Toggle expanded view of reflections
                        setExpandedReflectionView(!expandedReflectionView);
                      }}
                    >
                      {expandedReflectionView ? "Show Less" : "Show More"}
                    </Button>
                  </div>
                  <div className={`${expandedReflectionView ? 'max-h-60' : 'max-h-28'} overflow-y-auto transition-all duration-300`}>
                    {previousReflections.map((reflection, index) => (
                      <div 
                        key={reflection.id} 
                        className="text-xs bg-white p-2 rounded mb-2 border border-neutral-200"
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Reflection #{index + 1}</span>
                          <span className="text-neutral-500">
                            {new Date(reflection.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className={expandedReflectionView ? '' : 'line-clamp-2'}>
                            <span className="font-medium">Thoughts:</span> {reflection.automaticThoughts}
                          </p>
                          {expandedReflectionView && reflection.alternativePerspective && (
                            <p className="text-xs">
                              <span className="font-medium">Alternative:</span> {reflection.alternativePerspective}
                            </p>
                          )}
                          {expandedReflectionView && (
                            <p className="text-xs">
                              <span className="font-medium">Rating:</span> {reflection.reflectionRating}/10
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                      onChange={(e) => {
                        field.onChange(e);
                        form.setValue("automaticThoughts", e.target.value, { 
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true 
                        });
                      }}
                      onBlur={field.onBlur}
                      ref={(el) => {
                        field.ref(el);
                        if (automaticThoughtsRef) {
                          // @ts-ignore
                          automaticThoughtsRef.current = el;
                        }
                      }}
                      name={field.name}
                      className="focus:border-primary focus:ring-1 focus:ring-primary"
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
                      onChange={(e) => {
                        // Handle the change directly
                        field.onChange(e);
                        // Set the value in the form directly as well
                        form.setValue("evidenceFor", e.target.value, { 
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true 
                        });
                      }}
                      onBlur={field.onBlur}
                      ref={(el) => {
                        // Connect to both refs
                        field.ref(el);
                        if (evidenceForRef) {
                          // @ts-ignore - the ref is a callback, but we want to store the element
                          evidenceForRef.current = el;
                        }
                      }}
                      name={field.name}
                      className="focus:border-primary focus:ring-1 focus:ring-primary"
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
                      onChange={(e) => {
                        // Handle the change directly
                        field.onChange(e);
                        // Set the value in the form directly as well
                        form.setValue("evidenceAgainst", e.target.value, { 
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true 
                        });
                      }}
                      onBlur={field.onBlur}
                      ref={(el) => {
                        // Connect to both refs
                        field.ref(el);
                        if (evidenceAgainstRef) {
                          // @ts-ignore - the ref is a callback, but we want to store the element
                          evidenceAgainstRef.current = el;
                        }
                      }}
                      name={field.name}
                      className="focus:border-primary focus:ring-1 focus:ring-primary"
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
                      onClick={handleAddProtectiveFactor}
                      disabled={!newProtectiveFactor.trim()}
                    >
                      Add
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
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
                      onChange={(e) => {
                        field.onChange(e);
                        form.setValue("alternativePerspective", e.target.value, { 
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true 
                        });
                      }}
                      onBlur={field.onBlur}
                      ref={(el) => {
                        field.ref(el);
                        if (alternativePerspectiveRef) {
                          // @ts-ignore
                          alternativePerspectiveRef.current = el;
                        }
                      }}
                      name={field.name}
                      className="focus:border-primary focus:ring-1 focus:ring-primary"
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
                      onClick={handleAddCopingStrategy}
                      disabled={!newCopingStrategy.trim()}
                    >
                      Add
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
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
            </div>
            
            {/* Before/After Emotion Chart */}
            <div className="mt-6 p-4 bg-neutral-100 rounded-md">
              <h4 className="text-sm font-medium mb-3">Emotion Intensity</h4>
              
              <div className="space-y-4">
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
                      <span className="font-medium">{form.getValues("reflectionRating") || 5}/10</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="text-xs mb-2">Adjust how you feel now after reflection:</p>
                  <div className="space-y-2">
                    <Slider
                      value={[form.getValues("reflectionRating") || 5]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => {
                        form.setValue("reflectionRating", value[0]);
                        // Force re-render to update the display
                        setFormKey(Date.now());
                      }}
                    />
                    <div className="text-center font-medium">
                      Current rating: {form.getValues("reflectionRating") || 5}/10
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
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
                ).join(", ") || "None selected"}</p>
                <p><strong>Coping Strategies:</strong> {selectedCopingStrategies.map(id => 
                  copingStrategies.find(s => s.id === id)?.name
                ).join(", ") || "None selected"}</p>
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
                      onChange={(e) => {
                        field.onChange(e);
                        form.setValue("insightsGained", e.target.value, { 
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true 
                        });
                      }}
                      onBlur={field.onBlur}
                      ref={(el) => {
                        field.ref(el);
                        if (insightsGainedRef) {
                          // @ts-ignore
                          insightsGainedRef.current = el;
                        }
                      }}
                      name={field.name}
                      className="focus:border-primary focus:ring-1 focus:ring-primary"
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
                  <div className="pt-2">
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          value={[field.value || 5]}
                          min={1}
                          max={10}
                          step={1}
                          onValueChange={(value) => {
                            field.onChange(value[0]);
                            // Force re-render to update the display
                            setFormKey(Date.now());
                          }}
                        />
                        <div className="text-center font-medium">
                          Rating: {field.value || 5}/10
                        </div>
                      </div>
                    </FormControl>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Not helpful</span>
                    <span>Very helpful</span>
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

  // Force re-render form on step change
  useEffect(() => {
    setFormKey(Date.now());
  }, [step]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Thought Reflection - Step 1: Identify Your Thoughts"}
            {step === 2 && "Thought Reflection - Step 2: Challenge Your Thoughts"}
            {step === 3 && "Thought Reflection - Step 3: Develop New Perspective"}
            {step === 4 && "Thought Reflection - Step 4: Apply & Rate Your Progress"}
          </DialogTitle>
          <DialogDescription>
            Examining your thoughts can help shift your emotional response.
          </DialogDescription>
        </DialogHeader>
        
        <Progress value={progress} className="my-2" />
        
        <Form {...form} key={formKey}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStepContent()}
            
            <DialogFooter className="gap-2 sm:gap-0">
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
              
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Complete Reflection"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}