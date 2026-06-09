import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Heart, Brain, Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/localize.tsx";

interface CBTProgressSnapshotProps {
  totalActivities: number;
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
  goalProgress: {
    completionRate: number;
    completed: number;
    inProgress: number;
    pending: number;
    total: number;
  };
  isLoading: boolean;
}

const TrendIndicator = ({
  value,
  inverse = false,
}: {
  value: number;
  inverse?: boolean;
}) => {
  const { tNum } = useLocalization();

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
  isLoading,
}: CBTProgressSnapshotProps) {
  const { t, tNum } = useLocalization();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-white border border-slate-100 rounded-2xl">
            <CardContent className="pt-6">
              <div className="h-24 bg-slate-100 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card
        className="bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between"
        data-testid="metric-activity-level"
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              {t("Engagement Level")}
            </span>
            <div className="bg-teal-50 text-teal-700 p-2 rounded-xl group-hover:bg-teal-100 transition-colors duration-300">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-5">
          <div className="text-3xl font-extrabold text-slate-800 mb-1">{tNum(totalActivities)}</div>
          <p className="text-xs font-semibold text-slate-500 mb-3">{t("total activities completed")}</p>
          <div className="pt-2.5 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <span>{t("Behavioral Activation")}</span>
              <span className="text-teal-700 font-extrabold">{t("Active")}</span>
            </div>
            <Progress
              value={Math.min((totalActivities / 20) * 100, 100)}
              className="h-1.5 [&>div]:bg-teal-600"
            />
          </div>
        </CardContent>
      </Card>

      <Card
        className="bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between"
        data-testid="metric-emotional-balance"
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              {t("Emotional Balance")}
            </span>
            <div className="bg-rose-50 text-rose-500 p-2 rounded-xl group-hover:bg-rose-100 transition-colors duration-300">
              <Heart className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-rose-50/20 border border-rose-100/10 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("Negative")}
                </span>
                <TrendIndicator
                  value={emotionalBalance.negativeIntensity.changePercent}
                  inverse={true}
                />
              </div>
              <div className="text-xl font-extrabold text-rose-600">
                {emotionalBalance.negativeIntensity.current > 0
                  ? tNum(emotionalBalance.negativeIntensity.current.toFixed(1))
                  : "—"}
              </div>
            </div>

            <div className="p-2 bg-emerald-50/20 border border-emerald-100/10 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("Positive")}
                </span>
                <TrendIndicator value={emotionalBalance.positiveIntensity.changePercent} />
              </div>
              <div className="text-xl font-extrabold text-emerald-600">
                {emotionalBalance.positiveIntensity.current > 0
                  ? tNum(emotionalBalance.positiveIntensity.current.toFixed(1))
                  : "—"}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{t("Affect Intensity")}</span>
            <span className="text-rose-500 font-extrabold">{t("1-10 Scale")}</span>
          </div>
        </CardContent>
      </Card>

      <Card
        className="bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between"
        data-testid="metric-thought-challenge"
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              {t("Cognitive Restructuring")}
            </span>
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl group-hover:bg-indigo-100 transition-colors duration-300">
              <Brain className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-5">
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
        </CardContent>
      </Card>
    </div>
  );
}
