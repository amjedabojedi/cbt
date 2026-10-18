import { test, expect, type Page } from "@playwright/test";

let userId: number;
test.beforeAll(async ({ request }) => {
  userId = (await (await request.get("/__e2e/ready")).json()).client;
});

async function login(page: Page, role = "client") {
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === process.env.E2E_BASE_URL
      ? route.continue() : route.abort("blockedbyclient"));
  const response = await page.request.post("/api/auth/login", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { username: `e2e-${role}`, password: "Synthetic-test-password-42" },
  });
  expect(response.status()).toBe(200);
}

for (const width of [320, 390]) {
  test.describe(`phone navigation at ${width}px`, { tag: "@phone" }, () => {
    test.use({ viewport: { width, height: 568 }, isMobile: true, hasTouch: true });
    test("menu, page navigation and History challenge remain reachable by touch", async ({ page }) => {
      await login(page);
      const response = await page.request.post(`/api/users/${userId}/thoughts`, {
        headers: { Origin: process.env.E2E_BASE_URL! },
        data: { automaticThoughts: "Synthetic small-phone navigation thought", cognitiveDistortions: [] },
      });
      expect(response.status()).toBe(201);
      const record = await response.json();
      await page.goto("/thoughts");
      const main = await page.locator("main").boundingBox();
      expect.soft(main!.x + main!.width, "Main content must fit the phone").toBeLessThanOrEqual(width + 1);
      const menuButton = page.getByRole("button", { name: "Open navigation menu", exact: true });
      await expect(menuButton).toHaveCount(1);
      await expect(page.getByRole("button", { name: "Open menu", exact: true })).toHaveCount(0);
      await menuButton.tap({ timeout: 5000 });
      const menu = page.getByRole("dialog", { name: "Navigation Menu" });
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("button", { name: "Logout", exact: true }))
        .toBeInViewport({ ratio: 1 });
      await page.screenshot({ path: test.info().outputPath(`phone-menu-${width}.png`), animations: "disabled" });
      await menu.getByRole("link", { name: "My Progress", exact: true }).tap();
      await expect(page.getByTestId("metric-activity-level")).toBeVisible();
      await expect(page.getByRole("dialog", { name: "Navigation Menu" })).toHaveCount(0);
      await page.getByRole("button", { name: "Open navigation menu", exact: true }).tap({ timeout: 5000 });
      await page.getByRole("dialog", { name: "Navigation Menu" })
        .getByRole("link", { name: "Thought Records", exact: true }).tap();
      await page.getByRole("tab", { name: "My History", exact: true }).tap();
      await page.getByTestId(`card-thought-${record.id}`)
        .getByRole("button", { name: "", exact: true }).tap();
      await page.getByRole("menuitem", { name: "Challenge This Thought", exact: true }).tap();
      await expect(page.getByTestId("button-start-challenge")).toBeVisible({ timeout: 5000 });
      const dialog = page.getByRole("dialog");
      const box = await dialog.boundingBox();
      expect.soft(box!.x, "Dialog must not extend off the left edge").toBeGreaterThanOrEqual(-1);
      expect.soft(box!.x + box!.width, "Dialog must fit the phone width").toBeLessThanOrEqual(width + 1);
      expect.soft(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1),
        "Challenge content must not overflow horizontally").toBe(true);
      await page.screenshot({ path: test.info().outputPath(`phone-challenge-${width}.png`), animations: "disabled" });
      await page.getByTestId("button-start-challenge").tap({ timeout: 5000 });
      const input = page.getByTestId("textarea-evidence-for");
      await input.pressSequentially("Synthetic phone evidence that stays editable.");
      await expect(input).toHaveValue("Synthetic phone evidence that stays editable.");
      await expect(input).toBeFocused();
      // A reduced available height checks that actions remain scrollable.
      await page.setViewportSize({ width, height: 340 });
      await page.getByTestId("textarea-evidence-against").fill("Synthetic contradictory evidence for this thought.");
      await page.getByTestId("button-next-step").tap({ timeout: 5000 });
      await expect(page.getByTestId("textarea-alternative")).toBeVisible();
      const alternative = page.getByTestId("textarea-alternative");
      await alternative.pressSequentially("Synthetic small-screen balanced alternative.");
      await expect(alternative).toHaveValue("Synthetic small-screen balanced alternative.");
      await expect(alternative).toBeFocused();
      await page.getByTestId("button-next-step").tap({ timeout: 5000 });
      await expect(page.getByTestId("step-beliefs")).toBeVisible();
      // A real tap (without force) checks scrolling, clipping and hit targeting.
      const saved = page.waitForResponse(r =>
        r.url().endsWith(`/api/users/${userId}/thoughts/${record.id}`) &&
        r.request().method() === "PATCH" && r.status() === 200);
      await page.getByTestId("button-save-challenge").tap({ timeout: 5000 });
      await saved;
      await page.getByTestId("button-close-success").tap({ timeout: 5000 });
      await page.getByRole("button", { name: "Open navigation menu", exact: true }).tap();
      await expect(menu.getByRole("button", { name: "Logout", exact: true }))
        .toBeInViewport({ ratio: 1 });
      await menu.getByRole("button", { name: "Close", exact: true }).tap();
      await expect(menu).toHaveCount(0);
    });
  });
}

