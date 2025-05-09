import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AiRecommendation } from "@shared/schema";
import { RecommendationItem } from "./RecommendationItem";
import { RecommendationApprovalForm } from "./RecommendationApprovalForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface RecommendationListProps {
  userId: number;
  isTherapistView?: boolean;
  pendingOnly?: boolean;
}

export function RecommendationList({ 
  userId, 
  isTherapistView = false,
  pendingOnly = false
}: RecommendationListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedRecommendation, setSelectedRecommendation] = useState<AiRecommendation | null>(null);
  
  // Query to fetch recommendations
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: [pendingOnly ? '/api/therapist/recommendations/pending' : `/api/users/${userId}/recommendations`],
    queryFn: () => {
      const url = pendingOnly 
        ? '/api/therapist/recommendations/pending'
        : `/api/users/${userId}/recommendations`;
      return apiRequest('GET', url)
        .then(res => res.json());
    }
  });
  
  // Mutation to update recommendation status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes 
    }: { 
      id: number, 
      status: 'approved' | 'rejected', 
      notes: string 
    }) => {
      const res = await apiRequest('PATCH', `/api/recommendations/${id}/status`, {
        status,
        therapistNotes: notes
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      if (pendingOnly) {
        queryClient.invalidateQueries({ queryKey: ['/api/therapist/recommendations/pending'] });
      } else {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/recommendations`] });
      }
      
      toast({
        title: "Recommendation updated",
        description: "The recommendation status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update recommendation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Mutation to mark recommendation as implemented
  const implementMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/recommendations/${id}/implement`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/recommendations`] });
      toast({
        title: "Recommendation implemented",
        description: "Great job! Your progress has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark as implemented",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleApprove = (id: number) => {
    const recommendation = recommendations.find(r => r.id === id);
    if (recommendation) {
      setSelectedRecommendation(recommendation);
    }
  };
  
  const handleReject = (id: number) => {
    const recommendation = recommendations.find(r => r.id === id);
    if (recommendation) {
      setSelectedRecommendation(recommendation);
    }
  };
  
  const handleImplement = (id: number) => {
    implementMutation.mutate(id);
  };
  
  const handleApproveConfirm = (id: number, notes: string) => {
    updateStatusMutation.mutate({ id, status: 'approved', notes });
  };
  
  const handleRejectConfirm = (id: number, notes: string) => {
    updateStatusMutation.mutate({ id, status: 'rejected', notes });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!recommendations.length) {
    return (
      <EmptyState
        title={pendingOnly ? "No pending recommendations" : "No recommendations yet"}
        description={pendingOnly 
          ? "There are no recommendations waiting for your review at this time." 
          : "Recommendations based on your activity will appear here."}
        icon="clipboard-list"
      />
    );
  }
  
  return (
    <div>
      {recommendations.map((recommendation) => (
        <RecommendationItem
          key={recommendation.id}
          recommendation={recommendation}
          isTherapist={isTherapistView}
          onApprove={handleApprove}
          onReject={handleReject}
          onImplement={handleImplement}
        />
      ))}
      
      {selectedRecommendation && (
        <RecommendationApprovalForm
          recommendation={selectedRecommendation}
          isOpen={!!selectedRecommendation}
          onClose={() => setSelectedRecommendation(null)}
          onApprove={handleApproveConfirm}
          onReject={handleRejectConfirm}
        />
      )}
    </div>
  );
}