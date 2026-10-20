import { createRequire } from "node:module";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { disposablePostgres } from "./helpers/disposable-postgres";

// Importing the factory loads no database driver, dotenv, or email transport.
const { createWeeklyDigestProcessor } = createRequire(import.meta.url)("../scripts/send_weekly_digests.cjs");
const { weeklyDigestSlot } = createRequire(import.meta.url)("../scripts/weekly_digest_schedule.cjs");
const sunday = new Date(2026, 9, 18, 8, 0, 25);

describe("weekly digests (synthetic disposable PostgreSQL, mocked email)", () => {
  let fixture: Awaited<ReturnType<typeof disposablePostgres>>;
  const delivery = vi.fn();
  const query = vi.fn();
  let processor: ReturnType<typeof createWeeklyDigestProcessor>;

  beforeAll(async () => {
    fixture = await disposablePostgres();
    await fixture.pool.query(`
      CREATE TABLE engagement_settings (
        weekly_digest_enabled boolean, weekly_digest_day integer, weekly_digest_time text
      );
      CREATE TABLE users (id integer PRIMARY KEY, name text, email text, role text, status text);
      CREATE TABLE emotion_records (user_id integer, timestamp timestamp, core_emotion text);
      CREATE TABLE journal_entries (user_id integer, created_at timestamp);
      CREATE TABLE thought_records (user_id integer, created_at timestamp);
      CREATE TABLE goals (user_id integer, status text, created_at timestamp, updated_at timestamp);
      CREATE TABLE notifications (
        id serial PRIMARY KEY, user_id integer, title text, body text, type text,
        is_read boolean, created_at timestamp
      );
    `);
  }, 30_000);
  afterAll(async () => { await fixture?.close(); });
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    await fixture.pool.query("TRUNCATE engagement_settings, users, emotion_records, journal_entries, thought_records, goals, notifications");
    await fixture.pool.query(`
      INSERT INTO users VALUES
        (1, 'Synthetic active client', 'client@example.invalid', 'client', 'active'),
        (2, 'Synthetic therapist', 'therapist@example.invalid', 'therapist', 'active'),
        (3, 'Synthetic inactive client', 'inactive@example.invalid', 'client', 'inactive');
      INSERT INTO emotion_records VALUES (1, CURRENT_TIMESTAMP - INTERVAL '1 day', 'joy');
    `);
    query.mockImplementation((text, values) => fixture.pool.query(text, values));
    delivery.mockResolvedValue(true);
    processor = createWeeklyDigestProcessor({ pool: { query }, sendEmail: delivery });
  });
  afterEach(() => vi.restoreAllMocks());

  async function save(enabled: boolean, day = 0, time = "08:00") {
    await fixture.pool.query("TRUNCATE engagement_settings");
    await fixture.pool.query("INSERT INTO engagement_settings VALUES ($1, $2, $3)", [enabled, day, time]);
  }
  function onlySettingsRead() {
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain("FROM engagement_settings");
    expect(delivery).not.toHaveBeenCalled();
  }

  it("uses enabled/Sunday/08:00 defaults only for an absent settings row", async () => {
    expect(await processor.processWeeklyDigests({ now: sunday })).toEqual({
      totalUsers: 2, notificationsSent: 2, emailsSent: 2,
    });
    expect(delivery.mock.calls.map(([email]) => email.to)).toEqual([
      "client@example.invalid", "therapist@example.invalid",
    ]);
    // Recent activity does not exclude anyone: this is NOT the daily inactivity audience.
    expect(delivery.mock.calls[0][0].text).toContain("Emotions tracked: 1");
    expect((await fixture.pool.query("SELECT * FROM notifications")).rows).toHaveLength(2);
  });

  it.each([true, false])("blocks all activity reads and delivery when disabled (scheduled=%s)", async scheduled => {
    await save(false);
    expect(await processor.processWeeklyDigests({ now: sunday, scheduled })).toMatchObject({ skipped: true });
    onlySettingsRead();
  });

  it("fails closed on settings read errors before querying any therapy data", async () => {
    query.mockRejectedValueOnce(new Error("synthetic settings failure"));
    await expect(processor.processWeeklyDigests({ now: sunday })).rejects.toThrow("synthetic settings failure");
    onlySettingsRead();
  });

  it.each([
    [null, 0, "08:00"], [true, null, "08:00"], [true, 7, "08:00"],
    [true, 0, null], [true, 0, "8:00"], [true, 0, "24:00"],
  ])("does not default malformed saved settings (%s, %s, %s)", async (enabled, day, time) => {
    await fixture.pool.query("INSERT INTO engagement_settings VALUES ($1, $2, $3)", [enabled, day, time]);
    await expect(processor.processWeeklyDigests({ now: sunday })).rejects.toThrow("Invalid weekly digest settings");
    onlySettingsRead();
  });

  it("picks up changed day, non-hour time, and enabled switch without restarting or closing its pool", async () => {
    await save(true, 1, "12:37");
    expect(await processor.processWeeklyDigests({ now: sunday })).toMatchObject({ skipped: true });
    onlySettingsRead();
    expect(await processor.processWeeklyDigests({ now: new Date(2026, 9, 19, 12, 36) })).toMatchObject({ skipped: true });
    expect(await processor.processWeeklyDigests({ now: new Date(2026, 9, 19, 12, 37) })).toMatchObject({ emailsSent: 2 });
    await save(true, 2, "17:42");
    expect(await processor.processWeeklyDigests({ now: new Date(2026, 9, 19, 12, 37) })).toMatchObject({ skipped: true });
    expect(await processor.processWeeklyDigests({ now: new Date(2026, 9, 20, 17, 42) })).toMatchObject({ emailsSent: 2 });
    await save(false, 2, "17:42");
    expect(await processor.processWeeklyDigests({ now: new Date(2026, 9, 20, 17, 42) })).toMatchObject({ skipped: true });
    expect(delivery).toHaveBeenCalledTimes(4);
  });

  it("allows an enabled explicit admin run outside its schedule", async () => {
    await save(true, 2, "17:42");
    expect(await processor.processWeeklyDigests({ now: sunday, scheduled: false })).toMatchObject({ emailsSent: 2 });
  });

  it("matches the exact local minute, not the whole hour", () => {
    expect(weeklyDigestSlot(undefined, new Date(2026, 9, 18, 8, 1))).toBeNull();
    expect(weeklyDigestSlot(undefined, new Date(2026, 9, 19, 8, 0))).toBeNull();
    expect(weeklyDigestSlot(undefined, sunday)).toBe("2026-10-18T08:00");
  });
});
