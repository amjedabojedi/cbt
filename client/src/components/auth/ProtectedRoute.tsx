import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  allowedRoles?: string[];
}

export function ProtectedRoute({ 
  path, 
  component: Component, 
  allowedRoles = [] 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Function to render content based on auth state
  const renderContent = () => {
    // If still loading, show spinner
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    // If not authenticated, redirect to landing page
    if (!user) {
      // Use setTimeout to avoid immediate redirect which can cause React rendering issues
      setTimeout(() => navigate("/auth"), 0);
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      );
    }

    // If roles specified and user doesn't have the required role
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      setTimeout(() => navigate("/dashboard"), 0);
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-sm text-muted-foreground">Unauthorized. Redirecting...</p>
        </div>
      );
    }

    // If authenticated and authorized, render the component
    return <Component />;
  };

  return (
    <Route path={path}>
      {renderContent()}
    </Route>
  );
}