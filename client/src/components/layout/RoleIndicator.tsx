import { useAuth } from "@/lib/auth";
import { useClientContext } from "@/context/ClientContext";

interface ClientSelectorProps {
  onClientChange?: (clientId: number | null) => void;
}

export default function RoleIndicator({ onClientChange: _onClientChange }: ClientSelectorProps) {
  const { user } = useAuth();
  const { viewingClientId, viewingClientName } = useClientContext();

  if (!user) return null;

  if (user.role === "client") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        Client
      </span>
    );
  }

  if (user.role === "admin") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-slate-800 border border-teal-200">
        Administrator
      </span>
    );
  }

  if (user.role === "therapist" && viewingClientId && viewingClientName) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Viewing Client
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
          <span
            className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)" }}
          >
            {(viewingClientName || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
          </span>
          <span className="truncate max-w-[110px]">{viewingClientName}</span>
        </span>
      </div>
    );
  }

  if (user.role === "therapist") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-slate-800 border border-teal-200">
        Therapist
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
      {user.role || "User"}
    </span>
  );
}
