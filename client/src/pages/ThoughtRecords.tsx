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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ClipboardList } from "lucide-react";

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
  const { data: thoughtRecords } = useQuery({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/thoughts`] : [],
    enabled: !!activeUserId,
  });
  
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
