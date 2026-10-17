import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { recommendation } from "./fixtures/ai-recommendation";

const storage = vi.hoisted(() => ({
  getSessionById: vi.fn(),
  deleteSession: vi.fn(),
  getUser: vi.fn(),
  getAiRecommendationsByUser: vi.fn(),
}));

vi.mock("../server/storage", () => ({ storage }));
// Keep the real router, auth middleware, and controller, but never initialize
// a database, session store, email delivery, or external AI service.
vi.mock("../server/db", () => ({
  db: new Proxy({}, { get() { throw new Error("Unexpected database access"); } }),
  pool: new Proxy({}, { get() { throw new Error("Unexpected database access"); } }),
}));
vi.mock("../server/services/email", () => ({
  sendProfessionalWelcomeEmail: vi.fn(),
  sendClientInvitation: vi.fn(),
}));
vi.mock("../server/services/websocket", () => ({ sendNotificationToUser: vi.fn() }));
vi.mock("../server/services/openai", () => ({ analyzeJournalEntry: vi.fn() }));

import usersRouter from "../server/routes/users.routes";

describe("GET /api/users/:userId/recommendations authorization", () => {
  const owner = { id: 17, role: "client", therapistId: 42 };
  const otherClient = { id: 18, role: "client", therapistId: 43 };
  const assignedTherapist = { id: 42, role: "therapist", therapistId: null };
  const unrelatedTherapist = { id: 43, role: "therapist", therapistId: null };
  const admin = { id: 99, role: "admin", therapistId: null };
  const path = `/api/users/${owner.id}/recommendations`;
  const approved = { ...recommendation, status: "approved" };
  const storedRecommendations = [recommendation, approved];
  const app = express();
  app.use("/api/users", usersRouter);

  // Authentication caches successful lookups by session ID. Never reuse IDs
  // across tests, so cached identities cannot hide missing storage setup.
  let sessionSequence = 0;
  let sessionId: string;

  function signIn(user: typeof owner | typeof assignedTherapist) {
    storage.getSessionById.mockResolvedValue({
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
    });
    storage.getUser.mockImplementation(async (id: number) => {
      if (id === user.id) return user;
      if (id === owner.id) return owner;
      throw new Error(`Unexpected user lookup: ${id}`);
    });
    return request(app).get(path).set("Cookie", `sessionId=${sessionId}`);
  }

  beforeEach(() => {
    vi.resetAllMocks();
    sessionId = `synthetic-read-session-${++sessionSequence}`;
    storage.getAiRecommendationsByUser.mockResolvedValue(storedRecommendations);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects signed-out callers before any storage lookup", async () => {
    const res = await request(app).get(path);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Authentication required" });
    for (const lookup of Object.values(storage)) {
      expect(lookup).not.toHaveBeenCalled();
    }
  });

  it("rejects an invalid session before user or recommendation lookup", async () => {
    storage.getSessionById.mockResolvedValue(undefined);

    const res = await request(app).get(path).set("Cookie", `sessionId=${sessionId}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Invalid session" });
    expect(storage.getSessionById).toHaveBeenCalledExactlyOnceWith(sessionId);
    expect(storage.getUser).not.toHaveBeenCalled();
    expect(storage.getAiRecommendationsByUser).not.toHaveBeenCalled();
  });

  it("rejects and deletes an expired session before reading recommendations", async () => {
    storage.getSessionById.mockResolvedValue({
      id: sessionId,
      userId: owner.id,
      expiresAt: new Date(Date.now() - 60_000),
    });

    const res = await request(app).get(path).set("Cookie", `sessionId=${sessionId}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Session expired" });
    expect(storage.getSessionById).toHaveBeenCalledExactlyOnceWith(sessionId);
    expect(storage.deleteSession).toHaveBeenCalledExactlyOnceWith(sessionId);
    expect(storage.getUser).not.toHaveBeenCalled();
    expect(storage.getAiRecommendationsByUser).not.toHaveBeenCalled();
  });

  it("denies a different client without reading recommendation storage", async () => {
    const res = await signIn(otherClient);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Access denied." });
    expect(storage.getSessionById).toHaveBeenCalledExactlyOnceWith(sessionId);
    expect(storage.getUser).toHaveBeenCalledExactlyOnceWith(otherClient.id);
    expect(storage.getAiRecommendationsByUser).not.toHaveBeenCalled();
  });

  it("denies an unrelated therapist after checking the target client's assignment", async () => {
    const res = await signIn(unrelatedTherapist);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Access denied. Not your client." });
    expect(storage.getSessionById).toHaveBeenCalledExactlyOnceWith(sessionId);
    expect(storage.getUser.mock.calls).toEqual([[unrelatedTherapist.id], [owner.id]]);
    expect(storage.getAiRecommendationsByUser).not.toHaveBeenCalled();
  });

  it.each([
    ["owning client", owner, [approved]],
    ["assigned therapist", assignedTherapist, storedRecommendations],
    ["admin", admin, storedRecommendations],
  ] as const)("allows the %s to read the requested client's recommendations", async (_label, user, expected) => {
    const res = await signIn(user);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(JSON.parse(JSON.stringify(expected)));
    expect(storage.getSessionById).toHaveBeenCalledExactlyOnceWith(sessionId);
    expect(storage.getAiRecommendationsByUser).toHaveBeenCalledExactlyOnceWith(owner.id);
    expect(storage.getUser.mock.calls).toEqual(
      user.role === "therapist" ? [[user.id], [owner.id]] : [[user.id]],
    );
  });
});
