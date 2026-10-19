import { test, expect, type Page, type Locator } from "@playwright/test";

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

async function expectHorizontalBounds(elements: Locator, width: number) {
  for (const element of await elements.all()) {
    const box = await element.boundingBox();
    expect(box, "Essential content must have a rendered box").not.toBeNull();
    expect(box!.x, await element.innerText()).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width, await element.innerText()).toBeLessThanOrEqual(width + 1);
    // Check the text itself, not just its possibly clipped parent.
    expect(await element.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  }
}

async function expectBottomLinks(page: Page, hrefs: string[], width: number) {
  const nav = page.getByRole("navigation", { name: "Bottom shortcuts" });
  await expect(nav).toBeVisible();
  expect(await nav.locator("a").evaluateAll(links => links.map(link => link.getAttribute("href"))))
    .toEqual(hrefs);
  await expectHorizontalBounds(nav.locator("a, a span"), width);
  const box = await nav.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
}

const shortcutLabels = {
  en: {
    "/dashboard": "Home", "/emotions": "Emotions", "/thoughts": "Thoughts",
    "/journal": "Journal", "/reports": "Reports", "/admin": "Admin",
    "/admin/users": "Users", "/admin/logs": "Logs", "/admin/notifications": "Notifications",
    "/library": "Library", "/clients": "My Clients",
  },
  ar: {
    "/dashboard": "المنزل", "/emotions": "المشاعر", "/thoughts": "الأفكار",
    "/journal": "اليوميات", "/reports": "التقارير", "/admin": "الإدارة",
    "/admin/users": "المستخدمون", "/admin/logs": "السجلات", "/admin/notifications": "الإشعارات",
    "/library": "المكتبة", "/clients": "عملائي",
  },
};

