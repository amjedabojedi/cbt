import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface RecommendationListProps {
  userId?: number;
  isTherapistView?: boolean;
  pendingOnly?: boolean;
}

/**
 * The RecommendationList component is temporarily disabled
 * until the ai_recommendations table is created in the database.
 */
export function RecommendationList({
  userId,
  isTherapistView = false,
  pendingOnly = false
}: RecommendationListProps) {
  // Always return the "Feature Coming Soon" message
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Feature Coming Soon</AlertTitle>
      <AlertDescription>
        The AI recommendations feature is currently being set up in the system.
        <p className="mt-2 text-sm">
          This feature will be available in a future update. We'll notify you when AI recommendations are ready to use.
        </p>
      </AlertDescription>
    </Alert>
  );
}