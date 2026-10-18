import { test, expect, type Dialog, type Page } from "@playwright/test";

const discardMessage = "Discard your entry? Your unsaved work will be lost.";
let userId: number;

test.beforeAll(async ({ request }) => {
  userId = (await (await request.get("/__e2e/ready")).json()).client;
});

test.beforeEach(async ({ page }) => {
  // The runner owns the database and credentials; never target the normal app.
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === process.env.E2E_BASE_URL
      ? route.continue() : route.abort("blockedbyclient"));
  const login = await page.request.post("/api/auth/login", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { username: "e2e-client", password: "Synthetic-test-password-42" },
  });
  expect(login.status()).toBe(200);
});

async function startThought(page: Page) {
  await page.getByTestId("button-next-step").click();
  await expect(page.getByTestId("textarea-thought")).toHaveValue("");
}

async function records(page: Page) {
  const response = await page.request.get(`/api/users/${userId}/thoughts`);
  expect(response.status()).toBe(200);
  return response.json();
}

async function expectNoBrowserDraft(page: Page, writing: string) {
  const storage = await page.evaluate(() => ({
    local: { ...localStorage }, session: { ...sessionStorage },
  }));
  expect(JSON.stringify(storage)).not.toContain(writing);
}

// Keep listening through the settled UI, so a second click/unload prompt fails
// rather than being silently dismissed by Playwright after the action returns.
async function withOneDialog(
  page: Page, type: "confirm" | "beforeunload", accept: boolean,
  action: () => Promise<unknown>, settled: () => Promise<void>,
) {
  const seen: { type: string; message: string }[] = [];
  const handled: Promise<void>[] = [];
  const handler = (dialog: Dialog) => {
    seen.push({ type: dialog.type(), message: dialog.message() });
    handled.push(accept ? dialog.accept() : dialog.dismiss());
  };
  page.on("dialog", handler);
  try {
    await action();
    await Promise.all(handled);
    await settled();
    expect(seen).toHaveLength(1);
    expect(seen[0].type).toBe(type);
    if (type === "confirm") expect(seen[0].message).toBe(discardMessage);
  } finally {
    page.off("dialog", handler);
  }
}

const activations = [
  { control: "sidebar", key: null },
  { control: "sidebar", key: "Enter" },
  { control: "tab", key: null },
  { control: "tab", key: "Enter" },
  { control: "tab", key: "Space" },
] as const;

for (const { control, key } of activations) {
  test(`${control} via ${key ?? "pointer"}: declining retains route and writing; accepting discards once`, async ({ page }, testInfo) => {
    const writing = `Synthetic private navigation writing ${testInfo.title}`;
    await page.goto("/thoughts");
    const before = await records(page);
    await startThought(page);
    await page.getByTestId("textarea-thought").fill(writing);
    const originalURL = page.url();
    const target = control === "sidebar"
      ? page.getByRole("link", { name: "Smart Goals", exact: true })
      : page.getByRole("tab", { name: "My History", exact: true });
    const activate = async () => {
      if (!key) return target.click();
      await target.focus();
      return target.press(key);
    };
    await withOneDialog(page, "confirm", false, activate, async () => {
      await expect(page).toHaveURL(originalURL);
      await expect(page.getByTestId("textarea-thought")).toHaveValue(writing);
      if (control === "tab") await expect(target).toHaveAttribute("aria-selected", "false");
    });
    await expectNoBrowserDraft(page, writing);
    await withOneDialog(page, "confirm", true, activate, async () => {
      await expect(page.getByTestId("textarea-thought")).toHaveCount(0);
      if (control === "sidebar") await expect(page).toHaveURL(/\/goals$/);
      else {
        await expect(page).toHaveURL(originalURL);
        await expect(target).toHaveAttribute("aria-selected", "true");
      }
    });
    expect(await records(page)).toEqual(before);
    await expectNoBrowserDraft(page, writing);
    // Return through the real UI; discarded content must not be rehydrated.
    if (control === "sidebar") {
      await page.getByRole("link", { name: "Thought Records", exact: true }).click();
    } else {
      await page.getByRole("tab", { name: "Record Thought", exact: true }).click();
    }
    await startThought(page);
    await expectNoBrowserDraft(page, writing);
  });
}

