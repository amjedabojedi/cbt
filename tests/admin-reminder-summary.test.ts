import { describe, expect, it } from "vitest";
import { reminderDeliverySummary } from "../client/src/features/admin/reminderDeliverySummary";
import type { ReminderDeliveryResult } from "../shared/reminderDelivery";

const complete: ReminderDeliveryResult = {
  success: true, inactiveClients: 3, notificationsSent: 3, notificationsFailed: 0,
  emailsSent: 3, emailsFailed: 0, emailsEnabled: true, hasFailures: false, message: "",
};

describe("admin reminder delivery feedback", () => {
  it("shows complete success and warns about repeating successful sends", () => {
    expect(reminderDeliverySummary(complete)).toEqual({
      title: "Reminders Sent",
      description: "In-app notifications: 3 sent, 0 failed. Emails: 3 sent, 0 failed. Sending again may duplicate reminders that already succeeded.",
    });
  });

  it("shows partial delivery with independent channel failures", () => {
    const result = reminderDeliverySummary({
      ...complete, notificationsSent: 2, notificationsFailed: 1, emailsSent: 1, emailsFailed: 2, hasFailures: true,
    });
    expect(result.title).toBe("Reminders Partially Sent");
    expect(result.variant).toBe("destructive");
    expect(result.description).toContain("In-app notifications: 2 sent, 1 failed. Emails: 1 sent, 2 failed.");
    expect(result.description).toContain("Sending again may duplicate");
  });

  it("does not claim partial success when every delivery failed", () => {
    const result = reminderDeliverySummary({
      ...complete, notificationsSent: 0, notificationsFailed: 3, emailsSent: 0, emailsFailed: 3, hasFailures: true,
    });
    expect(result.title).toBe("No Reminders Sent");
    expect(result.variant).toBe("destructive");
  });

  it("distinguishes disabled email from delivery failure", () => {
    const result = reminderDeliverySummary({ ...complete, emailsEnabled: false, emailsSent: 0 });
    expect(result.title).toBe("Reminders Sent");
    expect(result.variant).toBeUndefined();
    expect(result.description).toContain("Email delivery is disabled; no emails attempted.");
  });

  it("does not claim to have sent reminders to an empty population", () => {
    const result = reminderDeliverySummary({ ...complete, inactiveClients: 0, notificationsSent: 0, emailsSent: 0 });
    expect(result.title).toBe("No Eligible Clients");
    expect(result.variant).toBeUndefined();
    expect(result.description).not.toContain("Sending again");
  });
});
