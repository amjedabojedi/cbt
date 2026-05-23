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
import { LocalizationProvider } from "@/lib/localize.tsx";

// Retry lazy imports once on chunk load failure (handles post-deploy cache mismatch)
function lazyWithRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch((err) => {
      const reloadKey = 'chunk_reload_at';
      const last = Number(sessionStorage.getItem(reloadKey) || 0);
      const now = Date.now();
      if (now - last > 10_000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
      }
      return Promise.reject(err);
    })
  );
}

// Lazy load pages
const Dashboard = lazyWithRetry(() => import("@/features/dashboard/pages/Dashboard"));
const Login = lazyWithRetry(() => import("@/features/auth/pages/Login"));
const Register = lazyWithRetry(() => import("@/features/auth/pages/Register"));
const AuthPage = lazyWithRetry(() => import("@/features/auth/pages/auth-page"));
const MobileLogin = lazyWithRetry(() => import("@/features/auth/pages/MobileLogin"));
const ForgotPassword = lazyWithRetry(() => import("@/features/auth/pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("@/features/auth/pages/ResetPassword"));
const LandingPage = lazyWithRetry(() => import("@/pages/LandingPage"));
const PrivacyPolicy = lazyWithRetry(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("@/pages/TermsOfService"));
const EmotionTracking = lazyWithRetry(() => import("@/features/therapy/pages/EmotionTracking"));
const EmotionMapping = lazyWithRetry(() => import("@/features/therapy/pages/EmotionMapping"));
const ThoughtRecords = lazyWithRetry(() => import("@/features/therapy/pages/ThoughtRecords"));
const ThoughtNew = lazyWithRetry(() => import("@/features/therapy/pages/ThoughtNew"));
const Reflection = lazyWithRetry(() => import("@/features/therapy/pages/Reflection"));
const GoalSetting = lazyWithRetry(() => import("@/features/goals/pages/GoalSetting"));
const ResourceLibrary = lazyWithRetry(() => import("@/features/resources/pages/ResourceLibrary"));
const Journal = lazyWithRetry(() => import("@/features/journal/pages/Journal"));
const Reports = lazyWithRetry(() => import("@/features/dashboard/pages/Reports"));
const Clients = lazyWithRetry(() => import("@/features/dashboard/pages/Clients"));
const ClientProfile = lazyWithRetry(() => import("@/features/dashboard/pages/ClientProfile"));
const Settings = lazyWithRetry(() => import("@/features/dashboard/pages/Settings"));
const ExportPage = lazyWithRetry(() => import("@/features/dashboard/pages/ExportPage"));
const InvitationLinks = lazyWithRetry(() => import("@/features/admin/pages/InvitationLinks"));
// Recommendations pages removed - will be added back when feature is ready

// Reframe Coach pages
const ReframeCoachDashboard = lazyWithRetry(() => import("@/features/reframe/pages/ReframeCoachPage"));
const ReframePracticePage = lazyWithRetry(() => import("@/features/reframe/pages/ReframePracticePage"));

// Admin pages
const AdminDashboard = lazyWithRetry(() => import("@/features/admin/pages/AdminDashboard"));
const UserManagement = lazyWithRetry(() => import("@/features/admin/pages/UserManagement"));
const SubscriptionManagement = lazyWithRetry(() => import("@/features/admin/pages/SubscriptionManagement"));
const ReframeAnalytics = lazyWithRetry(() => import("@/features/admin/pages/ReframeAnalyticsPage"));
const EngagementSettings = lazyWithRetry(() => import("@/features/admin/pages/EngagementSettings"));
const AdminNotifications = lazyWithRetry(() => import("@/features/admin/pages/AdminNotifications"));
const AdminLogs = lazyWithRetry(() => import("@/features/admin/pages/AdminLogs"));

// Import the ProtectedRoute component
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { MobileRedirector } from "@/features/auth/components/MobileRedirector";
import { useAuth } from "@/lib/auth";
import PostHogPageTracker from "@/components/PostHogPageTracker";

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
      <PostHogPageTracker />
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          {/* Public routes */}
          <Route path="/" component={LandingPage} />
          <Route path="/landing" component={LandingPage} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/m/login" component={MobileLogin} />
          <Route path="/mobile-login" component={MobileLogin} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password/:token" component={ResetPassword} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          
          {/* Protected routes - require authentication */}
          <ProtectedRoute path="/dashboard" component={RoleDashboard} />
          <ProtectedRoute path="/emotions" component={EmotionTracking} />
          <ProtectedRoute path="/thoughts" component={ThoughtRecords} />
          <ProtectedRoute path="/thoughts/new" component={ThoughtNew} />
          <ProtectedRoute path="/reflection" component={Reflection} />
          <ProtectedRoute path="/goals" component={GoalSetting} />
          <ProtectedRoute path="/library" component={ResourceLibrary} />
          <ProtectedRoute path="/journal" component={Journal} />
          <ProtectedRoute path="/reports" component={Reports} />
          
          {/* Reframe Coach routes */}
          <ProtectedRoute path="/reframe-coach" component={ReframeCoachDashboard} />
          <ProtectedRoute path="/users/:userId/reframe-coach" component={ReframeCoachDashboard} />
          <ProtectedRoute path="/reframe-coach/practice" component={ReframePracticePage} />
          <ProtectedRoute path="/reframe-coach/practice/:assignmentId" component={ReframePracticePage} />
          <ProtectedRoute path="/users/:userId/reframe-coach/practice/:thoughtId" component={ReframePracticePage} />
          {/* Additional path for query parameters version */}
          <ProtectedRoute path="/reframe-coach/practice/thought/:thoughtId" component={ReframePracticePage} />
          {/* Explicit quick practice route to ensure the flag is properly set */}
          <ProtectedRoute path="/reframe-coach/practice/quick/:thoughtId" component={ReframePracticePage} />
          
          {/* Role-restricted routes */}
          <ProtectedRoute 
            path="/clients" 
            component={Clients} 
            allowedRoles={["therapist", "admin"]} 
          />
          <ProtectedRoute 
            path="/client/:clientId" 
            component={ClientProfile} 
            allowedRoles={["therapist", "admin"]} 
          />
          <ProtectedRoute 
            path="/invitation-links" 
            component={InvitationLinks} 
            allowedRoles={["therapist", "admin"]} 
          />
          
          {/* Admin-only routes */}
          <ProtectedRoute 
            path="/admin" 
            component={AdminDashboard} 
            allowedRoles={["admin"]} 
          />
          <ProtectedRoute 
            path="/admin/users" 
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
          <ProtectedRoute 
            path="/admin/reframe-analytics" 
            component={ReframeAnalytics} 
            allowedRoles={["admin"]} 
          />
          <ProtectedRoute 
            path="/admin/engagement-settings" 
            component={EngagementSettings} 
            allowedRoles={["admin"]} 
          />
          <ProtectedRoute 
            path="/admin/notifications" 
            component={AdminNotifications} 
            allowedRoles={["admin"]} 
          />
          <ProtectedRoute 
            path="/admin/logs" 
            component={AdminLogs} 
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
          <LocalizationProvider>
            <AuthProvider>
              <WebSocketProvider>
                <ClientProvider>
                  {/* Ensure mobile redirection happens after landing page loads */}
                  <MobileRedirector />
                  <TooltipProvider>
                    <Toaster />
                    <Router />
                  </TooltipProvider>
                </ClientProvider>
              </WebSocketProvider>
            </AuthProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
