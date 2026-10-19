import { test, expect } from "@playwright/test";

// The isolated runner provides only disposable accounts. All dashboard reads
// here are intercepted; no real records or health services are contacted.
const stats = {
  totalUsers: 12, totalClients: 7, totalTherapists: 4,
  totalEmotions: 8, totalThoughts: 6, totalGoals: 3,
  activeClients: 2, activeTherapists: 3, resourceUsage: 91,
  clientsWithoutTherapist: 1, therapistsWithoutClients: 1,
  clientsWithGoals: 2, averageGoalsPerClient: 0.4, averageEmotionsPerClient: 1.1,
  mostActiveTherapist: "Synthetic therapist", mostActiveClient: "Synthetic client",
  mostUsedResource: "Synthetic resource", topResources: [],
};

test("admin resource total includes published and unpublished library resources", async ({ page }) => {
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === process.env.E2E_BASE_URL
      ? route.continue() : route.abort("blockedbyclient"));
  const headers = { Origin: process.env.E2E_BASE_URL! };
  const login = await page.request.post("/api/auth/login", {
    headers,
    data: { username: "e2e-admin", password: "Synthetic-test-password-42" },
  });
  expect(login.status()).toBe(200);
  const beforeResponse = await page.request.get("/api/resources");
  expect(beforeResponse.ok()).toBe(true);
  const before = await beforeResponse.json();
  const createdIds: number[] = [];
  try {
    for (const isPublished of [true, false]) {
      const created = await page.request.post("/api/resources", {
        headers,
        data: {
          title: `Synthetic admin count ${isPublished ? "published" : "draft"}`,
          description: "Synthetic count fixture", content: "Synthetic content",
          type: "article", category: "general", isPublished,
        },
      });
      expect(created.status()).toBe(201);
      const resource = await created.json();
      createdIds.push(resource.id);
      expect(resource.isPublished).toBe(isPublished);
    }
    const libraryResponse = await page.request.get("/api/resources");
    expect(libraryResponse.ok()).toBe(true);
    const library = await libraryResponse.json();
    expect(library).toHaveLength(before.length + 2);
    const statsResponse = await page.request.get("/api/admin/stats");
    expect(statsResponse.ok()).toBe(true);
    expect((await statsResponse.json()).totalResources).toBe(library.length);
    // This journey deliberately uses the real isolated endpoint, not a mock.
    await page.goto("/admin");
    await page.getByRole("tab", { name: "Content Stats", exact: true }).click();
    const resources = page.locator(".rounded-lg.border").filter({
      has: page.getByText("Resources", { exact: true }),
    });
    await expect(resources.getByText(String(library.length), { exact: true })).toBeVisible();
  } finally {
    for (const id of createdIds) {
      const deleted = await page.request.delete(`/api/resources/${id}`, { headers });
      expect(deleted.ok()).toBe(true);
    }
  }
});

for (const count of [7, 39, 0, undefined, null, -1, 1.5, "24"]) {
  test(`resource count ${String(count)} and unsupported health are shown honestly`, async ({ page }) => {
    await page.route("**/*", route =>
      new URL(route.request().url()).origin === process.env.E2E_BASE_URL
        ? route.continue() : route.abort("blockedbyclient"));
    await page.route("**/api/admin/stats", route =>
      route.fulfill({ json: { ...stats, totalResources: count } }));
    const login = await page.request.post("/api/auth/login", {
      headers: { Origin: process.env.E2E_BASE_URL! },
      data: { username: "e2e-admin", password: "Synthetic-test-password-42" },
    });
    expect(login.ok()).toBe(true);
    await page.goto("/admin");

    const health = page.locator(".rounded-lg.border").filter({
      has: page.getByText("System Health", { exact: true }),
    });
    await expect(health.getByText("Unavailable", { exact: true })).toBeVisible();
    await expect(health).toContainText("System health measurements are not available");
    await expect(page.getByText("Excellent", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Activity trends are unavailable.", { exact: false })).toBeVisible();
    if (count === 7) await page.screenshot({ path: test.info().outputPath("health-unavailable.png") });

    await page.getByRole("tab", { name: "Content Stats", exact: true }).click();
    const resources = page.locator(".rounded-lg.border").filter({
      has: page.getByText("Resources", { exact: true }),
    });
    const valid = typeof count === "number" && Number.isInteger(count) && count >= 0;
    await expect(resources.getByText(valid ? String(count) : "Unavailable", { exact: true })).toBeVisible();
    await expect(resources).toContainText(valid ? "Resources in library" : "Resource count is not available");
    if (count === 7) await page.screenshot({ path: test.info().outputPath("resource-count.png") });
    await expect(page.getByText("Content activity trends are unavailable.", { exact: false })).toBeVisible();

    await page.getByRole("tab", { name: "User Stats", exact: true }).click();
    await expect(page.getByText("User growth trends are unavailable.", { exact: false })).toBeVisible();
    await expect(page.getByText("User role chart is unavailable.", { exact: false })).toBeVisible();
    await expect(page.getByText(/chart would appear here/)).toHaveCount(0);
  });
}
