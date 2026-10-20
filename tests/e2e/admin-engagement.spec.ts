import { test, expect, type Page } from "@playwright/test";

async function setup(page: Page, { unavailable = false, realSettings = false }: {
  unavailable?: boolean;
  realSettings?: boolean;
} = {}) {
  // The runner owns a disposable database containing synthetic login accounts.
  // Only the persistence check uses real settings reads/writes. Report reads
  // and delivery stay mocked; the harness has no scheduler or outbound access.
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === process.env.E2E_BASE_URL
      ? route.continue() : route.abort("blockedbyclient"));
  const login = await page.request.post("/api/auth/login", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { username: "e2e-admin", password: "Synthetic-test-password-42" },
  });
  expect(login.status()).toBe(200);
  if (!realSettings) await page.route("**/api/admin/engagement-settings", route => route.fulfill({
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
    return route.fulfill({ json: {
      success: true, inactiveClients: 3, emailsSent: 3, notificationsSent: 3,
      emailsFailed: 0, notificationsFailed: 0, emailsEnabled: true, hasFailures: false,
    } });
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
  await expect(page.getByRole("tabpanel")).toContainText("Automatic reminders use this same rule");
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
  await expect(page.getByRole("tabpanel").getByRole("status")).toContainText("Reminders Sent");
  expect(sends).toEqual([{ days: 7 }]);
  expect(reportRequests).toHaveLength(2);
});

test("a failed report is unavailable, not zero inactivity, and blocks manual sends", async ({ page }) => {
  const { sends } = await setup(page, { unavailable: true });
  await page.getByRole("tab", { name: "Statistics", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Engagement statistics are unavailable");
  await expect(page.getByText("Eligible for Manual Reminders", { exact: true }).locator("../..")).toContainText("Unavailable");
  await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send Manual Reminders", exact: true })).toBeDisabled();
  expect(sends).toEqual([]);
});

test("daily reminder time is explicitly UTC and saves the selected minute", async ({ page }) => {
  await setup(page);
  await expect(page.getByText("Send time (UTC)", { exact: true })).toBeVisible();
  await expect(page.getByText("Daily time in UTC (not your local time). Changes apply after saving.", {
    exact: true,
  })).toBeVisible();
  const timeInput = page.locator('input[type="time"]').first();
  await expect(timeInput).toHaveValue("09:00");
  await timeInput.fill("16:45");
  const saves: Record<string, unknown>[] = [];
  let savedSettings: Record<string, unknown>;
  await page.route("**/api/admin/engagement-settings", async route => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: savedSettings });
      return;
    }
    const data = route.request().postDataJSON();
    savedSettings = data;
    saves.push(data);
    await route.fulfill({ json: { message: "Settings updated successfully", settings: data } });
  });
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect.poll(() => saves.length).toBe(1);
  expect(saves[0].reminderTime).toBe("16:45");
  await page.reload();
  await expect(page.locator('input[type="time"]').first()).toHaveValue("16:45");
  await page.screenshot({ path: test.info().outputPath("daily-reminder-time-utc.png"), fullPage: true });
});

test("daily reminder settings persist through real endpoints when the screen is reopened", async ({ page }) => {
  // Do not intercept settings GET/POST: exercise the browser request envelope,
  // controller and storage together, exclusively against run.mjs's database.
  const { sends } = await setup(page, { realSettings: true });
  const timeInput = page.locator('input[type="time"]').first();
  const enabledSwitch = page.getByRole("switch").first();
  await expect(timeInput).toHaveValue("09:00");
  await expect(enabledSwitch).toBeChecked();
  await timeInput.fill("16:45");
  await enabledSwitch.uncheck();

  const savedResponse = page.waitForResponse(response =>
    new URL(response.url()).pathname === "/api/admin/engagement-settings"
      && response.request().method() === "POST");
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  const saved = await savedResponse;
  expect(saved.status()).toBe(200);
  expect(await saved.json()).toMatchObject({
    settings: { reminderTime: "16:45", reminderEnabled: false },
  });
  await expect(page.getByText("Settings Saved", { exact: true })).toBeVisible();

  // A new document cannot retain the form's React state or query cache.
  const reopened = await page.context().newPage();
  try {
    const settingsResponse = reopened.waitForResponse(response =>
      new URL(response.url()).pathname === "/api/admin/engagement-settings"
        && response.request().method() === "GET");
    const { sends: reopenedSends } = await setup(reopened, { realSettings: true });
    const persisted = await settingsResponse;
    expect(persisted.status()).toBe(200);
    expect(await persisted.json()).toMatchObject({
      reminderTime: "16:45", reminderEnabled: false,
    });
    await expect(reopened.locator('input[type="time"]').first()).toHaveValue("16:45");
    await expect(reopened.getByRole("switch").first()).not.toBeChecked();
    expect(sends).toEqual([]);
    expect(reopenedSends).toEqual([]);
  } finally {
    await reopened.close();
  }
});

