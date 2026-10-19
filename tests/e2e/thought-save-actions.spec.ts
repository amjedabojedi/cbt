import { test, expect, type Page } from "@playwright/test";

let userId: number;
test.beforeAll(async ({ request }) => {
  userId = (await (await request.get("/__e2e/ready")).json()).client;
});

for (const phone of [false, true]) {
  test.describe(phone ? "phone thought save" : "desktop thought save", { tag: phone ? "@phone" : [] }, () => {
    test.use({
      viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 },
      isMobile: phone, hasTouch: phone,
    });
    const press = (page: Page, id: string) =>
      phone ? page.getByTestId(id).tap() : page.getByTestId(id).click();

    test.beforeEach(async ({ page }) => {
      await page.route("**/*", route =>
        new URL(route.request().url()).origin === process.env.E2E_BASE_URL
          ? route.continue() : route.abort("blockedbyclient"));
      const login = await page.request.post("/api/auth/login", {
        headers: { Origin: process.env.E2E_BASE_URL! },
        data: { username: "e2e-client", password: "Synthetic-test-password-42" },
      });
      expect(login.status()).toBe(200);
      await page.goto("/thoughts");
      await press(page, "button-next-step");
      await page.getByTestId("textarea-thought").fill("Synthetic thought for save-action verification.");
      await press(page, "button-next-step");
      await press(page, "button-next-step");
      if (phone) await page.getByRole("checkbox").first().tap();
      else await page.getByRole("checkbox").first().click();
      await press(page, "button-next-step");
      await page.getByTestId("textarea-situation").fill("Synthetic situation that must remain available on a failed save.");
      await press(page, "button-next-step");
      await press(page, "button-next-step");
      await expect(page.getByTestId("step-review-thought")).toBeVisible();
    });

    test("a confirmed save opens success without waiting for the History refresh", async ({ page }) => {
      const endpoint = `/api/users/${userId}/thoughts`;
      let release!: () => void;
      const gate = new Promise<void>(resolve => { release = resolve; });
      let refreshStarted = false;
      await page.route(`**${endpoint}`, async route => {
        if (route.request().method() === "GET") {
          refreshStarted = true;
          await gate;
        }
        await route.continue();
      });
      const saved = page.waitForResponse(r =>
        r.url().endsWith(endpoint) && r.request().method() === "POST" && r.status() === 201);
      const refreshed = page.waitForResponse(r =>
        r.url().endsWith(endpoint) && r.request().method() === "GET" && r.status() === 200);
      try {
        await press(page, "button-submit-wizard");
        const record = await (await saved).json();
        expect(record).toMatchObject({
          automaticThoughts: "Synthetic thought for save-action verification.",
        });
        await expect.poll(() => refreshStarted).toBe(true);
        await expect(page.getByTestId("dialog-thought-success")).toBeVisible({ timeout: 3000 });
        await expect(page.getByTestId("button-challenge-thought")).toBeEnabled();
        if (phone) await page.screenshot({
          path: test.info().outputPath("thought-save-confirmation-phone.png"), animations: "disabled",
        });
        await press(page, "button-challenge-thought");
        await expect(page.getByTestId("button-start-challenge")).toBeVisible({ timeout: 3000 });
        await press(page, "button-start-challenge");
        await expect(page.getByTestId("textarea-evidence-for")).toBeVisible();
        const cancel = page.getByRole("button", { name: "Cancel thought challenge", exact: true });
        if (phone) await cancel.tap();
        else await cancel.click();
        await expect(page.getByTestId(`card-thought-${record.id}`))
          .toContainText("Synthetic thought for save-action verification.");
      } finally {
        release();
        await refreshed;
      }
    });

    test("a failed save stays visible with writing intact and allows an explicit retry", async ({ page }) => {
      const endpoint = `/api/users/${userId}/thoughts`;
      let attempts = 0;
      let release!: () => void;
      const gate = new Promise<void>(resolve => { release = resolve; });
      await page.route(`**${endpoint}`, async route => {
        if (route.request().method() !== "POST") return route.continue();
        attempts++;
        if (attempts === 1) {
          await gate;
          return route.fulfill({ status: 503, json: { message: "Synthetic save failure" } });
        }
        return route.continue();
      });
      const failed = page.waitForResponse(r =>
        r.url().endsWith(endpoint) && r.request().method() === "POST" && r.status() === 503);
      try {
        await press(page, "button-submit-wizard");
        await expect.poll(() => attempts).toBe(1);
        await expect(page.getByTestId("button-submit-wizard")).toBeDisabled();
        await expect(page.locator("form[aria-busy=true]")).toHaveCount(1);
      } finally {
        release();
        await failed;
      }
      await expect(page.getByTestId("thought-save-error"))
        .toHaveText("Failed to record thought. Please try again.");
      await expect(page.getByTestId("step-review-thought"))
        .toContainText("Synthetic thought for save-action verification.");
      await expect(page.getByTestId("step-review-thought"))
        .toContainText("Synthetic situation that must remain available on a failed save.");
      await expect(page.getByTestId("button-submit-wizard")).toBeEnabled();
      if (phone) await page.screenshot({
        path: test.info().outputPath("thought-save-error-phone.png"), animations: "disabled",
      });
      const saved = page.waitForResponse(r =>
        r.url().endsWith(endpoint) && r.request().method() === "POST" && r.status() === 201);
      await press(page, "button-submit-wizard");
      const record = await (await saved).json();
      expect(attempts).toBe(2);
      await expect(page.getByTestId("dialog-thought-success")).toBeVisible();
      await expect(page.getByTestId("thought-save-error")).toHaveCount(0);
      const records = await (await page.request.get(endpoint)).json();
      expect(records).toEqual(expect.arrayContaining([expect.objectContaining({
        id: record.id, automaticThoughts: "Synthetic thought for save-action verification.",
      })]));
    });

    test("a confirmed save remains successful when the background History read fails", async ({ page }) => {
      const endpoint = `/api/users/${userId}/thoughts`;
      await page.route(`**${endpoint}`, route => route.request().method() === "GET"
        ? route.fulfill({ status: 503, json: { message: "Synthetic read failure after save" } })
        : route.continue());
      const saved = page.waitForResponse(r =>
        r.url().endsWith(endpoint) && r.request().method() === "POST" && r.status() === 201);
      await press(page, "button-submit-wizard");
      const record = await (await saved).json();
      await expect(page.getByTestId("dialog-thought-success")).toBeVisible({ timeout: 3000 });
      await expect(page.getByTestId("button-challenge-thought")).toBeEnabled();
      await expect(page.getByTestId("thought-read-status")).toContainText("Cached data — refresh failed", { timeout: 20000 });
      await expect(page.getByTestId("dialog-thought-success")).toBeVisible();
      await expect(page.getByTestId("thought-save-error")).toHaveCount(0);
      const records = await (await page.request.get(endpoint)).json();
      expect(records.some((item: { id: number }) => item.id === record.id)).toBe(true);
      await press(page, "button-challenge-thought");
      await expect(page.getByTestId("button-start-challenge")).toBeVisible();
    });
  });
}
