import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Heart, Brain, Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/localize.tsx";
import { practiceMilestone } from "@/utils/practiceProgress";
import { useAuth } from "@/lib/auth";
import type { EmotionalBalance, ReportingPeriod } from "@shared/progress-metrics";
import { type ProgressModules, combineProgressStatus } from "@/hooks/use-progress-insights";
import ProgressDataBoundary from "./ProgressDataBoundary";

interface CBTProgressSnapshotProps {
  modules: ProgressModules;
  totalActivities: number;
  emotionalBalance: EmotionalBalance;
  timeRange: ReportingPeriod;
  thoughtChallengeRate: {
    rate: number;
    challenged: number;
    total: number;
  };
  goalProgress: {
    completionRate: number;
    completed: number;
    inProgress: number;
    pending: number;
    total: number;
  };
}

const TrendIndicator = ({
  value,
  inverse = false,
}: {
  value: number | null;
  inverse?: boolean;
}) => {
  const { t, tNum } = useLocalization();

  if (value === null) {
    return <span className="text-[10px] text-slate-500">{t("Comparison unavailable")}</span>;
  }

  if (value === 0) {
    return (
      <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100/50">
        <Minus className="h-3 w-3 me-1" />
        <span>{tNum("0")}%</span>
      </div>
    );
  }

  const isPositiveChange = inverse ? value < 0 : value > 0;

  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border",
        isPositiveChange
          ? "bg-emerald-50 text-emerald-700 border-emerald-100/50"
          : "bg-rose-50 text-rose-700 border-rose-100/50"
      )}
    >
      {value > 0 ? (
        <TrendingUp className="h-3 w-3 me-1" />
      ) : (
        <TrendingDown className="h-3 w-3 me-1" />
      )}
      <span>
        {tNum(Math.abs(value))}%
      </span>
    </div>
  );
};

