import { subDays } from "date-fns";

export type ReportingPeriod = "week" | "month" | "all";

export interface IntensityComparison {
  current: number | null;
  previous: number | null;
  change: number | null;
  changePercent: number | null;
}

export interface EmotionalBalance {
  negativeIntensity: IntensityComparison;
  positiveIntensity: IntensityComparison;
  negativeFrequency: number;
  positiveFrequency: number;
}

export function goalProgress(goals: ReadonlyArray<{ status: string }>) {
  const completed = goals.filter(g => g.status === "completed").length;
  // Approval permits work on a goal; it does not mean the goal was achieved.
  const inProgress = goals.filter(g => g.status === "in_progress" || g.status === "approved").length;
  const pending = goals.filter(g => g.status === "pending").length;
  return {
    total: goals.length,
    completed,
    inProgress,
    pending,
    completionRate: goals.length ? Math.round(completed / goals.length * 100) : 0,
  };
}

interface EmotionObservation {
  coreEmotion: string;
  intensity: number;
  timestamp?: string | Date | null;
  createdAt: string | Date;
}

export function emotionalBalance(
  emotions: ReadonlyArray<EmotionObservation>,
  period: ReportingPeriod,
  now = new Date(),
): EmotionalBalance {
  const end = now.getTime();
  const start = subDays(now, period === "week" ? 7 : period === "month" ? 30 : 60).getTime();
  const midpoint = start + (end - start) / 2;
  const valid = emotions.filter(e =>
    Number.isFinite(e.intensity) &&
    Number.isFinite(new Date(e.timestamp ?? e.createdAt).getTime()) &&
    new Date(e.timestamp ?? e.createdAt).getTime() <= end
  );
  const round = (n: number) => Math.round(n * 10) / 10;
  const compare = (families: string[]): IntensityComparison => {
    const observations = valid.filter(e => families.includes(e.coreEmotion));
    const current = observations.filter(e => {
      const date = new Date(e.timestamp ?? e.createdAt).getTime();
      return date >= midpoint;
    });
    const previous = observations.filter(e => {
      const date = new Date(e.timestamp ?? e.createdAt).getTime();
      return date >= start && date < midpoint;
    });
    const average = (entries: EmotionObservation[]) =>
      entries.length ? entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length : null;
    const currentAverage = average(current);
    const previousAverage = average(previous);
    const change = currentAverage !== null && previousAverage !== null
      ? currentAverage - previousAverage : null;
    return {
      current: currentAverage === null ? null : round(currentAverage),
      previous: previousAverage === null ? null : round(previousAverage),
      change: change === null ? null : round(change),
      changePercent: change !== null && previousAverage !== null && previousAverage > 0
        ? Math.round(change / previousAverage * 100) : null,
    };
  };
  return {
    negativeIntensity: compare(["Sadness", "Fear", "Anger", "Disgust"]),
    positiveIntensity: compare(["Joy", "Love"]),
    negativeFrequency: valid.filter(e => ["Sadness", "Fear", "Anger", "Disgust"].includes(e.coreEmotion)).length,
    positiveFrequency: valid.filter(e => ["Joy", "Love"].includes(e.coreEmotion)).length,
  };
}

interface BeliefRatings {
  beliefInOriginal?: number | null;
  beliefInAlternative?: number | null;
}

// These are ratings of two different thoughts, not a before/after measurement.
export function recordedBeliefRatings(thoughts: ReadonlyArray<BeliefRatings>) {
  const validRating = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
  const paired = thoughts.filter(t =>
    validRating(t.beliefInOriginal) && validRating(t.beliefInAlternative)
  );
  if (!paired.length) return null;
  return {
    count: paired.length,
    original: Math.round(paired.reduce((sum, t) => sum + t.beliefInOriginal!, 0) / paired.length),
    alternative: Math.round(paired.reduce((sum, t) => sum + t.beliefInAlternative!, 0) / paired.length),
  };
}
