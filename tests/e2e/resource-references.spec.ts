import { test, expect } from "@playwright/test";

test("resource deletion shows safe references, retries failures, and checks conflicts from both entry points", async ({ page }) => {
  // The runner owns a disposable database; never authenticate against the normal app.
  await page.route("**/*", route => new URL(route.request().url()).origin === process.env.E2E_BASE_URL
    ? route.continue() : route.abort("blockedbyclient"));
  const login = await page.request.post("/api/auth/login", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { username: "e2e-assigned", password: "Synthetic-test-password-42" },
  });
  expect(login.status()).toBe(200);
  const created = await page.request.post("/api/resources", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: {
      title: "Synthetic reference browser resource", description: "Synthetic description",
      content: "Synthetic content", type: "article", category: "general", isPublished: true,
    },
  });
  expect(created.status()).toBe(201);
  const resource = await created.json();
  let mode: "loading" | "visible" | "error" | "hidden" | "clear" = "loading";
  let release: () => void = () => {};
  const waiting = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/api/resources/${resource.id}/recommendation-references`, async route => {
    if (mode === "loading") await waiting;
    if (mode === "error") return route.fulfill({ status: 500, json: { message: "Synthetic failure" } });
    return route.fulfill({ json: {
      hasReferences: mode !== "clear", hasMore: false,
      references: mode === "visible" ? [{ id: 999001, status: "rejected", createdAt: "2026-01-01T00:00:00Z" }] : [],
    } });
  });
  let deletes = 0;
  await page.route(`**/api/resources/${resource.id}`, route => {
    if (route.request().method() !== "DELETE") return route.continue();
    deletes++;
    mode = "hidden";
    return route.fulfill({ status: 409, json: {
      message: "This resource is used by a saved recommendation and cannot be deleted.",
    } });
  });

  await page.goto("/library");
  await page.getByRole("button", { name: "Delete resource", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Checking saved references…")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  mode = "visible";
  release();
  await expect(dialog.getByText("Recommendation #999001")).toBeVisible();
  await expect(dialog.getByText("Status: rejected")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  expect(deletes).toBe(0);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  mode = "error";
  // The viewer's delete action must use the same confirmation and privacy check.
  await page.getByRole("button", { name: "View", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCount(1);
  await expect(dialog.getByRole("button", { name: "Retry", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  await expect(dialog.getByText("Recommendation #999001")).toHaveCount(0);
  mode = "hidden";
  await dialog.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(dialog.getByText("Deletion is blocked", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();

  mode = "clear";
  await page.getByRole("button", { name: "Delete resource", exact: true }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByText("No saved recommendation references were found.")).toBeVisible();
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  // A new reference can appear after the check: the 409 refreshes the summary.
  await expect(dialog.getByText("Deletion is blocked", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  expect(deletes).toBe(1);
  await expect(page.getByText("Resource Deleted", { exact: true })).toHaveCount(0);
});
