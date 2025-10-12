import { useState } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import RoleIndicator from "./RoleIndicator";
import { useClientContext } from "@/context/ClientContext";
import NotificationBell from "@/components/ui/notification-bell";
import MobileNavigation from "@/components/MobileNavigation";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const { setViewingClient, viewingClientName } = useClientContext();

  const handleClientChange = (clientId: number | null) => {
    // This function is passed to RoleIndicator, but the component
    // now handles setting the view using the context directly.
    // It remains here for potential future functionality.
  };

  // Show appropriate title based on context
  const displayTitle = viewingClientName 
    ? `${viewingClientName}'s Dashboard` 
    : title;

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-2 sm:px-4 py-3">
        <div className="flex items-center">
          <MobileNavigation className="mr-2" />
          <h2 className="text-lg font-medium truncate max-w-[180px] sm:max-w-xs md:max-w-full">{displayTitle}</h2>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          {/* Role Indicator & Client Selector - Hide on smallest screens */}
          <div className="hidden sm:block">
            <RoleIndicator onClientChange={handleClientChange} />
          </div>

          {/* Notifications */}
          <div className="relative">
            <NotificationBell />
          </div>

          {/* Language Toggle - Hide on smallest screens */}
          <div className="hidden sm:block">
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-500 hover:text-primary focus:outline-none"
              onClick={() => setIsLanguageModalOpen(!isLanguageModalOpen)}
            >
              <Globe size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Language Modal */}
      {isLanguageModalOpen && (
        <div className="absolute top-16 right-4 z-50 bg-white shadow-lg rounded-lg p-4 border border-neutral-200 w-48">
          <div className="space-y-2">
            <button className={cn("w-full text-left py-2 px-3 rounded-md", "bg-primary/10 text-primary")}>
              English
            </button>
            <button className="w-full text-left py-2 px-3 rounded-md hover:bg-neutral-100">
              العربية (Arabic)
            </button>
            <button className="w-full text-left py-2 px-3 rounded-md hover:bg-neutral-100">
              Español (Spanish)
            </button>
            <button className="w-full text-left py-2 px-3 rounded-md hover:bg-neutral-100">
              Français (French)
            </button>
          </div>
        </div>
      )}
      
      {/* Context Banner - shown when viewing client data */}
      {viewingClientName && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-1 text-sm text-center">
          You are viewing {viewingClientName}'s data in read-only mode
        </div>
      )}
    </header>
  );
}
