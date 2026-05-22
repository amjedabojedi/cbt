import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Users, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useClientContext } from "@/context/ClientContext";

interface Client {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  therapistId: number | null;
}

interface ClientSelectorProps {
  onClientChange?: (clientId: number | null) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RoleIndicator({ onClientChange }: ClientSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { viewingClientId, viewingClientName, setViewingClient } = useClientContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "therapist") {
      const fetchCurrentViewingClient = async () => {
        try {
          const response = await fetch(`/api/users/viewing-client-fixed`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          const data = await response.json();
          if (data.viewingClient) {
            setViewingClient(data.viewingClient.id, data.viewingClient.name);
          } else {
            const storedId = localStorage.getItem("viewingClientId");
            const storedName = localStorage.getItem("viewingClientName");
            if (storedId && storedName) {
              const parsed = parseInt(storedId);
              if (!isNaN(parsed)) setViewingClient(parsed, storedName);
            }
          }
        } catch {
          const storedId = localStorage.getItem("viewingClientId");
          const storedName = localStorage.getItem("viewingClientName");
          if (storedId && storedName) {
            const parsed = parseInt(storedId);
            if (!isNaN(parsed)) setViewingClient(parsed, storedName);
          }
        }
      };
      fetchCurrentViewingClient();
    }
  }, [user, setViewingClient]);

  useEffect(() => {
    if (user?.role === "therapist" || user?.role === "admin") {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          const endpoint = user.role === "admin" ? "/api/users" : "/api/users/clients";
          const response = await apiRequest("GET", endpoint);
          const data = await response.json();
          setClients(data);
        } catch {
          toast({
            title: "Error",
            description: `Failed to load ${user.role === "admin" ? "users" : "clients"} list`,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [user, toast]);

  const handleClientSelect = async (clientId: number, clientName: string) => {
    try {
      await apiRequest("POST", "/api/users/current-viewing-client", { clientId });
      setViewingClient(clientId, clientName);
      if (onClientChange) onClientChange(clientId);
      toast({ title: "Client Selected", description: `You are now viewing ${clientName}'s data` });
      window.location.reload();
    } catch {
      toast({ title: "Error", description: "Failed to select client", variant: "destructive" });
    }
  };

  const handleReturnToSelf = async () => {
    try {
      await apiRequest("POST", "/api/users/current-viewing-client", { clientId: null });
      localStorage.removeItem("viewingClientId");
      localStorage.removeItem("viewingClientName");
      setViewingClient(null, null);
      if (onClientChange) onClientChange(null);
      toast({ title: "Returned to Self", description: "You are now viewing your own dashboard" });
      window.location.reload();
    } catch {
      toast({ title: "Error", description: "Failed to return to your dashboard", variant: "destructive" });
    }
  };

  if (!user) return null;

  // Client role
  if (user.role === "client") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        Client
      </span>
    );
  }

  // Admin role
  if (user.role === "admin") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-[#090514] border border-purple-200">
        Administrator
      </span>
    );
  }

  // Therapist — viewing a client
  if (user.role === "therapist" && viewingClientId) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Viewing Client
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-[#090514] hover:text-[#090514] transition-colors shadow-sm outline-none">
              <span
                className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #090514 0%, #1e0a36 100%)" }}
              >
                {getInitials(viewingClientName || "")}
              </span>
              <span className="truncate max-w-[110px]">{viewingClientName}</span>
              <ChevronDown size={12} className="text-slate-400 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[230px] p-1.5 rounded-2xl shadow-xl border border-slate-100">
            {/* Active client header */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-xl bg-slate-50 border border-slate-100">
              <span
                className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #090514 0%, #1e0a36 100%)" }}
              >
                {getInitials(viewingClientName || "")}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium">Active client</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{viewingClientName}</p>
              </div>
            </div>

            <DropdownMenuItem
              onClick={handleReturnToSelf}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <span className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                ←
              </span>
              Return to my dashboard
            </DropdownMenuItem>

            {clients.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 mt-1 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Client</p>
                </div>
                {clients.map((client) => (
                  <DropdownMenuItem
                    key={client.id}
                    onClick={() => handleClientSelect(client.id, client.name)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-[#090514]/5 cursor-pointer"
                  >
                    <span className="w-7 h-7 rounded-full bg-purple-50 border border-purple-200 text-[#090514] text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {getInitials(client.name)}
                    </span>
                    <span className="text-slate-700 font-medium">{client.name}</span>
                    {client.id === viewingClientId && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#090514]" />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Therapist — no client selected
  if (user.role === "therapist") {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-[#090514] border border-purple-200">
          Therapist
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-[#090514] hover:text-[#090514] transition-colors shadow-sm outline-none">
              <Users size={14} className="text-slate-400 flex-shrink-0" />
              <span>My Clients</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[230px] p-1.5 rounded-2xl shadow-xl border border-slate-100">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 mb-0.5">
              <div className="w-6 h-6 rounded-lg bg-[#090514]/8 flex items-center justify-center">
                <Users size={12} className="text-[#090514]" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">View Client Data</p>
            </div>
            <div className="h-px bg-slate-100 mx-1 mb-1" />

            {loading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin h-4 w-4 border-2 border-[#090514] border-t-transparent rounded-full" />
              </div>
            ) : clients.length > 0 ? (
              clients.map((client) => (
                <DropdownMenuItem
                  key={client.id}
                  onClick={() => handleClientSelect(client.id, client.name)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-[#090514]/5 cursor-pointer mx-0.5"
                >
                  <span className="w-7 h-7 rounded-full bg-purple-50 border border-purple-200 text-[#090514] text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {getInitials(client.name)}
                  </span>
                  <span className="text-slate-700 font-medium">{client.name}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-3 py-5 text-center">
                <Users size={20} className="mx-auto text-slate-300 mb-1.5" />
                <p className="text-sm text-slate-400">No clients found</p>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
      {user.role || "User"}
    </span>
  );
}
