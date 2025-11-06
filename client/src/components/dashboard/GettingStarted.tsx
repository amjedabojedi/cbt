import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export default function GettingStarted() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  
  // Query all 5 modules to check progress
  const { data: emotions } = useQuery<any[]>({
    queryKey: user ? [`/api/users/${user.id}/emotions`] : [],
    enabled: !!user,
  });
  
  const { data: thoughts } = useQuery<any[]>({
    queryKey: user ? [`/api/users/${user.id}/thoughts`] : [],
    enabled: !!user,
  });
  
  const { data: reframePractices } = useQuery<any[]>({
    queryKey: user ? [`/api/users/${user.id}/reframe-coach/results`] : [],
    enabled: !!user,
  });
  
  const { data: journalEntries } = useQuery<any[]>({
    queryKey: user ? [`/api/users/${user.id}/journal`] : [],
    enabled: !!user,
  });
  
  const { data: goals } = useQuery<any[]>({
    queryKey: user ? [`/api/users/${user.id}/goals`] : [],
    enabled: !!user,
  });
  
  // Determine which tasks are completed (one per module, sequential flow)
  const hasTrackedEmotion = !!(emotions && emotions.length > 0);
  const hasRecordedThought = !!(thoughts && thoughts.length > 0);
  const hasPracticedReframe = !!(reframePractices && reframePractices.length > 0);
  const hasWrittenJournal = !!(journalEntries && journalEntries.length > 0);
  const hasCreatedGoal = !!(goals && goals.length > 0);
  
  // If all 5 core tasks are completed or component is dismissed, don't show
  if (dismissed || (hasTrackedEmotion && hasRecordedThought && hasPracticedReframe && hasWrittenJournal && hasCreatedGoal)) {
    return null;
  }

  return (
    <Card className="bg-white rounded-lg shadow-sm mb-6" data-testid="getting-started-card">
      <CardContent className="pt-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-lg">Getting Started</h3>
          <button 
            className="text-neutral-400 hover:text-neutral-600"
            onClick={() => setDismissed(true)}
            data-testid="button-dismiss-getting-started"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Complete these steps to explore the full therapeutic toolkit
        </p>
        <div className="space-y-3">
          <ChecklistItem 
            label="Track an emotion" 
            isCompleted={hasTrackedEmotion} 
            href="/emotions"
          />
          <ChecklistItem 
            label="Record a thought" 
            isCompleted={hasRecordedThought} 
            href="/thought-records"
          />
          <ChecklistItem 
            label="Practice a reframe" 
            isCompleted={hasPracticedReframe} 
            href="/reframe-coach"
          />
          <ChecklistItem 
            label="Write a journal entry" 
            isCompleted={hasWrittenJournal} 
            href="/journal"
          />
          <ChecklistItem 
            label="Create a SMART goal" 
            isCompleted={hasCreatedGoal} 
            href="/goals"
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
  const content = (
    <>
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
    </>
  );

  if (isCompleted) {
    return (
      <div className="flex items-center cursor-default" data-testid={`checklist-item-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center group cursor-pointer hover:bg-neutral-50 rounded-md -mx-1 px-1"
      )} data-testid={`checklist-item-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {content}
      </div>
    </Link>
  );
}
