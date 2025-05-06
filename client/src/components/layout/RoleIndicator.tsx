import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useClientContext } from "@/context/ClientContext";

// Client interface from schema
interface Client {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  therapistId: number | null;
}

interface ClientSelectorProps {
  onClientChange?: (clientId: number | null) => void;
}

export default function RoleIndicator({ onClientChange }: ClientSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { viewingClientId, viewingClientName, setViewingClient } = useClientContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch the current viewing client from the database
  useEffect(() => {
    if (user?.role === "therapist") {
      const fetchCurrentViewingClient = async () => {
        try {
          const response = await apiRequest("GET", "/api/users/current-viewing-client");
          const data = await response.json();
          
          if (data.viewingClient) {
            // Set the viewing client in context
            setViewingClient(data.viewingClient.id, data.viewingClient.name);
          }
        } catch (error) {
          console.error("Error fetching current viewing client:", error);
        }
      };
      
      fetchCurrentViewingClient();
    }
  }, [user, setViewingClient]);
  
  // Fetch clients if user is a therapist, or all users if admin
  useEffect(() => {
    if (user?.role === "therapist" || user?.role === "admin") {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          
          // Different endpoints for therapists and admins
          const endpoint = user.role === "admin" 
            ? "/api/users" // Admin sees all users
            : "/api/users/clients"; // Therapist sees only their clients
          
          const response = await apiRequest("GET", endpoint);
          const data = await response.json();
          setClients(data);
        } catch (error) {
          console.error(`Error fetching ${user.role === "admin" ? "users" : "clients"}:`, error);
          toast({
            title: "Error",
            description: `Failed to load ${user.role === "admin" ? "users" : "clients"} list`,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchUsers();
    }
  }, [user, toast]);

  // Handle client selection
  const handleClientSelect = async (clientId: number, clientName: string) => {
    try {
      // First update the viewing client in the database
      const response = await apiRequest("POST", "/api/users/current-viewing-client", { clientId });
      const result = await response.json();
      
      // Update the client context (client-side)
      setViewingClient(clientId, clientName);
      
      if (onClientChange) {
        onClientChange(clientId);
      }
      
      // Show toast to confirm client selection
      toast({
        title: "Client Selected",
        description: `You are now viewing ${clientName}'s data`,
      });
      
      // Force a reload to refresh all queries with the new client
      window.location.reload();
    } catch (error) {
      console.error("Error setting current viewing client:", error);
      toast({
        title: "Error",
        description: "Failed to select client",
        variant: "destructive",
      });
    }
  };

  // Handle returning to own view
  const handleReturnToSelf = async () => {
    console.log("Returning to self view");
    
    try {
      // Update viewing client to null in the database
      const response = await apiRequest("POST", "/api/users/current-viewing-client", { clientId: null });
      const result = await response.json();
      
      console.log("Database updated, cleared current viewing client:", result);
      
      // Clear localStorage (legacy support)
      localStorage.removeItem('viewingClientId');
      localStorage.removeItem('viewingClientName');
      
      // Update context
      setViewingClient(null, null);
      
      if (onClientChange) {
        onClientChange(null);
      }
      
      toast({
        title: "Returned to Self", 
        description: "You are now viewing your own dashboard",
      });
      
      // Force a reload to refresh all queries
      window.location.reload();
    } catch (error) {
      console.error("Error clearing current viewing client:", error);
      toast({
        title: "Error",
        description: "Failed to return to your dashboard",
        variant: "destructive",
      });
    }
  };

  // Don't render anything if user is not logged in
  if (!user) return null;

  // For clients, just show the role badge
  if (user.role === "client") {
    return (
      <div className="flex items-center">
        <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700 border-blue-200">
          Client
        </Badge>
      </div>
    );
  }

  // For therapists, show role badge and client selector
  if (user.role === "therapist") {
    return (
      <div className="flex items-center">
        {viewingClientId ? (
          <div className="flex items-center">
            <Badge variant="outline" className="mr-2 bg-yellow-50 text-yellow-700 border-yellow-200">
              Viewing Client
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                  <span className="truncate max-w-[150px]">{viewingClientName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={handleReturnToSelf}>
                  Return to my dashboard
                </DropdownMenuItem>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Switch Client
                </div>
                {clients.map((client) => (
                  <DropdownMenuItem 
                    key={client.id}
                    onClick={() => handleClientSelect(client.id, client.name)}
                  >
                    {client.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center">
            <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 border-green-200">
              Therapist
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Users className="mr-1 h-4 w-4" />
                  <span>My Clients</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  View Client Data
                </div>
                {loading ? (
                  <div className="flex justify-center p-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : clients.length > 0 ? (
                  clients.map((client) => (
                    <DropdownMenuItem 
                      key={client.id}
                      onClick={() => handleClientSelect(client.id, client.name)}
                    >
                      {client.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No clients found
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  }

  // For admins, show admin badge and all users selector
  if (user.role === "admin") {
    return (
      <div className="flex items-center">
        {viewingClientId ? (
          <div className="flex items-center">
            <Badge variant="outline" className="mr-2 bg-purple-50 text-purple-700 border-purple-200">
              Admin Viewing User
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                  <span className="truncate max-w-[150px]">{viewingClientName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={handleReturnToSelf}>
                  Return to Admin Dashboard
                </DropdownMenuItem>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  View User Data
                </div>
                {loading ? (
                  <div className="flex justify-center p-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : clients.length > 0 ? (
                  clients.map((client) => (
                    <DropdownMenuItem 
                      key={client.id}
                      onClick={() => handleClientSelect(client.id, client.name)}
                    >
                      {client.name} ({client.role})
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No users found
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center">
            <Badge variant="outline" className="mr-2 bg-purple-50 text-purple-700 border-purple-200">
              Administrator
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Users className="mr-1 h-4 w-4" />
                  <span>All Users</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  View User Data
                </div>
                {loading ? (
                  <div className="flex justify-center p-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : clients.length > 0 ? (
                  clients.map((client) => (
                    <DropdownMenuItem 
                      key={client.id}
                      onClick={() => handleClientSelect(client.id, client.name)}
                    >
                      {client.name} ({client.role})
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No users found
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  }

  // Fallback for unknown roles
  return (
    <div className="flex items-center">
      <Badge variant="outline" className="mr-2 bg-gray-50 text-gray-700 border-gray-200">
        {user.role || "User"}
      </Badge>
    </div>
  );
}