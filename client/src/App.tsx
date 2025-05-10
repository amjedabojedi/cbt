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
import { WebSocketProvider } from "@/context/WebSocketContext";
import ErrorBoundary from "@/components/error/ErrorBoundary";

// Lazy load pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const EmotionTracking = lazy(() => import("@/pages/EmotionTracking"));
const EmotionMapping = lazy(() => import("@/pages/EmotionMapping"));
const ThoughtRecords = lazy(() => import("@/pages/ThoughtRecords"));
const GoalSetting = lazy(() => import("@/pages/GoalSetting"));
const ResourceLibrary = lazy(() => import("@/pages/ResourceLibrary"));
const Journal = lazy(() => import("@/pages/Journal"));
const Reports = lazy(() => import("@/pages/Reports"));
const Clients = lazy(() => import("@/pages/Clients"));
const Settings = lazy(() => import("@/pages/Settings"));
const ExportPage = lazy(() => import("@/pages/ExportPage"));
// Recommendations pages removed - will be added back when feature is ready

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
    <ErrorBoundary name="Main Router">
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          {/* Public routes */}
          <Route path="/" component={LandingPage} />
          <Route path="/landing" component={LandingPage} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          
          {/* Protected routes - require authentication */}
          <ProtectedRoute path="/dashboard" component={RoleDashboard} />
          <ProtectedRoute path="/emotion-tracking" component={EmotionTracking} />
          <ProtectedRoute path="/emotions" component={EmotionTracking} />
          <ProtectedRoute path="/thoughts" component={ThoughtRecords} />
          <ProtectedRoute path="/goals" component={GoalSetting} />
          <ProtectedRoute path="/library" component={ResourceLibrary} />
          <ProtectedRoute path="/journal" component={Journal} />
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
          <ProtectedRoute 
            path="/emotion-mapping" 
            component={EmotionMapping} 
            allowedRoles={["admin"]} 
          />
          
          {/* AI Recommendations routes - completely removed 
             Routes will be added back when the ai_recommendations table is created */}
          
          {/* General routes */}
          <ProtectedRoute path="/settings" component={Settings} />
          <ProtectedRoute path="/export" component={ExportPage} />
          <Route path="/:rest*" component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary name="Application Root">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <WebSocketProvider>
              <ClientProvider>
                <TooltipProvider>
                  <Toaster />
                  <Router />
                </TooltipProvider>
              </ClientProvider>
            </WebSocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
