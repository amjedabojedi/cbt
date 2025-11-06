import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Heart, Brain, Lightbulb, BookOpen, Target } from "lucide-react";

export default function QuickActions() {
  // Define quick action cards - aligned with 5-module identity system
  const actions = [
    {
      title: "Record Emotion",
      description: "Track how you're feeling",
      icon: <Heart className="h-6 w-6" style={{ color: "#3b82f6" }} />,
      href: "/emotions",
      testId: "quick-action-emotion",
    },
    {
      title: "Record Thought",
      description: "Document your thoughts",
      icon: <Brain className="h-6 w-6" style={{ color: "#9333ea" }} />,
      href: "/thought-records",
      testId: "quick-action-thought",
    },
    {
      title: "Practice Reframe",
      description: "Cognitive restructuring",
      icon: <Lightbulb className="h-6 w-6" style={{ color: "#16a34a" }} />,
      href: "/reframe-coach",
      testId: "quick-action-reframe",
    },
    {
      title: "Write Journal",
      description: "Daily reflection",
      icon: <BookOpen className="h-6 w-6" style={{ color: "#eab308" }} />,
      href: "/journal",
      testId: "quick-action-journal",
    },
    {
      title: "Create Goal",
      description: "Set SMART objectives",
      icon: <Target className="h-6 w-6" style={{ color: "#6366f1" }} />,
      href: "/goals",
      testId: "quick-action-goal",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {actions.map((action, index) => (
        <Link key={index} href={action.href}>
          <Card 
            className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full"
            data-testid={action.testId}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{action.title}</h3>
              {action.icon}
            </div>
            <p className="text-sm text-neutral-600">{action.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
