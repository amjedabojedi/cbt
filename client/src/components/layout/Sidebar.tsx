import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

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
  BookMarked,
  Lightbulb,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const isClinicalUser = true; // unified dark-purple theme for all roles

  let navItems = [];

  if (user?.role === "admin") {
    navItems = [
      { href: "/admin", label: "Admin Dashboard", icon: <LayoutDashboard size={20} />, exact: true },
      { href: "/admin/users", label: "User Management", icon: <Users size={20} /> },
      { href: "/admin/engagement-settings", label: "Engagement Settings", icon: <Heart size={20} /> },
      { href: "/admin/logs", label: "System Logs", icon: <BookMarked size={20} /> },
      { href: "/admin/notifications", label: "Notifications", icon: <MessageCircle size={20} /> },
      { href: "/subscriptions", label: "Subscription Plans", icon: <Award size={20} /> },
      { href: "/emotion-mapping", label: "Emotion Mapping", icon: <Heart size={20} /> },
      { href: "/library", label: "Resource Library", icon: <BookOpen size={20} /> },
    ];
  } else if (user?.role === "therapist") {
    navItems = [
      { href: "/dashboard", label: "Therapist Dashboard", icon: <LayoutDashboard size={20} /> },
      { href: "/clients", label: "My Clients", icon: <Users size={20} /> },
      { href: "/library", label: "Resource Library", icon: <BookOpen size={20} /> },
    ];
  } else {
    navItems = [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
      { href: "/emotions", label: "Emotion Tracking", icon: <Heart size={20} /> },
      { href: "/thoughts", label: "Thought Records", icon: <Brain size={20} /> },
      { href: "/journal", label: "Journal", icon: <BookMarked size={20} /> },
      { href: "/goals", label: "SMART Goals", icon: <Flag size={20} /> },
      { href: "/reframe-coach", label: "Reframe Coach", icon: <Lightbulb size={20} /> },
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
          "shadow-md fixed md:relative inset-y-0 left-0 z-50",
          "transition-all duration-300 ease-in-out",
          "w-64",
          isCollapsed && "md:w-16",
          isClinicalUser
            ? "bg-[#090514] border-r border-purple-950/80 shadow-[4px_0_24px_rgba(124,58,237,0.06)]"
            : "bg-white border-r border-neutral-200",
          isMobileExpanded ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Collapse toggle — floats on the right edge, desktop only */}
        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "hidden md:flex absolute -right-3.5 top-5 z-20",
              "w-7 h-7 rounded-full items-center justify-center",
              "shadow-lg transition-all duration-200",
              "bg-white border-2 text-[#090514]",
              isClinicalUser
                ? "border-purple-300 hover:border-[#090514] hover:shadow-purple-200/60"
                : "border-slate-300 hover:border-slate-500"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
          </button>
        )}

        <div className="flex flex-col h-full overflow-hidden">

          {/* Logo */}
          <div className={cn(
            "border-b transition-all duration-300",
            isCollapsed ? "md:p-2" : "p-3 sm:p-4",
            "p-3 sm:p-4",
            isClinicalUser ? "border-purple-950/80" : "border-neutral-200"
          )}>
            <div className={cn(
              "flex items-center transition-all duration-300",
              isCollapsed ? "md:justify-center" : "space-x-2"
            )}>
              <div className={cn(
                "rounded flex items-center justify-center flex-shrink-0 transition-all",
                "w-8 h-8 sm:w-10 sm:h-10",
                isClinicalUser
                  ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                  : "bg-primary/20 text-primary"
              )}>
                <Brain size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className={cn(
                "transition-all duration-300 overflow-hidden",
                isCollapsed && "md:hidden"
              )}>
                <h1 className={cn(
                  "text-lg sm:text-xl font-black tracking-wide whitespace-nowrap",
                  isClinicalUser
                    ? "bg-gradient-to-r from-purple-300 via-indigo-200 to-purple-400 bg-clip-text text-transparent"
                    : "text-primary"
                )}>
                  ResilienceHub
                </h1>
                <span className="text-[9px] font-bold tracking-widest text-purple-400/90 uppercase block mt-0.5">
                  {user?.role === "admin" ? "Clinical Admin" : user?.role === "therapist" ? "Therapist Suite" : "Client Portal"}
                </span>
              </div>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className={cn(
            "border-b transition-all duration-300",
            isCollapsed ? "md:p-2" : "p-3 sm:p-4",
            "p-3 sm:p-4",
            isClinicalUser ? "border-purple-950/80 bg-purple-950/10" : "border-neutral-200"
          )}>
            <div className={cn(
              "flex items-center transition-all duration-300",
              isCollapsed && "md:justify-center"
            )}>
              <div className={cn(
                "rounded-full flex items-center justify-center font-bold flex-shrink-0 transition-all",
                isCollapsed ? "md:w-9 md:h-9 w-8 h-8 sm:w-10 sm:h-10" : "w-8 h-8 sm:w-10 sm:h-10",
                isClinicalUser
                  ? "bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/35 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                  : "bg-primary-light text-primary"
              )}>
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className={cn(
                "ml-2 sm:ml-3 min-w-0 transition-all duration-300",
                isCollapsed ? "md:hidden" : ""
              )}>
                <p className={cn(
                  "font-bold text-xs sm:text-sm truncate max-w-[130px]",
                  isClinicalUser ? "text-purple-100" : "text-neutral-900"
                )}>
                  {user?.name}
                </p>
                <p className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  isClinicalUser ? "text-purple-400" : "text-neutral-500 capitalize"
                )}>
                  {user?.role === "therapist" ? "Clinical Therapist" : user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-grow py-2 sm:py-4 overflow-y-auto">
            <ul>
              {navItems.map((item, index) => item && (
                <li key={index} className={cn(
                  "py-1 sm:py-1.5 transition-all duration-300",
                  isCollapsed ? "md:px-1 px-2 sm:px-4" : "px-2 sm:px-4"
                )}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-1.5 rounded-md transition-colors text-sm",
                      isCollapsed && "md:justify-center md:px-0",
                      (() => {
                        if (item.exact) {
                          return location === item.href;
                        } else {
                          return location === item.href || location.startsWith(item.href + '/');
                        }
                      })()
                        ? isClinicalUser
                          ? "text-purple-200 font-bold bg-gradient-to-r from-purple-900/40 to-indigo-950/20 border-l-[3px] border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.12)]"
                          : "text-primary font-medium bg-primary/10"
                        : isClinicalUser
                          ? "text-purple-300/70 hover:text-purple-200 hover:bg-purple-950/20"
                          : "text-neutral-600 hover:text-primary hover:bg-primary/5"
                    )}
                    onClick={() => setIsMobileExpanded(false)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={cn(
                      "flex-shrink-0 transition-all duration-300",
                      isCollapsed ? "md:mr-0 mr-2 sm:mr-3" : "mr-2 sm:mr-3"
                    )}>
                      {item.icon}
                    </span>
                    <span className={cn(
                      "truncate transition-all duration-300",
                      isCollapsed && "md:hidden"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Settings & Logout */}
          <div className={cn(
            "border-t transition-all duration-300",
            isCollapsed ? "md:p-1 p-2 sm:p-4" : "p-2 sm:p-4",
            isClinicalUser ? "border-purple-950/80 bg-purple-950/5" : "border-neutral-200"
          )}>
            <ul>
              <li className={cn(
                "py-1 sm:py-2 transition-all duration-300",
                isCollapsed ? "md:px-1 px-2" : "px-2"
              )}>
                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center px-2 py-1.5 rounded-md transition-colors text-sm",
                    isCollapsed && "md:justify-center md:px-0",
                    location === "/settings"
                      ? isClinicalUser
                        ? "text-purple-200 font-bold bg-gradient-to-r from-purple-900/40 to-indigo-950/20 border-l-[3px] border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.12)]"
                        : "text-primary font-medium bg-primary/10"
                      : isClinicalUser
                        ? "text-purple-300/70 hover:text-purple-200 hover:bg-purple-950/20"
                        : "text-neutral-600 hover:text-primary hover:bg-primary/5"
                  )}
                  onClick={() => setIsMobileExpanded(false)}
                  title={isCollapsed ? "Settings" : undefined}
                >
                  <Settings
                    size={18}
                    className={cn(
                      "flex-shrink-0 transition-all duration-300",
                      isCollapsed ? "md:mr-0 mr-2 sm:mr-3" : "mr-2 sm:mr-3",
                      isClinicalUser && "text-purple-400"
                    )}
                  />
                  <span className={cn("truncate", isCollapsed && "md:hidden")}>Settings</span>
                </Link>
              </li>
              <li className={cn(
                "py-1 sm:py-2 transition-all duration-300",
                isCollapsed ? "md:px-1 px-2" : "px-2"
              )}>
                <button
                  onClick={() => {
                    setIsMobileExpanded(false);
                    logout();
                  }}
                  className={cn(
                    "flex items-center px-2 py-1.5 rounded-md transition-colors w-full text-left text-sm",
                    isCollapsed && "md:justify-center md:px-0",
                    isClinicalUser
                      ? "text-rose-400 hover:text-rose-300 hover:bg-rose-950/15"
                      : "text-neutral-600 hover:text-primary hover:bg-primary/5"
                  )}
                  title={isCollapsed ? "Logout" : undefined}
                >
                  <LogOut
                    size={18}
                    className={cn(
                      "flex-shrink-0 transition-all duration-300",
                      isCollapsed ? "md:mr-0 mr-2 sm:mr-3" : "mr-2 sm:mr-3",
                      isClinicalUser && "text-rose-400"
                    )}
                  />
                  <span className={cn("truncate", isCollapsed && "md:hidden")}>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        className="fixed bottom-20 right-4 md:hidden bg-gradient-to-tr from-purple-600 to-indigo-600 text-white p-3 rounded-full shadow-lg z-50"
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        aria-label={isMobileExpanded ? "Close menu" : "Open menu"}
      >
        {isMobileExpanded ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        )}
      </button>
    </>
  );
}
