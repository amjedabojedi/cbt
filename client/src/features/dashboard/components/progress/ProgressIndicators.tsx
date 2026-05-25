import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, CheckCircle2, AlertCircle, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/localize.tsx";

interface ProgressIndicatorsProps {
  emotionalBalance: {
    negativeIntensity: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    positiveIntensity: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    negativeFrequency: number;
    positiveFrequency: number;
  };
  thoughtChallengeRate: {
    rate: number;
    challenged: number;
    total: number;
  };
  totalActivities: number;
  isLoading: boolean;
}

export default function ProgressIndicators({
  emotionalBalance,
  thoughtChallengeRate,
  totalActivities,
  isLoading,
}: ProgressIndicatorsProps) {
  const { t, isRTL, tNum } = useLocalization();

  if (isLoading) {
    return (
      <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="pt-6 px-6 pb-6">
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-2 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isActivelyEngaged = totalActivities >= 10;
  const isChallengingThoughts = thoughtChallengeRate.rate >= 50;
  const isTrackingEmotions =
    emotionalBalance.negativeFrequency + emotionalBalance.positiveFrequency >= 7;
  const showsEmotionalImprovement =
    emotionalBalance.negativeIntensity.change < 0 ||
    emotionalBalance.positiveIntensity.change > 0;

  const recommendations: Array<{ type: "success" | "warning" | "info"; messageKey: string }> = [];

  if (isActivelyEngaged) {
    recommendations.push({
      type: "success",
      messageKey: "Excellent engagement! You are consistently utilizing therapeutic tools.",
    });
  } else {
    recommendations.push({
      type: "info",
      messageKey: "Try to engage with at least 2-3 modules weekly for stronger outcomes.",
    });
  }

  if (isChallengingThoughts) {
    recommendations.push({
      type: "success",
      messageKey:
        "Great work challenging your thoughts! This is a core CBT restructuring skill.",
    });
  } else if (thoughtChallengeRate.total >= 5) {
    recommendations.push({
      type: "warning",
      messageKey:
        "Consider examining evidence for and against more of your recorded thoughts.",
    });
  }

  if (showsEmotionalImprovement) {
    recommendations.push({
      type: "success",
      messageKey:
        "Your emotional patterns show clinical positive change. Keep up the amazing work!",
    });
  }

  if (!isTrackingEmotions && totalActivities > 5) {
    recommendations.push({
      type: "info",
      messageKey:
        "Regular emotion tracking helps identify unconscious triggers and behavioral patterns.",
    });
  }

  const trackedCount =
    emotionalBalance.negativeFrequency + emotionalBalance.positiveFrequency;

  return (
    <Card
      data-testid="progress-indicators"
      className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <CardHeader className="pb-4 pt-5 px-6">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
          <TrendingUp className="h-4.5 w-4.5 text-teal-700" />
          {t("Therapeutic Progress Indicators")}
        </CardTitle>
        <CardDescription className="text-slate-400 font-semibold text-xs mt-0.5">
          {t("Clinical markers based on cognitive behavioral therapy principles")}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span>{t("Engagement Level")}</span>
            <span className="text-teal-700 font-extrabold">
              {tNum(totalActivities)} {t("activities completed")}
            </span>
          </div>
          <Progress
            value={Math.min((totalActivities / 20) * 100, 100)}
            className="h-2 [[&>div]:bg-purple-600>div]:bg-teal-600 bg-slate-100"
          />
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
            {t("Status:")}{" "}
            <span className="text-slate-600">
              {isActivelyEngaged ? t("Highly engaged") : t("Building momentum")}
            </span>
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span>{t("Cognitive Restructuring")}</span>
            <span className="text-indigo-600 font-extrabold">
              {tNum(thoughtChallengeRate.rate)}% {t("completed")}
            </span>
          </div>
          <Progress
            value={thoughtChallengeRate.rate}
            className="h-2 [&>div]:bg-indigo-600 bg-slate-100"
          />
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
            {t("Status:")}{" "}
            <span className="text-slate-600">
              {tNum(thoughtChallengeRate.challenged)} {t("of")} {tNum(thoughtChallengeRate.total)}{" "}
              {t("thoughts challenged")}
            </span>
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span>{t("Emotional Awareness")}</span>
            <span className="text-fuchsia-600 font-extrabold">
              {tNum(trackedCount)} {t("tracked")}
            </span>
          </div>
          <Progress
            value={Math.min((trackedCount / 15) * 100, 100)}
            className="h-2 [&>div]:bg-fuchsia-600 bg-slate-100"
          />
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
            {t("Status:")}{" "}
            <span className="text-slate-600">
              {isTrackingEmotions
                ? t("Consistent emotional logging")
                : t("Continue tracking emotions")}
            </span>
          </p>
        </div>

        <div className="pt-5 border-t border-slate-50">
          <h4 className="text-xs font-extrabold text-slate-700 mb-3.5 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-teal-700 animate-pulse shrink-0" />
            {t("Personalized Clinical Recommendations")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-xl border shadow-xs transition-all duration-300",
                    rec.type === "success"
                      ? "bg-emerald-50/50 text-emerald-850 border-emerald-100/50"
                      : rec.type === "warning"
                        ? "bg-amber-50/50 text-amber-850 border-amber-100/50"
                        : "bg-teal-50/50 text-purple-850 border-teal-100/50"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {rec.type === "success" && (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                    )}
                    {rec.type === "warning" && (
                      <AlertCircle className="h-4.5 w-4.5 text-amber-500 animate-bounce animate-duration-1000" />
                    )}
                    {rec.type === "info" && <Info className="h-4.5 w-4.5 text-teal-700" />}
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">{t(rec.messageKey)}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-semibold italic">
                {t("Keep engaging with cbt tools to receive personalized clinical guidance.")}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
