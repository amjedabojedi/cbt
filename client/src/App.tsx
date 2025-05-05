import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Suspense, lazy, useEffect } from "react";
import NotFound from "@/pages/not-found";
import { ClientProvider } from "@/context/ClientContext";
import { ThemeProvider } from "next-themes";
import Layout from "@/components/layout/Layout";

// Lazy load pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const EmotionTracking = lazy(() => import("@/pages/EmotionTracking"));
const EmotionMapping = lazy(() => import("@/pages/EmotionMapping"));
const ThoughtRecords = lazy(() => import("@/pages/ThoughtRecords"));
const GoalSetting = lazy(() => import("@/pages/GoalSetting"));
const ResourceLibrary = lazy(() => import("@/pages/ResourceLibrary"));
const Journal = lazy(() => import("@/pages/Journal"));
const Reports = lazy(() => import("@/pages/Reports"));
const Clients = lazy(() => import("@/pages/Clients"));
const Settings = lazy(() => import("@/pages/Settings"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const SubscriptionManagement = lazy(() => import("@/pages/SubscriptionManagement"));

// Import the ProtectedRoute component
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

// Role-based dashboard component selector
const RoleDashboard = () => {
  const { user } = useAuth();
  
  if (user?.role === "admin") {
    return <AdminDashboard />;
  }
  
  return <Dashboard />;
};

function Router() {
  const { user, loading } = useAuth();

  // If auth is still loading, show a loading indicator
  if (loading) {
    return <LoadingFallback />;
  }

  // Simple redirect component
  const RedirectTo = ({ to }: { to: string }) => {
    useEffect(() => {
      window.location.href = to;
    }, [to]);
    return <LoadingFallback />;
  };
  
  // Go back to using the ProtectedRoute component for simplicity and consistency
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Public routes - already logged in users go to dashboard */}
        <Route path="/login">
          {user ? <RedirectTo to="/dashboard" /> : <Login />}
        </Route>
        <Route path="/register">
          {user ? <RedirectTo to="/dashboard" /> : <Register />}
        </Route>
        
        {/* Root route - redirect to login or show dashboard */}
        <Route path="/">
          {!user ? <RedirectTo to="/login" /> : (
            <Layout>
              <RoleDashboard />
            </Layout>
          )}
        </Route>
        
        {/* All other protected routes */}
        <Route path="/:rest*">
          {!user ? <RedirectTo to="/login" /> : (
            <Layout>
              <Switch>
                <Route path="/dashboard" component={RoleDashboard} />
                <Route path="/emotion-tracking" component={EmotionTracking} />
                <Route path="/emotions" component={EmotionTracking} />
                <Route path="/thoughts" component={ThoughtRecords} />
                <Route path="/goals" component={GoalSetting} />
                <Route path="/library" component={ResourceLibrary} />
                <Route path="/journal" component={Journal} />
                <Route path="/reports" component={Reports} />
                <Route path="/settings" component={Settings} />
                
                {/* Role-specific routes with redirect for unauthorized access */}
                <Route path="/clients">
                  {(user.role === "therapist" || user.role === "admin") ? (
                    <Clients />
                  ) : (
                    <RedirectTo to="/dashboard" />
                  )}
                </Route>
                
                {/* Admin-only routes */}
                <Route path="/users">
                  {user.role === "admin" ? <UserManagement /> : <RedirectTo to="/dashboard" />}
                </Route>
                
                <Route path="/subscriptions">
                  {user.role === "admin" ? <SubscriptionManagement /> : <RedirectTo to="/dashboard" />}
                </Route>
                
                <Route path="/emotion-mapping">
                  {user.role === "admin" ? <EmotionMapping /> : <RedirectTo to="/dashboard" />}
                </Route>
                
                {/* Catch-all route */}
                <Route component={NotFound} />
              </Switch>
            </Layout>
          )}
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <ClientProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
