import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { requireEmptyCache } from "./e2e/verify-webkit-runtime.mjs";
import { cleanEnvironment } from "./e2e/setup-webkit.mjs";

test("clean verification permits only absent or empty browser caches without deleting files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "webkit-ci-test-"));
  const cache = path.join(root, "ms-playwright");
  try {
    await requireEmptyCache(cache);
    await mkdir(cache);
    await requireEmptyCache(cache);
    await writeFile(path.join(cache, "existing-browser"), "keep");
    await assert.rejects(requireEmptyCache(cache), /requires an empty/);
    assert.equal(await readFile(path.join(cache, "existing-browser"), "utf8"), "keep");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("verification workflow remains read-only, uncached and separate from publishing", async () => {
  const workflow = await readFile(".github/workflows/webkit-runtime.yml", "utf8");
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /nix-shell tests\/e2e\/webkit-ci\.nix --pure/);
  assert.match(workflow, /if: always\(\)/);
  assert.doesNotMatch(workflow, /secrets\.|environment:|actions\/cache|azure|deploy-production/);
  const uploads = workflow.slice(workflow.indexOf("          path: |"), workflow.indexOf("          if-no-files-found:"));
  assert.doesNotMatch(uploads, /\.cache|\.env|postgres|e2e\/|\*/);
  for (const name of ["summary.json", "setup.log", "journeys.log"]) assert.ok(uploads.includes(name));
});

test("pure CI toolchain provides the kernel browser-cache lock command", async () => {
  const toolchain = await readFile("tests/e2e/webkit-ci.nix", "utf8");
  assert.match(toolchain, /\butil-linux\b/, "flock must be available without inheriting the host PATH");
});

// Synthetic orchestration tests supplement (never replace) the real Nix job.
for (const failure of ["none", "setup", "marker", "journeys"]) {
  test(`verification propagates ${failure === "none" ? "success" : `${failure} failure`} and records only its stages`, async () => {
    const root = await mkdtemp(path.join(tmpdir(), "webkit-ci-stages-"));
    const scripts = path.join(root, "tests/e2e");
    try {
      await mkdir(scripts, { recursive: true });
      await writeFile(path.join(scripts, "verify-webkit-runtime.mjs"),
        await readFile("tests/e2e/verify-webkit-runtime.mjs", "utf8"));
      await writeFile(path.join(scripts, "setup-webkit.mjs"), `
        import { mkdir, writeFile } from "node:fs/promises";
        export const projectRoot = ${JSON.stringify(root)};
        export const browserCache = projectRoot + "/.cache/ms-playwright";
        export const webkitRevision = async () => "123";
        export const cleanEnvironment = () => ({ PATH: process.env.PATH });
        if (process.argv[1].endsWith("/setup-webkit.mjs")) {
          if (${JSON.stringify(failure)} === "setup") process.exit(7);
          await mkdir(browserCache + "/webkit-123", { recursive: true });
          await writeFile(browserCache + "/webkit-123/resilience-runtime.json",
            JSON.stringify({ schema: 1, revision: "123" }));
          if (${JSON.stringify(failure)} !== "marker")
            await writeFile(browserCache + "/webkit-123/DEPENDENCIES_VALIDATED", "");
          console.log("synthetic setup");
        }
      `);
      await writeFile(path.join(scripts, "run.mjs"), `
        import assert from "node:assert/strict";
        assert.deepEqual(process.argv.slice(2), ["--browser=webkit"]);
        assert.equal(process.env.DATABASE_URL, undefined);
        assert.equal(process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS, undefined);
        console.log("synthetic journeys");
        process.exit(${failure === "journeys" ? 8 : 0});
      `);
      const result = spawnSync(process.execPath, [path.join(scripts, "verify-webkit-runtime.mjs")], {
        env: { ...cleanEnvironment(), DATABASE_URL: "synthetic-not-inherited",
          PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS: "1" },
        encoding: "utf8", timeout: 15_000,
      });
      assert.equal(result.status, failure === "none" ? 0 : 1, result.stderr);
      const summary = JSON.parse(await readFile(path.join(root,
        "generated-artifacts/webkit-runtime/summary.json"), "utf8"));
      assert.equal(summary.result, failure === "none" ? "passed" : "failed");
      assert.equal(summary.setup, failure === "setup" ? "failed" : "passed");
      assert.equal(summary.journeys, ["setup", "marker"].includes(failure) ? "not-run"
        : failure === "journeys" ? "failed" : "passed");
      assert.doesNotMatch(result.stdout + result.stderr, /synthetic-not-inherited/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}