export default function CBTProgressSnapshot({
  totalActivities,
  emotionalBalance,
  thoughtChallengeRate,
  goalProgress,
  timeRange,
  modules,
}: CBTProgressSnapshotProps) {
  const { t, tNum } = useLocalization();
  const { user } = useAuth();
  const clinicalView = user?.role === "therapist" || user?.role === "admin";
  const milestone = practiceMilestone(totalActivities);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card
        className="bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between"
        data-testid="metric-activity-level"
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              {t("Practice activities")}
            </span>
            <div className="bg-teal-50 text-teal-700 p-2 rounded-xl group-hover:bg-teal-100 transition-colors duration-300">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-5">
          <ProgressDataBoundary status={combineProgressStatus(Object.values(modules))}>
          <div className="text-3xl font-extrabold text-slate-800 mb-1">{tNum(totalActivities)}</div>
          <p className="text-xs font-semibold text-slate-500 mb-3">{t("Saved emotions, thoughts, journal entries, goals and reframe sessions in the selected period. Each counts once.")}</p>
          <div className="pt-2.5 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <span>{t("Next practice milestone")}</span>
              <span className="text-teal-700 font-extrabold">{tNum(totalActivities)} / {tNum(milestone.target)}</span>
            </div>
            <Progress
              value={milestone.percent}
              className="h-1.5 [&>div]:bg-teal-600"
            />
            <p className="text-xs text-slate-500 mt-2">{t("Practice milestones: 3, 10, 25, 50, then every 50 activities. These are encouragement, not treatment targets or a measure of recovery.")}</p>
          </div>
          </ProgressDataBoundary>
        </CardContent>
      </Card>

      <Card
        className="bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between"
        data-testid="metric-emotional-balance"
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              {t(clinicalView ? "Emotional Balance" : "How strong your feelings were")}
            </span>
            <div className="bg-rose-50 text-rose-500 p-2 rounded-xl group-hover:bg-rose-100 transition-colors duration-300">
              <Heart className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-5 space-y-3">
          <ProgressDataBoundary status={modules.emotions}>
          {emotionalBalance.negativeFrequency + emotionalBalance.positiveFrequency === 0 ? (
            <p className="text-sm text-slate-500 py-4">{t("Not enough data yet. Record feelings to see patterns over time.")}</p>
          ) : <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-rose-50/20 border border-rose-100/10 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t(clinicalView ? "Negative" : "Difficult feelings")}
                </span>
                <TrendIndicator
                  value={emotionalBalance.negativeIntensity.changePercent}
                  inverse={true}
                />
              </div>
              <div className="text-xl font-extrabold text-rose-600">
                {emotionalBalance.negativeIntensity.current !== null
                  ? tNum(emotionalBalance.negativeIntensity.current.toFixed(1))
                  : "—"}
              </div>
            </div>

            <div className="p-2 bg-emerald-50/20 border border-emerald-100/10 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t(clinicalView ? "Positive" : "Pleasant feelings")}
                </span>
                <TrendIndicator value={emotionalBalance.positiveIntensity.changePercent} />
              </div>
              <div className="text-xl font-extrabold text-emerald-600">
                {emotionalBalance.positiveIntensity.current !== null
                  ? tNum(emotionalBalance.positiveIntensity.current.toFixed(1))
                  : "—"}
              </div>
            </div>
          </div>}

          <p className="text-xs text-slate-500">
            {t(timeRange === "all"
              ? "Intensity compares the last 30 days with the previous 30 days."
              : "Intensity compares the most recent half with the earlier half of the selected period.")}
            {" "}{t("Both periods need recorded feelings in the same category. Missing entries are not zero intensity or evidence of improvement.")}
          </p>
          <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{t(clinicalView ? "Affect Intensity" : "Feeling intensity")}</span>
            <span className="text-rose-500 font-extrabold">{t("1-10 Scale")}</span>
          </div>
          </ProgressDataBoundary>
        </CardContent>
      </Card>

      <Card
        className="bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between"
        data-testid="metric-thought-challenge"
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              {t(clinicalView ? "Cognitive Restructuring" : "Thoughts you've challenged")}
            </span>
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl group-hover:bg-indigo-100 transition-colors duration-300">
              <Brain className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-5">
          <ProgressDataBoundary status={modules.thoughts}>
          <div className="text-3xl font-extrabold text-slate-800 mb-1">
            {tNum(thoughtChallengeRate.rate)}%
          </div>
          <p className="text-xs font-semibold text-slate-500 mb-3">{t("examined with evidence")}</p>
          <div className="pt-2.5 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <span>{t("Challenged Thoughts")}</span>
              <span className="text-indigo-600 font-extrabold">
                {tNum(thoughtChallengeRate.challenged)} / {tNum(thoughtChallengeRate.total)}
              </span>
            </div>
            <Progress value={thoughtChallengeRate.rate} className="h-1.5 [&>div]:bg-indigo-600" />
          </div>
          </ProgressDataBoundary>
        </CardContent>
      </Card>

      <Card
        className="bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between"
        data-testid="metric-goal-progress"
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              {t("Goal Progress")}
            </span>
            <div className="bg-fuchsia-50 text-fuchsia-600 p-2 rounded-xl group-hover:bg-fuchsia-100 transition-colors duration-300">
              <Target className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-5">
          <ProgressDataBoundary status={modules.goals}>
          <div className="text-3xl font-extrabold text-slate-800 mb-1">
            {tNum(goalProgress.completionRate)}%
          </div>
          <p className="text-xs font-semibold text-slate-500 mb-3">{t("goal completion rate")}</p>
          <div className="pt-2.5 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <span>{t("Completed Goals")}</span>
              <span className="text-fuchsia-600 font-extrabold">
                {tNum(goalProgress.completed)} / {tNum(goalProgress.total)}
              </span>
            </div>
            <Progress value={goalProgress.completionRate} className="h-1.5 [&>div]:bg-fuchsia-600" />
          </div>
          </ProgressDataBoundary>
        </CardContent>
      </Card>
    </div>
  );
}
