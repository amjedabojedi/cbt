import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface FormFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  name,
  label,
  description,
  required = false,
  tooltip,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label
            htmlFor={name}
            className={cn(
              "text-sm font-medium",
              error ? "text-destructive" : "text-foreground"
            )}
          >
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
          
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger type="button" asChild>
                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {children}
      
      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}