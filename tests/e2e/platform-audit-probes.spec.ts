// Temporary failure-state probes. Removed after collecting the report.
import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
let userId: number;
test.beforeEach(async ({ page }) => {
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === process.env.E2E_BASE_URL
      ? route.continue() : route.abort("blockedbyclient"));
  userId = (await (await page.request.get("/__e2e/ready")).json()).client;
  expect((await page.request.post("/api/auth/login", {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { username: "e2e-client", password: "Synthetic-test-password-42" },
  })).status()).toBe(200);
});

test("observe the actual PDF response and export feedback", async ({ page }, info) => {
  const response = await page.request.get("/api/export/pdf?type=all");
  const body = await response.body();
  await page.goto("/reports");
  const button = page.getByRole("button", { name: /Export Report/i });
  await expect(button).toBeVisible();
  const pendingDownload = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);
  await button.tap();
  const download = await pendingDownload;
  const result = {
    status: response.status(), contentType: response.headers()["content-type"],
    isPdf: body.subarray(0, 5).toString() === "%PDF-",
    completionClaimed: await page.getByText("Export complete", { exact: true }).isVisible(),
    downloadFilename: download?.suggestedFilename() ?? null,
    downloadFailure: download ? await download.failure() : "No download event",
  };
  await mkdir(info.outputDir, { recursive: true });
  await writeFile(info.outputPath("probe.json"), JSON.stringify(result, null, 2));
  await page.screenshot({ path: info.outputPath("export-feedback.png"), animations: "disabled" });
});

test("observe Progress when a saved thought exists but its read fails", async ({ page }, info) => {
  const endpoint = `/api/users/${userId}/thoughts`;
  const saved = await page.request.post(endpoint, {
    headers: { Origin: process.env.E2E_BASE_URL! },
    data: { automaticThoughts: "Synthetic saved thought for the Progress failure audit.", cognitiveDistortions: [] },
  });
  expect(saved.status()).toBe(201);
  const record = await saved.json();
  const actualRecords = await (await page.request.get(endpoint)).json();
  expect(actualRecords.some((item: { id: number }) => item.id === record.id)).toBe(true);
  let attempts = 0;
  await page.route(`**${endpoint}`, route => {
    attempts++;
    return route.fulfill({ status: 503, json: { message: "Synthetic audit read failure" } });
  });
  await page.goto("/reports");
  await expect.poll(() => attempts, { timeout: 15000 }).toBe(4);
  await page.waitForLoadState("networkidle");
  const text = await page.locator("main").innerText();
  const result = {
    persistedThoughtCount: actualRecords.length,
    failedAttempts: attempts,
    displayedAsZeroThoughts: /CHALLENGED THOUGHTS\s+0\s*\/\s*0/.test(text),
    hasFailureWarning: /could not load|failed to load|unable to load|unavailable|try again/i.test(text),
    text,
  };
  await mkdir(info.outputDir, { recursive: true });
  await writeFile(info.outputPath("probe.json"), JSON.stringify(result, null, 2));
  await page.screenshot({ path: info.outputPath("progress-read-failure.png"), animations: "disabled" });
});
