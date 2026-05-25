/**
 * ReframePracticeHistory - Displays a history of reframe practice results
 */
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, BarChart3, Clock, BrainCircuit, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/localize.tsx";
import { formatDistortionLabel } from "@/features/reframe/utils/reframeLabels";

interface ReframePracticeHistoryProps {
  userId: number;
  thoughtId?: number;
  className?: string;
  limit?: number;
}

const ReframePracticeHistory: React.FC<ReframePracticeHistoryProps> = ({
  userId,
  thoughtId,
  className,
  limit = 3,
}) => {
  const { user } = useAuth();
  const { t, tNum, isRTL } = useLocalization();
  const dateLocale = isRTL ? { locale: arLocale } : undefined;

  const { data: results, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/reframe-coach/results`],
    enabled: !!userId,
  });

  const filteredResults = React.useMemo(() => {
    if (!results || !Array.isArray(results)) return [];

    let filtered = results;
    if (thoughtId) {
      filtered = results.filter((result: any) => result.thoughtRecordId === thoughtId);
    }

    return filtered
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [results, thoughtId, limit]);

  if (isLoading) {
    return (
      <Card className={cn("border border-slate-100 shadow-sm rounded-2xl bg-white", className)}>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-teal-700 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">{t("Loading practice history...")}</p>
        </CardContent>
      </Card>
    );
  }

  if (!filteredResults.length) {
    return (
      <Card className={cn("border border-slate-100 shadow-sm rounded-2xl bg-white", className)}>
        <CardContent className="py-8 text-center">
          <BrainCircuit className="h-8 w-8 text-teal-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 mb-1">{t("No Practice History")}</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {t("No practice sessions found for this thought record. Complete a practice session to see your results here.")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir={isRTL ? "rtl" : "ltr"} className={cn("border border-slate-100 shadow-sm rounded-2xl bg-white", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-slate-800">{t("Practice History")}</CardTitle>
        <CardDescription className="text-slate-500">{t("Your recent practice results")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredResults.map((result: any) => (
          <Card key={result.id} className="border border-slate-100 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all duration-200">
            <CardContent className="py-4 px-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <BarChart3 className="me-2 h-4 w-4 text-teal-700" />
                  <span className="text-sm font-semibold text-slate-800">{t("Practice Session")}</span>
                </div>
                <div className="text-xs text-slate-500 flex items-center font-medium">
                  <Clock className="me-1 h-3 w-3" />
                  {format(new Date(result.createdAt), "MMM d, yyyy", dateLocale)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 my-3">
                <div className="text-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t("Score")}</p>
                  <p className="text-lg font-extrabold text-teal-700">{tNum(result.score)}</p>
                </div>
                <div className="text-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t("Correct")}</p>
                  <p className="text-lg font-extrabold text-indigo-600">
                    {tNum(result.correctAnswers || result.correctCount || 0)} / {tNum(result.totalQuestions || result.totalCount || 0)}
                  </p>
                </div>
                <div className="text-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t("Accuracy")}</p>
                  <p className="text-lg font-extrabold text-violet-600">
                    {tNum(
                      Math.round(
                        ((result.correctAnswers || result.correctCount || 0) /
                          (result.totalQuestions || result.totalCount || 1)) *
                          100
                      )
                    )}
                    %
                  </p>
                </div>
              </div>

              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {result.scenarioData && Array.isArray(result.scenarioData) ? (
                    Array.from(
                      new Set(
                        result.scenarioData
                          .map((scenario: any) => scenario.cognitiveDistortion)
                          .filter(Boolean)
                      )
                    ).map((distortion: any, index: number) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-teal-50 text-purple-700 border-teal-100 hover:bg-teal-100 text-xs font-semibold px-2 py-0.5 rounded-md"
                      >
                        <BrainCircuit className="me-1 h-3.5 w-3.5 text-teal-600 inline-block" />
                        {formatDistortionLabel(String(distortion), t)}
                      </Badge>
                    ))
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-teal-50 text-purple-700 border-teal-100 hover:bg-teal-100 text-xs font-semibold px-2 py-0.5 rounded-md"
                    >
                      {t("Cognitive Restructuring Practice")}
                    </Badge>
                  )}
                </div>
              </div>

              {result.streakCount > 1 && (
                <div className="flex items-center text-xs text-fuchsia-700 mt-2 bg-fuchsia-50 border border-fuchsia-100 p-2.5 rounded-xl font-semibold">
                  <ThumbsUp className="h-3.5 w-3.5 me-1.5 text-fuchsia-600" />
                  <span>
                    {t("Streak:")} {tNum(result.streakCount)} {t("correct answers in a row!")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default ReframePracticeHistory;
