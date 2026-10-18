// Configuration checks only. No browser, database or existing app is contacted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const cleanEnv = Object.fromEntries(
  ["PATH", "HOME", "LANG", "LC_ALL", "TMPDIR"]
    .filter(key => process.env[key])
    .map(key => [key, process.env[key]]),
);

for (const args of [
  ["--browser=firefox"],
  ["--browser="],
  ["--browser=webkit", "--browser=chromium"],
  ["--project=chromium"],
  ["--config=other.ts"],
  ["https://example.invalid"],
  ["--browser=webkit", "--base-url=https://example.invalid"],
]) {
  test(`isolated runner rejects ${args.join(" ")} before starting a database`, () => {
    const result = spawnSync(process.execPath, ["tests/e2e/run.mjs", ...args], {
      env: cleanEnv, encoding: "utf8", timeout: 15_000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Only|Select browsers once/);
    assert.doesNotMatch(result.stdout, /initdb|database cluster|server started/);
  });
}

function loadConfig(extraEnv) {
  return spawnSync(process.execPath, [
    "--import", "tsx", "--input-type=module", "-e",
    `const {default: config} = await import("./tests/e2e/playwright.config.ts");
     console.log(JSON.stringify(config.projects.map(project => ({
       name: project.name,
       engine: project.use.browserName,
       mobile: project.use.isMobile,
       touch: project.use.hasTouch,
       userAgent: project.use.userAgent,
       executable: project.use.launchOptions?.executablePath,
       specs: project.testMatch,
       grep: String(project.grep),
     }))));`,
  ], { env: { ...cleanEnv, ...extraEnv }, encoding: "utf8", timeout: 15_000 });
}

for (const selection of ["all", "chromium", "webkit"]) {
  test(`isolated config selects ${selection} without Chromium settings leaking into WebKit`, () => {
    const result = loadConfig({
      E2E_ISOLATED: "/synthetic-config-check-only",
      E2E_BASE_URL: "http://127.0.0.1:12345",
      E2E_BROWSERS: selection,
    });
    assert.equal(result.status, 0, result.stderr);
    const projects = JSON.parse(result.stdout);
    assert.deepEqual(projects.map(p => p.engine),
      selection === "all" ? ["chromium", "webkit"] : [selection]);
    const iphone = projects.find(project => project.engine === "webkit");
    if (iphone) {
      assert.equal(iphone.name, "iphone-webkit");
      assert.equal(iphone.mobile, true);
      assert.equal(iphone.touch, true);
      assert.match(iphone.userAgent, /iPhone.*Safari/);
      assert.equal(iphone.executable, undefined);
      assert.deepEqual(iphone.specs, ["thought-challenge-flow.spec.ts", "phone-navigation.spec.ts", "thought-save-actions.spec.ts",
        "unsaved-work-navigation.spec.ts", "thought-challenge-unsaved.spec.ts"]);
      assert.equal(iphone.grep, "/@phone/");
    }
  });
}

for (const env of [
  {},
  { E2E_BROWSERS: "webkit" },
  { E2E_ISOLATED: "/synthetic-config-check-only", E2E_BASE_URL: "https://example.invalid", E2E_BROWSERS: "webkit" },
  { E2E_ISOLATED: "/synthetic-config-check-only", E2E_BASE_URL: "http://127.0.0.1:12345", E2E_BROWSERS: "firefox" },
  { E2E_ISOLATED: "/synthetic-config-check-only", E2E_BASE_URL: "http://127.0.0.1:12345" },
]) {
  test(`config refuses missing isolation, live URLs or uncontrolled browser selection: ${JSON.stringify(env)}`, () => {
    const result = loadConfig(env);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /arbitrary app URLs are forbidden|Browser selection must come from the isolated runner/);
  });
}
