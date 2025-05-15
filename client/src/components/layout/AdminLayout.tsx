import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  Users, Settings, LayoutDashboard, 
  ClipboardList, BarChart3 
} from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Only admin users should access this layout
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You don't have permission to access this page.</p>
          <Link href="/">
            <a className="text-primary hover:underline">Return to Home</a>
          </Link>
        </div>
      </div>
    );
  }
  
  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/admin",
      active: location === "/admin"
    },
    {
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users",
      active: location === "/admin/users"
    },
    {
      title: "Reframe Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/admin/reframe-analytics",
      active: location === "/admin/reframe-analytics"
    },
    {
      title: "Resources",
      icon: <ClipboardList className="h-5 w-5" />,
      href: "/admin/resources",
      active: location === "/admin/resources"
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/admin/settings",
      active: location === "/admin/settings"
    }
  ];
  
  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Admin Sidebar */}
      <div className="w-64 bg-card shadow-md hidden md:block">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Admin Portal</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <a className={`flex items-center p-2 rounded-md transition-colors ${
                    item.active 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  }`}>
                    {item.icon}
                    <span className="ml-3">{item.title}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-background border-b z-10 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Portal</h1>
          <div>
            {/* Mobile menu button would go here */}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 md:ml-0 pt-16 md:pt-0">
        {children}
      </div>
    </div>
  );
}