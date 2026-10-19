import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { disposablePostgres } from "./helpers/disposable-postgres";

const mocks = vi.hoisted(() => ({
  query: vi.fn(), settings: vi.fn(), email: vi.fn(), notification: vi.fn(),
}));

// Never load the workspace DB, email transport, websocket, or notification writer.
vi.mock("../server/db", () => ({ db: {}, pool: { query: mocks.query } }));
vi.mock("../server/repositories/admin.repository", () => ({
  AdminRepository: class { getEngagementSettings = mocks.settings; },
}));
vi.mock("../server/services/email", () => ({ sendEmail: mocks.email }));
vi.mock("../server/services/notificationService", () => ({ createNotification: mocks.notification }));

import { getAdminClientEngagement } from "../server/services/adminEngagement";
import { findInactiveClients, processInactivityReminders } from "../server/services/reminderService";
import { engagementScheduler } from "../server/scheduler";

const now = new Date("2026-10-19T12:00:00Z");
const day = 86_400_000;
const old = new Date(+now - 400 * day);
const config = { inactivityThreshold: 3, sendEmails: true, createNotifications: true };

describe("automatic/admin inactivity parity (disposable PostgreSQL, mocked delivery)", () => {
  let fixture: Awaited<ReturnType<typeof disposablePostgres>>;

  beforeAll(async () => {
    fixture = await disposablePostgres();
    await fixture.pool.query(`
      CREATE TABLE users (
        id integer PRIMARY KEY, name text, email text, therapist_id integer,
        role text, status text, created_at timestamptz NOT NULL
      );
      CREATE TABLE emotion_records (
        id serial PRIMARY KEY, user_id integer, created_at timestamptz,
        timestamp timestamptz
      );
    `);
  }, 30_000);
  afterAll(async () => { await fixture?.close(); });

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await fixture.pool.query("TRUNCATE users, emotion_records RESTART IDENTITY");
    mocks.query.mockImplementation((text, values) => fixture.pool.query(text, values));
    mocks.settings.mockResolvedValue(undefined);
    mocks.email.mockResolvedValue(true);
    mocks.notification.mockResolvedValue({ id: 1 });
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  async function client(
    id: number, createdAt: Date, savedAt: Date | null,
    recordedAt = savedAt, status = "active", role = "client",
  ) {
    await fixture.pool.query(
      "INSERT INTO users VALUES ($1, $2, $3, NULL, $4, $5, $6)",
      [id, `Synthetic ${id}`, `${id}@example.invalid`, role, status, createdAt],
    );
    if (savedAt) await emotion(id, savedAt, recordedAt);
  }
  async function emotion(id: number, savedAt: Date, recordedAt: Date | null) {
    await fixture.pool.query(
      "INSERT INTO emotion_records (user_id, created_at, timestamp) VALUES ($1, $2, $3)",
      [id, savedAt, recordedAt],
    );
  }
  function recipients() {
    return mocks.notification.mock.calls.map(([data]) => data.userId).sort((a, b) => a - b);
  }

  it.each([1, 3, 7, 365])("matches report eligibility at the %i-day cutoff", async days => {
    const cutoff = +now - days * day;
    await client(1, old, new Date(cutoff - 1));
    await client(2, old, new Date(cutoff));
    await client(3, old, new Date(cutoff + 1));
    await client(4, new Date(cutoff - 1), null);
    await client(5, new Date(cutoff), null);
    await client(6, new Date(cutoff + 1), null);
    await client(7, now, null);
    // All account-status and role filtering happens in real isolated SQL.
    await client(8, old, old, old, "inactive");
    await client(9, old, null, null, "inactive");
    await client(10, old, old, old, "active", "therapist");
    await client(11, old, null, null, "active", "admin");
    // Recorded dates intentionally disagree with saved dates.
    await client(12, old, now, old);
    await client(13, old, old, now);
    await emotion(13, new Date(+old - day), new Date(+now + day));
    await emotion(12, old, now);

    const expected = [1, 2, 4, 5, 13];
    const report = await getAdminClientEngagement(days);
    expect(report.filter(c => c.inactive).map(c => c.id).sort((a, b) => a - b)).toEqual(expected);
    expect((await findInactiveClients(days)).map(c => c.id).sort((a, b) => a - b)).toEqual(expected);
    expect(await processInactivityReminders({ ...config, inactivityThreshold: days }))
      .toEqual({ sent: expected.length, failed: 0 });
    expect(recipients()).toEqual(expected);
    expect(mocks.email.mock.calls.map(([data]) => data.to).sort())
      .toEqual(expected.map(id => `${id}@example.invalid`).sort());
    for (const [query] of mocks.query.mock.calls) {
      expect(query).not.toMatch(/thought_records|journal_entries|goals|e\.timestamp/);
    }
  });

  it("includes never-recorded clients after the full grace period even without any emotion rows", async () => {
    await client(1, new Date(+now - 3 * day), null);
    await client(2, new Date(+now - 3 * day + 1), null);
    expect(await processInactivityReminders(config)).toEqual({ sent: 1, failed: 0 });
    expect(recipients()).toEqual([1]);
    expect(mocks.notification.mock.calls[0][0].body).toContain("haven't saved your first one");
  });

  it("uses 72 full hours across a daylight-saving boundary", async () => {
    vi.setSystemTime(new Date("2026-11-02T12:00:00Z"));
    await client(1, old, new Date("2026-10-30T12:00:00Z"));
    await client(2, old, new Date("2026-10-30T12:00:00.001Z"));
    await processInactivityReminders(config);
    expect(recipients()).toEqual([1]);
  });

  it("reads the saved threshold on every scheduler trigger rather than hardcoding three days", async () => {
    await client(1, old, new Date(+now - 7 * day));
    await client(2, old, new Date(+now - 3 * day));
    mocks.settings.mockResolvedValue({ reminderDays: 7, reminderEnabled: true });
    await engagementScheduler.triggerDailyReminders();
    expect(recipients()).toEqual([1]);
    mocks.notification.mockClear();
    mocks.settings.mockResolvedValue({ reminderDays: 3, reminderEnabled: true });
    await engagementScheduler.triggerDailyReminders();
    expect(recipients()).toEqual([1, 2]);
    expect(mocks.settings).toHaveBeenCalledTimes(2);
  });

  it("uses the default three-day rule when no settings exist", async () => {
    await client(1, new Date(+now - 3 * day), null);
    await client(2, new Date(+now - 3 * day + 1), null);
    await processInactivityReminders();
    expect(recipients()).toEqual([1]);
  });

  it("does not read activity or send anything when daily reminders are disabled", async () => {
    mocks.settings.mockResolvedValue({ reminderDays: 7, reminderEnabled: false });
    await engagementScheduler.triggerDailyReminders();
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.email).not.toHaveBeenCalled();
    expect(mocks.notification).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, 366, NaN, null, "bad"])(
    "rejects invalid configured thresholds (%s) without selecting or delivering", async days => {
      mocks.settings.mockResolvedValue({ reminderDays: days, reminderEnabled: true });
      await expect(processInactivityReminders()).rejects.toThrow(RangeError);
      await expect(findInactiveClients(days as number)).rejects.toThrow(RangeError);
      expect(mocks.query).not.toHaveBeenCalled();
      expect(mocks.email).not.toHaveBeenCalled();
      expect(mocks.notification).not.toHaveBeenCalled();
    },
  );

  it("fails closed on settings and activity read failures", async () => {
    mocks.settings.mockRejectedValueOnce(new Error("Synthetic settings failure"));
    await expect(processInactivityReminders()).rejects.toThrow("Synthetic settings failure");
    expect(mocks.query).not.toHaveBeenCalled();
    mocks.query.mockRejectedValue(new Error("Synthetic activity failure"));
    await expect(processInactivityReminders(config)).rejects.toThrow("Synthetic activity failure");
    expect(mocks.email).not.toHaveBeenCalled();
    expect(mocks.notification).not.toHaveBeenCalled();
  });

  it.each([
    { sendEmails: false, createNotifications: true },
    { sendEmails: true, createNotifications: false },
  ])("keeps delivery channel choices independent of eligibility: %j", async channels => {
    await client(1, old, null);
    await processInactivityReminders({ ...config, ...channels });
    expect(mocks.email).toHaveBeenCalledTimes(channels.sendEmails ? 1 : 0);
    expect(mocks.notification).toHaveBeenCalledTimes(channels.createNotifications ? 1 : 0);
  });

  it("keeps the legacy multi-tool controller out of the live route tree", () => {
    const entrypoints = ["server/routes.ts", ...readdirSync("server/routes").map(f => `server/routes/${f}`)];
    for (const file of entrypoints) {
      expect(readFileSync(file, "utf8")).not.toMatch(/inactivityReminders|client-engagement/);
    }
  });
});
