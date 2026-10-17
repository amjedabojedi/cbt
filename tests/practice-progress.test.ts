import { describe, expect, it } from "vitest";
import { practiceMilestone, isRecordedToday } from "../client/src/utils/practiceProgress";

describe("practice milestones", () => {
  it("shows explicit next milestones rather than an arbitrary percentage", () => {
    expect(practiceMilestone(0)).toEqual({ total: 0, target: 3, remaining: 3, percent: 0 });
    expect(practiceMilestone(2).remaining).toBe(1);
    expect(practiceMilestone(3).target).toBe(10);
    expect(practiceMilestone(10).target).toBe(25);
    expect(practiceMilestone(25).target).toBe(50);
    expect(practiceMilestone(50).target).toBe(100);
    expect(practiceMilestone(100).target).toBe(150);
    expect(practiceMilestone(NaN).total).toBe(0);
  });
  it("counts today's activity, not lifetime activity, in local calendar days", () => {
    const now = new Date(2026, 9, 16, 12);
    expect(isRecordedToday(new Date(2026, 9, 16, 0, 1), now)).toBe(true);
    expect(isRecordedToday(new Date(2026, 9, 15, 23, 59), now)).toBe(false);
    expect(isRecordedToday("invalid", now)).toBe(false);
    expect(isRecordedToday(null, now)).toBe(false);
  });
});
