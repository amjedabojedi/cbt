import { test, expect, type Page } from "@playwright/test";

let userId: number;
test.beforeAll(async ({ request }) => {
  userId = (await (await request.get("/__e2e/ready")).json()).client;
});

async function login(page: Page, username = "e2e-client") {
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === process.env.E2E_BASE_URL
      ? route.continue() : route.abort("blockedbyclient"));
  const response = await page.request.post("/api/auth/login", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { username, password: "Synthetic-test-password-42" },
  });
  expect(response.status()).toBe(200);
}

for (const width of [320, 390]) {
  for (const language of ["ar", "en"] as const) {
    test.describe(`Progress ${language} at ${width}px`, { tag: "@phone" }, () => {
      test.use({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });

      test("explanations, milestones and dates stay localized and within phone bounds", async ({ page }) => {
        await login(page);
        await page.addInitScript(lang => localStorage.setItem("resiliencehub_lang", lang), language);
        let populated = false;
        const now = new Date().toISOString();
        const thoughts = Array.from({ length: 3 }, (_, index) => ({
          id: 980000 + index, userId, automaticThoughts: "Synthetic localization thought",
          cognitiveDistortions: [], emotionRecordId: null, createdAt: now,
          evidenceFor: index === 0 ? "Synthetic evidence" : null,
        }));
        for (const module of ["emotions", "thoughts", "journal", "goals", "reframe-coach/results"]) {
          await page.route(`**/api/users/${userId}/${module}`, route =>
            route.fulfill({ json: populated && module === "thoughts" ? thoughts : [] }));
        }
        await page.goto("/reports");
        await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
        const activity = page.getByTestId("metric-activity-level");
        await expect(activity).toContainText(language === "ar" ? "٠ / ٣" : "0 / 3");
        await expect(page.getByTestId("activity-timeline")).toContainText(
          language === "ar" ? "لم تُسجَّل أنشطة بعد" : "No activities logged yet");

        populated = true;
        await page.reload();
        await expect(activity).toContainText(language === "ar" ? "٣ / ١٠" : "3 / 10");
        await expect(page.getByTestId("timeline-item-thought")).toHaveCount(3);
        await expect(page.getByTestId("metric-thought-challenge")).toContainText(
          language === "ar" ? "١ / ٣" : "1 / 3");
        await expect(page.getByText(language === "ar"
          ? "عرض مبسط للأدوات التي استخدمتها والأنشطة التي سجلتها."
          : "A simple view of the tools and activities you have recorded.", { exact: true })).toBeVisible();
        await expect(activity).toContainText(language === "ar"
          ? "المشاعر والأفكار وتدوينات اليوميات والأهداف وجلسات إعادة الصياغة المحفوظة خلال الفترة المحددة. يُحتسب كل منها مرة واحدة."
          : "Saved emotions, thoughts, journal entries, goals and reframe sessions in the selected period. Each counts once.");
        await expect(activity).toContainText(language === "ar"
          ? "محطات الممارسة: ٣، ١٠، ٢٥، ٥٠، ثم كل ٥٠ نشاطًا. هي للتشجيع فقط، وليست أهدافًا علاجية أو مقياسًا للتعافي."
          : "Practice milestones: 3, 10, 25, 50, then every 50 activities. These are encouragement, not treatment targets or a measure of recovery.");
        await expect(page.getByText(language === "ar"
          ? "محطات الممارسة (٣، ١٠، ٢٥، ٥٠، ثم كل ٥٠ نشاطًا) للتشجيع فقط، وليست أهدافًا علاجية أو مقياسًا للتعافي."
          : "Practice milestones (3, 10, 25, 50, then every 50 activities) are encouragement, not treatment targets or a measure of recovery.",
          { exact: true })).toBeVisible();
        await expect(page.getByTestId("progress-indicators")).toContainText(language === "ar"
          ? "ملخص لأنشطتك المسجلة، وليس تقييمًا سريريًا."
          : "A summary of your recorded activities, not a clinical assessment.");
        await page.getByRole("combobox").click();
        await page.getByRole("option", { name: language === "ar" ? "كل الوقت" : "All Time", exact: true }).click();
        await expect(page.getByTestId("metric-emotional-balance")).toContainText(language === "ar"
          ? "تُقارن شدة المشاعر خلال آخر ٣٠ يومًا بشدتها خلال الأيام الـ٣٠ السابقة."
          : "Intensity compares the last 30 days with the previous 30 days.");
        if (language === "ar") {
          // No unlocalized digits or English explanations in the report cards.
          for (const id of ["metric-activity-level", "metric-emotional-balance", "metric-thought-challenge",
            "metric-goal-progress", "progress-indicators", "cbt-triangle-connections", "activity-timeline"]) {
            await expect(page.getByTestId(id)).not.toContainText(/[A-Za-z0-9]/);
          }
        }
        const bounds = await page.locator(
          '[data-testid^="metric-"] p, [data-testid="progress-indicators"] p, [data-testid^="timeline-item-"] > div:last-child'
        ).evaluateAll(elements => elements.map(element => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, clipped: element.scrollWidth > element.clientWidth + 1 };
        }));
        for (const bound of bounds) {
          expect(bound.left).toBeGreaterThanOrEqual(0);
          expect(bound.right).toBeLessThanOrEqual(width);
          expect(bound.clipped).toBe(false);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        await page.screenshot({ path: test.info().outputPath(`progress-${language}-${width}.png`), fullPage: true });
      });
    });
  }
}
