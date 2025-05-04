import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

// Icons for navigation items
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  Brain, 
  Flag, 
  BookOpen,
  BarChart,
  Settings,
  LogOut,
  Award,
  BookMarked
} from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  
  // Define navigation items based on user role
  let navItems = [];
  
  // Admin navigation
  if (user?.role === "admin") {
    navItems = [
      { href: "/", label: "Admin Dashboard", icon: <LayoutDashboard size={20} /> },
      { href: "/users", label: "Therapist Management", icon: <Users size={20} /> },
      { href: "/subscriptions", label: "Subscription Plans", icon: <Award size={20} /> },
      { href: "/emotion-mapping", label: "Emotion Mapping", icon: <Heart size={20} /> },
      { href: "/library", label: "Resource Library", icon: <BookOpen size={20} /> },
    ];
  } 
  // Therapist navigation
  else if (user?.role === "therapist") {
    navItems = [
      { href: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
      { href: "/clients", label: "My Clients", icon: <Users size={20} /> },
      { href: "/journal", label: "Client Journals", icon: <BookMarked size={20} /> },
      { href: "/reports", label: "Client Reports", icon: <BarChart size={20} /> },
      { href: "/library", label: "Resource Library", icon: <BookOpen size={20} /> },
    ];
  }
  // Client navigation
  else {
    navItems = [
      { href: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
      { href: "/emotions", label: "Emotion Tracking", icon: <Heart size={20} /> },
      { href: "/thoughts", label: "Thought Records", icon: <Brain size={20} /> },
      { href: "/journal", label: "Journal", icon: <BookMarked size={20} /> },
      { href: "/goals", label: "SMART Goals", icon: <Flag size={20} /> },
      { href: "/library", label: "Resource Library", icon: <BookOpen size={20} /> },
      { href: "/reports", label: "My Progress", icon: <BarChart size={20} /> },
    ];
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileExpanded(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "w-64 bg-white shadow-md md:relative fixed inset-y-0 left-0 z-50 transition-transform transform duration-300 ease-in-out",
          isMobileExpanded ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center text-primary">
                <Brain size={24} />
              </div>
              <h1 className="text-xl font-bold text-primary">New Horizon-CBT</h1>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="ml-3">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-grow py-4 overflow-y-auto">
            <ul>
              {navItems.map((item, index) => item && (
                <li key={index} className="px-4 py-2">
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-1.5 rounded-md transition-colors",
                      location === item.href 
                        ? "text-primary font-medium bg-primary/10" 
                        : "text-neutral-600 hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Settings & Logout */}
          <div className="p-4 border-t border-neutral-200">
            <ul>
              <li className="px-2 py-2">
                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center px-2 py-1.5 rounded-md transition-colors",
                    location === "/settings"
                      ? "text-primary font-medium bg-primary/10"
                      : "text-neutral-600 hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <Settings size={20} className="mr-3" />
                  Settings
                </Link>
              </li>
              <li className="px-2 py-2">
                <button
                  onClick={logout}
                  className="flex items-center px-2 py-1.5 rounded-md transition-colors text-neutral-600 hover:text-primary hover:bg-primary/5 w-full text-left"
                >
                  <LogOut size={20} className="mr-3" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </aside>
      
      {/* Mobile toggle button (in Header component) */}
      <button
        className="fixed bottom-4 right-4 md:hidden bg-primary text-white p-3 rounded-full shadow-lg z-50"
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
      >
        {isMobileExpanded ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
            <line x1="4" x2="20" y1="12" y2="12"/>
            <line x1="4" x2="20" y1="6" y2="6"/>
            <line x1="4" x2="20" y1="18" y2="18"/>
          </svg>
        )}
      </button>
    </>
  );
}
