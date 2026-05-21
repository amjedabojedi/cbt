import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  clientsLoading: boolean;
  selectedClients: number[];
  onClientsChange: (ids: number[]) => void;
  assignmentNotes: string;
  onNotesChange: (notes: string) => void;
  onAssign: () => void;
  isPending: boolean;
  currentResource: any | null;
}

export default function FeedbackDialog({
  open,
  onOpenChange,
  clients,
  clientsLoading,
  selectedClients,
  onClientsChange,
  assignmentNotes,
  onNotesChange,
  onAssign,
  isPending,
  currentResource,
}: FeedbackDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Resource to Clients</DialogTitle>
          <DialogDescription>
            Select the clients you want to assign this resource to
          </DialogDescription>
        </DialogHeader>

        {clientsLoading ? (
          <div className="py-6 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="py-2 space-y-4">
            <div className="border rounded-md p-3 space-y-3">
              {clients.map((client: any) => (
                <div key={client.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`client-${client.id}`}
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onClientsChange([...selectedClients, client.id]);
                      } else {
                        onClientsChange(selectedClients.filter((id) => id !== client.id));
                      }
                    }}
                  />
                  <label
                    htmlFor={`client-${client.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {client.name || client.username}
                  </label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Notes for Client (Optional)
              </label>
              <Textarea
                placeholder="Add instructions or context for this resource..."
                value={assignmentNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <p>You don't have any clients to assign resources to.</p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={selectedClients.length === 0 || !currentResource || isPending}
            onClick={onAssign}
          >
            {isPending ? "Assigning..." : "Assign Resource"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
