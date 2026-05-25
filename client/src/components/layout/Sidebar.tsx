import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/localize";

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
  Globe,
} from "lucide-react";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

export default function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const { currentLanguage, setLanguage, t, isRTL } = useLocalization();

  const isClinicalUser = true; // unified dark-purple theme for all roles

  let navItems: NavItem[] = [];

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

  // Adjust arrows in RTL direction
  const showLeftArrow = isRTL ? isCollapsed : !isCollapsed;

  // Modern, clean, and robust logical margin adjustments
  const iconMarginClass = isCollapsed
    ? cn(
      "flex-shrink-0 transition-all duration-300",
      isRTL ? "ml-2 sm:ml-3 md:ml-0" : "mr-2 sm:mr-3 md:mr-0"
    )
    : cn(
      "flex-shrink-0 transition-all duration-300",
      isRTL ? "ml-2 sm:ml-3" : "mr-2 sm:mr-3"
    );

  const settingsIconMarginClass = cn(
    "flex-shrink-0 transition-all duration-300",
    isCollapsed
      ? isRTL ? "ml-2 sm:ml-3 md:ml-0" : "mr-2 sm:mr-3 md:mr-0"
      : isRTL ? "ml-2 sm:ml-3" : "mr-2 sm:mr-3",
    isClinicalUser && "text-teal-300"
  );

  const profileTextMarginClass = cn(
    "min-w-0 transition-all duration-300",
    isCollapsed ? "md:hidden" : "",
    isRTL ? "mr-2 sm:mr-3" : "ml-2 sm:ml-3"
  );

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
          "shadow-md fixed md:relative inset-y-0 z-50",
          "transition-all duration-300 ease-in-out",
          "w-64",
          isCollapsed && "md:w-16",
          isClinicalUser ? "bg-teal-800 border-teal-800/80" : "bg-white border-neutral-200",

          // Deterministic positioning and borders
          isRTL
            ? "right-0 border-l shadow-md"
            : "left-0 border-r shadow-md",

          // Deterministic mobile hiding/showing translate
          isMobileExpanded
            ? "translate-x-0"
            : isRTL
              ? "translate-x-full md:translate-x-0" // Hide off-screen to the right in RTL
              : "-translate-x-full md:translate-x-0" // Hide off-screen to the left in LTR
        )}
      >
        {/* Collapse toggle — floats on the edge, desktop only */}
        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "hidden md:flex absolute top-5 z-20",
              "w-7 h-7 rounded-full items-center justify-center",
              "shadow-lg transition-all duration-200",
              "bg-white border-2 text-slate-800",
              isClinicalUser
                ? "border-teal-300 hover:border-teal-700 hover:shadow-teal-200/60"
                : "border-slate-300 hover:border-slate-500",

              // Dynamic toggle placement
              isRTL ? "-left-3.5" : "-right-3.5"
            )}
            title={isCollapsed ? t("Expand sidebar") : t("Collapse sidebar")}
          >
            {showLeftArrow ? <ChevronLeft size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
          </button>
        )}

        <div className="flex flex-col h-full overflow-hidden">

          {/* Logo */}
          <div className={cn(
            "border-b transition-all duration-300",
            isCollapsed ? "md:p-2" : "p-3 sm:p-4",
            "p-3 sm:p-4",
            isClinicalUser ? "border-teal-800/80" : "border-neutral-200"
          )}>
            <div className={cn(
              "flex items-center transition-all duration-300",
              isCollapsed ? "md:justify-center" : "gap-2 sm:gap-3"
            )}>
              <div className={cn(
                "rounded flex items-center justify-center flex-shrink-0 transition-all",
                "w-8 h-8 sm:w-10 sm:h-10",
                isClinicalUser
                  ? "bg-white/15 text-white"
                  : "bg-primary/20 text-primary"
              )}>
                <Brain size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className={cn(
                "transition-all duration-300 overflow-hidden",
                isCollapsed && "md:hidden"
              )}>
                <h1 className={cn(
                  "text-lg sm:text-xl font-bold tracking-wide whitespace-nowrap",
                  isClinicalUser ? "text-white" : "text-primary"
                )}>
                  ResilienceHub
                </h1>
                <span className="text-[9px] font-semibold tracking-widest text-white/50 uppercase block mt-0.5">
                  {user?.role === "admin" ? t("Clinical Admin") : user?.role === "therapist" ? t("Therapist Suite") : t("Client Portal")}
                </span>
              </div>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className={cn(
            "border-b transition-all duration-300",
            isCollapsed ? "md:p-2" : "p-3 sm:p-4",
            "p-3 sm:p-4",
            isClinicalUser ? "border-teal-800/80 bg-teal-800/10" : "border-neutral-200"
          )}>
            <div className={cn(
              "flex items-center transition-all duration-300",
              isCollapsed && "md:justify-center"
            )}>
              <div className={cn(
                "rounded-full flex items-center justify-center font-bold flex-shrink-0 transition-all",
                isCollapsed ? "md:w-9 md:h-9 w-8 h-8 sm:w-10 sm:h-10" : "w-8 h-8 sm:w-10 sm:h-10",
                isClinicalUser
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-primary-light text-primary"
              )}>
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className={profileTextMarginClass}>
                <p className={cn(
                  "font-semibold text-xs sm:text-sm truncate max-w-[130px]",
                  isClinicalUser ? "text-white" : "text-neutral-900"
                )}>
                  {user?.name}
                </p>
                <p className={cn(
                  "text-[10px] font-medium uppercase tracking-wider",
                  isClinicalUser ? "text-white/50" : "text-neutral-500 capitalize"
                )}>
                  {user?.role === "therapist" ? t("Therapist Suite") : t(user?.role || "")}
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
                          ? "text-white font-semibold bg-white/10 rounded-md"
                          : "text-primary font-medium bg-primary/10"
                        : isClinicalUser
                          ? "text-white/75 hover:text-white hover:bg-white/8"
                          : "text-neutral-600 hover:text-primary hover:bg-primary/5"
                    )}
                    onClick={() => setIsMobileExpanded(false)}
                    title={isCollapsed ? t(item.label) : undefined}
                  >
                    <span className={iconMarginClass}>
                      {item.icon}
                    </span>
                    <span className={cn(
                      "truncate transition-all duration-300",
                      isCollapsed && "md:hidden"
                    )}>
                      {t(item.label)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={cn(
            "border-t transition-all duration-300",
            isCollapsed ? "md:p-1 p-2 sm:p-4" : "p-2 sm:p-4",
            isClinicalUser ? "border-teal-800/80 bg-teal-800/5" : "border-neutral-200"
          )}>
            {/* Language Switcher Component */}
            <div className={cn(
              "mb-2 border-b pb-2 transition-all duration-300",
              isCollapsed ? "md:px-0" : "px-2",
              isClinicalUser ? "border-teal-800/40" : "border-neutral-200"
            )}>
              {isCollapsed ? (
                /* Collapsed state: Beautiful Globe icon that toggles on click */
                <button
                  onClick={() => setLanguage(currentLanguage === "en" ? "ar" : "en")}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 mx-auto rounded-md transition-all duration-300",
                    isClinicalUser
                      ? "bg-teal-800/30 text-teal-300 hover:text-teal-200 hover:bg-teal-900/40 border border-teal-700/20 hover:border-teal-500/30 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                      : "bg-neutral-100 text-neutral-600 hover:text-primary hover:bg-primary/10 border border-neutral-200"
                  )}
                  title={currentLanguage === "en" ? t("Switch to Arabic") : t("Switch to English")}
                >
                  <Globe size={18} className="animate-[spin_4s_linear_infinite]" />
                  <span className="sr-only">Toggle Language</span>
                </button>
              ) : (
                /* Expanded state: Sleek and modern segmented pill toggle */
                <div className="flex flex-col space-y-1">
                  <span className={cn(
                    "text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5",
                    isClinicalUser ? "text-teal-300/90" : "text-neutral-500"
                  )}>
                    <Globe size={12} className="animate-[spin_6s_linear_infinite]" />
                    {t("Language")}
                  </span>
                  <div className={cn(
                    "flex p-0.5 rounded-lg border transition-all duration-300",
                    isClinicalUser
                      ? "bg-teal-800/40 border-teal-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                      : "bg-neutral-100 border-neutral-200"
                  )}>
                    <button
                      // onClick={() => setLanguage("en")}
                      className={cn(
                        "flex-1 text-xs py-1 px-2 rounded-md font-bold transition-all duration-300 text-center",
                        currentLanguage === "en"
                          ? isClinicalUser
                            ? "bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-[0_2px_8px_rgba(20,184,166,0.4)]"
                            : "bg-white text-primary shadow-sm"
                          : isClinicalUser
                            ? "text-teal-300/80 hover:text-teal-200 hover:bg-teal-900/20"
                            : "text-neutral-600 hover:text-neutral-900"
                      )}
                    >
                      English
                    </button>
                    <button
                      // onClick={() => setLanguage("ar")}
                      onClick={() => alert("The Arabic Translated version of the app is coming soon")}
                      className={cn(
                        "flex-1 text-xs py-1 px-2 rounded-md font-bold transition-all duration-300 text-center font-noto-arabic",
                        currentLanguage === "ar"
                          ? isClinicalUser
                            ? "bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-[0_2px_8px_rgba(20,184,166,0.4)]"
                            : "bg-white text-primary shadow-sm"
                          : isClinicalUser
                            ? "text-teal-300/80 hover:text-teal-200 hover:bg-teal-900/20"
                            : "text-neutral-600 hover:text-neutral-900"
                      )}
                    >
                      العربية
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                        ? "text-white font-semibold bg-white/10 rounded-md"
                        : "text-primary font-medium bg-primary/10"
                      : isClinicalUser
                        ? "text-white/75 hover:text-white hover:bg-white/8"
                        : "text-neutral-600 hover:text-primary hover:bg-primary/5"
                  )}
                  onClick={() => setIsMobileExpanded(false)}
                  title={isCollapsed ? t("Settings") : undefined}
                >
                  <Settings
                    size={18}
                    className={settingsIconMarginClass}
                  />
                  <span className={cn("truncate", isCollapsed && "md:hidden")}>{t("Settings")}</span>
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
                  title={isCollapsed ? t("Logout") : undefined}
                >
                  <LogOut
                    size={18}
                    className={cn(
                      "flex-shrink-0 transition-all duration-300",
                      isCollapsed
                        ? isRTL ? "ml-2 sm:ml-3 md:ml-0" : "mr-2 sm:mr-3 md:mr-0"
                        : isRTL ? "ml-2 sm:ml-3" : "mr-2 sm:mr-3",
                      isClinicalUser && "text-rose-400"
                    )}
                  />
                  <span className={cn("truncate", isCollapsed && "md:hidden")}>{t("Logout")}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        className={cn(
          "fixed bottom-20 md:hidden bg-gradient-to-tr from-teal-700 to-teal-600 text-white p-3 rounded-full shadow-lg z-50 animate-bounce",
          isRTL ? "left-4" : "right-4"
        )}
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
