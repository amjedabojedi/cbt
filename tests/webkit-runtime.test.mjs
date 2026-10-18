import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import {
  assertElf64, cleanEnvironment, webkitRevision, browserCache, projectRoot,
} from "./e2e/setup-webkit.mjs";

test("setup uses the installed Playwright revision and repository-only cache", async () => {
  const require = createRequire(import.meta.url);
  const core = path.dirname(require.resolve("playwright-core/package.json"));
  const metadata = JSON.parse(await readFile(path.join(core, "browsers.json"), "utf8"));
  assert.equal(await webkitRevision(), metadata.browsers.find(b => b.name === "webkit").revision);
  assert.equal(browserCache, path.join(projectRoot, ".cache/ms-playwright"));
});

test("setup environment drops credentials, app URLs and runtime overrides", () => {
  const unsafe = Object.fromEntries([
    "DATABASE_URL", "OPENAI_API_KEY", "SESSION_SECRET", "APP_URL", "E2E_BASE_URL",
    "PLAYWRIGHT_BROWSERS_PATH", "PLAYWRIGHT_DOWNLOAD_HOST", "PLAYWRIGHT_WEBKIT_DOWNLOAD_HOST",
    "PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS", "LD_LIBRARY_PATH",
    "__EGL_VENDOR_LIBRARY_FILENAMES", "NODE_OPTIONS", "NIX_PATH", "NIX_CONFIG",
  ].map(key => [key, "must-not-reach-child"]));
  assert.deepEqual(cleanEnvironment({ ...unsafe, PATH: "/bin", HOME: "/tmp/test-home", LANG: "C" }),
    { PATH: "/bin", HOME: "/tmp/test-home", LANG: "C" });
});

test("native runtime checks reject 32-bit and non-x86 ELF libraries", () => {
  const elf = Buffer.alloc(64);
  Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2, 1]).copy(elf);
  elf.writeUInt16LE(62, 18);
  assert.doesNotThrow(() => assertElf64(elf, "Mesa"));
  elf[4] = 1;
  assert.throws(() => assertElf64(elf, "Mesa"), /not a 32-bit library/);
  elf[4] = 2;
  elf.writeUInt16LE(183, 18);
  assert.throws(() => assertElf64(elf, "Mesa"), /x86-64/);
  assert.throws(() => assertElf64(Buffer.from("not ELF"), "Mesa"), /x86-64/);
});

test("setup rejects configuration and URL arguments before running downloads", () => {
  const result = spawnSync(process.execPath, ["tests/e2e/setup-webkit.mjs", "--url=https://example.invalid"], {
    env: cleanEnvironment(), encoding: "utf8", timeout: 15_000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /accepts no URLs, paths or configuration overrides/);
  assert.equal(result.stdout, "");
});

test("actual setup child gets no caller secrets or browser/Nix overrides", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "webkit-setup-env-"));
  try {
    const probe = path.join(root, "nix-build");
    // Stop before any browser download or modification. Values here are synthetic.
    await writeFile(probe, `#!${process.execPath}\nconsole.error(JSON.stringify(process.env));process.exit(9);\n`, { mode: 0o755 });
    const result = spawnSync(process.execPath, ["tests/e2e/setup-webkit.mjs"], {
      env: {
        ...cleanEnvironment(), PATH: `${root}:${process.env.PATH}`,
        DATABASE_URL: "synthetic-secret", APP_URL: "https://example.invalid",
        PLAYWRIGHT_BROWSERS_PATH: "/untrusted-browser", NIX_CONFIG: "untrusted-config",
        LD_LIBRARY_PATH: "/untrusted-libs",
      }, encoding: "utf8", timeout: 15_000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /nix-build failed/);
    assert.doesNotMatch(result.stderr, /synthetic-secret|example\.invalid|untrusted-/);
    assert.match(result.stderr, /PLAYWRIGHT_BROWSERS_PATH/);
    assert.ok(result.stderr.includes(browserCache));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
