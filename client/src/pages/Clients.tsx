import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, MoreHorizontal, Eye, FileText, Flag, Send } from "lucide-react";

// Schema for client invitation
const inviteClientSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type InviteClientFormValues = z.infer<typeof inviteClientSchema>;

export default function Clients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviting, setIsInviting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Check if user is a therapist
  const isTherapist = user?.role === "therapist";
  
  // If not a therapist, show access denied
  if (!isTherapist) {
    return (
      <AppLayout title="Clients">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-600"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Access Denied</h3>
              <p className="text-neutral-500 text-center max-w-md">
                This page is only accessible to therapists. If you believe this is an error, please contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  // Invite client form
  const inviteForm = useForm<InviteClientFormValues>({
    resolver: zodResolver(inviteClientSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });
  
  // Fetch clients
  const { data: clients, isLoading, error } = useQuery({
    queryKey: [`/api/users/clients`],
    enabled: !!user && user.role === "therapist",
  });
  
  // Invite client mutation (mock - would send email invitation in real app)
  const inviteClientMutation = useMutation({
    mutationFn: async (data: InviteClientFormValues) => {
      // In a real application, this would send an invitation email
      // For now, we'll create a client user directly
      const response = await apiRequest(
        "POST",
        "/api/auth/register",
        {
          ...data,
          username: data.email.split("@")[0], // Generate username from email
          password: "temppassword123", // In real app, this would be a generated secure password
          role: "client",
          therapistId: user?.id,
        }
      );
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/clients`] });
      setIsInviting(false);
      inviteForm.reset();
      toast({
        title: "Client Invited",
        description: "An invitation has been sent to the client.",
      });
    },
    onError: (error) => {
      console.error("Error inviting client:", error);
      toast({
        title: "Error",
        description: "Failed to invite client. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle client invitation form submission
  const onSubmitInvite = (data: InviteClientFormValues) => {
    inviteClientMutation.mutate(data);
  };
  
  // Filter clients based on active tab
  const filteredClients = clients?.filter(client => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return client.status === "active"; // Would need a status field
    if (activeTab === "pending") return client.status === "pending"; // Would need a status field
    return true;
  });
  
  if (isLoading) {
    return (
      <AppLayout title="Clients">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (error) {
    return (
      <AppLayout title="Clients">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-red-500">
                Error loading clients. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Clients">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">My Clients</h1>
            <p className="text-neutral-500">
              Manage your client relationships and progress
            </p>
          </div>
          
          <Dialog open={isInviting} onOpenChange={setIsInviting}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a New Client</DialogTitle>
                <DialogDescription>
                  Send an invitation email to your client to join the platform
                </DialogDescription>
              </DialogHeader>
              
              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(onSubmitInvite)} className="space-y-4">
                  <FormField
                    control={inviteForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={inviteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="client@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your client will receive an invitation email at this address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsInviting(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={inviteClientMutation.isPending}
                    >
                      {inviteClientMutation.isPending ? "Sending Invitation..." : "Send Invitation"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all">All Clients</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>
            
            <div className="relative">
              <Input
                placeholder="Search clients..."
                className="w-64 pl-8"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-neutral-400"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
          
          <TabsContent value="all" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {clients?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No clients yet</h3>
                    <p className="text-neutral-500 max-w-md mx-auto mb-6">
                      Start by inviting your clients to join the platform and collaborate on their mental health journey.
                    </p>
                    <Button onClick={() => setIsInviting(true)}>
                      Invite Your First Client
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients?.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="font-medium">{client.name}</div>
                          </TableCell>
                          <TableCell>
                            {client.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-neutral-500">2 hours ago</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full" 
                                  style={{ width: '60%' }} 
                                ></div>
                              </div>
                              <span className="text-xs text-neutral-500">60%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="cursor-pointer" onClick={() => setSelectedClient(client)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Records
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Flag className="h-4 w-4 mr-2" />
                                  View Goals
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-neutral-500">
                  Filter shows active clients only
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-neutral-500">
                  Filter shows pending invitations
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Client Profile Dialog */}
        {selectedClient && (
          <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Client Profile</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center text-3xl font-medium text-primary mb-4">
                      {selectedClient.name.charAt(0)}
                    </div>
                    <h2 className="text-xl font-bold">{selectedClient.name}</h2>
                    <p className="text-neutral-500">{selectedClient.email}</p>
                    
                    <div className="mt-6 space-y-2 w-full">
                      <Button className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                      <Button variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <Tabs defaultValue="overview">
                    <TabsList className="w-full">
                      <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                      <TabsTrigger value="records" className="flex-1">Records</TabsTrigger>
                      <TabsTrigger value="goals" className="flex-1">Goals</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="mt-4 space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Client Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Records:</span>
                              <span className="font-medium">24</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Active Goals:</span>
                              <span className="font-medium">3</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Last Activity:</span>
                              <span className="font-medium">2 hours ago</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Member Since:</span>
                              <span className="font-medium">Jan 15, 2023</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-start">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                                <Heart className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">Recorded emotion: <span className="text-blue-600">Anxious (7/10)</span></p>
                                <p className="text-sm text-neutral-500">2 hours ago</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3 mt-0.5">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">Completed a thought record</p>
                                <p className="text-sm text-neutral-500">Yesterday, 3:45 PM</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-0.5">
                                <Flag className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">Updated goal: <span className="text-green-600">Morning Meditation</span></p>
                                <p className="text-sm text-neutral-500">Jan 20, 2023</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="records" className="mt-4">
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-center text-neutral-500">
                            Client records would appear here
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="goals" className="mt-4">
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-center text-neutral-500">
                            Client goals would appear here
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}

// Heart icon component
function Heart(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
