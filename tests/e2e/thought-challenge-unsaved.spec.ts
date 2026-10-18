import { test, expect, type Page } from "@playwright/test";

let userId: number;
const evidenceFor = "Synthetic supporting evidence for this challenge.";
const evidenceAgainst = "Synthetic contradictory evidence for this challenge.";
const alternative = "Synthetic balanced alternative for this challenge.";
const discardMessage = "Discard your entry? Your unsaved work will be lost.";

test.beforeAll(async ({ request }) => {
  userId = (await (await request.get("/__e2e/ready")).json()).client;
});

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === process.env.E2E_BASE_URL
      ? route.continue() : route.abort("blockedbyclient"));
  const login = await page.request.post("/api/auth/login", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { username: "e2e-client", password: "Synthetic-test-password-42" },
  });
  expect(login.status()).toBe(200);
});

async function openChallenge(page: Page, withBackHistory = false) {
  const response = await page.request.post(`/api/users/${userId}/thoughts`, {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { automaticThoughts: "Synthetic unsaved challenge thought", cognitiveDistortions: [] },
  });
  expect(response.status()).toBe(201);
  const record = await response.json();
  if (withBackHistory) {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "Thought Records", exact: true }).click();
    await expect(page).toHaveURL(/\/thoughts$/);
  } else {
    await page.goto("/thoughts");
  }
  await page.getByRole("tab", { name: "My History", exact: true }).click();
  await page.getByTestId(`card-thought-${record.id}`)
    .getByRole("button", { name: "", exact: true }).click();
  await page.getByRole("menuitem", { name: "Challenge This Thought", exact: true }).click();
  await expect(page.getByTestId("step-intro")).toBeVisible();
  await expect(page.getByRole("menu")).toHaveCount(0);
  return record.id as number;
}

async function enterEvidence(page: Page) {
  await page.getByTestId("button-start-challenge").click();
  await page.getByTestId("textarea-evidence-for").fill(evidenceFor);
  await page.getByTestId("textarea-evidence-against").fill(evidenceAgainst);
}

// A missing or duplicate prompt is a failure, not an automatically accepted dialog.
async function confirmOnce(page: Page, accept: boolean, action: () => Promise<unknown>) {
  const messages: string[] = [];
  const handler = async (dialog: import("@playwright/test").Dialog) => {
    messages.push(dialog.message());
    if (accept) await dialog.accept();
    else await dialog.dismiss();
  };
  page.on("dialog", handler);
  try {
    await action();
    expect(messages).toEqual([discardMessage]);
  } finally {
    page.off("dialog", handler);
  }
}

for (const dismissal of ["Escape", "outside pointer", "dialog close", "header cancel"] as const) {
  test(`${dismissal}: stay preserves evidence; confirmed discard leaves the saved record unchanged`, async ({ page }) => {
    const id = await openChallenge(page);
    await enterEvidence(page);
    const dismiss = async () => {
      if (dismissal === "Escape") return page.keyboard.press("Escape");
      if (dismissal === "outside pointer") return page.mouse.click(5, 5);
      if (dismissal === "dialog close") {
        return page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
      }
      const cancel = page.getByRole("button", { name: "Cancel thought challenge", exact: true });
      await cancel.focus();
      return cancel.press("Enter");
    };
    await confirmOnce(page, false, dismiss);
    await expect(page.getByTestId("textarea-evidence-for")).toHaveValue(evidenceFor);
    await expect(page.getByTestId("textarea-evidence-against")).toHaveValue(evidenceAgainst);
    await confirmOnce(page, true, dismiss);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const records = await (await page.request.get(`/api/users/${userId}/thoughts`)).json();
    expect(records.find((record: { id: number }) => record.id === id)).toMatchObject({
      evidenceFor: null, evidenceAgainst: null, alternativePerspective: null,
      beliefInOriginal: null, beliefInAlternative: null,
    });
    // Reopening starts fresh, without any persisted browser draft.
    await page.getByTestId(`card-thought-${id}`)
      .getByRole("button", { name: "", exact: true }).click();
    await page.getByRole("menuitem", { name: "Challenge This Thought", exact: true }).click();
    await page.getByTestId("button-start-challenge").click();
    await expect(page.getByTestId("textarea-evidence-for")).toHaveValue("");
    await expect(page.getByTestId("textarea-evidence-against")).toHaveValue("");
  });
}

