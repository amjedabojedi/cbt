import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, BookOpen, Target, Lightbulb, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";
import { translateEmotion } from "@/features/therapy/components/emotion/EmotionWheelFixed";

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
  thought: { bg: "bg-teal-50/60 border-teal-100/40", text: "text-teal-700" },
  journal: { bg: "bg-violet-50/60 border-violet-100/40", text: "text-violet-600" },
  goal: { bg: "bg-fuchsia-50/60 border-fuchsia-100/40", text: "text-fuchsia-600" },
  reframe: { bg: "bg-teal-100/25 border-teal-200/20", text: "text-teal-700" },
};

function TimelineTitle({ item }: { item: TimelineItem }) {
  const { t, currentLanguage, tNum } = useLocalization();

  if (item.type === "thought") {
    return <>{t("Recorded thought")}</>;
  }

  if (item.type === "emotion") {
    const match = item.title.match(/^Tracked (.+)$/);
    if (match) {
      return (
        <>
          {t("Tracked")} {translateEmotion(match[1], currentLanguage)}
        </>
      );
    }
  }

  if (item.type === "goal") {
    const match = item.title.match(/^Created goal: (.+)$/);
    if (match) {
      return (
        <>
          {t("Created goal:")} <DynamicTranslator text={match[1]} />
        </>
      );
    }
  }

  if (item.type === "reframe") {
    const match = item.title.match(/^Practiced reframing \((\d+) pts\)$/);
    if (match) {
      return (
        <>
          {t("Practiced reframing")} ({tNum(match[1])} {t("pts")})
        </>
      );
    }
  }

  return <DynamicTranslator text={item.title} />;
}

export default function ActivityTimeline({ timeline, isLoading }: ActivityTimelineProps) {
  const { t, isRTL } = useLocalization();
  const dateLocale = isRTL ? ar : undefined;

  const header = (
    <>
      <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
        <Clock className="h-4.5 w-4.5 text-teal-700" />
        {t("Activity Timeline")}
      </CardTitle>
      <CardDescription className="text-slate-400 font-semibold text-xs mt-0.5">
        {t("Your recent therapeutic activities across all modules")}
      </CardDescription>
    </>
  );

  if (isLoading) {
    return (
      <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden h-full flex flex-col justify-between">
        <CardHeader className="pb-4 pt-5 px-6">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800 animate-pulse">
            <Clock className="h-4.5 w-4.5 text-teal-700" />
            {t("Activity Timeline")}
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
      <Card
        data-testid="activity-timeline"
        className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden h-full flex flex-col justify-between"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <CardHeader className="pb-4 pt-5 px-6">{header}</CardHeader>
        <CardContent className="px-6 pb-12 pt-6">
          <div className="text-center py-6 text-slate-500">
            <div className="bg-slate-50 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 border border-slate-100/50">
              <Clock className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">{t("No activities logged yet")}</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {t(
                "Start your wellness journey by tracking emotions, recording thoughts, or setting goals."
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      data-testid="activity-timeline"
      className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden h-full flex flex-col justify-between"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <CardHeader className="pb-4 pt-5 px-6">{header}</CardHeader>
      <CardContent className="px-6 pb-6 pt-0 flex-1">
        <div className="space-y-3.5 pe-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-200/60 scrollbar-track-transparent hover:scrollbar-thumb-teal-300 transition-colors">
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
                    customStyle ? customStyle.bg : "bg-teal-50 border-teal-100/30",
                    customStyle ? customStyle.text : "text-teal-700"
                  )}
                  style={
                    !customStyle
                      ? { backgroundColor: item.color + "15", color: item.color }
                      : undefined
                  }
                >
                  {Icon ? <Icon className="h-4.5 w-4.5" /> : <Clock className="h-4.5 w-4.5" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-bold text-slate-700 truncate leading-snug group-hover:text-teal-700 transition-colors">
                    <TimelineTitle item={item} />
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    <span>{formatDistanceToNow(item.date, { addSuffix: true, locale: dateLocale })}</span>
                    <span>•</span>
                    <span>{format(item.date, "MMM d, h:mm a", { locale: dateLocale })}</span>
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
