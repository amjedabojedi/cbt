import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { engagementStatsSchema } from "../shared/engagementStats";

const mocks = vi.hoisted(() => ({
  storage: { getAllUsers: vi.fn(), getEmotionRecordsByUser: vi.fn() },
  query: vi.fn(),
  notify: vi.fn(),
  emailEnabled: vi.fn(),
  digest: vi.fn(),
  reminder: vi.fn(),
  updateGoals: vi.fn(),
}));

// Mock every database and delivery dependency before loading the controller.
// Neither existing therapy records nor real notification services can be accessed.
vi.mock("../server/db", () => ({ db: {}, pool: { query: mocks.query } }));
vi.mock("../server/storage", () => ({ storage: mocks.storage }));
vi.mock("../server/services/websocket", () => ({ sendNotificationToUser: mocks.notify }));
vi.mock("../server/services/email", () => ({
  isEmailEnabled: mocks.emailEnabled,
  sendWeeklyProgressDigest: mocks.digest,
  sendEmotionTrackingReminder: mocks.reminder,
}));
vi.mock("../server/controllers/goals.controller", () => ({
  updateGoalStatusBasedOnMilestones: mocks.updateGoals,
}));

import {
  getEngagementStats, checkInactiveClients, sendInactivityReminders,
} from "../server/controllers/admin.controller";

const now = new Date("2026-10-19T12:00:00.000Z");
const cutoff = new Date("2026-10-16T12:00:00.000Z");
const old = "2026-09-01T12:00:00.000Z";
const endpoints = [getEngagementStats, checkInactiveClients, sendInactivityReminders];

function client(id: number, createdAt: Date | string, lastEmotionAt: Date | string | null) {
  return {
    id, name: `Synthetic ${id}`, email: `${id}@example.invalid`,
    therapistId: null, createdAt, lastEmotionAt,
  };
}

async function invoke(handler: typeof getEngagementStats, days?: unknown) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await handler({ query: { days }, body: { days } } as unknown as Request, res as unknown as Response);
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
}

function selectRows(rows: ReturnType<typeof client>[]) {
  mocks.query.mockImplementation(async (query: string, params?: unknown[]) => {
    if (query.includes("SELECT u.id")) return { rows };
    if (query.includes("INSERT INTO notifications")) return { rows: [{ id: Number(params?.[0]) + 100 }] };
    throw new Error("Unexpected query in isolated test");
  });
}

function expectSelectionQuery() {
  const sql = mocks.query.mock.calls.find(([query]) => query.includes("SELECT u.id"))?.[0]
    .replace(/\s+/g, " ").trim();
  // These clauses enforce the eligible population and choose the saved date.
  expect(sql).toContain("WHERE u.role = 'client' AND u.status = 'active'");
  expect(sql).toContain('MAX(e.created_at) AS "lastEmotionAt"');
  expect(sql).toContain("LEFT JOIN emotion_records e ON e.user_id = u.id");
  expect(sql).toContain("GROUP BY u.id");
  expect(sql).not.toContain("e.timestamp");
  expect(sql).not.toContain("EXISTS");
}

