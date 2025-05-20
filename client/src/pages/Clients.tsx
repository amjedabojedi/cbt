import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "@shared/schema";
import { useClientContext } from "@/context/ClientContext";
import { useLocation, useParams } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { 
  HeartPulse, 
  Sparkles, 
  BrainCircuit, 
  Loader2,
  FileText,
  Flag,
  Eye,
  Send,
  Clock,
  Calendar,
  CheckCircle,
  Heart, // Using the Lucide Heart component
  MoreHorizontal,
  UserPlus,
  BarChart,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Client Stats Component
interface ClientStatProps {
  clientId: number;
}

function ClientStats({ clientId }: ClientStatProps) {
  // Fetch emotion records count for this client
  const { data: emotionCount, isLoading: loadingEmotions } = useQuery<{ totalCount: number }>({
    queryKey: [`/api/users/${clientId}/emotions/count`],
    enabled: !!clientId,
  });

  // Fetch journal entries count for this client
  const { data: journalCount, isLoading: loadingJournals } = useQuery<{ totalCount: number }>({
    queryKey: [`/api/users/${clientId}/journals/count`],
    enabled: !!clientId,
  });

  // Fetch thought records count for this client
  const { data: thoughtsCount, isLoading: loadingThoughts } = useQuery<{ totalCount: number }>({
    queryKey: [`/api/users/${clientId}/thoughts/count`],
    enabled: !!clientId,
  });

  const isLoading = loadingEmotions || loadingJournals || loadingThoughts;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-30" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center text-sm">
        <HeartPulse className="text-blue-500 h-4 w-4 mr-1" />
        <span>{emotionCount?.totalCount || 0} Emotion Records</span>
      </div>
      <div className="flex items-center text-sm">
        <FileText className="text-purple-500 h-4 w-4 mr-1" />
        <span>{journalCount?.totalCount || 0} Journal Entries</span>
      </div>
      <div className="flex items-center text-sm">
        <BrainCircuit className="text-green-500 h-4 w-4 mr-1" />
        <span>{thoughtsCount?.totalCount || 0} Thought Records</span>
      </div>
    </div>
  );
}

