/**
 * Tests: Resource Assignment — Client Completion & Rating Flow
 *
 * Covers:
 *   GET  /api/client/assignments
 *   PATCH /api/resource-assignments/:id/status
 *   POST  /api/resource-assignments/:id/feedback
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

// ─── Mock the storage module before importing controllers ───────────────────
vi.mock("../server/storage", () => ({
  storage: {
    getAssignmentsByClient: vi.fn(),
    getResourceFeedbackByUser: vi.fn(),
    getResourceById: vi.fn(),
    getResourceAssignmentById: vi.fn(),
    updateAssignmentStatus: vi.fn(),
    createResourceFeedback: vi.fn(),
  },
}));

import { storage } from "../server/storage";
import {
  getClientAssignments,
  updateResourceAssignmentStatus,
  submitAssignmentFeedback,
} from "../server/controllers/resources.controller";

// ─── Helpers ────────────────────────────────────────────────────────────────

const CLIENT_ID = 10;
const THERAPIST_ID = 20;
const ASSIGNMENT_ID = 1;
const RESOURCE_ID = 5;

const mockResource = {
  id: RESOURCE_ID,
  title: "CBT Basics",
  description: "Introduction to CBT techniques",
  type: "article",
  category: "anxiety",
  content: "...",
};

const mockAssignment = {
  id: ASSIGNMENT_ID,
  resourceId: RESOURCE_ID,
  assignedTo: CLIENT_ID,
  assignedBy: THERAPIST_ID,
  status: "assigned",
  notes: "Please read before our next session",
  assignedAt: new Date().toISOString(),
  completedAt: null,
};

const mockFeedback = {
  id: 1,
  resourceId: RESOURCE_ID,
  userId: CLIENT_ID,
  rating: 4,
  feedback: "Very helpful, easy to follow",
  createdAt: new Date().toISOString(),
};

/** Build a minimal Express-like mock request */
function mockReq(overrides: Partial<Request> & { user?: any } = {}): Request {
  return {
    user: overrides.user ?? { id: CLIENT_ID, role: "client" },
    params: overrides.params ?? {},
    body: overrides.body ?? {},
    ...overrides,
  } as unknown as Request;
}

/** Build a spy-based mock response that captures status + json calls */
function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
  };
  vi.spyOn(res, "status").mockReturnThis();
  vi.spyOn(res, "json").mockReturnThis();
  return res as unknown as Response & { statusCode: number; body: any };
}

// ─── GET /api/client/assignments ────────────────────────────────────────────

