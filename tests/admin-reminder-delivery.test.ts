import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(), notify: vi.fn(), enabled: vi.fn(), reminder: vi.fn(),
  clients: vi.fn(),
}));

// No real database, notification, email, or scheduler dependencies are loaded.
vi.mock("../server/db", () => ({ db: {}, pool: { query: mocks.query } }));
vi.mock("../server/storage", () => ({ storage: {} }));
vi.mock("../server/services/websocket", () => ({ sendNotificationToUser: mocks.notify }));
vi.mock("../server/services/email", () => ({
  isEmailEnabled: mocks.enabled,
  sendEmotionTrackingReminder: mocks.reminder,
  sendWeeklyProgressDigest: vi.fn(),
}));
vi.mock("../server/controllers/goals.controller", () => ({ updateGoalStatusBasedOnMilestones: vi.fn() }));
vi.mock("../server/services/adminEngagement", async importOriginal => ({
  ...await importOriginal<typeof import("../server/services/adminEngagement")>(),
  getAdminClientEngagement: mocks.clients,
}));

import { sendInactivityReminders } from "../server/controllers/admin.controller";
import { reminderDeliveryReceiptSchema } from "../client/src/features/admin/reminderDeliverySummary";

const clients = [1, 2, 3].map(id => ({
  id, name: `Synthetic private name ${id}`, email: `${id}@example.invalid`, inactive: true,
}));
const privateError = new Error("Synthetic private name 1 1@example.invalid private therapy detail");

async function invoke(days: unknown = 3) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await sendInactivityReminders({ body: { days } } as Request, res as unknown as Response);
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
}

describe("isolated manual reminder delivery accounting", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    mocks.clients.mockResolvedValue(clients);
    mocks.query.mockResolvedValue({ rows: [{ id: 100 }] });
    mocks.enabled.mockReturnValue(true);
    mocks.reminder.mockResolvedValue(true);
  });

  afterEach(() => {
    const logged = JSON.stringify([
      vi.mocked(console.error).mock.calls, vi.mocked(console.log).mock.calls,
    ]);
    expect(logged).not.toContain("Synthetic private");
    expect(logged).not.toContain("example.invalid");
    expect(logged).not.toContain("private therapy detail");
    vi.restoreAllMocks();
  });

  it("reports complete success with zero failures", async () => {
    const result = await invoke();
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      success: true, inactiveClients: 3, notificationsSent: 3, notificationsFailed: 0,
      emailsSent: 3, emailsFailed: 0, emailsEnabled: true, hasFailures: false,
    });
    expect(reminderDeliveryReceiptSchema.parse(result.body)).toEqual(result.body);
    expect(mocks.notify).toHaveBeenCalledTimes(3);
    expect(mocks.reminder).toHaveBeenCalledTimes(3);
  });

  it("counts notification insertion failures and still attempts every email", async () => {
    mocks.query.mockRejectedValue(privateError);
    const { body } = await invoke();
    expect(body).toMatchObject({
      notificationsSent: 0, notificationsFailed: 3, emailsSent: 3, emailsFailed: 0, hasFailures: true,
    });
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.reminder).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(body)).not.toMatch(/Synthetic private|example\.invalid|private therapy/);
  });

  it.each(["false", "exception"])("counts an email %s result without losing notification successes", async mode => {
    if (mode === "false") mocks.reminder.mockResolvedValue(false);
    else mocks.reminder.mockRejectedValue(privateError);
    expect((await invoke()).body).toMatchObject({
      notificationsSent: 3, notificationsFailed: 0, emailsSent: 0, emailsFailed: 3, hasFailures: true,
    });
    expect(mocks.reminder).toHaveBeenCalledTimes(3);
  });

  it("reports mixed successes, false email results and exceptions independently by channel", async () => {
    mocks.query.mockRejectedValueOnce(privateError);
    mocks.reminder.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockRejectedValueOnce(privateError);
    const { status, body } = await invoke();
    expect(status).toBe(200);
    expect(reminderDeliveryReceiptSchema.parse(body)).toEqual(body);
    expect(body).toMatchObject({
      success: true, inactiveClients: 3,
      notificationsSent: 2, notificationsFailed: 1, emailsSent: 1, emailsFailed: 2, hasFailures: true,
    });
    expect(body.notificationsSent + body.notificationsFailed).toBe(body.inactiveClients);
    expect(body.emailsSent + body.emailsFailed).toBe(body.inactiveClients);
    expect(mocks.notify).toHaveBeenCalledTimes(2);
    expect(mocks.reminder).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(body)).not.toMatch(/Synthetic private|example\.invalid|private therapy/);
  });

  it("reports total failure when neither channel succeeds", async () => {
    mocks.query.mockRejectedValue(privateError);
    mocks.reminder.mockResolvedValue(false);
    const { status, body } = await invoke();
    expect(status).toBe(200);
    expect(reminderDeliveryReceiptSchema.parse(body)).toEqual(body);
    expect(body).toMatchObject({
      notificationsSent: 0, notificationsFailed: 3, emailsSent: 0, emailsFailed: 3, hasFailures: true,
    });
  });

  it("does not count disabled email as failed or attempt email delivery", async () => {
    mocks.enabled.mockReturnValue(false);
    const { status, body } = await invoke();
    expect(status).toBe(200);
    expect(reminderDeliveryReceiptSchema.parse(body)).toEqual(body);
    expect(body).toMatchObject({
      notificationsSent: 3, notificationsFailed: 0, emailsSent: 0, emailsFailed: 0,
      emailsEnabled: false, hasFailures: false,
    });
    expect(body.message).toContain("Email delivery is disabled");
    expect(mocks.reminder).not.toHaveBeenCalled();
    expect(mocks.enabled).toHaveBeenCalledTimes(1);
  });

  it("keeps persisted notifications successful when live updates fail", async () => {
    mocks.notify.mockImplementation(() => { throw privateError; });
    expect((await invoke()).body).toMatchObject({
      notificationsSent: 3, notificationsFailed: 0, hasFailures: false,
    });
    expect(mocks.reminder).toHaveBeenCalledTimes(3);
  });

  it("does not attempt delivery when no clients are eligible", async () => {
    mocks.clients.mockResolvedValue([{ ...clients[0], inactive: false }]);
    const { status, body } = await invoke();
    expect(status).toBe(200);
    expect(reminderDeliveryReceiptSchema.parse(body)).toEqual(body);
    expect(body).toMatchObject({
      inactiveClients: 0, notificationsSent: 0, notificationsFailed: 0,
      emailsSent: 0, emailsFailed: 0, hasFailures: false,
    });
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.reminder).not.toHaveBeenCalled();
  });

  it.each([privateError, new RangeError(privateError.message)])("sanitizes unexpected request failures", async error => {
    mocks.clients.mockRejectedValue(error);
    expect(await invoke()).toEqual({
      status: 500, body: { success: false, message: "Error sending inactivity reminders" },
    });
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.reminder).not.toHaveBeenCalled();
  });

  it("rejects invalid thresholds before any delivery", async () => {
    expect((await invoke(-1)).status).toBe(400);
    expect(mocks.clients).not.toHaveBeenCalled();
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.reminder).not.toHaveBeenCalled();
  });
});
