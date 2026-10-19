import { test, expect, type Page, type Route } from "@playwright/test";

// Only the disposable runner's synthetic admin is used; stats requests never
// reach even that database, so every displayed count is controlled by the test.
const emptyStats = {
  totalUsers: 0, totalClients: 0, totalTherapists: 0,
  totalEmotions: 0, totalThoughts: 0, totalGoals: 0, totalResources: 0,
  activeClients: 0, activeTherapists: 0, resourceUsage: 0,
  clientsWithoutTherapist: 0, therapistsWithoutClients: 0,
  clientsWithGoals: 0, averageGoalsPerClient: 0, averageEmotionsPerClient: 0,
  mostActiveTherapist: "", mostActiveClient: "", mostUsedResource: "",
  topResources: [],
};

async function expectNoStatistics(page: Page) {
  await expect(page.getByRole("tablist")).toHaveCount(0);
  for (const title of ["Total Users", "Total Clients", "Total Therapists", "System Health"]) {
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  }
}

async function expectLoading(page: Page) {
  await expect(page.getByRole("status").filter({ hasText: "Loading dashboard statistics" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toHaveCount(0);
  await expectNoStatistics(page);
}

async function expectFailure(page: Page) {
  const alert = page.getByRole("alert").filter({ hasText: "Unable to load dashboard statistics" });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("This does not mean the system has no records.");
  await expect(alert.getByRole("button", { name: "Retry", exact: true })).toBeEnabled();
  await expectNoStatistics(page);
  // A transient toast must not be the only failure notice.
  const closeToast = page.locator("[toast-close]");
  for (const close of await closeToast.all()) await close.click();
  await expect(alert).toBeVisible();
}

const numericFields = Object.keys(emptyStats).filter(
  key => typeof emptyStats[key as keyof typeof emptyStats] === "number",
);
const invalidPayloads: { name: string; payload: unknown }[] = [
  { name: "null", payload: null },
  { name: "array instead of aggregate", payload: [] },
  ...Object.keys(emptyStats).filter(field => field !== "totalResources").map(field => ({
    name: `missing ${field}`,
    payload: Object.fromEntries(Object.entries(emptyStats).filter(([key]) => key !== field)),
  })),
  ...numericFields.map(field => ({
    name: `string instead of numeric ${field}`,
    payload: { ...emptyStats, [field]: "0" },
  })),
  { name: "null numeric field", payload: { ...emptyStats, totalClients: null } },
  { name: "negative resource count", payload: { ...emptyStats, totalResources: -1 } },
  { name: "fractional resource count", payload: { ...emptyStats, totalResources: 1.5 } },
  { name: "boolean numeric field", payload: { ...emptyStats, totalUsers: false } },
  { name: "invalid name", payload: { ...emptyStats, mostActiveClient: {} } },
  { name: "invalid resource list", payload: { ...emptyStats, topResources: {} } },
  { name: "null resource entry", payload: { ...emptyStats, topResources: [null] } },
  { name: "incomplete resource entry", payload: { ...emptyStats, topResources: [{ id: 1, title: "Synthetic" }] } },
  { name: "invalid resource count", payload: { ...emptyStats, topResources: [{ id: 1, title: "Synthetic", usageCount: "0" }] } },
];

for (const { name, payload } of invalidPayloads) {
  test(`invalid admin statistics: ${name} shows persistent error and recovers`, async ({ page }) => {
    await page.route("**/*", route =>
      new URL(route.request().url()).origin === process.env.E2E_BASE_URL
        ? route.continue() : route.abort("blockedbyclient"));
    let requests = 0;
    let recover = false;
    const recoveredStats = payload === null ? emptyStats : {
      ...emptyStats, totalUsers: 17, totalClients: 12, totalTherapists: 4,
      clientsWithoutTherapist: 2, therapistsWithoutClients: 1,
      averageGoalsPerClient: 1.5, averageEmotionsPerClient: 2.3,
    };
    await page.route("**/api/admin/stats", route => {
      requests++;
      return route.fulfill({
        json: recover ? recoveredStats : payload,
      });
    });
    const login = await page.request.post("/api/auth/login", {
      headers: { Origin: process.env.E2E_BASE_URL! },
      data: { username: "e2e-admin", password: "Synthetic-test-password-42" },
    });
    expect(login.status()).toBe(200);
    const crashes: Error[] = [];
    page.on("pageerror", error => crashes.push(error));
    await page.goto("/admin");
    await expectFailure(page);
    // Repeated invalid successes must not dismiss the persistent failure.
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect.poll(() => requests).toBe(2);
    await expectFailure(page);

    recover = true;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.getByRole("tab", { name: "Overview", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry", exact: true })).toHaveCount(0);
    await expect(page.getByRole("tabpanel").locator(".text-2xl.font-bold")).toHaveText(
      payload === null ? ["0", "0", "0", "Unavailable"] : ["17", "12", "4", "Unavailable"],
    );
    await page.getByRole("tab", { name: "Therapist-Client", exact: true }).click();
    await expect(page.getByRole("tabpanel").locator(".text-2xl.font-bold")).toHaveText(
      payload === null ? ["0", "0", "0", "0"] : ["10", "2", "3", "1"],
    );
    for (const [label, value] of [
      ["Avg. Goals per Client", recoveredStats.averageGoalsPerClient],
      ["Avg. Emotions per Client", recoveredStats.averageEmotionsPerClient],
    ] as const) {
      await expect(page.getByText(label, { exact: true }).locator("..").locator(".font-medium")).toHaveText(String(value));
    }
    await expect(page.getByRole("tabpanel")).not.toContainText("NaN");
    expect(requests).toBe(3);
    expect(crashes).toEqual([]);
  });
}

for (const availability of ["missing", "null"] as const) {
  test(`admin resource count is unavailable when ${availability}`, async ({ page }) => {
    await page.route("**/*", route =>
      new URL(route.request().url()).origin === process.env.E2E_BASE_URL
        ? route.continue() : route.abort("blockedbyclient"));
    const { totalResources, ...withoutResources } = emptyStats;
    await page.route("**/api/admin/stats", route => route.fulfill({
      json: availability === "missing" ? withoutResources : { ...emptyStats, totalResources: null },
    }));
    const login = await page.request.post("/api/auth/login", {
      headers: { Origin: process.env.E2E_BASE_URL! },
      data: { username: "e2e-admin", password: "Synthetic-test-password-42" },
    });
    expect(login.status()).toBe(200);
    await page.goto("/admin");
    await page.getByRole("tab", { name: "Content Stats", exact: true }).click();
    await expect(page.getByRole("tabpanel").locator(".text-2xl.font-bold")).toHaveText(
      ["0", "0", "0", "Unavailable"],
    );
  });
}

for (const recovery of ["populated", "empty"] as const) {
  test(`admin statistics distinguish loading and repeated failure from ${recovery} success`, async ({ page }) => {
    await page.route("**/*", route =>
      new URL(route.request().url()).origin === process.env.E2E_BASE_URL
        ? route.continue() : route.abort("blockedbyclient"));
    const pending: Route[] = [];
    await page.route("**/api/admin/stats", route => { pending.push(route); });
    const login = await page.request.post("/api/auth/login", {
      headers: { Origin: process.env.E2E_BASE_URL! },
      data: { username: "e2e-admin", password: "Synthetic-test-password-42" },
    });
    expect(login.status()).toBe(200);
    await page.goto("/admin");
    await expect.poll(() => pending.length).toBe(1);
    await expectLoading(page);
    await pending[0].fulfill({ status: 503, json: { message: "Synthetic stats outage" } });
    await expectFailure(page);
    await page.screenshot({ path: test.info().outputPath(`admin-stats-error-${recovery}.png`) });

    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect.poll(() => pending.length).toBe(2);
    await expectLoading(page);
    // Also exercise a dropped connection, not only an HTTP failure.
    await pending[1].abort("failed");
    await expectFailure(page);

    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect.poll(() => pending.length).toBe(3);
    await expectLoading(page);
    await pending[2].fulfill({
      json: recovery === "empty" ? emptyStats : {
        ...emptyStats, totalUsers: 17, totalClients: 12, totalTherapists: 4,
        totalThoughts: 23, totalGoals: 9, totalResources: 7,
      },
    });
    await expect(page.getByRole("tab", { name: "Overview", exact: true })).toBeVisible();
    await expect(page.getByText("Unable to load dashboard statistics", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry", exact: true })).toHaveCount(0);
    await expect(page.getByRole("tabpanel").locator(".text-2xl.font-bold")).toHaveText(
      recovery === "empty" ? ["0", "0", "0", "Unavailable"] : ["17", "12", "4", "Unavailable"],
    );
    await page.getByRole("tab", { name: "Content Stats", exact: true }).click();
    await expect(page.getByText("Thought Records", { exact: true })).toBeVisible();
    await expect(page.getByRole("tabpanel").locator(".text-2xl.font-bold")).toHaveText(
      recovery === "empty" ? ["0", "0", "0", "0"] : ["0", "23", "9", "7"],
    );
    expect(pending).toHaveLength(3);
  });
}
