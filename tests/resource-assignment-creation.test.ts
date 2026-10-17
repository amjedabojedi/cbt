import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

// Keep all persistence and notification delivery synthetic.
vi.mock("../server/storage", () => ({
  storage: {
    getResourceById: vi.fn(),
    assignResourceToClient: vi.fn(),
    createNotification: vi.fn(),
  },
}));
vi.mock("../server/services/websocket", () => ({
  sendNotificationToUser: vi.fn(),
}));

import { storage } from "../server/storage";
import { sendNotificationToUser } from "../server/services/websocket";
import { assignResource } from "../server/controllers/resources.controller";

const resource = { id: 5, title: "Synthetic resource" };
const assignment = {
  id: 1,
  resourceId: resource.id,
  assignedBy: 20,
  assignedTo: 10,
  notes: "Synthetic notes",
  status: "assigned",
  type: "resource",
};
const notification = { id: 2, userId: assignment.assignedTo };

function request(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: assignment.assignedBy, role: "therapist" },
    body: {
      resourceId: resource.id,
      clientId: assignment.assignedTo,
      notes: assignment.notes,
    },
    ...overrides,
  } as unknown as Request;
}

function response() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function expectNoSideEffects() {
  expect(storage.assignResourceToClient).not.toHaveBeenCalled();
  expect(storage.createNotification).not.toHaveBeenCalled();
  expect(sendNotificationToUser).not.toHaveBeenCalled();
}

describe("assignResource creation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(storage.getResourceById).mockResolvedValue(resource as any);
    vi.mocked(storage.assignResourceToClient).mockResolvedValue(assignment as any);
    vi.mocked(storage.createNotification).mockResolvedValue(notification as any);
  });

  afterEach(() => vi.restoreAllMocks());

  it("checks an existing resource before saving and uses its title in the notification", async () => {
    const res = response();
    await assignResource(request(), res);

    expect(storage.getResourceById).toHaveBeenCalledExactlyOnceWith(resource.id);
    expect(storage.assignResourceToClient).toHaveBeenCalledExactlyOnceWith({
      resourceId: resource.id,
      assignedBy: assignment.assignedBy,
      assignedTo: assignment.assignedTo,
      notes: assignment.notes,
      status: "assigned",
      type: "resource",
    });
    expect(storage.getResourceById).toHaveBeenCalledBefore(storage.assignResourceToClient);
    expect(storage.assignResourceToClient).toHaveBeenCalledBefore(storage.createNotification);
    expect(storage.createNotification).toHaveBeenCalledExactlyOnceWith({
      userId: assignment.assignedTo,
      title: "New Resource Assigned",
      body: `Your therapist assigned you "${resource.title}". Check your library to view it.`,
      type: "resource",
    });
    expect(sendNotificationToUser).toHaveBeenCalledExactlyOnceWith(assignment.assignedTo, notification);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(assignment);
  });

  it("returns 404 for a missing resource without saving or notifying", async () => {
    vi.mocked(storage.getResourceById).mockResolvedValue(undefined);
    const res = response();
    await assignResource(request(), res);

    expect(storage.getResourceById).toHaveBeenCalledExactlyOnceWith(resource.id);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Resource not found" });
    expectNoSideEffects();
  });

  it("returns 500 when lookup fails without saving or notifying", async () => {
    vi.mocked(storage.getResourceById).mockRejectedValue(new Error("Synthetic lookup failure"));
    const res = response();
    await assignResource(request(), res);

    expect(storage.getResourceById).toHaveBeenCalledExactlyOnceWith(resource.id);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to assign resource" });
    expectNoSideEffects();
  });

  it("preserves the unauthenticated rejection before lookup", async () => {
    const res = response();
    await assignResource(request({ user: null }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(storage.getResourceById).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it.each([
    { clientId: assignment.assignedTo },
    { resourceId: resource.id },
  ])("rejects missing required IDs before lookup: %j", async (body) => {
    const res = response();
    await assignResource(request({ body }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "resourceId and clientId are required" });
    expect(storage.getResourceById).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it("does not notify when saving the assignment fails", async () => {
    vi.mocked(storage.assignResourceToClient).mockRejectedValue(new Error("Synthetic save failure"));
    const res = response();
    await assignResource(request(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(storage.createNotification).not.toHaveBeenCalled();
    expect(sendNotificationToUser).not.toHaveBeenCalled();
  });

  it("keeps a successful assignment when notification creation fails", async () => {
    vi.mocked(storage.createNotification).mockRejectedValue(new Error("Synthetic notification failure"));
    const res = response();
    await assignResource(request(), res);

    expect(storage.assignResourceToClient).toHaveBeenCalledTimes(1);
    expect(sendNotificationToUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(assignment);
  });
});
