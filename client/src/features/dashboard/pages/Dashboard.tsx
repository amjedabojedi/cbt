import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import GettingStarted from "@/features/dashboard/components/GettingStarted";
import ModuleSummaryCard from "@/features/dashboard/components/ModuleSummaryCard";
import { useModuleStats } from "@/hooks/use-module-stats";
import useActiveUser from "@/hooks/use-active-user";
import { useClientContext } from "@/context/ClientContext";
import { ClientDebug } from "@/features/admin/components/debug/ClientDebug";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Heart, Brain, Lightbulb, BookOpen, Target,
  Users, UserCheck, UserPlus, BookText, Goal,
  LayoutDashboard, Activity, TrendingUp, ChevronRight,
  Settings, Library, Sparkles, Shield, BarChart3,
  Clock, Calendar, Bell, FileText, Zap, ArrowUpRight,
  ArrowLeft, User,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  const accentMap = {
    purple: "group-hover:bg-[#090514] group-hover:text-white bg-purple-50 text-[#090514] border-purple-100 group-hover:border-[#090514] group-hover:shadow-[0_0_12px_rgba(9,5,20,0.2)]",
    indigo: "group-hover:bg-indigo-900 group-hover:text-white bg-indigo-50 text-indigo-900 border-indigo-100 group-hover:border-indigo-900",
    violet: "group-hover:bg-violet-900 group-hover:text-white bg-violet-50 text-violet-900 border-violet-100 group-hover:border-violet-900",
    slate: "group-hover:bg-slate-800 group-hover:text-white bg-slate-100 text-slate-700 border-slate-200 group-hover:border-slate-800",
  };
  return (
    <button
      onClick={onClick}
      className="group w-full bg-white border border-slate-100 hover:border-purple-200 hover:shadow-md p-4 rounded-2xl text-left transition-all duration-300 hover:-translate-y-0.5 focus:outline-none flex items-center justify-between gap-3 h-[82px] shadow-sm"
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
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all shrink-0" />
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
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
      <div className="p-2.5 rounded-xl bg-purple-50 text-[#090514] border border-purple-100 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        {loading ? (
          <div className="h-7 w-14 bg-slate-100 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold text-[#090514] leading-tight">{value}</p>
        )}
        <p className="text-sm font-medium text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
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

  const isTherapist = user?.role === "therapist";
  const isClient    = user?.role === "client";
  const isAdmin     = user?.role === "admin";

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
    ? viewingClientName
    : user?.name?.split(" ")[0] || "there";

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
      <AppLayout title="Admin Dashboard">
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
                    <span className="text-purple-900 text-sm font-bold tracking-widest uppercase">System Control</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-slate-800">
                    Admin Dashboard
                  </h1>
                  <p className="text-slate-500 text-base max-w-xl leading-relaxed">
                    Monitor platform activity, manage users, and configure system settings.
                  </p>
                </div>

                {/* Top stats */}
                <div className="flex items-center gap-6 shrink-0 flex-wrap">
                  {[
                    { value: adminStats?.totalUsers ?? "—", label: "Total Users" },
                    { value: adminStats?.totalClients ?? "—", label: "Clients" },
                    { value: adminStats?.totalTherapists ?? "—", label: "Therapists" },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-[#090514]">{adminLoading ? "…" : s.value}</div>
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
              <SectionHeading icon={<BarChart3 className="h-4 w-4" />} label="Platform Overview" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Users className="h-5 w-5" />}      value={adminLoading ? "…" : adminStats?.totalClients ?? 0}    label="Total Clients"     loading={adminLoading} />
                <StatCard icon={<UserCheck className="h-5 w-5" />}  value={adminLoading ? "…" : adminStats?.activeClients ?? 0}   label="Active Clients"    loading={adminLoading} />
                <StatCard icon={<Shield className="h-5 w-5" />}     value={adminLoading ? "…" : adminStats?.totalTherapists ?? 0} label="Therapists"        loading={adminLoading} />
                <StatCard icon={<Activity className="h-5 w-5" />}   value={adminLoading ? "…" : adminStats?.totalEmotions ?? 0}   label="Emotion Records"   loading={adminLoading} />
              </div>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard icon={<Brain className="h-5 w-5" />}    value={adminLoading ? "…" : adminStats?.totalThoughtRecords ?? 0} label="Thought Records" loading={adminLoading} />
              <StatCard icon={<Goal className="h-5 w-5" />}     value={adminLoading ? "…" : adminStats?.totalGoals ?? 0}          label="Total Goals"     loading={adminLoading} />
              <StatCard icon={<BookText className="h-5 w-5" />} value={adminLoading ? "…" : adminStats?.totalJournalEntries ?? 0} label="Journal Entries" loading={adminLoading} />
            </div>

            {/* Quick navigation */}
            <div>
              <SectionHeading icon={<Zap className="h-4 w-4" />} label="Admin Functions" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <QuickActionCard icon={<Users className="h-5 w-5" />}     label="User Management"      description="View and manage all platform users"          onClick={() => navigate("/admin/users")} />
                <QuickActionCard icon={<BarChart3 className="h-5 w-5" />} label="System Statistics"    description="Monitor application usage and metrics"        onClick={() => navigate("/admin/stats")} />
                <QuickActionCard icon={<Settings className="h-5 w-5" />}  label="Platform Settings"    description="Configure system-wide settings"               onClick={() => navigate("/settings")} />
                <QuickActionCard icon={<Bell className="h-5 w-5" />}      label="Notifications"        description="Manage and review system notifications"       onClick={() => navigate("/admin/notifications")} accent="indigo" />
                <QuickActionCard icon={<Library className="h-5 w-5" />}   label="Resource Library"     description="Manage clinical resources and materials"      onClick={() => navigate("/resources")} accent="violet" />
                <QuickActionCard icon={<FileText className="h-5 w-5" />}  label="Activity Logs"        description="Review platform activity and audit trails"    onClick={() => navigate("/admin/logs")} accent="slate" />
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
      <AppLayout title="Dashboard">
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
                    <span className="text-purple-900 text-sm font-bold tracking-widest uppercase">Clinical Workspace</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-slate-800">
                    Welcome back, {displayName}
                  </h1>
                  <p className="text-slate-500 text-base max-w-xl leading-relaxed">
                    Manage your practice and view insights about your clients.
                  </p>
                </div>

                {/* Top stats */}
                <div className="flex items-center gap-6 shrink-0 flex-wrap">
                  {[
                    { value: totalClients,  label: "Clients"  },
                    { value: `${activeRate}%`, label: "Active"   },
                    { value: newClients,    label: "New (14d)" },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-[#090514]">{clientsLoading ? "…" : s.value}</div>
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
              <SectionHeading icon={<BarChart3 className="h-4 w-4" />} label="Practice Overview" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={<Users className="h-5 w-5" />}     value={totalClients}                       label="Total Clients"    sub={`${newClients} new in last 14 days`}  loading={clientsLoading} />
                <StatCard icon={<UserCheck className="h-5 w-5" />} value={activeClients}                      label="Active Clients"   sub={`${activeRate}% engagement rate`}      loading={clientsLoading} />
                <StatCard icon={<UserPlus className="h-5 w-5" />}  value={newClients}                         label="New Clients"      sub="Registered in the last 14 days"        loading={clientsLoading} />
                <StatCard icon={<BookText className="h-5 w-5" />}  value={journalStats?.totalCount ?? 0}      label="Journal Entries"  sub="Across all clients"                    />
                <StatCard icon={<Brain className="h-5 w-5" />}     value={thoughtStats?.totalCount ?? 0}      label="Thought Records"  sub="Across all clients"                    />
                <StatCard icon={<Target className="h-5 w-5" />}    value={goalStats?.totalCount ?? 0}         label="Active Goals"     sub="Across all clients"                    />
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <SectionHeading icon={<Zap className="h-4 w-4" />} label="Quick Access" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <QuickActionCard
                  icon={<Users className="h-5 w-5" />}
                  label="Client Directory"
                  description="View and manage your clients"
                  onClick={() => navigate("/clients")}
                />
                <QuickActionCard
                  icon={<Library className="h-5 w-5" />}
                  label="Resource Library"
                  description="Browse and assign clinical resources"
                  onClick={() => navigate("/resources")}
                  accent="indigo"
                />
                <QuickActionCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="Reports"
                  description="View clinical reports and summaries"
                  onClick={() => navigate("/reports")}
                  accent="violet"
                />
                <QuickActionCard
                  icon={<Settings className="h-5 w-5" />}
                  label="Settings"
                  description="Configure your practice preferences"
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
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Clients</span>
                  </div>
                  <button
                    onClick={() => navigate("/clients")}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-900 hover:text-[#090514] transition-colors"
                  >
                    View all <ArrowUpRight className="h-3.5 w-3.5" />
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
                          <span className="text-xs text-slate-400 font-medium capitalize">{client.status}</span>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
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
                <h3 className="text-base font-bold text-slate-700 mb-1">No clients yet</h3>
                <p className="text-sm text-slate-400 mb-5 max-w-xs">
                  Invite clients to start building your practice and tracking progress.
                </p>
                <button
                  onClick={() => navigate("/clients")}
                  className="h-10 px-5 bg-[#090514] hover:bg-purple-950 text-white font-semibold rounded-xl shadow-sm text-sm flex items-center gap-2 transition-all"
                >
                  <UserPlus className="h-4 w-4" /> Invite Your First Client
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
      { icon: <Heart className="h-5 w-5" />,     value: moduleStats.emotions.total,          label: "Emotion Logs",      sub: "mood & trigger entries"           },
      { icon: <Brain className="h-5 w-5" />,     value: moduleStats.thoughts.total,          label: "Thought Records",   sub: `top pattern: ${moduleStats.thoughts.topANT || "—"}` },
      { icon: <Lightbulb className="h-5 w-5" />, value: moduleStats.reframe.totalPractices,  label: "Reframe Sessions",  sub: `avg score ${moduleStats.reframe.averageScore}`     },
      { icon: <BookOpen className="h-5 w-5" />,  value: moduleStats.journal.total,           label: "Journal Entries",   sub: `${moduleStats.journal.emotionsDetected} emotions found` },
      { icon: <Target className="h-5 w-5" />,    value: moduleStats.goals.total,             label: "Smart Goals",       sub: `${moduleStats.goals.completedPercentage}% success rate` },
    ];

    return (
      <AppLayout title={`${displayName}'s Analytics`}>
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
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Clients
              </button>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-[#090514] rounded-xl shadow-lg shadow-purple-950/20">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-purple-900 text-sm font-bold tracking-widest uppercase">Client Analytics</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-slate-800">
                    {displayName}'s Dashboard
                  </h1>
                  <p className="text-slate-500 text-base max-w-xl leading-relaxed">
                    Engagement metrics, module activity, and progress data for this client.
                  </p>
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-6 shrink-0 flex-wrap">
                  {[
                    { value: totalActivities,          label: "Activities"  },
                    { value: `${engagementScore}%`,    label: "Engagement"  },
                    { value: moduleStats.goals.total,  label: "Goals"       },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-[#090514]">{s.value}</div>
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
              <SectionHeading icon={<Activity className="h-4 w-4" />} label="Module Activity" />
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
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Engagement Score</span>
                </div>
                <span className="text-2xl font-bold text-[#090514]">{engagementScore}%</span>
              </div>
              <Progress value={engagementScore} className="h-2.5 mb-3" />
              <p className="text-xs text-slate-400">{totalActivities} total activities logged across all clinical modules</p>

              {/* Per-module breakdown row */}
              <div className="grid grid-cols-5 gap-2 mt-5 pt-4 border-t border-slate-100">
                {[
                  { val: moduleStats.emotions.total,         label: "Emotions",  color: "text-blue-600"   },
                  { val: moduleStats.thoughts.total,         label: "Thoughts",  color: "text-purple-600" },
                  { val: moduleStats.reframe.totalPractices, label: "Reframes",  color: "text-emerald-600"},
                  { val: moduleStats.journal.total,          label: "Journal",   color: "text-amber-600"  },
                  { val: moduleStats.goals.total,            label: "Goals",     color: "text-indigo-600" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Module quick access */}
            <div>
              <SectionHeading icon={<Zap className="h-4 w-4" />} label="Open Module" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <QuickActionCard
                  icon={<Brain className="h-5 w-5" />}
                  label="Thought Records"
                  description={`${moduleStats.thoughts.total} records logged`}
                  onClick={() => navigate("/thought-records")}
                />
                <QuickActionCard
                  icon={<BookOpen className="h-5 w-5" />}
                  label="Journal"
                  description={`${moduleStats.journal.total} entries written`}
                  onClick={() => navigate("/journal")}
                  accent="indigo"
                />
                <QuickActionCard
                  icon={<Heart className="h-5 w-5" />}
                  label="Mood & Triggers"
                  description={`${moduleStats.emotions.total} logs recorded`}
                  onClick={() => navigate("/emotions")}
                  accent="violet"
                />
                <QuickActionCard
                  icon={<Target className="h-5 w-5" />}
                  label="Smart Goals"
                  description={`${moduleStats.goals.completedPercentage}% success rate`}
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
                View Full Client Profile
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </AppLayout>
    );
  }

  // ═══════════════════════════════════════
  //  CLIENT VIEW (client's own dashboard — unchanged)
  // ═══════════════════════════════════════
  return (
    <AppLayout title="Dashboard">
      <div className="container mx-auto px-4 py-6">
        <ClientDebug />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Welcome back, {displayName}</h1>
          <p className="text-neutral-500">Track your emotions, thoughts, and progress on your journey to clarity.</p>
        </div>

        <GettingStarted />

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-[#090514]" />
            <h2 className="text-base font-bold text-slate-700">Your Progress</h2>
          </div>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Engagement Score</span>
              <span className="text-sm font-bold text-[#090514]">{engagementScore}%</span>
            </div>
            <Progress value={engagementScore} className="h-2" />
            <p className="text-xs text-slate-400 mt-2">{totalActivities} total activities completed across all modules</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 pt-2 border-t border-slate-100">
            {[
              { val: moduleStats.emotions.total,          label: "Emotions",  color: "text-blue-600"   },
              { val: moduleStats.thoughts.total,          label: "Thoughts",  color: "text-purple-600" },
              { val: moduleStats.reframe.totalPractices,  label: "Practices", color: "text-green-600"  },
              { val: moduleStats.journal.total,           label: "Entries",   color: "text-amber-600"  },
              { val: moduleStats.goals.total,             label: "Goals",     color: "text-indigo-600" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 mb-6">
          <h2 className="text-xl font-bold">Your Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ModuleSummaryCard title="Emotion Tracking"  icon={Heart}     color="#3b82f6" backgroundColor="#dbeafe" linkTo="/emotions"       metrics={[{ label: "Total", value: moduleStats.emotions.total }, { label: "Most Common", value: moduleStats.emotions.mostCommon }]} />
            <ModuleSummaryCard title="Thought Records"   icon={Brain}     color="#9333ea" backgroundColor="#f3e8ff" linkTo="/thought-records" metrics={[{ label: "Total", value: moduleStats.thoughts.total }, { label: "Top Pattern", value: moduleStats.thoughts.topANT }]} />
            <ModuleSummaryCard title="Reframe Coach"     icon={Lightbulb} color="#16a34a" backgroundColor="#dcfce7" linkTo="/reframe-coach"   metrics={[{ label: "Practices", value: moduleStats.reframe.totalPractices }, { label: "Avg. Score", value: moduleStats.reframe.averageScore }]} />
            <ModuleSummaryCard title="Journal"           icon={BookOpen}  color="#eab308" backgroundColor="#fef9c3" linkTo="/journal"         metrics={[{ label: "Total", value: moduleStats.journal.total }, { label: "Emotions Found", value: moduleStats.journal.emotionsDetected }]} />
            <ModuleSummaryCard title="Smart Goals"       icon={Target}    color="#6366f1" backgroundColor="#e0e7ff" linkTo="/goals"           metrics={[{ label: "Total", value: moduleStats.goals.total }, { label: "Success Rate", value: `${moduleStats.goals.completedPercentage}%` }]} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
