import { test, expect, type Page } from "@playwright/test";

let userId: number;
test.beforeAll(async ({ request }) => {
  userId = (await (await request.get("/__e2e/ready")).json()).client;
});

async function login(page: Page) {
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === process.env.E2E_BASE_URL
      ? route.continue() : route.abort("blockedbyclient"));
  const response = await page.request.post("/api/auth/login", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { username: "e2e-client", password: "Synthetic-test-password-42" },
  });
  expect(response.status()).toBe(200);
  for (const path of ["emotions", "journal", "goals", "reframe-coach/results"]) {
    await page.route(`**/api/users/${userId}/${path}`, route => route.fulfill({ json: [] }));
  }
}

async function home(page: Page, phone: boolean) {
  if (phone) await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
  const nav = phone ? page.getByRole("dialog", { name: "Navigation Menu" }) : page.locator("aside");
  await nav.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

for (const phone of [false, true]) {
  test.describe(phone ? "phone dashboard availability" : "desktop dashboard availability", { tag: phone ? "@phone" : [] }, () => {
    test.use({
      viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 },
      isMobile: phone, hasTouch: phone,
    });

    test("unknown completion preserves navigation; retry and cached reads recover without false prerequisites", async ({ page }) => {
      await login(page);
      // All records are synthetic route responses; no therapy writes are made.
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      await page.clock.setFixedTime(now);
      let fail = true;
      let records = [{
        id: 999990, userId, createdAt: now.toISOString(),
        automaticThoughts: "Synthetic dashboard availability thought", cognitiveDistortions: [],
      }];
      let release!: () => void;
      const pending = new Promise<void>(resolve => { release = resolve; });
      let attempts = 0;
      await page.route(`**/api/users/${userId}/thoughts`, async route => {
        attempts++;
        await pending;
        return route.fulfill(fail ? { status: 503, json: { message: "Synthetic read failure" } } : { json: records });
      });
      await page.goto("/dashboard");
      const focus = page.getByTestId("dashboard-today-focus");
      const thought = page.getByTestId("dashboard-focus-thoughts");
      const reframe = page.getByTestId("dashboard-focus-reframe");
      const summary = page.getByTestId("dashboard-focus-summary");
      const retry = page.getByTestId("dashboard-retry-practice");
      await expect(thought).toContainText("Loading");
      await expect(summary).toHaveText("Loading today's completion");
      await expect(reframe).toHaveAttribute("href", "/reframe-coach");
      await expect(thought).not.toContainText("Not done today");
      release();
      await expect(thought).toContainText("Unavailable", { timeout: 20000 });
      expect(attempts).toBeGreaterThanOrEqual(4);
      await expect(summary).toHaveText("Today's completion is unavailable");
      await expect(focus).not.toContainText("Record a thought first");
      await expect(reframe).toContainText("Thought Records: Unavailable");
      await expect(reframe).toHaveAttribute("href", "/reframe-coach");
      await expect(thought).toHaveAttribute("href", "/thoughts");
      await expect(page.getByTestId("dashboard-focus-goals")).toContainText("Not done today");
      await page.screenshot({ path: test.info().outputPath("dashboard-unavailable.png"), fullPage: true });

      // A retry that fails must remain retryable and must not invent completion.
      await retry.click();
      await expect(retry).toBeEnabled({ timeout: 20000 });
      await expect(summary).toHaveText("Today's completion is unavailable");
      fail = false;
      await retry.click();
      await expect(thought).toContainText("Done today");
      await expect(summary).toHaveText("1/5 done");
      await expect(retry).toHaveCount(0);
      await expect(thought.getByLabel("Done today")).toBeVisible();

      // Real in-app navigation retains the in-memory query cache.
      fail = true;
      await page.clock.setFixedTime(new Date(now.getTime() + 120000));
      await focus.getByTestId("dashboard-focus-goals").click();
      await home(page, phone);
      await expect(thought).toContainText("Cached data — refreshing");
      await expect(thought.getByLabel("Done today")).toBeVisible();
      await expect(summary).toContainText("1/5 done");
      await expect(thought).toContainText("Cached data — refresh failed", { timeout: 20000 });
      await expect(summary).toContainText("Cached data — refresh failed");
      await expect(reframe).toHaveAttribute("href", "/reframe-coach");

      // Successful empty data may establish the prerequisite; cached empty data may not.
      fail = false;
      records = [];
      await retry.click();
      await expect(thought).toContainText("Not done today");
      await expect(summary).toHaveText("0/5 done");
      await expect(reframe).toHaveAttribute("href", "/thoughts");
      await expect(reframe).toContainText("Record a thought first");
      fail = true;
      await page.clock.setFixedTime(new Date(now.getTime() + 240000));
      await focus.getByTestId("dashboard-focus-goals").click();
      await home(page, phone);
      await expect(thought).toContainText("Cached data — refresh failed", { timeout: 20000 });
      await expect(reframe).toHaveAttribute("href", "/reframe-coach");
      await expect(focus).not.toContainText("Record a thought first");
      fail = false;
      await retry.click();
      await expect(summary).toHaveText("0/5 done");
      await expect(reframe).toHaveAttribute("href", "/thoughts");
      await expect(retry).toHaveCount(0);
      expect(await focus.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await page.screenshot({ path: test.info().outputPath("dashboard-recovered.png"), fullPage: true });
    });
  });
}
