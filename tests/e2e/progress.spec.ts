import { test, expect, type APIRequestContext } from "@playwright/test";

let userId: number;
async function login(request: APIRequestContext) {
  const result = await request.post("/api/auth/login", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { username: "e2e-client", password: "Synthetic-test-password-42" },
  });
  expect(result.status()).toBe(200);
}

test.beforeAll(async ({ request }) => {
  const ids = await (await request.get("/__e2e/ready")).json();
  userId = ids.client;
});

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => new URL(route.request().url()).origin === process.env.E2E_BASE_URL
    ? route.continue() : route.abort("blockedbyclient"));
});

test("paired belief ratings persist exactly; invalid pairs cannot overwrite saved ratings", async ({ request, page }) => {
  await login(request);
  const base = `/api/users/${userId}/thoughts`;
  const created = await request.post(base, {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { automaticThoughts: "Synthetic paired belief test", cognitiveDistortions: [] },
  });
  expect(created.status()).toBe(201);
  const record = await created.json();
  const saved = await request.patch(`${base}/${record.id}`, {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { beliefInOriginal: 0, beliefInAlternative: 95, alternativePerspective: "Synthetic balanced thought" },
  });
  expect(saved.status()).toBe(200);
  expect(await saved.json()).toMatchObject({ beliefInOriginal: 0, beliefInAlternative: 95 });
  for (const data of [
    { beliefInOriginal: 50 },
    { beliefInOriginal: 20, beliefInAlternative: 101 },
    { beliefInOriginal: 20.5, beliefInAlternative: 70 },
  ]) {
    const rejected = await request.patch(`${base}/${record.id}`, {
      headers: { Origin: process.env.E2E_BASE_URL! }, data,
    });
    expect(rejected.status()).toBe(400);
  }
  const persisted = await (await request.get(base)).json();
  expect(persisted.find((t: { id: number }) => t.id === record.id))
    .toMatchObject({ beliefInOriginal: 0, beliefInAlternative: 95 });

  await login(page.request);
  await page.goto("/thoughts");
  await page.getByRole("tab", { name: /Insights/ }).click();
  await expect(page.getByRole("heading", { name: "Recorded belief ratings" })).toBeVisible();
  await expect(page.getByText("Older records without both ratings are excluded.", { exact: false })).toBeVisible();
  await expect(page.getByText("Before Challenge", { exact: true })).toHaveCount(0);
});

test("a missing comparison period is labelled unavailable instead of a decrease", async ({ page }) => {
  await login(page.request);
  // Controlled synthetic read fixture: no existing records or database writes.
  await page.route(`**/api/users/${userId}/emotions`, route => route.fulfill({
    json: [{ id: 999999, userId, coreEmotion: "Fear", intensity: 7,
      situation: "Synthetic old feeling",
      timestamp: new Date(Date.now() - 40 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString() }],
  }));
  await page.goto("/reports");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "All Time", exact: true }).click();
  const emotionCard = page.getByTestId("metric-emotional-balance");
  await expect(emotionCard.getByText("Comparison unavailable")).toHaveCount(2);
  await expect(emotionCard).not.toContainText("100%");
  await expect(emotionCard).toContainText("last 30 days with the previous 30 days");
  await expect(page.getByText("Your recorded feeling intensity has changed.", { exact: false })).toHaveCount(0);
});
