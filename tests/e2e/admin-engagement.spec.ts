import { test, expect, type Page } from "@playwright/test";

const validSettings = {
  reminderEnabled: true, reminderDays: 7, reminderTime: "09:00",
  weeklyDigestEnabled: true, weeklyDigestDay: 0, weeklyDigestTime: "08:00",
  reminderEmailSubject: "", reminderEmailTemplate: "",
  weeklyDigestSubject: "", weeklyDigestTemplate: "",
  escalationEnabled: false, escalationDays: [7, 14, 30], escalationTemplates: [],
};

const malformedSettings = [
  { name: "null", data: null },
  { name: "empty object", data: {} },
  { name: "array", data: [] },
  { name: "primitive", data: "not settings" },
  ...Object.keys(validSettings).map(key => ({
    name: `missing ${key}`,
    data: Object.fromEntries(Object.entries(validSettings).filter(([field]) => field !== key)),
  })),
  { name: "string boolean", data: { ...validSettings, reminderEnabled: "false" } },
  { name: "null digest flag", data: { ...validSettings, weeklyDigestEnabled: null } },
  { name: "numeric escalation flag", data: { ...validSettings, escalationEnabled: 1 } },
  { name: "string threshold", data: { ...validSettings, reminderDays: "7" } },
  { name: "fractional threshold", data: { ...validSettings, reminderDays: 1.5 } },
  { name: "invalid reminder time", data: { ...validSettings, reminderTime: "25:00" } },
  { name: "invalid digest time", data: { ...validSettings, weeklyDigestTime: null } },
  { name: "invalid weekday", data: { ...validSettings, weeklyDigestDay: 7 } },
  { name: "null subject", data: { ...validSettings, reminderEmailSubject: null } },
  { name: "object template", data: { ...validSettings, weeklyDigestTemplate: {} } },
  { name: "non-array escalation days", data: { ...validSettings, escalationDays: {} } },
  { name: "invalid escalation day", data: { ...validSettings, escalationDays: [7, "14"] } },
  { name: "non-array escalation templates", data: { ...validSettings, escalationTemplates: null } },
  { name: "invalid escalation template", data: { ...validSettings, escalationTemplates: [42] } },
];

