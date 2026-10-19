import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  getAllUsers: vi.fn(),
  getAllEmotionRecords: vi.fn(),
  getAllThoughtRecords: vi.fn(),
  getAllGoals: vi.fn(),
  getAllResources: vi.fn(),
  getAllResourceAssignments: vi.fn(),
}));

// Keep the controller isolated: no real storage, database, or delivery modules
// are evaluated, and every record exists only in this test's memory.
vi.mock("../server/db", () => ({ db: {}, pool: {} }));
vi.mock("../server/storage", () => ({ storage }));
vi.mock("../server/services/websocket", () => ({ sendNotificationToUser: vi.fn() }));
vi.mock("../server/services/email", () => ({
  isEmailEnabled: vi.fn(),
  sendWeeklyProgressDigest: vi.fn(),
  sendEmotionTrackingReminder: vi.fn(),
}));
vi.mock("../server/controllers/goals.controller", () => ({
  updateGoalStatusBasedOnMilestones: vi.fn(),
}));

import { getAdminStats } from "../server/controllers/admin.controller";

const client = { id: 1, name: "Synthetic Client One", role: "client", status: "active" };
const secondClient = { id: 2, name: "Synthetic Client Two", role: "client", status: "inactive" };
const thirdClient = { id: 3, name: "Synthetic Client Three", role: "client", status: "active" };
const therapist = { id: 4, name: "Synthetic Therapist", role: "therapist", status: "active" };
const admin = { id: 5, name: "Synthetic Admin", role: "admin", status: "active" };

describe("admin most active client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    for (const read of Object.values(storage)) read.mockResolvedValue([]);
  });

  it.each([
    {
      name: "ignores a therapist leading emotion counts",
      users: [client, therapist],
      owners: [4, 1, 4, 4],
      expected: client.name,
    },
    {
      name: "ignores an admin leading emotion counts",
      users: [client, admin],
      owners: [5, 1, 5, 5],
      expected: client.name,
    },
    {
      name: "ignores an unknown owner leading emotion counts",
      users: [client],
      owners: [999, 1, 999, 999],
      expected: client.name,
    },
    {
      name: "selects the busiest of multiple clients despite a non-client leader",
      users: [thirdClient, client, secondClient, therapist, admin],
      owners: [4, 4, 4, 4, 4, 1, 2, 3, 2, 3, 2, 5, 999],
      expected: secondClient.name,
    },
    {
      name: "returns N/A when only non-clients have activity",
      users: [client, secondClient, therapist, admin],
      owners: [4, 4, 5, 999],
      expected: "N/A",
    },
    {
      name: "returns N/A when there are no emotion records",
      users: [client, secondClient],
      owners: [],
      expected: "N/A",
    },
    {
      name: "returns N/A when there are no clients",
      users: [therapist, admin],
      owners: [4, 5, 999],
      expected: "N/A",
    },
    {
      name: "returns N/A when there are no users",
      users: [],
      owners: [999],
      expected: "N/A",
    },
  ])("$name", async ({ users, owners, expected }) => {
    storage.getAllUsers.mockResolvedValue(users);
    storage.getAllEmotionRecords.mockResolvedValue(
      owners.map((userId, index) => ({ id: index + 1, userId })),
    );
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await getAdminStats({} as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      mostActiveClient: expected,
      // This fix changes ranking, not the global emotion total.
      totalEmotions: owners.length,
    }));
  });
});
