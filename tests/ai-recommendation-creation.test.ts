import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { recommendation, recommendationInput } from "./fixtures/ai-recommendation";

const { storage, sendNotificationToUser } = vi.hoisted(() => ({
  storage: {
    getUser: vi.fn(),
    createAiRecommendation: vi.fn(),
  },
  sendNotificationToUser: vi.fn(),
}));

vi.mock("../server/storage", () => ({ storage }));
// Import the real controller/schema without initializing persistence or services.
vi.mock("../server/db", () => ({
  db: new Proxy({}, { get() { throw new Error("Unexpected database access"); } }),
  pool: new Proxy({}, { get() { throw new Error("Unexpected database access"); } }),
}));
vi.mock("../server/services/email", () => ({
  sendProfessionalWelcomeEmail: vi.fn(),
  sendClientInvitation: vi.fn(),
}));
vi.mock("../server/services/websocket", () => ({ sendNotificationToUser }));
vi.mock("../server/services/openai", () => ({ analyzeJournalEntry: vi.fn() }));

import { createAiRecommendation } from "../server/controllers/users.controller";

// Authentication is handled by the route; all identities and records here are synthetic.
describe("createAiRecommendation", () => {
  const client = { id: 17, role: "client", therapistId: 42, name: "Test Client" };
  const assignedTherapist = { id: 42, role: "therapist" };
  const admin = { id: 99, role: "admin" };
  const { userId: _userId, therapistId: _therapistId, ...validBody } = recommendationInput;

  function request(body: unknown = { ...validBody }, creator = assignedTherapist): Request {
    return {
      params: { userId: "17" },
      user: creator,
      body,
    } as unknown as Request;
  }

  function response() {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    return { res, expressRes: res as unknown as Response };
  }

  function expectNoSideEffects() {
    expect(storage.createAiRecommendation).not.toHaveBeenCalled();
    expect(sendNotificationToUser).not.toHaveBeenCalled();
  }

  beforeEach(() => {
    vi.resetAllMocks();
    storage.getUser.mockResolvedValue({ ...client });
    storage.createAiRecommendation.mockResolvedValue({ ...recommendation });
    sendNotificationToUser.mockResolvedValue(undefined);
  });

  it("rejects a missing target user without saving or notifying", async () => {
    storage.getUser.mockResolvedValue(undefined);
    const { res, expressRes } = response();

    await createAiRecommendation(request(), expressRes);

    expect(storage.getUser).toHaveBeenCalledExactlyOnceWith(17);
    expect(res.status).toHaveBeenCalledExactlyOnceWith(404);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({ message: "User not found" });
    expectNoSideEffects();
  });

  it.each([
    { label: "therapist target", target: { ...client, role: "therapist" } },
    { label: "admin target", target: { ...client, role: "admin" } },
    { label: "client without a therapist", target: { ...client, therapistId: null } },
  ])("rejects a $label even for an admin, without saving or notifying", async ({ target }) => {
    storage.getUser.mockResolvedValue(target);
    const { res, expressRes } = response();

    await createAiRecommendation(request(validBody, admin), expressRes);

    expect(storage.getUser).toHaveBeenCalledExactlyOnceWith(17);
    expect(res.status).toHaveBeenCalledExactlyOnceWith(400);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({
      message: "Recommendations can only be created for clients with an assigned therapist",
    });
    expectNoSideEffects();
  });

  it.each([
    { label: "unrelated therapist", creator: { id: 43, role: "therapist" } },
    { label: "target client", creator: { id: 17, role: "client" } },
    { label: "unrelated client", creator: { id: 18, role: "client" } },
  ])("rejects an $label without saving or notifying", async ({ creator }) => {
    const { res, expressRes } = response();

    await createAiRecommendation(request(validBody, creator), expressRes);

    expect(storage.getUser).toHaveBeenCalledExactlyOnceWith(17);
    expect(res.status).toHaveBeenCalledExactlyOnceWith(403);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({
      message: "You do not have permission to create recommendations for this client",
    });
    expectNoSideEffects();
  });

  const invalidPayloads: { label: string; body: unknown; field: string }[] = [
    ...(["title", "content", "type", "aiReasoning"] as const).map(field => {
      const body: Record<string, unknown> = { ...validBody };
      delete body[field];
      return { label: `missing ${field}`, body, field };
    }),
    ...([
      ["title", 123],
      ["content", null],
      ["type", "unsupported"],
      ["aiReasoning", false],
      ["relatedDataType", "unsupported"],
      ["relatedDataId", "not-a-number"],
      ["therapistNotes", 123],
    ] as const).map(([field, value]) => ({
      label: `invalid ${field}`,
      body: { ...validBody, [field]: value },
      field,
    })),
    { label: "empty body", body: {}, field: "title" },
    { label: "null body", body: null, field: "title" },
  ];

  it.each(invalidPayloads)("rejects $label without saving or notifying", async ({ body, field }) => {
    const { res, expressRes } = response();

    await createAiRecommendation(request(body), expressRes);

    expect(storage.getUser).toHaveBeenCalledExactlyOnceWith(17);
    expect(res.status).toHaveBeenCalledExactlyOnceWith(400);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({
      message: "Invalid data",
      errors: expect.arrayContaining([
        expect.objectContaining({ path: [field], message: expect.any(String) }),
      ]),
    });
    expectNoSideEffects();
  });

  describe("service failures", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    function expectGenericFailure(res: ReturnType<typeof response>["res"]) {
      expect(res.status).toHaveBeenCalledExactlyOnceWith(500);
      expect(res.json).toHaveBeenCalledExactlyOnceWith({
        message: "Failed to create AI recommendation",
      });
    }

    it("returns a generic 500 after lookup failure without saving or notifying", async () => {
      storage.getUser.mockRejectedValueOnce(new Error("Synthetic lookup failure"));
      const { res, expressRes } = response();

      await createAiRecommendation(request(), expressRes);

      expect(storage.getUser).toHaveBeenCalledExactlyOnceWith(17);
      expectNoSideEffects();
      expectGenericFailure(res);
    });

    it("returns a generic 500 after save failure without notifying or retrying the save", async () => {
      storage.createAiRecommendation.mockRejectedValueOnce(new Error("Synthetic save failure"));
      const { res, expressRes } = response();

      await createAiRecommendation(request(), expressRes);

      expect(storage.getUser).toHaveBeenCalledExactlyOnceWith(17);
      expect(storage.createAiRecommendation).toHaveBeenCalledExactlyOnceWith({
        ...validBody,
        userId: 17,
        therapistId: 42,
        status: "pending",
      });
      expect(storage.getUser.mock.invocationCallOrder[0])
        .toBeLessThan(storage.createAiRecommendation.mock.invocationCallOrder[0]);
      expect(sendNotificationToUser).not.toHaveBeenCalled();
      expectGenericFailure(res);
    });

    it("returns a generic 500 after notification failure even though the recommendation was saved once", async () => {
      sendNotificationToUser.mockRejectedValueOnce(new Error("Synthetic notification failure"));
      const { res, expressRes } = response();

      await createAiRecommendation(request(), expressRes);

      expect(storage.getUser).toHaveBeenCalledExactlyOnceWith(17);
      expect(storage.createAiRecommendation).toHaveBeenCalledExactlyOnceWith({
        ...validBody,
        userId: 17,
        therapistId: 42,
        status: "pending",
      });
      expect(sendNotificationToUser).toHaveBeenCalledExactlyOnceWith(42, {
        title: "New AI Recommendation",
        content: "There is a new AI recommendation for Test Client that requires your review.",
        type: "ai_recommendation",
        link: "/therapist/recommendations",
      });
      expect(storage.getUser.mock.invocationCallOrder[0])
        .toBeLessThan(storage.createAiRecommendation.mock.invocationCallOrder[0]);
      expect(storage.createAiRecommendation.mock.invocationCallOrder[0])
        .toBeLessThan(sendNotificationToUser.mock.invocationCallOrder[0]);
      expectGenericFailure(res);
    });
  });

  const invalidLists = [
    { field: "suggestedResources", value: ["3"], path: ["suggestedResources", 0] },
    { field: "suggestedResources", value: [3, "9"], path: ["suggestedResources", 1] },
    { field: "suggestedResources", value: [null], path: ["suggestedResources", 0] },
    { field: "suggestedResources", value: [{}], path: ["suggestedResources", 0] },
    { field: "suggestedResources", value: [[3]], path: ["suggestedResources", 0] },
    { field: "suggestedResources", value: [false], path: ["suggestedResources", 0] },
    { field: "suggestedResources", value: "3", path: ["suggestedResources"] },
    { field: "suggestedResources", value: {}, path: ["suggestedResources"] },
    { field: "implementationSteps", value: [1], path: ["implementationSteps", 0] },
    { field: "implementationSteps", value: ["Pause", 2], path: ["implementationSteps", 1] },
    { field: "implementationSteps", value: [null], path: ["implementationSteps", 0] },
    { field: "implementationSteps", value: [{}], path: ["implementationSteps", 0] },
    { field: "implementationSteps", value: [["Pause"]], path: ["implementationSteps", 0] },
    { field: "implementationSteps", value: [false], path: ["implementationSteps", 0] },
    { field: "implementationSteps", value: "Pause", path: ["implementationSteps"] },
    { field: "implementationSteps", value: {}, path: ["implementationSteps"] },
  ];

  it.each(invalidLists)("rejects $field=$value without saving or notifying", async ({ field, value, path }) => {
    const { res, expressRes } = response();

    await createAiRecommendation(request({ ...validBody, [field]: value }), expressRes);

    expect(res.status).toHaveBeenCalledExactlyOnceWith(400);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({
      message: "Invalid data",
      errors: expect.arrayContaining([
        expect.objectContaining({ path, message: expect.any(String) }),
      ]),
    });
    expectNoSideEffects();
  });

  describe.each(["suggestedResources", "implementationSteps"] as const)("%s compatibility", field => {
    it.each(["populated", "empty", "null", "omitted"] as const)("preserves a %s list", async variant => {
      const body = { ...validBody };
      if (variant === "empty") body[field] = [];
      if (variant === "null") Object.assign(body, { [field]: null });
      if (variant === "omitted") Reflect.deleteProperty(body, field);
      const originalBody = structuredClone(body);
      const { res, expressRes } = response();

      await createAiRecommendation(request(body), expressRes);

      expect(storage.createAiRecommendation).toHaveBeenCalledExactlyOnceWith({
        ...originalBody,
        userId: 17,
        therapistId: 42,
        status: "pending",
      });
      expect(sendNotificationToUser).toHaveBeenCalledExactlyOnceWith(42, expect.objectContaining({
        type: "ai_recommendation",
      }));
      expect(res.status).toHaveBeenCalledExactlyOnceWith(201);
      expect(res.json).toHaveBeenCalledExactlyOnceWith(recommendation);
      expect(body).toEqual(originalBody);
    });
  });

  describe.each([
    { label: "assigned therapist", creator: assignedTherapist },
    { label: "admin", creator: admin },
  ])("creation by $label", ({ creator }) => {
    it.each([
      { label: "valid payload", body: validBody },
      ...(["approved", "rejected", "implemented"] as const).map(status => ({
        label: `payload spoofing ownership and ${status} status`,
        body: { ...validBody, userId: 777, therapistId: 888, status },
      })),
    ])("saves a pending recommendation from a $label and notifies the assigned therapist", async ({ body }) => {
      const { res, expressRes } = response();
      const originalBody = structuredClone(body);
      const savedRecommendation = { ...recommendation };
      storage.createAiRecommendation.mockResolvedValue(savedRecommendation);

      await createAiRecommendation(request(body, creator), expressRes);

      expect(storage.getUser).toHaveBeenCalledExactlyOnceWith(17);
      expect(storage.createAiRecommendation).toHaveBeenCalledExactlyOnceWith({
        ...validBody,
        userId: 17,
        therapistId: 42,
        status: "pending",
      });
      expect(sendNotificationToUser).toHaveBeenCalledExactlyOnceWith(42, {
        title: "New AI Recommendation",
        content: "There is a new AI recommendation for Test Client that requires your review.",
        type: "ai_recommendation",
        link: "/therapist/recommendations",
      });
      expect(storage.createAiRecommendation.mock.invocationCallOrder[0])
        .toBeLessThan(sendNotificationToUser.mock.invocationCallOrder[0]);
      expect(res.status).toHaveBeenCalledExactlyOnceWith(201);
      expect(res.json).toHaveBeenCalledExactlyOnceWith(savedRecommendation);
      expect(res.json.mock.calls[0][0]).toBe(savedRecommendation);
      expect(body).toEqual(originalBody);
    });
  });
});
