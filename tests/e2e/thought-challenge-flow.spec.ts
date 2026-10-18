import { test, expect, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";

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

test.describe("phone post-save challenge", { tag: "@phone" }, () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("the post-save action opens a usable challenge with uninterrupted typing", async ({ page }) => {
    await page.goto("/thoughts");
    const next = () => page.getByTestId("button-next-step").tap();
    await next();
    const thought = "Synthetic phone challenge thought.";
    const situation = "Synthetic phone challenge situation.";
    const thoughtInput = page.getByTestId("textarea-thought");
    await thoughtInput.pressSequentially(thought);
    await expect(thoughtInput).toHaveValue(thought);
    await expect(thoughtInput).toBeFocused();
    await next();
    await next();
    await page.getByRole("checkbox").first().tap();
    await next();
    const situationInput = page.getByTestId("textarea-situation");
    await situationInput.pressSequentially(situation);
    await expect(situationInput).toHaveValue(situation);
    await expect(situationInput).toBeFocused();
    await next();
    await next();
    await expect(page.getByTestId("step-review-thought")).toBeVisible();
    await expect(page.getByTestId("step-review-thought")).toContainText("Synthetic phone challenge thought.");
    const beforeSave = await (await page.request.get(`/api/users/${userId}/thoughts`)).json();
    let recordAttempts = 0;
    let firstPayload: unknown;
    await page.route(`**/api/users/${userId}/thoughts`, route => {
      if (route.request().method() !== "POST") return route.continue();
      recordAttempts++;
      if (recordAttempts === 1) firstPayload = route.request().postDataJSON();
      else expect(route.request().postDataJSON()).toEqual(firstPayload);
      return recordAttempts === 1
        ? route.fulfill({ status: 503, json: { message: "Synthetic thought save failure" } })
        : route.continue();
    });
    const failedRecord = page.waitForResponse(r =>
      r.url().endsWith(`/api/users/${userId}/thoughts`) && r.status() === 503);
    await page.getByTestId("button-submit-wizard").tap();
    await failedRecord;
    await expect(page.getByTestId("thought-save-error")).toBeVisible();
    await expect(page.getByTestId("thought-save-error"))
      .toHaveText("Failed to record thought. Please try again.");
    await expect(page.getByTestId("step-review-thought")).toContainText(thought);
    await expect(page.getByTestId("step-review-thought")).toContainText(situation);
    await expect(page.getByTestId("button-challenge-thought")).toHaveCount(0);
    const afterFailure = await (await page.request.get(`/api/users/${userId}/thoughts`)).json();
    expect(afterFailure).toHaveLength(beforeSave.length);
    const recorded = page.waitForResponse(r =>
      r.url().endsWith(`/api/users/${userId}/thoughts`) &&
      r.request().method() === "POST" && r.status() === 201);
    await page.getByTestId("button-submit-wizard").tap();
    const created = await (await recorded).json();
    expect(created).toMatchObject({ automaticThoughts: thought, situation });
    expect(recordAttempts).toBe(2);
    const afterRetry = await (await page.request.get(`/api/users/${userId}/thoughts`)).json();
    expect(afterRetry).toHaveLength(beforeSave.length + 1);
    expect(afterRetry.filter((record: { id: number }) => record.id === created.id)).toHaveLength(1);
    await page.getByTestId("button-challenge-thought").tap();
    await expect(page.getByTestId("button-start-challenge")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("button-start-challenge").tap();
    const supporting = page.getByTestId("textarea-evidence-for");
    await supporting.pressSequentially(evidenceFor);
    await expect(supporting).toHaveValue(evidenceFor);
    await expect(supporting).toBeFocused();
    await page.getByTestId("textarea-evidence-against").pressSequentially(evidenceAgainst);
    await expect(page.getByTestId("textarea-evidence-against")).toHaveValue(evidenceAgainst);
    await expect(page.getByTestId("textarea-evidence-against")).toBeFocused();
    await next();
    await page.getByTestId("textarea-alternative").pressSequentially(alternative);
    await expect(page.getByTestId("textarea-alternative")).toHaveValue(alternative);
    await expect(page.getByTestId("textarea-alternative")).toBeFocused();
    await next();
    await expect(page.getByTestId("step-beliefs")).toBeVisible();
    const saved = page.waitForResponse(r =>
      r.url().endsWith(`/api/users/${userId}/thoughts/${created.id}`) &&
      r.request().method() === "PATCH" && r.status() === 200);
    await page.getByTestId("button-save-challenge").tap();
    const result = await (await saved).json();
    expect(result).toMatchObject({
      id: created.id,
      evidenceFor, evidenceAgainst, alternativePerspective: alternative,
      beliefInOriginal: 50, beliefInAlternative: 50,
    });
    await page.getByTestId("button-close-success").tap();
    await page.reload();
    await page.getByRole("tab", { name: "My History", exact: true }).tap();
    await expect(page.getByTestId(`card-thought-${result.id}`)).toContainText("Challenged");
  });
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
  await page.getByTestId("textarea-evidence-for").pressSequentially(evidenceFor);
  await expect(page.getByTestId("textarea-evidence-for")).toHaveValue(evidenceFor);
  await expect(page.getByTestId("textarea-evidence-for")).toBeFocused();
  await page.getByTestId("textarea-evidence-against").pressSequentially(evidenceAgainst);
  await expect(page.getByTestId("textarea-evidence-against")).toHaveValue(evidenceAgainst);
  await next();
  await page.getByTestId("textarea-alternative").pressSequentially(alternative);
  await expect(page.getByTestId("textarea-alternative")).toHaveValue(alternative);
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
  await expect(detail.getByTestId("detail-belief-original"))
    .toHaveText("Original-thought conviction30%");
  await expect(detail.getByTestId("detail-belief-alternative"))
    .toHaveText("Alternative-thought conviction80%");
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
  await expect(detail.getByTestId("detail-belief-original"))
    .toHaveText("Original-thought conviction0%");
  await expect(detail.getByTestId("detail-belief-alternative"))
    .toHaveText("Alternative-thought conviction100%");
  const persisted = await (await page.request.get(`/api/users/${userId}/thoughts`)).json();
  expect(persisted.find((t: { id: number }) => t.id === record.id))
    .toMatchObject({ beliefInOriginal: 0, beliefInAlternative: 100 });
});

for (const ratings of [
  { name: "both missing", beliefInOriginal: null, beliefInAlternative: null },
  { name: "alternative missing", beliefInOriginal: 0, beliefInAlternative: null },
  { name: "original missing", beliefInOriginal: null, beliefInAlternative: 0 },
]) {
  test(`legacy ratings: ${ratings.name} stay unavailable after refresh`, async ({ page }) => {
    const created = await page.request.post(`/api/users/${userId}/thoughts`, {
      headers: headers(),
      data: {
        automaticThoughts: `Synthetic legacy thought: ${ratings.name}`,
        cognitiveDistortions: [],
        evidenceFor, evidenceAgainst, alternativePerspective: alternative,
        reflectionRating: 95,
      },
    });
    expect(created.status()).toBe(201);
    const record = await created.json();
    // Today's API requires paired ratings. Seed historical partial records only
    // in the runner's disposable database, never by relaxing app validation.
    expect(process.env.E2E_ISOLATED).toBeTruthy();
    expect(process.env.DATABASE_URL).toMatch(/^postgresql:\/\/e2e@127\.0\.0\.1:\d+\/resilience_e2e$/);
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      const updated = await pool.query(
        `UPDATE thought_records SET belief_in_original = $1, belief_in_alternative = $2
         WHERE id = $3 AND user_id = $4 RETURNING id`,
        [ratings.beliefInOriginal, ratings.beliefInAlternative, record.id, userId],
      );
      expect(updated.rowCount).toBe(1);
    } finally {
      await pool.end();
    }
    const persisted = await (await page.request.get(`/api/users/${userId}/thoughts`)).json();
    expect(persisted.find((thought: { id: number }) => thought.id === record.id)).toMatchObject({
      reflectionRating: 95,
      beliefInOriginal: ratings.beliefInOriginal,
      beliefInAlternative: ratings.beliefInAlternative,
    });
    await page.goto("/thoughts");
    await page.reload();
    await page.getByRole("tab", { name: "My History", exact: true }).click();
    const card = page.getByTestId(`card-thought-${record.id}`);
    await card.getByRole("button", { name: "", exact: true }).click();
    await page.getByRole("menuitem", { name: "View Details", exact: true }).click();
    const detail = page.getByRole("dialog");
    await expect(detail).toContainText(evidenceFor);
    await expect(detail).toContainText(evidenceAgainst);
    await expect(detail).toContainText(alternative);
    const unavailable = "Unavailable — not recorded";
    await expect(detail.getByTestId("detail-belief-original")).toHaveText(
      `Original-thought conviction${ratings.beliefInOriginal == null ? unavailable : "0%"}`);
    await expect(detail.getByTestId("detail-belief-alternative")).toHaveText(
      `Alternative-thought conviction${ratings.beliefInAlternative == null ? unavailable : "0%"}`);
  });
}
