import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientStats, ClientRecentActivity, ClientEmotionRecordsList, ClientJournalsList, ClientThoughtRecordsList, ClientGoalsList } from "@/components/clients/ClientDashboard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  Plus, 
  Search, 
  BookOpen, 
  Heart, 
  Target, 
  MessageCircle, 
  BarChart3,
  Brain,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Lightbulb,
  Send,
  User,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Star,
  Activity
} from "lucide-react";

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

interface ClientStatProps {
  clientId: number;
}

function ClientStats({ clientId }: ClientStatProps) {
  const { data: emotions } = useQuery({
    queryKey: ['/api/users', clientId, 'emotions'],
    enabled: !!clientId
  });

  const { data: thoughts } = useQuery({
    queryKey: ['/api/users', clientId, 'thought-records'],
    enabled: !!clientId
  });

  const { data: journals } = useQuery({
    queryKey: ['/api/users', clientId, 'journal-entries'],
    enabled: !!clientId
  });

  const { data: goals } = useQuery({
    queryKey: ['/api/users', clientId, 'goals'],
    enabled: !!clientId
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{emotions?.length || 0}</div>
        <div className="text-sm text-blue-500">Emotions</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{thoughts?.length || 0}</div>
        <div className="text-sm text-green-500">Thoughts</div>
      </div>
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">{journals?.length || 0}</div>
        <div className="text-sm text-purple-500">Journals</div>
      </div>
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">{goals?.length || 0}</div>
        <div className="text-sm text-orange-500">Goals</div>
      </div>
    </div>
  );
}

function ClientRecentActivity({ clientId }: ClientStatProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500">Recent client activity will appear here</div>
      </CardContent>
    </Card>
  );
}

function ClientEmotionRecordsList({ clientId, limit = 3 }: ClientStatProps & { limit?: number }) {
  const { data: emotions } = useQuery({
    queryKey: ['/api/users', clientId, 'emotions'],
    enabled: !!clientId
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Recent Emotions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {emotions && emotions.length > 0 ? (
          <div className="space-y-2">
            {emotions.slice(0, limit).map((emotion: any) => (
              <div key={emotion.id} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium">{emotion.emotion}</div>
                <div className="text-gray-500">Intensity: {emotion.intensity}/10</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No emotions recorded yet</div>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2"
          onClick={() => {
            const client = { id: clientId } as User;
            // Navigate to emotions page
          }}
        >
          View All Records ({emotions?.length || 0})
        </Button>
      </CardContent>
    </Card>
  );
}

function ClientJournalsList({ clientId, limit = 3 }: ClientStatProps & { limit?: number }) {
  const { data: journals } = useQuery({
    queryKey: ['/api/users', clientId, 'journal-entries'],
    enabled: !!clientId
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          Recent Journals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {journals && journals.length > 0 ? (
          <div className="space-y-2">
            {journals.slice(0, limit).map((journal: any) => (
              <div key={journal.id} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium truncate">{journal.title}</div>
                <div className="text-gray-500">
                  {new Date(journal.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No journal entries yet</div>
        )}
        <Button variant="outline" size="sm" className="w-full mt-2">
          View All Journals ({journals?.length || 0})
        </Button>
      </CardContent>
    </Card>
  );
}

function ClientThoughtRecordsList({ clientId, limit = 3 }: ClientStatProps & { limit?: number }) {
  const { data: thoughts } = useQuery({
    queryKey: ['/api/users', clientId, 'thought-records'],
    enabled: !!clientId
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-green-500" />
          Recent Thought Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        {thoughts && thoughts.length > 0 ? (
          <div className="space-y-2">
            {thoughts.slice(0, limit).map((thought: any) => (
              <div key={thought.id} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium truncate">{thought.automaticThoughts}</div>
                <div className="text-gray-500">
                  {new Date(thought.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No thought records yet</div>
        )}
        <Button variant="outline" size="sm" className="w-full mt-2">
          View All Thoughts ({thoughts?.length || 0})
        </Button>
      </CardContent>
    </Card>
  );
}

function ClientGoalsList({ clientId, limit = 3 }: ClientStatProps & { limit?: number }) {
  const { data: goals } = useQuery({
    queryKey: ['/api/users', clientId, 'goals'],
    enabled: !!clientId
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-500" />
          Active Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {goals && goals.length > 0 ? (
          <div className="space-y-2">
            {goals.slice(0, limit).map((goal: any) => (
              <div key={goal.id} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium truncate">{goal.title}</div>
                <div className="text-gray-500">Status: {goal.status}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No goals set yet</div>
        )}
        <Button variant="outline" size="sm" className="w-full mt-2">
          View All Goals ({goals?.length || 0})
        </Button>
      </CardContent>
    </Card>
  );
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
  const { setViewingClient, viewingClientId } = useClientContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/users/clients'],
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
      return apiRequest('/api/auth/invite-client', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent!",
        description: "The client invitation has been sent successfully.",
      });
      setShowInviteDialog(false);
      inviteForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/users/clients'] });
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

  const handleViewProfile = (client: User) => {
    setViewingClient(client.id, client.name || client.username);
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    navigate("/profile");
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

  const filteredClients = clients ? clients.filter((client: User) => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </AppLayout>
  );
}