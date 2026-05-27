import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useClientContext } from "@/context/ClientContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useLocalization } from "@/lib/localize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import AppLayout from "@/components/layout/AppLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  Search,
  BookOpen,
  Heart,
  Target,
  Brain,
  UserPlus,
  Send,
  Clock,
  RefreshCw,
  Trash2,
  ChevronRight,
  Info,
  Plus,
  X,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  therapistId: number | null;
  status: string;
  createdAt: Date;
  currentViewingClientId: number | null;
}

const inviteClientSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});
type InviteClientFormValues = z.infer<typeof inviteClientSchema>;

const getInitials = (name: string, username: string) => {
  const displayName = name || username || "";
  const parts = displayName.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return displayName.slice(0, 2).toUpperCase();
};

const avatarPalette = [
  { bg: "bg-teal-50",   text: "text-slate-800",   border: "border-teal-200" },
  { bg: "bg-indigo-50",   text: "text-slate-800",   border: "border-indigo-200" },
  { bg: "bg-violet-50",   text: "text-slate-800",   border: "border-violet-200" },
  { bg: "bg-teal-100",  text: "text-slate-800",   border: "border-teal-200" },
  { bg: "bg-indigo-100",  text: "text-slate-800",   border: "border-indigo-200" },
  { bg: "bg-blue-50",     text: "text-slate-800",   border: "border-blue-200" },
];
const getAvatarPalette = (id: number) => avatarPalette[id % avatarPalette.length];

