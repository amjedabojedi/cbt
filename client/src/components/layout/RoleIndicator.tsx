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

  // Fetch clients if user is a therapist
  useEffect(() => {
    if (user?.role === "therapist") {
      const fetchClients = async () => {
        try {
          setLoading(true);
          const response = await apiRequest("GET", "/api/users/clients");
          const data = await response.json();
          setClients(data);
        } catch (error) {
          console.error("Error fetching clients:", error);
          toast({
            title: "Error",
            description: "Failed to load clients list",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchClients();
    }
  }, [user, toast]);

  // Handle client selection
  const handleClientSelect = (clientId: number, clientName: string) => {
    setViewingClient(clientId, clientName);
    
    if (onClientChange) {
      onClientChange(clientId);
    }
    
    // Show toast to confirm client selection
    toast({
      title: "Client Selected",
      description: `You are now viewing ${clientName}'s data`,
    });
  };

  // Handle returning to own view
  const handleReturnToSelf = () => {
    setViewingClient(null, null);
    
    if (onClientChange) {
      onClientChange(null);
    }
    
    toast({
      title: "Returned to Self",
      description: "You are now viewing your own dashboard",
    });
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

  // For admins, show admin badge
  return (
    <div className="flex items-center">
      <Badge variant="outline" className="mr-2 bg-purple-50 text-purple-700 border-purple-200">
        Administrator
      </Badge>
    </div>
  );
}