for (const width of [320, 390]) {
  for (const language of ["en", "ar"] as const) {
    test.describe(`localized shortcuts ${language} at ${width}px`, { tag: "@phone" }, () => {
      test.use({ viewport: { width, height: 568 }, isMobile: true, hasTouch: true });
      for (const role of ["client", "admin", "assigned"] as const) {
        test(`${role} labels, full menu and real shortcut taps`, async ({ page }) => {
          await login(page, role);
          await page.addInitScript(lang => localStorage.setItem("resiliencehub_lang", lang), language);
          await page.goto(role === "admin" ? "/admin" : role === "assigned" ? "/clients" : "/dashboard");
          await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
          const nav = page.getByRole("navigation", {
            name: language === "ar" ? "اختصارات التنقل" : "Bottom shortcuts", exact: true,
          });

          const checkAndTap = async (hrefs: string[], labels: Record<string, string>, taps = hrefs) => {
            await expect(nav).toBeVisible();
            expect(await nav.locator("a").evaluateAll(links =>
              links.map(link => link.getAttribute("href")))).toEqual(hrefs);
            await expect(nav.locator("a span")).toHaveText(hrefs.map(href => labels[href]));
            await expectHorizontalBounds(nav.locator("a, a span"), width);
            // Check glyph rectangles against their own tap target, not merely the viewport.
            expect(await nav.locator("a").evaluateAll(links => links.every(link => {
              const span = link.querySelector("span")!;
              const range = document.createRange();
              range.selectNodeContents(span);
              const bounds = link.getBoundingClientRect();
              return Array.from(range.getClientRects()).every(rect =>
                rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 &&
                rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1);
            }))).toBe(true);
            const box = await nav.boundingBox();
            expect(box!.y).toBeGreaterThanOrEqual(0);
            expect(box!.y + box!.height).toBeLessThanOrEqual(569);
            const positions = await nav.locator("a").evaluateAll(links =>
              links.map(link => link.getBoundingClientRect().x));
            expect(positions[0] < positions[1]).toBe(language === "en");
            for (const href of taps) {
              const link = nav.getByRole("link", { name: labels[href], exact: true });
              await link.tap();
              await expect(page).toHaveURL(new RegExp(`${href}$`));
              await expect(link).toHaveAttribute("aria-current", "page");
              await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
            }
          };

          const checkFullMenu = async (hrefs: string[]) => {
            await page.getByRole("button", { name: "Open navigation menu", exact: true }).tap();
            const menu = page.getByRole("dialog", { name: "Navigation Menu", exact: true });
            await expect(menu).toBeVisible();
            expect(await menu.locator("nav a").evaluateAll(links =>
              links.map(link => link.getAttribute("href")))).toEqual(hrefs);
            await menu.getByRole("button", { name: "Close", exact: true }).tap();
          };

          if (role === "admin") {
            await checkAndTap(["/admin", "/admin/users", "/admin/logs", "/admin/notifications", "/library"],
              shortcutLabels[language]);
            await checkFullMenu(["/admin", "/admin/users", "/admin/engagement-settings", "/admin/logs",
              "/admin/notifications", "/subscriptions", "/emotion-mapping", "/library"]);
          } else if (role === "client") {
            await checkAndTap(["/dashboard", "/emotions", "/thoughts", "/journal", "/reports"],
              shortcutLabels[language]);
            await checkFullMenu(["/dashboard", "/emotions", "/thoughts", "/reframe-coach",
              "/journal", "/goals", "/library", "/reports"]);
          } else {
            const labels = { ...shortcutLabels[language],
              "/dashboard": language === "ar" ? "لوحة التحكم" : "Dashboard" };
            await checkAndTap(["/dashboard", "/clients", "/library"], labels);
            await checkFullMenu(["/dashboard", "/clients", "/library"]);
            await nav.getByRole("link", { name: labels["/clients"], exact: true }).tap();
            await page.getByRole("button", { name: shortcutLabels[language]["/thoughts"], exact: true }).tap();
            await expect(page).toHaveURL(/\/thoughts$/);
            await checkFullMenu(["/clients", "/dashboard", "/emotions", "/thoughts", "/reframe-coach",
              "/journal", "/goals", "/reports"]);
            const selectedLabels = { ...labels,
              "/dashboard": language === "ar" ? "نظرة عامة" : "Overview",
              "/reports": language === "ar" ? "التقدم" : "Progress" };
            // Exercise every selected-client module before the return shortcut clears context.
            await checkAndTap(["/clients", "/dashboard", "/emotions", "/thoughts", "/reports"],
              selectedLabels, ["/dashboard", "/emotions", "/thoughts", "/reports"]);
            expect(await page.evaluate(() => localStorage.getItem("viewingClientId"))).toBe(String(userId));
            const cleared = page.waitForResponse(r =>
              r.url().endsWith("/api/users/current-viewing-client") && r.request().method() === "POST");
            await nav.getByRole("link", { name: labels["/clients"], exact: true }).tap();
            const response = await cleared;
            expect(response.status()).toBe(200);
            expect(response.request().postDataJSON()).toEqual({ clientId: null });
            await expect(page).toHaveURL(/\/clients$/);
            expect(await page.evaluate(() => localStorage.getItem("viewingClientId"))).toBeNull();
            await checkAndTap(["/dashboard", "/clients", "/library"], labels);
          }
          await page.screenshot({
            path: test.info().outputPath(`shortcuts-${role}-${language}-${width}.png`), animations: "disabled",
          });
        });
      }
    });
  }
}

