import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, BookOpen, Target, Lightbulb, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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

const timelineStyleMap = {
  emotion: { bg: "bg-indigo-50/60 border-indigo-100/40", text: "text-indigo-600" },
  thought: { bg: "bg-purple-50/60 border-purple-100/40", text: "text-purple-600" },
  journal: { bg: "bg-violet-50/60 border-violet-100/40", text: "text-violet-600" },
  goal: { bg: "bg-fuchsia-50/60 border-fuchsia-100/40", text: "text-fuchsia-600" },
  reframe: { bg: "bg-purple-100/25 border-purple-200/20", text: "text-purple-700" },
};

export default function ActivityTimeline({ timeline, isLoading }: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden h-full flex flex-col justify-between">
        <CardHeader className="pb-4 pt-5 px-6">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800 animate-pulse">
            <Clock className="h-4.5 w-4.5 text-purple-600" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 bg-slate-100 rounded-md w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded-md w-1/2" />
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
      <Card data-testid="activity-timeline" className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden h-full flex flex-col justify-between">
        <CardHeader className="pb-4 pt-5 px-6">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
            <Clock className="h-4.5 w-4.5 text-purple-600" />
            Activity Timeline
          </CardTitle>
          <CardDescription className="text-slate-400 font-semibold text-xs mt-0.5">
            Your recent therapeutic activities across all modules
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-12 pt-6">
          <div className="text-center py-6 text-slate-500">
            <div className="bg-slate-50 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 border border-slate-100/50">
              <Clock className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">No activities logged yet</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">Start your wellness journey by tracking emotions, recording thoughts, or setting goals.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card data-testid="activity-timeline" className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="pb-4 pt-5 px-6">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
          <Clock className="h-4.5 w-4.5 text-purple-600" />
          Activity Timeline
        </CardTitle>
        <CardDescription className="text-slate-400 font-semibold text-xs mt-0.5">
          Your recent therapeutic activities across all modules
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 flex-1">
        <div className="space-y-3.5 pr-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-200/60 scrollbar-track-transparent hover:scrollbar-thumb-purple-300 transition-colors">
          {timeline.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const customStyle = timelineStyleMap[item.type as keyof typeof timelineStyleMap];
            
            return (
              <div 
                key={item.id} 
                className="flex gap-3.5 items-start pb-3.5 border-b border-slate-50 last:border-0 last:pb-0"
                data-testid={`timeline-item-${item.type}`}
              >
                <div 
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 border",
                    customStyle ? customStyle.bg : "bg-purple-50 border-purple-100/30",
                    customStyle ? customStyle.text : "text-purple-600"
                  )}
                  style={!customStyle ? { backgroundColor: item.color + '15', color: item.color } : undefined}
                >
                  {Icon ? <Icon className="h-4.5 w-4.5" /> : <Clock className="h-4.5 w-4.5" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-bold text-slate-700 truncate leading-snug group-hover:text-purple-700 transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    <span>
                      {formatDistanceToNow(item.date, { addSuffix: true })}
                    </span>
                    <span>•</span>
                    <span>
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
