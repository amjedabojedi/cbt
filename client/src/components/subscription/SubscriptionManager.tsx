import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle, CreditCard, Loader2, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";

type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  maxClients: number;
  isActive: boolean;
  isDefault: boolean;
  stripePriceId: string | null;
  createdAt: string;
};

type SubscriptionInfo = {
  plan: SubscriptionPlan | null;
  status: string | null;
  endDate: string | null;
  stripeSubscription: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
};

export function SubscriptionManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCheckoutRedirecting, setIsCheckoutRedirecting] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  
  // Fetch current subscription info
  const { 
    data: subscription, 
    isLoading: isSubscriptionLoading, 
    error: subscriptionError 
  } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription"],
    queryFn: async () => {
      const res = await fetch("/api/subscription");
      if (!res.ok) {
        throw new Error("Failed to fetch subscription information");
      }
      return res.json();
    }
  });
  
  // Fetch available subscription plans
  const { 
    data: plans, 
    isLoading: isPlansLoading, 
    error: plansError 
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await fetch("/api/subscription-plans");
      if (!res.ok) {
        throw new Error("Failed to fetch subscription plans");
      }
      return res.json();
    }
  });
  
  // Subscribe to a plan mutation
  const subscribeMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest("POST", "/api/subscription", { planId });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to subscribe to plan");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // For free plans, just show a success message
      if (!data.url) {
        toast({
          title: "Success",
          description: "Your subscription has been updated successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        setIsUpgradeDialogOpen(false);
        return;
      }
      
      // For paid plans, redirect to the Stripe checkout page
      setIsCheckoutRedirecting(true);
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setIsCheckoutRedirecting(false);
    }
  });
  
  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscription/cancel", {});
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to cancel subscription");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of your billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      setIsCancelDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle subscribing to a plan
  const handleSubscribe = (planId: number) => {
    subscribeMutation.mutate(planId);
  };
  
  // Handle opening the upgrade dialog
  const handleOpenUpgradeDialog = (planId: number) => {
    setSelectedPlanId(planId);
    setIsUpgradeDialogOpen(true);
  };
  
  // Handle canceling the subscription
  const handleCancelSubscription = () => {
    cancelSubscriptionMutation.mutate();
  };
  
  // Get the selected plan details
  const getSelectedPlan = () => {
    if (!selectedPlanId || !plans) return null;
    return plans.find(plan => plan.id === selectedPlanId) || null;
  };
  
  // Format date from string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMMM d, yyyy");
  };
  
  // Get subscription status badge
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "trialing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            <Calendar className="h-3 w-3 mr-1" />
            Trial
          </Badge>
        );
      case "past_due":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Past Due
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };
  
  // Loading state
  if (isSubscriptionLoading || isPlansLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading subscription information...</p>
      </div>
    );
  }
  
  // Error state
  if (subscriptionError || plansError) {
    return (
      <div className="p-4 bg-destructive/10 rounded-md border border-destructive">
        <h3 className="text-lg font-medium flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Error Loading Subscription
        </h3>
        <p className="text-sm mt-2">Failed to load subscription information. Please try again later.</p>
      </div>
    );
  }
  
  const selectedPlan = getSelectedPlan();
  
  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Subscription</CardTitle>
              <CardDescription>
                Manage your therapist subscription
              </CardDescription>
            </div>
            {getStatusBadge(subscription?.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription?.plan ? (
            <>
              <div>
                <h3 className="text-xl font-semibold">{subscription.plan.name}</h3>
                <p className="text-sm text-muted-foreground">{subscription.plan.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm font-medium">Price</p>
                  <p className="text-lg">
                    ${subscription.plan.price}
                    <span className="text-sm text-muted-foreground">
                      /{subscription.plan.interval}
                    </span>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Max Clients</p>
                  <p className="text-lg">{subscription.plan.maxClients}</p>
                </div>
              </div>
              
              {subscription.stripeSubscription && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Current Period</p>
                    <p className="text-sm">
                      Ends {formatDate(subscription.stripeSubscription.currentPeriodEnd)}
                    </p>
                  </div>
                  
                  {subscription.stripeSubscription.cancelAtPeriodEnd && (
                    <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 border border-amber-100">
                      <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                      Your subscription will not renew after the current period.
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-1 mt-4">
                <p className="text-sm font-medium">Features</p>
                <ul className="space-y-1">
                  {subscription.plan.features.map((feature, i) => (
                    <li key={i} className="text-sm flex">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-lg font-medium mb-2">No Active Subscription</p>
              <p className="text-sm text-muted-foreground mb-6">
                You don't have an active subscription. Choose a plan to get started.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          {subscription?.stripeSubscription && !subscription.stripeSubscription.cancelAtPeriodEnd && (
            <Button 
              variant="outline" 
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setIsCancelDialogOpen(true)}
              disabled={cancelSubscriptionMutation.isPending}
            >
              {cancelSubscriptionMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Cancel Subscription
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans?.filter(plan => plan.isActive).map((plan) => (
            <Card key={plan.id} className={subscription?.plan?.id === plan.id ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{plan.name}</CardTitle>
                  <div>
                    <Badge variant="secondary" className="mb-1">
                      {plan.interval === "month" ? "Monthly" : "Yearly"}
                    </Badge>
                    <div className="text-2xl font-bold">
                      ${plan.price}
                      <span className="text-sm font-normal">/{plan.interval}</span>
                    </div>
                  </div>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-sm font-medium">Max Clients:</span>{" "}
                  <span className="text-sm">{plan.maxClients}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Features:</span>
                  <ul className="mt-1 space-y-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="text-sm flex">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                {subscription?.plan?.id === plan.id ? (
                  <Button variant="outline" disabled className="w-full">
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleOpenUpgradeDialog(plan.id)}
                  >
                    {plan.price > 0 ? "Upgrade" : "Select"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Upgrade/Subscribe Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              {subscription?.plan ? 
                "You are about to change your subscription plan." :
                "You are about to subscribe to a new plan."
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="py-4">
              <h3 className="text-lg font-semibold">{selectedPlan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{selectedPlan.description}</p>
              
              <div className="flex justify-between items-center p-3 rounded-md bg-primary/5 mb-4">
                <div>
                  <p className="font-medium">Price</p>
                  <p className="text-xl font-bold">
                    ${selectedPlan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{selectedPlan.interval}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="font-medium text-right">Max Clients</p>
                  <p className="text-xl font-bold text-right">{selectedPlan.maxClients}</p>
                </div>
              </div>
              
              {selectedPlan.price > 0 && (
                <div className="flex items-center p-3 rounded-md bg-primary/5 mb-4">
                  <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Payment Information</p>
                    <p className="text-sm text-muted-foreground">
                      You'll be redirected to our secure payment processor to complete your subscription.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUpgradeDialogOpen(false)}
              disabled={subscribeMutation.isPending || isCheckoutRedirecting}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => selectedPlanId && handleSubscribe(selectedPlanId)}
              disabled={subscribeMutation.isPending || isCheckoutRedirecting}
            >
              {(subscribeMutation.isPending || isCheckoutRedirecting) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {selectedPlan?.price > 0 ? "Proceed to Checkout" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Subscription Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until the end of your current billing period 
              ({subscription?.stripeSubscription?.currentPeriodEnd ? 
                formatDate(subscription.stripeSubscription.currentPeriodEnd) : 
                "the end of your billing period"
              }).
              After that, you'll be moved to the free plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelSubscriptionMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}