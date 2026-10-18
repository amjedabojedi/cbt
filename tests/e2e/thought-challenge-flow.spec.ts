import { test, expect, type APIRequestContext } from "@playwright/test";

let userId: number;
const headers = () => ({ Origin: process.env.E2E_BASE_URL! });
const evidenceFor = "Synthetic evidence: I found one fictional task difficult.";
const evidenceAgainst = "Synthetic evidence: I completed other fictional tasks successfully.";
const alternative = "Synthetic alternative: one difficult task does not define my ability.";

async function login(request: APIRequestContext) {
  const response = await request.post("/api/auth/login", {
    headers: headers(),
    data: { username: "e2e-client", password: "Synthetic-test-password-42" },
  });
  expect(response.status()).toBe(200);
}

test.beforeAll(async ({ request }) => {
  userId = (await (await request.get("/__e2e/ready")).json()).client;
});

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === process.env.E2E_BASE_URL
      ? route.continue() : route.abort("blockedbyclient"));
  await login(page.request);
});

test("new thought → challenge → failed save/retry → refresh → history and insights", async ({ page }) => {
  await page.goto("/thoughts");
  const next = () => page.getByTestId("button-next-step").click();
  await next();
  await page.getByTestId("textarea-thought").fill("Synthetic complete challenge journey thought");
  await next();
  await next();
  await page.getByRole("checkbox").first().click();
  await next();
  await page.getByTestId("textarea-situation").fill("Synthetic challenge journey situation.");
  await next();
  await next();
  const createdResponse = page.waitForResponse(r =>
    r.url().endsWith(`/api/users/${userId}/thoughts`) &&
    r.request().method() === "POST" && r.status() === 201);
  await page.getByTestId("button-submit-wizard").click();
  const created = await (await createdResponse).json();
  await page.getByTestId("button-challenge-thought").click();
  await page.getByTestId("button-start-challenge").click();

  await next();
  await expect(page.getByTestId("step-evidence")).toBeVisible();
  await expect(page.getByText("Please provide at least 10 characters")).toHaveCount(2);
  await page.getByTestId("textarea-evidence-for").fill(evidenceFor);
  await page.getByTestId("textarea-evidence-against").fill(evidenceAgainst);
  await next();
  await page.getByTestId("textarea-alternative").fill(alternative);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByTestId("textarea-evidence-for")).toHaveValue(evidenceFor);
  await expect(page.getByTestId("textarea-evidence-against")).toHaveValue(evidenceAgainst);
  await next();
  await expect(page.getByTestId("textarea-alternative")).toHaveValue(alternative);
  await next();
  const original = page.getByTestId("slider-belief-original").getByRole("slider");
  const balanced = page.getByTestId("slider-belief-alternative").getByRole("slider");
  await original.press("Home");
  for (let i = 0; i < 6; i++) await original.press("ArrowRight");
  await balanced.press("End");
  for (let i = 0; i < 4; i++) await balanced.press("ArrowLeft");
  await expect(original).toHaveAttribute("aria-valuenow", "30");
  await expect(balanced).toHaveAttribute("aria-valuenow", "80");

  const endpoint = `/api/users/${userId}/thoughts/${created.id}`;
  let attempts = 0;
  let firstPayload: unknown;
  await page.route(`**${endpoint}`, async route => {
    if (route.request().method() !== "PATCH") return route.continue();
    attempts++;
    if (attempts === 1) {
      firstPayload = route.request().postDataJSON();
      return route.fulfill({ status: 503, json: { message: "Synthetic challenge save failure" } });
    }
    expect(route.request().postDataJSON()).toEqual(firstPayload);
    return route.continue();
  });
  const failed = page.waitForResponse(r => r.url().endsWith(endpoint) && r.status() === 503);
  await page.getByTestId("button-save-challenge").click();
  await failed;
  await expect(page.getByTestId("step-beliefs")).toBeVisible();
  await expect(original).toHaveAttribute("aria-valuenow", "30");
  await expect(balanced).toHaveAttribute("aria-valuenow", "80");
  const afterFailure = await (await page.request.get(`/api/users/${userId}/thoughts`)).json();
  expect(afterFailure.find((t: { id: number }) => t.id === created.id))
    .toMatchObject({ evidenceFor: null, beliefInOriginal: null, beliefInAlternative: null });

  const savedResponse = page.waitForResponse(r =>
    r.url().endsWith(endpoint) && r.request().method() === "PATCH" && r.status() === 200);
  await page.getByTestId("button-save-challenge").click();
  expect(await (await savedResponse).json()).toMatchObject({
    evidenceFor, evidenceAgainst, alternativePerspective: alternative,
    beliefInOriginal: 30, beliefInAlternative: 80,
  });
  expect(attempts).toBe(2);
  await expect(page.getByText("Beliefs Recorded", { exact: true })).toBeVisible();
  await page.getByTestId("button-close-success").click();
  await page.reload();
  await page.getByRole("tab", { name: "My History", exact: true }).click();
  const card = page.getByTestId(`card-thought-${created.id}`);
  await expect(card).toContainText("Challenged");
  await card.getByRole("button", { name: "", exact: true }).click();
  await page.getByRole("menuitem", { name: "View Details", exact: true }).click();
  const detail = page.getByRole("dialog");
  await expect(detail).toContainText(evidenceFor);
  await expect(detail).toContainText(evidenceAgainst);
  await expect(detail).toContainText(alternative);
  // Let the action menu fully unmount before closing the dialog it opened.
  // This distinguishes a stuck modal lock from a premature test interaction.
  await expect(page.locator('[role="menu"]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(detail).toHaveCount(0);
  await expect.configure({ soft: true }).poll(() => page.locator("body").evaluate(body =>
    getComputedStyle(body).pointerEvents), {
    message: "Closing record details must restore pointer interaction",
    timeout: 3000,
  }).not.toBe("none");
  // Reload also verifies the persisted Insights independently of dialog cleanup.
  await page.reload();
  await page.getByRole("tab", { name: "Insights", exact: true }).click({ timeout: 5000 });
  const heading = page.getByRole("heading", { name: "Recorded belief ratings", exact: true });
  await expect(heading).toBeVisible();
  const chart = heading.locator("../../..");
  await expect(chart.locator(".recharts-bar-rectangle")).toHaveCount(2);
  await expect(chart).toContainText("Original thought");
  await expect(chart).toContainText("Alternative thought");
  const persisted = await (await page.request.get(`/api/users/${userId}/thoughts`)).json();
  expect(persisted.find((t: { id: number }) => t.id === created.id))
    .toMatchObject({ beliefInOriginal: 30, beliefInAlternative: 80 });
  const paired = persisted.filter((t: { beliefInOriginal: number | null; beliefInAlternative: number | null }) =>
    t.beliefInOriginal !== null && t.beliefInAlternative !== null);
  const average = (field: "beliefInOriginal" | "beliefInAlternative") =>
    Math.round(paired.reduce((sum: number, t: Record<typeof field, number>) => sum + t[field], 0) / paired.length);
  await chart.locator(".recharts-bar-rectangle").first().hover();
  await expect(chart.getByText(/Original thought:/)).toContainText(`${average("beliefInOriginal")}%`);
  await chart.locator(".recharts-bar-rectangle").nth(1).hover();
  await expect(chart.getByText(/Alternative thought:/)).toContainText(`${average("beliefInAlternative")}%`);
});

test("an existing thought can be challenged from History, saved and reopened after refresh", async ({ page }) => {
  const created = await page.request.post(`/api/users/${userId}/thoughts`, {
    headers: headers(),
    data: { automaticThoughts: "Synthetic history challenge entry", cognitiveDistortions: [] },
  });
  expect(created.status()).toBe(201);
  const record = await created.json();
  await page.goto("/thoughts");
  await page.getByRole("tab", { name: "My History", exact: true }).click();
  const card = page.getByTestId(`card-thought-${record.id}`);
  await card.getByRole("button", { name: "", exact: true }).click();
  await page.getByRole("menuitem", { name: "Challenge This Thought", exact: true }).click();
  await expect(page.getByTestId("button-start-challenge")).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[role="menu"]')).toHaveCount(0);
  // Cancelling does not change the thought, and the action can be opened again.
  await page.getByRole("button", { name: "Skip for now", exact: true }).click();
  await expect(page.getByTestId("button-start-challenge")).toHaveCount(0);
  const unchanged = await (await page.request.get(`/api/users/${userId}/thoughts`)).json();
  expect(unchanged.find((t: { id: number }) => t.id === record.id))
    .toMatchObject({ evidenceFor: null, beliefInOriginal: null, beliefInAlternative: null });
  await card.getByRole("button", { name: "", exact: true }).click();
  await page.getByRole("menuitem", { name: "Challenge This Thought", exact: true }).click();
  await page.getByTestId("button-start-challenge").click();
  await page.getByTestId("textarea-evidence-for").fill(evidenceFor);
  await page.getByTestId("textarea-evidence-against").fill(evidenceAgainst);
  await page.getByTestId("button-next-step").click();
  await page.getByTestId("textarea-alternative").fill(alternative);
  await page.getByTestId("button-next-step").click();
  await page.getByTestId("slider-belief-original").getByRole("slider").press("Home");
  await page.getByTestId("slider-belief-alternative").getByRole("slider").press("End");
  const saved = page.waitForResponse(r =>
    r.url().endsWith(`/api/users/${userId}/thoughts/${record.id}`) &&
    r.request().method() === "PATCH" && r.status() === 200);
  await page.getByTestId("button-save-challenge").click();
  expect(await (await saved).json()).toMatchObject({
    id: record.id, evidenceFor, evidenceAgainst, alternativePerspective: alternative,
    beliefInOriginal: 0, beliefInAlternative: 100,
  });
  await page.getByTestId("button-close-success").click();
  await expect(page.getByTestId("button-close-success")).toHaveCount(0);
  await expect(card).toContainText("Challenged");
  await page.reload();
  await page.getByRole("tab", { name: "My History", exact: true }).click();
  await expect(card).toContainText("Challenged");
  await card.getByRole("button", { name: "", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Challenge This Thought", exact: true })).toHaveCount(0);
  await page.getByRole("menuitem", { name: "View Details", exact: true }).click();
  const detail = page.getByRole("dialog");
  await expect(detail).toContainText(evidenceFor);
  await expect(detail).toContainText(evidenceAgainst);
  await expect(detail).toContainText(alternative);
  const persisted = await (await page.request.get(`/api/users/${userId}/thoughts`)).json();
  expect(persisted.find((t: { id: number }) => t.id === record.id))
    .toMatchObject({ beliefInOriginal: 0, beliefInAlternative: 100 });
});
