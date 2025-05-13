import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface ResearchTooltipProps {
  content: string;
  research: string;
}

export function ResearchTooltip({ content, research }: ResearchTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center ml-1.5 text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full">
            <InfoIcon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] text-sm">
          <div>{content}</div>
          <div className="mt-1.5 text-xs italic text-muted-foreground">Based on research by {research}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}