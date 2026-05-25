import { useAuth } from "@/lib/auth";
import RoleIndicator from "./RoleIndicator";
import { useClientContext } from "@/context/ClientContext";
import NotificationBell from "@/components/layout/notification-bell";
import MobileNavigation from "@/components/MobileNavigation";
import { useLocalization } from "@/lib/localize.tsx";

interface HeaderProps {
  title: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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

export default function Header({ title: _title }: HeaderProps) {
  const { viewingClientName } = useClientContext();
  const { user } = useAuth();
  const { t, isRTL } = useLocalization();

  const handleClientChange = (_clientId: number | null) => {};

  const firstName = user?.name?.split(" ")[0] || "there";
  const translatedName = t(firstName);
  const greeting = getGreeting();
  const translatedGreeting = t(greeting);
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="bg-white border-b border-slate-100">
      <div className="flex items-center justify-between px-3 sm:px-5 py-3">
        {/* Left: mobile menu + greeting */}
        <div className="flex items-center gap-3">
          <MobileNavigation className="md:hidden flex-shrink-0" />
          <div>
            <p className="text-sm sm:text-base font-semibold text-slate-800 leading-tight">
              {isRTL ? `${translatedGreeting}، ` : `${translatedGreeting}, `}
              <span className="text-[#090514]">{translatedName}</span>
            </p>
            <p className="text-[11px] text-slate-400 hidden sm:block">{dateStr}</p>
          </div>
        </div>

        {/* Right: role indicator + bell + avatar */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <RoleIndicator onClientChange={handleClientChange} />
          </div>
          <NotificationBell />
          {user && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ring-2 ring-purple-950/10"
              style={{ background: "linear-gradient(135deg, #090514 0%, #1e0a36 100%)" }}
              title={user.name}
            >
              {getInitials(user.name || "")}
            </div>
          )}
        </div>
      </div>

      {viewingClientName && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-1 text-sm text-center border-t border-yellow-200">
          {t("You are viewing {name}'s data in read-only mode").replace("{name}", viewingClientName)}
        </div>
      )}
    </header>
  );
}
