import { test, expect, type Page } from "@playwright/test";

let userId: number;
const headers = () => ({ Origin: process.env.E2E_BASE_URL! });
test.beforeAll(async ({ request }) => {
  userId = (await (await request.get("/__e2e/ready")).json()).client;
});

async function login(page: Page, username: string) {
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === process.env.E2E_BASE_URL
      ? route.continue() : route.abort("blockedbyclient"));
  expect((await page.request.post("/api/auth/login", {
    headers: headers(), data: { username, password: "Synthetic-test-password-42" },
  })).status()).toBe(200);
}

async function navigateTo(page: Page, phone: boolean, label: string) {
  if (phone) await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
  const menu = phone ? page.getByRole("dialog", { name: "Navigation Menu" }) : page.locator("aside");
  await menu.getByRole("link", { name: label, exact: true }).click();
}

for (const phone of [false, true]) {
  test.describe(phone ? "phone Thought History availability" : "desktop Thought History availability",
    { tag: phone ? "@phone" : [] }, () => {
    test.use({
      viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 },
      isMobile: phone, hasTouch: phone,
    });
    for (const therapist of [false, true]) {
      test(`${therapist ? "selected client" : "client"}: loading, failed persisted read, retry and cached recovery`, async ({ page }) => {
        await login(page, "e2e-client");
        const endpoint = `/api/users/${userId}/thoughts`;
        const created = await page.request.post(endpoint, {
          headers: headers(), data: { automaticThoughts: "Synthetic History availability thought", cognitiveDistortions: [] },
        });
        expect(created.status()).toBe(201);
        const record = await created.json();
        const persisted = await (await page.request.get(endpoint)).json();
        expect(persisted.some((item: { id: number }) => item.id === record.id)).toBe(true);
        if (therapist) await login(page, "e2e-assigned");

        let fail = true;
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        await page.route(`**${endpoint}`, async route => {
          await gate;
          return fail ? route.fulfill({ status: 503, json: { message: "Synthetic read failure" } }) : route.continue();
        });
        if (therapist) {
          await page.goto("/clients");
          await page.getByRole("button", { name: "Emotions", exact: true }).click();
          await expect(page).toHaveURL(/\/emotions$/);
          await navigateTo(page, phone, "Thought Records");
        } else {
          await page.goto("/thoughts?tab=history");
        }
        const status = page.getByTestId("thought-read-status");
        try {
          await expect(status).toContainText("Loading thought history...");
          await expect(page.getByText("No thought records yet.", { exact: true })).toHaveCount(0);
          await expect(page.getByTestId("thought-summary")).not.toContainText("0%");
          await page.getByRole("tab", { name: "Insights", exact: true }).click();
          await expect(page.getByText("Total Thoughts Logged:", { exact: true })).toHaveCount(0);
        } finally { release(); }
        await expect(status).toContainText("Thought history could not load.", { timeout: 20000 });
        await expect(status).toContainText("unavailable, not empty");
        await expect(page.getByTestId("thought-summary")).not.toContainText("0%");
        fail = false;
        await page.getByTestId("retry-thought-history").click();
        await expect(status).toHaveCount(0);
        await page.getByRole("tab", { name: therapist ? "Client History" : "My History", exact: true }).click();
        await expect(page.getByTestId(`card-thought-${record.id}`)).toContainText(record.automaticThoughts);

        fail = true;
        await page.clock.setFixedTime(new Date(Date.now() + 120000));
        await navigateTo(page, phone, therapist ? "Progress" : "My Progress");
        await page.getByTestId("link-thoughts-insights").click();
        await expect(status).toContainText("Cached data — refresh failed", { timeout: 20000 });
        await expect(status).toContainText("Showing previously loaded");
        await expect(page.getByTestId("thought-summary")).toContainText(`${persisted.length}`);
        await page.getByRole("tab", { name: therapist ? "Client History" : "My History", exact: true }).click();
        await expect(page.getByTestId(`card-thought-${record.id}`)).toContainText(record.automaticThoughts);
        await page.screenshot({ path: test.info().outputPath("thought-history-cached.png"), fullPage: true });
        fail = false;
        await page.getByTestId("retry-thought-history").click();
        await expect(status).toHaveCount(0);
        await expect(page.getByTestId(`card-thought-${record.id}`)).toBeVisible();
        expect(await page.locator("main").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      });
    }

    test("a successful empty read remains normal empty history and insights", async ({ page }) => {
      await login(page, "e2e-client");
      await page.route(`**/api/users/${userId}/thoughts`, route => route.fulfill({ json: [] }));
      await page.goto("/thoughts?tab=history");
      await expect(page.getByText("No thought records yet.", { exact: true })).toBeVisible();
      await expect(page.getByTestId("thought-read-status")).toHaveCount(0);
      await expect(page.getByTestId("thought-summary")).toContainText("0%");
      await page.getByRole("tab", { name: "Insights", exact: true }).click();
      await expect(page.getByTestId("retry-thought-history")).toHaveCount(0);
    });
  });
}
