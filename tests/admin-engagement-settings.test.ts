import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  storage: {
    getEngagementSettings: vi.fn(),
    updateEngagementSettings: vi.fn(),
  },
  query: vi.fn(),
  notify: vi.fn(),
  emailEnabled: vi.fn(),
  digest: vi.fn(),
  reminder: vi.fn(),
  updateGoals: vi.fn(),
}));

// Hoisted replacements prevent database, therapy storage, delivery services,
// and the goals controller from being evaluated, even at import time.
vi.mock("../server/db", () => ({
  db: { select: mocks.query },
  pool: { query: mocks.query },
}));
vi.mock("../server/storage", () => ({ storage: mocks.storage }));
vi.mock("../server/services/websocket", () => ({ sendNotificationToUser: mocks.notify }));
vi.mock("../server/services/email", () => ({
  isEmailEnabled: mocks.emailEnabled,
  sendWeeklyProgressDigest: mocks.digest,
  sendEmotionTrackingReminder: mocks.reminder,
}));
vi.mock("../server/controllers/goals.controller", () => ({
  updateGoalStatusBasedOnMilestones: mocks.updateGoals,
}));

import {
  getEngagementSettings,
  updateEngagementSettings,
} from "../server/controllers/admin.controller";

function response() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

// Fresh synthetic settings only; no accounts, therapy records, or credentials.
function settingsPayload() {
  return {
    reminderEnabled: false,
    reminderDays: 5,
    reminderTime: "16:45",
    weeklyDigestEnabled: false,
    weeklyDigestDay: 4,
    weeklyDigestTime: "12:30",
    reminderEmailSubject: "Synthetic reminder subject",
    reminderEmailTemplate: "<p>Synthetic reminder template</p>",
    weeklyDigestSubject: "Synthetic digest subject",
    weeklyDigestTemplate: "<p>Synthetic digest template</p>",
    escalationEnabled: true,
    escalationDays: [5, 10, 20],
    escalationTemplates: ["Synthetic first escalation", "Synthetic second escalation"],
  };
}

describe("admin engagement settings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    try {
      for (const dependency of [
        mocks.query, mocks.notify, mocks.emailEnabled,
        mocks.digest, mocks.reminder, mocks.updateGoals,
      ]) {
        expect(dependency).not.toHaveBeenCalled();
      }
    } finally {
      vi.restoreAllMocks();
    }
  });

  it.each([undefined, null])("returns complete defaults when storage returns %s", async (missing) => {
    mocks.storage.getEngagementSettings.mockResolvedValue(missing);
    const res = response();

    await getEngagementSettings({} as Request, res as unknown as Response);

    expect(mocks.storage.getEngagementSettings).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.storage.updateEngagementSettings).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({
      reminderEnabled: true,
      reminderDays: 3,
      reminderTime: "09:00",
      weeklyDigestEnabled: true,
      weeklyDigestDay: 0,
      weeklyDigestTime: "08:00",
      emailTemplate: "",
      reminderEmailSubject: "",
      reminderEmailTemplate: "",
      weeklyDigestSubject: "",
      weeklyDigestTemplate: "",
      escalationEnabled: false,
      escalationDays: [7, 14, 30],
      escalationTemplates: [],
    });
  });

  it("returns saved settings unchanged rather than replacing disabled options with defaults", async () => {
    const saved = {
      ...settingsPayload(),
      id: 901,
      emailTemplate: "Synthetic legacy template",
      updatedAt: new Date("2026-10-01T10:00:00.000Z"),
    };
    mocks.storage.getEngagementSettings.mockResolvedValue(saved);
    const res = response();

    await getEngagementSettings({} as Request, res as unknown as Response);

    expect(mocks.storage.getEngagementSettings).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.storage.updateEngagementSettings).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith(saved);
    expect(res.json.mock.calls[0][0]).toBe(saved);
  });

  it("returns 500 on a read failure instead of successful defaults", async () => {
    mocks.storage.getEngagementSettings.mockRejectedValue(new Error("Synthetic read failure"));
    const res = response();

    await getEngagementSettings({} as Request, res as unknown as Response);

    expect(mocks.storage.getEngagementSettings).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.storage.updateEngagementSettings).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledExactlyOnceWith(500);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({
      message: "Failed to fetch engagement settings",
    });
  });

  it("passes every editable field to storage and confirms the actual stored result", async () => {
    const payload = settingsPayload();
    const saved = { ...payload, id: 902, reminderTime: "16:00" };
    mocks.storage.updateEngagementSettings.mockResolvedValue(saved);
    const res = response();

    await updateEngagementSettings({ body: payload } as Request, res as unknown as Response);

    expect(mocks.storage.updateEngagementSettings).toHaveBeenCalledExactlyOnceWith(payload);
    expect(mocks.storage.getEngagementSettings).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({
      message: "Settings updated successfully",
      settings: saved,
    });
    expect(res.json.mock.calls[0][0].settings).toBe(saved);
  });

  it("does not confirm a save while the storage write is still pending", async () => {
    const payload = settingsPayload();
    const saved = { ...payload, id: 903 };
    let finishWrite!: (value: typeof saved) => void;
    mocks.storage.updateEngagementSettings.mockReturnValue(
      new Promise<typeof saved>((resolve) => { finishWrite = resolve; }),
    );
    const res = response();

    const pending = updateEngagementSettings(
      { body: payload } as Request,
      res as unknown as Response,
    );
    try {
      expect(mocks.storage.updateEngagementSettings).toHaveBeenCalledExactlyOnceWith(payload);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    } finally {
      finishWrite(saved);
      await pending;
    }

    expect(mocks.storage.getEngagementSettings).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({
      message: "Settings updated successfully",
      settings: saved,
    });
  });

  it("returns 500 on a write failure without a successful save confirmation", async () => {
    const payload = settingsPayload();
    mocks.storage.updateEngagementSettings.mockRejectedValue(new Error("Synthetic write failure"));
    const res = response();

    await updateEngagementSettings({ body: payload } as Request, res as unknown as Response);

    expect(mocks.storage.updateEngagementSettings).toHaveBeenCalledExactlyOnceWith(payload);
    expect(mocks.storage.getEngagementSettings).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledExactlyOnceWith(500);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({
      message: "Failed to save engagement settings",
    });
  });
});
