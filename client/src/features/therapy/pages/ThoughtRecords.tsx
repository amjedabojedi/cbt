import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { BackToClientsButton } from "@/features/dashboard/components/navigation/BackToClientsButton";
import ThoughtRecordsList from "@/features/therapy/components/thought/ThoughtRecordsList";
import ThoughtRecordWizard from "@/features/therapy/components/thought/ThoughtRecordWizard";
import { ThoughtRecord as BaseThoughtRecord } from "@shared/schema";
import useActiveUser from "@/hooks/use-active-user";
import { ClientDebug } from "@/features/admin/components/debug/ClientDebug";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/localize.tsx";

type ThoughtRecord = BaseThoughtRecord;

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Brain,
  ClipboardList,
  HelpCircle,
  TrendingUp,
  PenLine,
  History,
  Sparkles,
} from "lucide-react";
import ThoughtInsights from "@/features/therapy/components/thought/ThoughtInsights";

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-purple-950">{icon}</span>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function ThoughtRecords() {
  const { user } = useAuth();
  const { isViewingClientData, activeUserId } = useActiveUser();
  const [, navigate] = useLocation();
  const { t, isRTL, tNum } = useLocalization();
  
  // Check URL parameters for tab
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  
  // Controlled tab state
  const [activeTab, setActiveTab] = useState<string>(
    tabParam === 'insights'
      ? "insights"
      : tabParam === 'history' 
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
  
  // Fetch thought records for the active user
  const { data: thoughtRecords = [] } = useQuery<ThoughtRecord[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/thoughts`] : [],
    enabled: !!activeUserId,
  });
  
  // Calculate progress stats
  const totalThoughts = thoughtRecords.length;
  const challengedThoughts = thoughtRecords.filter((tr: ThoughtRecord) =>
    tr.evidenceFor && tr.evidenceAgainst
  ).length;
  const unchallengedThoughts = totalThoughts - challengedThoughts;
  
  // Handle editing a thought record
  const handleEditThought = (thought: ThoughtRecord) => {
    // Redirect to reflection wizard with the record ID to edit using router
    navigate(`/reflection?edit=${thought.id}`);
  };

  const pageTitle = isViewingClientData ? t("Client Thoughts") : t("Thought Records");
  const pageSubtitle = isViewingClientData
    ? t("Review automatic thoughts, cognitive distortions, and reframing exercises for this client.")
    : t("Record your thoughts and identify cognitive distortions to better understand your thinking patterns.");

  const canRecord = !isViewingClientData && user?.role !== 'therapist';

  const isRecordTab = activeTab === "record";

  return (
    <AppLayout title={pageTitle}>
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50">
        <ClientDebug />

        {/* Premium Hero Banner */}
        <div className="-mx-2 sm:-mx-4 bg-gradient-to-br from-[#090514] via-purple-950 to-indigo-950 px-6 sm:px-10 pt-8 pb-10 relative overflow-hidden transition-all duration-300 border-b border-purple-900/30">
          <div className="absolute -top-10 end-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 start-12 w-52 h-52 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400/80 text-xs font-bold tracking-widest uppercase">
                    {isViewingClientData ? t("Clinical Review") : t("Cognitive Reframing")}
                  </span>
                </div>
                <h1 className="font-bold text-white tracking-tight text-3xl md:text-4xl mb-2">
                  {pageTitle}
                </h1>
                <p className="text-purple-300/70 text-base max-w-md leading-relaxed line-clamp-2">
                  {pageSubtitle}
                </p>
              </div>

              {thoughtRecords.length > 0 && (
                <div className="flex items-center gap-6 shrink-0 flex-wrap">
                  {[
                    { value: tNum(totalThoughts), label: t("Total Logs") },
                    { value: tNum(challengedThoughts), label: t("Challenged") },
                    { value: tNum(unchallengedThoughts), label: t("Unchallenged") },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-white">{s.value}</div>
                      <div className="text-xs text-purple-400/80 font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thought Challenge Rate strip */}
            <div className="mt-6 bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-teal-300" />
                  <span className="text-xs font-bold text-teal-200 uppercase tracking-widest">{t("Thought Challenge Rate")}</span>
                </div>
                <span className="text-xs text-teal-300">{tNum(`${totalThoughts > 0 ? Math.round((challengedThoughts / totalThoughts) * 100) : 0}%`)} {t("challenged")}</span>
              </div>
              {/* Progress bar always grows left-to-right regardless of language */}
              <div dir="ltr" className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-sky-400 rounded-full transition-all duration-700" style={{ width: `${totalThoughts > 0 ? Math.round((challengedThoughts / totalThoughts) * 100) : 0}%` }} />
              </div>
              <p className="text-[11px] text-teal-300/60 mt-1.5">{tNum(challengedThoughts)} {t("of")} {tNum(totalThoughts)} {t("thoughts challenged — reframing builds cognitive flexibility.")}</p>
            </div>
          </div>
        </div>

        {/* Main Body Layout */}
        <div className="max-w-5xl mx-auto pb-10 pt-6 space-y-5">
          <BackToClientsButton />

          {/* Custom Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className={isRecordTab ? "space-y-3" : "space-y-5"}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5">
              <TabsList className="w-full h-auto bg-transparent p-0 gap-1 flex flex-wrap">
                {canRecord && (
                  <TabsTrigger
                    value="record"
                    className={cn(
                      "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                      "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                      "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                    )}
                  >
                    <PenLine className="h-4 w-4 me-1.5 inline" />
                    {t("Record Thought")}
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="history"
                  className={cn(
                    "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <History className="h-4 w-4 me-1.5 inline" />
                  {isViewingClientData ? t("Client History") : t("My History")}
                </TabsTrigger>
                <TabsTrigger
                  value="insights"
                  className={cn(
                    "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <TrendingUp className="h-4 w-4 me-1.5 inline" />
                  {t("Insights")}
                </TabsTrigger>
              </TabsList>
            </div>
            
            {canRecord && (
              <TabsContent value="record" className="mt-0">
                <ThoughtRecordWizard onClose={() => {
                  // Switch to history tab after successful recording
                  setActiveTab('history');
                }} />
              </TabsContent>
            )}
            
            <TabsContent value="history" className="mt-0">
              <div className="space-y-4">
                <SectionLabel
                  icon={<ClipboardList className="h-4 w-4" />}
                  label={isViewingClientData ? t("Client Thought History") : t("Thought History")}
                />
                <ThoughtRecordsList onEditRecord={handleEditThought} />
              </div>
            </TabsContent>
            
            <TabsContent value="insights" className="mt-0">
              <div className="space-y-4">
                <SectionLabel icon={<TrendingUp className="h-4 w-4" />} label={t("Thought Insights")} />
                {activeUserId && <ThoughtInsights userId={activeUserId} />}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