// Component to display client recent activity
function ClientRecentActivity({ clientId }: ClientStatProps) {
  // Fetch recent activity for this client
  const { data: recentActivity, isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/recent-activity`],
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!recentActivity || recentActivity.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-neutral-500">No recent activity found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentActivity.map((activity, index) => {
        let icon;
        let colorClass;
        
        // Determine icon and color based on activity type
        switch(activity.type) {
          case 'emotion':
            icon = <Heart className="h-4 w-4" />;
            colorClass = 'bg-blue-100 text-blue-600';
            break;
          case 'journal':
            icon = <FileText className="h-4 w-4" />;
            colorClass = 'bg-purple-100 text-purple-600';
            break;
          case 'thought_record':
            icon = <BrainCircuit className="h-4 w-4" />;
            colorClass = 'bg-green-100 text-green-600';
            break;
          case 'goal':
            icon = <Flag className="h-4 w-4" />;
            colorClass = 'bg-amber-100 text-amber-600';
            break;
          default:
            icon = <Clock className="h-4 w-4" />;
            colorClass = 'bg-gray-100 text-gray-600';
        }
        
        return (
          <div key={index} className="flex items-start">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 ${colorClass}`}>
              {icon}
            </div>
            <div>
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm text-neutral-500">
                {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Unknown time'}
              </p>
              {activity.description && (
                <p className="text-sm mt-1">{activity.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Component to display client emotion records
function ClientEmotionRecordsList({ clientId, limit = 3 }: ClientStatProps & { limit?: number }) {
  // Fetch emotion records for this client
  const { data: emotions, isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/emotions`],
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!emotions || emotions.length === 0) {
    return (
      <div className="text-center py-2">
        <p className="text-neutral-500">No emotion records found.</p>
      </div>
    );
  }

  // Display all emotion records with a scrollable container if needed
  // For the client profile view, we'll still limit the initial display
  const recordsToShow = limit ? emotions.slice(0, limit) : emotions;
  const showViewAllButton = limit && emotions.length > limit;
  
  return (
    <div className="flex flex-col space-y-2">
      {/* Scrollable container for emotion records */}
      <div className={`space-y-3 ${!limit ? "max-h-[400px] pr-2 overflow-y-auto custom-scrollbar" : ""}`}>
        {recordsToShow.map((emotion, index) => (
          <div key={index} className="flex items-start bg-blue-50 p-3 rounded-md">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5 flex-shrink-0">
              <Heart className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">
                {emotion.name} {emotion.intensity && <span className="text-blue-600">({emotion.intensity}/10)</span>}
              </p>
              <p className="text-sm text-neutral-500">
                {emotion.createdAt ? formatDistanceToNow(new Date(emotion.createdAt), { addSuffix: true }) : 'Unknown time'}
              </p>
              {emotion.situation && (
                <p className="text-sm mt-1 break-words">{emotion.situation}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Show "View All" button if we have more records than the limit */}
      {showViewAllButton && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2"
          onClick={() => {
            const client = { id: clientId } as User;
            handleViewRecords(client);
          }}
        >
          View All Records ({emotions.length})
        </Button>
      )}
    </div>
  );
}

// Component to display client journal entries
function ClientJournalsList({ clientId, limit = 3 }: ClientStatProps & { limit?: number }) {
  // Fetch journal entries for this client
  const { data: journals, isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/journals`],
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!journals || journals.length === 0) {
    return (
      <div className="text-center py-2">
        <p className="text-neutral-500">No journal entries found.</p>
      </div>
    );
  }

  // Display only the most recent entries up to the limit
  const recentJournals = journals.slice(0, limit);

  return (
    <div className="space-y-3">
      {recentJournals.map((journal, index) => (
        <div key={index} className="flex items-start bg-purple-50 p-3 rounded-md">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3 mt-0.5">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{journal.title || "Journal Entry"}</p>
            <p className="text-sm text-neutral-500">
              {journal.createdAt ? formatDistanceToNow(new Date(journal.createdAt), { addSuffix: true }) : 'Unknown time'}
            </p>
            {journal.content && (
              <p className="text-sm mt-1 line-clamp-2">{journal.content.substring(0, 100)}{journal.content.length > 100 ? '...' : ''}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Component to display client thought records
function ClientThoughtRecordsList({ clientId, limit = 3 }: ClientStatProps & { limit?: number }) {
  // Fetch thought records for this client
  const { data: thoughts, isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/thoughts`],
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!thoughts || thoughts.length === 0) {
    return (
      <div className="text-center py-2">
        <p className="text-neutral-500">No thought records found.</p>
      </div>
    );
  }

  // Display only the most recent records up to the limit
  const recentThoughts = thoughts.slice(0, limit);

  return (
    <div className="space-y-3">
      {recentThoughts.map((thought, index) => (
        <div key={index} className="flex items-start bg-green-50 p-3 rounded-md">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-0.5">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{thought.situation || "Thought Record"}</p>
            <p className="text-sm text-neutral-500">
              {thought.createdAt ? formatDistanceToNow(new Date(thought.createdAt), { addSuffix: true }) : 'Unknown time'}
            </p>
            {thought.automaticThoughts && (
              <p className="text-sm mt-1 line-clamp-1">{thought.automaticThoughts}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Component to display client goals
function ClientGoalsList({ clientId, limit = 3 }: ClientStatProps & { limit?: number }) {
  // Fetch goals for this client
  const { data: goals, isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/goals`],
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <div className="text-center py-2">
        <p className="text-neutral-500">No goals found.</p>
      </div>
    );
  }

  // Display only the most recent goals up to the limit
  const recentGoals = goals.slice(0, limit);

  const getStatusBadge = (status: any) => {
    switch(status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-0">Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-0">In Progress</Badge>;
      case 'approved':
        return <Badge className="bg-purple-100 text-purple-800 border-0">Approved</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-0">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-0">Unknown</Badge>;
    }
  };

  const calculateProgress = (goal: any) => {
    if (!goal.milestones || goal.milestones.length === 0) return 0;
    const completed = goal.milestones.filter((m: any) => m.completed).length;
    return Math.round((completed / goal.milestones.length) * 100);
  };

  return (
    <div className="space-y-3">
      {recentGoals.map((goal, index) => {
        const progress = calculateProgress(goal);
        const milestonesCount = goal.milestones?.length || 0;
        const completedMilestones = goal.milestones?.filter((m: any) => m.completed)?.length || 0;
        
        return (
          <div key={index} className="border rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">{goal.title}</h4>
              {getStatusBadge(goal.status)}
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${progress}%` }} 
              ></div>
            </div>
            <p className="text-sm text-neutral-500">
              {completedMilestones} of {milestonesCount} milestones completed
            </p>
          </div>
        );
      })}
    </div>
  );
}

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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  
  // Use client context directly at the top level
  let clientContext;
  try {
    clientContext = useClientContext();
  } catch (error) {
    console.error("Error fetching current viewing client:", error);
    // Create a fallback context
    clientContext = {
      viewingClientId: null,
      viewingClientName: null,
      setViewingClient: (id: number | null, name: string | null) => {
        localStorage.setItem('viewingClientId', id?.toString() || '');
        localStorage.setItem('viewingClientName', name || '');
      },
      isViewingClient: false,
      loading: false
    };
  }
  
  const { viewingClientId, setViewingClient } = clientContext;
  
  const [isInviting, setIsInviting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [clientToDelete, setClientToDelete] = useState<User | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [_, navigate] = useLocation();
  const params = useParams();
  const clientIdFromUrl = params.clientId ? parseInt(params.clientId) : null;
  
  // Invite client form - always initialize regardless of role to avoid hook issues
  const inviteForm = useForm<InviteClientFormValues>({
    resolver: zodResolver(inviteClientSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });
  
  // Helper function to view a client's records
  const handleViewRecords = (client: User) => {
    console.log("View Records clicked for client:", client);
    setViewingClient(client.id, client.name || client.username);
    // Save to localStorage as fallback
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    navigate("/emotions");
  };
  
  // Helper function to view a client's goals
  const handleViewGoals = (client: User) => {
    console.log("View Goals clicked for client:", client);
    setViewingClient(client.id, client.name || client.username);
    // Save to localStorage as fallback
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    navigate("/goals");
  };
  
  // Helper function to view a client's journals
  const handleViewJournals = (client: User) => {
    console.log("View Journals clicked for client:", client);
    setViewingClient(client.id, client.name || client.username);
    // Save to localStorage as fallback
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    navigate("/journal");
  };
  
  // Helper function to view a client's thought records
  const handleViewThoughtRecords = (client: User) => {
    console.log("View Thought Records clicked for client:", client);
    setViewingClient(client.id, client.name || client.username);
    // Save to localStorage as fallback
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    navigate("/thoughts");
  };
  
  // Helper function to view a client's dashboard with stats
  const handleViewStats = (client: User) => {
    console.log("View Stats clicked for client:", client);
    setViewingClient(client.id, client.name || client.username);
    // Save to localStorage as fallback
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    navigate("/dashboard");
  };
  
  // Invite client mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: InviteClientFormValues) => {
      const response = await apiRequest("POST", "/api/users/invite-client", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Client Invited",
        description: "The invitation has been sent to the client.",
      });
      inviteForm.reset();
      setIsInviting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users/clients"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation.",
        variant: "destructive",
      });
    },
  });
  
  // Submit handler for invite form
  const onInviteSubmit = (data: InviteClientFormValues) => {
    inviteMutation.mutate(data);
  };
  
  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await apiRequest("DELETE", `/api/users/clients/${clientId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove client");
      }
      return clientId;
    },
    onSuccess: (clientId: number) => {
      toast({
        title: "Client Removed",
        description: "The client has been removed from your list."
      });
      
      // If we were viewing this client, reset the viewing client
      if (viewingClientId === clientId) {
        setViewingClient(null, null);
        localStorage.removeItem('viewingClientId');
        localStorage.removeItem('viewingClientName');
      }
      
      // Close any dialogs
      setIsConfirmingDelete(false);
      setClientToDelete(null);
      
      // Refresh the clients list
      queryClient.invalidateQueries({ queryKey: ["/api/users/clients"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove client.",
        variant: "destructive"
      });
      setIsConfirmingDelete(false);
    }
  });
  
  // Handler for deleting a client
  const handleDeleteClient = (client: User) => {
    setClientToDelete(client);
    setIsConfirmingDelete(true);
  };
  
  // Confirm deletion
  const confirmDeleteClient = () => {
    if (clientToDelete) {
      deleteClientMutation.mutate(clientToDelete.id);
    }
  };
  
  // Create reliable sample client data
  const sampleClients: User[] = [
    { 
      id: 101, 
      username: "client1", 
      email: "client1@example.com", 
      name: "Sarah Johnson", 
      role: "client", 
      therapistId: user?.id || 20,
      status: "active",
      createdAt: new Date('2025-01-15')
    },
    { 
      id: 102, 
      username: "client2", 
      email: "client2@example.com", 
      name: "Michael Chen", 
      role: "client", 
      therapistId: user?.id || 20,
      status: "active",
      createdAt: new Date('2025-02-20')
    },
    { 
      id: 103, 
      username: "client3", 
      email: "client3@example.com", 
      name: "Jessica Williams", 
      role: "client", 
      therapistId: user?.id || 20,
      status: "active",
      createdAt: new Date('2025-03-10')
    },
    { 
      id: 104, 
      username: "client4", 
      email: "client4@example.com", 
      name: "David Rodriguez", 
      role: "client", 
      therapistId: user?.id || 20,
      status: "pending",
      createdAt: new Date('2025-04-05')
    }
  ] as User[];
  
  // Fetch clients data - using a simplified approach for stability
  const { data: apiClients, isLoading } = useQuery<User[]>({
    queryKey: ["/api/public/clients"],
    // Always enable this query since we need to show clients
    enabled: true,
    // Use a more resilient approach to ensure data is always available
    queryFn: async () => {
      // No special treatment for specific user IDs - query the database for any therapist
      
      try {
        // Add user ID header for authentication
        const headers: Record<string, string> = {
          "Content-Type": "application/json"
        };
        
        if (user?.id) {
          console.log("Adding backup auth headers to query:", { 
            userId: user.id,
            url: "/api/public/clients" 
          });
          headers["X-User-ID"] = user.id.toString();
        }
        
        const response = await fetch("/api/public/clients", {
          method: "GET",
          credentials: "include",
          headers
        });
        
        // Handle any response, even errors, to prevent UI breaks
        let data = [];
        try {
          data = await response.json();
        } catch (err) {
          console.log("Error parsing JSON response, using empty array");
        }
        
        if (Array.isArray(data)) {
          console.log("Client data from API:", data);
          return data;
        } else {
          console.log("No clients returned from API or invalid format");
          return [];
        }
      } catch (error) {
        console.error("Query failed for /api/public/clients:", error);
        // Don't use hardcoded data, return an empty array for proper error handling
        return [];
      }
    }
  });
  
  // Process API clients data to normalize snake_case to camelCase
  const clients = React.useMemo(() => {
    if (!apiClients || !Array.isArray(apiClients)) return [];
    
    // Map the data to normalize field names - backend should already format these correctly
    // but we'll handle both formats for resilience
    return apiClients.map(client => ({
      id: client.id,
      username: client.username,
      email: client.email,
      name: client.name,
      role: client.role,
      // Use therapistId field consistently (backend now normalizes this)
      therapistId: client.therapistId || client.therapist_id || null,
      status: client.status || 'active', // Default to active if not specified
      // Use createdAt field consistently
      createdAt: client.createdAt || (client.created_at ? new Date(client.created_at) : new Date()),
      // Other normalized fields
      currentViewingClientId: client.currentViewingClientId || client.current_viewing_client_id || null
    }));
  }, [apiClients]);
  
  // If there's a client ID in the URL, find that client in the list and show their details
  useEffect(() => {
    if (clientIdFromUrl && clients.length > 0) {
      const client = clients.find(c => c.id === clientIdFromUrl);
      if (client) {
        setSelectedClient(client);
        console.log("Selected client from URL:", client);
      }
    }
  }, [clientIdFromUrl, clients]);
  
  console.log("Client data from API:", clients);
  
  // Filter clients based on active tab, ensuring we handle both camelCase and snake_case DB fields
  const filteredClients = clients.filter((client) => {
    if (activeTab === "all") return true;
    
    // Check if property exists in either format (camelCase or snake_case)
    const status = client.status || client.status;
    
    if (activeTab === "active") return status === "active";
    if (activeTab === "pending") return status === "pending";
    return true;
  });
  
  // Function to view client profile
  const handleViewProfile = (client: User) => {
    console.log("View Profile clicked for client:", client);
    setSelectedClient(client);
  };
  
  // Function to handle sending a message to client
  const handleSendMessage = (client: User) => {
    console.log("Send Message clicked for client:", client);
    // Placeholder for message functionality
    toast({
      title: "Coming Soon",
      description: "Messaging functionality will be available soon.",
    });
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Clients</h1>
            <p className="text-muted-foreground">
              Manage your therapeutic relationships
            </p>
          </div>
          
          {(user?.role === "therapist" || user?.role === "admin") && (
            <Button onClick={() => setIsInviting(true)} disabled={inviteMutation.isPending}>
              <UserPlus className="h-4 w-4 mr-2" />
              {inviteMutation.isPending ? "Inviting..." : "Invite Client"}
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all">All Clients</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Your Clients</CardTitle>
                <CardDescription>
                  {filteredClients.length} client{filteredClients.length === 1 ? '' : 's'} in total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Member Since</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No clients found. Invite clients to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name || client.username}</TableCell>
                          <TableCell>
                            {client.status === "pending" ? (
                              <Badge className="bg-amber-100 text-amber-800 border-0">Pending</Badge>
                            ) : client.role === "client" ? (
                              <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800 border-0">{client.role}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <ClientStats clientId={client.id} />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleViewProfile(client)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleViewRecords(client)}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Emotion Records
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleViewJournals(client)}
                                >
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
                                    className="h-4 w-4 mr-2"
                                  >
                                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                                    <path d="M9 9h1" />
                                    <path d="M9 13h6" />
                                    <path d="M9 17h6" />
                                  </svg>
                                  View Journals
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleViewThoughtRecords(client)}
                                >
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
                                    className="h-4 w-4 mr-2"
                                  >
                                    <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                                  </svg>
                                  View Thought Records
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleViewGoals(client)}
                                >
                                  <Flag className="h-4 w-4 mr-2" />
                                  View Goals
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleViewStats(client)}
                                >
                                  <BarChart className="h-4 w-4 mr-2" />
                                  View Stats
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleSendMessage(client)}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  className="cursor-pointer text-red-600"
                                  onClick={() => handleDeleteClient(client)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove Client
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="active">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Active Clients</CardTitle>
                <CardDescription>
                  {filteredClients.length} active client{filteredClients.length === 1 ? '' : 's'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Member Since</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          No active clients found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name || client.username}</TableCell>
                          <TableCell>
                            {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <ClientStats clientId={client.id} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewProfile(client)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  {filteredClients.length} pending invitation{filteredClients.length === 1 ? '' : 's'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Invited On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          No pending invitations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.email}</TableCell>
                          <TableCell>
                            {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Send className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Invite Client Dialog */}
        <Dialog open={isInviting} onOpenChange={setIsInviting}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a New Client</DialogTitle>
              <DialogDescription>
                Send an invitation email to your client to join the platform.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...inviteForm}>
              <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)}>
                <FormField
                  control={inviteForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="mb-4">
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
                    <FormItem className="mb-4">
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="client@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        They will receive an invitation via email.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button variant="outline" type="button" onClick={() => setIsInviting(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Client Profile Dialog */}
        {selectedClient && (
          <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Client Profile</DialogTitle>
                <DialogDescription>
                  Viewing details for {selectedClient.name} <span className="text-blue-500">({selectedClient.email})</span>
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center text-3xl font-medium text-primary mb-4">
                      {selectedClient.name.charAt(0)}
                    </div>
                    <h2 className="text-xl font-bold">{selectedClient.name}</h2>
                    <p className="text-neutral-500">{selectedClient.email}</p>
                    
                    {viewingClientId === selectedClient.id ? (
                      <Badge className="mt-2 bg-blue-100 text-blue-800 border-0">
                        Currently Viewing
                      </Badge>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setViewingClient(selectedClient.id, selectedClient.name || selectedClient.username);
                          localStorage.setItem('viewingClientId', selectedClient.id.toString());
                          localStorage.setItem('viewingClientName', selectedClient.name || selectedClient.username);
                          toast({
                            title: "Client Selected",
                            description: `Now viewing ${selectedClient.name}'s data.`
                          });
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Set as Active Client
                      </Button>
                    )}
                    
                    <div className="mt-4 space-y-2 w-full">
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
                  <div className="mt-4 space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Client Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedClient && (
                          <ClientStats clientId={selectedClient.id} />
                        )}
                        <div className="space-y-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Member Since:</span>
                            <span className="font-medium">
                              {selectedClient?.createdAt 
                                ? new Date(selectedClient.createdAt).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedClient && (
                          <ClientRecentActivity clientId={selectedClient.id} />
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Quick Actions */}
                    {selectedClient && (
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => handleViewRecords(selectedClient)}
                          variant="outline"
                          size="sm"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Emotion Records
                        </Button>
                        
                        <Button 
                          onClick={() => handleViewJournals(selectedClient)}
                          variant="outline"
                          size="sm"
                        >
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
                            className="mr-2 h-4 w-4"
                          >
                            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                            <path d="M9 9h1" />
                            <path d="M9 13h6" />
                            <path d="M9 17h6" />
                          </svg>
                          View Journals
                        </Button>
                        
                        <Button 
                          onClick={() => handleViewThoughtRecords(selectedClient)}
                          variant="outline"
                          size="sm"
                        >
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
                            className="mr-2 h-4 w-4"
                          >
                            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                          </svg>
                          View Thought Records
                        </Button>
                        
                        <Button 
                          onClick={() => handleViewGoals(selectedClient)}
                          variant="outline"
                          size="sm"
                        >
                          <Flag className="mr-2 h-4 w-4" />
                          View Goals
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Delete Client Confirmation Dialog */}
        <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Remove Client
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {clientToDelete?.name || clientToDelete?.username}? 
                This will unlink the client from your account. Their account and data will still exist, 
                but you will no longer have access to their records.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsConfirmingDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteClient}
                disabled={deleteClientMutation.isPending}
              >
                {deleteClientMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Client
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}