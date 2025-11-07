import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Link } from "wouter";

interface ModuleMetric {
  label: string;
  value: string | number;
  subtext?: string;
}

interface ModuleSummaryCardProps {
  title: string;
  icon: LucideIcon;
  color: string;
  backgroundColor: string;
  metrics: ModuleMetric[];
  linkTo: string;
  linkText?: string;
}

export default function ModuleSummaryCard({
  title,
  icon: Icon,
  color,
  backgroundColor,
  metrics,
  linkTo,
  linkText = "View Insights"
}: ModuleSummaryCardProps) {
  return (
    <Card className="border-2 transition-all hover:shadow-lg" style={{ borderColor: `${color}20` }} data-testid={`module-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-lg flex items-center justify-center"
            style={{ backgroundColor }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((metric, index) => (
            <div 
              key={index} 
              className="text-center p-3 rounded-lg bg-muted/50 flex flex-col justify-center gap-3 min-h-[90px]"
              data-testid={`metric-${index}`}
            >
              <div className="text-base font-bold leading-relaxed" style={{ color }}>
                {metric.value}
              </div>
              <div className="text-xs text-muted-foreground border-t border-muted-foreground/20 pt-2">
                {metric.label}
              </div>
              {metric.subtext && (
                <div className="text-xs text-muted-foreground/60">
                  {metric.subtext}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View Insights Link */}
        <Link href={linkTo}>
          <Button 
            variant="ghost" 
            className="w-full justify-between group"
            data-testid={`button-view-insights`}
          >
            <span>{linkText}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
