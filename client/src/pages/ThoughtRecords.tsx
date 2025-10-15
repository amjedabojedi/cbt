import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import ThoughtRecordsList from "@/components/thought/ThoughtRecordsList";
import ThoughtRecordWizard from "@/components/thought/ThoughtRecordWizard";
import { format } from "date-fns";
import { ThoughtRecord as BaseThoughtRecord } from "@shared/schema";
import useActiveUser from "@/hooks/use-active-user";
import { ClientDebug } from "@/components/debug/ClientDebug";
import { useLocation, Link } from "wouter";
import { BackToClientsButton } from "@/components/navigation/BackToClientsButton";

// Use the schema definition directly
type ThoughtRecord = BaseThoughtRecord;

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  ClipboardList, 
  Info, 
  HelpCircle, 
  CalendarDays, 
  HeartPulse, 
  BrainCircuit,
  AlertTriangle,
  Scale,
  Lightbulb,
  Sparkles,
  LineChart,
  BookOpen,
  BookText,
  ArrowUpRight,
  ExternalLink
} from "lucide-react";

export default function ThoughtRecords() {
  const { user } = useAuth();
  const { isViewingClientData, activeUserId } = useActiveUser();
  const [selectedThought, setSelectedThought] = useState<ThoughtRecord | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [location, navigate] = useLocation();
  
  // Fetch related emotion records for the active user (could be a client viewed by a therapist)
  const { data: emotions } = useQuery({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!activeUserId,
  });
  
  // Fetch thought records for the active user
  const { data: thoughtRecords } = useQuery({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/thoughts`] : [],
    enabled: !!activeUserId,
  });
  
  // Handle opening a specific thought record from query parameter
  useEffect(() => {
    // Check if we have a record query parameter
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get('record');
    
    if (recordId && thoughtRecords && Array.isArray(thoughtRecords)) {
      // Find the thought record by ID
      const record = thoughtRecords.find((r: ThoughtRecord) => r.id === parseInt(recordId, 10));
      if (record) {
        // Open the record details dialog
        setSelectedThought(record);
      }
    }
  }, [thoughtRecords, location]);
  
  // Format date for display
  const formatDate = (date: string | Date) => {
    return format(new Date(date), "MMM d, yyyy h:mm a");
  };
  
  // Find related emotion for a thought record
  const findRelatedEmotion = (emotionRecordId: number | null) => {
    if (!emotions || !Array.isArray(emotions) || emotionRecordId === null) return undefined;
    return emotions.find((emotion: any) => emotion.id === emotionRecordId);
  };
  
  // Handle editing a thought record
  const handleEditThought = (thought: ThoughtRecord) => {
    // Redirect to reflection wizard with the record ID to edit using router
    navigate(`/reflection?edit=${thought.id}`);
  };

  return (
    <AppLayout title="Thought Records">
      <div className="container mx-auto px-4 py-6">
        {/* Back to Clients button */}
        <BackToClientsButton />
        
        {/* Debug Information (Development Only) */}
        <ClientDebug />
        
        <div className="flex flex-col space-y-8">
          {!showWizard && <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                {isViewingClientData ? (
                  <>
                    <CardTitle>Client's Thought Records</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <ClipboardList size={16} />
                        View thought records and reflections for this client
                      </div>
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle className="flex items-center gap-2">
                      Thought Records
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle size={16} className="text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-4">
                            <div className="text-xs">
                              Thought records help identify and challenge unhelpful thought patterns.
                              They're a core CBT tool for improving emotional well-being.
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <CardDescription>
                      Review and analyze your thought patterns
                    </CardDescription>
                  </>
                )}
              </div>
              
              {/* Only show New Record button if user is viewing their own data AND is not a therapist */}
              {!isViewingClientData && user?.role !== 'therapist' && (
                <Button onClick={() => setShowWizard(true)} data-testid="button-new-thought">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Thought Record
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!isViewingClientData && user?.role !== 'therapist' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                    <div className="flex gap-2 text-blue-700">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <p className="text-xs">
                        Record automatic thoughts as they occur. You can optionally link them to emotions you've tracked.
                        Thought records help you identify patterns in your thinking and develop healthier perspectives.
                      </p>
                    </div>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="about-thought-records">
                      <AccordionTrigger className="text-sm">
                        About Cognitive Distortions
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>Cognitive distortions are patterns of thinking that can reinforce negative emotions. Common types include:</p>
                          <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li><span className="font-medium">All-or-nothing thinking:</span> Seeing things in black and white categories</li>
                            <li><span className="font-medium">Catastrophizing:</span> Expecting disaster or exaggerating negative outcomes</li>
                            <li><span className="font-medium">Emotional reasoning:</span> Assuming feelings reflect reality ("I feel bad, so it must be bad")</li>
                            <li><span className="font-medium">Mind reading:</span> Assuming you know what others are thinking</li>
                            <li><span className="font-medium">Overgeneralization:</span> Seeing a single negative event as a never-ending pattern</li>
                          </ul>
                          <p className="text-xs text-muted-foreground mt-2">Identifying these patterns is the first step to challenging them.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
              {!isViewingClientData && user?.role === 'therapist' && (
                <div className="text-center py-4 text-sm text-neutral-500">
                  As a therapist, you can view client records but cannot create your own records.
                </div>
              )}
            </CardContent>
          </Card>}
          
          {/* Only show list when wizard is not open */}
          {!showWizard && <ThoughtRecordsList onEditRecord={handleEditThought} />}
        </div>
        
        {/* Thought Record Wizard - Show instead of list when active */}
        {showWizard && (
          <div className="mb-6">
            <ThoughtRecordWizard 
              onClose={() => setShowWizard(false)} 
            />
          </div>
        )}
        
        {/* Thought Record Details Dialog */}
        {selectedThought && (
          <Dialog open={!!selectedThought} onOpenChange={() => setSelectedThought(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-bold">Thought Record</DialogTitle>
                  <div className="flex items-center">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <CalendarDays size={14} className="mr-1" />
                      {formatDate(selectedThought.createdAt)}
                    </Badge>
                  </div>
                </div>
                <DialogDescription>
                  Cognitive behavioral therapy worksheet for examining thoughts and beliefs
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Emotion Connection Card */}
                {findRelatedEmotion(selectedThought.emotionRecordId) && (
                  <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <HeartPulse size={16} className="text-blue-500" />
                        Connected Emotion
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge className="mr-2 bg-blue-100 text-blue-800 border-none hover:bg-blue-200">
                            {findRelatedEmotion(selectedThought.emotionRecordId)?.tertiaryEmotion}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Intensity: {findRelatedEmotion(selectedThought.emotionRecordId)?.intensity}/10
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs"
                            asChild
                          >
                            <Link href={`/emotion-tracking?tab=history&id=${selectedThought.emotionRecordId}`}>
                              <HeartPulse size={14} className="mr-1" />
                              View Emotion
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Main Content Sections */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <BrainCircuit size={18} className="text-primary" />
                      Automatic Thoughts
                    </CardTitle>
                    <CardDescription>
                      The thoughts that automatically came to mind in the situation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 border rounded-md bg-card shadow-sm whitespace-pre-wrap">
                      {selectedThought.automaticThoughts}
                    </div>
                  </CardContent>
                </Card>

                {/* Thought Category Section */}
                {selectedThought.thoughtCategory && selectedThought.thoughtCategory.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <BookText size={18} className="text-purple-500" />
                        Thought Type
                      </CardTitle>
                      <CardDescription>
                        What category of thought this represents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 p-2">
                        {selectedThought.thoughtCategory.map((category, idx) => (
                          <Badge 
                            key={idx} 
                            className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200"
                          >
                            {formatCategoryName(category)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Situation Section */}
                {selectedThought.situation && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <CalendarDays size={18} className="text-green-500" />
                        Situation
                      </CardTitle>
                      <CardDescription>
                        What was happening when you had this thought
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 border rounded-md bg-card shadow-sm whitespace-pre-wrap">
                        {selectedThought.situation}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cognitive Distortions Section */}
                {selectedThought.cognitiveDistortions && selectedThought.cognitiveDistortions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        Cognitive Distortions
                      </CardTitle>
                      <CardDescription>
                        Patterns of thinking that can reinforce negative emotions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 p-2">
                        {selectedThought.cognitiveDistortions.map((distortion, idx) => (
                          <Badge 
                            key={idx} 
                            className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                          >
                            {formatDistortionName(distortion)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Evidence Section */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Scale size={18} className="text-primary" />
                      Evidence Evaluation
                    </CardTitle>
                    <CardDescription>
                      Facts and observations for and against the automatic thoughts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedThought.evidenceFor && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-primary">Supporting Evidence</h4>
                          <div className="p-4 border rounded-md bg-card/50 shadow-sm">
                            <p className="text-sm">{selectedThought.evidenceFor}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedThought.evidenceAgainst && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-primary">Contradicting Evidence</h4>
                          <div className="p-4 border rounded-md bg-card/50 shadow-sm">
                            <p className="text-sm">{selectedThought.evidenceAgainst}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Alternative Perspective Section */}
                {selectedThought.alternativePerspective && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Lightbulb size={18} className="text-amber-500" />
                        Alternative Perspective
                      </CardTitle>
                      <CardDescription>
                        A more balanced and realistic view of the situation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 border rounded-md bg-card shadow-sm">
                        <p className="text-sm">{selectedThought.alternativePerspective}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Insights Section */}
                {selectedThought.insightsGained && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-500" />
                        Insights Gained
                      </CardTitle>
                      <CardDescription>
                        What was learned from this reflection process
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 border rounded-md bg-card shadow-sm">
                        <p className="text-sm">{selectedThought.insightsGained}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Reflection Rating */}
                {selectedThought.reflectionRating !== null && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <LineChart size={18} className="text-green-500" />
                        Progress Rating
                      </CardTitle>
                      <CardDescription>
                        How helpful was this reflection in changing perspective
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center p-2">
                        <div className="w-full bg-neutral-200 rounded-full h-3 mr-3">
                          <div 
                            className="bg-gradient-to-r from-green-300 to-green-500 h-3 rounded-full" 
                            style={{ width: `${(selectedThought.reflectionRating / 10) * 100}%` }}
                          ></div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-none">
                          {selectedThought.reflectionRating}/10
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Related Journal Entries - Cross-component connection */}
                {selectedThought.relatedJournalEntryIds && selectedThought.relatedJournalEntryIds.length > 0 && (
                  <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BookOpen size={16} className="text-purple-500" />
                        Connected Journal Entries
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="flex flex-col gap-2">
                        {selectedThought.relatedJournalEntryIds.map((journalId) => (
                          <Button 
                            key={journalId} 
                            variant="outline" 
                            size="sm" 
                            className="justify-start text-left h-auto py-2 font-normal"
                            asChild
                          >
                            <Link href={`/journal?entry=${journalId}`}>
                              <BookText size={14} className="mr-2 text-purple-500" />
                              <span className="truncate">View journal entry</span>
                              <ArrowUpRight size={14} className="ml-auto text-muted-foreground" />
                            </Link>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}

// Helper to format cognitive distortion names
function formatDistortionName(distortion: string) {
  return distortion
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to format thought category names
function formatCategoryName(category: string) {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Brain icon component
function Brain(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-1.98-2 2.5 2.5 0 0 1-1.32-4.24 2.5 2.5 0 0 1 .34-3.3 2.5 2.5 0 0 1 1.43-4.35A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 1.98-2 2.5 2.5 0 0 0 1.32-4.24 2.5 2.5 0 0 0-.34-3.3 2.5 2.5 0 0 0-1.43-4.35A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}
