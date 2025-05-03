import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, UserPlus, Edit, Trash2, Users as UsersIcon, UserCheck, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// Interfaces from schema
interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  maxClients: number;
  isActive: boolean;
  isDefault: boolean;
  stripePriceId?: string;
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  therapistId: number | null;
  createdAt: string;
  // Subscription related fields
  subscriptionPlanId?: number;
  subscriptionStatus?: string;
  subscriptionEndDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export default function UserManagement() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("therapist");
  const [selectedTherapist, setSelectedTherapist] = useState<User | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  
  // Fetch subscription plans
  const { 
    data: subscriptionPlans = [], 
    isLoading: isPlansLoading 
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      if (!res.ok) {
        throw new Error("Failed to fetch subscription plans");
      }
      return res.json();
    }
  });
  
  // Mutation to assign a subscription plan to a therapist
  const assignPlanMutation = useMutation({
    mutationFn: async ({ userId, planId }: { userId: number, planId: number }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/subscription-plan`, { planId });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to assign subscription plan");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan Assigned",
        description: "Subscription plan has been assigned to the therapist successfully.",
      });
      
      // Refetch the users to get updated data
      apiRequest("GET", "/api/users")
        .then(res => res.json())
        .then(data => setUsers(data))
        .catch(err => console.error("Error refetching users:", err));
        
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Fetch all users when the component mounts
  useEffect(() => {
    // Only admins should be able to access this page
    if (user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/users");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate, toast]);

  // Filter users based on search term and active tab
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && user.role === activeTab;
  });

  // Function to get color for role badge
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "therapist":
        return "bg-green-50 text-green-700 border-green-200";
      case "client":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <Layout title="User Management">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Therapist Management</h1>
            <p className="text-muted-foreground">
              Manage therapists and their client assignments
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Button className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Therapist
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64"
              />
              <Tabs
                defaultValue="therapist"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-4 w-full md:w-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="client">Clients</TabsTrigger>
                  <TabsTrigger value="therapist">Therapists</TabsTrigger>
                  <TabsTrigger value="admin">Admins</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableCaption>
                  Showing {filteredUsers.length} of {users.length} users
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getRoleBadgeColor(user.role)}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {user.role === "therapist" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-2"
                                onClick={() => setSelectedTherapist(user)}
                              >
                                Manage Clients
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                // View/edit user
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                // Delete user
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Therapist Client Management Dialog */}
      <Dialog 
        open={!!selectedTherapist}
        onOpenChange={(open) => !open && setSelectedTherapist(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Manage Clients for {selectedTherapist?.name}
            </DialogTitle>
            <DialogDescription>
              Assign or remove clients from this therapist
            </DialogDescription>
          </DialogHeader>

          {/* Subscription Plan Selection */}
          <div className="mb-6 border rounded-md p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Award className="h-4 w-4 mr-1" /> 
              Subscription Plan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Current Plan:
                  {selectedTherapist?.subscriptionPlanId ? (
                    <span className="font-medium text-foreground ml-1">
                      {subscriptionPlans.find(p => p.id === selectedTherapist.subscriptionPlanId)?.name || 'Unknown plan'}
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground ml-1">No plan assigned</span>
                  )}
                </p>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Status:
                  <span className={cn(
                    "ml-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    selectedTherapist?.subscriptionStatus === "active" ? "bg-green-100 text-green-700" :
                    selectedTherapist?.subscriptionStatus === "trial" ? "bg-blue-100 text-blue-700" :
                    selectedTherapist?.subscriptionStatus === "canceled" ? "bg-amber-100 text-amber-700" :
                    selectedTherapist?.subscriptionStatus === "past_due" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  )}>
                    {selectedTherapist?.subscriptionStatus || 'None'}
                  </span>
                </p>
              </div>
              
              <div>
                <Select
                  onValueChange={(value) => setSelectedPlanId(Number(value))}
                  defaultValue={selectedTherapist?.subscriptionPlanId?.toString() || ""}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {isPlansLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading plans...</span>
                      </div>
                    ) : (
                      subscriptionPlans.filter(p => p.isActive).map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} (${plan.price}/{plan.interval}, {plan.maxClients} clients)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                <div className="mt-3">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      if (!selectedPlanId || !selectedTherapist) return;
                      assignPlanMutation.mutate({ 
                        userId: selectedTherapist.id, 
                        planId: selectedPlanId 
                      });
                    }}
                    disabled={!selectedPlanId || assignPlanMutation.isPending}
                    className="w-full"
                  >
                    {assignPlanMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Assign Plan
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            {/* Available Clients Column */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <UsersIcon className="h-4 w-4 mr-1" /> 
                Available Clients
              </h3>
              <div className="border rounded-md overflow-hidden">
                <div className="p-3 bg-secondary/30">
                  <Input 
                    placeholder="Search clients..." 
                    className="text-sm"
                    // Add search functionality here
                  />
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {users
                    .filter(u => u.role === "client" && (!u.therapistId || u.therapistId !== selectedTherapist?.id))
                    .map(client => (
                      <div 
                        key={client.id} 
                        className="p-3 border-b last:border-0 flex justify-between items-center hover:bg-secondary/20"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-2">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-xs text-muted-foreground">{client.email}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Assign client to therapist
                            toast({
                              title: "Client Assigned",
                              description: `${client.name} has been assigned to ${selectedTherapist?.name}`,
                            });
                          }}
                        >
                          Assign
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Assigned Clients Column */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <UserCheck className="h-4 w-4 mr-1" /> 
                Assigned Clients
              </h3>
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-[19.5rem] overflow-y-auto">
                  {users
                    .filter(u => u.role === "client" && u.therapistId === selectedTherapist?.id)
                    .map(client => (
                      <div 
                        key={client.id} 
                        className="p-3 border-b last:border-0 flex justify-between items-center hover:bg-secondary/20"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-2">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-xs text-muted-foreground">{client.email}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            // Remove client from therapist
                            toast({
                              title: "Client Removed",
                              description: `${client.name} has been removed from ${selectedTherapist?.name}`,
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  {users.filter(u => u.role === "client" && u.therapistId === selectedTherapist?.id).length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No clients assigned to this therapist
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTherapist(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}