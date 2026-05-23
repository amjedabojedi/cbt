import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { useModuleStats } from "@/hooks/use-module-stats";
import useActiveUser from "@/hooks/use-active-user";
import { useClientContext } from "@/context/ClientContext";
import { ClientDebug } from "@/features/admin/components/debug/ClientDebug";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import {
  Heart, Brain, Lightbulb, BookOpen, Target,
  Users, UserCheck, UserPlus, BookText, Goal,
  LayoutDashboard, Activity, TrendingUp, ChevronRight,
  Settings, Library, Sparkles, Shield, BarChart3,
  Clock, Calendar, Bell, FileText, Zap, ArrowUpRight,
  ArrowLeft, ArrowRight, User, CheckCircle2, Star, Flame,
  ChevronLeft,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/localize.tsx";

// ── Quick-action card used in both Admin and Therapist views ──
function QuickActionCard({
  icon, label, description, onClick, accent = "purple",
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  accent?: "purple" | "indigo" | "violet" | "slate";
}) {
  const { isRTL } = useLocalization();
  const accentMap = {
    purple: "group-hover:bg-[#090514] group-hover:text-white bg-purple-50 text-[#090514] border-purple-100 group-hover:border-[#090514] group-hover:shadow-[0_0_12px_rgba(9,5,20,0.2)]",
    indigo: "group-hover:bg-indigo-900 group-hover:text-white bg-indigo-50 text-indigo-900 border-indigo-100 group-hover:border-indigo-900",
    violet: "group-hover:bg-violet-900 group-hover:text-white bg-violet-50 text-violet-900 border-violet-100 group-hover:border-violet-900",
    slate: "group-hover:bg-slate-800 group-hover:text-white bg-slate-100 text-slate-700 border-slate-200 group-hover:border-slate-800",
  };
  return (
    <button
      onClick={onClick}
      className="group w-full bg-white border border-slate-100 hover:border-purple-200 hover:shadow-md p-4 rounded-2xl text-start transition-all duration-300 hover:-translate-y-0.5 focus:outline-none flex items-center justify-between gap-3 h-[82px] shadow-sm"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 border ${accentMap[accent]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-slate-700 group-hover:text-slate-900 transition-colors truncate">{label}</h4>
          <p className="text-[11px] text-slate-400 group-hover:text-slate-500 transition-colors leading-relaxed line-clamp-1">{description}</p>
        </div>
      </div>
      {isRTL ? (
        <ChevronLeft className="h-4 w-4 text-slate-300 group-hover:text-purple-500 group-hover:-translate-x-0.5 transition-all shrink-0" />
      ) : (
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all shrink-0" />
      )}
    </button>
  );
}

// ── Stat card ──
function StatCard({
  value, label, sub, icon, loading = false,
}: {
  value: string | number;
  label: string;
  sub?: string;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  const { tNum } = useLocalization();
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
      <div className="p-2.5 rounded-xl bg-purple-50 text-[#090514] border border-purple-100 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        {loading ? (
          <div className="h-7 w-14 bg-slate-100 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold text-[#090514] leading-tight">{tNum(value)}</p>
        )}
        <p className="text-sm font-medium text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{tNum(sub)}</p>}
      </div>
    </div>
  );
}

