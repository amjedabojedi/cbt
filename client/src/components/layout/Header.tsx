import RoleIndicator from "./RoleIndicator";
import { useClientContext } from "@/context/ClientContext";
import NotificationBell from "@/components/layout/notification-bell";
import MobileNavigation from "@/components/MobileNavigation";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { viewingClientName } = useClientContext();

  const handleClientChange = (_clientId: number | null) => {};

  const displayTitle = viewingClientName
    ? `${viewingClientName}'s Dashboard`
    : title;

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-2 sm:px-4 py-3">
        <div className="flex items-center">
          <MobileNavigation className="mr-2" />
          <h2 className="text-lg font-medium truncate max-w-[180px] sm:max-w-xs md:max-w-full">
            {displayTitle}
          </h2>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          <div className="hidden sm:block">
            <RoleIndicator onClientChange={handleClientChange} />
          </div>
          <div className="relative">
            <NotificationBell />
          </div>
        </div>
      </div>

      {viewingClientName && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-1 text-sm text-center">
          You are viewing {viewingClientName}'s data in read-only mode
        </div>
      )}
    </header>
  );
}
