import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { PlusCircle, Brain, Flag, BarChart } from "lucide-react";

export default function QuickActions() {
  // Define quick action cards
  const actions = [
    {
      title: "Record Emotion",
      description: "Track how you're feeling right now",
      icon: <PlusCircle className="text-primary h-6 w-6" />,
      href: "/emotions",
    },
    {
      title: "New Thought Record",
      description: "Document and analyze thoughts",
      icon: <Brain className="text-primary h-6 w-6" />,
      href: "/thoughts",
    },
    {
      title: "Set a Goal",
      description: "Create a new SMART goal",
      icon: <Flag className="text-primary h-6 w-6" />,
      href: "/goals",
    },
    {
      title: "View Progress",
      description: "Check your recent progress",
      icon: <BarChart className="text-primary h-6 w-6" />,
      href: "/reports",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <Link key={index} href={action.href}>
          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
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
