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
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/emotion-tracking" component={EmotionTracking} />
        <Route path="/emotions" component={EmotionTracking} />
        <Route path="/thoughts" component={ThoughtRecords} />
        <Route path="/goals" component={GoalSetting} />
        <Route path="/library" component={ResourceLibrary} />
        <Route path="/reports" component={Reports} />
        <Route path="/clients" component={Clients} />
        <Route path="/settings" component={Settings} />
        <Route path="/:rest*" component={NotFound} />
        <Route path="/" component={Dashboard} />
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
