import { test, expect, type Page } from "@playwright/test";

async function setup(page: Page, unavailable = false) {
  // The runner owns a disposable database containing synthetic login accounts.
  // Every engagement read and send below is intercepted: no actual delivery.
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === process.env.E2E_BASE_URL
      ? route.continue() : route.abort("blockedbyclient"));
  const login = await page.request.post("/api/auth/login", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { username: "e2e-admin", password: "Synthetic-test-password-42" },
  });
  expect(login.status()).toBe(200);
  await page.route("**/api/admin/engagement-settings", route => route.fulfill({
    json: {
      reminderEnabled: true, reminderDays: 7, reminderTime: "09:00",
      weeklyDigestEnabled: true, weeklyDigestDay: 0, weeklyDigestTime: "08:00",
      escalationEnabled: false, escalationDays: [7, 14, 30], escalationTemplates: [],
    },
  }));
  const reportRequests: string[] = [];
  await page.route("**/api/admin/engagement-stats?*", route => {
    reportRequests.push(route.request().url());
    return route.fulfill({
      status: unavailable ? 503 : 200,
      json: unavailable ? { message: "Synthetic unavailable read" } : {
        activeClients: 2, inactiveClients: 3, totalEmailsSent: 0,
        totalNotificationsSent: 0, lastRunTime: null,
      },
    });
  });
  const sends: unknown[] = [];
  await page.route("**/api/admin/inactivity/send-reminders", route => {
    sends.push(route.request().postDataJSON());
    return route.fulfill({ json: { emailsSent: 3, notificationsSent: 3 } });
  });
  // The old, incompatible route must never be used by this screen.
  await page.route("**/api/client-engagement/send-reminders", () => {
    throw new Error("Admin screen called the incompatible reminder system");
  });
  await page.goto("/admin/engagement-settings");
  await expect(page.getByRole("tab", { name: "Statistics", exact: true })).toBeVisible();
  return { reportRequests, sends };
}

test("admin report and confirmed manual delivery use the same threshold and rule", async ({ page }) => {
  const { reportRequests, sends } = await setup(page);
  expect(reportRequests).toHaveLength(1);
  expect(new URL(reportRequests[0]).searchParams.get("days")).toBe("7");
  await page.getByRole("tab", { name: "Statistics", exact: true }).click();
  await expect(page.getByText("Eligible for Manual Reminders", { exact: true }).locator("../..")).toContainText("3");
  await expect(page.getByRole("tabpanel")).toContainText("active client accounts");
  await expect(page.getByRole("tabpanel")).toContainText("7 full 24-hour days");
  await expect(page.getByRole("tabpanel")).toContainText("exactly at the cutoff");
  await expect(page.getByRole("tabpanel")).toContainText("Automatic reminders use a separate activity check");
  await page.screenshot({ path: test.info().outputPath("engagement-statistics.png"), fullPage: true });

  await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("This is not a test");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Send Manual Reminders", exact: true }).click();
  expect(sends).toEqual([]);
  page.once("dialog", dialog => {
    expect(dialog.message()).toContain("7 days");
    return dialog.accept();
  });
  await page.getByRole("button", { name: "Send Manual Reminders", exact: true }).click();
  await expect(page.getByText("Reminders Sent", { exact: true })).toBeVisible();
  expect(sends).toEqual([{ days: 7 }]);
  expect(reportRequests).toHaveLength(2);
});

test("a failed report is unavailable, not zero inactivity, and blocks manual sends", async ({ page }) => {
  const { sends } = await setup(page, true);
  await page.getByRole("tab", { name: "Statistics", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Engagement statistics are unavailable");
  await expect(page.getByText("Eligible for Manual Reminders", { exact: true }).locator("../..")).toContainText("Unavailable");
  await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send Manual Reminders", exact: true })).toBeDisabled();
  expect(sends).toEqual([]);
});
