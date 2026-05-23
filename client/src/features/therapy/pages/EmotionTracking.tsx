import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { BackToClientsButton } from "@/features/dashboard/components/navigation/BackToClientsButton";
import EmotionTrackingFormWizard from "@/features/therapy/components/emotion/EmotionTrackingFormWizard";
import EmotionHistory from "@/features/dashboard/components/EmotionHistory";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ClipboardList,
  TrendingUp,
  Sparkles,
  PenLine,
  History,
} from "lucide-react";
import useActiveUser from "@/hooks/use-active-user";
import { ClientDebug } from "@/features/admin/components/debug/ClientDebug";
import EmotionInsights from "@/features/therapy/components/emotion/EmotionInsights";
import { cn } from "@/lib/utils";
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";
import { useEffect } from "react";

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-purple-900">{icon}</span>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function EmotionTracking() {
  const { user } = useAuth();
  const { isViewingClientData, activeUserId } = useActiveUser();
  const { t, isRTL, tNum, currentLanguage, setLanguage: setGlobalLanguage } = useLocalization();
  
  const [language, setLanguage] = useState<"en" | "ar">((currentLanguage === "ar" ? "ar" : "en") as "en" | "ar");
  const [direction, setDirection] = useState<"ltr" | "rtl">(currentLanguage === "ar" ? "rtl" : "ltr");
  const [showLanguageNotice, setShowLanguageNotice] = useState(false);

  // Sync local wizard language with global language context changes (e.g. from Sidebar)
  useEffect(() => {
    setLanguage((currentLanguage === "ar" ? "ar" : "en") as "en" | "ar");
    setDirection(currentLanguage === "ar" ? "rtl" : "ltr");
  }, [currentLanguage]);

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");

  const { data: emotions = [] } = useQuery<any[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/emotions`] : [],
    enabled: !!activeUserId,
  });

  const totalEmotions = emotions.length;
  const avgIntensity =
    emotions.length > 0
      ? (
          emotions.reduce((sum: number, e: any) => sum + (e.intensity || 0), 0) /
          emotions.length
        ).toFixed(1)
      : "0";

  const emotionCounts = emotions.reduce((acc: Record<string, number>, e: any) => {
    acc[e.coreEmotion] = (acc[e.coreEmotion] || 0) + 1;
    return acc;
  }, {});

  const mostCommonEmotion =
    Object.entries(emotionCounts).length > 0
      ? Object.entries(emotionCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]
      : "None";

  const canRecord = !isViewingClientData && user?.role !== "therapist";
  const defaultTab =
    tabParam === "insights"
      ? "insights"
      : tabParam === "history"
        ? "history"
        : isViewingClientData || user?.role === "therapist"
          ? "history"
          : "record";

  const handleLanguageToggle = () => {
    const newLanguage = language === "en" ? "ar" : "en";
    const newDirection = newLanguage === "ar" ? "rtl" : "ltr";
    setLanguage(newLanguage);
    setDirection(newDirection);
    setGlobalLanguage(newLanguage); // synchronize globally
    setShowLanguageNotice(true);
    setTimeout(() => setShowLanguageNotice(false), 3000);
  };

  const pageTitle = isViewingClientData ? t("Client Emotions") : t("Emotion Tracking");
  const pageSubtitle = isViewingClientData
    ? t("Review mood logs, patterns, and emotional history for this client.")
    : t("Identify, track, and understand your emotional patterns using the interactive emotion wheel.");

  return (
    <AppLayout title={pageTitle}>
      <div className="min-h-screen bg-slate-50">
        <ClientDebug />

        {/* Hero banner */}
        <div className="-mx-2 sm:-mx-4 bg-gradient-to-br from-[#090514] via-purple-950 to-indigo-950 px-6 sm:px-10 pt-8 pb-10 relative overflow-hidden">
          <div className="absolute -top-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-12 w-52 h-52 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400/80 text-xs font-bold tracking-widest uppercase">
                    {isViewingClientData ? t("Clinical Review") : t("Mood & Triggers")}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                  {pageTitle}
                </h1>
                <p className="text-purple-300/70 text-base max-w-md leading-relaxed line-clamp-2">
                  {pageSubtitle}
                </p>
              </div>

              {emotions.length > 0 && (
                <div className="flex items-center gap-6 shrink-0 flex-wrap">
                  {[
                    { value: tNum(totalEmotions), label: t("Total Logs") },
                    { value: tNum(`${avgIntensity}/10`), label: t("Avg Intensity") },
                    { value: <DynamicTranslator text={mostCommonEmotion} />, label: t("Most Common") },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-white">{s.value}</div>
                      <div className="text-xs text-purple-400/80 font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emotional Intelligence strip */}
            <div className="mt-6 bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
                  <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">{t("Emotional Intelligence")}</span>
                </div>
                <span className="text-xs text-purple-400">{tNum(totalEmotions)} {t("of")} {tNum(50)} {t("tracked")}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 to-purple-400 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.round((totalEmotions / 50) * 100))}%` }} />
              </div>
              <p className="text-[11px] text-purple-400/60 mt-1.5">{t("Tracking your emotions regularly builds self-awareness and emotional regulation skills.")}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-5xl mx-auto pt-6 pb-10 space-y-5">
          <BackToClientsButton />

          {/* Tabs */}
          <Tabs defaultValue={defaultTab} className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5">
              <TabsList className="w-full h-auto bg-transparent p-0 gap-1 flex flex-wrap">
                {canRecord && (
                  <TabsTrigger
                    value="record"
                    className={cn(
                      "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                      "data-[state=active]:bg-[#090514] data-[state=active]:text-white data-[state=active]:shadow-sm",
                      "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                    )}
                  >
                    <PenLine className="h-4 w-4 mr-1.5 inline animate-none" />
                    {t("Record Emotion")}
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="history"
                  className={cn(
                    "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "data-[state=active]:bg-[#090514] data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <History className="h-4 w-4 mr-1.5 inline" />
                  {isViewingClientData ? t("Client History") : t("My History")}
                </TabsTrigger>
                <TabsTrigger
                  value="insights"
                  className={cn(
                    "flex-1 min-w-[120px] rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "data-[state=active]:bg-[#090514] data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <TrendingUp className="h-4 w-4 mr-1.5 inline" />
                  {t("Insights")}
                </TabsTrigger>
              </TabsList>
            </div>

            {canRecord && (
              <TabsContent value="record" className="mt-0 space-y-3">
                {showLanguageNotice && (
                  <div className="p-2.5 bg-purple-50 text-purple-900 rounded-xl border border-purple-100 text-xs">
                    {language === "ar"
                      ? "تم التبديل إلى العربية. ستتم معالجة كل تفاعلات العجلة بالاتجاه من اليمين إلى اليسار."
                      : "Switched to English. All wheel interactions will now use LTR direction."}
                  </div>
                )}

                <EmotionTrackingFormWizard
                  language={language}
                  direction={direction}
                  onLanguageToggle={handleLanguageToggle}
                  languageLabel={language === "en" ? "English" : "العربية"}
                />
              </TabsContent>
            )}

            <TabsContent value="history" className="mt-0">
              {isViewingClientData ? (
                <div className="space-y-4">
                  <SectionLabel
                    icon={<ClipboardList className="h-4 w-4" />}
                    label={t("Client Emotion History")}
                  />
                  <EmotionHistory />
                </div>
              ) : (
                <div className="space-y-4">
                  <SectionLabel icon={<History className="h-4 w-4" />} label={t("Emotion History")} />
                  <EmotionHistory />
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="mt-0">
              <div className="space-y-4">
                <SectionLabel icon={<TrendingUp className="h-4 w-4" />} label={t("Emotion Insights")} />
                {activeUserId && <EmotionInsights userId={activeUserId} />}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
