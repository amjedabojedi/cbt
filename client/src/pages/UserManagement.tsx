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
import { Loader2, Plus, UserPlus, Edit, Trash2, Users as UsersIcon, UserCheck, Award, Key } from "lucide-react";
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
import { Label } from "@/components/ui/label";

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
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState(false);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState<"therapist" | "admin">("therapist");
  const [newUserFormState, setNewUserFormState] = useState({
    name: "",
    email: "",
    username: "",
    password: ""
  });
  
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
  // Mutation to update a user
  const updateUserMutation = useMutation({
    mutationFn: async (updatedUser: Partial<User> & { id: number }) => {
      const { id, ...userData } = updatedUser;
      const res = await apiRequest("PATCH", `/api/users/${id}`, userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
      
      // Update the users list with the updated user
      setUsers(prevUsers => prevUsers.map(u => 
        u.id === updatedUser.id ? updatedUser : u
      ));
      
      setUserToEdit(null);
      setResetPassword(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to reset a user's password
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/users/${userId}/reset-password`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to reset password");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset",
        description: `Password has been reset to "${data.defaultPassword}". Please share this with the user.`,
      });
      setResetPassword(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to delete a user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete user");
      }
      return userId;
    },
    onSuccess: (userId) => {
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
      
      // Close the delete confirmation dialog
      setUserToDelete(null);
      
      // Refresh the user list to ensure we have the most up-to-date data
      fetchUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
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
    onSuccess: (updatedUser) => {
      toast({
        title: "Plan Assigned",
        description: "Subscription plan has been assigned to the therapist successfully.",
      });
      
      // Update the selected therapist if it's the one being edited
      if (selectedTherapist && selectedTherapist.id === updatedUser.id) {
        setSelectedTherapist(updatedUser);
      }
        
      // Refresh the user list to ensure we have the most up-to-date data
      fetchUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to create a new user
  const createUserMutation = useMutation({
    mutationFn: async (userData: { name: string; email: string; username: string; password: string; role: string }) => {
      const res = await apiRequest("POST", "/api/users/register-by-admin", userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: `The ${newUserRole} has been created successfully.`,
      });
      
      // Reset form and close dialog
      setNewUserFormState({
        name: "",
        email: "",
        username: "",
        password: ""
      });
      setNewUserOpen(false);
      
      // Refresh the user list
      fetchUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "User Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Function to fetch users data - can be called anytime to refresh
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Add cache-busting query parameter to prevent caching
      const timestamp = new Date().getTime();
      const response = await apiRequest("GET", `/api/users?_t=${timestamp}`);
      const data = await response.json();
      setUsers(data);
      console.log("Fetched users:", data);
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

  // Check access permissions and fetch users when the component mounts
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

    // Initial data fetch
    fetchUsers();

    // Set up interval to refresh data every 60 seconds
    const intervalId = setInterval(() => {
      fetchUsers();
    }, 60000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
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
            <Button 
              className="flex items-center"
              onClick={() => {
                setNewUserRole("therapist");
                setNewUserOpen(true);
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Therapist
            </Button>
            <Button
              onClick={() => {
                setNewUserRole("admin");
                setNewUserOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-2 w-full md:w-auto">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={fetchUsers}
                  disabled={loading}
                  title="Refresh user data"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                </Button>
              </div>
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
                              onClick={() => setUserToEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setUserToDelete(user)}
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
                          onClick={async () => {
                            try {
                              // Remove client from therapist - API call to update client
                              const res = await apiRequest("PATCH", `/api/users/${client.id}/unassign-therapist`);
                              
                              if (!res.ok) {
                                const errorData = await res.json();
                                throw new Error(errorData.message || "Failed to remove client");
                              }
                              
                              toast({
                                title: "Client Removed",
                                description: `${client.name} has been removed from ${selectedTherapist?.name}`,
                              });
                              
                              // Refresh the data
                              fetchUsers();
                            } catch (error) {
                              console.error("Error removing client:", error);
                              toast({
                                title: "Error",
                                description: error instanceof Error ? error.message : "Failed to remove client",
                                variant: "destructive",
                              });
                            }
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

      {/* Edit User Dialog */}
      <Dialog
        open={!!userToEdit}
        onOpenChange={(open) => !open && setUserToEdit(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>

          {userToEdit && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    defaultValue={userToEdit.name}
                    onChange={(e) => {
                      setUserToEdit({
                        ...userToEdit,
                        name: e.target.value,
                      });
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={userToEdit.email}
                    onChange={(e) => {
                      setUserToEdit({
                        ...userToEdit,
                        email: e.target.value,
                      });
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    defaultValue={userToEdit.username}
                    onChange={(e) => {
                      setUserToEdit({
                        ...userToEdit,
                        username: e.target.value,
                      });
                    }}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Password Management</Label>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full flex items-center justify-center"
                    onClick={() => setResetPassword(true)}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Reset Password to Default
                  </Button>
                  {resetPassword && (
                    <Card className="p-4 border border-amber-200 bg-amber-50">
                      <CardContent className="p-0">
                        <p className="text-sm text-amber-700 mb-2">
                          This will reset the user's password to a default value (123456). The user will need to change it on their next login.
                        </p>
                        <div className="flex justify-end gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setResetPassword(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              if (!userToEdit) return;
                              resetPasswordMutation.mutate(userToEdit.id);
                            }}
                            disabled={resetPasswordMutation.isPending}
                          >
                            {resetPasswordMutation.isPending && (
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            )}
                            Confirm Reset
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToEdit(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!userToEdit) return;
                updateUserMutation.mutate({
                  id: userToEdit.id,
                  name: userToEdit.name,
                  username: userToEdit.username,
                  email: userToEdit.email,
                });
              }}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {userToDelete?.name}'s account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!userToDelete) return;
                deleteUserMutation.mutate(userToDelete.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New User Dialog */}
      <Dialog
        open={newUserOpen}
        onOpenChange={(open) => {
          setNewUserOpen(open);
          if (!open) {
            // Reset form when dialog is closed
            setNewUserFormState({
              name: "",
              email: "",
              username: "",
              password: ""
            });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {newUserRole === "therapist" ? "Add New Therapist" : "Add New Admin"}
            </DialogTitle>
            <DialogDescription>
              Create a new {newUserRole} account.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                className="col-span-3"
                placeholder="Full name"
                value={newUserFormState.name}
                onChange={(e) => setNewUserFormState(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                className="col-span-3"
                type="email"
                placeholder="Email address"
                value={newUserFormState.email}
                onChange={(e) => setNewUserFormState(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                className="col-span-3"
                placeholder="Username for login"
                value={newUserFormState.username}
                onChange={(e) => setNewUserFormState(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                className="col-span-3"
                placeholder="Temporary password"
                value={newUserFormState.password}
                onChange={(e) => setNewUserFormState(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewUserOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                createUserMutation.mutate({
                  ...newUserFormState,
                  role: newUserRole
                });
              }}
              disabled={
                createUserMutation.isPending || 
                !newUserFormState.name ||
                !newUserFormState.email ||
                !newUserFormState.username ||
                !newUserFormState.password
              }
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}