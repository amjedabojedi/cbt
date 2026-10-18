// Temporary read-only audit; removed after collecting the report.
import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const scenarios = [
  { role: "client", user: "client", routes: ["/dashboard", "/emotions", "/thoughts", "/reframe-coach", "/journal", "/goals", "/library", "/reports", "/settings", "/export"] },
  { role: "therapist", user: "assigned", routes: ["/dashboard", "/clients", "/library", "/settings", "/invitation-links"] },
  { role: "therapist-selected", user: "assigned", routes: ["/dashboard", "/emotions", "/thoughts", "/reframe-coach", "/journal", "/goals", "/reports"] },
  { role: "admin", user: "admin", routes: ["/admin", "/admin/users", "/admin/engagement-settings", "/admin/logs", "/admin/notifications", "/subscriptions", "/emotion-mapping", "/library", "/settings", "/admin/reframe-analytics"] },
];

for (const phone of [false, true]) {
  for (const scenario of scenarios.filter(scenario => ["therapist", "admin"].includes(scenario.role))) {
    test.describe(`${scenario.role} ${phone ? "phone" : "desktop"} audit`, () => {
      test.use({
        viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 900 },
        isMobile: phone, hasTouch: phone,
      });
      test("login, destinations, layout, labels and read-only tab states", async ({ page }, info) => {
        test.setTimeout(180_000);
        page.setDefaultTimeout(8000);
        const observations: any[] = [];
        const errors: string[] = [];
        let apiFailures: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("response", response => {
          const url = new URL(response.url());
          if (url.pathname.startsWith("/api/") && response.status() >= 400)
            apiFailures.push(`${response.status()} ${url.pathname}`);
        });
        await page.route("**/*", route =>
          new URL(route.request().url()).origin === process.env.E2E_BASE_URL
            ? route.continue() : route.abort("blockedbyclient"));
        const inspect = async (requestedPath: string, state: string, settled: boolean) => {
          const hasMain = await page.locator("main").count() > 0;
          const hasAppNavigation = await page.locator("aside").first().isVisible() ||
            await page.getByRole("button", { name: "Open navigation menu", exact: true }).first().isVisible();
          const scope = page.locator(hasMain ? "main" : "body");
          const unnamedAccessibleButtons = await scope.getByRole("button", { name: "", exact: true })
            .evaluateAll(buttons => buttons.map(button => button.outerHTML.slice(0, 700)));
          const visible = await scope.evaluate(main => {
            const shown = (element: Element) => {
              const box = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none";
            };
            const buttons = [...main.querySelectorAll("button")].filter(shown);
            const name = (element: Element) =>
              element.getAttribute("aria-label") || element.getAttribute("title") || (element as HTMLElement).innerText?.trim();
            return {
              viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
              mainRight: Math.round(main.getBoundingClientRect().right),
              headings: [...main.querySelectorAll("h1,h2,h3")].filter(shown).map(e => e.textContent?.trim()),
              text: (main as HTMLElement).innerText.slice(0, 12000),
              unnamedButtons: buttons.filter(e => !name(e)).map(e => ({
                html: e.outerHTML.slice(0, 700), width: Math.round(e.getBoundingClientRect().width),
                height: Math.round(e.getBoundingClientRect().height),
              })),
              smallButtons: buttons.filter(e => {
                const box = e.getBoundingClientRect();
                return box.width < 24 || box.height < 24;
              }).map(e => ({ name: name(e), height: e.getBoundingClientRect().height })),
              links: [...main.querySelectorAll("a")].filter(shown)
                .map(e => ({ text: e.textContent?.trim(), href: e.getAttribute("href") })),
              tabs: [...main.querySelectorAll('[role="tab"]')].filter(shown).map(e => e.textContent?.trim()),
            };
          });
          observations.push({ requestedPath, url: new URL(page.url()).pathname, state, settled, hasMain,
            hasAppNavigation, unnamedAccessibleButtons,
            ...visible, errors: [...errors], apiFailures: [...new Set(apiFailures)] });
        };
        try {
          await page.goto("/login");
          await page.getByLabel("Username or Email", { exact: true }).fill(`e2e-${scenario.user}`);
          await page.getByLabel("Password", { exact: true }).fill("Synthetic-test-password-42");
          await page.locator("form button[type=submit]").click();
          await expect(page).not.toHaveURL(/\/login$/);
          if (scenario.role === "therapist-selected") {
            await page.goto("/clients");
            await page.getByRole("button", { name: "Thoughts", exact: true }).click();
            await expect(page).toHaveURL(/\/thoughts$/);
          }
          for (const route of scenario.routes) {
            apiFailures = [];
            if (scenario.role === "therapist-selected") {
              if (phone) {
                await page.getByRole("button", { name: "Open navigation menu", exact: true }).tap();
                await page.getByRole("dialog", { name: "Navigation Menu" }).locator(`nav a[href="${route}"]`).tap();
              } else await page.locator(`aside nav a[href="${route}"]`).click();
              await expect(page).toHaveURL(new RegExp(`${route}$`));
            } else await page.goto(route);
            await expect(page.locator("body")).toBeVisible();
            let settled = true;
            try { await page.waitForLoadState("networkidle", { timeout: 4000 }); }
            catch { settled = false; }
            await inspect(route, "initial", settled);
            const labels = await page.getByRole("tab").allTextContents();
            for (const label of labels) {
              const tab = page.getByRole("tab", { name: label.trim(), exact: true });
              if (await tab.count() !== 1 || await tab.getAttribute("aria-selected") === "true") continue;
              if (await tab.isDisabled()) continue;
              await tab.click();
              let settled = true;
              try { await page.waitForLoadState("networkidle", { timeout: 4000 }); }
              catch { settled = false; }
              await inspect(route, label.trim(), settled);
            }
            if (route === scenario.routes[0] || route === "/reports" || route === "/subscriptions" ||
                route === "/invitation-links" || route === "/admin/reframe-analytics")
              await page.screenshot({ path: info.outputPath(`${route.replaceAll("/", "-")}.png`), animations: "disabled" });
          }
        } finally {
          await mkdir(info.outputDir, { recursive: true });
          await writeFile(path.join(info.outputDir, "audit.json"), JSON.stringify({
            role: scenario.role, phone, observations,
          }, null, 2));
        }
      });
    });
  }
}
