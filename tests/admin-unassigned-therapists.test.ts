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

// No real infrastructure is evaluated; fixtures live only in memory.
vi.mock("../server/db", () => ({
  db: new Proxy({}, { get() { throw new Error("Database access forbidden"); } }),
  pool: new Proxy({}, { get() { throw new Error("Pool access forbidden"); } }),
}));
vi.mock("../server/storage", () => ({ storage }));
vi.mock("../server/services/websocket", () => ({
  sendNotificationToUser: () => { throw new Error("Notifications forbidden"); },
}));
vi.mock("../server/services/email", () => ({
  isEmailEnabled: () => { throw new Error("Email forbidden"); },
  sendWeeklyProgressDigest: () => { throw new Error("Email forbidden"); },
  sendEmotionTrackingReminder: () => { throw new Error("Email forbidden"); },
}));
vi.mock("../server/controllers/goals.controller", () => ({
  updateGoalStatusBasedOnMilestones: () => { throw new Error("Goal updates forbidden"); },
}));

import { getAdminStats } from "../server/controllers/admin.controller";

const therapist = { id: 10, role: "therapist", status: "active" };
const secondTherapist = { id: 11, role: "therapist", status: "inactive" };
const admin = { id: 20, role: "admin", status: "active" };
const client = (id: number, therapistId: number | null) => ({
  id, therapistId, role: "client", status: "active",
});

describe("admin therapists without clients", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    for (const read of Object.values(storage)) read.mockResolvedValue([]);
  });

  it.each([
    {
      name: "ignores orphaned and non-therapist links in mixed-role users",
      users: [
        therapist, secondTherapist, admin,
        client(1, 10), client(2, 20), client(3, 1), client(4, 999),
      ],
      totalTherapists: 2,
      expected: 1,
    },
    {
      name: "counts a therapist with duplicate client assignments only once",
      users: [therapist, secondTherapist, client(1, 10), client(2, 10)],
      totalTherapists: 2,
      expected: 1,
    },
    {
      name: "counts all therapists when every assignment is outdated",
      users: [therapist, secondTherapist, admin, client(1, 999), client(2, 20)],
      totalTherapists: 2,
      expected: 2,
    },
    {
      name: "returns zero with no therapists despite orphaned and mixed-role links",
      users: [admin, client(1, 20), client(2, 999), client(3, 1)],
      totalTherapists: 0,
      expected: 0,
    },
    {
      name: "returns zero when every current therapist has a client",
      users: [therapist, secondTherapist, client(1, 10), client(2, 11)],
      totalTherapists: 2,
      expected: 0,
    },
    {
      name: "counts active and inactive therapists when clients have no assignments",
      users: [therapist, secondTherapist, client(1, null)],
      totalTherapists: 2,
      expected: 2,
    },
    {
      name: "does not treat a non-client user's therapist link as an assignment",
      users: [therapist, secondTherapist, { ...admin, therapistId: 10 }],
      totalTherapists: 2,
      expected: 2,
    },
    {
      name: "counts all therapists when there are no clients",
      users: [therapist, secondTherapist],
      totalTherapists: 2,
      expected: 2,
    },
    {
      name: "returns zero with no users",
      users: [],
      totalTherapists: 0,
      expected: 0,
    },
  ])("$name", async ({ users, totalTherapists, expected }) => {
    storage.getAllUsers.mockResolvedValue(users);
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await getAdminStats({} as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      therapistsWithoutClients: expected,
      totalTherapists,
      totalClients: users.filter(user => user.role === "client").length,
      totalUsers: users.length,
    }));
    const count = res.json.mock.calls[0][0].therapistsWithoutClients;
    expect(count).toBeGreaterThanOrEqual(0);
    expect(count).toBeLessThanOrEqual(totalTherapists);
  });
});
