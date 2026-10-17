import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

if (!process.env.E2E_ISOLATED || !/^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.E2E_BASE_URL || "")) {
  throw new Error("Run npm run test:e2e; arbitrary app URLs are forbidden");
}
export default defineConfig({
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
    launchOptions: {
      executablePath: existsSync("/repl/tools/bin/chromium") ? "/repl/tools/bin/chromium" : undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
    // Avoid saving sensitive browser state as a default even for synthetic data.
    trace: "off",
    screenshot: "off",
  },
});