test.describe("staff phone navigation", { tag: "@phone" }, () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("the admin phone menu retains the desktop administration destinations", async ({ page }) => {
    await login(page, "admin");
    await page.goto("/admin");
    const main = await page.locator("main").boundingBox();
    expect.soft(main!.x + main!.width, "Admin content must not widen the phone viewport").toBeLessThanOrEqual(391);
    await page.getByRole("button", { name: "Open navigation menu", exact: true }).tap({ timeout: 5000 });
    const menu = page.getByRole("dialog", { name: "Navigation Menu" });
    await expect(menu.getByRole("link", { name: "User Management", exact: true })).toBeVisible({ timeout: 5000 });
    await expect(menu.getByRole("link", { name: "Admin Dashboard", exact: true })).toBeVisible();
    const mobileHrefs = await menu.locator("nav a").evaluateAll(links =>
      links.map(link => link.getAttribute("href")));
    await page.screenshot({ path: test.info().outputPath("phone-admin-menu.png"), animations: "disabled" });
    await expect.soft(menu.getByRole("button", { name: "Logout", exact: true }),
      "The phone menu footer must remain on-screen").toBeInViewport({ ratio: 1, timeout: 5000 });
    const menuBox = await menu.boundingBox();
    expect.soft(menuBox!.y + menuBox!.height, "The drawer must fit the visible phone height")
      .toBeLessThanOrEqual(845);
    const logoutBox = await menu.getByRole("button", { name: "Logout", exact: true }).boundingBox();
    expect.soft(logoutBox!.y + logoutBox!.height, "Logout must not sit below the visible screen")
      .toBeLessThanOrEqual(845);
    await menu.getByRole("link", { name: "User Management", exact: true }).tap();
    await expect(page).toHaveURL(/\/admin\/users$/);
    await page.getByRole("button", { name: "Open navigation menu", exact: true }).tap({ timeout: 5000 });
    await page.getByRole("dialog", { name: "Navigation Menu" })
      .getByRole("button", { name: "Close", exact: true }).tap();
    await expect(page.getByRole("dialog", { name: "Navigation Menu" })).toHaveCount(0);
    await page.setViewportSize({ width: 1280, height: 844 });
    await expect(page.locator("aside")).toBeVisible();
    expect(await page.locator("aside nav a").evaluateAll(links =>
      links.map(link => link.getAttribute("href")))).toEqual(mobileHrefs);
  });

  test("the therapist phone menu respects client selection and clears it on return", async ({ page }) => {
    await login(page, "assigned");
    // Selection is deliberately cleared on a full load. Enter through the
    // actual directory action so the in-memory client context is established.
    await page.goto("/clients");
    await page.getByRole("button", { name: "Thoughts", exact: true }).tap();
    await expect(page).toHaveURL(/\/thoughts$/);
    await page.getByRole("button", { name: "Open navigation menu", exact: true }).tap();
    const menu = page.getByRole("dialog", { name: "Navigation Menu" });
    await expect(menu.getByRole("link", { name: "Thought Records", exact: true })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Progress", exact: true })).toBeVisible();
    const cleared = page.waitForResponse(r =>
      r.url().endsWith("/api/users/current-viewing-client") && r.request().method() === "POST");
    await menu.getByRole("link", { name: "← My Clients", exact: true }).tap();
    expect((await cleared).status()).toBe(200);
    await expect(page).toHaveURL(/\/clients$/);
    await page.getByRole("button", { name: "Open navigation menu", exact: true }).tap();
    await expect(menu.getByRole("link", { name: "Therapist Dashboard", exact: true })).toBeVisible();
    await expect(menu.getByRole("link", { name: "My Clients", exact: true })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Thought Records", exact: true })).toHaveCount(0);
  });
});
