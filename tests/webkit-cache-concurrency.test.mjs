// Real entry points and kernel locks, but fake tools/browsers in a disposable
// checkout. No database, native build, browser download or workspace credentials.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, cp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanEnvironment } from "./e2e/setup-webkit.mjs";

const repository = fileURLToPath(new URL("../", import.meta.url));
const revision = "12345";
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "webkit-cache-lock-"));
  const children = [];
  const extraPids = new Set();
  t.after(async () => {
    for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    for (const pid of extraPids) { try { process.kill(pid, "SIGKILL"); } catch {} }
    await Promise.all(children.map(child => child.done));
    await rm(root, { recursive: true, force: true });
  });
  for (const dir of ["tests/e2e", "tools", "node_modules/.bin", "node_modules/playwright", "node_modules/playwright-core"]) {
    await mkdir(path.join(root, dir), { recursive: true });
  }
  await writeFile(path.join(root, "package.json"), '{"type":"module"}');
  for (const file of ["setup-webkit.mjs", "browser-cache-lock.mjs", "run.mjs", "network-guard.mjs"]) {
    await cp(path.join(repository, "tests/e2e", file), path.join(root, "tests/e2e", file));
  }
  await symlink(path.join(repository, "node_modules/tsx"), path.join(root, "node_modules/tsx"));
  for (const name of ["playwright", "playwright-core"]) {
    await writeFile(path.join(root, "node_modules", name, "package.json"), `{"name":"${name}","type":"module"}`);
  }
  await writeFile(path.join(root, "node_modules/playwright-core/browsers.json"),
    JSON.stringify({ browsers: [{ name: "webkit", revision }] }));
  // Every fake executable independently checks that caller overrides/secrets
  // never reach setup or journeys. Only synthetic credentials are injected.
  await writeFile(path.join(root, "tools/common.mjs"), `
    import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
    import path from "node:path";
    import { fileURLToPath } from "node:url";
    import assert from "node:assert/strict";
    export const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
    export const cache = path.join(root, ".cache/ms-playwright");
    export const directory = path.join(cache, "webkit-${revision}");
    for (const value of Object.values(process.env)) assert.ok(!value.includes("CALLER-CANARY"));
    assert.equal(process.env.PLAYWRIGHT_BROWSERS_PATH, cache);
    assert.equal(process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS,
      process.argv[1].endsWith("webkit-smoke.mjs") ? "1" : undefined);
    export function event(name) {
      appendFileSync(path.join(root, "events"), JSON.stringify({ name, pid: process.pid }) + "\\n");
    }
    export async function gate(name) {
      event(name);
      while (existsSync(path.join(root, "hold-" + name))) await new Promise(r => setTimeout(r, 20));
    }
  `);
  const native = Buffer.alloc(64);
  Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2, 1]).copy(native);
  native.writeUInt16LE(62, 18);
  await writeFile(path.join(root, "native"), native);
  const executable = async (file, body) => {
    await writeFile(path.join(root, file), `#!${process.execPath}\n${body}`, { mode: 0o755 });
  };
  await executable("tools/nix-build", `
    import { root, event } from "./common.mjs";
    event("nix");
    console.log(root + "/runtime.json");
  `);
  await executable("tools/patchelf", `
    import { readFileSync, writeFileSync, existsSync } from "node:fs";
    import { root, gate, event } from "./common.mjs";
    if (process.argv[2] === "--set-rpath") {
      const file = process.argv.at(-1);
      if (existsSync(root + "/hold-patch")) {
        writeFileSync(file, "partially-written-ELF");
        await gate("patch");
        writeFileSync(file, readFileSync(root + "/native"));
      }
      event("patched");
    }
  `);
  await executable("tools/ldd", `import { event } from "./common.mjs"; event("ldd");`);
  await writeFile(path.join(root, "runtime.json"), JSON.stringify({
    interpreter: path.join(root, "native"), eglLibrary: path.join(root, "native"),
    driLibrary: path.join(root, "native"), glesLibrary: path.join(root, "native"),
    x264Library: path.join(root, "native"), patchelf: path.join(root, "tools/patchelf"),
    ldd: path.join(root, "tools/ldd"), libraryPath: root, driPath: root, fontConfig: root,
  }));
  await executable("node_modules/playwright/cli.js", `
    import { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
    import { root, directory, event } from "../../tools/common.mjs";
    event("install");
    // Match Playwright's cleanup of unreferenced browser-prefixed siblings.
    for (const name of readdirSync(root + "/.cache/ms-playwright")) {
      if (name.startsWith("webkit-") && name !== "webkit-${revision}")
        rmSync(root + "/.cache/ms-playwright/" + name, { recursive: true, force: true });
    }
    if (!existsSync(directory)) {
      for (const variant of ["minibrowser-wpe", "minibrowser-gtk"]) {
        mkdirSync(directory + "/" + variant, { recursive: true });
        writeFileSync(directory + "/" + variant + "/MiniBrowser", readFileSync(root + "/native"));
      }
      writeFileSync(directory + "/pw_run.sh", "#!/bin/sh\\nexit 0\\n", { mode: 0o755 });
      event("download");
    }
  `);
  await writeFile(path.join(root, "tests/e2e/webkit-smoke.mjs"), `
    import { event, directory } from "../../tools/common.mjs";
    import { existsSync } from "node:fs";
    import assert from "node:assert/strict";
    // This fixture stands in for rendering, not for lock/repair behavior.
    assert.ok(!existsSync(directory + "/resilience-runtime.json"));
    assert.ok(existsSync(directory + "/../.resilience-webkit-${revision}-incomplete"),
      "the interrupted-setup sentinel must survive Playwright garbage collection");
    event("smoke");
  `);
  for (const command of ["initdb", "pg_ctl", "createdb"]) {
    await executable(`tools/${command}`, `import { event } from "./common.mjs"; event("${command}");`);
  }
  await executable("node_modules/.bin/drizzle-kit",
    `import { event } from "../../tools/common.mjs"; event("schema");`);
  await writeFile(path.join(root, "tests/e2e/server.ts"), `
    import http from "node:http";
    http.createServer((req, res) => res.end("ready")).listen(Number(process.env.PORT), "127.0.0.1");
  `);
  await executable("node_modules/.bin/playwright", `
    import { gate, event } from "../../tools/common.mjs";
    import assert from "node:assert/strict";
    assert.match(process.env.DATABASE_URL, /^postgresql:\\/\\/e2e@127\\.0\\.0\\.1:/);
    assert.match(process.env.E2E_BASE_URL, /^http:\\/\\/127\\.0\\.0\\.1:/);
    process.once("SIGTERM", async () => {
      await gate("journey-stop");
      event("journey-stopped");
      process.exit(0);
    });
    await gate("journey");
    event("journey-end");
  `);
  const env = {
    ...cleanEnvironment(), PATH: `${root}/tools:${process.env.PATH}`,
    DATABASE_URL: "CALLER-CANARY", APP_URL: "CALLER-CANARY", OPENAI_API_KEY: "CALLER-CANARY",
    E2E_BASE_URL: "CALLER-CANARY", PLAYWRIGHT_BROWSERS_PATH: "CALLER-CANARY",
    NIX_CONFIG: "CALLER-CANARY", PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS: "CALLER-CANARY",
  };
  function start(entry = "setup-webkit.mjs", args = []) {
    const child = spawn(process.execPath, [`tests/e2e/${entry}`, ...args], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
    child.output = "";
    child.stdout.on("data", data => { child.output += data; });
    child.stderr.on("data", data => { child.output += data; });
    child.done = new Promise(resolve => child.once("close", (code, signal) => resolve({ code, signal })));
    children.push(child);
    return child;
  }
  async function events() {
    try { return (await readFile(path.join(root, "events"), "utf8")).trim().split("\n").filter(Boolean).map(JSON.parse); }
    catch (error) { if (error.code === "ENOENT") return []; throw error; }
  }
  async function until(name, count = 1) {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const matches = (await events()).filter(e => e.name === name);
      if (matches.length >= count) {
        for (const match of matches) extraPids.add(match.pid);
        return matches.at(-1);
      }
      await pause(20);
    }
    assert.fail(`Timed out waiting for ${name}: ${children.map(c => c.output).join("\n")}`);
  }
  return {
    root, cache: path.join(root, ".cache/ms-playwright"), start, events, until,
    hold: name => writeFile(path.join(root, `hold-${name}`), ""),
    release: name => rm(path.join(root, `hold-${name}`)),
  };
}

