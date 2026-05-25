import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, AlertCircle, Sparkles, BrainCircuit, Activity, HeartHandshake, CheckCircle2 } from "lucide-react";
import type { EmotionRecord, ThoughtRecord } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/localize.tsx";
import { formatDistortionLabel } from "@/features/reframe/utils/reframeLabels";

interface CBTTriangleConnectionsProps {
  topCognitiveDistortion: {
    name: string;
    count: number;
    percentage: number;
  } | null;
  emotions: EmotionRecord[];
  thoughts: ThoughtRecord[];
  isLoading: boolean;
}

export default function CBTTriangleConnections({
  topCognitiveDistortion,
  emotions,
  thoughts,
  isLoading,
}: CBTTriangleConnectionsProps) {
  const { t, isRTL, tNum } = useLocalization();

  if (isLoading) {
    return (
      <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden h-full flex flex-col justify-between">
        <CardHeader className="pb-4 pt-5 px-6 animate-pulse">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
            <Link2 className="h-4.5 w-4.5 text-teal-700" />
            {t("Cross-Module Connections")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const emotionsWithThoughts = thoughts.filter((t) => t.emotionRecordId !== null).length;
  const thoughtFeelingRate =
    thoughts.length > 0 ? Math.round((emotionsWithThoughts / thoughts.length) * 100) : 0;

  return (
    <Card
      data-testid="cbt-triangle-connections"
      className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden h-full flex flex-col justify-between"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <CardHeader className="pb-4 pt-5 px-6">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
          <Link2 className="h-4.5 w-4.5 text-teal-700" />
          {t("Cross-Module Connections")}
        </CardTitle>
        <CardDescription className="text-slate-400 font-semibold text-xs mt-0.5">
          {t("Understanding the CBT triangle: thoughts, feelings, and behaviors")}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0 space-y-5 flex-1">
        <div className="pb-4 border-b border-slate-50">
          <div className="flex gap-3.5 items-start">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl border border-indigo-100/30 shrink-0">
              <HeartHandshake className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-sm text-slate-700 mb-1 leading-snug">
                {t("Thought-Feeling Connection")}
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                <span className="font-bold text-indigo-600">{tNum(thoughtFeelingRate)}%</span>{" "}
                {t("of your thought records are linked to tracked emotions.")}
              </p>

              {thoughtFeelingRate < 50 && thoughts.length > 3 && (
                <div className="bg-amber-50/70 border border-amber-100/50 rounded-xl p-3 flex gap-2 text-[11px] font-semibold text-amber-700 mt-2.5 shadow-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <p className="leading-normal">
                    {t(
                      "Consider tracking emotions before recording thoughts to strengthen the clinical link."
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pb-4 border-b border-slate-50">
          <div className="flex gap-3.5 items-start">
            <div className="bg-fuchsia-50 text-fuchsia-600 p-2 rounded-xl border border-fuchsia-100/30 shrink-0">
              <BrainCircuit className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-sm text-slate-700 mb-1 leading-snug">
                {t("Cognitive Pattern Recognition")}
              </h4>
              {topCognitiveDistortion ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {t("Your most common thinking distortion is:")}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 font-extrabold uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-lg">
                      <Sparkles className="h-3 w-3 text-fuchsia-500 shrink-0 animate-pulse" />
                      {formatDistortionLabel(topCognitiveDistortion.name, t)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {t("Appears in")} {tNum(topCognitiveDistortion.percentage)}% {t("of your thoughts")} (
                    {tNum(topCognitiveDistortion.count)} {t("times")})
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                  {t(
                    "Record more thoughts to identify patterns in your cognitive thinking styles."
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex gap-3.5 items-start">
            <div className="bg-teal-50 text-teal-700 p-2 rounded-xl border border-teal-100/30 shrink-0">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-sm text-slate-700 mb-1 leading-snug">
                {t("Activity-Mood Connection")}
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {t("Tracking")}{" "}
                <span className="font-bold text-teal-700">{tNum(emotions.length)}</span>{" "}
                {t("emotions helps identify how activities and thoughts affect your mood.")}
              </p>

              {emotions.length > 10 && (
                <div className="bg-emerald-50/70 border border-emerald-100/50 rounded-xl p-3 flex gap-2 text-[11px] font-semibold text-emerald-800 mt-2.5 shadow-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5 animate-pulse" />
                  <p className="leading-normal">
                    {t(
                      "Great progress! You are building a highly comprehensive picture of your emotional wellness."
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
