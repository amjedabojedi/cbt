import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth";
import { useClientContext } from "@/context/ClientContext";
import { useLocalization } from "@/lib/localize";
import { Button } from "@/components/ui/button";
import {
  User, Heart, Brain, BookOpen, Target, BarChart3,
  ArrowLeft, Calendar, Shield, Mail, ChevronRight,
  Sparkles, Activity, TrendingUp, Clock, CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { User as UserType } from "@shared/schema";

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name?: string | null, username?: string | null) {
  const display = name || username || "";
  const parts = display.split(" ").filter(Boolean);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : display.slice(0, 2).toUpperCase() || "?";
}

// ── Tab button (matches Clients/ResourceLibrary style) ────────────────────────
function TabBtn({
  active, onClick, icon, label,
}: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
        active
          ? "bg-[#090514] text-white shadow-sm"
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className={active ? "text-purple-200" : "text-slate-400"}>{icon}</span>
      {label}
    </button>
  );
}

// ── Module quick-launch card ──────────────────────────────────────────────────
function ModuleCard({
  icon, code, title, description, count, unit, onClick,
}: {
  icon: React.ReactNode; code: string; title: string;
  description: string; count: number; unit: string; onClick: () => void;
}) {
  const { tNum } = useLocalization();
  return (
    <button
      onClick={onClick}
      className="group/card w-full bg-white border border-slate-100 hover:border-purple-200 hover:shadow-md p-4 rounded-2xl text-left transition-all duration-300 hover:-translate-y-0.5 focus:outline-none flex items-center justify-between gap-3 shadow-sm"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#090514] group-hover/card:bg-[#090514] group-hover/card:text-white flex items-center justify-center shrink-0 transition-all duration-300 border border-purple-100 group-hover/card:border-[#090514] group-hover/card:shadow-[0_0_12px_rgba(9,5,20,0.2)]">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-mono font-bold tracking-widest text-purple-500 group-hover/card:text-purple-900 uppercase transition-colors">{code}</span>
            <span className="h-1 w-1 rounded-full bg-slate-200" />
            <span className="font-bold text-xs text-slate-700 group-hover/card:text-slate-900 uppercase tracking-wide truncate">{title}</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-1">{description}</p>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <div className="text-right">
          <p className="text-base font-bold text-[#090514]">{tNum(count)}</p>
          <p className="text-[10px] text-slate-400">{unit}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover/card:text-purple-500 transition-colors" />
      </div>
    </button>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatCard({
  icon, value, label, color,
}: {
  icon: React.ReactNode; value: number | string; label: string;
  color: "blue" | "purple" | "amber" | "emerald" | "indigo";
}) {
  const { tNum } = useLocalization();
  const colorMap = {
    blue:    "bg-blue-50   text-blue-600   border-blue-100",
    purple:  "bg-purple-50 text-purple-600 border-purple-100",
    amber:   "bg-amber-50  text-amber-600  border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo:  "bg-indigo-50 text-indigo-600 border-indigo-100",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl border ${colorMap[color]} shrink-0`}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-[#090514] leading-tight">{tNum(value)}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Recent item row ───────────────────────────────────────────────────────────
function RecentRow({ title, date, sub }: { title: string; date: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-700 truncate">{title}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <span className="text-xs text-slate-400 shrink-0 ml-4">{date}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ClientProfile() {
  const { t, tNum } = useLocalization();
  const { clientId } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { setViewingClient } = useClientContext();
  const [activeTab, setActiveTab] = useState<"overview" | "progress" | "activity">("overview");

  const isAllowed = !!user && (user.role === "therapist" || user.role === "admin");

  const { data: client, isLoading: isLoadingClient } = useQuery<UserType>({
    queryKey: [`/api/users/${clientId}`],
    enabled: !!clientId && isAllowed,
  });
  const { data: emotions = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/emotions`],
    enabled: !!clientId && isAllowed,
  });
  const { data: journals = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/journal`],
    enabled: !!clientId && isAllowed,
  });
  const { data: thoughts = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/thoughts`],
    enabled: !!clientId && isAllowed,
  });
  const { data: goals = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/goals`],
    enabled: !!clientId && isAllowed,
  });

  const goToSection = (section: string) => {
    if (!client) return;
    setViewingClient(client.id, client.name || client.username);
    localStorage.setItem("viewingClientId", client.id.toString());
    localStorage.setItem("viewingClientName", client.name || client.username);
    navigate(`/${section === "dashboard" ? "dashboard" : section === "thoughts" ? "thought-records" : section}`);
  };

  const completedGoals = Array.isArray(goals)
    ? goals.filter((g: any) => g.status === "completed").length
    : 0;
  const totalActivities =
    emotions.length + journals.length + thoughts.length + goals.length;

  // ── Loading ──
  if (isLoadingClient) {
    return (
      <AppLayout title="Client Profile">
        <div className="min-h-full bg-slate-50 flex items-center justify-center" style={{ minHeight: "50vh" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#090514]" />
            <p className="text-slate-500 text-sm font-medium">{t("Loading client profile…")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Not found ──
  if (!client) {
    return (
      <AppLayout title="Client Profile">
        <div className="min-h-full bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center max-w-md w-full">
            <div className="p-4 bg-purple-50 rounded-2xl inline-flex mb-5 border border-purple-100">
              <User className="h-8 w-8 text-purple-900" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">{t("Client Not Found")}</h3>
            <p className="text-sm text-slate-400 mb-6">
              {t("This profile doesn't exist or you don't have permission to view it.")}
            </p>
            <Button onClick={() => navigate("/clients")}
              className="bg-[#090514] hover:bg-purple-950 text-white rounded-xl px-6">
              <ArrowLeft className="h-4 w-4 mr-2" /> {t("Back to Clients")}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Full page ──
  return (
    <AppLayout title={`${client.name || client.username} ${t("— Profile")}`}>
      <div className="min-h-full bg-slate-50">

        {/* ── Hero header ── */}
        <div className="bg-white border-b border-slate-100 px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Back */}
            <button
              onClick={() => navigate("/clients")}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              {t("Back to Clients")}
            </button>

            <div className="flex flex-col md:flex-row md:items-end gap-6">

              {/* Profile card */}
              <div className="flex items-end gap-5">
                {/* Avatar with gradient background */}
                <div className="relative shrink-0">
                  {/* Gradient band behind avatar */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#090514] to-purple-900 opacity-90" />
                  <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-lg"
                    style={{ background: "linear-gradient(135deg, #090514 0%, #1e0a36 100%)" }}>
                    {getInitials(client.name, client.username)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">
                      {client.name || client.username}
                    </h1>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ring-1 ${
                      client.status === "active"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-100 text-slate-500 ring-slate-200"
                    }`}>
                      {client.status === "active" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      {client.status || "active"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {client.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("Since ")} {client.createdAt
                        ? new Date(client.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" /> {t("ID #")}{client.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary stats (top-right) */}
              <div className="flex items-center gap-6 md:ml-auto flex-wrap">
                {[
                  { val: emotions.length,  label: t("Emotions")  },
                  { val: thoughts.length,  label: t("Thoughts")  },
                  { val: journals.length,  label: t("Journals")  },
                  { val: goals.length,     label: t("Goals")     },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-bold text-[#090514]">{tNum(s.val)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab nav ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto no-scrollbar">
              <TabBtn active={activeTab === "overview"}  onClick={() => setActiveTab("overview")}  icon={<User className="h-4 w-4" />}       label={t("Overview")} />
              <TabBtn active={activeTab === "progress"}  onClick={() => setActiveTab("progress")}  icon={<TrendingUp className="h-4 w-4" />}  label={t("Progress")} />
              <TabBtn active={activeTab === "activity"}  onClick={() => setActiveTab("activity")}  icon={<Activity className="h-4 w-4" />}    label={t("Recent Activity")} />
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

          {/* ══ OVERVIEW ══ */}
          {activeTab === "overview" && (
            <div className="space-y-6">

              {/* Clinical modules */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-purple-900" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Clinical Modules")}</span>
                  <span className="text-xs text-slate-400 ml-1">{t("— click to open in client context")}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ModuleCard icon={<Heart className="h-5 w-5 stroke-[1.75]" />}    code="M01" title={t("Mood & Triggers")}    description={t("Emotion fluctuations & trigger events")}     count={emotions.length}  unit={t("records")} onClick={() => goToSection("emotions")} />
                  <ModuleCard icon={<Brain className="h-5 w-5 stroke-[1.75]" />}    code="M02" title={t("Thought Records")}    description={t("Cognitive distortions & reframing")}        count={thoughts.length}  unit={t("records")} onClick={() => goToSection("thoughts")} />
                  <ModuleCard icon={<BookOpen className="h-5 w-5 stroke-[1.75]" />} code="M03" title={t("Journal Entries")}   description={t("Self-reflections & session notes")}          count={journals.length}  unit={t("entries")} onClick={() => goToSection("journal")} />
                  <ModuleCard icon={<Target className="h-5 w-5 stroke-[1.75]" />}   code="M04" title={t("Goals & Objectives")} description={t("SMART objectives & milestones")}            count={goals.length}     unit={t("goals")}   onClick={() => goToSection("goals")} />
                </div>
              </div>

              {/* Open Analytics CTA */}
              <div className="flex gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <Button variant="outline" onClick={() => navigate("/clients")}
                  className="flex-1 h-10 rounded-xl border-slate-200 text-slate-600 hover:border-purple-200 hover:bg-purple-50 font-semibold text-sm gap-2 bg-white">
                  <ArrowLeft className="h-4 w-4" /> {t("Back to Directory")}
                </Button>
                <Button onClick={() => goToSection("dashboard")}
                  className="flex-1 h-10 rounded-xl bg-[#090514] hover:bg-purple-950 text-white font-semibold text-sm gap-2 shadow-sm">
                  {t("Open Analytics ")} <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* Recent previews (2-col) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Recent emotions */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-[#090514] to-purple-900" />
                  <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-purple-900" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Recent Emotions")}</span>
                    </div>
                    <button onClick={() => goToSection("emotions")}
                      className="text-xs font-semibold text-purple-900 hover:text-[#090514] transition-colors flex items-center gap-1">
                      {t("View all ")} <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="px-5 pb-4">
                    {emotions.length > 0 ? (
                      emotions.slice(0, 4).map((e: any) => (
                        <RecentRow
                          key={e.id}
                          title={e.coreEmotion || t("Emotion recorded")}
                          sub={e.specificEmotion || undefined}
                          date={e.createdAt ? new Date(e.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 py-4 text-center">{t("No emotion records yet")}</p>
                    )}
                  </div>
                </div>

                {/* Recent journal */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-[#090514] to-purple-900" />
                  <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-900" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Recent Journal")}</span>
                    </div>
                    <button onClick={() => goToSection("journal")}
                      className="text-xs font-semibold text-purple-900 hover:text-[#090514] transition-colors flex items-center gap-1">
                      {t("View all ")} <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="px-5 pb-4">
                    {journals.length > 0 ? (
                      journals.slice(0, 4).map((j: any) => (
                        <RecentRow
                          key={j.id}
                          title={j.title || t("Journal entry")}
                          date={j.createdAt ? new Date(j.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 py-4 text-center">{t("No journal entries yet")}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ PROGRESS ══ */}
          {activeTab === "progress" && (
            <div className="space-y-6">

              {/* Stats grid */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-purple-900" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Activity Summary")}</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<Heart className="h-5 w-5" />}     value={emotions.length}  label={t("Emotion Records")}  color="blue"    />
                  <StatCard icon={<Brain className="h-5 w-5" />}     value={thoughts.length}  label={t("Thought Records")}  color="purple"  />
                  <StatCard icon={<BookOpen className="h-5 w-5" />}  value={journals.length}  label={t("Journal Entries")}  color="amber"   />
                  <StatCard icon={<Target className="h-5 w-5" />}    value={goals.length}     label={t("Goals Set")}        color="indigo"  />
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
                  <p className="text-3xl font-bold text-[#090514]">{tNum(totalActivities)}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">{t("Total Activities")}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t("Across all modules")}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{tNum(completedGoals)}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">{t("Goals Completed")}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {goals.length > 0
                      ? `${tNum(`${Math.round((completedGoals / goals.length) * 100)}%`)} ${t(" success rate")}`
                      : t("No goals yet")}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
                  <p className="text-3xl font-bold text-[#090514]">
                    {client.createdAt
                      ? tNum(Math.floor((Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
                      : "—"}
                  </p>
                  <p className="text-sm text-slate-500 font-medium mt-1">{t("Days as Client")}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t("Since registration")}</p>
                </div>
              </div>

              {/* Goals list */}
              {goals.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-[#090514] to-purple-900" />
                  <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-900" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Goals")}</span>
                    </div>
                    <button onClick={() => goToSection("goals")}
                      className="text-xs font-semibold text-purple-900 hover:text-[#090514] transition-colors flex items-center gap-1">
                      {t("Open module ")} <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="px-5 pb-4 space-y-2">
                    {goals.slice(0, 6).map((g: any) => (
                      <div key={g.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                          g.status === "completed"
                            ? "bg-emerald-100 text-emerald-600"
                            : g.status === "in_progress"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          {g.status === "completed"
                            ? <CheckCircle2 className="h-3.5 w-3.5" />
                            : <Clock className="h-3 w-3" />}
                        </div>
                        <p className="text-sm font-medium text-slate-700 flex-1 truncate">{g.title || g.goal || t("Goal")}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          g.status === "completed"   ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                          g.status === "in_progress" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" :
                                                       "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
                        }`}>{g.status || "active"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ RECENT ACTIVITY ══ */}
          {activeTab === "activity" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-purple-900" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Latest Entries")}</span>
              </div>

              {/* Merged timeline */}
              {(() => {
                const items: { type: string; title: string; sub?: string; date: Date; onClick: () => void }[] = [
                  ...emotions.map((e: any) => ({
                    type: "emotion", title: e.coreEmotion || t("Emotion"),
                    sub: e.specificEmotion || undefined,
                    date: new Date(e.createdAt),
                    onClick: () => goToSection("emotions"),
                  })),
                  ...journals.map((j: any) => ({
                    type: "journal", title: j.title || t("Journal entry"),
                    date: new Date(j.createdAt),
                    onClick: () => goToSection("journal"),
                  })),
                  ...thoughts.map((t: any) => ({
                    type: "thought", title: t.situation || t.automaticThought || t("Thought record"),
                    date: new Date(t.createdAt),
                    onClick: () => goToSection("thoughts"),
                  })),
                  ...goals.map((g: any) => ({
                    type: "goal", title: g.title || g.goal || t("Goal"),
                    sub: g.status,
                    date: new Date(g.createdAt),
                    onClick: () => goToSection("goals"),
                  })),
                ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20);

                const typeMap: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
                  emotion: { icon: <Heart className="h-3.5 w-3.5" />,    label: t("Emotion"),  color: "bg-blue-50   text-blue-600   border-blue-100"    },
                  journal: { icon: <BookOpen className="h-3.5 w-3.5" />, label: t("Journal"),  color: "bg-amber-50  text-amber-600  border-amber-100"   },
                  thought: { icon: <Brain className="h-3.5 w-3.5" />,    label: t("Thought"),  color: "bg-purple-50 text-purple-600 border-purple-100"  },
                  goal:    { icon: <Target className="h-3.5 w-3.5" />,   label: t("Goal"),     color: "bg-indigo-50 text-indigo-600 border-indigo-100"  },
                };

                if (items.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                      <Activity className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-500">{t("No activity recorded yet")}</p>
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-[#090514] to-purple-900" />
                    <div className="divide-y divide-slate-100">
                      {items.map((item, i) => {
                        const t = typeMap[item.type];
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={item.onClick}
                            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group"
                          >
                            <div className={`p-2 rounded-xl border ${t.color} shrink-0`}>{t.icon}</div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900">{item.title}</p>
                              {item.sub && <p className="text-xs text-slate-400 truncate capitalize">{item.sub}</p>}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xs text-slate-400">
                                {item.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </p>
                              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide mt-0.5">{t.label}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-purple-500 shrink-0 transition-colors" />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
