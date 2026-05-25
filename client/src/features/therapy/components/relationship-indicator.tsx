import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Brain, Book, Hash, CircleDotDashed } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type EntityType = "emotion" | "thought" | "journal" | "tag" | "distortion";

interface RelationshipIndicatorProps {
  type: EntityType;
  id: number | string;
  label: string;
  path?: string;
  count?: number;
  className?: string;
  showIcon?: boolean;
}

export function RelationshipIndicator({
  type,
  id,
  label,
  path,
  count = 0,
  className,
  showIcon = true
}: RelationshipIndicatorProps) {
  // Get the appropriate icon for the type
  const getIcon = () => {
    switch (type) {
      case "emotion":
        return <Heart className="h-3.5 w-3.5" />;
      case "thought":
        return <Brain className="h-3.5 w-3.5" />;
      case "journal":
        return <Book className="h-3.5 w-3.5" />;
      case "tag":
        return <Hash className="h-3.5 w-3.5" />;
      case "distortion":
        return <CircleDotDashed className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };
  
  // Get appropriate color based on type
  const getColor = () => {
    switch (type) {
      case "emotion":
        return "bg-primary/15 text-primary hover:bg-primary/25";
      case "thought":
        return "bg-violet-500/15 text-violet-500 hover:bg-violet-500/25";
      case "journal":
        return "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25";
      case "tag":
        return "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25";
      case "distortion":
        return "bg-orange-500/15 text-orange-500 hover:bg-orange-500/25";
      default:
        return "bg-neutral-200 text-neutral-700";
    }
  };
  
  // Get appropriate destination path if not provided
  const getPath = () => {
    if (path) return path;
    
    switch (type) {
      case "emotion":
        return `/emotions/${id}`;
      case "thought":
        return `/thoughts/${id}`;
      case "journal":
        return `/journal/${id}`;
      case "tag":
        return `/tags/${id}`;
      case "distortion":
        return `/distortions/${id}`;
      default:
        return "";
    }
  };
  
  if (!path) {
    // Render as a badge when no path is provided
    return (
      <Badge variant="outline" className={cn(getColor(), className)}>
        {showIcon && <span className="mr-1">{getIcon()}</span>}
        {label}
        {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
      </Badge>
    );
  }
  
  // Render as a link when path is provided
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={getPath()}>
            <Button 
              variant="outline" 
              size="sm"
              className={cn(
                "h-7 px-2 py-1 border-0", 
                getColor(),
                className
              )}
            >
              {showIcon && <span className="mr-1">{getIcon()}</span>}
              {label}
              {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          View related {type} record
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}