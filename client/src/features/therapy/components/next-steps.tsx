import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart,
  Brain, 
  Book, 
  BarChart, 
  Flag, 
  BookOpen,
  Zap
} from "lucide-react";

// Define the different types of next steps based on the current component
type StepType = 
  | "emotion" 
  | "thought" 
  | "journal" 
  | "goal" 
  | "resource" 
  | "report";

interface NextStepsProps {
  currentStep: StepType;
  title?: string;
  description?: string;
}

export function NextSteps({ 
  currentStep, 
  title = "Continue Your Journey", 
  description = "Consider these next steps in your CBT practice"
}: NextStepsProps) {
  
  // Define the steps and their paths
  const steps: {
    type: StepType;
    label: string;
    path: string;
    icon: JSX.Element;
    description: string;
  }[] = [
    {
      type: "emotion",
      label: "Track Emotions",
      path: "/emotions",
      icon: <Heart className="h-5 w-5" />,
      description: "Record and track how you're feeling"
    },
    {
      type: "thought",
      label: "Challenge Thoughts",
      path: "/thoughts",
      icon: <Brain className="h-5 w-5" />,
      description: "Identify and reframe negative thought patterns"
    },
    {
      type: "journal",
      label: "Journal",
      path: "/journal",
      icon: <Book className="h-5 w-5" />,
      description: "Express yourself through journaling"
    },
    {
      type: "goal",
      label: "Set Goals",
      path: "/goals",
      icon: <Flag className="h-5 w-5" />,
      description: "Create SMART goals to work towards"
    },
    {
      type: "resource",
      label: "Explore Resources",
      path: "/library",
      icon: <BookOpen className="h-5 w-5" />,
      description: "Learn from our resource library"
    },
    {
      type: "report",
      label: "Check Progress",
      path: "/reports",
      icon: <BarChart className="h-5 w-5" />,
      description: "View your progress and insights"
    }
  ];
  
  // Filter out the current step
  const nextStepsOptions = steps.filter(step => step.type !== currentStep);
  
  // Select 2-3 recommended next steps based on the current step
  let recommendedSteps: typeof steps = [];
  
  switch (currentStep) {
    case "emotion":
      // After tracking emotions, recommend thought records or journaling
      recommendedSteps = nextStepsOptions.filter(step => 
        ["thought", "journal"].includes(step.type)
      );
      break;
    
    case "thought":
      // After thought records, recommend goals or checking progress
      recommendedSteps = nextStepsOptions.filter(step => 
        ["goal", "report", "journal"].includes(step.type)
      );
      break;
    
    case "journal":
      // After journaling, recommend emotion tracking or thought records
      recommendedSteps = nextStepsOptions.filter(step => 
        ["emotion", "thought", "report"].includes(step.type)
      );
      break;
    
    case "goal":
      // After setting goals, recommend resources or checking progress
      recommendedSteps = nextStepsOptions.filter(step => 
        ["resource", "report", "thought"].includes(step.type)
      );
      break;
    
    case "resource":
      // After exploring resources, recommend any practice
      recommendedSteps = nextStepsOptions.filter(step => 
        ["emotion", "thought", "journal", "goal"].includes(step.type)
      ).slice(0, 3);
      break;
    
    case "report":
      // After checking progress, recommend continuing practice
      recommendedSteps = nextStepsOptions.filter(step => 
        ["emotion", "thought", "journal", "goal"].includes(step.type)
      ).slice(0, 3);
      break;
    
    default:
      // Default to showing 3 random steps
      recommendedSteps = nextStepsOptions.slice(0, 3);
  }
  
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recommendedSteps.map((step) => (
            <Link key={step.type} href={step.path}>
              <Button 
                variant="outline" 
                className="w-full h-auto justify-start py-3 text-left flex flex-col items-start gap-1 hover:bg-primary/10"
              >
                <span className="flex items-center gap-2 font-medium">
                  {step.icon}
                  {step.label}
                </span>
                <span className="text-xs text-muted-foreground">{step.description}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}