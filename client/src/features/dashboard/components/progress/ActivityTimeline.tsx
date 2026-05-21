import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, BookOpen, Target, Lightbulb, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface TimelineItem {
  id: string;
  type: "emotion" | "thought" | "journal" | "goal" | "reframe";
  date: Date;
  title: string;
  icon: string;
  color: string;
}

interface ActivityTimelineProps {
  timeline: TimelineItem[];
  isLoading: boolean;
}

const iconMap = {
  Heart,
  Brain,
  BookOpen,
  Target,
  Lightbulb,
};

export default function ActivityTimeline({ timeline, isLoading }: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (timeline.length === 0) {
    return (
      <Card data-testid="activity-timeline">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            Your recent therapeutic activities across all modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-neutral-500">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No activities yet. Start by tracking your emotions or creating a goal.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card data-testid="activity-timeline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Activity Timeline
        </CardTitle>
        <CardDescription>
          Your recent therapeutic activities across all modules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {timeline.map((item, index) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            return (
              <div 
                key={item.id} 
                className="flex gap-4 items-start pb-4 border-b border-neutral-100 last:border-0"
                data-testid={`timeline-item-${item.type}`}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.color + '20', color: item.color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-500">
                      {formatDistanceToNow(item.date, { addSuffix: true })}
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-500">
                      {format(item.date, "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
