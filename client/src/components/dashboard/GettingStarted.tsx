import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { X, CheckCircle2, Heart, Brain, Lightbulb, BookOpen, Target } from "lucide-react";
import { Link } from "wouter";

export default function GettingStarted() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

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

  const modules = [
    {
      label: "Track an emotion",
      description: "Track how you're feeling",
      icon: Heart,
      color: "#3b82f6",
      bg: "#dbeafe",
      href: "/emotions",
      done: !!(emotions && emotions.length > 0),
      testId: "quick-action-emotion",
    },
    {
      label: "Record a thought",
      description: "Document your thoughts",
      icon: Brain,
      color: "#9333ea",
      bg: "#f3e8ff",
      href: "/thoughts",
      done: !!(thoughts && thoughts.length > 0),
      testId: "quick-action-thought",
    },
    {
      label: "Practice a reframe",
      description: "Cognitive restructuring",
      icon: Lightbulb,
      color: "#16a34a",
      bg: "#dcfce7",
      href: "/reframe-coach",
      done: !!(reframePractices && reframePractices.length > 0),
      testId: "quick-action-reframe",
    },
    {
      label: "Write a journal entry",
      description: "Daily reflection",
      icon: BookOpen,
      color: "#eab308",
      bg: "#fef9c3",
      href: "/journal",
      done: !!(journalEntries && journalEntries.length > 0),
      testId: "quick-action-journal",
    },
    {
      label: "Create a SMART goal",
      description: "Set SMART objectives",
      icon: Target,
      color: "#6366f1",
      bg: "#e0e7ff",
      href: "/goals",
      done: !!(goals && goals.length > 0),
      testId: "quick-action-goal",
    },
  ];

  const allDone = modules.every((m) => m.done);
  const doneCount = modules.filter((m) => m.done).length;

  if (dismissed || allDone) return null;

  return (
    <div className="mb-6" data-testid="getting-started-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-base">Getting Started</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {doneCount} of {modules.length} steps complete — explore the full toolkit
          </p>
        </div>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          data-testid="button-dismiss-getting-started"
        >
          <X size={16} />
        </button>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link key={mod.href} href={mod.href}>
              <Card
                className="p-4 cursor-pointer transition-all hover:shadow-md relative overflow-hidden"
                style={{ borderColor: mod.done ? "#16a34a30" : `${mod.color}20` }}
                data-testid={mod.testId}
              >
                {/* Completion tick */}
                {mod.done && (
                  <CheckCircle2
                    className="absolute top-2.5 right-2.5 h-4 w-4 text-green-500"
                    aria-label="Completed"
                  />
                )}

                {/* Icon */}
                <div
                  className="p-2 rounded-lg inline-flex mb-2.5"
                  style={{ backgroundColor: mod.bg }}
                >
                  <Icon className="h-4 w-4" style={{ color: mod.color }} />
                </div>

                {/* Text */}
                <p className={`text-sm font-medium leading-tight ${mod.done ? "text-muted-foreground line-through" : ""}`}>
                  {mod.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
