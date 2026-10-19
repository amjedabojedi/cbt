import { defineConfig, devices, type PlaywrightTestProject } from "@playwright/test";
import { existsSync } from "node:fs";

if (!process.env.E2E_ISOLATED || !/^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.E2E_BASE_URL || "")) {
  throw new Error("Run npm run test:e2e; arbitrary app URLs are forbidden");
}
const browsers = process.env.E2E_BROWSERS;
if (!browsers || !["all", "chromium", "webkit"].includes(browsers)) {
  throw new Error("Browser selection must come from the isolated runner");
}
const projects: PlaywrightTestProject[] = [
  {
    name: "chromium",
    use: {
      browserName: "chromium",
      launchOptions: {
        executablePath: existsSync("/repl/tools/bin/chromium") ? "/repl/tools/bin/chromium" : undefined,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      },
    },
  },
  {
    name: "iphone-webkit",
    testMatch: ["thought-challenge-flow.spec.ts", "phone-navigation.spec.ts", "thought-save-actions.spec.ts",
      "unsaved-work-navigation.spec.ts", "thought-challenge-unsaved.spec.ts", "thought-history-handoff.spec.ts",
      "progress-availability.spec.ts", "thought-history-availability.spec.ts", "dashboard-availability.spec.ts",
      "progress-localization.spec.ts"],
    grep: /@phone/,
    use: { ...devices["iPhone 13"], browserName: "webkit" },
  },
];
export default defineConfig({
  projects: projects.filter(project => browsers === "all" || project.use?.browserName === browsers),
  testDir: ".",
  testMatch: "*.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 90_000,
  outputDir: "../../generated-artifacts/e2e",
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL,
    headless: true,
    // Avoid saving sensitive browser state as a default even for synthetic data.
    trace: "off",
    screenshot: "off",
  },
});
