import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import ThoughtRecordsList from "@/features/therapy/components/thought/ThoughtRecordsList";
import ReframePracticeHistory from "@/features/reframe/components/ReframePracticeHistory";
import ReframeInsights from "@/features/reframe/components/ReframeInsights";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ThoughtRecord } from "@shared/schema";
import {
  Loader2,
  Zap,
  ShieldAlert,
  TrendingUp,
  History,
  Sparkles,
} from "lucide-react";
import useActiveUser from "@/hooks/use-active-user";
import { useLocalization } from "@/lib/localize.tsx";

export default function ReframeCoachPage() {
  const { user } = useAuth();
  const { isViewingClientData, activeUserId } = useActiveUser();
  const { t, tNum, isRTL } = useLocalization();
  const userId = activeUserId || user?.id;
  const [, navigate] = useLocation();

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");

  const defaultTab =
    tabParam === "insights" ? "insights" : tabParam === "history" ? "history" : "practice";

  const [activeTab, setActiveTab] = useState(defaultTab);

  const { data: thoughtRecords, isLoading: thoughtsLoading } = useQuery<ThoughtRecord[]>({
    queryKey: [`/api/users/${userId}/thoughts`],
    enabled: !!userId,
  });

  const { data: profileData } = useQuery<any>({
    queryKey: [`/api/users/${userId}/reframe-coach/profile`],
    enabled: !!userId,
  });

  const { data: results = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/reframe-coach/results`],
    enabled: !!userId,
  });

  const totalSessions = profileData?.stats?.totalPractices || 0;
  const avgScore =
    profileData?.stats?.avgScore && typeof profileData.stats.avgScore === "number"
      ? profileData.stats.avgScore.toFixed(1)
      : "0";
  const currentStreak = profileData?.profile?.practiceStreak || 0;

  const showStats = totalSessions > 0;

  const masteryFooter =
    avgScore !== "0" && Number(avgScore) > 0
      ? `${t("Each reframing session builds cognitive flexibility")} — ${t("avg score")} ${tNum(avgScore)}.`
      : `${t("Each reframing session builds cognitive flexibility")}.`;

  return (
    <AppLayout title={t("Reframe Coach")}>
      <div className="min-h-screen bg-slate-50" dir={isRTL ? "rtl" : "ltr"}>
        <div className="-mx-2 sm:-mx-4 bg-gradient-to-br from-[#090514] via-purple-950 to-indigo-950 px-6 sm:px-10 pt-8 pb-10 relative overflow-hidden transition-all duration-300">
          <div className="absolute -top-10 end-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 start-12 w-52 h-52 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400/80 text-xs font-bold tracking-widest uppercase">
                    {t("Cognitive Reframing")}
                  </span>
                </div>
                <h1 className="font-bold text-white tracking-tight text-3xl md:text-4xl mb-2">
                  {t("Reframe Coach")}
                </h1>
                <p className="text-purple-300/70 text-base max-w-md leading-relaxed">
                  {t(
                    "Practice balanced thinking with interactive exercises based on the thoughts and distortions you've already recorded"
                  )}
                </p>
              </div>

              {showStats && (
                <div className="flex items-center gap-6 shrink-0 flex-wrap">
                  {[
                    { value: tNum(totalSessions), label: t("Sessions Completed") },
                    { value: tNum(avgScore), label: t("Avg Score"), color: "text-purple-400" },
                    { value: tNum(currentStreak), label: t("Day Streak"), color: "text-emerald-400" },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className={cn("text-2xl font-bold", s.color || "text-white")}>
                        {s.value}
                      </div>
                      <div className="text-xs text-purple-400/80 font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">
                    {t("Reframe Mastery")}
                  </span>
                </div>
                <span className="text-xs text-purple-400">
                  {tNum(totalSessions)} {t("of")} {tNum(20)} {t("sessions")}
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-purple-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.round((totalSessions / 20) * 100))}%` }}
                />
              </div>
              <p className="text-[11px] text-purple-400/60 mt-1.5">{masteryFooter}</p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto pb-10 pt-6 space-y-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5">
              <TabsList className="w-full h-auto bg-transparent p-0 gap-1 flex flex-wrap">
                <TabsTrigger
                  value="practice"
                  data-testid="tab-practice"
                  className={cn(
                    "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "data-[state=active]:bg-[#090514] data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <Zap className="h-4 w-4 me-1.5 inline" />
                  {t("Practice")}
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  data-testid="tab-history"
                  className={cn(
                    "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "data-[state=active]:bg-[#090514] data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <History className="h-4 w-4 me-1.5 inline" />
                  {t("History")}
                </TabsTrigger>
                <TabsTrigger
                  value="insights"
                  data-testid="tab-insights"
                  className={cn(
                    "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "data-[state=active]:bg-[#090514] data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <TrendingUp className="h-4 w-4 me-1.5 inline" />
                  {t("Insights")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="practice" className="mt-0">
              <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 pt-5 px-6">
                  <CardTitle className="text-lg font-bold text-[#090514]">
                    {t("Your Thought Records")}
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-sm">
                    {isViewingClientData
                      ? t("View client's thought records and practice history")
                      : t("Select a thought record to practice cognitive reframing")}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  {thoughtsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  ) : thoughtRecords && thoughtRecords.length > 0 ? (
                    <ThoughtRecordsList
                      thoughtRecords={thoughtRecords}
                      userId={userId}
                      showPracticeButton={true}
                      practiceResults={results}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-purple-50 text-purple-600 rounded-full">
                        <ShieldAlert className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-bold text-[#090514] mb-2">
                        {t("No Thought Records Yet")}
                      </h3>
                      <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                        {isViewingClientData
                          ? t("This client has not created any thought records.")
                          : t("Create a thought record first to begin practicing cognitive reframing.")}
                      </p>
                      {!isViewingClientData && (
                        <Button
                          onClick={() => navigate(`/thoughts`)}
                          data-testid="button-go-to-thoughts"
                          className="bg-[#090514] hover:bg-purple-950 text-white rounded-xl px-6 py-2.5 font-semibold transition-all duration-200"
                        >
                          {t("Create Your First Thought Record")}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <ReframePracticeHistory userId={userId!} limit={999} />
            </TabsContent>

            <TabsContent value="insights" className="mt-0">
              <ReframeInsights userId={userId!} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
