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

// Never evaluate database, delivery, or other controller dependencies:
// all records below are synthetic and exist only in memory.
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

const client = { id: 1, role: "client", status: "active", therapistId: null };
const secondClient = { id: 2, role: "client", status: "inactive", therapistId: null };
const therapist = { id: 3, role: "therapist", status: "active" };
const admin = { id: 4, role: "admin", status: "active" };

describe("admin client goal participation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    for (const read of Object.values(storage)) read.mockResolvedValue([]);
  });

  it.each([
    {
      name: "counts each client once, excluding therapist, admin, and unknown owners",
      users: [client, secondClient, therapist, admin],
      owners: [1, 1, 3, 4, 999],
      expected: 1,
      totalClients: 2,
    },
    {
      name: "counts all client participants regardless of active status",
      users: [client, secondClient, therapist, admin],
      owners: [1, 2, 2, 3, 4],
      expected: 2,
      totalClients: 2,
    },
    {
      name: "returns zero when only non-clients have goals",
      users: [client, therapist, admin],
      owners: [3, 4, 999],
      expected: 0,
      totalClients: 1,
    },
    {
      name: "returns zero with no clients even when goals exist",
      users: [therapist, admin],
      owners: [3, 4, 999],
      expected: 0,
      totalClients: 0,
    },
    {
      name: "returns zero when clients have no goals",
      users: [client, secondClient],
      owners: [],
      expected: 0,
      totalClients: 2,
    },
    {
      name: "returns zero with no users",
      users: [],
      owners: [999],
      expected: 0,
      totalClients: 0,
    },
  ])("$name", async ({ users, owners, expected, totalClients }) => {
    storage.getAllUsers.mockResolvedValue(users);
    storage.getAllGoals.mockResolvedValue(
      owners.map((userId, index) => ({ id: index + 1, userId })),
    );
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await getAdminStats({} as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      clientsWithGoals: expected,
      totalClients,
      // Global goal totals deliberately retain their existing meaning.
      totalGoals: owners.length,
    }));
    expect(res.json.mock.calls[0][0].clientsWithGoals).toBeLessThanOrEqual(totalClients);
  });
});
