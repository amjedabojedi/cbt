import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Edit, Trash2, Award, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Plan interface
interface Plan {
  id: number;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  isActive: boolean;
  maxClients: number;
  maxResources: number;
}

// User interface
interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  planId?: number;
  planName?: string;
  subscriptionStatus?: string;
  nextBillingDate?: string;
}

export default function SubscriptionManagement() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: 1,
      name: "Basic",
      price: 29.99,
      billingCycle: "monthly",
      features: ["Up to 10 clients", "Basic analytics", "Email support"],
      isActive: true,
      maxClients: 10,
      maxResources: 50
    },
    {
      id: 2,
      name: "Professional",
      price: 49.99,
      billingCycle: "monthly",
      features: ["Up to 30 clients", "Advanced analytics", "Priority support", "Custom branding"],
      isActive: true,
      maxClients: 30,
      maxResources: 200
    },
    {
      id: 3,
      name: "Enterprise",
      price: 99.99,
      billingCycle: "monthly",
      features: ["Unlimited clients", "Full analytics suite", "24/7 support", "Custom branding", "API access"],
      isActive: true,
      maxClients: 9999,
      maxResources: 9999
    }
  ]);
  const [therapists, setTherapists] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("plans");
  const [newPlan, setNewPlan] = useState<Omit<Plan, 'id' | 'isActive'>>({
    name: "",
    price: 0,
    billingCycle: "monthly",
    features: [],
    maxClients: 0,
    maxResources: 0
  });
  const [newFeature, setNewFeature] = useState("");
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const fetchTherapists = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/users");
        const data = await response.json();
        // Filter only therapists
        const therapistsData = data.filter((u: any) => u.role === "therapist");
        
        // Add mock subscription data (this would come from the database in a real app)
        const therapistsWithPlans = therapistsData.map((t: any) => ({
          ...t,
          planId: Math.floor(Math.random() * 3) + 1,
          planName: ["Basic", "Professional", "Enterprise"][Math.floor(Math.random() * 3)],
          subscriptionStatus: Math.random() > 0.2 ? "active" : "expired",
          nextBillingDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
        }));
        
        setTherapists(therapistsWithPlans);
      } catch (error) {
        console.error("Error fetching therapists:", error);
        toast({
          title: "Error",
          description: "Failed to load therapist data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, [user, navigate, toast]);

  // Filter therapists based on search term
  const filteredTherapists = therapists.filter((therapist) => {
    return (
      therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.planName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Add a new feature to the plan being created
  const addFeature = () => {
    if (newFeature.trim() === "") return;
    if (editingPlan) {
      setEditingPlan({
        ...editingPlan,
        features: [...editingPlan.features, newFeature.trim()]
      });
    } else {
      setNewPlan({
        ...newPlan,
        features: [...newPlan.features, newFeature.trim()]
      });
    }
    setNewFeature("");
  };

  // Remove a feature from the plan being created
  const removeFeature = (index: number) => {
    if (editingPlan) {
      const updatedFeatures = [...editingPlan.features];
      updatedFeatures.splice(index, 1);
      setEditingPlan({
        ...editingPlan,
        features: updatedFeatures
      });
    } else {
      const updatedFeatures = [...newPlan.features];
      updatedFeatures.splice(index, 1);
      setNewPlan({
        ...newPlan,
        features: updatedFeatures
      });
    }
  };

  // Create a new plan
  const createPlan = () => {
    if (newPlan.name.trim() === "" || newPlan.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    const newId = Math.max(...plans.map(p => p.id)) + 1;
    const plan = {
      ...newPlan,
      id: newId,
      isActive: true
    };

    setPlans([...plans, plan]);
    setNewPlan({
      name: "",
      price: 0,
      billingCycle: "monthly",
      features: [],
      maxClients: 0,
      maxResources: 0
    });
    setShowNewPlanDialog(false);

    toast({
      title: "Plan Created",
      description: `The "${plan.name}" plan has been created successfully.`,
    });
  };

  // Update a plan
  const updatePlan = () => {
    if (!editingPlan) return;

    if (editingPlan.name.trim() === "" || editingPlan.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    const updatedPlans = plans.map(p => 
      p.id === editingPlan.id ? editingPlan : p
    );

    setPlans(updatedPlans);
    setEditingPlan(null);

    toast({
      title: "Plan Updated",
      description: `The "${editingPlan.name}" plan has been updated successfully.`,
    });
  };

  // Toggle plan activity status
  const togglePlanStatus = (id: number) => {
    const updatedPlans = plans.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    );
    
    setPlans(updatedPlans);
    
    const plan = updatedPlans.find(p => p.id === id);
    toast({
      title: plan?.isActive ? "Plan Activated" : "Plan Deactivated",
      description: `The "${plan?.name}" plan has been ${plan?.isActive ? "activated" : "deactivated"}.`,
    });
  };

  // Assign a plan to a therapist
  const assignPlan = (therapistId: number, planId: number) => {
    const updatedTherapists = therapists.map(t => 
      t.id === therapistId 
        ? { 
            ...t, 
            planId, 
            planName: plans.find(p => p.id === planId)?.name || "",
            subscriptionStatus: "active",
            nextBillingDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
          } 
        : t
    );
    
    setTherapists(updatedTherapists);
    
    const therapist = updatedTherapists.find(t => t.id === therapistId);
    toast({
      title: "Plan Assigned",
      description: `The "${therapist?.planName}" plan has been assigned to ${therapist?.name}.`,
    });
  };

  return (
    <Layout title="Subscription Management">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground">
              Manage subscription plans and therapist accounts
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Dialog open={showNewPlanDialog} onOpenChange={setShowNewPlanDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Add a new subscription plan for therapists.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-4">
                      <Label htmlFor="name">Plan Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Premium"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g., 49.99"
                        value={newPlan.price}
                        onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="billingCycle">Billing Cycle</Label>
                      <select
                        id="billingCycle"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newPlan.billingCycle}
                        onChange={(e) => setNewPlan({ ...newPlan, billingCycle: e.target.value })}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="maxClients">Max Clients</Label>
                      <Input
                        id="maxClients"
                        type="number"
                        min="1"
                        placeholder="e.g., 30"
                        value={newPlan.maxClients}
                        onChange={(e) => setNewPlan({ ...newPlan, maxClients: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="maxResources">Max Resources</Label>
                      <Input
                        id="maxResources"
                        type="number"
                        min="1"
                        placeholder="e.g., 100"
                        value={newPlan.maxResources}
                        onChange={(e) => setNewPlan({ ...newPlan, maxResources: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor="features">Features</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="features"
                          placeholder="e.g., Advanced analytics"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addFeature()}
                        />
                        <Button type="button" onClick={addFeature} variant="secondary">
                          Add
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-4">
                      <div className="space-y-2">
                        {newPlan.features.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between bg-secondary p-2 rounded">
                            <span className="text-sm">{feature}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFeature(index)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewPlanDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createPlan}>Create Plan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Edit Plan Dialog */}
            <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Update the details of this subscription plan.
                  </DialogDescription>
                </DialogHeader>
                {editingPlan && (
                  <>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-4">
                          <Label htmlFor="edit-name">Plan Name</Label>
                          <Input
                            id="edit-name"
                            placeholder="e.g., Premium"
                            value={editingPlan.name}
                            onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="edit-price">Price ($)</Label>
                          <Input
                            id="edit-price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g., 49.99"
                            value={editingPlan.price}
                            onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="edit-billingCycle">Billing Cycle</Label>
                          <select
                            id="edit-billingCycle"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={editingPlan.billingCycle}
                            onChange={(e) => setEditingPlan({ ...editingPlan, billingCycle: e.target.value })}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annually">Annually</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="edit-maxClients">Max Clients</Label>
                          <Input
                            id="edit-maxClients"
                            type="number"
                            min="1"
                            placeholder="e.g., 30"
                            value={editingPlan.maxClients}
                            onChange={(e) => setEditingPlan({ ...editingPlan, maxClients: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="edit-maxResources">Max Resources</Label>
                          <Input
                            id="edit-maxResources"
                            type="number"
                            min="1"
                            placeholder="e.g., 100"
                            value={editingPlan.maxResources}
                            onChange={(e) => setEditingPlan({ ...editingPlan, maxResources: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="col-span-4">
                          <Label htmlFor="edit-features">Features</Label>
                          <div className="flex space-x-2">
                            <Input
                              id="edit-features"
                              placeholder="e.g., Advanced analytics"
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addFeature()}
                            />
                            <Button type="button" onClick={addFeature} variant="secondary">
                              Add
                            </Button>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <div className="space-y-2">
                            {editingPlan.features.map((feature, index) => (
                              <div key={index} className="flex items-center justify-between bg-secondary p-2 rounded">
                                <span className="text-sm">{feature}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFeature(index)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingPlan(null)}>
                        Cancel
                      </Button>
                      <Button onClick={updatePlan}>Update Plan</Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="plans" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="therapists">Therapist Subscriptions</TabsTrigger>
          </TabsList>
          
          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>
                          ${plan.price}/{plan.billingCycle.slice(0, 1)}
                        </CardDescription>
                      </div>
                      <Badge variant={plan.isActive ? "default" : "outline"}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Features:</p>
                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Max Clients</p>
                        <p className="font-medium">{plan.maxClients === 9999 ? "Unlimited" : plan.maxClients}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Max Resources</p>
                        <p className="font-medium">{plan.maxResources === 9999 ? "Unlimited" : plan.maxResources}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setEditingPlan(plan)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant={plan.isActive ? "destructive" : "default"}
                      onClick={() => togglePlanStatus(plan.id)}
                    >
                      {plan.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Therapists Tab */}
          <TabsContent value="therapists" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Therapist Subscription Status</CardTitle>
                <div className="pt-4">
                  <Input
                    placeholder="Search therapists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableCaption>
                      Showing {filteredTherapists.length} of {therapists.length} therapists
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next Billing</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTherapists.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-10 text-muted-foreground"
                          >
                            No therapists found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTherapists.map((therapist) => (
                          <TableRow key={therapist.id}>
                            <TableCell className="font-medium">{therapist.name}</TableCell>
                            <TableCell>{therapist.email}</TableCell>
                            <TableCell>
                              {therapist.planName ? (
                                <span className="flex items-center">
                                  <Award className="h-4 w-4 mr-1 text-primary" />
                                  {therapist.planName}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">No plan</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  therapist.subscriptionStatus === "active"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {therapist.subscriptionStatus || "none"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {therapist.nextBillingDate || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Change Plan
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Change Subscription Plan</DialogTitle>
                                    <DialogDescription>
                                      Assign a different subscription plan to {therapist.name}.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="space-y-4">
                                      {plans.filter(p => p.isActive).map((plan) => (
                                        <div
                                          key={plan.id}
                                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                            therapist.planId === plan.id
                                              ? "border-primary bg-primary/5"
                                              : "border-border hover:border-primary/50"
                                          }`}
                                          onClick={() => assignPlan(therapist.id, plan.id)}
                                        >
                                          <div className="flex justify-between items-center">
                                            <div className="font-medium">{plan.name}</div>
                                            <div className="text-sm font-medium">
                                              ${plan.price}/{plan.billingCycle.slice(0, 1)}
                                            </div>
                                          </div>
                                          <div className="text-sm text-muted-foreground mt-1">
                                            {plan.maxClients === 9999 ? "Unlimited" : plan.maxClients} clients, {
                                              plan.features.length
                                            } features
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="destructive"
                                      onClick={() => assignPlan(therapist.id, 0)}
                                    >
                                      Cancel Subscription
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}