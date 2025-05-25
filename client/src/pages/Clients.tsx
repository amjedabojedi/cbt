import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useClientContext } from "@/context/ClientContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import AppLayout from "@/components/layout/AppLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  Search, 
  BookOpen, 
  Heart, 
  Target, 
  MessageCircle, 
  BarChart3,
  Brain,
  UserPlus,
  User,
  Send,
  Clock,
  RefreshCw,
  Trash2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  therapistId: number | null;
  status: string;
  createdAt: Date;
  currentViewingClientId: number | null;
}

const inviteClientSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type InviteClientFormValues = z.infer<typeof inviteClientSchema>;

export default function Clients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { setViewingClient } = useClientContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/users/clients'],
    enabled: !!user && (user.role === 'therapist' || user.role === 'admin')
  });

  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['/api/invitations'],
    enabled: !!user && (user.role === 'therapist' || user.role === 'admin')
  });

  const inviteForm = useForm<InviteClientFormValues>({
    resolver: zodResolver(inviteClientSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteClientFormValues) => {
      return apiRequest('POST', '/api/auth/invite-client', data);
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent!",
        description: "The client invitation has been sent successfully.",
      });
      setShowInviteDialog(false);
      inviteForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/users/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation.",
        variant: "destructive"
      });
    }
  });

  const onInviteSubmit = (data: InviteClientFormValues) => {
    inviteMutation.mutate(data);
  };

  const handleViewRecords = (client: User) => {
    setViewingClient(client.id, client.name || client.username);
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    navigate("/emotions");
  };

  const handleViewGoals = (client: User) => {
    setViewingClient(client.id, client.name || client.username);
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    navigate("/goals");
  };

  const handleViewJournals = (client: User) => {
    setViewingClient(client.id, client.name || client.username);
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    navigate("/journal");
  };

  const handleViewThoughtRecords = (client: User) => {
    setViewingClient(client.id, client.name || client.username);
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    navigate("/thought-records");
  };

  const handleViewStats = (client: User) => {
    setViewingClient(client.id, client.name || client.username);
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    navigate("/dashboard");
  };

  const handleSendMessage = (client: User) => {
    toast({
      title: "Feature Coming Soon",
      description: "Direct messaging will be available in a future update."
    });
  };

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      return apiRequest('DELETE', `/api/users/clients/${clientId}`);
    },
    onSuccess: () => {
      toast({
        title: "Client Removed",
        description: "The client has been successfully removed from your practice.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/clients'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove client",
        variant: "destructive"
      });
    }
  });

  const handleDeleteClient = (client: User) => {
    if (confirm(`Are you sure you want to remove ${client.name || client.username} from your practice? This action cannot be undone.`)) {
      deleteClientMutation.mutate(client.id);
    }
  };;

  const resendMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return apiRequest('POST', `/api/invitations/${invitationId}/resend`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation Resent!",
        description: "The invitation has been sent again successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation.",
        variant: "destructive"
      });
    }
  });

  const handleResendInvitation = (invitationId: number) => {
    resendMutation.mutate(invitationId);
  };

  const filteredClients = (clients && Array.isArray(clients)) ? clients.filter((client: User) => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Filter out invitations for people who are already registered as active clients
  const filteredInvitations = (invitations && Array.isArray(invitations)) ? invitations.filter((invitation: any) => {
    // Only show pending invitations (standardized status)
    if (invitation.status !== 'pending') {
      return false;
    }
    
    // Check if this email belongs to an existing active client
    const isExistingClient = clients?.some((client: any) => client.email === invitation.email);
    return !isExistingClient;
  }) : [];

  // Group remaining invitations by email to show each email only once
  const uniqueInvitations = filteredInvitations.reduce((acc: any[], invitation: any) => {
    const existingInvitation = acc.find(inv => inv.email === invitation.email);
    if (!existingInvitation) {
      // Add the most recent invitation for this email
      acc.push(invitation);
    } else {
      // Keep the more recent invitation (higher ID or later date)
      if (invitation.id > existingInvitation.id) {
        const index = acc.findIndex(inv => inv.email === invitation.email);
        acc[index] = invitation;
      }
    }
    return acc;
  }, []);

  if (clientsLoading) {
    return (
      <AppLayout title="Clients">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">Loading clients...</div>
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
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Client</DialogTitle>
                <DialogDescription>
                  Send an invitation to a new client to join your practice.
                </DialogDescription>
              </DialogHeader>
              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                  <FormField
                    control={inviteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="client@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={inviteForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={inviteMutation.isPending}
                    >
                      {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search clients by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clients">Active Clients</TabsTrigger>
            <TabsTrigger value="invitations">
              Pending Invitations
              {uniqueInvitations && uniqueInvitations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {uniqueInvitations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {filteredClients?.map((client: User) => (
                <Card key={client.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{client.name || client.username}</CardTitle>
                          <CardDescription className="text-sm">{client.email}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center justify-center"
                        onClick={() => handleViewRecords(client)}
                      >
                        <Heart className="mr-1 h-4 w-4" />
                        Records
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center justify-center"
                        onClick={() => handleViewGoals(client)}
                      >
                        <Target className="mr-1 h-4 w-4" />
                        Goals
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center justify-center"
                        onClick={() => handleViewJournals(client)}
                      >
                        <BookOpen className="mr-1 h-4 w-4" />
                        Journal
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center justify-center"
                        onClick={() => handleViewThoughtRecords(client)}
                      >
                        <Brain className="mr-1 h-4 w-4" />
                        Thoughts
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewStats(client)}
                      >
                        <BarChart3 className="mr-1 h-4 w-4" />
                        Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage(client)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClient(client)}
                        disabled={deleteClientMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredClients?.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "No clients match your search." : "Get started by inviting your first client."}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite First Client
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Invitations
                </CardTitle>
                <CardDescription>
                  Manage client invitations that haven't been accepted yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitationsLoading ? (
                  <div className="text-center py-8">Loading invitations...</div>
                ) : uniqueInvitations && uniqueInvitations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Latest Invitation</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueInvitations.map((invitation: any) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">{invitation.email}</TableCell>
                          <TableCell>{invitation.name}</TableCell>
                          <TableCell>
                            {invitation.createdAt ? new Date(invitation.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id)}
                              disabled={resendMutation.isPending}
                            >
                              {resendMutation.isPending ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              <span className="ml-2">Resend</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
                    <p className="text-gray-500 mb-4">
                      All your invitations have been accepted or you haven't sent any yet.
                    </p>
                    <Button onClick={() => setShowInviteDialog(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Send New Invitation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}