import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  storage: {
    getAllUsers: vi.fn(),
    getEmotionRecordsByUser: vi.fn(),
  },
  query: vi.fn(),
  notify: vi.fn(),
  emailEnabled: vi.fn(),
  digest: vi.fn(),
  reminder: vi.fn(),
  updateGoals: vi.fn(),
}));

// Replace dependencies before importing the controller. No real database,
// therapy storage, goal controller, email, or websocket code is evaluated.
vi.mock("../server/db", () => ({
  db: { select: mocks.query },
  pool: { query: mocks.query },
}));
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

import { getEngagementStats } from "../server/controllers/admin.controller";

const now = new Date("2026-10-19T12:00:00.000Z");
const cutoff = new Date("2026-10-16T12:00:00.000Z");
const client = { id: 1, role: "client", status: "active" };
const secondClient = { id: 2, role: "client", status: "inactive" };
const therapist = { id: 3, role: "therapist", status: "active" };
const admin = { id: 4, role: "admin", status: "active" };

function emotion(createdAt: Date | string) {
  return { createdAt };
}

async function requestStats() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await getEngagementStats({} as Request, res as unknown as Response);
  return res;
}

function expectStats(
  res: Awaited<ReturnType<typeof requestStats>>,
  activeClients: number,
  inactiveClients: number,
) {
  expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
  expect(res.json).toHaveBeenCalledExactlyOnceWith({
    lastRunTime: null,
    totalEmailsSent: 0,
    totalNotificationsSent: 0,
    activeClients,
    inactiveClients,
  });
}

describe("admin engagement statistics", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.storage.getAllUsers.mockResolvedValue([]);
    mocks.storage.getEmotionRecordsByUser.mockResolvedValue([]);
  });

  afterEach(() => {
    try {
      for (const dependency of [
        mocks.query, mocks.notify, mocks.emailEnabled,
        mocks.digest, mocks.reminder, mocks.updateGoals,
      ]) {
        expect(dependency).not.toHaveBeenCalled();
      }
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });

  it.each([
    { name: "recent", records: [emotion(now)], active: 1 },
    {
      name: "one millisecond newer than the cutoff",
      records: [emotion(new Date(cutoff.getTime() + 1))],
      active: 1,
    },
    { name: "exactly at the cutoff", records: [emotion(cutoff)], active: 0 },
    {
      name: "one millisecond older than the cutoff",
      records: [emotion(new Date(cutoff.getTime() - 1))],
      active: 0,
    },
    { name: "old", records: [emotion("2026-09-01T12:00:00.000Z")], active: 0 },
    { name: "absent", records: [], active: 0 },
  ])("classifies $name emotion records", async ({ records, active }) => {
    mocks.storage.getAllUsers.mockResolvedValue([client]);
    mocks.storage.getEmotionRecordsByUser.mockResolvedValue(records);

    expectStats(await requestStats(), active, 1 - active);
    expect(mocks.storage.getAllUsers).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.storage.getEmotionRecordsByUser).toHaveBeenCalledExactlyOnceWith(client.id);
  });

  it("counts each client once using any recent createdAt, not account status or record timestamp", async () => {
    const clients = [
      client, secondClient,
      { id: 5, role: "client", status: "active" },
      { id: 6, role: "client", status: "active" },
      { id: 7, role: "client", status: "active" },
    ];
    const records = new Map([
      [1, [
        { createdAt: "2026-09-01T12:00:00.000Z", timestamp: now },
        { createdAt: now.toISOString(), timestamp: cutoff },
        { createdAt: now, timestamp: cutoff },
      ]],
      [2, [{ createdAt: now, timestamp: cutoff }]],
      [5, [{ createdAt: "2026-09-01T12:00:00.000Z", timestamp: now }]],
      [6, []],
      [7, [{ createdAt: cutoff, timestamp: now }]],
      // Non-clients have recent activity but must never be read or counted.
      [3, [{ createdAt: now, timestamp: now }]],
      [4, [{ createdAt: now, timestamp: now }]],
    ]);
    mocks.storage.getAllUsers.mockResolvedValue([...clients, therapist, admin]);
    mocks.storage.getEmotionRecordsByUser.mockImplementation(async (id: number) => {
      if (!records.has(id)) throw new Error("Unexpected synthetic user");
      return records.get(id);
    });

    expectStats(await requestStats(), 2, 3);
    expect(mocks.storage.getEmotionRecordsByUser.mock.calls).toEqual(
      clients.map(({ id }) => [id]),
    );
  });

  it.each([
    { name: "no users", users: [] },
    { name: "only non-client users", users: [therapist, admin] },
  ])("returns zero counts with $name without reading emotions", async ({ users }) => {
    mocks.storage.getAllUsers.mockResolvedValue(users);

    expectStats(await requestStats(), 0, 0);
    expect(mocks.storage.getAllUsers).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.storage.getEmotionRecordsByUser).not.toHaveBeenCalled();
  });

  it.each(["users", "first client's emotions", "later client's emotions"])(
    "returns only a 500 error when reading %s fails",
    async (failure) => {
      const error = new Error("Synthetic engagement read failure");
      mocks.storage.getAllUsers.mockResolvedValue([client, secondClient]);
      if (failure === "users") {
        mocks.storage.getAllUsers.mockRejectedValue(error);
      } else if (failure === "first client's emotions") {
        mocks.storage.getEmotionRecordsByUser.mockRejectedValueOnce(error);
      } else {
        mocks.storage.getEmotionRecordsByUser
          .mockResolvedValueOnce([emotion(now)])
          .mockRejectedValueOnce(error);
      }

      const res = await requestStats();

      expect(res.status).toHaveBeenCalledExactlyOnceWith(500);
      expect(res.json).toHaveBeenCalledExactlyOnceWith({
        message: "Failed to fetch engagement stats",
      });
      expect(mocks.storage.getEmotionRecordsByUser.mock.calls).toEqual(
        failure === "users" ? [] : failure === "first client's emotions" ? [[1]] : [[1], [2]],
      );
    },
  );
});
