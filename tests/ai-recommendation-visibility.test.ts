import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import type { AiRecommendation } from "@shared/schema";
import { recommendation } from "./fixtures/ai-recommendation";

const storage = vi.hoisted(() => ({
  getAiRecommendationsByUser: vi.fn(),
}));

vi.mock("../server/storage", () => ({ storage }));
// Importing this controller must not initialize database or external services.
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

import { getAiRecommendations } from "../server/controllers/users.controller";

// Route authentication/access checks are separate; these tests exercise only
// the controller's read-visibility contract for already-authorized requests.
describe("getAiRecommendations visibility", () => {
  const roles = ["client", "therapist", "admin"] as const;
  type Role = (typeof roles)[number];

  function request(role: Role): Request {
    return {
      params: { userId: "17" },
      user: { id: role === "client" ? 17 : 42, role },
    } as unknown as Request;
  }

  function response() {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    return { res, expressRes: res as unknown as Response };
  }

  function mixedRecommendations(): AiRecommendation[] {
    return (["pending", "approved", "rejected", "implemented", "approved"] as const)
      .map((status, index) => ({ ...recommendation, id: 81 + index, status }));
  }

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns only approved recommendations to clients, preserving their order and contents", async () => {
    const recommendations = mixedRecommendations();
    const original = structuredClone(recommendations);
    storage.getAiRecommendationsByUser.mockResolvedValue(recommendations);
    const { res, expressRes } = response();

    await getAiRecommendations(request("client"), expressRes);

    expect(storage.getAiRecommendationsByUser).toHaveBeenCalledExactlyOnceWith(17);
    expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith([recommendations[1], recommendations[4]]);
    expect(recommendations).toEqual(original);
  });

  it("returns an empty list to clients when no returned recommendations are approved", async () => {
    storage.getAiRecommendationsByUser.mockResolvedValue(
      mixedRecommendations().filter(rec => rec.status !== "approved"),
    );
    const { res, expressRes } = response();

    await getAiRecommendations(request("client"), expressRes);

    expect(storage.getAiRecommendationsByUser).toHaveBeenCalledExactlyOnceWith(17);
    expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith([]);
  });

  it.each(["therapist", "admin"] as const)(
    "returns every status unchanged to %s viewers",
    async (role) => {
      const recommendations = mixedRecommendations();
      const original = structuredClone(recommendations);
      storage.getAiRecommendationsByUser.mockResolvedValue(recommendations);
      const { res, expressRes } = response();

      await getAiRecommendations(request(role), expressRes);

      expect(storage.getAiRecommendationsByUser).toHaveBeenCalledExactlyOnceWith(17);
      expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
      expect(res.json).toHaveBeenCalledExactlyOnceWith(original);
      expect(res.json.mock.calls[0][0]).toBe(recommendations);
      expect(recommendations).toEqual(original);
    },
  );

  it.each(roles)("returns 200 and an empty list for %s when storage is empty", async (role) => {
    storage.getAiRecommendationsByUser.mockResolvedValue([]);
    const { res, expressRes } = response();

    await getAiRecommendations(request(role), expressRes);

    expect(storage.getAiRecommendationsByUser).toHaveBeenCalledExactlyOnceWith(17);
    expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith([]);
  });

  it.each(roles)("returns a generic 500 response for %s when storage fails", async (role) => {
    storage.getAiRecommendationsByUser.mockRejectedValue(new Error("Internal storage failure"));
    const { res, expressRes } = response();

    await expect(getAiRecommendations(request(role), expressRes)).resolves.toBeUndefined();

    expect(storage.getAiRecommendationsByUser).toHaveBeenCalledExactlyOnceWith(17);
    expect(res.status).toHaveBeenCalledExactlyOnceWith(500);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({
      message: "Failed to fetch AI recommendations",
    });
  });
});