for (const direction of ["back", "forward"] as const) {
  // A cancelled back restores the current route by creating a history entry.
  // Set up each outcome separately so forward is tested against a real, intact
  // forward entry rather than one removed by a previously declined back.
  for (const accept of [false, true]) {
    test(`browser ${direction}, ${accept ? "accept" : "decline"}: protects unfinished writing`, async ({ page }, testInfo) => {
      const writing = `Synthetic private history writing ${testInfo.title}`;
      await page.goto(direction === "back" ? "/goals" : "/thoughts");
      await page.getByRole("link", {
        name: direction === "back" ? "Thought Records" : "Smart Goals", exact: true,
      }).click();
      await expect(page).toHaveURL(direction === "back" ? /\/thoughts$/ : /\/goals$/);
      if (direction === "forward") {
        await page.goBack();
        await expect(page).toHaveURL(/\/thoughts$/);
      }
      const before = await records(page);
      await startThought(page);
      await page.getByTestId("textarea-thought").fill(writing);
      const originalURL = page.url();
      await withOneDialog(page, "confirm", accept,
        () => direction === "back" ? page.goBack() : page.goForward(),
        async () => {
          if (accept) {
            await expect(page).toHaveURL(/\/goals$/);
            await expect(page.getByRole("tab", { name: "My Goals", exact: true })).toBeVisible();
            await expect(page.getByTestId("textarea-thought")).toHaveCount(0);
          } else {
            await expect(page).toHaveURL(originalURL);
            await expect(page.getByTestId("textarea-thought")).toHaveValue(writing);
          }
        });
      expect(await records(page)).toEqual(before);
      await expectNoBrowserDraft(page, writing);
      if (accept) {
        await page.getByRole("link", { name: "Thought Records", exact: true }).click();
        await startThought(page);
      } else {
        // Clear only after checking preservation, to leave without another prompt.
        await page.getByTestId("textarea-thought").fill("");
        await page.reload();
        await startThought(page);
      }
      await expectNoBrowserDraft(page, writing);
    });
  }
}

test("reload: declining keeps the document and writing; accepting reloads once without a stored draft", async ({ page }) => {
  const writing = "Synthetic private reload writing that must stay in memory only.";
  await page.goto("/thoughts");
  const before = await records(page);
  await startThought(page);
  await page.getByTestId("textarea-thought").fill(writing);
  const originalURL = page.url();
  await page.evaluate(() => { document.documentElement.dataset.unsavedTestDocument = "original"; });
  const browser = await page.context().newCDPSession(page);
  try {
    await withOneDialog(page, "beforeunload", false, async () => {
      // Trigger an actual browser reload without waiting for a navigation that
      // must never finish when the user declines the native beforeunload prompt.
      await Promise.all([
        page.waitForEvent("dialog", { timeout: 10_000 }),
        browser.send("Page.reload"),
      ]);
    }, async () => {
      await expect(page).toHaveURL(originalURL);
      await expect(page.locator("html")).toHaveAttribute("data-unsaved-test-document", "original");
      await expect(page.getByTestId("textarea-thought")).toHaveValue(writing);
    });
  } finally {
    await browser.detach();
  }
  await expectNoBrowserDraft(page, writing);
  await withOneDialog(page, "beforeunload", true, () => page.reload(), async () => {
    await expect(page).toHaveURL(originalURL);
    await expect(page.locator("html")).not.toHaveAttribute("data-unsaved-test-document", "original");
    await startThought(page);
  });
  expect(await records(page)).toEqual(before);
  await expectNoBrowserDraft(page, writing);
});