test("alternative-only writing is protected, and clearing it allows untouched cancellation", async ({ page }) => {
  await openChallenge(page);
  await enterEvidence(page);
  await page.getByTestId("button-next-step").click();
  await page.getByTestId("textarea-alternative").fill(alternative);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.getByTestId("textarea-evidence-for").fill("");
  await page.getByTestId("textarea-evidence-against").fill("");
  await confirmOnce(page, false, () => page.keyboard.press("Escape"));
  // Text remains available across steps even when the other fields are empty.
  await page.getByTestId("textarea-evidence-for").fill(evidenceFor);
  await page.getByTestId("textarea-evidence-against").fill(evidenceAgainst);
  await page.getByTestId("button-next-step").click();
  await expect(page.getByTestId("textarea-alternative")).toHaveValue(alternative);
  await page.getByTestId("textarea-alternative").fill("");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.getByTestId("textarea-evidence-for").fill("");
  await page.getByTestId("textarea-evidence-against").fill("");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  page.on("dialog", dialog => {
    void dialog.dismiss();
    throw new Error("Cleared writing must not prompt");
  });
  await page.getByRole("button", { name: "Skip for now", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

for (const rating of ["original", "alternative"] as const) {
  test(`a changed ${rating} rating remains protected after clearing all writing`, async ({ page }) => {
    await openChallenge(page);
    await enterEvidence(page);
    await page.getByTestId("button-next-step").click();
    await page.getByTestId("textarea-alternative").fill(alternative);
    await page.getByTestId("button-next-step").click();
    await page.getByTestId(`slider-belief-${rating}`).getByRole("slider").press("End");
    await confirmOnce(page, false, () => page.keyboard.press("Escape"));
    await expect(page.getByTestId(`slider-belief-${rating}`).getByRole("slider"))
      .toHaveAttribute("aria-valuenow", "100");
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await page.getByTestId("textarea-alternative").fill("");
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await page.getByTestId("textarea-evidence-for").fill("");
    await page.getByTestId("textarea-evidence-against").fill("");
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    const skip = page.getByRole("button", { name: "Skip for now", exact: true });
    await confirmOnce(page, false, () => skip.click());
    await expect(page.getByTestId("step-intro")).toBeVisible();
    await confirmOnce(page, true, () => skip.click());
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
}

test("untouched cancellation and successful-save dismissal do not prompt", async ({ page }) => {
  await openChallenge(page);
  page.on("dialog", dialog => {
    void dialog.dismiss();
    throw new Error("Untouched or saved challenge must not prompt");
  });
  await page.getByRole("button", { name: "Skip for now", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const id = await openChallenge(page);
  await enterEvidence(page);
  await page.getByTestId("button-next-step").click();
  await page.getByTestId("textarea-alternative").fill(alternative);
  await page.getByTestId("button-next-step").click();
  const saved = page.waitForResponse(response =>
    response.url().endsWith(`/api/users/${userId}/thoughts/${id}`) &&
    response.request().method() === "PATCH" && response.status() === 200);
  await page.getByTestId("button-save-challenge").click();
  await saved;
  await expect(page.getByTestId("button-close-success")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId(`card-thought-${id}`)).toContainText("Challenged");
});

for (const outcome of ["success", "failure then retry", "failure then discard"] as const) {
  test(`pending save blocks dismissal and duplicate saves: ${outcome}`, async ({ page }) => {
    const id = await openChallenge(page, true);
    await enterEvidence(page);
    await page.getByTestId("button-next-step").click();
    await page.getByTestId("textarea-alternative").fill(alternative);
    await page.getByTestId("button-next-step").click();
    await page.getByTestId("slider-belief-original").getByRole("slider").press("End");
    await page.getByTestId("slider-belief-alternative").getByRole("slider").press("Home");

    let releaseResponse!: () => void;
    const responseGate = new Promise<void>(resolve => { releaseResponse = resolve; });
    let patchCount = 0;
    await page.route(`**/api/users/${userId}/thoughts/${id}`, async route => {
      if (route.request().method() !== "PATCH") return route.continue();
      patchCount++;
      if (patchCount > 1) return route.continue();
      // Success deliberately reaches the database BEFORE the browser gets its
      // response: dismissing locally cannot undo an already-issued save.
      const response = outcome === "success" ? await route.fetch() : undefined;
      await responseGate;
      if (response) await route.fulfill({ response });
      else await route.fulfill({ status: 500, json: { message: "Synthetic save failure" } });
    });
    const prompts: string[] = [];
    const unexpectedPrompt = async (dialog: import("@playwright/test").Dialog) => {
      prompts.push(dialog.message());
      await dialog.dismiss();
    };
    page.on("dialog", unexpectedPrompt);
    try {
      await page.getByTestId("button-save-challenge").click();
      await expect.poll(() => patchCount).toBe(1);
      await expect(page.getByRole("status").filter({ hasText: "Saving your challenge" })).toBeVisible();
      await expect(page.getByTestId("button-save-challenge")).toBeDisabled();
      await expect(page.getByTestId("button-save-challenge")).toHaveText("Saving…");
      await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
      const cancel = page.getByRole("button", { name: "Cancel thought challenge", exact: true });
      const close = page.getByRole("dialog").getByRole("button", { name: "Close", exact: true });
      await expect(cancel).toBeDisabled();
      await expect(close).toBeDisabled();
      for (const rating of ["original", "alternative"]) {
        await expect(page.getByTestId(`slider-belief-${rating}`)).toHaveAttribute("aria-disabled", "true");
      }
      // Forced pointer clicks also prove that disabled controls don't dismiss.
      await cancel.click({ force: true });
      await close.click({ force: true });
      await page.getByTestId("button-save-challenge").click({ force: true });
      await page.keyboard.press("Escape");
      await page.mouse.click(5, 5);
      await expect(page.getByTestId("step-beliefs")).toBeVisible();
      await expect(page.getByRole("status").filter({ hasText: "Saving your challenge" })).toBeVisible();
      // Browser Back must not offer to discard a write that may already exist.
      await page.goBack();
      await expect(page).toHaveURL(/\/thoughts$/);
      await expect(page.getByTestId("step-beliefs")).toBeVisible();
      expect(prompts).toEqual([]);
      expect(patchCount).toBe(1);
    } finally {
      releaseResponse();
      page.off("dialog", unexpectedPrompt);
    }

    const getRecord = async () => {
      const response = await page.request.get(`/api/users/${userId}/thoughts`);
      expect(response.ok()).toBeTruthy();
      return (await response.json()).find((record: { id: number }) => record.id === id);
    };
    if (outcome !== "success") {
      await expect(page.getByText("Failed to save your thought challenge. Please try again.", { exact: true })).toBeVisible();
      await expect(page.getByTestId("button-save-challenge")).toBeEnabled();
      await expect(page.getByRole("button", { name: "Cancel thought challenge", exact: true })).toBeEnabled();
      await expect(page.getByRole("dialog").getByRole("button", { name: "Close", exact: true })).toBeEnabled();
      await expect(page.getByRole("status").filter({ hasText: "Saving your challenge" })).toHaveCount(0);
      expect(await getRecord()).toMatchObject({
        evidenceFor: null, evidenceAgainst: null, alternativePerspective: null,
        beliefInOriginal: null, beliefInAlternative: null,
      });
      // The error toast is the topmost Radix layer; its first Escape dismisses
      // that notification, not the still-dirty wizard beneath it.
      await page.keyboard.press("Escape");
      await expect(page.getByText("Failed to save your thought challenge. Please try again.", { exact: true })).not.toBeVisible();
      await confirmOnce(page, false, () => page.keyboard.press("Escape"));
      await expect(page.getByTestId("slider-belief-original").getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
      await expect(page.getByTestId("slider-belief-alternative").getByRole("slider")).toHaveAttribute("aria-valuenow", "0");
      await page.getByRole("button", { name: "Previous", exact: true }).click();
      await expect(page.getByTestId("textarea-alternative")).toHaveValue(alternative);
      await page.getByRole("button", { name: "Previous", exact: true }).click();
      await expect(page.getByTestId("textarea-evidence-for")).toHaveValue(evidenceFor);
      await expect(page.getByTestId("textarea-evidence-against")).toHaveValue(evidenceAgainst);
      if (outcome === "failure then discard") {
        await confirmOnce(page, true, () => page.keyboard.press("Escape"));
        await expect(page.getByRole("dialog")).toHaveCount(0);
        expect(await getRecord()).toMatchObject({ evidenceFor: null, alternativePerspective: null });
        expect(patchCount).toBe(1);
        return;
      }
      await page.getByTestId("button-next-step").click();
      await page.getByTestId("button-next-step").click();
      await page.getByTestId("button-save-challenge").click();
    }
    await expect(page.getByTestId("button-close-success")).toBeVisible();
    expect(await getRecord()).toMatchObject({
      evidenceFor, evidenceAgainst, alternativePerspective: alternative,
      beliefInOriginal: 100, beliefInAlternative: 0,
    });
    page.on("dialog", unexpectedPrompt);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(prompts).toEqual([]);
    expect(patchCount).toBe(outcome === "success" ? 1 : 2);
  });
}
