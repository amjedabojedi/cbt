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
  const response = await page.request.post("/api/auth/login", {
    headers: headers(), data: { username, password: "Synthetic-test-password-42" },
  });
  expect(response.status()).toBe(200);
}

async function progressLink(page: Page, phone: boolean, therapist: boolean) {
  if (phone) await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
  const container = phone ? page.getByRole("dialog", { name: "Navigation Menu" }) : page.locator("aside");
  await container.getByRole("link", { name: therapist ? "Progress" : "My Progress", exact: true }).click();
}

for (const phone of [false, true]) {
  test.describe(phone ? "phone Progress availability" : "desktop Progress availability", { tag: phone ? "@phone" : [] }, () => {
    test.use({
      viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 },
      isMobile: phone, hasTouch: phone,
    });

    for (const therapist of [false, true]) {
      test(`${therapist ? "selected client" : "client"}: failed persisted read, retry, cached refresh failure and recovery`, async ({ page }) => {
        // Every write and verification targets only the disposable harness database.
        await login(page, "e2e-client");
        const base = `/api/users/${userId}/thoughts`;
        const created = await page.request.post(base, {
          headers: headers(),
          data: { automaticThoughts: "Synthetic Progress availability record", cognitiveDistortions: [] },
        });
        expect(created.status()).toBe(201);
        const record = await created.json();
        const persisted = await (await page.request.get(base)).json();
        expect(persisted.some((item: { id: number }) => item.id === record.id)).toBe(true);
        const count = persisted.length;
        const challenged = persisted.filter((item: { evidenceFor?: string; evidenceAgainst?: string; alternativePerspective?: string }) =>
          item.evidenceFor || item.evidenceAgainst || item.alternativePerspective).length;
        if (therapist) await login(page, "e2e-assigned");

        let fail = true;
        let attempts = 0;
        await page.route(`**${base}`, route => {
          attempts++;
          return fail ? route.fulfill({ status: 503, json: { message: "Synthetic unavailable read" } }) : route.continue();
        });
        if (therapist) {
          await page.goto("/clients");
          await page.getByRole("button", { name: "Emotions", exact: true }).click();
          await expect(page).toHaveURL(/\/emotions$/);
          await progressLink(page, phone, true);
        } else {
          await page.goto("/reports");
        }
        const thoughtStatus = page.getByTestId("availability-thoughts");
        const thoughtMetric = page.getByTestId("metric-thought-challenge");
        await expect(thoughtStatus).toContainText("Unavailable", { timeout: 20000 });
        expect(attempts).toBeGreaterThanOrEqual(4);
        await expect(thoughtMetric).toContainText("Data unavailable");
        await expect(thoughtMetric).not.toContainText("0 / 0");
        await expect(thoughtMetric.locator('[role="progressbar"]')).toHaveCount(0);
        await expect(page.getByTestId("metric-activity-level")).toContainText("Totals cannot be calculated");
        await expect(page.getByTestId("availability-goals")).toContainText("Loaded");
        await page.screenshot({ path: test.info().outputPath("progress-unavailable.png"), fullPage: true });
        for (const period of ["Past Week", "All Time", "Past Month"]) {
          await page.getByRole("combobox", { name: "Reporting period" }).click();
          await page.getByRole("option", { name: period, exact: true }).click();
          await expect(thoughtStatus).toContainText("Unavailable");
        }
        fail = false;
        await page.getByTestId("retry-progress").click();
        await expect(thoughtStatus).toContainText(`${count} — Loaded`);
        await expect(thoughtMetric).toContainText(`${challenged} / ${count}`);
        await expect(page.getByTestId("retry-progress")).toHaveCount(0);

        // Revisit a stale query through real navigation, retaining in-memory cache.
        fail = true;
        await page.clock.setFixedTime(new Date(Date.now() + 120000));
        await page.getByTestId("link-thoughts-insights").click();
        await progressLink(page, phone, therapist);
        await expect(thoughtStatus).toContainText("Cached data — refresh failed", { timeout: 20000 });
        await expect(thoughtStatus).toContainText(`${count} —`);
        await expect(thoughtMetric).toContainText(`${challenged} / ${count}`);
        await expect(thoughtMetric).toContainText("Showing previously loaded data");
        fail = false;
        await page.getByTestId("retry-progress").click();
        await expect(thoughtStatus).toContainText(`${count} — Loaded`);
        await expect(thoughtMetric).not.toContainText("Refresh failed");
        const main = page.locator("main");
        expect(await main.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        await page.screenshot({ path: test.info().outputPath("progress-recovered.png"), fullPage: true });
      });
    }

    test("loaded empty modules show genuine zeros; unavailable modules do not", async ({ page }) => {
      await login(page, "e2e-client");
      for (const path of ["emotions", "thoughts", "journal", "goals", "reframe-coach/results"]) {
        await page.route(`**/api/users/${userId}/${path}`, route => route.fulfill({ json: [] }));
      }
      await page.goto("/reports");
      await expect(page.getByTestId("availability-thoughts")).toContainText("0 — Loaded");
      await expect(page.getByTestId("metric-thought-challenge")).toContainText("0 / 0");
      await expect(page.getByTestId("metric-activity-level").locator(".text-3xl")).toHaveText("0");
      await expect(page.getByTestId("metric-goal-progress")).toContainText("0 / 0");
      await expect(page.getByTestId("progress-availability")).not.toContainText("Unavailable —");
    });

    test("all failed sources stay unavailable through retry failure, then recover as loaded empty", async ({ page }) => {
      await login(page, "e2e-client");
      let fail = true;
      let release!: () => void;
      const firstRead = new Promise<void>(resolve => { release = resolve; });
      for (const path of ["emotions", "thoughts", "journal", "goals", "reframe-coach/results"]) {
        await page.route(`**/api/users/${userId}/${path}`, async route => {
          await firstRead;
          return route.fulfill(fail ? { status: 503, json: { message: "Synthetic failure" } } : { json: [] });
        });
      }
      await page.goto("/reports");
      await expect(page.getByTestId("availability-thoughts")).toContainText("Loading");
      await expect(page.getByTestId("metric-thought-challenge")).not.toContainText("0 / 0");
      release();
      for (const module of ["emotions", "thoughts", "journals", "goals", "reframe"]) {
        await expect(page.getByTestId(`availability-${module}`)).toContainText("Unavailable", { timeout: 20000 });
      }
      await expect(page.getByText("No activities yet", { exact: false })).toHaveCount(0);
      await page.getByTestId("retry-progress").click();
      await expect(page.getByTestId("availability-thoughts")).toContainText("Unavailable", { timeout: 20000 });
      await expect(page.getByTestId("retry-progress")).toBeEnabled({ timeout: 20000 });
      fail = false;
      await page.getByTestId("retry-progress").click();
      for (const module of ["emotions", "thoughts", "journals", "goals", "reframe"]) {
        await expect(page.getByTestId(`availability-${module}`)).toContainText("0 — Loaded");
      }
      await expect(page.getByTestId("metric-thought-challenge")).toContainText("0 / 0");
    });

    test("reporting periods filter loaded and partial records without inventing complete totals", async ({ page }) => {
      await login(page, "e2e-client");
      const oldDate = new Date(Date.now() - 15 * 86400000).toISOString();
      await page.route(`**/api/users/${userId}/thoughts`, route => route.fulfill({
        json: [{ id: 999991, userId, createdAt: oldDate, automaticThoughts: "Synthetic older thought",
          cognitiveDistortions: [], evidenceFor: "Synthetic evidence" }],
      }));
      await page.route(`**/api/users/${userId}/journal`, route => route.fulfill({
        status: 503, json: { message: "Synthetic journal unavailable" },
      }));
      await page.goto("/reports");
      const metric = page.getByTestId("metric-thought-challenge");
      await expect(metric).toContainText("1 / 1");
      await expect(page.getByTestId("availability-journals")).toContainText("Unavailable", { timeout: 20000 });
      await expect(page.getByText("Partial timeline: only available records are shown.", { exact: false })).toBeVisible();
      await expect(page.getByTestId("metric-activity-level")).toContainText("Totals cannot be calculated");
      await page.getByRole("combobox", { name: "Reporting period" }).click();
      await page.getByRole("option", { name: "Past Week", exact: true }).click();
      await expect(metric).toContainText("0 / 0");
      await expect(page.getByTestId("availability-thoughts")).toContainText("0 — Loaded");
      await page.getByRole("combobox", { name: "Reporting period" }).click();
      await page.getByRole("option", { name: "All Time", exact: true }).click();
      await expect(metric).toContainText("1 / 1");
      await expect(page.getByTestId("metric-activity-level")).toContainText("Totals cannot be calculated");
    });
  });
}
