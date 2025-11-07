import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Brain, BookOpen, Target, Lightbulb, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface Module {
  id: string;
  name: string;
  icon: typeof Heart;
  color: string;
  path: string;
  description: string;
}

const modules: Module[] = [
  {
    id: "emotions",
    name: "Emotion Tracking",
    icon: Heart,
    color: "text-blue-600 bg-blue-50 hover:bg-blue-100",
    path: "/emotions?tab=insights",
    description: "View emotion patterns and intensity trends",
  },
  {
    id: "thoughts",
    name: "Thought Records",
    icon: Brain,
    color: "text-purple-600 bg-purple-50 hover:bg-purple-100",
    path: "/thoughts?tab=insights",
    description: "Analyze cognitive distortions and challenges",
  },
  {
    id: "journal",
    name: "Journal",
    icon: BookOpen,
    color: "text-yellow-600 bg-yellow-50 hover:bg-yellow-100",
    path: "/journal?tab=insights",
    description: "Review mood trends and emotional themes",
  },
  {
    id: "goals",
    name: "Smart Goals",
    icon: Target,
    color: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100",
    path: "/goals?tab=insights",
    description: "Track goal completion and milestones",
  },
  {
    id: "reframe",
    name: "Reframe Coach",
    icon: Lightbulb,
    color: "text-green-600 bg-green-50 hover:bg-green-100",
    path: "/reframe-coach?tab=insights",
    description: "Monitor cognitive restructuring progress",
  },
];

export default function ModuleQuickLinks() {
  return (
    <Card data-testid="module-quick-links">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-primary" />
          Module Insights
        </CardTitle>
        <CardDescription>
          View detailed analytics for each therapeutic module
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.id} href={module.path} data-testid={`link-${module.id}-insights`}>
                <Button
                  variant="outline"
                  className={`w-full h-auto flex-col items-start gap-2 p-4 ${module.color} border-neutral-200 transition-colors`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{module.name}</span>
                  </div>
                  <p className="text-xs text-neutral-600 text-left">{module.description}</p>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
