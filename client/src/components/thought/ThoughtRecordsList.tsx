import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThoughtRecord } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit, Eye, Trash2 } from "lucide-react";

interface ThoughtRecordsListProps {
  limit?: number;
  onEditRecord?: (record: ThoughtRecord) => void;
}

export default function ThoughtRecordsList({ limit, onEditRecord }: ThoughtRecordsListProps) {
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<ThoughtRecord | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ThoughtRecord | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch thought records
  const { data: thoughtRecords, isLoading, error } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/thoughts`] : [],
    enabled: !!user,
  });
  
  // Delete thought record mutation
  const deleteThoughtMutation = useMutation({
    mutationFn: async (recordId: number) => {
      if (!user) throw new Error('User not authenticated');
      return apiRequest('DELETE', `/api/users/${user.id}/thoughts/${recordId}`);
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/thoughts`] });
      
      toast({
        title: "Record deleted",
        description: "The thought record has been deleted successfully.",
        variant: "default",
      });
      
      setRecordToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error) => {
      console.error('Error deleting thought record:', error);
      toast({
        title: "Error",
        description: "Failed to delete the record. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle view details
  const handleViewDetails = (record: ThoughtRecord) => {
    setSelectedRecord(record);
  };
  
  // Handle edit
  const handleEditRecord = (record: ThoughtRecord) => {
    if (onEditRecord) {
      onEditRecord(record);
    }
  };
  
  // Handle delete
  const handleDeleteClick = (record: ThoughtRecord) => {
    setRecordToDelete(record);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (recordToDelete) {
      deleteThoughtMutation.mutate(recordToDelete.id);
    }
  };
  
  // Format date for display
  const formatDate = (date: string | Date) => {
    const recordDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (recordDate.toDateString() === today.toDateString()) {
      return `Today, ${format(recordDate, "h:mm a")}`;
    } else if (recordDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(recordDate, "h:mm a")}`;
    } else {
      return format(recordDate, "MMM d, h:mm a");
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thought Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thought Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-red-500">
            Error loading thought records. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const displayRecords = limit && !showFullHistory && thoughtRecords 
    ? thoughtRecords.slice(0, limit) 
    : thoughtRecords;
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Thought Records</CardTitle>
            <CardDescription>
              Your thought records and reflections
            </CardDescription>
          </div>
          {limit && thoughtRecords && thoughtRecords.length > limit && (
            <Button 
              variant="ghost" 
              onClick={() => setShowFullHistory(true)}
              className="text-sm text-primary hover:text-primary-dark"
            >
              View All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!thoughtRecords || thoughtRecords.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-neutral-500">No thought records yet.</p>
              <p className="text-sm text-neutral-400 mt-1">
                Add reflections to your emotions to start building thought records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Automatic Thoughts</TableHead>
                    <TableHead>Cognitive Distortions</TableHead>
                    <TableHead>Alternative Thoughts</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRecords?.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(record.createdAt)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {record.automaticThoughts}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.cognitiveDistortions.slice(0, 2).join(", ")}
                        {record.cognitiveDistortions.length > 2 && "..."}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {record.alternativeThoughts}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditRecord(record)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewDetails(record)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteClick(record)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Record Details Dialog */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thought Record Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Date & Time</h4>
                <p>{formatDate(selectedRecord.createdAt)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Automatic Thoughts</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedRecord.automaticThoughts}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Cognitive Distortions</h4>
                <ul className="list-disc list-inside text-sm">
                  {selectedRecord.cognitiveDistortions.map((distortion, index) => (
                    <li key={index}>{distortion}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Evidence For</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedRecord.evidenceFor}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Evidence Against</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedRecord.evidenceAgainst}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Alternative Thoughts</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedRecord.alternativeThoughts}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Reflection</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedRecord.reflection || "No reflection added"}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Full History Dialog */}
      <Dialog open={showFullHistory} onOpenChange={setShowFullHistory}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thought Record History</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Automatic Thoughts</TableHead>
                  <TableHead>Cognitive Distortions</TableHead>
                  <TableHead>Alternative Thoughts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thoughtRecords?.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(record.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {record.automaticThoughts}
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.cognitiveDistortions.slice(0, 2).join(", ")}
                      {record.cognitiveDistortions.length > 2 && "..."}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {record.alternativeThoughts}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            handleEditRecord(record);
                            setShowFullHistory(false);
                          }}
                          className="text-primary hover:text-primary-dark"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowFullHistory(false);
                          }}
                          className="text-primary hover:text-primary-dark"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            handleDeleteClick(record);
                            setShowFullHistory(false);
                          }}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thought Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this thought record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteThoughtMutation.isPending ? 
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </div> : 
                "Delete"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}