import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GettingStarted() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  
  // Get user's emotions and thoughts to check progress
  const { data: emotions } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/emotions`] : [],
    enabled: !!user,
  });
  
  const { data: thoughts } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/thoughts`] : [],
    enabled: !!user,
  });
  
  const { data: goals } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/goals`] : [],
    enabled: !!user,
  });
  
  // Determine which tasks are completed
  const hasRecordedEmotion = emotions && emotions.length > 0;
  const hasCompletedReflection = thoughts && thoughts.length > 0;
  const hasSetGoal = goals && goals.length > 0;
  const hasInvitedOrAccepted = user?.role === 'therapist' || (user?.therapistId !== null && user?.therapistId !== undefined);
  
  // If all tasks are completed or component is dismissed, don't show
  if (dismissed || (hasRecordedEmotion && hasCompletedReflection && hasSetGoal && hasInvitedOrAccepted)) {
    return null;
  }

  return (
    <Card className="bg-white rounded-lg shadow-sm mb-6">
      <CardContent className="pt-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-lg">Getting Started</h3>
          <button 
            className="text-neutral-400 hover:text-neutral-600"
            onClick={() => setDismissed(true)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <ChecklistItem 
            label="Record your first emotion" 
            isCompleted={hasRecordedEmotion} 
            href="/emotions"
          />
          <ChecklistItem 
            label="Complete a reflection" 
            isCompleted={hasCompletedReflection} 
            href="/thoughts"
          />
          <ChecklistItem 
            label="Set a SMART goal" 
            isCompleted={hasSetGoal} 
            href="/goals"
          />
          <ChecklistItem 
            label={user?.role === 'therapist' ? "Invite a client" : "Accept invitation"} 
            isCompleted={hasInvitedOrAccepted} 
            href={user?.role === 'therapist' ? "/clients" : "/settings"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface ChecklistItemProps {
  label: string;
  isCompleted: boolean;
  href: string;
}

function ChecklistItem({ label, isCompleted, href }: ChecklistItemProps) {
  return (
    <a href={href} className={cn(
      "flex items-center group",
      isCompleted ? "cursor-default" : "cursor-pointer hover:bg-neutral-50 rounded-md -mx-1 px-1"
    )}>
      <div className={cn(
        "w-6 h-6 rounded-full mr-3 flex items-center justify-center",
        isCompleted 
          ? "bg-green-100 text-green-700" 
          : "border border-neutral-300 group-hover:border-neutral-400"
      )}>
        {isCompleted && (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </div>
      <span className={cn(
        "text-sm",
        isCompleted ? "text-neutral-500 line-through" : "text-neutral-700"
      )}>
        {label}
      </span>
    </a>
  );
}
