import { useAuth } from "@/lib/auth";
import { NotificationBell } from "../ui/notification-bell";

export default function Header() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <header className="h-16 border-b border-neutral-200 bg-white fixed top-0 right-0 z-10 md:left-64 left-0">
      <div className="h-full flex items-center justify-end px-6">
        <div className="flex items-center space-x-2">
          <NotificationBell />
          <div className="hidden md:block">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-neutral-500 capitalize">{user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}