const validReport = {
  activeClients: 2, inactiveClients: 3, deliveryHistoryStatus: "not_tracked",
  totalEmailsSent: null, totalNotificationsSent: null, lastRunTime: null,
};
const validDeliveryReceipt = {
  success: true, inactiveClients: 3, emailsSent: 3, notificationsSent: 3,
  emailsFailed: 0, notificationsFailed: 0, emailsEnabled: true, hasFailures: false,
  message: "Synthetic delivery receipt",
};
const deliveryCountFields = [
  "inactiveClients", "notificationsSent", "notificationsFailed", "emailsSent", "emailsFailed",
] as const;
const malformedDeliveryReceipts = [
  { name: "null", data: null },
  { name: "empty object", data: {} },
  { name: "array", data: [] },
  { name: "primitive", data: "not a delivery receipt" },
  ...Object.keys(validDeliveryReceipt).map(key => ({
    name: `missing ${key}`,
    data: Object.fromEntries(Object.entries(validDeliveryReceipt).filter(([field]) => field !== key)),
  })),
  ...deliveryCountFields.flatMap(field => [
    { name: `string ${field}`, data: { ...validDeliveryReceipt, [field]: "3" } },
    { name: `null ${field}`, data: { ...validDeliveryReceipt, [field]: null } },
    { name: `negative ${field}`, data: { ...validDeliveryReceipt, [field]: -1 } },
    { name: `fractional ${field}`, data: { ...validDeliveryReceipt, [field]: 1.5 } },
    { name: `unsafe ${field}`, data: { ...validDeliveryReceipt, [field]: Number.MAX_SAFE_INTEGER + 1 } },
  ]),
  { name: "string success", data: { ...validDeliveryReceipt, success: "true" } },
  { name: "false success", data: { ...validDeliveryReceipt, success: false } },
  { name: "string email flag", data: { ...validDeliveryReceipt, emailsEnabled: "false" } },
  { name: "null failure flag", data: { ...validDeliveryReceipt, hasFailures: null } },
  { name: "object message", data: { ...validDeliveryReceipt, message: { private: "Synthetic private receipt" } } },
  { name: "eligible clients but no attempts", data: {
    ...validDeliveryReceipt, notificationsSent: 0, emailsSent: 0,
  } },
  { name: "notification total below eligible clients", data: { ...validDeliveryReceipt, notificationsSent: 2 } },
  { name: "notification total above eligible clients", data: { ...validDeliveryReceipt, notificationsSent: 4 } },
  { name: "email total below eligible clients", data: { ...validDeliveryReceipt, emailsSent: 2 } },
  { name: "email total above eligible clients", data: { ...validDeliveryReceipt, emailsSent: 4 } },
  { name: "email sent while disabled", data: { ...validDeliveryReceipt, emailsEnabled: false } },
  { name: "email failed while disabled", data: {
    ...validDeliveryReceipt, emailsEnabled: false, emailsSent: 0, emailsFailed: 1, hasFailures: true,
  } },
  { name: "failure flag without failures", data: { ...validDeliveryReceipt, hasFailures: true } },
  { name: "notification failures without failure flag", data: {
    ...validDeliveryReceipt, notificationsSent: 2, notificationsFailed: 1,
  } },
  { name: "email failures without failure flag", data: {
    ...validDeliveryReceipt, emailsSent: 2, emailsFailed: 1,
  } },
  { name: "sent counts without eligible clients", data: { ...validDeliveryReceipt, inactiveClients: 0 } },
];
async function setup(page: Page, { unavailable = false, realSettings = false, settingsFailure, report = validReport }: {
  unavailable?: boolean;
  realSettings?: boolean;
  settingsFailure?: "http" | "network" | { data: unknown };
  report?: unknown;
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
  const settingsSaves: Record<string, unknown>[] = [];
  let settingsReads = 0;
  if (!realSettings) await page.route("**/api/admin/engagement-settings", route => {
    if (route.request().method() === "POST") {
      settingsSaves.push(route.request().postDataJSON());
      return route.fulfill({ json: { message: "Settings updated successfully" } });
    }
    settingsReads++;
    if (settingsFailure === "network") return route.abort("failed");
    if (settingsFailure === "http") return route.fulfill({
      status: 503, json: { message: "Synthetic settings read failure" },
    });
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(typeof settingsFailure === "object" ? settingsFailure.data : validSettings),
    });
  });
  const reportRequests: string[] = [];
  await page.route("**/api/admin/engagement-stats?*", route => {
    reportRequests.push(route.request().url());
    return route.fulfill({
      status: unavailable ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(unavailable ? { message: "Synthetic unavailable read" } : report),
    });
  });
  const sends: unknown[] = [];
  await page.route("**/api/admin/inactivity/send-reminders", route => {
    sends.push(route.request().postDataJSON());
    return route.fulfill({ json: validDeliveryReceipt });
  });
  // The old, incompatible route must never be used by this screen.
  await page.route("**/api/client-engagement/send-reminders", () => {
    throw new Error("Admin screen called the incompatible reminder system");
  });
  await page.goto("/admin/engagement-settings");
  if (settingsFailure) {
    await expect(page.getByRole("heading", { name: "Engagement settings are unavailable" })).toBeVisible();
  } else {
    await expect(page.getByRole("tab", { name: "Statistics", exact: true })).toBeVisible();
  }
  return { reportRequests, sends, settingsSaves, settingsReads: () => settingsReads };
}