async function succeeded(child) {
  assert.equal((await child.done).code, 0, child.output);
}

test("simultaneous setups serialize mutation and leave one verified matching revision", { timeout: 25_000 }, async t => {
  const f = await fixture(t);
  await f.hold("patch");
  const first = f.start();
  await f.until("patch");
  const second = f.start();
  await pause(200);
  assert.equal((await f.events()).filter(e => e.name === "nix").length, 1);
  await f.release("patch");
  await Promise.all([succeeded(first), succeeded(second)]);
  assert.equal((await f.events()).filter(e => e.name === "download").length, 1);
  const names = (await f.events()).map(e => e.name);
  assert.ok(names.indexOf("smoke") < names.lastIndexOf("nix"));
  const marker = JSON.parse(await readFile(path.join(f.cache, `webkit-${revision}/resilience-runtime.json`), "utf8"));
  assert.equal(marker.revision, revision);
  assert.equal(marker.schema, 1);
  await assert.rejects(readFile(path.join(f.cache, `.resilience-webkit-${revision}-incomplete`)), { code: "ENOENT" });
});

test("an active iPhone journey blocks setup until the browser runner exits", { timeout: 25_000 }, async t => {
  const f = await fixture(t);
  await succeeded(f.start());
  await f.hold("journey");
  const journey = f.start("run.mjs", ["--browser=webkit"]);
  await f.until("journey");
  const setup = f.start();
  await pause(200);
  assert.equal((await f.events()).filter(e => e.name === "nix").length, 1);
  await f.release("journey");
  await Promise.all([succeeded(journey), succeeded(setup)]);
  const names = (await f.events()).map(e => e.name);
  assert.ok(names.indexOf("journey-end") < names.lastIndexOf("nix"));
});

