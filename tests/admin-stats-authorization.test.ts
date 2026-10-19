import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@shared/schema";

// Do not import real persistence or delivery infrastructure, even indirectly
// through the real stats controller. Unexpected infrastructure access must fail.
vi.mock("../server/db", () => ({
  db: new Proxy({}, { get() { throw new Error("Database forbidden in authorization tests"); } }),
  pool: new Proxy({}, { get() { throw new Error("Pool forbidden in authorization tests"); } }),
}));
vi.mock("../server/storage", () => ({
  storage: {
    getSessionById: vi.fn(),
    getUser: vi.fn(),
    getAllUsers: vi.fn(),
    getAllEmotionRecords: vi.fn(),
    getAllThoughtRecords: vi.fn(),
    getAllGoals: vi.fn(),
    getAllResources: vi.fn(),
    getAllResourceAssignments: vi.fn(),
  },
}));
vi.mock("../server/services/websocket", () => ({
  sendNotificationToUser: () => { throw new Error("Notifications forbidden in authorization tests"); },
}));
vi.mock("../server/services/email", () => ({
  isEmailEnabled: () => { throw new Error("Email forbidden in authorization tests"); },
  sendWeeklyProgressDigest: () => { throw new Error("Email forbidden in authorization tests"); },
  sendEmotionTrackingReminder: () => { throw new Error("Email forbidden in authorization tests"); },
}));
vi.mock("../server/controllers/goals.controller", () => ({
  updateGoalStatusBasedOnMilestones: () => { throw new Error("Goal updates forbidden in authorization tests"); },
}));
vi.mock("../server/controllers/admin.controller", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../server/controllers/admin.controller")>();
  const unrelated = () => vi.fn(() => {
    throw new Error("Unrelated admin handler invoked in stats authorization tests");
  });
  return {
    // Track entry, but execute the real aggregate against mock storage.
    getAdminStats: vi.fn(actual.getAdminStats),
    getAdminViewingClientStatus: unrelated(),
    recalculateGoalStatuses: unrelated(),
    triggerDailyReminders: unrelated(),
    triggerWeeklyDigests: unrelated(),
    getAdminNotifications: unrelated(),
    getAdminLogs: unrelated(),
    clearSystemLogs: unrelated(),
    getEngagementSettings: unrelated(),
    updateEngagementSettings: unrelated(),
    getEngagementStats: unrelated(),
    checkInactiveClients: unrelated(),
    sendInactivityReminders: unrelated(),
    sendWeeklyDigests: unrelated(),
  };
});

import adminRouter from "../server/routes/admin.routes";
import * as adminController from "../server/controllers/admin.controller";
import { storage } from "../server/storage";

const aggregateReads = [
  storage.getAllUsers,
  storage.getAllEmotionRecords,
  storage.getAllThoughtRecords,
  storage.getAllGoals,
  storage.getAllResources,
  storage.getAllResourceAssignments,
] as const;

// authenticate caches identities at module scope. Never reuse a session ID
// across requests, so the tests exercise their own synthetic storage fixtures.
let sessionSequence = 0;
function createApp(role?: "client" | "therapist" | "admin") {
  const app = express();
  if (role) {
    const sessionId = `synthetic-stats-access-${++sessionSequence}`;
    const user = { id: sessionSequence, role, status: "active" } as User;
    vi.mocked(storage.getSessionById).mockResolvedValue({
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
    } as NonNullable<Awaited<ReturnType<typeof storage.getSessionById>>>);
    vi.mocked(storage.getUser).mockResolvedValue(user);
    // Inject the already-parsed cookie boundary, not req.user. Authentication
    // and role enforcement remain real; cookie/token parsing is separate scope.
    app.use((req, _res, next) => {
      req.cookies = { sessionId };
      next();
    });
  }
  app.use("/api", adminRouter);
  return app;
}

function expectNoAggregateAccess() {
  expect(adminController.getAdminStats).not.toHaveBeenCalled();
  for (const read of aggregateReads) expect(read).not.toHaveBeenCalled();
}

describe("GET /api/admin/stats authorization (isolated real route and middleware)", () => {
  beforeEach(() => {
    // Keep the call-through controller spy implementation intact.
    vi.clearAllMocks();
    vi.mocked(storage.getSessionById).mockRejectedValue(new Error("Unexpected session lookup"));
    vi.mocked(storage.getUser).mockRejectedValue(new Error("Unexpected identity lookup"));
    for (const read of aggregateReads) vi.mocked(read).mockResolvedValue([]);
  });

  it("rejects anonymous callers before looking up an identity or entering the aggregate", async () => {
    const response = await request(createApp()).get("/api/admin/stats");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Authentication required" });
    expect(storage.getSessionById).not.toHaveBeenCalled();
    expect(storage.getUser).not.toHaveBeenCalled();
    expectNoAggregateAccess();
  });

  it.each(["client", "therapist"] as const)(
    "rejects an authenticated synthetic %s before entering the aggregate",
    async (role) => {
      const response = await request(createApp(role)).get("/api/admin/stats");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Access denied. Admin role required." });
      expect(storage.getSessionById).toHaveBeenCalledTimes(1);
      expect(storage.getUser).toHaveBeenCalledTimes(1);
      expect(storage.getUser).toHaveBeenCalledWith(sessionSequence);
      expectNoAggregateAccess();
    },
  );

  it("allows a synthetic admin through both guards to the real aggregate controller", async () => {
    const response = await request(createApp("admin")).get("/api/admin/stats");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      totalUsers: 0,
      totalClients: 0,
      totalTherapists: 0,
      totalEmotions: 0,
      totalThoughts: 0,
      totalGoals: 0,
      totalResources: 0,
      topResources: [],
    });
    expect(storage.getSessionById).toHaveBeenCalledExactlyOnceWith(
      `synthetic-stats-access-${sessionSequence}`,
    );
    expect(storage.getUser).toHaveBeenCalledExactlyOnceWith(sessionSequence);
    expect(adminController.getAdminStats).toHaveBeenCalledTimes(1);
    for (const read of aggregateReads) expect(read).toHaveBeenCalledTimes(1);
    expect(storage.getAllResources).toHaveBeenCalledWith(true);
  });

  // An incorrectly wired handler must not be mistaken for a successful denial
  // or an admin success, even if it happens to return a compatible response.
  afterEach(() => {
    for (const [name, handler] of Object.entries(adminController)) {
      if (name !== "getAdminStats") expect(handler, name).not.toHaveBeenCalled();
    }
  });
});
