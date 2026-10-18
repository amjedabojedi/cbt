// Dedicated clean-worker check. Never erase a developer's existing browser cache.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  browserCache, cleanEnvironment, projectRoot, webkitRevision,
} from "./setup-webkit.mjs";

export async function requireEmptyCache(directory) {
  const entries = await readdir(directory).catch(error => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  assert.equal(entries.length, 0,
    "Clean runtime verification requires an empty .cache/ms-playwright; use a fresh checkout, not your working browser cache");
}

async function verify() {
  assert.equal(process.argv.length, 2, "Clean runtime verification accepts no overrides");
  assert.equal(process.platform, "linux", "Requires an x86_64 Linux Nix worker");
  assert.equal(process.arch, "x64", "Requires an x86_64 Linux Nix worker");
  await requireEmptyCache(browserCache);
  const diagnostics = path.join(projectRoot, "generated-artifacts/webkit-runtime");
  await mkdir(diagnostics, { recursive: true });
  const revision = await webkitRevision();
  const summary = { schema: 1, architecture: "x86_64", revision, emptyCache: true, result: "failed",
    setup: "not-run", journeys: "not-run" };
  const env = cleanEnvironment();
  async function run(stage, script, args = []) {
    summary[stage] = "running";
    // Only allowlisted setup/test processes can contribute to these logs.
    let output = "";
    try {
      const status = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [script, ...args], { cwd: projectRoot, env });
        child.stdout.on("data", chunk => { output += chunk; process.stdout.write(chunk); });
        child.stderr.on("data", chunk => { output += chunk; process.stderr.write(chunk); });
        child.once("error", reject);
        child.once("exit", code => resolve(code));
      });
      assert.equal(status, 0, `${stage} failed; see synthetic ${stage}.log`);
      summary[stage] = "passed";
    } catch (error) {
      summary[stage] = "failed";
      throw error;
    } finally {
      await writeFile(path.join(diagnostics, `${stage}.log`), output);
    }
  }
  try {
    await run("setup", "tests/e2e/setup-webkit.mjs");
    const installed = path.join(browserCache, `webkit-${revision}`);
    const marker = JSON.parse(await readFile(path.join(installed, "resilience-runtime.json"), "utf8"));
    assert.equal(marker.revision, revision);
    assert.equal(marker.schema, 1);
    await readFile(path.join(installed, "DEPENDENCIES_VALIDATED"));
    // Do not invoke Playwright directly: this runner owns the disposable DB,
    // synthetic accounts, credential filtering and outbound application firewall.
    await run("journeys", "tests/e2e/run.mjs", ["--browser=webkit"]);
    summary.result = "passed";
  } finally {
    await writeFile(path.join(diagnostics, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verify().catch(error => { console.error(error.message); process.exitCode = 1; });
}
