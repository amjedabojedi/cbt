import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Users, 
  Settings, 
  Shield, 
  FileText, 
  BarChart2, 
  Book, 
  MessageSquare,
  Brain
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const [currentPath] = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If the user is not an admin, show access denied
  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Shield className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4 text-center">
          You don't have permission to access the admin section.
        </p>
        <Button asChild>
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", icon: <BarChart2 className="h-5 w-5" />, label: "Dashboard" },
    { href: "/admin/users", icon: <Users className="h-5 w-5" />, label: "User Management" },
    { href: "/admin/resources", icon: <Book className="h-5 w-5" />, label: "Resources" },
    { href: "/admin/reframe-analytics", icon: <Brain className="h-5 w-5" />, label: "Reframe Analytics" },
    { href: "/admin/logs", icon: <FileText className="h-5 w-5" />, label: "Logs" },
    { href: "/admin/notifications", icon: <MessageSquare className="h-5 w-5" />, label: "Notifications" },
    { href: "/admin/settings", icon: <Settings className="h-5 w-5" />, label: "Settings" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-muted/30 border-r border-border hidden md:block overflow-y-auto">
        <div className="p-4 border-b border-border">
          <Link href="/admin">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
          </Link>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <div
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="bg-background border-b border-border p-4 md:hidden">
          <div className="flex justify-between items-center">
            <Link href="/admin">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Admin Panel</span>
              </div>
            </Link>
            <Button variant="outline" size="sm">
              Menu
            </Button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}