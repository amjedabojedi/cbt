import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, X, Edit, Plus, AlertTriangle, Star, Loader2 } from "lucide-react";

// Define subscription plan form schema
const subscriptionPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  interval: z.enum(["month", "year"]),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  maxClients: z.number().min(1, "Maximum clients must be at least 1"),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  stripePriceId: z.string().optional()
});

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

export function SubscriptionPlansManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  
  // Fetch subscription plans
  const { data: plans, isLoading, error } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await fetch("/api/subscription-plans");
      if (!res.ok) {
        throw new Error("Failed to fetch subscription plans");
      }
      return res.json();
    }
  });
  
  // Form for creating/editing subscription plans
  const form = useForm<z.infer<typeof subscriptionPlanSchema>>({
    resolver: zodResolver(subscriptionPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      interval: "month",
      features: [],
      maxClients: 5,
      isActive: true,
      isDefault: false,
      stripePriceId: ""
    }
  });
  
  // Create subscription plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: z.infer<typeof subscriptionPlanSchema>) => {
      const res = await apiRequest("POST", "/api/subscription-plans", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create subscription plan");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription plan created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      form.reset();
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update subscription plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<z.infer<typeof subscriptionPlanSchema>> }) => {
      const res = await apiRequest("PATCH", `/api/subscription-plans/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update subscription plan");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      form.reset();
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Set default plan mutation
  const setDefaultPlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/subscription-plans/${id}/set-default`, {});
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to set default plan");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Default plan updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Deactivate plan mutation
  const deactivatePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/subscription-plans/${id}/deactivate`, {});
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to deactivate plan");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Plan deactivated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission for creating a plan
  const onCreateSubmit = (data: z.infer<typeof subscriptionPlanSchema>) => {
    createPlanMutation.mutate(data);
  };
  
  // Handle form submission for updating a plan
  const onUpdateSubmit = (data: z.infer<typeof subscriptionPlanSchema>) => {
    if (!currentPlan) return;
    
    updatePlanMutation.mutate({ 
      id: currentPlan.id, 
      data
    });
  };
  
  // Handle adding a feature to the list
  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    
    const currentFeatures = form.getValues("features") || [];
    form.setValue("features", [...currentFeatures, featureInput.trim()]);
    setFeatureInput("");
  };
  
  // Handle removing a feature from the list
  const handleRemoveFeature = (index: number) => {
    const currentFeatures = form.getValues("features") || [];
    form.setValue(
      "features",
      currentFeatures.filter((_, i) => i !== index)
    );
  };
  
  // Open edit dialog with plan data
  const handleEditPlan = (plan: SubscriptionPlan) => {
    setCurrentPlan(plan);
    form.reset({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      interval: plan.interval,
      features: plan.features,
      maxClients: plan.maxClients,
      isActive: plan.isActive,
      isDefault: plan.isDefault,
      stripePriceId: plan.stripePriceId || ""
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle setting a plan as default
  const handleSetDefault = (id: number) => {
    setDefaultPlanMutation.mutate(id);
  };
  
  // Handle deactivating a plan
  const handleDeactivate = (id: number) => {
    if (window.confirm("Are you sure you want to deactivate this plan? Existing subscribers won't be affected, but new users won't be able to subscribe to this plan.")) {
      deactivatePlanMutation.mutate(id);
    }
  };
  
  // Reset form when opening create dialog
  const handleOpenCreateDialog = () => {
    form.reset({
      name: "",
      description: "",
      price: 0,
      interval: "month",
      features: [],
      maxClients: 5,
      isActive: true,
      isDefault: false,
      stripePriceId: ""
    });
    setIsCreateDialogOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading subscription plans...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 rounded-md border border-destructive">
        <h3 className="text-lg font-medium flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Error Loading Plans
        </h3>
        <p className="text-sm mt-2">Failed to load subscription plans. Please try again later.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-4">
        <h2 className="text-2xl font-semibold">Subscription Plans</h2>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Plan
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-[calc(100vh-180px)] overflow-y-auto pb-4 pr-2">
        {plans?.map((plan) => (
          <Card key={plan.id} className={plan.isActive ? "" : "opacity-70"}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    {plan.name}
                    {plan.isDefault && (
                      <Badge variant="outline" className="ml-2 bg-yellow-100">
                        <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {plan.isActive ? (
                      <span className="text-green-600 text-xs font-medium flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs font-medium">Inactive</span>
                    )}
                  </CardDescription>
                </div>
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
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="mb-2">
                <span className="text-sm font-medium">Features:</span>
                <ul className="mt-1 space-y-1 max-h-40 overflow-y-auto pr-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-sm flex">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium">Max Clients:</span>{" "}
                <span className="text-sm">{plan.maxClients}</span>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <div className="space-x-2">
                {!plan.isDefault && plan.isActive && (
                  <Button variant="secondary" size="sm" onClick={() => handleSetDefault(plan.id)}>
                    <Star className="h-4 w-4 mr-1" />
                    Set Default
                  </Button>
                )}
                {plan.isActive && !plan.isDefault && (
                  <Button variant="destructive" size="sm" onClick={() => handleDeactivate(plan.id)}>
                    <X className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription>
              Create a new subscription plan for therapists.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Basic Plan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>Set to 0 for free plans</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A basic plan for therapists starting out..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Interval</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing interval" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="month">Monthly</SelectItem>
                          <SelectItem value="year">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxClients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Clients</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="5" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>Maximum number of clients a therapist can manage</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <FormLabel>Features</FormLabel>
                      <div className="flex space-x-2">
                        <Input 
                          placeholder="Add a feature..." 
                          value={featureInput} 
                          onChange={(e) => setFeatureInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                        />
                        <Button type="button" onClick={handleAddFeature}>Add</Button>
                      </div>
                      
                      <div className="mt-2 space-y-2">
                        {form.watch("features")?.map((feature, index) => (
                          <div key={index} className="flex items-center bg-muted p-2 rounded-md">
                            <span className="flex-1 text-sm">{feature}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveFeature(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-3 rounded-md border">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Make this plan available to users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-3 rounded-md border">
                      <div className="space-y-0.5">
                        <FormLabel>Default Plan</FormLabel>
                        <FormDescription>
                          Set as the default plan for new users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="stripePriceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Price ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="price_..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      For paid plans: the Stripe Price ID from your Stripe Dashboard
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPlanMutation.isPending}
                >
                  {createPlanMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Plan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update this subscription plan. Existing subscriptions won't be affected.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Basic Plan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>Set to 0 for free plans</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A basic plan for therapists starting out..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Interval</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing interval" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="month">Monthly</SelectItem>
                          <SelectItem value="year">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxClients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Clients</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="5" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>Maximum number of clients a therapist can manage</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <FormLabel>Features</FormLabel>
                      <div className="flex space-x-2">
                        <Input 
                          placeholder="Add a feature..." 
                          value={featureInput} 
                          onChange={(e) => setFeatureInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                        />
                        <Button type="button" onClick={handleAddFeature}>Add</Button>
                      </div>
                      
                      <div className="mt-2 space-y-2">
                        {form.watch("features")?.map((feature, index) => (
                          <div key={index} className="flex items-center bg-muted p-2 rounded-md">
                            <span className="flex-1 text-sm">{feature}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveFeature(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-3 rounded-md border">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Make this plan available to users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-3 rounded-md border">
                      <div className="space-y-0.5">
                        <FormLabel>Default Plan</FormLabel>
                        <FormDescription>
                          Set as the default plan for new users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="stripePriceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Price ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="price_..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      For paid plans: the Stripe Price ID from your Stripe Dashboard
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatePlanMutation.isPending}
                >
                  {updatePlanMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Update Plan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}