import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import ModuleHeader from "@/components/layout/ModuleHeader";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClipboardList, Brain, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";

export default function ThoughtRecords() {
  const { user } = useAuth();
  const { isViewingClientData, activeUserId } = useActiveUser();
  const [location, navigate] = useLocation();
  
  // Check URL parameters for tab
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  
  // Controlled tab state
  const [activeTab, setActiveTab] = useState<string>(
    tabParam === 'history' 
      ? "history" 
      : (isViewingClientData || user?.role === 'therapist') 
        ? "history" 
        : "record"
  );
  
  // Re-sync tab when user role or viewing context changes
  useEffect(() => {
    // If record tab is not available (therapist or viewing client data) and we're on it, switch to history
    const isRecordTabAvailable = !isViewingClientData && user?.role !== 'therapist';
    if (!isRecordTabAvailable && activeTab === 'record') {
      setActiveTab('history');
    }
  }, [user?.role, isViewingClientData, activeTab]);
  
  // Fetch related emotion records for the active user (could be a client viewed by a therapist)
  const { data: emotions } = useQuery({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!activeUserId,
  });
  
  // Fetch thought records for the active user
  const { data: thoughtRecords = [] } = useQuery<ThoughtRecord[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/thoughts`] : [],
    enabled: !!activeUserId,
  });
  
  // Calculate progress stats
  const totalThoughts = thoughtRecords.length;
  const challengedThoughts = thoughtRecords.filter((t: ThoughtRecord) => 
    t.evidenceFor && t.evidenceAgainst
  ).length;
  const unchallengedThoughts = totalThoughts - challengedThoughts;
  
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
        
        {/* Module Header */}
        <ModuleHeader
          title="Thought Records"
          description="Capture automatic thoughts, identify thinking patterns, and challenge unhelpful beliefs"
          badges={[]}
        />
        
        {/* Overall Progress Summary */}
        {thoughtRecords.length > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Overall Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{totalThoughts}</div>
                  <div className="text-sm text-muted-foreground">Total Recorded</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{challengedThoughts}</div>
                  <div className="text-sm text-muted-foreground">Challenged</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{unchallengedThoughts}</div>
                  <div className="text-sm text-muted-foreground">Unchallenged</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            {/* Only show recording tab for clients viewing their own data, and not for therapists */}
            {!isViewingClientData && user?.role !== 'therapist' && (
              <TabsTrigger value="record">Record Thought</TabsTrigger>
            )}
            <TabsTrigger value="history">
              {isViewingClientData ? "Client's Thought Records History" : "Thought Records History"}
            </TabsTrigger>
          </TabsList>
          
          {/* Only show recording functionality for clients viewing their own data
              AND not for therapists (even when viewing their own profile) */}
          {!isViewingClientData && user?.role !== 'therapist' && (
            <TabsContent value="record">
              <Card>
                <CardHeader>
                  <CardTitle>Record Your Thought</CardTitle>
                  <CardDescription>
                    Capture and analyze automatic thoughts as they occur
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {/* Educational Accordion */}
                  <Accordion type="single" collapsible className="mb-6 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg px-4">
                    <AccordionItem value="what-are-ants" className="border-0">
                      <AccordionTrigger className="text-base font-medium hover:no-underline py-3">
                        <div className="flex items-center">
                          <HelpCircle className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                          What are Automatic Thoughts?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        <p className="mb-3">
                          Automatic thoughts (also called ANTs - Automatic Negative Thoughts) are the immediate, involuntary thoughts that pop into your mind in response to situations. They're often so quick and habitual that we don't even notice them.
                        </p>
                        
                        <div className="space-y-3">
                          <div className="bg-white dark:bg-slate-900/50 p-3 rounded-md">
                            <h4 className="font-medium text-foreground mb-1">Catch the Thought</h4>
                            <p>The first step is simply noticing these thoughts. Write them down exactly as they occur—don't judge or analyze yet.</p>
                            <p className="text-xs mt-1 italic text-indigo-600 dark:text-indigo-400">Example: "I'm going to fail this presentation" or "Everyone thinks I'm boring"</p>
                          </div>
                          
                          <div className="bg-white dark:bg-slate-900/50 p-3 rounded-md">
                            <h4 className="font-medium text-foreground mb-1">Identify the Pattern</h4>
                            <p>Once recorded, you'll identify which type of unhelpful thinking pattern (ANT category) it represents—like catastrophizing or mind-reading.</p>
                          </div>
                          
                          <div className="bg-white dark:bg-slate-900/50 p-3 rounded-md">
                            <h4 className="font-medium text-foreground mb-1">Challenge & Reframe</h4>
                            <p>After recording, you can challenge these thoughts by examining evidence and developing more balanced perspectives.</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <ThoughtRecordWizard onClose={() => {
                    // Switch to history tab after successful recording
                    setActiveTab('history');
                  }} />
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="history">
            {isViewingClientData ? (
              <Card>
                <CardHeader>
                  <CardTitle>Client's Thought Records History</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2">
                      <ClipboardList size={16} />
                      View thought records and reflections for this client
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ThoughtRecordsList onEditRecord={handleEditThought} />
                </CardContent>
              </Card>
            ) : (
              <ThoughtRecordsList onEditRecord={handleEditThought} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