test("legacy interrupted-setup markers still block journeys and require reinstall", { timeout: 25_000 }, async t => {
  const f = await fixture(t);
  await succeeded(f.start());
  await mkdir(path.join(f.cache, `webkit-${revision}.resilience-incomplete`));
  const journey = f.start("run.mjs", ["--browser=webkit"]);
  assert.equal((await journey.done).code, 1);
  assert.match(journey.output, /setup was interrupted/);
  assert.equal((await f.events()).some(e => e.name === "initdb"), false);
  const repair = f.start();
  await succeeded(repair);
  assert.match(repair.output, /Recovering interrupted WebKit/);
  assert.equal((await f.events()).filter(e => e.name === "download").length, 2);
});

for (const signal of ["SIGTERM", "SIGKILL"]) {
test(`${signal} setup retains the lock in its active child and reinstalls damaged files`, { timeout: 25_000 }, async t => {
  const f = await fixture(t);
  await f.hold("patch");
  const interrupted = f.start();
  const patch = await f.until("patch");
  interrupted.kill(signal);
  // The child still has stdout and the cache fd open, so don't wait for close.
  await new Promise(resolve => interrupted.once("exit", resolve));
  const repair = f.start();
  await pause(200);
  assert.equal((await f.events()).filter(e => e.name === "nix").length, 1);
  process.kill(patch.pid, "SIGKILL");
  await f.release("patch");
  await succeeded(repair);
  assert.match(repair.output, /Recovering interrupted WebKit 12345 setup/);
  assert.equal((await f.events()).filter(e => e.name === "download").length, 2);
  const bytes = await readFile(path.join(f.cache, `webkit-${revision}/minibrowser-wpe/MiniBrowser`));
  assert.equal(bytes.subarray(0, 4).toString("hex"), "7f454c46");
  // A completed repair is reusable, not a permanently stale lock.
  await succeeded(f.start());
});
}

test("stopping an iPhone run waits for browser shutdown before releasing the cache", { timeout: 25_000 }, async t => {
  const f = await fixture(t);
  await succeeded(f.start());
  await f.hold("journey");
  await f.hold("journey-stop");
  const journey = f.start("run.mjs", ["--browser=all"]);
  await f.until("journey");
  const setup = f.start();
  journey.kill("SIGTERM");
  await f.until("journey-stop");
  await pause(200);
  assert.equal((await f.events()).filter(e => e.name === "nix").length, 1);
  await f.release("journey-stop");
  assert.equal((await journey.done).code, 1);
  await succeeded(setup);
  const names = (await f.events()).map(e => e.name);
  assert.ok(names.indexOf("journey-stopped") < names.lastIndexOf("nix"));
});

test("journeys wait for setup, reject unfinished setup before starting a database, and Chromium does not wait", { timeout: 25_000 }, async t => {
  const f = await fixture(t);
  await f.hold("patch");
  const setup = f.start();
  const patch = await f.until("patch");
  const journey = f.start("run.mjs", ["--browser=webkit"]);
  await pause(200);
  assert.equal((await f.events()).some(e => e.name === "initdb"), false);
  setup.kill("SIGKILL");
  await new Promise(resolve => setup.once("exit", resolve));
  process.kill(patch.pid, "SIGKILL");
  assert.equal((await journey.done).code, 1);
  assert.match(journey.output, /setup was interrupted.*setup:e2e:webkit/);
  assert.equal((await f.events()).some(e => e.name === "initdb"), false);
  // Unfinished WebKit must not block a Chromium-only run.
  await succeeded(f.start("run.mjs", ["--browser=chromium"]));
});
