import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useClientContext } from "@/context/ClientContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
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
  MessageCircle,
  Brain,
  UserPlus,
  User,
  Send,
  Clock,
  RefreshCw,
  Trash2,
  Calendar,
  Shield,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Info,
  ExternalLink,
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
  { bg: "bg-purple-50",   text: "text-[#090514]",   border: "border-purple-200" },
  { bg: "bg-indigo-50",   text: "text-[#090514]",   border: "border-indigo-200" },
  { bg: "bg-violet-50",   text: "text-[#090514]",   border: "border-violet-200" },
  { bg: "bg-purple-100",  text: "text-[#090514]",   border: "border-purple-200" },
  { bg: "bg-indigo-100",  text: "text-[#090514]",   border: "border-indigo-200" },
  { bg: "bg-blue-50",     text: "text-[#090514]",   border: "border-blue-200" },
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
          ? "bg-[#090514] text-white shadow-sm"
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className={active ? "text-purple-200" : "text-slate-400"}>{icon}</span>
      {label}
      {count !== undefined && (
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        }`}>{count}</span>
      )}
    </button>
  );
}

function ModuleCard({
  icon, code, title, description, onClick,
}: {
  icon: React.ReactNode;
  code: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group/card w-full bg-white border border-slate-100 hover:border-purple-200 hover:shadow-md p-4 rounded-2xl text-left transition-all duration-300 hover:-translate-y-0.5 focus:outline-none flex items-center justify-between gap-3 h-[82px] shadow-sm"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#090514] group-hover/card:bg-[#090514] group-hover/card:text-white flex items-center justify-center shrink-0 transition-all duration-300 border border-purple-100 group-hover/card:border-[#090514] group-hover/card:shadow-[0_0_12px_rgba(9,5,20,0.25)]">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-mono font-bold tracking-widest text-purple-500 group-hover/card:text-purple-900 uppercase transition-colors">{code}</span>
            <span className="h-1 w-1 rounded-full bg-slate-200 group-hover/card:bg-purple-400" />
            <h4 className="font-bold text-xs text-slate-700 group-hover/card:text-slate-900 transition-colors uppercase tracking-wide truncate">{title}</h4>
          </div>
          <p className="text-[10px] text-slate-400 group-hover/card:text-slate-500 transition-colors leading-relaxed line-clamp-1">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover/card:text-purple-500 group-hover/card:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}

const lightInput = "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:border-purple-400 transition-all";

export default function Clients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { setViewingClient } = useClientContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"directory" | "invitations">("directory");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const { data: clients, isLoading: clientsLoading } = useQuery<User[]>({
    queryKey: ["/api/users/clients"],
    enabled: !!user && (user.role === "therapist" || user.role === "admin"),
  });

  const { data: invitations, isLoading: invitationsLoading } = useQuery<any[]>({
    queryKey: ["/api/invitations"],
    enabled: !!user && (user.role === "therapist" || user.role === "admin"),
  });

  useEffect(() => {
    if (clients && Array.isArray(clients) && clients.length > 0 && selectedClientId === null) {
      if (window.innerWidth >= 1024) setSelectedClientId(clients[0].id);
    }
  }, [clients]);

  const inviteForm = useForm<InviteClientFormValues>({
    resolver: zodResolver(inviteClientSchema),
    defaultValues: { email: "", name: "" },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteClientFormValues) => apiRequest("POST", "/api/auth/invite-client", data),
    onSuccess: () => {
      toast({ title: "Invitation sent!", description: "The client invitation has been sent successfully." });
      setShowInviteDialog(false);
      inviteForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to send invitation.", variant: "destructive" });
    },
  });

  const onInviteSubmit = (data: InviteClientFormValues) => inviteMutation.mutate(data);

  const setClient = (client: User) => {
    setViewingClient(client.id, client.name || client.username);
    localStorage.setItem("viewingClientId", client.id.toString());
    localStorage.setItem("viewingClientName", client.name || client.username);
  };

  const handleViewRecords        = (c: User) => { setClient(c); navigate("/emotions"); };
  const handleViewGoals          = (c: User) => { setClient(c); navigate("/goals"); };
  const handleViewJournals       = (c: User) => { setClient(c); navigate("/journal"); };
  const handleViewThoughtRecords = (c: User) => { setClient(c); navigate("/thoughts"); };
  const handleViewStats          = (c: User) => { setClient(c); navigate("/dashboard"); };
  const handleViewProfile        = (c: User) => navigate(`/client/${c.id}`);
  const handleSendMessage        = (_c: User) => toast({ title: "Feature Coming Soon", description: "Direct messaging will be available in a future update." });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => apiRequest("DELETE", `/api/users/clients/${clientId}`),
    onSuccess: () => {
      toast({ title: "Client Removed", description: "The client has been successfully removed from your practice." });
      setSelectedClientId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users/clients"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to remove client", variant: "destructive" });
    },
  });

  const handleDeleteClient = (client: User) => {
    if (confirm(`Are you sure you want to remove ${client.name || client.username} from your practice? This action cannot be undone.`)) {
      deleteClientMutation.mutate(client.id);
    }
  };

  const [resendingInvitation, setResendingInvitation] = useState<number | null>(null);
  const resendMutation = useMutation({
    mutationFn: async (id: number) => { setResendingInvitation(id); return apiRequest("POST", `/api/invitations/${id}/resend`); },
    onSuccess: () => {
      toast({ title: "Invitation Resent!", description: "The invitation has been sent again successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      setResendingInvitation(null);
    },
    onError: (error: Error) => {
      if (error.message.includes("Invitation not found")) {
        queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
        toast({ title: "Invitation Removed", description: "This invitation was already processed or removed." });
      } else {
        toast({ title: "Error", description: error.message || "Failed to resend invitation.", variant: "destructive" });
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
  const selectedClient      = clients?.find((c) => c.id === selectedClientId) || null;

  if (clientsLoading) {
    return (
      <AppLayout title="Clients">
        <div className="min-h-full bg-slate-50 flex items-center justify-center" style={{ minHeight: "50vh" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#090514]" />
            <p className="text-slate-500 text-sm font-medium">Syncing practice data…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Clients">
      <div className="min-h-full bg-slate-50">

        {/* ─── Hero Header ─── */}
        <div className="bg-white border-b border-slate-100 px-6 py-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-[#090514] rounded-xl shadow-lg shadow-purple-950/20">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-purple-900 text-sm font-bold tracking-widest uppercase">Clinical Workspace</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-slate-800">
                  Client Directory
                </h1>
                <p className="text-slate-500 text-base max-w-xl leading-relaxed">
                  Access individual client records, launch clinical modules, and manage your practice connections.
                </p>
              </div>

              {/* Stats + invite */}
              <div className="flex items-center gap-4 md:gap-6 shrink-0 flex-wrap">
                {[
                  { value: totalClientsCount, label: "Clients" },
                  { value: `${activeRate}%`, label: "Active" },
                  { value: pendingInvitesCount, label: "Pending" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold text-[#090514]">{stat.value}</div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</div>
                  </div>
                ))}

                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button className="ml-2 h-10 px-5 bg-[#090514] hover:bg-purple-950 text-white font-semibold rounded-xl shadow-sm shrink-0">
                      <Plus className="h-4 w-4 mr-2" /> Invite Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-2xl bg-white border border-slate-100 shadow-xl text-slate-800">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-slate-800">
                        <UserPlus className="h-5 w-5 text-[#090514]" /> Invite a Client
                      </DialogTitle>
                      <DialogDescription className="text-slate-500">
                        Send a secure invitation to connect a client's account to your practice.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...inviteForm}>
                      <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4 pt-2">
                        <FormField control={inviteForm.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Full Name</FormLabel>
                            <FormControl><Input placeholder="Jane Doe" className={lightInput} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={inviteForm.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Email Address</FormLabel>
                            <FormControl><Input placeholder="client@example.com" className={lightInput} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <DialogFooter className="pt-2">
                          <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}
                            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                            Cancel
                          </Button>
                          <Button type="submit" disabled={inviteMutation.isPending}
                            className="rounded-xl bg-[#090514] hover:bg-purple-950 text-white">
                            {inviteMutation.isPending ? (
                              <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</span>
                            ) : (
                              <span className="flex items-center gap-2"><Send className="h-4 w-4" /> Send Invitation</span>
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
              <TabButton active={activeTab === "directory"} onClick={() => setActiveTab("directory")} icon={<Users className="h-4 w-4" />} label="Client Directory" count={totalClientsCount} />
              <TabButton active={activeTab === "invitations"} onClick={() => setActiveTab("invitations")} icon={<Mail className="h-4 w-4" />} label="Pending Connections" count={pendingInvitesCount} />
            </div>
          </div>
        </div>

        {/* ─── Page Body ─── */}
        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* ══ CLIENT DIRECTORY ══ */}
          {activeTab === "directory" && (
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">

              {/* LEFT — Index */}
              <div className={`w-full lg:w-[340px] shrink-0 flex flex-col gap-4 ${selectedClientId !== null ? "hidden lg:flex" : "flex"}`}>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search clients…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
                    <p className="text-xs text-slate-500 font-medium mb-1">Registered</p>
                    <p className="text-2xl font-bold text-[#090514]">{totalClientsCount}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
                    <p className="text-xs text-slate-500 font-medium mb-1">Active Rate</p>
                    <p className="text-2xl font-bold text-[#090514]">{activeRate}%</p>
                  </div>
                </div>

                {/* Hint */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>Select a client to open their workspace.</span>
                </div>

                {/* Client list */}
                <div className="flex-1 overflow-y-auto space-y-2 lg:max-h-[640px] pr-0.5">
                  <AnimatePresence mode="popLayout">
                    {filteredClients.map((client: User) => {
                      const isSelected = selectedClientId === client.id;
                      const palette = getAvatarPalette(client.id);
                      return (
                        <motion.button
                          key={client.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => setSelectedClientId(client.id)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 shadow-sm ${
                            isSelected
                              ? "bg-purple-50 border-purple-200"
                              : "bg-white border-slate-100 hover:border-purple-100 hover:bg-purple-50/30"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${
                              isSelected ? "bg-purple-100 text-[#090514] border-purple-300" : `${palette.bg} ${palette.text} ${palette.border}`
                            }`}>
                              {getInitials(client.name, client.username)}
                            </div>
                            <div className="min-w-0">
                              <h4 className={`font-semibold text-sm truncate leading-tight ${isSelected ? "text-purple-800" : "text-slate-700"}`}>{client.name || client.username}</h4>
                              <p className={`text-xs truncate mt-0.5 ${isSelected ? "text-purple-500" : "text-slate-400"}`}>{client.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {client.status === "active" && (
                              <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-purple-500 animate-pulse" : "bg-emerald-500"}`} />
                            )}
                            <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? "text-purple-500 translate-x-0.5" : "text-slate-300"}`} />
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>

                  {filteredClients.length === 0 && (
                    <div className="text-center py-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
                      <Users className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-600">No clients found</p>
                      <p className="text-xs text-slate-400 mt-1">Try a different search or send an invite.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT — Workbench */}
              <div className={`flex-1 w-full ${selectedClientId === null ? "hidden lg:block" : "block"}`}>

                {selectedClient ? (
                  <motion.div
                    key={selectedClient.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm bg-white"
                  >
                    {/* Mobile back */}
                    <div className="lg:hidden p-4 border-b border-slate-100">
                      <Button variant="ghost" onClick={() => setSelectedClientId(null)}
                        className="rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 gap-2 h-9">
                        <ArrowLeft className="h-4 w-4" /> Back to list
                      </Button>
                    </div>

                    {/* Dark purple gradient top band */}
                    <div className="h-20 bg-gradient-to-r from-[#090514] via-purple-950 to-indigo-950 relative">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />
                    </div>

                    <div className="px-6 pb-6">
                      {/* Avatar overlapping band */}
                      <div className="relative -mt-11 mb-4 flex flex-col items-center text-center">
                        <div className="relative group">
                          <div className="absolute inset-[-2px] rounded-full border-2 border-white shadow-md" />
                          <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl text-white border-4 border-white shadow-lg"
                            style={{ background: "linear-gradient(135deg, #090514 0%, #1e0a36 100%)" }}>
                            {getInitials(selectedClient.name, selectedClient.username)}
                          </div>
                        </div>

                        <h2 className="text-xl font-bold text-slate-800 mt-3 tracking-tight">
                          {selectedClient.name || selectedClient.username}
                        </h2>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {selectedClient.status}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            Since {new Date(selectedClient.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                            <Shield className="h-3.5 w-3.5" /> ID #{selectedClient.id}
                          </span>
                        </div>

                        <p className="text-sm text-slate-400 mt-1">{selectedClient.email}</p>

                        {/* Quick actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="outline" size="icon" onClick={() => handleSendMessage(selectedClient)}
                            className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-purple-900 hover:border-purple-200 hover:bg-purple-50 bg-white"
                            title="Message">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteClient(selectedClient)}
                            disabled={deleteClientMutation.isPending}
                            className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 bg-white"
                            title="Remove client">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-100 mb-5" />

                      {/* Clinical Modules */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-900" />
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical Modules</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Select to launch</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        <ModuleCard icon={<Brain className="h-5 w-5 stroke-[1.75]" />}    code="M01" title="Thought Records"    description="Cognitive distortions & reframing" onClick={() => handleViewThoughtRecords(selectedClient)} />
                        <ModuleCard icon={<BookOpen className="h-5 w-5 stroke-[1.75]" />} code="M02" title="Journal Entries"    description="Self-reflections & session notes"  onClick={() => handleViewJournals(selectedClient)} />
                        <ModuleCard icon={<Heart className="h-5 w-5 stroke-[1.75]" />}   code="M03" title="Mood & Triggers"    description="Mood fluctuations & trigger events" onClick={() => handleViewRecords(selectedClient)} />
                        <ModuleCard icon={<Target className="h-5 w-5 stroke-[1.75]" />}  code="M04" title="Goals & Objectives" description="SMART objectives & milestones"     onClick={() => handleViewGoals(selectedClient)} />
                      </div>

                      {/* Footer actions */}
                      <div className="flex gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <Button variant="outline" onClick={() => handleViewProfile(selectedClient)}
                          className="flex-1 h-10 rounded-xl border-slate-200 text-slate-600 hover:text-slate-800 hover:border-purple-200 hover:bg-purple-50 font-semibold text-sm gap-2 bg-white transition-all">
                          <User className="h-4 w-4" /> View Profile
                        </Button>
                        <Button onClick={() => handleViewStats(selectedClient)}
                          className="flex-1 h-10 rounded-xl bg-[#090514] hover:bg-purple-950 text-white font-semibold text-sm gap-2 shadow-sm border-0 transition-all">
                          Open Analytics <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Empty state */
                  <div className="rounded-3xl border border-slate-100 bg-white p-10 flex flex-col items-center justify-center text-center min-h-[400px] shadow-sm">
                    <div className="p-5 bg-purple-50 rounded-2xl mb-5 border border-purple-100">
                      <Sparkles className="h-10 w-10 text-purple-900 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Clinical Workspace</h3>
                    <p className="text-sm text-slate-500 max-w-xs mb-8 leading-relaxed">
                      Select a client from the directory on the left to open their workspace and launch clinical modules.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm">
                      {[
                        { n: "1", title: "Load Client File", desc: "Select a profile to access their records and metadata." },
                        { n: "2", title: "Launch Modules",   desc: "Analyze cognitive records, journals, or progress reports." },
                      ].map(({ n, title, desc }) => (
                        <div key={n} className="text-left bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#090514] text-white text-xs font-bold flex items-center justify-center shrink-0">{n}</span>
                          <div>
                            <h5 className="text-xs font-semibold text-slate-700 mb-0.5">{title}</h5>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ PENDING CONNECTIONS ══ */}
          {activeTab === "invitations" && (
            <div>
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-900" /> Pending Connections
                  </h2>
                  <p className="text-sm text-slate-500">Invitations dispatched to clients awaiting registration.</p>
                </div>
                <Button onClick={() => setShowInviteDialog(true)}
                  className="shrink-0 h-10 px-5 bg-[#090514] hover:bg-purple-950 text-white rounded-xl font-semibold shadow-sm">
                  <UserPlus className="h-4 w-4 mr-2" /> Send Invite
                </Button>
              </div>

              {invitationsLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#090514]" />
                </div>
              ) : uniqueInvitations && uniqueInvitations.length > 0 ? (
                <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-500 pl-6 h-11 text-xs uppercase tracking-widest">Recipient</TableHead>
                        <TableHead className="font-semibold text-slate-500 h-11 text-xs uppercase tracking-widest">Email</TableHead>
                        <TableHead className="font-semibold text-slate-500 h-11 text-xs uppercase tracking-widest">Sent On</TableHead>
                        <TableHead className="font-semibold text-slate-500 h-11 text-xs text-right pr-6 uppercase tracking-widest">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueInvitations.map((invitation: any) => (
                        <TableRow key={invitation.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <TableCell className="font-semibold text-slate-700 pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#090514] flex items-center justify-center text-xs font-bold border border-indigo-200">
                                {(invitation.name || "?").slice(0, 2).toUpperCase()}
                              </div>
                              {invitation.name || "Anonymous"}
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
                              className="rounded-xl border-slate-200 text-slate-600 text-xs hover:border-purple-200 hover:bg-purple-50 hover:text-purple-900 h-8 gap-1.5 bg-white"
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
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No pending invitations</h3>
                  <p className="text-sm text-slate-400 mb-6 max-w-sm">
                    All connection requests have been completed. Invite new clients to expand your practice.
                  </p>
                  <Button onClick={() => setShowInviteDialog(true)}
                    className="bg-[#090514] hover:bg-purple-950 text-white rounded-xl shadow-sm">
                    <UserPlus className="h-4 w-4 mr-2" /> Send Secure Invite
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
