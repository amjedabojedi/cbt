import { test, expect } from "@playwright/test";

for (const gesture of ["mouse", "keyboard", "touch"] as const) {
  const phone = gesture === "touch";
  test.describe(phone ? "History challenge phone handoff @phone" : `History challenge ${gesture} handoff`, () => {
    test.use({
      viewport: phone ? { width: 390, height: 844 } : { width: 1366, height: 768 },
      isMobile: phone,
      hasTouch: phone,
    });

    test("the menu fully releases the page before the challenge opens and accepts typing", async ({ page }) => {
      await page.route("**/*", route =>
        new URL(route.request().url()).origin === process.env.E2E_BASE_URL
          ? route.continue() : route.abort("blockedbyclient"));
      const login = await page.request.post("/api/auth/login", {
        headers: { Origin: process.env.E2E_BASE_URL! },
        data: { username: "e2e-client", password: "Synthetic-test-password-42" },
      });
      expect(login.status()).toBe(200);
      const userId = (await (await page.request.get("/__e2e/ready")).json()).client;
      const created = await page.request.post(`/api/users/${userId}/thoughts`, {
        headers: { Origin: process.env.E2E_BASE_URL! },
        data: {
          automaticThoughts: "Synthetic thought for the History popup handoff.",
          cognitiveDistortions: ["all_or_nothing"],
        },
      });
      expect(created.status()).toBe(201);
      const record = await created.json();
      await page.goto("/thoughts");
      await page.getByRole("tab", { name: "My History", exact: true }).click();
      const menuButton = page.getByTestId(`card-thought-${record.id}`)
        .getByRole("button", { name: "", exact: true });
      if (gesture === "keyboard") {
        await menuButton.focus();
        await menuButton.press("Enter");
      } else if (phone) await menuButton.tap();
      else await menuButton.click();
      await expect(page.getByRole("menu")).toBeVisible();
      await page.evaluate(() => {
        const observations: Array<{ remainingMenus: number }> = [];
        (window as any).__historyHandoff = observations;
        const observer = new MutationObserver(() => {
          if (document.querySelector('[role="dialog"] [data-testid="button-start-challenge"]')) {
            observations.push({ remainingMenus: document.querySelectorAll('[role="menu"]').length });
          }
        });
        observer.observe(document.body, { subtree: true, childList: true });
        (window as any).__historyHandoffObserver = observer;
      });
      const challenge = page.getByRole("menuitem", { name: "Challenge This Thought", exact: true });
      const box = await challenge.boundingBox();
      expect(box).not.toBeNull();
      // Use the actual pointer instead of locator.click's stability/actionability waits.
      if (gesture === "keyboard") {
        await page.keyboard.press("ArrowDown");
        await expect(challenge).toBeFocused();
        await page.keyboard.press("Enter");
      } else if (phone) await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
      else await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2, { delay: 120 });
      await expect(page.getByTestId("button-start-challenge")).toBeVisible();
      const observations = await page.evaluate(() => {
        (window as any).__historyHandoffObserver.disconnect();
        return (window as any).__historyHandoff as Array<{ remainingMenus: number }>;
      });
      expect(observations.length).toBeGreaterThan(0);
      expect(observations.every(observation => observation.remainingMenus === 0),
        "Do not mount a second modal while the action menu still owns its focus/pointer layer").toBe(true);
      await expect(page.getByRole("menu")).toHaveCount(0);
      await page.getByTestId("button-start-challenge").click();
      const text = "Synthetic evidence entered without losing keyboard focus.";
      await page.getByTestId("textarea-evidence-for").pressSequentially(text);
      await expect(page.getByTestId("textarea-evidence-for")).toHaveValue(text);
      await expect(page.getByTestId("textarea-evidence-for")).toBeFocused();
      await page.screenshot({ path: test.info().outputPath("history-challenge-open.png"), animations: "disabled" });
      page.once("dialog", dialog => dialog.accept());
      await page.getByRole("button", { name: "Cancel thought challenge", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.locator("body")).toHaveCSS("pointer-events", "auto");
      await menuButton.click();
      await page.getByRole("menuitem", { name: "Challenge This Thought", exact: true }).click();
      await page.getByTestId("button-start-challenge").click();
      await expect(page.getByTestId("textarea-evidence-for")).toHaveValue("");
    });
  });
}
