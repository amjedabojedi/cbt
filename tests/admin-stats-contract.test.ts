import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

// Never load real persistence or delivery modules, including through the other
// handlers imported by admin.controller. Unexpected infrastructure use fails.
vi.mock("../server/db", () => ({
  db: new Proxy({}, { get() { throw new Error("Database access forbidden in contract tests"); } }),
  pool: new Proxy({}, { get() { throw new Error("Pool access forbidden in contract tests"); } }),
}));
vi.mock("../server/storage", () => ({
  storage: {
    getAllUsers: vi.fn(),
    getAllEmotionRecords: vi.fn(),
    getAllThoughtRecords: vi.fn(),
    getAllGoals: vi.fn(),
    getAllResources: vi.fn(),
    getAllResourceAssignments: vi.fn(),
  },
}));
vi.mock("../server/services/websocket", () => ({
  sendNotificationToUser: () => { throw new Error("Notifications forbidden in contract tests"); },
}));
vi.mock("../server/services/email", () => ({
  isEmailEnabled: () => { throw new Error("Email forbidden in contract tests"); },
  sendWeeklyProgressDigest: () => { throw new Error("Email forbidden in contract tests"); },
  sendEmotionTrackingReminder: () => { throw new Error("Email forbidden in contract tests"); },
}));
vi.mock("../server/controllers/goals.controller", () => ({
  updateGoalStatusBasedOnMilestones: () => {
    throw new Error("Goal updates forbidden in contract tests");
  },
}));

import { storage } from "../server/storage";
import { getAdminStats } from "../server/controllers/admin.controller";

// Deliberately independent of the implementation: these are the fields required
// by AdminDashboard, including its resource total, not keys inferred from a server response.
const numericFields = [
  "totalUsers", "totalClients", "totalTherapists", "totalEmotions",
  "totalThoughts", "totalGoals", "totalResources", "activeClients", "activeTherapists",
  "resourceUsage", "clientsWithoutTherapist", "therapistsWithoutClients",
  "clientsWithGoals", "averageGoalsPerClient", "averageEmotionsPerClient",
] as const;
const labelFields = [
  "mostActiveTherapist", "mostActiveClient", "mostUsedResource",
] as const;

// Only fields consumed by this aggregate are needed; no accounts or records are
// created. The assertions below execute the real controller over these fixtures.
interface Fixtures {
  users: { id: number; role: string; status: string; name?: string | null; therapistId?: number }[];
  emotions: { id: number; userId: number }[];
  thoughts: { id: number; userId: number }[];
  goals: { id: number; userId: number }[];
  resources: { id: number; title: string }[];
  assignments: { id: number; resourceId: number }[];
}

function useFixtures(overrides: Partial<Fixtures> = {}) {
  const fixtures: Fixtures = {
    users: [], emotions: [], thoughts: [], goals: [], resources: [], assignments: [],
    ...overrides,
  };
  // Partial synthetic rows are intentionally confined to this mock boundary.
  vi.mocked(storage.getAllUsers).mockResolvedValue(fixtures.users as Awaited<ReturnType<typeof storage.getAllUsers>>);
  vi.mocked(storage.getAllEmotionRecords).mockResolvedValue(fixtures.emotions as Awaited<ReturnType<typeof storage.getAllEmotionRecords>>);
  vi.mocked(storage.getAllThoughtRecords).mockResolvedValue(fixtures.thoughts as Awaited<ReturnType<typeof storage.getAllThoughtRecords>>);
  vi.mocked(storage.getAllGoals).mockResolvedValue(fixtures.goals as Awaited<ReturnType<typeof storage.getAllGoals>>);
  vi.mocked(storage.getAllResources).mockResolvedValue(fixtures.resources as Awaited<ReturnType<typeof storage.getAllResources>>);
  vi.mocked(storage.getAllResourceAssignments).mockResolvedValue(fixtures.assignments as Awaited<ReturnType<typeof storage.getAllResourceAssignments>>);
}

async function getSuccessfulAggregate() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  await getAdminStats({} as Request, res as unknown as Response);
  expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
  expect(res.json).toHaveBeenCalledTimes(1);
  const payload = res.json.mock.calls[0][0];
  expect(payload).toBeTypeOf("object");
  expect(payload).not.toBeNull();
  expect(Array.isArray(payload)).toBe(false);
  for (const field of numericFields) {
    expect(payload, `missing ${field}`).toHaveProperty(field);
    expect(payload[field], field).toBeTypeOf("number");
    expect(Number.isFinite(payload[field]), `${field} must be finite`).toBe(true);
  }
  for (const field of labelFields) {
    expect(payload, `missing ${field}`).toHaveProperty(field);
    expect(payload[field], field).toBeTypeOf("string");
  }
  expect(Array.isArray(payload.topResources)).toBe(true);
  for (const resource of payload.topResources) {
    expect(resource.id).toBeTypeOf("number");
    expect(Number.isFinite(resource.id)).toBe(true);
    expect(resource.title).toBeTypeOf("string");
    expect(resource.usageCount).toBeTypeOf("number");
    expect(Number.isFinite(resource.usageCount)).toBe(true);
  }
  // Also validate the serialized HTTP shape (NaN/Infinity would become null).
  expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  const { getAllResources, ...noArgumentReads } = storage;
  expect(getAllResources).toHaveBeenCalledExactlyOnceWith(true);
  for (const method of Object.values(noArgumentReads)) {
    expect(method).toHaveBeenCalledExactlyOnceWith();
  }
  return payload;
}

