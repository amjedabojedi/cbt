import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Suspense, lazy } from "react";
import NotFound from "@/pages/not-found";

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

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <div>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/emotions" component={EmotionTracking} />
        <Route path="/thoughts" component={ThoughtRecords} />
        <Route path="/goals" component={GoalSetting} />
        <Route path="/library" component={ResourceLibrary} />
        <Route path="/reports" component={Reports} />
        <Route path="/clients" component={Clients} />
        <Route path="/settings" component={Settings} />
        <Route path="/" component={Dashboard} />
      </div>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
