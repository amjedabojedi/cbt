import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ settings: vi.fn(), process: vi.fn() }));
vi.mock("../server/services/reminderService", () => ({ processInactivityReminders: vi.fn() }));
vi.mock("../server/repositories/admin.repository", () => ({
  AdminRepository: class { getEngagementSettings = mocks.settings; },
}));
vi.mock("../server/db", () => ({ pool: {} }));
vi.mock("../server/services/email", () => ({ sendEmail: vi.fn() }));
vi.mock("../scripts/send_weekly_digests.cjs", () => ({
  createWeeklyDigestProcessor: () => ({ processWeeklyDigests: mocks.process }),
}));
import { engagementScheduler } from "../server/scheduler";

describe("automatic weekly digest scheduler (no database or delivery)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 19, 12, 36, 20));
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.settings.mockResolvedValue({
      weeklyDigestEnabled: true, weeklyDigestDay: 1, weeklyDigestTime: "12:37",
    });
    mocks.process.mockResolvedValue({ emailsSent: 1 });
  });
  afterEach(() => {
    engagementScheduler.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("honors runtime switch/day/time changes and stops polling on stop", async () => {
    engagementScheduler.start();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.process).toHaveBeenCalledExactlyOnceWith({ scheduled: true });
    mocks.settings.mockResolvedValue({
      weeklyDigestEnabled: false, weeklyDigestDay: 1, weeklyDigestTime: "12:38",
    });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.process).toHaveBeenCalledTimes(1);
    mocks.settings.mockResolvedValue({
      weeklyDigestEnabled: true, weeklyDigestDay: 2, weeklyDigestTime: "12:39",
    });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.process).toHaveBeenCalledTimes(1);
    mocks.settings.mockResolvedValue({
      weeklyDigestEnabled: true, weeklyDigestDay: 1, weeklyDigestTime: "12:40",
    });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.process).toHaveBeenCalledTimes(2);
    engagementScheduler.stop();
    const reads = mocks.settings.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.settings).toHaveBeenCalledTimes(reads);
  });

  it("fails closed on unreadable or invalid settings, then recovers on a later poll", async () => {
    mocks.settings.mockRejectedValueOnce(new Error("synthetic failure"));
    engagementScheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.process).not.toHaveBeenCalled();
    mocks.settings.mockResolvedValue({ weeklyDigestEnabled: true, weeklyDigestDay: 1, weeklyDigestTime: "bad" });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.process).not.toHaveBeenCalled();
    mocks.settings.mockResolvedValue({ weeklyDigestEnabled: true, weeklyDigestDay: 1, weeklyDigestTime: "12:38" });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.process).toHaveBeenCalledTimes(1);
  });

  it("checks immediately at startup and prevents repeated or overlapping sends", async () => {
    vi.setSystemTime(new Date(2026, 9, 18, 8, 0));
    mocks.settings.mockResolvedValue(undefined);
    let finish!: (value: object) => void;
    mocks.process.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    engagementScheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.process).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.settings).toHaveBeenCalledTimes(1);
    finish({});
    await vi.advanceTimersByTimeAsync(0);
    engagementScheduler.stop();
    vi.setSystemTime(new Date(2026, 9, 18, 8, 0, 50));
    engagementScheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.process).toHaveBeenCalledTimes(1);
  });

  it("marks an explicit admin trigger as unscheduled (processor still checks enabled)", async () => {
    await engagementScheduler.triggerWeeklyDigests();
    expect(mocks.process).toHaveBeenCalledWith({ scheduled: false });
  });
});