describe("getAdminStats dashboard response contract (synthetic storage only)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useFixtures();
  });

  it.each([
    "getAllUsers",
    "getAllEmotionRecords",
    "getAllThoughtRecords",
    "getAllGoals",
    "getAllResources",
    "getAllResourceAssignments",
  ] as const)("returns only a generic HTTP 500 response when %s rejects", async (method) => {
    useFixtures({
      users: [
        { id: 1, role: "therapist", status: "active", name: "Synthetic therapist" },
        { id: 2, role: "client", status: "active", therapistId: 1, name: "Synthetic client" },
      ],
      emotions: [{ id: 1, userId: 2 }],
      thoughts: [{ id: 1, userId: 2 }],
      goals: [{ id: 1, userId: 2 }],
      resources: [{ id: 10, title: "Synthetic resource" }],
      assignments: [{ id: 1, resourceId: 10 }],
    });
    vi.mocked(storage[method]).mockRejectedValueOnce(
      new Error(`Synthetic private storage failure: ${method}`),
    );
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    // Keep expected synthetic errors out of test output without changing how
    // the real controller handles rejected reads. Always restore the logger.
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await getAdminStats({} as Request, res as unknown as Response);

      expect(storage[method]).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledExactlyOnceWith(500);
      expect(res.json).toHaveBeenCalledExactlyOnceWith({
        message: "Failed to retrieve admin statistics",
      });
    } finally {
      errorLog.mockRestore();
    }
  });

  it("returns every required numeric field as zero and string labels when storage is empty", async () => {
    const payload = await getSuccessfulAggregate();
    for (const field of numericFields) expect(payload[field], field).toBe(0);
    expect(payload.topResources).toEqual([]);
  });

  it("keeps averages finite and zero with no clients, even when other roles have records", async () => {
    useFixtures({
      users: [
        { id: 1, role: "admin", status: "active" },
        { id: 2, role: "therapist", status: "active", name: null },
      ],
      goals: [{ id: 1, userId: 2 }],
      emotions: [{ id: 1, userId: 2 }],
      thoughts: [{ id: 1, userId: 2 }],
      resources: [{ id: 10, title: "Synthetic unused resource" }],
    });
    const payload = await getSuccessfulAggregate();
    expect(payload.totalClients).toBe(0);
    expect(payload.totalGoals).toBe(1);
    expect(payload.totalEmotions).toBe(1);
    expect(payload.totalResources).toBe(1);
    expect(payload.averageGoalsPerClient).toBe(0);
    expect(payload.averageEmotionsPerClient).toBe(0);
    expect(payload.topResources).toEqual([
      { id: 10, title: "Synthetic unused resource", usageCount: 0 },
    ]);
  });

  it("preserves numeric aggregates, fractional averages, labels, and resource entry fields", async () => {
    useFixtures({
      users: [
        { id: 1, role: "admin", status: "active", name: "Synthetic admin" },
        { id: 2, role: "therapist", status: "active", name: "Synthetic therapist" },
        { id: 3, role: "client", status: "active", therapistId: 2, name: "Synthetic client" },
        { id: 4, role: "client", status: "active", therapistId: 2, name: "Synthetic client two" },
        { id: 5, role: "client", status: "inactive", name: "Synthetic client three" },
      ],
      emotions: [{ id: 1, userId: 3 }, { id: 2, userId: 3 }],
      thoughts: [{ id: 1, userId: 3 }],
      goals: [{ id: 1, userId: 3 }, { id: 2, userId: 4 }],
      resources: [
        { id: 10, title: "Synthetic unused resource" },
        { id: 11, title: "Synthetic popular resource" },
      ],
      assignments: [{ id: 1, resourceId: 11 }, { id: 2, resourceId: 11 }],
    });
    const payload = await getSuccessfulAggregate();
    expect(payload).toMatchObject({
      totalUsers: 5, totalClients: 3, totalTherapists: 1,
      totalEmotions: 2, totalThoughts: 1, totalGoals: 2, totalResources: 2,
      activeClients: 2, resourceUsage: 2,
      clientsWithoutTherapist: 1, therapistsWithoutClients: 0,
      clientsWithGoals: 2, averageGoalsPerClient: 0.7, averageEmotionsPerClient: 0.7,
      mostActiveTherapist: "Synthetic therapist",
      mostActiveClient: "Synthetic client",
      mostUsedResource: "Synthetic popular resource",
    });
    expect(payload.topResources).toEqual([
      { id: 11, title: "Synthetic popular resource", usageCount: 2 },
      { id: 10, title: "Synthetic unused resource", usageCount: 0 },
    ]);
  });

  it("retains id/title/usageCount on each of the five most-used resources", async () => {
    const resources = Array.from({ length: 7 }, (_, index) => ({
      id: index + 10, title: `Synthetic resource ${index}`,
    }));
    const assignments = resources.flatMap((resource, index) =>
      Array.from({ length: index }, (_, assignmentIndex) => ({
        id: resource.id * 10 + assignmentIndex, resourceId: resource.id,
      })),
    );
    useFixtures({ resources, assignments });
    const payload = await getSuccessfulAggregate();
    expect(payload.totalResources).toBe(7);
    expect(payload.topResources).toEqual(resources.slice(2).reverse().map(resource => ({
      ...resource, usageCount: resource.id - 10,
    })));
  });
});
