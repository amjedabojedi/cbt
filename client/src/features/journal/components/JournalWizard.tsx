import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useActiveUser from "@/hooks/use-active-user";
import { getEmotionInfo } from "@/utils/emotionUtils";
import { cn } from "@/lib/utils";
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";
import WizardSuccessDialog from "@/features/journal/components/wizard/WizardSuccessDialog";
import { JournalTag } from "@/features/journal/components/JournalTag";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import WizardProgressHeader from "@/features/journal/components/wizard/WizardProgressHeader";
import WizardNavButtons from "@/features/journal/components/wizard/WizardNavButtons";
import { Badge } from "@/components/ui/badge";
import {
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

type FormValues = { title: string; content: string };

interface JournalWizardProps {
  onEntryCreated?: () => void;
}

export default function JournalWizard({ onEntryCreated }: JournalWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeUserId } = useActiveUser();
  const { t, isRTL } = useLocalization();

  const formSchema = z.object({
    title: z.string().min(3, t("Title must be at least 3 characters")),
    content: z.string().min(20, t("Please write at least 20 characters")),
  });
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
        title: t("Error"),
        description: t("Failed to create journal entry"),
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
        title: t("Error"),
        description: t("Failed to save tags"),
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

  const tagCountLabel =
    selectedTags.length === 1
      ? t("Your entry has been saved with {count} tag.").replace("{count}", String(selectedTags.length))
      : t("Your entry has been saved with {count} tags.").replace("{count}", String(selectedTags.length));

  return (
    <>
      <Card dir={isRTL ? "rtl" : "ltr"}>
        <WizardProgressHeader
          title={t("Journal Entry Wizard")}
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={[t("1. Title"), t("2. Write"), t("3. Review")]}
        />

        <CardContent className="p-4 sm:p-5">
          <Form {...form}>
            <div className="space-y-4 pb-1">
              {/* Step 0: Introduction */}
              {currentStep === 0 && (
                <div className="space-y-4" data-testid="step-intro">
                  <div className="text-center space-y-2 py-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                      <Send className="h-6 w-6 text-purple-600" /> {t("Welcome to Journaling")}
                    </h2>
                    <p className="text-gray-600 text-sm max-w-2xl mx-auto">
                      {t("Express your thoughts and feelings in a safe, private space. Our AI will help identify patterns and provide insights.")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Concept Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
                      <Card className="border-purple-100 bg-purple-50/30 flex flex-col justify-center p-3.5 h-full">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Heart className="h-4.5 w-4.5 text-purple-700 shrink-0" />
                          <h4 className="font-bold text-xs sm:text-sm text-gray-900">{t("Process Emotions")}</h4>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-600 leading-normal">
                          {t("Reduce emotional intensity and gain clarity.")}
                        </p>
                      </Card>

                      <Card className="border-purple-100 bg-purple-50/30 flex flex-col justify-center p-3.5 h-full">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Sparkles className="h-4.5 w-4.5 text-purple-700 shrink-0" />
                          <h4 className="font-bold text-xs sm:text-sm text-gray-900">{t("AI Insights")}</h4>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-600 leading-normal">
                          {t("Detect emotions, topics, and cognitive patterns.")}
                        </p>
                      </Card>

                      <Card className="border-purple-100 bg-purple-50/30 flex flex-col justify-center p-3.5 h-full">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Tag className="h-4.5 w-4.5 text-purple-700 shrink-0" />
                          <h4 className="font-bold text-xs sm:text-sm text-gray-900">{t("Track Patterns")}</h4>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-600 leading-normal">
                          {t("Discover recurring themes in your mental wellness journey.")}
                        </p>
                      </Card>

                      <Card className="border-purple-100 bg-purple-50/30 flex flex-col justify-center p-3.5 h-full">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CheckSquare className="h-4.5 w-4.5 text-purple-700 shrink-0" />
                          <h4 className="font-bold text-xs sm:text-sm text-gray-900">{t("Private & Secure")}</h4>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-600 leading-normal">
                          {t("Your records are private and visible only to you and your therapist.")}
                        </p>
                      </Card>
                    </div>

                    {/* Right Column: What You'll Do Next */}
                    <Card className="border-purple-100 bg-gradient-to-br from-purple-50/30 to-indigo-50/30 flex flex-col justify-between p-4 h-full">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-3.5 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-purple-700" />
                          {t("What You'll Do Next")}
                        </h3>
                        <ol className="space-y-3 text-xs sm:text-sm text-gray-700">
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-purple-700 mt-0.5 shrink-0">1.</span>
                            <span>{t("Create a title that captures the main theme of your entry.")}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-purple-700 mt-0.5 shrink-0">2.</span>
                            <span>{t("Write freely about your thoughts, feelings, and experiences.")}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-purple-700 mt-0.5 shrink-0">3.</span>
                            <span>{t("Review AI-detected emotions and topics, customize your tags.")}</span>
                          </li>
                        </ol>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
              
              {/* Step 1: Title */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch font-sans" data-testid="step-title">
                  <div className="md:col-span-8 flex flex-col justify-between">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-base font-bold text-gray-900 flex items-center gap-2">
                            {t("Entry Title")} <span className="text-red-500 font-normal">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("e.g., A Challenging Day at Work, Weekend Reflections...")}
                              className="text-base h-11 border-purple-100 focus-visible:ring-purple-950"
                              voiceInput
                              {...field}
                              data-testid="input-journal-title"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            {t("Give your entry a descriptive title (at least 3 characters)")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-4 bg-purple-50/30 p-4 rounded-xl border border-purple-100 flex flex-col justify-center">
                    <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1.5 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-purple-700" />
                      {t("Why Title Your Entry?")}
                    </h3>
                    <p className="text-xs text-gray-600 leading-normal">
                      {t("A clear title helps you quickly identify and find entries later. Think of it as a headline that captures the main theme or event of your day.")}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Content */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch" data-testid="step-content">
                  <div className="md:col-span-8 flex flex-col justify-between">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-base font-bold text-gray-900 flex items-center gap-2">
                            {t("What's on your mind?")} <span className="text-red-500 font-normal">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("Write about your thoughts, feelings, experiences... Be as detailed as you like.")}
                              className="resize-none min-h-[140px] text-base border-purple-100 focus-visible:ring-purple-950"
                              rows={5}
                              {...field}
                              data-testid="textarea-journal-content"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            {t("Write at least 20 characters to capture your thoughts")}
                          </FormDescription>
                          <FormMessage />
                          {field.value && field.value.length < 20 && (
                            <p className="text-[11px] text-amber-600 mt-1 font-medium">
                              {t("Keep writing...")} ({field.value.length}/20 {t("characters minimum")})
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-4 bg-purple-50/30 p-4 rounded-xl border border-purple-100 flex flex-col justify-center">
                    <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1.5 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-purple-700" />
                      {t("Why Journal?")}
                    </h3>
                    <p className="text-xs text-gray-600 leading-normal">
                      {t("Writing helps you process emotions, understand patterns, and gain insights. Express yourself freely without judgment - this is your safe space.")}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: AI Analysis & Tag Review */}
              {currentStep === 3 && (
                <div className="space-y-3 font-sans" data-testid="step-review">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="animate-spin h-10 w-10 border-4 border-[#090514] border-t-transparent rounded-full" />
                      <p className="text-base font-bold text-gray-900">{t("AI is analyzing your entry...")}</p>
                      <p className="text-xs text-gray-500">{t("Detecting emotions and themes")}</p>
                    </div>
                  ) : createdEntry ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                      {/* Left Column: AI Insights & Add Tag */}
                      <div className="md:col-span-6 flex flex-col gap-3">
                        {/* AI Insights Summary */}
                        {createdEntry.aiAnalysis ? (
                          <Card className="border-purple-100 bg-purple-50/20 flex flex-col justify-between flex-1">
                            <CardHeader className="p-3.5 pb-2">
                              <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-purple-700" />
                                {t("AI Insights")}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3.5 pt-0">
                              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                <DynamicTranslator text={createdEntry.aiAnalysis} />
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="border-purple-100 bg-purple-50/20 flex flex-col justify-between flex-1">
                            <CardHeader className="p-3.5 pb-2">
                              <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-purple-700" />
                                {t("AI Insights")}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3.5 pt-0">
                              <p className="text-xs italic text-gray-500">
                                {t("Processing insights for your entry...")}
                              </p>
                            </CardContent>
                          </Card>
                        )}

                        {/* Custom Tag Input */}
                        <Card className="border-purple-100 bg-purple-50/20">
                          <CardHeader className="p-3.5 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                              <Plus className="h-4 w-4 text-purple-700" />
                              {t("Add Custom Tag")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3.5 pt-0">
                            <div className="flex gap-2">
                              <Input
                                value={customTag}
                                onChange={(e) => setCustomTag(e.target.value)}
                                placeholder={t("Enter a custom tag...")}
                                className="h-9 text-sm border-purple-100 focus-visible:ring-purple-950 bg-white"
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
                                className="bg-[#090514] hover:bg-purple-950 text-white rounded-lg h-9"
                              >
                                {t("Add")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right Column: Unified Card for Tag Selection & Review */}
                      <Card className="md:col-span-6 border-purple-100 bg-gradient-to-br from-purple-50/20 to-indigo-50/20 flex flex-col justify-between">
                        <CardHeader className="p-3.5 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <Tag className="h-4 w-4 text-purple-700" />
                            {t("Review & Select Tags")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 space-y-3.5 flex-1 flex flex-col justify-between">
                          {/* Emotions Section */}
                          <div>
                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1.5">
                              <Heart className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                              {t("Detected Emotions")}
                            </h4>
                            <div className="max-h-[70px] overflow-y-auto pr-1 flex flex-wrap gap-1.5 custom-scrollbar">
                              {createdEntry.emotions?.map((emotion: string, i: number) => {
                                const { color } = getEmotionInfo(emotion);
                                const isSelected = selectedTags.includes(emotion);
                                return (
                                  <Badge
                                    key={`${emotion}-${i}`}
                                    variant="outline"
                                    className={cn(
                                      "cursor-pointer hover:opacity-90 transition-all font-medium py-1 px-2.5 rounded-lg text-xs",
                                      isSelected
                                        ? "bg-[#090514] hover:bg-purple-950 text-white border-transparent shadow-sm"
                                        : cn("bg-white border-slate-200 text-slate-700", color)
                                    )}
                                    onClick={() => toggleTagSelection(emotion)}
                                  >
                                    <JournalTag text={emotion} />
                                    {isSelected && (
                                      <Check className="h-3 w-3 ms-1 text-white shrink-0" />
                                    )}
                                  </Badge>
                                );
                              })}
                              {(!createdEntry.emotions || createdEntry.emotions.length === 0) && (
                                <p className="text-[11px] text-gray-500 italic">{t("No emotions detected")}</p>
                              )}
                            </div>
                          </div>

                          {/* Topics Section */}
                          <div>
                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1.5">
                              <Tag className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              {t("Topics & Themes")}
                            </h4>
                            <div className="max-h-[70px] overflow-y-auto pr-1 flex flex-wrap gap-1.5 custom-scrollbar">
                              {createdEntry.topics?.map((topic: string, i: number) => {
                                const { color } = getEmotionInfo(topic);
                                const isSelected = selectedTags.includes(topic);
                                return (
                                  <Badge
                                    key={`${topic}-${i}`}
                                    variant="outline"
                                    className={cn(
                                      "cursor-pointer hover:opacity-90 transition-all font-medium py-1 px-2.5 rounded-lg text-xs",
                                      isSelected
                                        ? "bg-[#090514] hover:bg-purple-950 text-white border-transparent shadow-sm"
                                        : cn("bg-white border-slate-200 text-slate-700", color)
                                    )}
                                    onClick={() => toggleTagSelection(topic)}
                                  >
                                    <JournalTag text={topic} />
                                    {isSelected && (
                                      <Check className="h-3 w-3 ms-1 text-white shrink-0" />
                                    )}
                                  </Badge>
                                );
                              })}
                              {(!createdEntry.topics || createdEntry.topics.length === 0) && (
                                <p className="text-[11px] text-gray-500 italic">{t("No topics detected")}</p>
                              )}
                            </div>
                          </div>

                          {/* Selected Tags Summary */}
                          <div className="border-t border-purple-100/50 pt-2.5">
                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1.5">
                              <CheckSquare className="h-3.5 w-3.5 text-purple-700 shrink-0" />
                              {t("Selected Tags ({count})").replace("{count}", String(selectedTags.length))}
                            </h4>
                            <div className="max-h-[70px] overflow-y-auto pr-1 flex flex-wrap gap-1.5 custom-scrollbar">
                              {selectedTags.length > 0 ? (
                                selectedTags.map((tag, i) => (
                                  <Badge
                                    key={`selected-${tag}-${i}`}
                                    className="bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200/60 font-medium py-1 px-2 rounded-lg text-xs cursor-pointer flex items-center gap-1 transition-all"
                                    onClick={() => toggleTagSelection(tag)}
                                  >
                                    <JournalTag text={tag} />
                                    <X className="h-3 w-3 text-purple-700 shrink-0" />
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-[11px] text-gray-500 italic">
                                  {t("No tags selected yet. Click emotions or topics above to select.")}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : null}
                </div>
              )}

              <WizardNavButtons
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={handlePreviousStep}
                onNext={handleNextStep}
                onSubmit={handleComplete}
                isSubmitting={isAnalyzing}
                nextLabel={currentStep === 2 ? "Analyze Entry" : "Next"}
                submitLabel="Save Entry"
                nextButtonClassName="bg-[#090514] hover:bg-purple-950 text-white rounded-xl shadow-md border-0 transition-colors py-2 px-5 font-semibold text-sm"
                submitButtonClassName="bg-[#090514] hover:bg-purple-950 text-white rounded-xl shadow-md border-0 transition-colors py-2 px-5 font-semibold text-sm"
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      <WizardSuccessDialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          if (!open) handleReset();
        }}
        title={t("Journal Entry Saved!")}
        description={tagCountLabel}
      >
        <Card className="border-slate-100 bg-slate-50/50 shadow-none">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              {t("Entry Summary")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="font-bold text-gray-900 text-sm sm:text-base">
              <DynamicTranslator text={form.getValues("title")} />
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
              <DynamicTranslator text={form.getValues("content")} />
            </p>
          </CardContent>
        </Card>

        {selectedTags.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {t("Selected Tags:")}
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pe-1">
              {selectedTags.map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-purple-50 text-purple-950 border-0 text-xs py-0.5 px-2.5 rounded-md font-medium"
                >
                  <JournalTag text={tag} />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => setShowSuccessDialog(false)}
            className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex-1"
          >
            {t("Done")}
          </Button>
          <Button
            onClick={handleReset}
            className="bg-[#090514] hover:bg-purple-950 text-white rounded-xl shadow-md border-0 font-medium flex-1"
          >
            {t("Write Another Entry")}
          </Button>
        </div>
      </WizardSuccessDialog>
    </>
  );
}
