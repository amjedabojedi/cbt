import {
  Award, BarChart, BookMarked, BookOpen, Brain, Flag, Heart,
  LayoutDashboard, Lightbulb, MessageCircle, Users, type LucideIcon,
} from "lucide-react";

export interface PrimaryNavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  isReturn?: boolean;
}

/** Desktop and phone navigation must expose the same role/context destinations. */
export function getPrimaryNavigation(role?: string, viewingClient = false): PrimaryNavigationItem[] {
  if (role === "admin") return [
    { href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/engagement-settings", label: "Engagement Settings", icon: Heart },
    { href: "/admin/logs", label: "System Logs", icon: BookMarked },
    { href: "/admin/notifications", label: "Notifications", icon: MessageCircle },
    { href: "/subscriptions", label: "Subscription Plans", icon: Award },
    { href: "/emotion-mapping", label: "Emotion Mapping", icon: Heart },
    { href: "/library", label: "Resource Library", icon: BookOpen },
  ];
  if (role === "therapist") {
    if (viewingClient) return [
      { href: "/clients", label: "My Clients", icon: Users, isReturn: true },
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/emotions", label: "Emotions", icon: Heart },
      { href: "/thoughts", label: "Thought Records", icon: Brain },
      { href: "/reframe-coach", label: "Reframe Coach", icon: Lightbulb },
      { href: "/journal", label: "Journal", icon: BookMarked },
      { href: "/goals", label: "Smart Goals", icon: Flag },
      { href: "/reports", label: "Progress", icon: BarChart },
    ];
    return [
      { href: "/dashboard", label: "Therapist Dashboard", icon: LayoutDashboard },
      { href: "/clients", label: "My Clients", icon: Users },
      { href: "/library", label: "Resource Library", icon: BookOpen },
    ];
  }
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/emotions", label: "Emotion Tracking", icon: Heart },
    { href: "/thoughts", label: "Thought Records", icon: Brain },
    { href: "/reframe-coach", label: "Reframe Coach", icon: Lightbulb },
    { href: "/journal", label: "Journal", icon: BookMarked },
    { href: "/goals", label: "Smart Goals", icon: Flag },
    { href: "/library", label: "Resource Library", icon: BookOpen },
    { href: "/reports", label: "My Progress", icon: BarChart },
  ];
}

/** Shortcuts are a subset of the full menu, never an independent role policy. */
export function getBottomNavigation(role?: string, viewingClient = false): PrimaryNavigationItem[] {
  const shortcuts: Record<string, string> = role === "admin"
    ? { "/admin": "Admin", "/admin/users": "Users", "/admin/logs": "Logs",
        "/admin/notifications": "Notifications", "/library": "Library" }
    : role === "therapist"
      ? viewingClient
        ? { "/clients": "My Clients", "/dashboard": "Overview", "/emotions": "Emotions",
            "/thoughts": "Thoughts", "/reports": "Progress" }
        : { "/dashboard": "Dashboard", "/clients": "My Clients", "/library": "Library" }
      : { "/dashboard": "Home", "/emotions": "Emotions", "/thoughts": "Thoughts",
          "/journal": "Journal", "/reports": "Reports" };
  return getPrimaryNavigation(role, viewingClient)
    .filter(item => item.href in shortcuts)
    .map(item => ({ ...item, label: shortcuts[item.href] }));
}