describe("getClientAssignments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no user in request", async () => {
    const req = mockReq({ user: null });
    const res = mockRes();
    await getClientAssignments(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("returns enriched assignments with resource and feedback", async () => {
    vi.mocked(storage.getAssignmentsByClient).mockResolvedValue([mockAssignment as any]);
    vi.mocked(storage.getResourceFeedbackByUser).mockResolvedValue([mockFeedback as any]);
    vi.mocked(storage.getResourceById).mockResolvedValue(mockResource as any);

    const req = mockReq();
    const res = mockRes();
    await getClientAssignments(req, res);

    expect(storage.getAssignmentsByClient).toHaveBeenCalledWith(CLIENT_ID);
    expect(storage.getResourceFeedbackByUser).toHaveBeenCalledWith(CLIENT_ID);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        id: ASSIGNMENT_ID,
        resource: mockResource,
        feedback: mockFeedback,
      }),
    ]);
  });

  it("returns feedback: null when client has not rated the resource", async () => {
    vi.mocked(storage.getAssignmentsByClient).mockResolvedValue([mockAssignment as any]);
    vi.mocked(storage.getResourceFeedbackByUser).mockResolvedValue([]); // no feedback
    vi.mocked(storage.getResourceById).mockResolvedValue(mockResource as any);

    const req = mockReq();
    const res = mockRes();
    await getClientAssignments(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ feedback: null }),
    ]);
  });

  it("returns empty array when client has no assignments", async () => {
    vi.mocked(storage.getAssignmentsByClient).mockResolvedValue([]);
    vi.mocked(storage.getResourceFeedbackByUser).mockResolvedValue([]);

    const req = mockReq();
    const res = mockRes();
    await getClientAssignments(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns 500 on storage error", async () => {
    vi.mocked(storage.getAssignmentsByClient).mockRejectedValue(new Error("DB error"));

    const req = mockReq();
    const res = mockRes();
    await getClientAssignments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── PATCH /api/resource-assignments/:id/status ─────────────────────────────

describe("updateResourceAssignmentStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const req = mockReq({ user: null, params: { id: "1" } });
    const res = mockRes();
    await updateResourceAssignmentStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 400 for non-numeric assignment ID", async () => {
    const req = mockReq({ params: { id: "abc" }, body: { status: "viewed" } });
    const res = mockRes();
    await updateResourceAssignmentStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment ID" });
  });

  it("returns 400 for invalid status value", async () => {
    const req = mockReq({ params: { id: "1" }, body: { status: "deleted" } });
    const res = mockRes();
    await updateResourceAssignmentStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("viewed") })
    );
  });

  it("returns 404 when assignment does not exist", async () => {
    vi.mocked(storage.getResourceAssignmentById).mockResolvedValue(undefined);
    const req = mockReq({ params: { id: "99" }, body: { status: "viewed" } });
    const res = mockRes();
    await updateResourceAssignmentStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 403 when the assignment belongs to a different client", async () => {
    vi.mocked(storage.getResourceAssignmentById).mockResolvedValue({
      ...mockAssignment,
      assignedTo: 999, // different client
    } as any);
    const req = mockReq({ params: { id: "1" }, body: { status: "viewed" } });
    const res = mockRes();
    await updateResourceAssignmentStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("marks assignment as viewed successfully", async () => {
    vi.mocked(storage.getResourceAssignmentById).mockResolvedValue(mockAssignment as any);
    const updated = { ...mockAssignment, status: "viewed" };
    vi.mocked(storage.updateAssignmentStatus).mockResolvedValue(updated as any);

    const req = mockReq({ params: { id: "1" }, body: { status: "viewed" } });
    const res = mockRes();
    await updateResourceAssignmentStatus(req, res);

    expect(storage.updateAssignmentStatus).toHaveBeenCalledWith(ASSIGNMENT_ID, "viewed");
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "viewed" }));
  });

  it("marks assignment as completed successfully", async () => {
    vi.mocked(storage.getResourceAssignmentById).mockResolvedValue({
      ...mockAssignment,
      status: "viewed",
    } as any);
    const updated = { ...mockAssignment, status: "completed", completedAt: new Date().toISOString() };
    vi.mocked(storage.updateAssignmentStatus).mockResolvedValue(updated as any);

    const req = mockReq({ params: { id: "1" }, body: { status: "completed" } });
    const res = mockRes();
    await updateResourceAssignmentStatus(req, res);

    expect(storage.updateAssignmentStatus).toHaveBeenCalledWith(ASSIGNMENT_ID, "completed");
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }));
  });

  it("returns 500 on storage error", async () => {
    vi.mocked(storage.getResourceAssignmentById).mockRejectedValue(new Error("DB down"));
    const req = mockReq({ params: { id: "1" }, body: { status: "viewed" } });
    const res = mockRes();
    await updateResourceAssignmentStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── POST /api/resource-assignments/:id/feedback ────────────────────────────

describe("submitAssignmentFeedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const req = mockReq({ user: null, params: { id: "1" } });
    const res = mockRes();
    await submitAssignmentFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 400 for non-numeric assignment ID", async () => {
    const req = mockReq({ params: { id: "xyz" }, body: { rating: 4 } });
    const res = mockRes();
    await submitAssignmentFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment ID" });
  });

  it("returns 400 when rating is missing", async () => {
    const req = mockReq({ params: { id: "1" }, body: {} });
    const res = mockRes();
    await submitAssignmentFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when rating is below 1", async () => {
    const req = mockReq({ params: { id: "1" }, body: { rating: 0 } });
    const res = mockRes();
    await submitAssignmentFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when rating is above 5", async () => {
    const req = mockReq({ params: { id: "1" }, body: { rating: 6 } });
    const res = mockRes();
    await submitAssignmentFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when rating is not a number", async () => {
    const req = mockReq({ params: { id: "1" }, body: { rating: "five" } });
    const res = mockRes();
    await submitAssignmentFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 when assignment does not exist", async () => {
    vi.mocked(storage.getResourceAssignmentById).mockResolvedValue(undefined);
    const req = mockReq({ params: { id: "99" }, body: { rating: 4 } });
    const res = mockRes();
    await submitAssignmentFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 403 when the assignment belongs to a different client", async () => {
    vi.mocked(storage.getResourceAssignmentById).mockResolvedValue({
      ...mockAssignment,
      assignedTo: 999,
    } as any);
    const req = mockReq({ params: { id: "1" }, body: { rating: 4 } });
    const res = mockRes();
    await submitAssignmentFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 409 when feedback already exists for this resource", async () => {
    vi.mocked(storage.getResourceAssignmentById).mockResolvedValue(mockAssignment as any);
    vi.mocked(storage.getResourceFeedbackByUser).mockResolvedValue([mockFeedback as any]); // existing

    const req = mockReq({ params: { id: "1" }, body: { rating: 3 } });
    const res = mockRes();
    await submitAssignmentFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Feedback already submitted for this resource",
    });
  });

  it("saves rating and returns 201 on first submission", async () => {
    vi.mocked(storage.getResourceAssignmentById).mockResolvedValue(mockAssignment as any);
    vi.mocked(storage.getResourceFeedbackByUser).mockResolvedValue([]); // no prior feedback
    vi.mocked(storage.createResourceFeedback).mockResolvedValue(mockFeedback as any);

    const req = mockReq({
      params: { id: "1" },
      body: { rating: 4, feedback: "Very helpful, easy to follow" },
    });
    const res = mockRes();
    await submitAssignmentFeedback(req, res);

    expect(storage.createResourceFeedback).toHaveBeenCalledWith({
      resourceId: RESOURCE_ID,
      userId: CLIENT_ID,
      rating: 4,
      feedback: "Very helpful, easy to follow",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockFeedback);
  });

  it("saves rating without optional comment (feedback stored as null)", async () => {
    vi.mocked(storage.getResourceAssignmentById).mockResolvedValue(mockAssignment as any);
    vi.mocked(storage.getResourceFeedbackByUser).mockResolvedValue([]);
    vi.mocked(storage.createResourceFeedback).mockResolvedValue({
      ...mockFeedback,
      feedback: null,
    } as any);

    const req = mockReq({ params: { id: "1" }, body: { rating: 5 } }); // no feedback text
    const res = mockRes();
    await submitAssignmentFeedback(req, res);

    expect(storage.createResourceFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ feedback: null })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 500 on storage error", async () => {
    vi.mocked(storage.getResourceAssignmentById).mockRejectedValue(new Error("DB error"));
    const req = mockReq({ params: { id: "1" }, body: { rating: 4 } });
    const res = mockRes();
    await submitAssignmentFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