async function checkAdminTabs(page: Page, width: number, touch: boolean) {
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true })).toBeVisible();
  const strip = page.getByTestId("admin-tab-scroll");
  // The last tab reproduced the whole-main horizontal scroll in the audit.
  for (const name of ["Content Stats", "Therapist-Client", "User Stats", "Overview", "Content Stats"]) {
    const tab = page.getByRole("tab", { name, exact: true });
    await tab.scrollIntoViewIfNeeded();
    if (touch) await tab.tap();
    else await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    expect(await page.locator("main").evaluate(el => el.scrollLeft)).toBe(0);
    const heading = page.locator("main h1");
    await expectHorizontalBounds(heading, width);
    const panel = page.getByRole("tabpanel");
    await expect(panel).toBeVisible();
    // Card titles, counters, descriptions and relationship labels/values,
    // including cards below the fold, must stay readable after real tab taps.
    await expectHorizontalBounds(panel.locator("h3, p, span, .text-2xl"), width);
    expect(await page.locator("main").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    if (name === "Content Stats" && touch) {
      expect(await strip.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    }
  }
}

for (const width of [320, 390]) {
  test.describe(`phone navigation at ${width}px`, { tag: "@phone" }, () => {
    test.use({ viewport: { width, height: 568 }, isMobile: true, hasTouch: true });
    test("admin tabs scroll locally and bottom shortcuts match the role", async ({ page }) => {
      await login(page, "admin");
      await page.goto("/admin");
      await checkAdminTabs(page, width, true);
      await page.screenshot({ path: test.info().outputPath(`admin-content-${width}.png`), animations: "disabled" });
      await expectBottomLinks(page,
        ["/admin", "/admin/users", "/admin/logs", "/admin/notifications", "/library"], width);
      const nav = page.getByRole("navigation", { name: "Bottom shortcuts" });
      await expect(nav.getByRole("link", { name: "Admin", exact: true }))
        .toHaveAttribute("aria-current", "page");
      await nav.getByRole("link", { name: "Users", exact: true }).tap();
      await expect(page).toHaveURL(/\/admin\/users$/);
      await expect(nav.getByRole("link", { name: "Admin", exact: true }))
        .not.toHaveAttribute("aria-current", "page");
      await expect(nav.getByRole("link", { name: "Users", exact: true }))
        .toHaveAttribute("aria-current", "page");
    });

    test("bottom shortcuts preserve client navigation and therapist selection/return", async ({ page }) => {
      await login(page);
      await page.goto("/dashboard");
      await expectBottomLinks(page,
        ["/dashboard", "/emotions", "/thoughts", "/journal", "/reports"], width);
      const nav = page.getByRole("navigation", { name: "Bottom shortcuts" });
      for (const [label, path] of [["Emotions", "/emotions"], ["Thoughts", "/thoughts"],
        ["Journal", "/journal"], ["Reports", "/reports"], ["Home", "/dashboard"]]) {
        await nav.getByRole("link", { name: label, exact: true }).tap();
        await expect(page).toHaveURL(new RegExp(`${path}$`));
      }
      await nav.getByRole("link", { name: "Thoughts", exact: true }).tap();
      await page.getByTestId("button-next-step").tap();
      await page.getByTestId("textarea-thought").fill("Synthetic writing protected from bottom navigation.");
      page.once("dialog", dialog => dialog.dismiss());
      await nav.getByRole("link", { name: "Journal", exact: true }).tap();
      await expect(page).toHaveURL(/\/thoughts$/);
      await expect(page.getByTestId("textarea-thought"))
        .toHaveValue("Synthetic writing protected from bottom navigation.");
      page.once("dialog", dialog => dialog.accept());
      await nav.getByRole("link", { name: "Journal", exact: true }).tap();
      await expect(page).toHaveURL(/\/journal$/);
      await page.request.post("/api/auth/logout", { headers: { Origin: process.env.E2E_BASE_URL! } });
      await login(page, "assigned");
      await page.goto("/clients");
      await expectBottomLinks(page, ["/dashboard", "/clients", "/library"], width);
      await page.getByRole("button", { name: "Thoughts", exact: true }).tap();
      await expect(page).toHaveURL(/\/thoughts$/);
      await expectBottomLinks(page,
        ["/clients", "/dashboard", "/emotions", "/thoughts", "/reports"], width);
      await nav.getByRole("link", { name: "Emotions", exact: true }).tap();
      await expect(page).toHaveURL(/\/emotions$/);
      // Selection must survive module navigation, not just the initial directory action.
      expect(await page.evaluate(() => localStorage.getItem("viewingClientId"))).toBe(String(userId));
      const cleared = page.waitForResponse(r =>
        r.url().endsWith("/api/users/current-viewing-client") && r.request().method() === "POST");
      await nav.getByRole("link", { name: "My Clients", exact: true }).tap();
      expect((await cleared).status()).toBe(200);
      expect((await cleared).request().postDataJSON()).toEqual({ clientId: null });
      await expect(page).toHaveURL(/\/clients$/);
      expect(await page.evaluate(() => localStorage.getItem("viewingClientId"))).toBeNull();
      await expectBottomLinks(page, ["/dashboard", "/clients", "/library"], width);
      await nav.getByRole("link", { name: "Dashboard", exact: true }).tap();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expectBottomLinks(page, ["/dashboard", "/clients", "/library"], width);
    });

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

test("admin desktop tabs and navigation retain their layout", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page, "admin");
  await page.goto("/admin");
  await checkAdminTabs(page, 1280, false);
  await expect(page.locator("aside")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Bottom shortcuts" })).toBeHidden();
  expect(await page.getByTestId("admin-tab-scroll").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  const cards = page.getByRole("tabpanel").locator(".grid").first().locator(":scope > div");
  const boxes = await Promise.all((await cards.all()).map(card => card.boundingBox()));
  expect(boxes).toHaveLength(4);
  expect(new Set(boxes.map(box => box!.y)).size, "Desktop counters remain on one row").toBe(1);
});

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