function TabButton({
  active, onClick, icon, label, count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
        active
          ? "bg-teal-800 text-white shadow-sm"
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className={active ? "text-teal-200" : "text-slate-400"}>{icon}</span>
      {label}
      {count !== undefined && (
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        }`}>{count}</span>
      )}
    </button>
  );
}

const lightInput = "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-400 transition-all";

export default function Clients() {
  const { t, tNum, isRTL } = useLocalization();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { setViewingClient } = useClientContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"directory" | "invitations">("directory");

  const { data: clients, isLoading: clientsLoading } = useQuery<User[]>({
    queryKey: ["/api/users/clients"],
    enabled: !!user && (user.role === "therapist" || user.role === "admin"),
  });

  const { data: invitations, isLoading: invitationsLoading } = useQuery<any[]>({
    queryKey: ["/api/invitations"],
    enabled: !!user && (user.role === "therapist" || user.role === "admin"),
    staleTime: 0,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (clients && Array.isArray(clients) && clients.length > 0 && selectedClientId === null) {
      if (window.innerWidth >= 1024) {
        const first = clients[0];
        setSelectedClientId(first.id);
        // Sync viewing client context so sidebar navigation always matches the highlighted client
        setViewingClient(first.id, first.name || first.username);
        localStorage.setItem("viewingClientId", first.id.toString());
        localStorage.setItem("viewingClientName", first.name || first.username);
      }
    }
  }, [clients]);

  const inviteForm = useForm<InviteClientFormValues>({
    resolver: zodResolver(inviteClientSchema),
    defaultValues: { email: "", name: "" },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteClientFormValues) => apiRequest("POST", "/api/auth/invite-client", data),
    onSuccess: () => {
      toast({ title: t("Invitation sent!"), description: t("The client invitation has been sent successfully.") });
      setShowInviteDialog(false);
      inviteForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({ title: t("Error"), description: error.message || t("Failed to send invitation."), variant: "destructive" });
    },
  });

  const onInviteSubmit = (data: InviteClientFormValues) => inviteMutation.mutate(data);

  const setClient = (client: User) => {
    // Invalidate all cached user-specific data so the new client's pages fetch fresh
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return typeof key === "string" && key.includes("/api/users/");
      },
    });
    setViewingClient(client.id, client.name || client.username);
    localStorage.setItem("viewingClientId", client.id.toString());
    localStorage.setItem("viewingClientName", client.name || client.username);
  };

  const handleViewRecords        = (c: User) => { setClient(c); navigate("/emotions"); };
  const handleViewGoals          = (c: User) => { setClient(c); navigate("/goals"); };
  const handleViewJournals       = (c: User) => { setClient(c); navigate("/journal"); };
  const handleViewThoughtRecords = (c: User) => { setClient(c); navigate("/thoughts"); };
  const handleViewStats          = (c: User) => { setClient(c); navigate("/dashboard"); };

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => apiRequest("DELETE", `/api/users/clients/${clientId}`),
    onSuccess: () => {
      toast({ title: t("Client Removed"), description: t("The client has been successfully removed from your practice.") });
      queryClient.invalidateQueries({ queryKey: ["/api/users/clients"] });
    },
    onError: (error: Error) => {
      toast({ title: t("Error"), description: error.message || t("Failed to remove client"), variant: "destructive" });
    },
  });

  const handleDeleteClient = (client: User) => {
    if (confirm(t("Are you sure you want to remove {name} from your practice? This action cannot be undone.").replace('{name}', client.name || client.username))) {
      deleteClientMutation.mutate(client.id);
    }
  };

  const [resendingInvitation, setResendingInvitation] = useState<number | null>(null);
  const resendMutation = useMutation({
    mutationFn: async (id: number) => { setResendingInvitation(id); return apiRequest("POST", `/api/invitations/${id}/resend`); },
    onSuccess: () => {
      toast({ title: t("Invitation Resent!"), description: t("The invitation has been sent again successfully.") });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      setResendingInvitation(null);
    },
    onError: (error: Error) => {
      if (error.message.includes("Invitation not found")) {
        queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
        toast({ title: t("Invitation Removed"), description: t("This invitation was already processed or removed.") });
      } else {
        toast({ title: t("Error"), description: error.message || t("Failed to resend invitation."), variant: "destructive" });
      }
      setResendingInvitation(null);
    },
  });

  const filteredClients = (clients && Array.isArray(clients))
    ? clients.filter((c: User) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const filteredInvitations = (invitations && Array.isArray(invitations))
    ? invitations.filter((inv: any) => {
        if (inv.status !== "pending" && inv.status !== "email_sent") return false;
        const isExisting = clients && Array.isArray(clients) ? clients.some((c: any) => c.email === inv.email) : false;
        return !isExisting;
      })
    : [];

  const uniqueInvitations = filteredInvitations.reduce((acc: any[], inv: any) => {
    const existing = acc.find((i) => i.email === inv.email);
    if (!existing) { acc.push(inv); }
    else if (inv.id > existing.id) { acc[acc.findIndex((i) => i.email === inv.email)] = inv; }
    return acc;
  }, []);

  const totalClientsCount   = clients?.length || 0;
  const pendingInvitesCount = uniqueInvitations?.length || 0;
  const activeClientsCount  = clients?.filter((c: any) => c.status === "active").length || 0;
  const activeRate          = totalClientsCount > 0 ? Math.round((activeClientsCount / totalClientsCount) * 100) : 0;

  if (clientsLoading) {
    return (
      <AppLayout title={t("Client Directory")}>
        <div className="min-h-full bg-slate-50 flex items-center justify-center" style={{ minHeight: "50vh" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-700" />
            <p className="text-slate-500 text-sm font-medium">{t("Syncing practice data…")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t("Client Directory")}>
      <div className="min-h-full bg-slate-50">

        {/* ─── Hero Header ─── */}
        <div className="bg-white border-b border-slate-100 px-6 py-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-teal-800 rounded-xl shadow-lg shadow-teal-900/20">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-teal-700 text-sm font-bold tracking-widest uppercase">{t("Clinical Workspace")}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-slate-800">
                  {t("Client Directory")}
                </h1>
                <p className="text-slate-500 text-base max-w-xl leading-relaxed">
                  {t("Access individual client records, launch clinical modules, and manage your practice connections.")}
                </p>
              </div>

              {/* Stats + invite */}
              <div className="flex items-center gap-4 md:gap-6 shrink-0 flex-wrap">
                {[
                  { value: tNum(totalClientsCount), label: t("Clients") },
                  { value: tNum(`${activeRate}%`), label: t("Active") },
                  { value: tNum(pendingInvitesCount), label: t("Pending") },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</div>
                  </div>
                ))}

                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button className="ml-2 h-10 px-5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-sm shrink-0">
                      <Plus className="h-4 w-4 mr-2" /> {t("Invite Client")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-2xl bg-white border border-slate-100 shadow-xl text-slate-800" dir={isRTL ? "rtl" : "ltr"}>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-slate-800">
                        <UserPlus className="h-5 w-5 text-slate-800" /> {t("Invite a Client")}
                      </DialogTitle>
                      <DialogDescription className="text-slate-500">
                        {t("Send a secure invitation to connect a client's account to your practice.")}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...inviteForm}>
                      <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4 pt-2">
                        <FormField control={inviteForm.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">{t("Full Name")}</FormLabel>
                            <FormControl><Input placeholder={t("Jane Doe")} className={lightInput} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={inviteForm.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">{t("Email Address")}</FormLabel>
                            <FormControl><Input placeholder={t("client@example.com")} className={lightInput} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <DialogFooter className="pt-2">
                          <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}
                            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                            {t("Cancel")}
                          </Button>
                          <Button type="submit" disabled={inviteMutation.isPending}
                            className="rounded-xl bg-teal-800 hover:bg-teal-700 text-white">
                            {inviteMutation.isPending ? (
                              <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> {t("Sending…")}</span>
                            ) : (
                              <span className="flex items-center gap-2"><Send className="h-4 w-4" /> {t("Send Invitation")}</span>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tab Navigation ─── */}
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto no-scrollbar">
              <TabButton active={activeTab === "directory"} onClick={() => setActiveTab("directory")} icon={<Users className="h-4 w-4" />} label={t("Client Directory")} count={totalClientsCount} />
              <TabButton active={activeTab === "invitations"} onClick={() => setActiveTab("invitations")} icon={<Mail className="h-4 w-4" />} label={t("Pending Connections")} count={pendingInvitesCount} />
            </div>
          </div>
        </div>

        {/* ─── Page Body ─── */}
        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* ══ CLIENT DIRECTORY ══ */}
          {activeTab === "directory" && (
            <div className="space-y-4">

              {/* Search */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("Search clients…")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 h-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
                  <p className="text-xs text-slate-500 font-medium mb-1">{t("Registered")}</p>
                  <p className="text-2xl font-bold text-slate-800">{tNum(totalClientsCount)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
                  <p className="text-xs text-slate-500 font-medium mb-1">{t("Active Rate")}</p>
                  <p className="text-2xl font-bold text-slate-800">{tNum(`${activeRate}%`)}</p>
                </div>
              </div>

              {/* Hint */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>{t("Click a client's name to open their overview, or use the module icons for direct access.")}</span>
              </div>

              {/* Client list */}
              {clientsLoading ? (
                <div className="flex justify-center py-16">
                  <RefreshCw className="h-6 w-6 text-teal-700 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {filteredClients.map((client: User) => {
                      const palette = getAvatarPalette(client.id);
                      return (
                        <motion.div
                          key={client.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white border border-slate-100 hover:border-teal-200 hover:shadow-md rounded-2xl p-3.5 flex items-center gap-3 shadow-sm transition-all duration-200 group"
                          onClick={() => { setSelectedClientId(client.id); setClient(client); }}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 shadow-sm ${
                            isSelected
                              ? "bg-teal-50 border-teal-200"
                              : "bg-white border-slate-100 hover:border-teal-100 hover:bg-teal-50/30"
                          }`}
                        >
                          {/* Avatar + name — click → client overview dashboard */}
                          <button
                            onClick={() => handleViewStats(client)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            <div className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 border ${palette.bg} ${palette.text} ${palette.border} group-hover:shadow-sm transition-all`}>
                              {getInitials(client.name, client.username)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm text-slate-800 truncate leading-tight">{client.name || client.username}</h4>
                                {client.status === "active" && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-400 truncate mt-0.5">{client.email}</p>
                            </div>
                          </button>

                          {/* Module shortcut icons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => handleViewRecords(client)} title={t("Emotions")}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 border border-transparent transition-all duration-150">
                              <Heart className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleViewThoughtRecords(client)} title={t("Thoughts")}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-violet-500 hover:bg-violet-50 hover:border-violet-100 border border-transparent transition-all duration-150">
                              <Brain className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleViewJournals(client)} title={t("Journal")}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-100 border border-transparent transition-all duration-150">
                              <BookOpen className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleViewGoals(client)} title={t("Goals")}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-amber-500 hover:bg-amber-50 hover:border-amber-100 border border-transparent transition-all duration-150">
                              <Target className="h-3.5 w-3.5" />
                            </button>

                            <div className="w-px h-4 bg-slate-100 mx-0.5" />

                            <button onClick={() => handleDeleteClient(client)} title={t("Remove client")}
                              disabled={deleteClientMutation.isPending}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all duration-150 disabled:opacity-40">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>

                            <div className="w-px h-4 bg-slate-100 mx-0.5" />

                            <button onClick={() => handleViewStats(client)} title={t("Open overview")}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-200 border border-transparent transition-all duration-150">
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {filteredClients.length === 0 && (
                    <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
                      <Users className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-600">{t("No clients found")}</p>
                      <p className="text-xs text-slate-400 mt-1">{t("Try a different search or send an invite.")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* ══ PENDING CONNECTIONS ══ */}
          {activeTab === "invitations" && (
            <div>
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-teal-700" /> {t("Pending Connections")}
                    <span className="flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-xs rounded-full h-5 px-2">{tNum(pendingInvitesCount)}</span>
                  </h2>
                  <p className="text-sm text-slate-500">{t("Invitations dispatched to clients awaiting registration.")}</p>
                </div>
                <Button onClick={() => setShowInviteDialog(true)}
                  className="shrink-0 h-10 px-5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm">
                  <UserPlus className="h-4 w-4 mr-2" /> {t("Send Invite")}
                </Button>
              </div>

              {invitationsLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-700" />
                </div>
              ) : uniqueInvitations && uniqueInvitations.length > 0 ? (
                <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-500 pl-6 h-11 text-xs uppercase tracking-widest">{t("Recipient")}</TableHead>
                        <TableHead className="font-semibold text-slate-500 h-11 text-xs uppercase tracking-widest">{t("Email")}</TableHead>
                        <TableHead className="font-semibold text-slate-500 h-11 text-xs uppercase tracking-widest">{t("Sent On")}</TableHead>
                        <TableHead className="font-semibold text-slate-500 h-11 text-xs text-right pr-6 uppercase tracking-widest">{t("Action")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueInvitations.map((invitation: any) => (
                        <TableRow key={invitation.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <TableCell className="font-semibold text-slate-700 pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-slate-800 flex items-center justify-center text-xs font-bold border border-indigo-200">
                                {(invitation.name || "?").slice(0, 2).toUpperCase()}
                              </div>
                              {invitation.name || t("Anonymous")}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500 py-4 font-mono text-xs">{invitation.email}</TableCell>
                          <TableCell className="text-slate-500 py-4 text-xs">
                            {invitation.createdAt
                              ? new Date(invitation.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right pr-6 py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resendMutation.mutate(invitation.id)}
                              disabled={resendingInvitation === invitation.id}
                              className="rounded-xl border-slate-200 text-slate-600 text-xs hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 h-8 gap-1.5 bg-white"
                            >
                              {resendingInvitation === invitation.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                              Resend
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-5 bg-emerald-50 rounded-full mb-5 border border-emerald-100">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">{t("No pending invitations")}</h3>
                  <p className="text-sm text-slate-400 mb-6 max-w-sm">
                    {t("All connection requests have been completed. Invite new clients to expand your practice.")}
                  </p>
                  <Button onClick={() => setShowInviteDialog(true)}
                    className="bg-teal-800 hover:bg-teal-700 text-white rounded-xl shadow-sm">
                    <UserPlus className="h-4 w-4 mr-2" /> {t("Send Secure Invite")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
