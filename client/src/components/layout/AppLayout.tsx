import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title = "Dashboard" }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const [location, navigate] = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user && !location.startsWith("/login") && !location.startsWith("/register")) {
      navigate("/login");
    }
  }, [user, loading, location, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not logged in, only render children (should be login/register page)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary">New Horizon-CBT</h1>
            <p className="mt-2 text-gray-600">Navigate Your Thoughts to Clarity</p>
          </div>
          {children}
        </div>
      </div>
    );
  }

  // Regular app layout with sidebar for authenticated users
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* Improved mobile responsiveness with dynamic spacing */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-2 border-l border-gray-200">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto bg-neutral-50 px-2 sm:px-4 pb-16 md:pb-4">
          {children}
        </main>
      </div>
    </div>
  );
}
