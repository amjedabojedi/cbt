import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useClientContext } from "@/context/ClientContext";
import { EmptyState } from "@/components/shared/EmptyState";
import { AiRecommendation } from "@shared/schema";
import { RecommendationItem } from "@/components/recommendations/RecommendationItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface RecommendationListProps {
  userId?: number;
  isTherapistView?: boolean;
  pendingOnly?: boolean;
}

export function RecommendationList({
  userId,
  isTherapistView = false,
  pendingOnly = false
}: RecommendationListProps) {
  const { user } = useAuth();
  const { viewingClientId } = useClientContext();
  
  // If no userId is provided, use the current user's ID (for client view)
  // or the viewingClientId (for therapist view)
  const targetUserId = userId || (isTherapistView ? viewingClientId : user?.id) || 0;
  
  // Build the correct API endpoint based on the props
  let queryEndpoint = `/api/recommendations/user/${targetUserId}`;
  
  // If it's a therapist view and we're looking for pending recommendations
  if (isTherapistView && pendingOnly && user?.role === "therapist") {
    // Therapists only see recommendations pending approval for their clients
    queryEndpoint = `/api/recommendations/therapist/pending`;
  } else if (pendingOnly) {
    // Admin sees all pending recommendations
    queryEndpoint = `/api/recommendations/pending`;
  } else if (isTherapistView && user?.role === "admin") {
    // Admin sees all recommendations
    queryEndpoint = "/api/recommendations";
  }
  
  // Fetch recommendations
  const {
    data: recommendations,
    isLoading,
    isError,
    refetch
  } = useQuery<AiRecommendation[]>({
    queryKey: [queryEndpoint],
    enabled: !!targetUserId || isTherapistView, // Only fetch if we have a user ID or it's a therapist view
  });
  
  // Handle status change (approve/reject/implement) to refetch data
  const handleStatusChange = () => {
    refetch();
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Render error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load recommendations. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Render empty state
  if (!recommendations || recommendations.length === 0) {
    return (
      <EmptyState
        title={pendingOnly ? "No pending recommendations" : "No recommendations yet"}
        description={
          pendingOnly
            ? "There are currently no recommendations waiting for your review."
            : "Recommendations will appear here as they are generated based on client progress and activities."
        }
        icon="lightbulb"
      />
    );
  }
  
  // Sort recommendations - newest first but put implemented ones at the end
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    // First sort by status - put implemented at the bottom
    if (a.status === "implemented" && b.status !== "implemented") return 1;
    if (a.status !== "implemented" && b.status === "implemented") return -1;
    
    // Then sort by date - newest first
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
  
  // Render recommendations list
  return (
    <div className="space-y-4">
      {sortedRecommendations.map((recommendation) => (
        <RecommendationItem
          key={recommendation.id}
          recommendation={recommendation}
          isTherapistView={isTherapistView}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}