describe("shared admin engagement definition", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    mocks.emailEnabled.mockReturnValue(true);
    mocks.reminder.mockResolvedValue(true);
    selectRows([]);
  });

  afterEach(() => {
    // No controller may fall back to reading complete therapy records.
    expect(mocks.storage.getAllUsers).not.toHaveBeenCalled();
    expect(mocks.storage.getEmotionRecordsByUser).not.toHaveBeenCalled();
    expect(mocks.digest).not.toHaveBeenCalled();
    expect(mocks.updateGoals).not.toHaveBeenCalled();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([
    ["recent saved emotion", old, now, false],
    ["one millisecond after cutoff", old, new Date(+cutoff + 1), false],
    ["saved exactly at cutoff", old, cutoff, true],
    ["saved one millisecond before cutoff", old, new Date(+cutoff - 1), true],
    ["old saved emotion", old, old, true],
    ["no records, recently joined", now, null, false],
    ["no records, joined after cutoff", new Date(+cutoff + 1), null, false],
    ["no records, joined exactly at cutoff", cutoff, null, true],
    ["no records, joined before cutoff", new Date(+cutoff - 1), null, true],
    ["no records, old account", old, null, true],
  ] as const)("agrees across all endpoints: %s", async (_name, createdAt, lastEmotionAt, inactive) => {
    selectRows([client(1, createdAt, lastEmotionAt)]);
    const stats = await invoke(getEngagementStats);
    const preview = await invoke(checkInactiveClients);
    const send = await invoke(sendInactivityReminders);

    expect(stats.status).toBe(200);
    expect(stats.body).toEqual({
      deliveryHistoryStatus: "not_tracked",
      lastRunTime: null, totalEmailsSent: null, totalNotificationsSent: null,
      activeClients: inactive ? 0 : 1, inactiveClients: inactive ? 1 : 0,
    });
    expect(preview.status).toBe(200);
    expect(preview.body).toEqual({
      success: true, count: inactive ? 1 : 0, threshold: 3,
      clients: inactive ? [{ id: 1, name: "Synthetic 1", email: "1@example.invalid", therapistId: null }] : [],
    });
    expect(send.status).toBe(200);
    expect(send.body.inactiveClients).toBe(preview.body.count);
    expect(send.body.notificationsSent).toBe(preview.body.count);
    expect(send.body.emailsSent).toBe(preview.body.count);
    // Successful per-request receipts must not turn unknown lifetime totals into zero.
    const refreshed = await invoke(getEngagementStats);
    expect(engagementStatsSchema.parse(refreshed.body)).toEqual(stats.body);
    expect(mocks.notify).toHaveBeenCalledTimes(inactive ? 1 : 0);
    expect(mocks.reminder).toHaveBeenCalledTimes(inactive ? 1 : 0);
    expectSelectionQuery();
  });

  it("uses saved dates even when the emotion date disagrees, and counts each client once", async () => {
    selectRows([
      { ...client(1, old, now), timestamp: old },
      { ...client(2, old, old), timestamp: now },
      client(3, old, null),
    ] as ReturnType<typeof client>[]);
    expect((await invoke(getEngagementStats)).body).toMatchObject({ activeClients: 1, inactiveClients: 2 });
    expect((await invoke(checkInactiveClients)).body.clients.map((c: { id: number }) => c.id)).toEqual([2, 3]);
    await invoke(sendInactivityReminders);
    expect(mocks.reminder.mock.calls).toEqual([
      ["2@example.invalid", "Synthetic 2"], ["3@example.invalid", "Synthetic 3"],
    ]);
    expect(mocks.notify.mock.calls.map(([id]) => id)).toEqual([2, 3]);
    expectSelectionQuery();
  });

  it("excludes inactive accounts and non-clients in the shared query for every endpoint", async () => {
    // Synthetic relational mock: only rows allowed by the asserted WHERE clause
    // reach classification. No live SQL or user records are used.
    const users = [
      { ...client(1, old, old), role: "client", status: "active" },
      { ...client(2, old, old), role: "client", status: "inactive" },
      { ...client(3, old, null), role: "client", status: "inactive" },
      { ...client(4, old, now), role: "client", status: "inactive" },
      { ...client(5, old, old), role: "therapist", status: "active" },
      { ...client(6, old, old), role: "admin", status: "active" },
    ];
    selectRows(users.filter(u => u.role === "client" && u.status === "active"));
    expect((await invoke(getEngagementStats)).body).toMatchObject({ activeClients: 0, inactiveClients: 1 });
    expect((await invoke(checkInactiveClients)).body.clients.map((c: { id: number }) => c.id)).toEqual([1]);
    expect((await invoke(sendInactivityReminders)).body.inactiveClients).toBe(1);
    expect(mocks.notify.mock.calls.map(([id]) => id)).toEqual([1]);
    for (const [sql] of mocks.query.mock.calls.filter(([sql]) => sql.includes("SELECT u.id"))) {
      expect(sql).toContain("u.role = 'client' AND u.status = 'active'");
    }
  });

  it("returns zero counts for an empty eligible population without delivery", async () => {
    expect((await invoke(getEngagementStats)).body).toMatchObject({ activeClients: 0, inactiveClients: 0 });
    expect((await invoke(checkInactiveClients)).body.count).toBe(0);
    expect((await invoke(sendInactivityReminders)).body.inactiveClients).toBe(0);
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.reminder).not.toHaveBeenCalled();
  });

  it.each([1, "7", 365])("uses the same custom threshold %s for all endpoints", async days => {
    const boundary = +now - Number(days) * 86400000;
    selectRows([
      client(1, old, new Date(boundary)),
      client(2, old, new Date(boundary + 1)),
      client(3, new Date(boundary), null),
      client(4, new Date(boundary + 1), null),
    ]);
    expect((await invoke(getEngagementStats, days)).body).toMatchObject({ activeClients: 2, inactiveClients: 2 });
    expect((await invoke(checkInactiveClients, days)).body).toMatchObject({ count: 2, threshold: Number(days) });
    expect((await invoke(sendInactivityReminders, days)).body.inactiveClients).toBe(2);
  });

  it.each([0, -1, 1.5, "", "invalid", Infinity, 366, null, [], {}, ["3"]])(
    "rejects invalid threshold %j before reading or sending", async days => {
      for (const endpoint of endpoints) {
        expect((await invoke(endpoint, days)).status).toBe(400);
      }
      expect(mocks.query).not.toHaveBeenCalled();
      expect(mocks.notify).not.toHaveBeenCalled();
      expect(mocks.reminder).not.toHaveBeenCalled();
    },
  );

  it.each(endpoints)("fails explicitly on a database read error (%s)", async endpoint => {
    mocks.query.mockRejectedValue(new Error("Synthetic unavailable read"));
    const result = await invoke(endpoint);
    expect(result.status).toBe(500);
    expect(result.body).not.toHaveProperty("activeClients");
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.reminder).not.toHaveBeenCalled();
  });

  it("fails rather than classifying unreadable dates as recent", async () => {
    selectRows([client(1, "invalid", null)]);
    for (const endpoint of endpoints) expect((await invoke(endpoint)).status).toBe(500);
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("retains a full 72-hour cutoff across daylight-saving changes", async () => {
    vi.setSystemTime(new Date("2026-11-02T12:00:00Z"));
    selectRows([
      client(1, old, "2026-10-30T12:00:00Z"),
      client(2, old, "2026-10-30T12:00:00.001Z"),
    ]);
    expect((await invoke(getEngagementStats)).body).toMatchObject({ activeClients: 1, inactiveClients: 1 });
    expect((await invoke(checkInactiveClients)).body.clients.map((c: { id: number }) => c.id)).toEqual([1]);
    expect((await invoke(sendInactivityReminders)).body.inactiveClients).toBe(1);
  });

  it("keeps email disabled without changing reminder eligibility", async () => {
    selectRows([client(1, old, null)]);
    mocks.emailEnabled.mockReturnValue(false);
    expect((await invoke(sendInactivityReminders)).body).toMatchObject({
      inactiveClients: 1, notificationsSent: 1, emailsSent: 0, emailsEnabled: false,
    });
    expect(mocks.reminder).not.toHaveBeenCalled();
  });

  it("connects the admin screen to the shared report and manual reminder endpoints", () => {
    const page = readFileSync("client/src/features/admin/pages/EngagementSettings.tsx", "utf8");
    expect(page).toContain("/api/admin/engagement-stats?days=${days}");
    expect(page).toContain('"/api/admin/inactivity/send-reminders"');
    expect(page).toContain('"/api/admin/inactivity/send-reminders", { days: reportDays }');
    expect(page).not.toContain("/api/client-engagement/send-reminders");
    expect(page).toContain("window.confirm(");
    expect(page).toContain("account creation if no records exist");
  });
});
