import { Card, CardContent } from "@/components/ui/card";
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
  linkText = "View Insights",
}: ModuleSummaryCardProps) {
  return (
    <Card
      className="border transition-all hover:shadow-md"
      style={{ borderColor: `${color}30` }}
      data-testid={`module-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-lg shrink-0"
            style={{ backgroundColor }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <span className="font-semibold text-base leading-tight">{title}</span>
        </div>

        {/* Stats row — horizontal with dividers, no boxes */}
        <div className="flex items-stretch divide-x divide-border">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center px-2 py-1 min-w-0"
              data-testid={`metric-${index}`}
            >
              <span
                className="text-sm font-bold w-full text-center truncate"
                style={{ color }}
                title={String(metric.value)}
              >
                {metric.value}
              </span>
              <span className="text-[11px] text-muted-foreground text-center leading-tight mt-0.5 w-full truncate">
                {metric.label}
              </span>
            </div>
          ))}
        </div>

        {/* View Insights link */}
        <Link href={linkTo}>
          <button
            className="w-full flex items-center justify-between text-sm font-medium pt-2 border-t border-border hover:opacity-75 transition-opacity"
            style={{ color }}
            data-testid="button-view-insights"
          >
            <span>{linkText}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}
