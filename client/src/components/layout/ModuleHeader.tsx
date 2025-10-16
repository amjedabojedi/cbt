import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface ProgressBadge {
  label: string;
  value: string | number;
  variant?: "default" | "secondary" | "destructive" | "outline";
  icon?: LucideIcon;
  color?: string; // Custom color class for the badge
}

interface ModuleHeaderProps {
  title: string;
  description: string;
  badges?: ProgressBadge[];
}

export default function ModuleHeader({ title, description, badges = [] }: ModuleHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
      <p className="text-muted-foreground mb-4">{description}</p>
      
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <Badge 
                key={index} 
                variant={badge.variant || "secondary"}
                className={badge.color || ""}
              >
                {Icon && <Icon className="h-3 w-3 mr-1" />}
                <span className="font-medium">{badge.label}:</span>
                <span className="ml-1">{badge.value}</span>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
