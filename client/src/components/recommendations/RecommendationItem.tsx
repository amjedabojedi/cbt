import { AiRecommendation } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Check, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { useState } from "react";

interface RecommendationItemProps {
  recommendation: AiRecommendation;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onImplement?: (id: number) => void;
  isTherapist?: boolean;
}

export function RecommendationItem({
  recommendation,
  onApprove,
  onReject,
  onImplement,
  isTherapist = false
}: RecommendationItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusBadge = () => {
    switch (recommendation.status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Review</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Not Recommended</Badge>;
      case "implemented":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Implemented</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (recommendation.status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "approved":
        return <Check className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "implemented":
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTypeLabel = () => {
    switch (recommendation.type) {
      case "reflection":
        return "Reflection Exercise";
      case "coping_strategy":
        return "Coping Strategy";
      case "resource":
        return "Resource";
      case "activity":
        return "Activity";
      case "goal":
        return "Goal";
      default:
        return "Recommendation";
    }
  };

  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">{recommendation.title}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          <span className="font-medium">{getTypeLabel()}</span> • Created {formatDistanceToNow(new Date(recommendation.createdAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-700">{recommendation.content}</p>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 h-auto mt-2 font-medium">
              {isOpen ? "Show less" : "Show more"}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="mt-4 space-y-3">
              {recommendation.aiReasoning && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Why This Recommendation:</h4>
                  <p className="text-sm text-gray-600">{recommendation.aiReasoning}</p>
                </div>
              )}
              
              {recommendation.expectedBenefits && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Expected Benefits:</h4>
                  <p className="text-sm text-gray-600">{recommendation.expectedBenefits}</p>
                </div>
              )}
              
              {recommendation.implementationSteps && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Implementation Steps:</h4>
                  <p className="text-sm text-gray-600">{recommendation.implementationSteps}</p>
                </div>
              )}
              
              {recommendation.therapistNotes && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Note from Your Therapist:
                  </h4>
                  <p className="text-sm text-gray-700">{recommendation.therapistNotes}</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
      
      <CardFooter className="pt-0">
        {isTherapist && recommendation.status === "pending" && (
          <div className="flex gap-2 w-full justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onReject?.(recommendation.id)}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              Not Recommend
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onApprove?.(recommendation.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
          </div>
        )}
        
        {!isTherapist && recommendation.status === "approved" && (
          <div className="flex gap-2 w-full justify-end">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onImplement?.(recommendation.id)}
            >
              Mark as Implemented
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}