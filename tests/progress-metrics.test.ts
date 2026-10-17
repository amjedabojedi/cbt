import { describe, expect, it } from "vitest";
import { emotionalBalance, goalProgress, recordedBeliefRatings } from "../shared/progress-metrics";
import { thoughtBeliefFields, hasPairedBeliefRatings } from "../shared/thought-beliefs";
import { insertThoughtRecordSchema } from "../shared/schema";
import { z } from "zod";

const now = new Date("2026-10-17T12:00:00Z");
const feeling = (daysAgo: number, intensity = 7, coreEmotion = "Fear") => ({
  coreEmotion,
  intensity,
  createdAt: new Date(now.getTime() - daysAgo * 86400000),
});

describe("reported goal completion", () => {
  it("counts approved goals as in progress, never achieved", () => {
    expect(goalProgress([{ status: "approved" }])).toEqual({
      total: 1, completed: 0, inProgress: 1, pending: 0, completionRate: 0,
    });
  });
  it("classifies each supported status exactly once", () => {
    const result = goalProgress(["pending", "approved", "in_progress", "completed"].map(status => ({ status })));
    expect(result).toEqual({ total: 4, completed: 1, inProgress: 2, pending: 1, completionRate: 25 });
    expect(result.completed + result.inProgress + result.pending).toBe(result.total);
    expect(goalProgress([]).completionRate).toBe(0);
  });
});

describe("emotion comparisons", () => {
  it("does not turn absent recent observations into a 100% decrease", () => {
    expect(emotionalBalance([feeling(40)], "all", now).negativeIntensity).toEqual({
      current: null, previous: 7, change: null, changePercent: null,
    });
  });
  it("does not invent a baseline or a zero trend when only current data exists", () => {
    expect(emotionalBalance([feeling(1)], "month", now).negativeIntensity).toEqual({
      current: 7, previous: null, change: null, changePercent: null,
    });
  });
  it("distinguishes no observations from genuinely unchanged observations", () => {
    expect(emotionalBalance([], "month", now).negativeIntensity.changePercent).toBeNull();
    expect(emotionalBalance([feeling(1), feeling(20)], "month", now).negativeIntensity.changePercent).toBe(0);
  });
  it("calculates changes only for the same emotion family in both periods", () => {
    const result = emotionalBalance([feeling(1, 4), feeling(20, 8), feeling(1, 9, "Joy")], "month", now);
    expect(result.negativeIntensity).toEqual({ current: 4, previous: 8, change: -4, changePercent: -50 });
    expect(result.positiveIntensity.change).toBeNull();
  });
  it("uses two equal comparison windows and does not compare against all older history", () => {
    const result = emotionalBalance([feeling(1, 4), feeling(45, 8), feeling(100, 1)], "all", now);
    expect(result.negativeIntensity.previous).toBe(8);
    expect(result.negativeFrequency).toBe(3);
  });
  it("uses the chosen occurrence date and excludes future observations", () => {
    const result = emotionalBalance([
      { ...feeling(1, 6), timestamp: feeling(20).createdAt },
      feeling(1, 3),
      feeling(-1, 10),
    ], "month", now);
    expect(result.negativeIntensity).toEqual({ current: 3, previous: 6, change: -3, changePercent: -50 });
    expect(result.negativeFrequency).toBe(2);
  });
  it("keeps an actual zero rating but does not divide by zero", () => {
    expect(emotionalBalance([feeling(1, 0), feeling(20, 0)], "month", now).negativeIntensity)
      .toEqual({ current: 0, previous: 0, change: 0, changePercent: null });
  });
  it("splits a week into equal halves without overlapping observations", () => {
    const result = emotionalBalance([feeling(1, 3), feeling(5, 6), feeling(8, 10)], "week", now);
    expect(result.negativeIntensity).toEqual({ current: 3, previous: 6, change: -3, changePercent: -50 });
  });
});

describe("explicitly recorded belief ratings", () => {
  it("does not derive original beliefs from legacy reflection ratings", () => {
    const legacy = { reflectionRating: 9 };
    expect(recordedBeliefRatings([legacy as { beliefInOriginal?: number }])).toBeNull();
  });
  it("averages only paired ratings, preserving zero and 100", () => {
    expect(recordedBeliefRatings([
      { beliefInOriginal: 0, beliefInAlternative: 100 },
      { beliefInOriginal: 80, beliefInAlternative: 60 },
      { beliefInOriginal: 90 },
      { beliefInOriginal: null, beliefInAlternative: null },
    ])).toEqual({ count: 2, original: 40, alternative: 80 });
  });
  const update = z.object(thoughtBeliefFields).refine(hasPairedBeliefRatings);
  it.each([
    { beliefInOriginal: -1, beliefInAlternative: 70 },
    { beliefInOriginal: 50, beliefInAlternative: 101 },
    { beliefInOriginal: 50.5, beliefInAlternative: 70 },
    { beliefInOriginal: "50", beliefInAlternative: 70 },
    { beliefInOriginal: 50 },
    { beliefInAlternative: 70 },
    { beliefInOriginal: null, beliefInAlternative: null },
  ])("rejects invalid or incomplete ratings: %j", data => {
    expect(update.safeParse(data).success).toBe(false);
    expect(insertThoughtRecordSchema.safeParse({
      userId: 1, automaticThoughts: "Synthetic thought", cognitiveDistortions: [], ...data,
    }).success).toBe(false);
  });
  it("keeps older writes valid and accepts valid paired ratings", () => {
    expect(update.safeParse({}).success).toBe(true);
    expect(update.parse({ beliefInOriginal: 0, beliefInAlternative: 100 })).toEqual({
      beliefInOriginal: 0, beliefInAlternative: 100,
    });
  });
});