for (const scenario of [
  {
    name: "partial delivery", notificationsSent: 2, notificationsFailed: 1, emailsSent: 1, emailsFailed: 2,
    emailsEnabled: true, inactiveClients: 3, title: "Reminders Partially Sent",
    detail: "In-app notifications: 2 sent, 1 failed. Emails: 1 sent, 2 failed.", role: "alert",
  },
  {
    name: "total failure", notificationsSent: 0, notificationsFailed: 3, emailsSent: 0, emailsFailed: 3,
    emailsEnabled: true, inactiveClients: 3, title: "No Reminders Sent",
    detail: "In-app notifications: 0 sent, 3 failed. Emails: 0 sent, 3 failed.", role: "alert",
  },
  {
    name: "disabled email", notificationsSent: 3, notificationsFailed: 0, emailsSent: 0, emailsFailed: 0,
    emailsEnabled: false, inactiveClients: 3, title: "Reminders Sent",
    detail: "Email delivery is disabled; no emails attempted.", role: "status",
  },
  {
    name: "no eligible clients", notificationsSent: 0, notificationsFailed: 0, emailsSent: 0, emailsFailed: 0,
    emailsEnabled: true, inactiveClients: 0, title: "No Eligible Clients",
    detail: "In-app notifications: 0 sent, 0 failed. Emails: 0 sent, 0 failed.", role: "status",
  },
] as const) {
  test(`manual reminders accurately show ${scenario.name} without automatic retries`, async ({ page }) => {
    await setup(page);
    let sends = 0;
    await page.route("**/api/admin/inactivity/send-reminders", route => {
      sends++;
      const hasFailures = scenario.notificationsFailed + scenario.emailsFailed > 0;
      return route.fulfill({ json: {
        success: !hasFailures, hasFailures,
        inactiveClients: scenario.inactiveClients,
        notificationsSent: scenario.notificationsSent,
        notificationsFailed: scenario.notificationsFailed,
        emailsSent: scenario.emailsSent,
        emailsFailed: scenario.emailsFailed,
        emailsEnabled: scenario.emailsEnabled,
      } });
    });
    await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Send Manual Reminders", exact: true }).click();
    const result = page.getByRole("tabpanel").getByRole(scenario.role, { name: "Manual reminder delivery result" });
    await expect(result).toContainText(scenario.title);
    await expect(result).toContainText(scenario.detail);
    if (scenario.notificationsSent + scenario.emailsSent > 0) {
      await expect(result).toContainText("Sending again may duplicate");
    }
    await page.getByRole("tab", { name: "Statistics", exact: true }).click();
    await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
    await expect(result).toContainText(scenario.title);
    page.once("dialog", dialog => {
      expect(dialog.message()).toContain("may duplicate");
      return dialog.dismiss();
    });
    await page.getByRole("button", { name: "Send Manual Reminders", exact: true }).click();
    expect(sends).toBe(1);
  });
}

test("an unconfirmed delivery warns about duplicates instead of recommending a retry", async ({ page }) => {
  await setup(page);
  let sends = 0;
  await page.route("**/api/admin/inactivity/send-reminders", route => {
    sends++;
    return route.fulfill({ status: 500, json: { message: "Synthetic private delivery error" } });
  });
  await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Send Manual Reminders", exact: true }).click();
  const result = page.getByRole("tabpanel").getByRole("alert", { name: "Manual reminder delivery result" });
  await expect(result).toContainText("Reminder Delivery Unconfirmed");
  await expect(result).toContainText("Some reminders may already have been sent");
  await expect(result).not.toContainText("Please try again");
  await expect(result).not.toContainText("Synthetic private");
  expect(sends).toBe(1);
});
