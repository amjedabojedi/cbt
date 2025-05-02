import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Suspense, lazy } from "react";
import NotFound from "@/pages/not-found";
import { ClientProvider } from "@/context/ClientContext";
import { ThemeProvider } from "next-themes";

// Lazy load pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const EmotionTracking = lazy(() => import("@/pages/EmotionTracking"));
const ThoughtRecords = lazy(() => import("@/pages/ThoughtRecords"));
const GoalSetting = lazy(() => import("@/pages/GoalSetting"));
const ResourceLibrary = lazy(() => import("@/pages/ResourceLibrary"));
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
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Public routes */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Protected routes - require authentication */}
        <ProtectedRoute path="/dashboard" component={RoleDashboard} />
        <ProtectedRoute path="/emotion-tracking" component={EmotionTracking} />
        <ProtectedRoute path="/emotions" component={EmotionTracking} />
        <ProtectedRoute path="/thoughts" component={ThoughtRecords} />
        <ProtectedRoute path="/goals" component={GoalSetting} />
        <ProtectedRoute path="/library" component={ResourceLibrary} />
        <ProtectedRoute path="/reports" component={Reports} />
        
        {/* Role-restricted routes */}
        <ProtectedRoute 
          path="/clients" 
          component={Clients} 
          allowedRoles={["therapist", "admin"]} 
        />
        
        {/* Admin-only routes */}
        <ProtectedRoute 
          path="/users" 
          component={UserManagement} 
          allowedRoles={["admin"]} 
        />
        <ProtectedRoute 
          path="/subscriptions" 
          component={SubscriptionManagement} 
          allowedRoles={["admin"]} 
        />
        
        {/* General routes */}
        <ProtectedRoute path="/settings" component={Settings} />
        <Route path="/:rest*" component={NotFound} />
        <ProtectedRoute path="/" component={RoleDashboard} />
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
