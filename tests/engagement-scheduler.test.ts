import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ settings: vi.fn(), deliver: vi.fn() }));
// Never import the real database, clients, email transport, or notification writer.
vi.mock("../server/repositories/admin.repository", () => ({
  AdminRepository: class { getEngagementSettings = mocks.settings; },
}));
vi.mock("../server/services/reminderService", () => ({
  processInactivityReminders: mocks.deliver,
}));

import { EngagementScheduler } from "../server/scheduler";

describe("saved daily reminder schedule (UTC)", () => {
  let scheduler: EngagementScheduler;
  const originalTimezone = process.env.TZ;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T16:44:30Z"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.settings.mockReset().mockResolvedValue({
      reminderTime: "16:45", reminderEnabled: true,
    });
    mocks.deliver.mockReset().mockResolvedValue({ sent: 1, failed: 0 });
    scheduler = new EngagementScheduler();
  });

  afterEach(() => {
    scheduler.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  });

  async function startAt(instant: string) {
    vi.setSystemTime(new Date(instant));
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
  }

  it("sends at the saved minute, not one hour after startup or hardcoded 09:00", async () => {
    await startAt("2026-10-19T16:44:30Z");
    expect(mocks.deliver).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(29_999);
    expect(mocks.deliver).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.deliver).toHaveBeenCalledExactlyOnceWith();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
  });

  it.each(["16:45:00", "16:45:30", "16:45:59.999"])(
    "runs immediately when starting within the target minute (%s)",
    async time => {
      await startAt(`2026-10-19T${time}Z`);
      expect(mocks.deliver).toHaveBeenCalledTimes(1);
    },
  );

  it("does not catch up a missed startup minute; sends on the following UTC day", async () => {
    await startAt("2026-10-19T16:46:00Z");
    expect(mocks.deliver).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(24 * 60 * 60_000 - 60_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
  });

  it("applies saved time changes while running and ignores the old time", async () => {
    await startAt("2026-10-19T16:44:30Z");
    mocks.settings.mockResolvedValue({ reminderTime: "16:46", reminderEnabled: true });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mocks.deliver).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
  });

  it("waits until tomorrow when a saved change selects an already-passed time", async () => {
    await startAt("2026-10-19T16:44:30Z");
    mocks.settings.mockResolvedValue({ reminderTime: "16:43", reminderEnabled: true });
    await vi.advanceTimersByTimeAsync(24 * 60 * 60_000 - 90_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
    expect(new Date().toISOString()).toBe("2026-10-20T16:43:00.000Z");
  });

  it("observes disable and re-enable changes without restarting", async () => {
    await startAt("2026-10-19T16:44:30Z");
    mocks.settings.mockResolvedValue({ reminderTime: "16:45", reminderEnabled: false });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mocks.deliver).not.toHaveBeenCalled();
    mocks.settings.mockResolvedValue({ reminderTime: "16:46", reminderEnabled: true });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
  });

  it("does not send twice after an admin moves today's time later", async () => {
    await startAt("2026-10-19T16:45:00Z");
    mocks.settings.mockResolvedValue({ reminderTime: "16:46", reminderEnabled: true });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
  });

  it("uses enabled 09:00 UTC defaults only when no settings row exists", async () => {
    mocks.settings.mockResolvedValue(undefined);
    await startAt("2026-10-19T08:59:59Z");
    expect(mocks.deliver).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
  });

  it.each(["", "9:00", "24:00", "09:60", "16:45:00", null, undefined])(
    "fails closed for invalid persisted time %s",
    async reminderTime => {
      mocks.settings.mockResolvedValue({ reminderTime, reminderEnabled: true });
      await startAt("2026-10-19T09:00:00Z");
      expect(mocks.deliver).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    },
  );

  it("does not send on failed settings reads and continues checking", async () => {
    mocks.settings.mockRejectedValueOnce(new Error("synthetic read failure"));
    await startAt("2026-10-19T16:44:30Z");
    expect(mocks.deliver).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
  });

  it("does not deliver stale work when a settings read finishes after the target minute", async () => {
    let resolve!: (settings: unknown) => void;
    mocks.settings.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    await startAt("2026-10-19T16:45:59Z");
    await vi.advanceTimersByTimeAsync(1_000);
    resolve({ reminderTime: "16:45", reminderEnabled: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.deliver).not.toHaveBeenCalled();
  });

  it("suppresses overlapping delivery and does not retry a failed daily attempt", async () => {
    let reject!: (error: Error) => void;
    mocks.deliver.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
    await startAt("2026-10-19T16:45:00Z");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.settings).toHaveBeenCalledTimes(1);
    reject(new Error("synthetic delivery failure"));
    await vi.advanceTimersByTimeAsync(0);
    mocks.settings.mockResolvedValue({ reminderTime: "16:47", reminderEnabled: true });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
  });

  it("makes start idempotent and stop cancels the startup/settings work", async () => {
    let resolve!: (settings: unknown) => void;
    mocks.settings.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    await startAt("2026-10-19T16:45:00Z");
    scheduler.start();
    expect(mocks.settings).toHaveBeenCalledTimes(1);
    scheduler.stop();
    resolve({ reminderTime: "16:45", reminderEnabled: true });
    await vi.advanceTimersByTimeAsync(120_000);
    expect(mocks.deliver).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.settings).toHaveBeenCalledTimes(2);
  });

  it("retains the daily attempt guard across stop/start on the same instance", async () => {
    await startAt("2026-10-19T16:45:10Z");
    scheduler.stop();
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
  });

  it("leaves manual triggering immediate and independent of the automatic daily slot", async () => {
    await startAt("2026-10-19T16:44:30Z");
    await scheduler.triggerDailyReminders();
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(2);
  });

  it.each([
    // US spring-forward skips 02:00 local; fall-back repeats 01:30 local.
    ["2026-03-08T06:59:59Z", "07:00", 1_000],
    ["2026-11-01T05:29:59Z", "05:30", 1_000],
    ["2026-11-01T06:29:59Z", "06:30", 1_000],
  ])("keeps UTC time across host DST boundaries at %s", async (instant, time, wait) => {
    process.env.TZ = "America/New_York";
    mocks.settings.mockResolvedValue({ reminderTime: time, reminderEnabled: true });
    await startAt(instant);
    expect(mocks.deliver).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(wait);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(1);
  });

  it("resets the daily guard at UTC midnight even when the host date has not changed", async () => {
    process.env.TZ = "America/New_York";
    mocks.settings.mockResolvedValue({ reminderTime: "23:59", reminderEnabled: true });
    await startAt("2026-10-19T23:59:00Z");
    mocks.settings.mockResolvedValue({ reminderTime: "00:00", reminderEnabled: true });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.deliver).toHaveBeenCalledTimes(2);
  });
});
