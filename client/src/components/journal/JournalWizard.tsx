import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useActiveUser from "@/hooks/use-active-user";
import { getEmotionInfo } from "@/utils/emotionUtils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Send,
  Sparkles,
  Heart,
  Tag,
  CheckCircle,
  X,
  Plus,
  CheckSquare,
  HelpCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Form schema
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(20, "Please write at least 20 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface JournalWizardProps {
  onEntryCreated?: () => void;
}

export default function JournalWizard({ onEntryCreated }: JournalWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeUserId } = useActiveUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [createdEntry, setCreatedEntry] = useState<any>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  
  const totalSteps = 4;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Validate current step
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 0:
        return true; // Intro step - no validation needed
      case 1:
        return await form.trigger("title");
      case 2:
        return await form.trigger("content");
      case 3:
        return true; // AI analysis step - no validation needed
      default:
        return false;
    }
  };

  // Handle next step
  const handleNextStep = async () => {
    const isValid = await validateStep(currentStep);
    
    if (isValid) {
      if (currentStep === 2) {
        // Before moving to step 3, create entry and analyze
        await createEntryWithAnalysis();
      } else if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Create entry and get AI analysis
  const createEntryWithAnalysis = async () => {
    if (!activeUserId) return;
    
    setIsAnalyzing(true);
    
    try {
      const values = form.getValues();
      const response = await apiRequest("POST", "/api/journal", {
        userId: activeUserId,
        title: values.title,
        content: values.content,
      });
      
      const entry = await response.json();
      setCreatedEntry(entry);
      
      // Pre-select AI-detected emotions and topics
      if (entry.emotions || entry.topics) {
        const aiTags = [...(entry.emotions || []), ...(entry.topics || [])];
        setSelectedTags(aiTags);
      }
      
      setCurrentStep(3);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create journal entry",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save selected tags and complete
  const handleComplete = async () => {
    if (!createdEntry || !activeUserId) return;

    try {
      // Update entry with selected tags
      await apiRequest("POST", `/api/journal/${createdEntry.id}/tags`, {
        selectedTags,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${activeUserId}/journal`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${activeUserId}/journal/stats`] });

      setShowSuccessDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save tags",
        variant: "destructive",
      });
    }
  };

  // Toggle tag selection
  const toggleTagSelection = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Add custom tag
  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      toggleTagSelection(customTag.trim());
      setCustomTag("");
    }
  };

  // Reset wizard
  const handleReset = () => {
    form.reset();
    setCurrentStep(0);
    setCreatedEntry(null);
    setSelectedTags([]);
    setShowSuccessDialog(false);
    
    if (onEntryCreated) {
      onEntryCreated();
    }
  };

  const progress = (currentStep / (totalSteps - 1)) * 100;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle>Journal Entry Wizard</CardTitle>
              <CardDescription>
                {currentStep === 0 ? "Introduction" : `Step ${currentStep} of ${totalSteps - 1}`}
              </CardDescription>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span className={currentStep >= 1 ? "text-blue-600 font-medium" : ""}>
                1. Title
              </span>
              <span className={currentStep >= 2 ? "text-blue-600 font-medium" : ""}>
                2. Write
              </span>
              <span className={currentStep >= 3 ? "text-blue-600 font-medium" : ""}>
                3. Review
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              {/* Step 0: Introduction */}
              {currentStep === 0 && (
                <div className="space-y-6" data-testid="step-intro">
                  <div className="text-center space-y-4 py-8">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                      <Send className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome to Journaling</h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Express your thoughts and feelings in a safe, private space. Our AI will help identify patterns and provide insights.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Heart className="h-4 w-4 text-blue-600" />
                          </div>
                          Process Emotions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-700">
                        Writing about your feelings helps reduce emotional intensity and provides clarity.
                      </CardContent>
                    </Card>

                    <Card className="border-teal-200 bg-teal-50/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="p-2 bg-teal-100 rounded-lg">
                            <Sparkles className="h-4 w-4 text-teal-600" />
                          </div>
                          AI-Powered Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-700">
                        Our AI analyzes your entry to detect emotions, topics, and provide helpful insights.
                      </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-purple-50/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Tag className="h-4 w-4 text-purple-600" />
                          </div>
                          Track Patterns
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-700">
                        Tags help you organize and discover recurring themes in your mental health journey.
                      </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-amber-50/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <CheckSquare className="h-4 w-4 text-amber-600" />
                          </div>
                          Private & Secure
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-700">
                        Your journal entries are completely private and only visible to you and your therapist.
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-blue-600" />
                      What You'll Do Next
                    </h3>
                    <ol className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600 mt-0.5">1.</span>
                        <span>Create a title that captures the main theme of your entry</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600 mt-0.5">2.</span>
                        <span>Write freely about your thoughts, feelings, and experiences</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600 mt-0.5">3.</span>
                        <span>Review AI-detected emotions and topics, customize your tags</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700">
                      <strong className="text-blue-900">💡 Tip:</strong> There's no right or wrong way to journal. Write as much or as little as you need. The goal is to express yourself authentically.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Step 1: Title */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Why Title Your Entry?
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      A clear title helps you quickly identify and find entries later. Think of it as a headline that captures the main theme or event of your day.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg flex items-center gap-2">
                          Entry Title <span className="text-red-500 text-xl">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., A Challenging Day at Work, Weekend Reflections..."
                            className="text-base"
                            {...field}
                            data-testid="input-journal-title"
                          />
                        </FormControl>
                        <FormDescription>
                          Give your entry a descriptive title (at least 3 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Content */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Why Journal?
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Writing helps you process emotions, understand patterns, and gain insights. Express yourself freely without judgment - this is your safe space.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg flex items-center gap-2">
                          What's on your mind? <span className="text-red-500 text-xl">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write about your thoughts, feelings, experiences... Be as detailed as you like."
                            className="resize-none min-h-[200px] text-base"
                            {...field}
                            data-testid="textarea-journal-content"
                          />
                        </FormControl>
                        <FormDescription>
                          Write at least 20 characters to capture your thoughts
                        </FormDescription>
                        <FormMessage />
                        {field.value && field.value.length < 20 && (
                          <p className="text-sm text-amber-600 mt-2">
                            Keep writing... ({field.value.length}/20 characters minimum)
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: AI Analysis & Tag Review */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
                      <p className="text-lg font-medium">AI is analyzing your entry...</p>
                      <p className="text-sm text-muted-foreground">Detecting emotions and themes</p>
                    </div>
                  ) : createdEntry ? (
                    <>
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Review AI-Detected Tags
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          AI has identified emotions and topics in your entry. Review and select the tags that feel right. You can also add your own custom tags.
                        </p>
                      </div>

                      {/* AI Analysis Summary */}
                      {createdEntry.aiAnalysis && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              AI Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{createdEntry.aiAnalysis}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Emotions & Topics Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Emotions */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Heart className="h-4 w-4 text-rose-500" />
                              Emotions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {createdEntry.emotions?.map((emotion: string, i: number) => {
                                const { color } = getEmotionInfo(emotion);
                                return (
                                  <Badge
                                    key={`${emotion}-${i}`}
                                    variant={selectedTags.includes(emotion) ? "default" : "outline"}
                                    className={`cursor-pointer hover:opacity-80 transition-colors ${
                                      selectedTags.includes(emotion) ? "" : color
                                    }`}
                                    onClick={() => toggleTagSelection(emotion)}
                                  >
                                    {emotion}
                                    {selectedTags.includes(emotion) && (
                                      <CheckCircle className="h-3 w-3 ml-1" />
                                    )}
                                  </Badge>
                                );
                              })}
                              {(!createdEntry.emotions || createdEntry.emotions.length === 0) && (
                                <p className="text-sm text-muted-foreground">No emotions detected</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Topics */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Tag className="h-4 w-4 text-blue-500" />
                              Topics
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {createdEntry.topics?.map((topic: string, i: number) => {
                                const { color } = getEmotionInfo(topic);
                                return (
                                  <Badge
                                    key={`${topic}-${i}`}
                                    variant={selectedTags.includes(topic) ? "default" : "outline"}
                                    className={`cursor-pointer hover:opacity-80 transition-colors ${
                                      selectedTags.includes(topic) ? "" : color
                                    }`}
                                    onClick={() => toggleTagSelection(topic)}
                                  >
                                    {topic}
                                    {selectedTags.includes(topic) && (
                                      <CheckCircle className="h-3 w-3 ml-1" />
                                    )}
                                  </Badge>
                                );
                              })}
                              {(!createdEntry.topics || createdEntry.topics.length === 0) && (
                                <p className="text-sm text-muted-foreground">No topics detected</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Custom Tag Input */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Plus className="h-4 w-4 text-green-500" />
                            Add Custom Tag
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Input
                              value={customTag}
                              onChange={(e) => setCustomTag(e.target.value)}
                              placeholder="Enter a custom tag"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCustomTag();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={handleAddCustomTag}
                              disabled={!customTag.trim()}
                              size="sm"
                            >
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Selected Tags Summary */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckSquare className="h-4 w-4 text-purple-500" />
                            Selected Tags ({selectedTags.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedTags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedTags.map((tag, i) => (
                                <Badge
                                  key={`selected-${tag}-${i}`}
                                  className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 cursor-pointer flex items-center gap-1"
                                  onClick={() => toggleTagSelection(tag)}
                                >
                                  {tag}
                                  <X className="h-3 w-3" />
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No tags selected. Click on emotions or topics above to select them.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  ) : null}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 0 || isAnalyzing}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentStep < totalSteps - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isAnalyzing}
                  >
                    {currentStep === 0 ? "Get Started" : currentStep === 2 ? "Analyze Entry" : "Next"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleComplete}
                    disabled={isAnalyzing}
                    data-testid="button-complete-journal"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Save Entry
                  </Button>
                )}
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        setShowSuccessDialog(open);
        if (!open) {
          handleReset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Journal Entry Saved!
            </DialogTitle>
            <DialogDescription>
              Your entry has been saved with {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Entry Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{form.getValues("title")}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {form.getValues("content")}
                </p>
              </CardContent>
            </Card>

            {selectedTags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Selected Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleReset}>
              Write Another Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