for (const scenario of [
  { name: "http", failure: "http" as const },
  { name: "network", failure: "network" as const },
  ...malformedSettings.map(({ name, data }) => ({ name: `malformed ${name}`, failure: { data } })),
]) {
  test(`a failed settings ${scenario.name} read blocks defaults and saves until a successful retry`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    const settingsFailure = scenario.failure;
    const { reportRequests, sends, settingsSaves, settingsReads } = await setup(page, { settingsFailure });
    const assertBlocked = async () => {
      await expect(page.getByRole("alert")).toContainText("Editing and saving are unavailable");
      await expect(page.getByRole("button", { name: /^Save (Settings|Templates)$/ })).toHaveCount(0);
      await expect(page.getByRole("tab")).toHaveCount(0);
      await expect(page.locator('input, textarea, [role="switch"]')).toHaveCount(0);
      expect(settingsSaves).toEqual([]);
      expect(reportRequests).toEqual([]);
      expect(sends).toEqual([]);
      expect(pageErrors).toEqual([]);
    };
    await assertBlocked();
    expect(settingsReads()).toBe(1);
    await page.getByRole("button", { name: "Retry loading settings", exact: true }).click();
    await expect.poll(settingsReads).toBe(2);
    await assertBlocked();
    await page.screenshot({ path: test.info().outputPath("settings-unavailable.png"), fullPage: true });

    const storedSettings = {
      reminderEnabled: true, reminderDays: 11, reminderTime: "17:25",
      weeklyDigestEnabled: false, weeklyDigestDay: 4, weeklyDigestTime: "14:35",
      emailTemplate: "", reminderEmailSubject: "Synthetic saved reminder",
      reminderEmailTemplate: "Synthetic saved reminder body",
      weeklyDigestSubject: "Synthetic saved digest", weeklyDigestTemplate: "Synthetic saved digest body",
      escalationEnabled: false, escalationDays: [8, 16, 32], escalationTemplates: [],
    };
    let releaseRead!: () => void;
    const readGate = new Promise<void>(resolve => { releaseRead = resolve; });
    await page.route("**/api/admin/engagement-settings", async route => {
      if (route.request().method() !== "GET") return route.fallback();
      await readGate;
      return route.fulfill({ json: storedSettings });
    });
    const retryRequest = page.waitForRequest(request =>
      request.url().endsWith("/api/admin/engagement-settings") && request.method() === "GET");
    await page.getByRole("button", { name: "Retry loading settings", exact: true }).click();
    await retryRequest;
    await expect(page.getByRole("button", { name: /^Save (Settings|Templates)$/ })).toHaveCount(0);
    await expect(page.locator('input, textarea, [role="switch"]')).toHaveCount(0);
    expect(settingsSaves).toEqual([]);
    releaseRead();

    const timeInput = page.locator('input[type="time"]').first();
    await expect(timeInput).toHaveValue("17:25");
    await expect(page.getByRole("spinbutton").first()).toHaveValue("11");
    await expect(page.getByRole("switch").nth(1)).not.toBeChecked();
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(reportRequests).toHaveLength(1);
    expect(new URL(reportRequests[0]).searchParams.get("days")).toBe("11");
    await timeInput.fill("18:40");
    await page.getByRole("button", { name: "Save Settings", exact: true }).click();
    await expect(page.getByText("Settings Saved", { exact: true })).toBeVisible();
    expect(settingsSaves).toEqual([{ ...storedSettings, reminderTime: "18:40" }]);
    expect(sends).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
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

test("a pending manual delivery stays disabled across tab switches and cannot send duplicates", async ({ page }) => {
  const { sends, settingsSaves, reportRequests } = await setup(page);
  let releaseReceipt!: () => void;
  const receiptGate = new Promise<void>(resolve => { releaseReceipt = resolve; });
  await page.route("**/api/admin/inactivity/send-reminders", async route => {
    expect(route.request().method()).toBe("POST");
    sends.push(route.request().postDataJSON());
    await receiptGate;
    return route.fulfill({ json: validDeliveryReceipt });
  });
  let confirmations = 0;
  page.on("dialog", dialog => {
    confirmations++;
    return dialog.accept();
  });
  await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
  const sendButton = page.getByRole("button", { name: "Send Manual Reminders", exact: true });
  const pendingButton = page.getByRole("button", { name: "Sending...", exact: true });
  await expect(sendButton).toBeEnabled();
  try {
    await sendButton.click();
    await expect.poll(() => sends.length).toBe(1);
    await expect(pendingButton).toBeDisabled();

    for (const awayTab of ["Statistics", "Settings"]) {
      await page.getByRole("tab", { name: awayTab, exact: true }).click();
      await expect(pendingButton).toHaveCount(0);
      await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
      await expect(pendingButton).toBeDisabled();
      await expect(sendButton).toHaveCount(0);
      // Ordinary clicks wait for an enabled control. Dispatch repeated attempts
      // directly instead, so the pending-state guard is exercised without waiting.
      await pendingButton.dispatchEvent("click");
      await pendingButton.dispatchEvent("click");
      await expect(pendingButton).toBeDisabled();
      await expect(page.getByLabel("Manual reminder delivery result", { exact: true })).toHaveCount(0);
      expect(sends).toEqual([{ days: validSettings.reminderDays }]);
      expect(confirmations).toBe(1);
    }
    expect(settingsSaves).toEqual([]);
    expect(reportRequests).toHaveLength(1);
    await page.screenshot({ path: test.info().outputPath("manual-delivery-pending.png"), fullPage: true });
  } finally {
    // Always unblock the intercepted request, including when an assertion fails.
    releaseReceipt();
  }

  await expect(page.getByRole("tabpanel").getByRole("status", { name: "Manual reminder delivery result" }))
    .toContainText("Reminders Sent");
  await expect(sendButton).toBeEnabled();
  await expect(pendingButton).toHaveCount(0);
  await expect.poll(() => reportRequests.length).toBe(2);
  expect(sends).toEqual([{ days: validSettings.reminderDays }]);
  expect(confirmations).toBe(1);
  expect(settingsSaves).toEqual([]);
});

test("a failed report is unavailable, not zero inactivity, and blocks manual sends", async ({ page }) => {
  const { sends } = await setup(page, { unavailable: true });
  await expectReportUnavailable(page);
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

test("cancelling the first manual reminder confirmation sends nothing until a new confirmation is accepted", async ({ page }) => {
  const { sends } = await setup(page);
  await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
  const sendButton = page.getByRole("button", { name: "Send Manual Reminders", exact: true });
  const assertNotSent = async () => {
    expect(sends).toEqual([]);
    await expect(page.getByText("Sending...", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Manual reminder delivery result", { exact: true })).toHaveCount(0);
    // Include toast feedback, not just the persistent delivery result.
    await expect(page.getByText(/^(Reminders Sent|Reminders Partially Sent|No Reminders Sent|No Eligible Clients|Reminder Delivery Unconfirmed)$/))
      .toHaveCount(0);
    await expect(sendButton).toBeEnabled();
  };
  await assertNotSent();

  let confirmations = 0;
  page.once("dialog", dialog => {
    confirmations++;
    expect(dialog.type()).toBe("confirm");
    expect(dialog.message()).toContain(`Send real reminders to eligible clients inactive for ${validSettings.reminderDays} days?`);
    expect(sends).toEqual([]);
    return dialog.dismiss();
  });
  await sendButton.click();
  expect(confirmations).toBe(1);
  await assertNotSent();
  // Observe beyond the shared retry delays so a cancelled first attempt
  // cannot silently queue a delivery before the next explicit confirmation.
  await page.waitForTimeout(3_500);
  await assertNotSent();

  page.once("dialog", dialog => {
    confirmations++;
    expect(dialog.type()).toBe("confirm");
    expect(sends).toEqual([]);
    return dialog.accept();
  });
  await sendButton.click();
  await expect(page.getByRole("tabpanel").getByRole("status", { name: "Manual reminder delivery result" }))
    .toContainText("Reminders Sent");
  expect(confirmations).toBe(2);
  expect(sends).toEqual([{ days: validSettings.reminderDays }]);
  await expect(sendButton).toBeEnabled();
});

for (const scenario of [
  {
    name: "complete delivery", notificationsSent: 3, notificationsFailed: 0, emailsSent: 3, emailsFailed: 0,
    emailsEnabled: true, inactiveClients: 3, title: "Reminders Sent",
    detail: "In-app notifications: 3 sent, 0 failed. Emails: 3 sent, 0 failed.", role: "status",
  },
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
        ...validDeliveryReceipt, hasFailures,
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

for (const { name, data } of malformedDeliveryReceipts) {
  test(`a malformed delivery receipt (${name}) remains unconfirmed without automatic retries`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await setup(page);
    let sends = 0;
    await page.route("**/api/admin/inactivity/send-reminders", route => {
      sends++;
      // Explicit JSON serialization also covers the literal null response.
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
    });
    await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
    page.once("dialog", dialog => dialog.accept());
    const sendButton = page.getByRole("button", { name: "Send Manual Reminders", exact: true });
    await sendButton.click();
    const result = page.getByRole("tabpanel").getByRole("alert", { name: "Manual reminder delivery result" });
    await expect(result).toContainText("Reminder Delivery Unconfirmed");
    await expect(result).toContainText("Some reminders may already have been sent");
    await expect(result).toContainText("Sending again may duplicate them");
    await expect(result).not.toContainText(/undefined|NaN|Please try again|Synthetic private/);
    // Both the persistent result and toast must avoid claiming success.
    await expect(page.getByText("Reminders Sent", { exact: true })).toHaveCount(0);
    await expect(sendButton).toBeEnabled();
    await page.getByRole("tab", { name: "Statistics", exact: true }).click();
    await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
    await expect(result).toContainText("Reminder Delivery Unconfirmed");
    page.once("dialog", dialog => {
      expect(dialog.message()).toContain("may duplicate");
      return dialog.dismiss();
    });
    await sendButton.click();
    expect(sends).toBe(1);
    expect(pageErrors).toEqual([]);
  });
}

for (const failure of ["network abort", "invalid JSON", "empty body"] as const) {
  test(`a manual delivery with ${failure} stays unconfirmed until an explicitly confirmed resend`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    const { sends: fallbackSends } = await setup(page);
    const sends: unknown[] = [];
    await page.route("**/api/admin/inactivity/send-reminders", route => {
      expect(route.request().method()).toBe("POST");
      sends.push(route.request().postDataJSON());
      // Every attempt is intercepted, including the explicitly confirmed resend.
      if (sends.length > 1) return route.fulfill({ json: validDeliveryReceipt });
      if (failure === "network abort") return route.abort("failed");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: failure === "invalid JSON" ? '{"success":true,' : "",
      });
    });

    await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
    const sendButton = page.getByRole("button", { name: "Send Manual Reminders", exact: true });
    page.once("dialog", dialog => dialog.accept());
    await sendButton.click();
    const result = page.getByRole("tabpanel").getByRole("alert", { name: "Manual reminder delivery result" });
    await expect(result).toContainText("Reminder Delivery Unconfirmed");
    await expect(result).toContainText("Some reminders may already have been sent");
    await expect(result).toContainText("Sending again may duplicate them");
    await expect(result).not.toContainText(/undefined|NaN|Please try again/);
    await expect(page.getByText("Reminders Sent", { exact: true })).toHaveCount(0);
    await expect(sendButton).toBeEnabled();

    // Observe beyond the shared mutation retry delays (1s + 2s): neither a
    // transport error nor a JSON parse failure may trigger a duplicate send.
    await page.waitForTimeout(3_500);
    expect(sends).toEqual([{ days: validSettings.reminderDays }]);
    await expect(result).toContainText("Reminder Delivery Unconfirmed");
    await expect(page.getByText("Reminders Sent", { exact: true })).toHaveCount(0);
    for (const tab of ["Settings", "Templates", "Statistics"]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
      await expect(result).toContainText("Reminder Delivery Unconfirmed");
      await expect(result).toContainText("Sending again may duplicate them");
    }

    let confirmations = 0;
    page.once("dialog", dialog => {
      confirmations++;
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toContain("may duplicate");
      expect(sends).toHaveLength(1);
      return dialog.dismiss();
    });
    await sendButton.click();
    expect(confirmations).toBe(1);
    expect(sends).toHaveLength(1);
    await expect(result).toContainText("Reminder Delivery Unconfirmed");
    await expect(page.getByText("Reminders Sent", { exact: true })).toHaveCount(0);

    page.once("dialog", dialog => {
      confirmations++;
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toContain("may duplicate");
      expect(sends).toHaveLength(1);
      return dialog.accept();
    });
    await sendButton.click();
    await expect(page.getByRole("tabpanel").getByRole("status", { name: "Manual reminder delivery result" }))
      .toContainText("Reminders Sent");
    expect(confirmations).toBe(2);
    expect(sends).toEqual([
      { days: validSettings.reminderDays },
      { days: validSettings.reminderDays },
    ]);
    expect(fallbackSends).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}

for (const failure of ["network abort", "invalid JSON", "empty body"] as const) {
  test(`a later manual delivery with ${failure} replaces a prior success with a persistent unconfirmed warning`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    const { sends: fallbackSends } = await setup(page);
    const sends: unknown[] = [];
    await page.route("**/api/admin/inactivity/send-reminders", route => {
      expect(route.request().method()).toBe("POST");
      sends.push(route.request().postDataJSON());
      // Intercept every attempt: only the first receives a confirmed receipt.
      if (sends.length === 1) return route.fulfill({ json: validDeliveryReceipt });
      if (failure === "network abort") return route.abort("failed");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: failure === "invalid JSON" ? '{"success":true,' : "",
      });
    });

    await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
    const sendButton = page.getByRole("button", { name: "Send Manual Reminders", exact: true });
    const successResult = page.getByRole("tabpanel").getByRole("status", { name: "Manual reminder delivery result" });
    page.once("dialog", dialog => dialog.accept());
    await sendButton.click();
    await expect(successResult).toContainText("Reminders Sent");
    await expect(successResult).toContainText("In-app notifications: 3 sent, 0 failed. Emails: 3 sent, 0 failed.");
    expect(sends).toEqual([{ days: validSettings.reminderDays }]);

    // Remove the original success toast before the failed send so a fresh
    // success toast cannot be mistaken for feedback from the first receipt.
    const successToast = page.getByRole("status").filter({
      has: page.getByText("Reminders Sent", { exact: true }),
    }).filter({ has: page.locator("[toast-close]") });
    await expect(successToast).toBeVisible();
    await successToast.locator("[toast-close]").click();
    await expect(successToast).toHaveCount(0);
    await expect(sendButton).toBeEnabled();

    let confirmations = 0;
    page.once("dialog", dialog => {
      confirmations++;
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toContain("may duplicate");
      expect(sends).toHaveLength(1);
      return dialog.accept();
    });
    await sendButton.click();
    expect(confirmations).toBe(1);
    const result = page.getByRole("tabpanel").getByRole("alert", { name: "Manual reminder delivery result" });
    await expect(result).toContainText("Reminder Delivery Unconfirmed");
    await expect(result).toContainText("Some reminders may already have been sent");
    await expect(result).toContainText("Sending again may duplicate them");
    await expect(result).not.toContainText(/undefined|NaN|Please try again|3 sent, 0 failed/);
    await expect(successResult).toHaveCount(0);
    await expect(page.getByText("Reminders Sent", { exact: true })).toHaveCount(0);
    await expect(sendButton).toBeEnabled();

    // Observe beyond the shared retry delays, then leave and reopen the tab:
    // neither automatic retries nor the old success result may reappear.
    await page.waitForTimeout(3_500);
    expect(sends).toEqual([
      { days: validSettings.reminderDays },
      { days: validSettings.reminderDays },
    ]);
    await page.getByRole("tab", { name: "Settings", exact: true }).click();
    await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
    await expect(result).toContainText("Reminder Delivery Unconfirmed");
    await expect(result).toContainText("Sending again may duplicate them");
    await expect(page.getByText("Reminders Sent", { exact: true })).toHaveCount(0);

    page.once("dialog", dialog => {
      confirmations++;
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toContain("may duplicate");
      expect(sends).toHaveLength(2);
      return dialog.dismiss();
    });
    await sendButton.click();
    expect(confirmations).toBe(2);
    expect(sends).toHaveLength(2);
    await expect(result).toContainText("Reminder Delivery Unconfirmed");
    await expect(page.getByText("Reminders Sent", { exact: true })).toHaveCount(0);
    expect(fallbackSends).toEqual([]);
    expect(pageErrors).toEqual([]);
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

for (const saveFailure of ["http", "network"] as const) {
  for (const saveTab of ["Settings", "Templates"] as const) {
    test(`${saveTab} retains edits after a ${saveFailure} save failure and retries only on explicit save`, async ({ page }) => {
      const { reportRequests, sends, settingsReads } = await setup(page);
      const expectedSettings = {
        ...validSettings,
        reminderEnabled: true, reminderDays: 11, reminderTime: "16:45",
        weeklyDigestEnabled: false, weeklyDigestDay: 4, weeklyDigestTime: "14:35",
        reminderEmailSubject: "Edited reminder for {{clientName}}",
        reminderEmailTemplate: "Hello {{clientName}},\nCheck in: {{dashboardLink}}",
        weeklyDigestSubject: "Edited weekly summary",
        weeklyDigestTemplate: "This week: {{emotionsThisWeek}}\nFrom {{therapistName}}",
        escalationEnabled: false, escalationDays: [7, 14, 30], escalationTemplates: [],
      };
      await page.getByRole("spinbutton").first().fill(String(expectedSettings.reminderDays));
      await page.locator('input[type="time"]').first().fill(expectedSettings.reminderTime);
      await page.getByRole("combobox").selectOption(String(expectedSettings.weeklyDigestDay));
      await page.locator('input[type="time"]').nth(1).fill(expectedSettings.weeklyDigestTime);
      await page.getByRole("switch").nth(1).uncheck();
      await page.getByRole("tab", { name: "Templates", exact: true }).click();
      const templateFields = [
        ["Enter email subject line", expectedSettings.reminderEmailSubject],
        ["Write your email template here...", expectedSettings.reminderEmailTemplate],
        ["Enter weekly digest subject", expectedSettings.weeklyDigestSubject],
        ["Write your weekly digest template here...", expectedSettings.weeklyDigestTemplate],
      ] as const;
      for (const [placeholder, value] of templateFields) {
        await page.getByPlaceholder(placeholder, { exact: true }).fill(value);
      }
      await page.getByRole("tab", { name: saveTab, exact: true }).click();

      const saves: Record<string, unknown>[] = [];
      let releaseFailure!: () => void;
      const failureGate = new Promise<void>(resolve => { releaseFailure = resolve; });
      await page.route("**/api/admin/engagement-settings", async route => {
        if (route.request().method() !== "POST") return route.fallback();
        saves.push(route.request().postDataJSON());
        if (saves.length === 1) {
          await failureGate;
          return saveFailure === "network"
            ? route.abort("failed")
            : route.fulfill({ status: 503, json: { message: "Synthetic settings save failure" } });
        }
        return route.fulfill({ json: { message: "Settings updated successfully" } });
      });
      const saveButton = page.getByRole("button", { name: `Save ${saveTab}`, exact: true });
      const success = page.getByText("Settings Saved", { exact: true });
      await saveButton.click();
      try {
        await expect.poll(() => saves.length).toBe(1);
        expect(saves[0]).toEqual(expectedSettings);
        await expect(page.getByRole("button", { name: "Saving...", exact: true })).toBeDisabled();
        await expect(success).toHaveCount(0);
      } finally {
        releaseFailure();
      }
      await expect(page.getByText("Failed to save settings. Please try again.", { exact: true })).toBeVisible();
      await expect(success).toHaveCount(0);
      await expect(saveButton).toBeEnabled();
      await expect(page.getByRole("button", { name: "Saving...", exact: true })).toHaveCount(0);

      // Check both panels: a failed save must not reset either group of edits.
      await page.getByRole("tab", { name: "Settings", exact: true }).click();
      await expect(page.getByRole("spinbutton").first()).toHaveValue("11");
      await expect(page.locator('input[type="time"]').first()).toHaveValue("16:45");
      await expect(page.getByRole("switch").first()).toBeChecked();
      await expect(page.getByRole("switch").nth(1)).not.toBeChecked();
      await expect(page.getByRole("combobox")).toHaveValue("4");
      await expect(page.locator('input[type="time"]').nth(1)).toHaveValue("14:35");
      await page.getByRole("tab", { name: "Templates", exact: true }).click();
      for (const [placeholder, value] of templateFields) {
        await expect(page.getByPlaceholder(placeholder, { exact: true })).toHaveValue(value);
      }
      await page.getByRole("tab", { name: saveTab, exact: true }).click();
      await expect(success).toHaveCount(0);
      expect(saves).toEqual([expectedSettings]);
      expect(settingsReads()).toBe(1);
      expect(reportRequests).toHaveLength(1);
      expect(new URL(reportRequests[0]).searchParams.get("days")).toBe("7");
      expect(sends).toEqual([]);
      await page.screenshot({ path: test.info().outputPath(`save-failed-${saveTab}-${saveFailure}.png`), fullPage: true });

      // No re-entry, reload, or implicit retry: the restored control resends the same form.
      await saveButton.click();
      await expect(success).toBeVisible();
      await expect(saveButton).toBeEnabled();
      expect(saves).toEqual([expectedSettings, expectedSettings]);
      await expect.poll(() => reportRequests.length).toBe(2);
      expect(new URL(reportRequests[1]).searchParams.get("days")).toBe("11");
      expect(settingsReads()).toBe(1);
      expect(sends).toEqual([]);
    });
  }
}

const malformedReports = [
  { name: "null", data: null },
  { name: "empty object", data: {} },
  { name: "array", data: [] },
  { name: "primitive", data: "not a report" },
  ...["activeClients", "inactiveClients"].map(key => ({
    name: `missing ${key}`,
    data: Object.fromEntries(Object.entries(validReport).filter(([field]) => field !== key)),
  })),
  ...["activeClients", "inactiveClients"]
    .flatMap(key => [
      { name: `null ${key}`, data: { ...validReport, [key]: null } },
      { name: `string ${key}`, data: { ...validReport, [key]: "3" } },
      { name: `object ${key}`, data: { ...validReport, [key]: { count: 3 } } },
      { name: `boolean ${key}`, data: { ...validReport, [key]: true } },
      { name: `negative ${key}`, data: { ...validReport, [key]: -1 } },
      { name: `fractional ${key}`, data: { ...validReport, [key]: 1.5 } },
      { name: `unsafe ${key}`, data: { ...validReport, [key]: Number.MAX_SAFE_INTEGER + 1 } },
    ]),
];

async function expectReportUnavailable(page: Page) {
  await page.getByRole("tab", { name: "Statistics", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Engagement statistics are unavailable");
  for (const title of [
    "Within Inactivity Period", "Eligible for Manual Reminders", "Emails Sent", "Notifications Sent",
  ]) {
    await expect(page.getByText(title, { exact: true }).locator("../..")).toContainText("Unavailable");
  }
  await expect(page.getByText("Last reminder run:", { exact: true }).locator("..")).toContainText("Unavailable");
  await expect(page.getByRole("tabpanel")).not.toContainText("Invalid Date");
  await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Engagement statistics are unavailable");
  const send = page.getByRole("button", { name: "Send Manual Reminders", exact: true });
  await expect(send).toBeDisabled();
  await send.dispatchEvent("click");
}

for (const scenario of malformedReports) {
  test(`a malformed HTTP 200 report (${scenario.name}) is unavailable and blocks manual sends`, async ({ page }) => {
    const pageErrors: string[] = [];
    const dialogs: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("dialog", dialog => {
      dialogs.push(dialog.message());
      return dialog.dismiss();
    });
    const { sends, reportRequests } = await setup(page, { report: scenario.data });
    await expectReportUnavailable(page);
    expect(reportRequests).toHaveLength(1);
    expect(sends).toEqual([]);
    expect(dialogs).toEqual([]);
    expect(pageErrors).toEqual([]);

    // A fresh valid read must restore availability, not leave the screen stuck.
    await page.route("**/api/admin/engagement-stats?*", route => route.fulfill({ json: validReport }));
    await page.reload();
    await page.getByRole("tab", { name: "Statistics", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText("Eligible for Manual Reminders", { exact: true }).locator("../..")).toContainText("3");
    await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
    await expect(page.getByRole("button", { name: "Send Manual Reminders", exact: true })).toBeEnabled();
    expect(sends).toEqual([]);
    expect(dialogs).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}

test("a malformed HTTP 200 report after a valid report hides stale values and blocks delivery", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  const { sends } = await setup(page);
  await page.getByRole("tab", { name: "Statistics", exact: true }).click();
  await expect(page.getByText("Emails Sent", { exact: true }).locator("../..")).toContainText("Not tracked");
  await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send Manual Reminders", exact: true })).toBeEnabled();
  await page.route("**/api/admin/engagement-stats?*", route => route.fulfill({
    status: 200, contentType: "application/json", body: "null",
  }));
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(page.getByText("Settings Saved", { exact: true })).toBeVisible();
  await expectReportUnavailable(page);
  expect(sends).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("zero audience counts remain available without claiming zero delivery or no previous run", async ({ page }) => {
  const { sends } = await setup(page, { report: {
    ...validReport, activeClients: 0, inactiveClients: 0,
  } });
  await page.getByRole("tab", { name: "Statistics", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByText("Eligible for Manual Reminders", { exact: true }).locator("../..")).toContainText("0");
  await expect(page.getByText("Last reminder run:", { exact: true }).locator("..")).toContainText("Not tracked");
  for (const title of ["Emails Sent", "Notifications Sent"]) {
    await expect(page.getByText(title, { exact: true }).locator("../..")).toContainText("Not tracked");
  }
  await expect(page.getByRole("tabpanel")).not.toContainText("Never");
  await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send Manual Reminders", exact: true })).toBeEnabled();
  expect(sends).toEqual([]);
});

for (const history of [
  {},
  { totalEmailsSent: 0, totalNotificationsSent: 0, lastRunTime: null },
  { ...validReport, deliveryHistoryStatus: "tracked" },
  { ...validReport, totalEmailsSent: 12 },
  { ...validReport, totalNotificationsSent: 0 },
  { ...validReport, lastRunTime: "2026-10-20T09:00:00Z" },
]) {
  test(`unavailable or inconsistent history preserves audience counts (${JSON.stringify(history)})`, async ({ page }) => {
    const { sends } = await setup(page, { report: { ...history, activeClients: 2, inactiveClients: 3 } });
    await page.getByRole("tab", { name: "Statistics", exact: true }).click();
    await expect(page.getByText("Within Inactivity Period", { exact: true }).locator("../..")).toContainText("2");
    await expect(page.getByText("Eligible for Manual Reminders", { exact: true }).locator("../..")).toContainText("3");
    for (const title of ["Emails Sent", "Notifications Sent"]) {
      await expect(page.getByText(title, { exact: true }).locator("../..")).toContainText("Unavailable");
    }
    await expect(page.getByText("Last reminder run:", { exact: true }).locator("..")).toContainText("Unavailable");
    await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
    await expect(page.getByRole("button", { name: "Send Manual Reminders", exact: true })).toBeEnabled();
    expect(sends).toEqual([]);
  });
}

test("a successful manual send and reload do not fabricate delivery history", async ({ page }) => {
  const { sends } = await setup(page);
  await page.getByRole("tab", { name: "Manual Reminders", exact: true }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Send Manual Reminders", exact: true }).click();
  await expect.poll(() => sends.length).toBe(1);
  await expect(page.getByRole("button", { name: "Send Manual Reminders", exact: true })).toBeEnabled();
  for (const reload of [false, true]) {
    if (reload) await page.reload();
    await page.getByRole("tab", { name: "Statistics", exact: true }).click();
    for (const title of ["Emails Sent", "Notifications Sent"]) {
      await expect(page.getByText(title, { exact: true }).locator("../..")).toContainText("Not tracked");
    }
    await expect(page.getByText("Last reminder run:", { exact: true }).locator("..")).toContainText("Not tracked");
    await expect(page.getByText("Eligible for Manual Reminders", { exact: true }).locator("../..")).toContainText("3");
  }
  expect(sends).toEqual([{ days: 7 }]);
  await page.screenshot({ path: test.info().outputPath("untracked-delivery-history.png"), fullPage: true });
});
