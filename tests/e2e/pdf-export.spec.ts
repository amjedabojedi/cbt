import { test, expect, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

let ids: Record<string, number>;
test.beforeAll(async ({ request }) => {
  ids = await (await request.get("/__e2e/ready")).json();
});

async function login(page: Page, role = "client") {
  await page.route("**/*", route => new URL(route.request().url()).origin === process.env.E2E_BASE_URL
    ? route.continue() : route.abort("blockedbyclient"));
  const response = await page.request.post("/api/auth/login", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { username: `e2e-${role}`, password: "Synthetic-test-password-42" },
  });
  expect(response.status()).toBe(200);
}

function extract(bytes: Buffer) {
  const result = spawnSync("pdftotext", ["-", "-"], { input: bytes });
  expect(result.status).toBe(0);
  return result.stdout.toString();
}

test("Progress requests a real PDF for each selected period and does not claim a disk save", async ({ page }) => {
  await login(page);
  const created = await page.request.post(`/api/users/${ids.client}/thoughts`, {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { automaticThoughts: "Synthetic readable PDF thought", cognitiveDistortions: [] },
  });
  expect(created.status()).toBe(201);
  await page.goto("/reports");
  for (const [period, label] of [["week", "Past Week"], ["month", "Past Month"], ["all", "All Time"]]) {
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: label, exact: true }).click();
    const responsePromise = page.waitForResponse(r => new URL(r.url()).pathname === "/api/export/pdf");
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("button-export-report").click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("application/pdf");
    expect(new URL(response.url()).searchParams.get("period")).toBe(period);
    expect(new URL(response.url()).searchParams.has("clientId")).toBe(false);
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const bytes = await readFile((await download.path())!);
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    const text = extract(bytes);
    expect(text).toContain("Synthetic readable PDF thought");
    expect(text).toContain(`Subject: Synthetic client (ID: ${ids.client})`);
    expect(text).toContain(`Period: ${label}`);
    await expect(page.getByText("PDF report ready", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Your PDF report has been downloaded.", { exact: true })).toHaveCount(0);
    await expect(page.getByTestId("button-export-report")).toBeEnabled();
  }
});

test("a therapist's selected client reaches both PDF entry points", async ({ page }) => {
  await login(page, "assigned");
  await page.goto("/clients");
  await page.getByRole("button", { name: /Synthetic client/ }).first().click();
  // Client selection is in memory; navigate using app links, not a full reload.
  await page.locator('a[href="/reports"]').first().click();
  await expect(page.getByTestId("page-title")).toHaveText("Client Progress");
  const responsePromise = page.waitForResponse(r => new URL(r.url()).pathname === "/api/export/pdf");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("button-export-report").click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(new URL(response.url()).searchParams.get("clientId")).toBe(String(ids.client));
  const report = await readFile((await (await downloadPromise).path())!);
  expect(extract(report)).toContain(`Subject: Synthetic client (ID: ${ids.client})`);

  // Navigate without losing the selected client, even if Export is not a sidebar item.
  await page.evaluate(() => {
    history.pushState({}, "", "/export");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByText("for client: Synthetic client")).toBeVisible();
  await page.locator("#export-format").click();
  await page.getByRole("option", { name: "PDF (Document)" }).click();
  const panelResponse = page.waitForResponse(r => new URL(r.url()).pathname === "/api/export/pdf");
  const panelDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export All Data", exact: true }).click();
  expect(new URL((await panelResponse).url()).searchParams.get("clientId")).toBe(String(ids.client));
  expect(extract(await readFile((await (await panelDownload).path())!))).toContain(`Subject: Synthetic client (ID: ${ids.client})`);
});

for (const failure of ["401", "403", "500", "html", "fake-pdf", "network"]) {
  test(`Progress rejects ${failure} without announcing success or starting a download`, async ({ page }) => {
    await login(page);
    let downloads = 0;
    page.on("download", () => downloads++);
    await page.route("**/api/export/pdf?*", route => {
      if (failure === "network") return route.abort("failed");
      if (failure === "html") return route.fulfill({ contentType: "text/html", body: "<html>not a report</html>" });
      if (failure === "fake-pdf") return route.fulfill({ contentType: "application/pdf", body: "not a PDF" });
      return route.fulfill({ status: Number(failure), contentType: "application/json", body: '{"message":"Synthetic failure"}' });
    });
    await page.goto("/reports");
    await page.getByTestId("button-export-report").click();
    await expect(page.getByText("Export failed", { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId("button-export-report")).toBeEnabled();
    // Past the old timer: failure must never turn into success.
    await page.waitForTimeout(2200);
    await expect(page.getByText("PDF report ready", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Export complete", { exact: true })).toHaveCount(0);
    expect(downloads).toBe(0);
  });
}

test("a pending request stays busy until the validated PDF response arrives", async ({ page }) => {
  await login(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/export/pdf?*", async route => {
    await gate;
    await route.continue();
  });
  await page.goto("/reports");
  await page.getByTestId("button-export-report").click();
  await page.waitForTimeout(2200);
  await expect(page.getByTestId("button-export-report")).toBeDisabled();
  await expect(page.getByText("PDF report ready", { exact: true })).toHaveCount(0);
  const download = page.waitForEvent("download");
  release();
  await download;
  await expect(page.getByText("PDF report ready", { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId("button-export-report")).toBeEnabled();
});

test("Export Data checks both download and print-preview responses", async ({ page }) => {
  await login(page);
  await page.goto("/export");
  await page.locator("#export-type").click();
  await page.getByRole("option", { name: "Thought Records", exact: true }).click();
  await page.locator("#export-format").click();
  await page.getByRole("option", { name: "PDF (Document)" }).click();
  const responsePromise = page.waitForResponse(r => new URL(r.url()).pathname === "/api/export/pdf");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Thought Records", exact: true }).click();
  const response = await responsePromise;
  expect(new URL(response.url()).searchParams.get("type")).toBe("thoughts");
  expect(new URL(response.url()).searchParams.get("period")).toBe("all");
  expect(extract(await readFile((await (await download).path())!))).toContain("Thought Records");

  const popupPromise = page.waitForEvent("popup");
  const printResponse = page.waitForResponse(r => new URL(r.url()).pathname === "/api/export/pdf");
  await page.getByRole("button", { name: "Open PDF to print" }).click();
  const popup = await popupPromise;
  expect((await printResponse).headers()["content-type"]).toContain("application/pdf");
  await expect.poll(() => popup.url()).toMatch(/^blob:/);
  await popup.close();

  let downloads = 0;
  page.on("download", () => downloads++);
  await page.route("**/api/export/pdf?*", route => route.fulfill({
    contentType: "text/html", body: "<html>not a PDF</html>",
  }));
  await page.getByRole("button", { name: "Export Thought Records", exact: true }).click();
  await expect(page.getByText("Export Failed", { exact: true })).toBeVisible();
  expect(downloads).toBe(0);
  const failedPopupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Open PDF to print" }).click();
  const failedPopup = await failedPopupPromise;
  await expect.poll(() => failedPopup.isClosed()).toBe(true);
  await expect(page.getByRole("button", { name: "Open PDF to print" })).toBeEnabled();
  expect(downloads).toBe(0);
});
