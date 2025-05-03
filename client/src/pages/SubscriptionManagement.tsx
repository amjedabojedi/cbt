import { useAuth } from "@/lib/auth";
import { SubscriptionPlansManager } from "@/components/subscription/SubscriptionPlansManager";
import { SubscriptionManager } from "@/components/subscription/SubscriptionManager";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import AppLayout from "@/components/layout/AppLayout";

export default function SubscriptionManagement() {
  const { user, isLoading } = useAuth();
  
  // Fetch Stripe API keys to check if payments are configured
  const { 
    data: stripeConfigured, 
    isLoading: isStripeLoading
  } = useQuery<boolean>({
    queryKey: ["/api/stripe/status"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/stripe/status");
        if (!res.ok) return false;
        const data = await res.json();
        return data.configured === true;
      } catch (error) {
        console.error("Error checking Stripe status:", error);
        return false;
      }
    },
    enabled: !!user
  });
  
  // Loading state
  if (isLoading || isStripeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading subscription information...</p>
      </div>
    );
  }
  
  // Error state if no user is found
  if (!user) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive">
          <h3 className="text-lg font-medium flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Authentication Required
          </h3>
          <p className="text-sm mt-2">You need to be logged in to access this page.</p>
          <Button asChild className="mt-4">
            <Link href="/auth">Login or Register</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 min-h-screen overflow-hidden">
      <h1 className="text-3xl font-bold mb-8 sticky top-0 bg-background z-20 py-2">Subscription Management</h1>
      
      {/* Display warning if Stripe is not configured */}
      {user.role === "admin" && !stripeConfigured && (
        <div className="mb-6 p-4 bg-amber-50 rounded-md border border-amber-200 sticky top-16 z-10">
          <h3 className="text-lg font-medium flex items-center text-amber-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Stripe Not Configured
          </h3>
          <p className="text-sm mt-2 text-amber-700">
            Stripe API keys are not configured. Paid subscriptions will not work until you set up your 
            Stripe account and add your API keys.
          </p>
          <div className="mt-4 text-sm text-amber-700">
            <p className="font-semibold">To configure Stripe:</p>
            <ol className="list-decimal pl-5 space-y-1 mt-2">
              <li>Sign up for a Stripe account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">stripe.com</a></li>
              <li>Go to the Stripe Dashboard &gt; Developers &gt; API keys</li>
              <li>Add your API keys to the environment variables</li>
            </ol>
          </div>
        </div>
      )}
      
      {/* Show different components based on user role */}
      <div className="overflow-auto max-h-[calc(100vh-150px)]">
        {user.role === "admin" ? (
          // Admin view - subscription plan management
          <SubscriptionPlansManager />
        ) : user.role === "therapist" ? (
          // Therapist view - subscription management
          <SubscriptionManager />
        ) : (
          // Client view - informational message
          <div className="p-6 bg-muted rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Client Account</h2>
            <p className="text-muted-foreground">
              Subscription management is only available for therapist and administrator accounts.
              As a client, you don't need to manage any subscription.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}