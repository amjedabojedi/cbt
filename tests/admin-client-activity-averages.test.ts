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

// Synthetic in-memory records only; never initialize database or delivery services.
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
const thirdClient = { id: 5, role: "client", status: "active", therapistId: null };
const therapist = { id: 3, role: "therapist", status: "active" };
const admin = { id: 4, role: "admin", status: "active" };

describe("admin client activity averages", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    for (const read of Object.values(storage)) read.mockResolvedValue([]);
  });

  it.each([
    {
      name: "counts only client-owned records, including inactive clients, and rounds to one decimal",
      users: [client, secondClient, thirdClient, therapist, admin],
      goalOwners: [1, 1, 2, 2, 3, 3, 4, 999],
      emotionOwners: [1, 2, 2, 2, 2, 3, 4, 4, 999],
      averageGoals: 1.3,
      averageEmotions: 1.7,
    },
    {
      name: "includes clients with no activity in the denominator",
      users: [client, secondClient, therapist, admin],
      goalOwners: [1, 1, 1, 3],
      emotionOwners: [1, 4],
      averageGoals: 1.5,
      averageEmotions: 0.5,
    },
    {
      name: "returns zero when all records belong to non-clients or unknown owners",
      users: [client, secondClient, therapist, admin],
      goalOwners: [3, 4, 999],
      emotionOwners: [3, 4, 999],
      averageGoals: 0,
      averageEmotions: 0,
    },
    {
      name: "returns finite zero averages with no clients despite existing records",
      users: [therapist, admin],
      goalOwners: [3, 4, 999],
      emotionOwners: [3, 4, 999],
      averageGoals: 0,
      averageEmotions: 0,
    },
    {
      name: "returns zero when clients have no records",
      users: [client, secondClient],
      goalOwners: [],
      emotionOwners: [],
      averageGoals: 0,
      averageEmotions: 0,
    },
    {
      name: "returns zero with no users even if orphaned records remain",
      users: [],
      goalOwners: [999],
      emotionOwners: [999],
      averageGoals: 0,
      averageEmotions: 0,
    },
    {
      name: "returns zero for an empty system",
      users: [],
      goalOwners: [],
      emotionOwners: [],
      averageGoals: 0,
      averageEmotions: 0,
    },
  ])("$name", async ({ users, goalOwners, emotionOwners, averageGoals, averageEmotions }) => {
    storage.getAllUsers.mockResolvedValue(users);
    storage.getAllGoals.mockResolvedValue(
      goalOwners.map((userId, index) => ({ id: index + 1, userId })),
    );
    storage.getAllEmotionRecords.mockResolvedValue(
      emotionOwners.map((userId, index) => ({ id: index + 1, userId })),
    );
    storage.getAllThoughtRecords.mockResolvedValue([{ id: 1, userId: 3 }]);
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await getAdminStats({} as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      averageGoalsPerClient: averageGoals,
      averageEmotionsPerClient: averageEmotions,
      totalClients: users.filter(user => user.role === "client").length,
      totalUsers: users.length,
      // Global totals continue to include records from every owner.
      totalGoals: goalOwners.length,
      totalEmotions: emotionOwners.length,
      totalThoughts: 1,
    }));
  });
});
