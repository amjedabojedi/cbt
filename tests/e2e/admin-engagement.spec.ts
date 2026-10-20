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

async function setup(page: Page, { unavailable = false, realSettings = false, settingsFailure }: {
  unavailable?: boolean;
  realSettings?: boolean;
  settingsFailure?: "http" | "network" | { data: unknown };
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