// ── Section heading ──
function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-purple-900">{icon}</span>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { activeUserId, isViewingClientData } = useActiveUser();
  const { viewingClientName } = useClientContext();
  const moduleStats = useModuleStats();
  const [, navigate] = useLocation();
  const { t, isRTL, tNum } = useLocalization();

  const isTherapist = user?.role === "therapist";
  const isClient    = user?.role === "client";
  const isAdmin     = user?.role === "admin";

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
  const BackArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  // ── Therapist data ──
  const { data: clients, isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ["/api/users/clients"],
    enabled: !!user && (isTherapist || isAdmin),
  });
  const { data: journalStats } = useQuery<{ totalCount: number }>({
    queryKey: ["/api/therapist/stats/journal"],
    enabled: !!user && isTherapist,
    placeholderData: { totalCount: 0 },
  });
  const { data: thoughtStats } = useQuery<{ totalCount: number }>({
    queryKey: ["/api/therapist/stats/thoughts"],
    enabled: !!user && isTherapist,
    placeholderData: { totalCount: 0 },
  });
  const { data: goalStats } = useQuery<{ totalCount: number }>({
    queryKey: ["/api/therapist/stats/goals"],
    enabled: !!user && isTherapist,
    placeholderData: { totalCount: 0 },
  });

  // ── Admin data ──
  const { data: adminStats, isLoading: adminLoading } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && isAdmin,
  });

  // ── Derived values ──
  const totalClients   = clients?.length || 0;
  const activeClients  = clients?.filter((c: any) => c.status === "active").length || 0;
  const newClients     = clients?.filter((c: any) => {
    if (!c.createdAt) return false;
    const d = new Date(c.createdAt);
    const ago = new Date(); ago.setDate(ago.getDate() - 14);
    return d > ago;
  }).length || 0;
  const activeRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;

  const displayName = isViewingClientData
    ? t(viewingClientName || "")
    : t(user?.name?.split(" ")[0] || "there");

  // ── Client progress vars ──
  const totalActivities =
    moduleStats.emotions.total +
    moduleStats.thoughts.total +
    moduleStats.journal.total +
    moduleStats.goals.total +
    moduleStats.reframe.totalPractices;
  const engagementScore = Math.min(100, Math.round((totalActivities / 50) * 100));

  // ═══════════════════════════════════════
  //  ADMIN DASHBOARD
  // ═══════════════════════════════════════
  if (isAdmin && !isViewingClientData) {
    return (
      <AppLayout title={t("Admin Dashboard")}>
        <div className="min-h-full bg-slate-50">
          <ClientDebug />

          {/* Hero header */}
          <div className="bg-white border-b border-slate-100 px-6 py-10">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-[#090514] rounded-xl shadow-lg shadow-purple-950/20">
                      <LayoutDashboard className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-purple-900 text-sm font-bold tracking-widest uppercase">{t("System Control")}</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-slate-800 font-sans">
                    {t("Admin Dashboard")}
                  </h1>
                  <p className="text-slate-500 text-base max-w-xl leading-relaxed">
                    {t("Monitor platform activity, manage users, and configure system settings.")}
                  </p>
                </div>

                {/* Top stats */}
                <div className="flex items-center gap-6 shrink-0 flex-wrap">
                  {[
                    { value: adminStats?.totalUsers ?? "—", label: t("Total Users") },
                    { value: adminStats?.totalClients ?? "—", label: t("Clients") },
                    { value: adminStats?.totalTherapists ?? "—", label: t("Therapists") },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-[#090514]">{adminLoading ? "…" : tNum(s.value)}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

            {/* Stats grid */}
            <div>
              <SectionHeading icon={<BarChart3 className="h-4 w-4" />} label={t("Platform Overview")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Users className="h-5 w-5" />}      value={adminLoading ? "…" : adminStats?.totalClients ?? 0}    label={t("Total Clients")}     loading={adminLoading} />
                <StatCard icon={<UserCheck className="h-5 w-5" />}  value={adminLoading ? "…" : adminStats?.activeClients ?? 0}   label={t("Active Clients")}    loading={adminLoading} />
                <StatCard icon={<Shield className="h-5 w-5" />}     value={adminLoading ? "…" : adminStats?.totalTherapists ?? 0} label={t("Therapists")}        loading={adminLoading} />
                <StatCard icon={<Activity className="h-5 w-5" />}   value={adminLoading ? "…" : adminStats?.totalEmotions ?? 0}   label={t("Emotion Records")}   loading={adminLoading} />
              </div>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard icon={<Brain className="h-5 w-5" />}    value={adminLoading ? "…" : adminStats?.totalThoughtRecords ?? 0} label={t("Thought Records")} loading={adminLoading} />
              <StatCard icon={<Goal className="h-5 w-5" />}     value={adminLoading ? "…" : adminStats?.totalGoals ?? 0}          label={t("Total Goals")}     loading={adminLoading} />
              <StatCard icon={<BookText className="h-5 w-5" />} value={adminLoading ? "…" : adminStats?.totalJournalEntries ?? 0} label={t("Journal Entries")} loading={adminLoading} />
            </div>

            {/* Quick navigation */}
            <div>
              <SectionHeading icon={<Zap className="h-4 w-4" />} label={t("Admin Functions")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <QuickActionCard icon={<Users className="h-5 w-5" />}     label={t("User Management")}      description={t("View and manage all platform users")}          onClick={() => navigate("/admin/users")} />
                <QuickActionCard icon={<BarChart3 className="h-5 w-5" />} label={t("System Statistics")}    description={t("Monitor application usage and metrics")}        onClick={() => navigate("/admin/stats")} />
                <QuickActionCard icon={<Settings className="h-5 w-5" />}  label={t("Platform Settings")}    description={t("Configure system-wide settings")}               onClick={() => navigate("/settings")} />
                <QuickActionCard icon={<Bell className="h-5 w-5" />}      label={t("Notifications")}        description={t("Manage and review system notifications")}       onClick={() => navigate("/admin/notifications")} accent="indigo" />
                <QuickActionCard icon={<Library className="h-5 w-5" />}   label={t("Resource Library")}     description={t("Manage clinical resources and materials")}      onClick={() => navigate("/resources")} accent="violet" />
                <QuickActionCard icon={<FileText className="h-5 w-5" />}  label={t("Activity Logs")}        description={t("Review platform activity and audit trails")}    onClick={() => navigate("/admin/logs")} accent="slate" />
              </div>
            </div>

          </div>
        </div>
      </AppLayout>
    );
  }

  // ═══════════════════════════════════════
  //  THERAPIST DASHBOARD (not viewing client)
  // ═══════════════════════════════════════
  if (isTherapist && !isViewingClientData) {
    return (
      <AppLayout title={t("Dashboard")}>
        <div className="min-h-full bg-slate-50">
          <ClientDebug />

          {/* Hero header */}
          <div className="bg-white border-b border-slate-100 px-6 py-10">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-[#090514] rounded-xl shadow-lg shadow-purple-950/20">
                      <LayoutDashboard className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-purple-900 text-sm font-bold tracking-widest uppercase">{t("Clinical Workspace")}</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-slate-800">
                    {t("Good morning") === "Good morning" ? `Welcome back, ${displayName}` : `مرحباً بعودتك، ${displayName}`}
                  </h1>
                  <p className="text-slate-500 text-base max-w-xl leading-relaxed">
                    {t("Manage your practice and view insights about your clients.")}
                  </p>
                </div>

                {/* Top stats */}
                <div className="flex items-center gap-6 shrink-0 flex-wrap">
                  {[
                    { value: totalClients,  label: t("Clients")  },
                    { value: `${activeRate}%`, label: t("Engagement")   },
                    { value: newClients,    label: t("New Clients") },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-[#090514]">{clientsLoading ? "…" : tNum(s.value)}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

            {/* Practice stats grid */}
            <div>
              <SectionHeading icon={<BarChart3 className="h-4 w-4" />} label={t("Practice Overview")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={<Users className="h-5 w-5" />}     value={totalClients}                       label={t("Total Clients")}    sub={`${newClients} ${t("new in last 14 days")}`}  loading={clientsLoading} />
                <StatCard icon={<UserCheck className="h-5 w-5" />} value={activeClients}                      label={t("Active Clients")}   sub={`${activeRate}% ${t("engagement rate")}`}      loading={clientsLoading} />
                <StatCard icon={<UserPlus className="h-5 w-5" />}  value={newClients}                         label={t("New Clients")}      sub={t("Registered in the last 14 days")}        loading={clientsLoading} />
                <StatCard icon={<BookText className="h-5 w-5" />}  value={journalStats?.totalCount ?? 0}      label={t("Journal Entries")}  sub={t("Across all clients")}                    />
                <StatCard icon={<Brain className="h-5 w-5" />}     value={thoughtStats?.totalCount ?? 0}      label={t("Thought Records")}  sub={t("Across all clients")}                    />
                <StatCard icon={<Target className="h-5 w-5" />}    value={goalStats?.totalCount ?? 0}         label={t("Active Goals")}     sub={t("Across all clients")}                    />
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <SectionHeading icon={<Zap className="h-4 w-4" />} label={t("Quick Access")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <QuickActionCard
                  icon={<Users className="h-5 w-5" />}
                  label={t("Client Directory")}
                  description={t("View and manage your clients")}
                  onClick={() => navigate("/clients")}
                />
                <QuickActionCard
                  icon={<Library className="h-5 w-5" />}
                  label={t("Resource Library")}
                  description={t("Browse and assign clinical resources")}
                  onClick={() => navigate("/resources")}
                  accent="indigo"
                />
                <QuickActionCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label={t("Reports")}
                  description={t("View clinical reports and summaries")}
                  onClick={() => navigate("/reports")}
                  accent="violet"
                />
                <QuickActionCard
                  icon={<Settings className="h-5 w-5" />}
                  label={t("Settings")}
                  description={t("Configure your practice preferences")}
                  onClick={() => navigate("/settings")}
                  accent="slate"
                />
              </div>
            </div>

            {/* Client list preview */}
            {clients && clients.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-900" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Recent Clients")}</span>
                  </div>
                  <button
                    onClick={() => navigate("/clients")}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-900 hover:text-[#090514] transition-colors"
                  >
                    {t("View all")} <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {clients.slice(0, 5).map((client: any, i: number) => {
                    const initials = (() => {
                      const parts = (client.name || client.username || "").split(" ").filter(Boolean);
                      return parts.length >= 2
                        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                        : (client.name || client.username || "?").slice(0, 2).toUpperCase();
                    })();
                    return (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => navigate("/clients")}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#090514] border border-purple-100 flex items-center justify-center text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-700 truncate">{client.name || client.username}</p>
                            <p className="text-xs text-slate-400 truncate">{client.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {client.status === "active" && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          )}
                          <span className="text-xs text-slate-400 font-medium capitalize">{t(client.status)}</span>
                          <ChevronIcon className="h-4 w-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty clients state */}
            {!clientsLoading && (!clients || clients.length === 0) && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 flex flex-col items-center text-center">
                <div className="p-4 bg-purple-50 rounded-2xl mb-4 border border-purple-100">
                  <Sparkles className="h-8 w-8 text-purple-900" />
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-1">{t("No clients yet")}</h3>
                <p className="text-sm text-slate-400 mb-5 max-w-xs">
                  {t("Invite clients to start building your practice and tracking progress.")}
                </p>
                <button
                  onClick={() => navigate("/clients")}
                  className="h-10 px-5 bg-[#090514] hover:bg-purple-950 text-white font-semibold rounded-xl shadow-sm text-sm flex items-center gap-2 transition-all"
                >
                  <UserPlus className="h-4 w-4" /> {t("Invite Your First Client")}
                </button>
              </div>
            )}

          </div>
        </div>
      </AppLayout>
    );
  }

  // ═══════════════════════════════════════
  //  THERAPIST / ADMIN → VIEWING CLIENT ANALYTICS
  // ═══════════════════════════════════════
  if ((isTherapist || isAdmin) && isViewingClientData) {
    const moduleRows = [
      { icon: <Heart className="h-5 w-5" />,     value: moduleStats.emotions.total,          label: t("Emotion Logs"),      sub: t("mood & trigger entries")           },
      { icon: <Brain className="h-5 w-5" />,     value: moduleStats.thoughts.total,          label: t("Thought Records"),   sub: `${t("Top pattern: ")} ${t(moduleStats.thoughts.topANT || "—")}` },
      { icon: <Lightbulb className="h-5 w-5" />, value: moduleStats.reframe.totalPractices,  label: t("Reframe Sessions"),  sub: `${t("Avg. score: ")} ${moduleStats.reframe.averageScore}`     },
      { icon: <BookOpen className="h-5 w-5" />,  value: moduleStats.journal.total,           label: t("Journal Entries"),   sub: `${moduleStats.journal.emotionsDetected} ${t("emotions detected")}` },
      { icon: <Target className="h-5 w-5" />,    value: moduleStats.goals.total,             label: t("Smart Goals"),       sub: `${moduleStats.goals.completedPercentage}% ${t("success rate")}` },
    ];

    return (
      <AppLayout title={`${t("Client Analytics")} - ${displayName}`}>
        <div className="min-h-full bg-slate-50">
          <ClientDebug />

          {/* ── Hero header ── */}
          <div className="bg-white border-b border-slate-100 px-6 pt-8 pb-10">
            <div className="max-w-6xl mx-auto">

              {/* Back button */}
              <button
                onClick={() => navigate("/clients")}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-700 transition-colors mb-7 group"
              >
                <BackArrowIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                {t("Back to Clients")}
              </button>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-[#090514] rounded-xl shadow-lg shadow-purple-950/20">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-purple-900 text-sm font-bold tracking-widest uppercase">{t("Client Analytics")}</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-slate-800">
                    {isRTL ? `${t("Dashboard")} - ${displayName}` : `${displayName} - ${t("Dashboard")}`}
                  </h1>
                  <p className="text-slate-500 text-base max-w-xl leading-relaxed">
                    {t("Engagement metrics, module activity, and progress data for this client.")}
                  </p>
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-6 shrink-0 flex-wrap">
                  {[
                    { value: totalActivities,          label: t("Activities")  },
                    { value: `${engagementScore}%`,    label: t("Engagement")  },
                    { value: moduleStats.goals.total,  label: t("Goals")       },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-[#090514]">{tNum(s.value)}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

            {/* Module stat cards */}
            <div>
              <SectionHeading icon={<Activity className="h-4 w-4" />} label={t("Module Activity")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {moduleRows.map((m, i) => (
                  <StatCard key={i} icon={m.icon} value={m.value} label={m.label} sub={m.sub} />
                ))}
              </div>
            </div>

            {/* Engagement score card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-900" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Engagement Score")}</span>
                </div>
                <span className="text-2xl font-bold text-[#090514]">{tNum(`${engagementScore}%`)}</span>
              </div>
              <Progress value={engagementScore} className="h-2.5 mb-3" />
              <p className="text-xs text-slate-400">{t("total activities logged across all clinical modules")}</p>

              {/* Per-module breakdown row */}
              <div className="grid grid-cols-5 gap-2 mt-5 pt-4 border-t border-slate-100">
                {[
                  { val: moduleStats.emotions.total,         label: t("Emotions"),  color: "text-rose-500"   },
                  { val: moduleStats.thoughts.total,         label: t("Thoughts"),  color: "text-purple-600" },
                  { val: moduleStats.reframe.totalPractices, label: t("Reframes"),  color: "text-emerald-600"},
                  { val: moduleStats.journal.total,          label: t("Journal"),   color: "text-amber-600"  },
                  { val: moduleStats.goals.total,            label: t("Goals"),     color: "text-indigo-600" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className={`text-xl font-bold ${s.color}`}>{tNum(s.val)}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Module quick access */}
            <div>
              <SectionHeading icon={<Zap className="h-4 w-4" />} label={t("Open Module")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <QuickActionCard
                  icon={<Brain className="h-5 w-5" />}
                  label={t("Thought Records")}
                  description={`${moduleStats.thoughts.total} ${t("records logged")}`}
                  onClick={() => navigate("/thought-records")}
                />
                <QuickActionCard
                  icon={<BookOpen className="h-5 w-5" />}
                  label={t("Journal")}
                  description={`${moduleStats.journal.total} ${t("entries written")}`}
                  onClick={() => navigate("/journal")}
                  accent="indigo"
                />
                <QuickActionCard
                  icon={<Heart className="h-5 w-5" />}
                  label={t("Emotion Tracking")}
                  description={`${moduleStats.emotions.total} ${t("logs recorded")}`}
                  onClick={() => navigate("/emotions")}
                  accent="violet"
                />
                <QuickActionCard
                  icon={<Target className="h-5 w-5" />}
                  label={t("Smart Goals")}
                  description={`${moduleStats.goals.completedPercentage}% ${t("success rate")}`}
                  onClick={() => navigate("/goals")}
                  accent="slate"
                />
              </div>
            </div>

            {/* View profile link */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => navigate(`/client/${activeUserId}`)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#090514] transition-colors group"
              >
                <User className="h-4 w-4" />
                {t("View Full Client Profile")}
                <ChevronIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </AppLayout>
    );
  }

  // ═══════════════════════════════════════
  //  CLIENT DASHBOARD
  // ═══════════════════════════════════════
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? t("Good morning") : hour < 17 ? t("Good afternoon") : t("Good evening");
  const motivationalLines = [
    "Every small step forward is progress worth celebrating.",
    "Your mental wellness journey is uniquely yours.",
    "Today is a new opportunity to understand yourself better.",
    "You're making time for what matters — that's powerful.",
    "Consistency is the foundation of lasting change.",
    "Awareness is the first step to transformation.",
    "You have the strength to face what comes.",
  ];
  const motivationalLine = t(motivationalLines[new Date().getDay() % motivationalLines.length]);

  const todayFocus = [
    { Icon: Heart,     label: t("Track Emotion"),  href: "/emotions",      done: moduleStats.emotions.total > 0,         color: "text-rose-500",    bg: "bg-rose-50",    border: "border-rose-200"   },
    { Icon: Brain,     label: t("Record Thought"), href: "/thoughts",      done: moduleStats.thoughts.total > 0,         color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200" },
    { Icon: Lightbulb, label: t("Reframe Coach"),  href: "/reframe-coach", done: moduleStats.reframe.totalPractices > 0, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200"},
    { Icon: BookOpen,  label: t("Write Journal"),  href: "/journal",       done: moduleStats.journal.total > 0,          color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"  },
    { Icon: Target,    label: t("Set a Goal"),     href: "/goals",         done: moduleStats.goals.total > 0,            color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200" },
  ];
  const completedSteps = todayFocus.filter((f) => f.done).length;

  const clientModules = [
    {
      Icon: Heart,
      label: t("Emotion Tracking"),
      description: t("Track your moods, triggers, and emotional patterns over time."),
      href: "/emotions",
      stat: moduleStats.emotions.total,
      statLabel: t("logs recorded"),
      insight: moduleStats.emotions.mostCommon !== "None" ? `${t("Most common: ")}${t(moduleStats.emotions.mostCommon)}` : t("Start logging to see patterns"),
      iconColor: "text-rose-500",
      bg: "bg-rose-50",
      border: "border-rose-100",
      barColor: "bg-rose-400",
    },
    {
      Icon: Brain,
      label: t("Thought Records"),
      description: t("Identify and challenge unhelpful thinking patterns."),
      href: "/thoughts",
      stat: moduleStats.thoughts.total,
      statLabel: t("records logged"),
      insight: moduleStats.thoughts.topANT !== "None" ? `${t("Top pattern: ")}${t(moduleStats.thoughts.topANT)}` : t("Log thoughts to find patterns"),
      iconColor: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      barColor: "bg-purple-500",
    },
    {
      Icon: Lightbulb,
      label: t("Reframe Coach"),
      description: t("Practice cognitive restructuring with guided exercises."),
      href: "/reframe-coach",
      stat: moduleStats.reframe.totalPractices,
      statLabel: t("sessions done"),
      insight: moduleStats.reframe.averageScore > 0 ? `${t("Avg. score: ")}${moduleStats.reframe.averageScore}` : t("Start your first session"),
      iconColor: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      barColor: "bg-emerald-500",
    },
    {
      Icon: BookOpen,
      label: t("Journal"),
      description: t("Reflect daily and process your thoughts through writing."),
      href: "/journal",
      stat: moduleStats.journal.total,
      statLabel: t("entries written"),
      insight: moduleStats.journal.emotionsDetected > 0 ? `${moduleStats.journal.emotionsDetected} ${t("emotions detected")}` : t("Start writing today"),
      iconColor: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      barColor: "bg-amber-400",
    },
    {
      Icon: Target,
      label: t("SMART Goals"),
      description: t("Set meaningful goals and track your milestones."),
      href: "/goals",
      stat: moduleStats.goals.total,
      statLabel: t("goals created"),
      insight: moduleStats.goals.total > 0 ? `${moduleStats.goals.completedPercentage}% ${t("success rate")}` : t("Set your first goal"),
      iconColor: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      barColor: "bg-indigo-500",
    },
    {
      Icon: Library,
      label: t("Resource Library"),
      description: t("Access curated CBT exercises, guides, and reading material."),
      href: "/library",
      stat: null,
      statLabel: t("resources"),
      insight: t("Explore techniques & tools"),
      iconColor: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
      barColor: "bg-teal-500",
    },
  ];

  return (
    <AppLayout title={t("Dashboard")}>
      <div className="min-h-screen bg-slate-50">
        <ClientDebug />

        {/* ── Hero banner — negative margins cancel the main element's px-2 sm:px-4 padding ── */}
        <div className="-mx-2 sm:-mx-4 bg-gradient-to-br from-[#090514] via-purple-950 to-indigo-950 px-6 sm:px-10 pt-8 pb-10 relative overflow-hidden">
          {/* Decorative glows */}
          <div className="absolute -top-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-12 w-52 h-52 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              {/* Greeting */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400/80 text-xs font-bold tracking-widest uppercase">{t("Your Wellness Space")}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                  {isRTL ? `${timeGreeting}، ${displayName}` : `${timeGreeting}, ${displayName}`}
                </h1>
                <p className="text-purple-300/70 text-base max-w-md leading-relaxed">
                  {motivationalLine}
                </p>
              </div>

              {/* Top-level stats */}
              <div className="flex items-center gap-6 shrink-0 flex-wrap">
                {[
                  { value: tNum(`${engagementScore}%`), label: t("Engagement") },
                  { value: tNum(totalActivities),        label: t("Activities")  },
                  { value: tNum(moduleStats.goals.total), label: t("Goals Set")  },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold text-white">{tNum(s.value)}</div>
                    <div className="text-xs text-purple-400/80 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Journey progress strip */}
            <div className="mt-6 bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">{t("Journey Milestone")}</span>
                </div>
                <span className="text-xs text-purple-400">{tNum(`${engagementScore}%`)} {t("of first milestone")}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-700"
                  style={{ width: `${engagementScore}%` }}
                />
              </div>
              <p className="text-[11px] text-purple-400/60 mt-1.5">{tNum(totalActivities)} {t("activities. Keep going — consistency builds resilience.")}</p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-5xl mx-auto pt-6 pb-10 space-y-5">

          {/* Today's Focus */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-900" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Today's Focus")}</span>
              </div>
              <span className="text-xs font-semibold text-slate-400">{tNum(`${completedSteps}/5`)} {t("done")}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {todayFocus.map(({ Icon, label, href, done, color, bg, border }) => (
                <Link key={href} href={href}>
                  <div className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                    done
                      ? "border-emerald-200 bg-emerald-50/60"
                      : cn(border, bg, "hover:border-purple-200 hover:bg-white")
                  )}>
                    {done && (
                      <CheckCircle2 className="absolute top-2 right-2 h-3 w-3 text-emerald-500" />
                    )}
                    <div className={cn("p-1.5 rounded-lg shrink-0", done ? "bg-emerald-100" : bg)}>
                      <Icon className={cn("h-4 w-4", done ? "text-emerald-500" : color)} />
                    </div>
                    <span className={cn(
                      "text-xs font-semibold leading-tight",
                      done ? "text-emerald-600" : "text-slate-600"
                    )}>
                      {label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Progress snapshot */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-900" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("My Progress")}</span>
              </div>
              <button
                onClick={() => navigate("/reports")}
                className="flex items-center gap-1 text-xs font-semibold text-purple-900 hover:text-[#090514] transition-colors"
              >
                {t("View Report")} <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>

            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">{t("Engagement Score")}</span>
                <span className="text-sm font-bold text-[#090514]">{tNum(`${engagementScore}%`)}</span>
              </div>
              <Progress value={engagementScore} className="h-2 [&>div]:bg-purple-600" />
              <p className="text-xs text-slate-400 mt-1.5">{tNum(totalActivities)} {t("total activities across all modules")}</p>
            </div>

            <div className="grid grid-cols-5 gap-3 pt-4 border-t border-slate-100">
              {[
                { val: moduleStats.emotions.total,          label: t("Emotions"),  color: "text-rose-500",    bg: "bg-rose-50"    },
                { val: moduleStats.thoughts.total,          label: t("Thoughts"),  color: "text-purple-600",  bg: "bg-purple-50"  },
                { val: moduleStats.reframe.totalPractices,  label: t("Reframes"),  color: "text-emerald-600", bg: "bg-emerald-50" },
                { val: moduleStats.journal.total,           label: t("Journal"),   color: "text-amber-600",   bg: "bg-amber-50"   },
                { val: moduleStats.goals.total,             label: t("Goals"),     color: "text-indigo-600",  bg: "bg-indigo-50"  },
              ].map((s, i) => (
                <div key={i} className={cn("rounded-xl p-2.5 text-center", s.bg)}>
                  <div className={cn("text-xl font-bold", s.color)}>{tNum(s.val)}</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Module cards */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <LayoutDashboard className="h-4 w-4 text-purple-900" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Your Modules")}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientModules.map(({ Icon, label, description, href, stat, statLabel, insight, iconColor, bg, border }) => (
                <Link key={href} href={href}>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 cursor-pointer hover:border-purple-200 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn("p-2.5 rounded-xl border", bg, border)}>
                        <Icon className={cn("h-5 w-5", iconColor)} />
                      </div>
                      <ChevronIcon className="h-4 w-4 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
                    </div>
                    <h3 className="font-bold text-slate-700 text-sm mb-1">{label}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed flex-1">{description}</p>
                    <div className="flex items-end justify-between mt-4 pt-4 border-t border-slate-100">
                      <div>
                        <div className={cn("text-2xl font-bold", stat !== null ? iconColor : "text-slate-300")}>
                          {stat !== null ? tNum(stat) : "—"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">{t(statLabel)}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 text-right max-w-[130px] leading-relaxed italic">
                        {insight}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Motivational footer nudge */}
          <div className="bg-gradient-to-r from-[#090514] via-purple-950 to-indigo-950 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{t("Insight")}</span>
              </div>
              <p className="text-white text-sm font-medium max-w-md leading-relaxed">
                {isRTL 
                  ? `لقد أنجزت ${tNum(totalActivities)} ${t("activities. Keep going — consistency builds resilience.")}` 
                  : `You've completed ${tNum(totalActivities)} ${t("activities. Keep going — consistency builds resilience.")}`}
              </p>
            </div>
            <button
              onClick={() => navigate("/reports")}
              className="shrink-0 h-9 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl text-xs transition-all duration-200 flex items-center gap-1.5"
            >
              {t("View Report")} <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
