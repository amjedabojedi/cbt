import { useClientContext } from "@/context/ClientContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ChevronLeft, Users } from "lucide-react";

export function BackToClientsButton() {
  const { viewingClientId, viewingClientName, setViewingClient } = useClientContext();
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Only show if a therapist is viewing a client's data
  if (!viewingClientId) return null;

  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100"
        onClick={() => {
          // Clear the viewing client
          setViewingClient(null, null);
          
          // Clear from localStorage
          localStorage.removeItem('viewingClientId');
          localStorage.removeItem('viewingClientName');
          
          // Navigate back to clients page
          navigate("/clients");
          
          toast({
            title: "Returned to clients",
            description: "You're now viewing your client list.",
          });
        }}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        <Users className="mr-1 h-4 w-4" />
        Back to Clients
      </Button>
      {viewingClientName && (
        <div className="mt-1 text-sm text-neutral-500">
          Currently viewing: <span className="font-semibold text-primary">{viewingClientName}</span>
        </div>
      )}
    </div>
  );
}