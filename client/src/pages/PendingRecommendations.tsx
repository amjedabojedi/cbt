import { useAuth } from "@/lib/auth";
import { RecommendationList } from "@/components/recommendations/RecommendationList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function PendingRecommendations() {
  const { user } = useAuth();
  
  // Only therapists and admins should access this page
  const isTherapist = user?.role === "therapist";
  const isAdmin = user?.role === "admin";
  
  if (!isTherapist && !isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Access Denied</CardTitle>
            <CardDescription className="text-red-600">
              You don't have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Recommendations</h1>
          <p className="text-muted-foreground">
            Review and approve AI-generated recommendations for your clients
          </p>
        </div>
      </div>
      
      <InfoCard />
      
      {/* Therapist ID is passed as userId but pendingOnly flag ensures we get all pending recommendations */}
      <RecommendationList 
        userId={user?.id || 0} 
        isTherapistView={true}
        pendingOnly={true}
      />
    </div>
  );
}

function InfoCard() {
  return (
    <Card className="mb-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg text-amber-700">Review Guidelines</CardTitle>
        </div>
        <CardDescription className="text-amber-700/70">
          Important information about approving recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-amber-700/90">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Carefully evaluate each recommendation based on your client's current needs and treatment plan.
          </li>
          <li>
            Add personalized notes to provide context or specific instructions to your client.
          </li>
          <li>
            Recommendations only become visible to clients after your approval.
          </li>
          <li>
            You can reject inappropriate recommendations with feedback that will be used to improve future suggestions.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}