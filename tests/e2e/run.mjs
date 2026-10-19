// Own the entire database lifecycle. Never accept a caller-supplied database URL.
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm, mkdir, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { withBrowserCacheLock } from "./browser-cache-lock.mjs";
import { browserCache, webkitRevision } from "./setup-webkit.mjs";

const args = process.argv.slice(2);
const productionBuild = args.includes("--production-build");
const browserFlags = args.filter(arg => arg.startsWith("--browser="));
if (browserFlags.length > 1) throw new Error("Select browsers once: --browser=all|chromium|webkit");
const browsers = browserFlags.length ? browserFlags[0].slice("--browser=".length) : "all";
if (!["all", "chromium", "webkit"].includes(browsers)) {
  throw new Error("Only --browser=all|chromium|webkit is accepted");
}
const specs = args.filter(arg => arg !== "--production-build" && !browserFlags.includes(arg));
if (specs.some(spec => !/^[a-z0-9-]+\.spec\.ts$/.test(spec))) {
  throw new Error("Only E2E spec filenames are accepted; database URLs and configuration overrides are forbidden");
}

// Chromium-only runs never use or wait on the WebKit runtime.
let cacheLockFd;
async function withSelectedRuntime(operation) {
  if (browsers === "chromium") return operation();
  await withBrowserCacheLock(browserCache, env, async fd => {
    cacheLockFd = fd;
    const revision = await webkitRevision();
    const directory = path.join(browserCache, `webkit-${revision}`);
    try {
      for (const incomplete of [
        path.join(browserCache, `.resilience-webkit-${revision}-incomplete`),
        `${directory}.resilience-incomplete`,
      ]) {
        try {
          await access(incomplete);
          throw new Error("interrupted setup");
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      }
      let marker;
      try {
        marker = JSON.parse(await readFile(path.join(directory, "resilience-runtime.json"), "utf8"));
      } catch (error) {
        // Ordinary Playwright installs on non-Nix hosts have no custom marker.
        // Its own host/dependency checks remain enabled for those installations.
        if (error.code !== "ENOENT") throw error;
      }
      if (marker !== undefined) {
        if (marker.revision !== revision || marker.schema !== 1) throw new Error("revision mismatch");
        await access(path.join(directory, "DEPENDENCIES_VALIDATED"));
      }
    } catch {
      throw new Error(`WebKit ${revision} is not ready or setup was interrupted. Run npm run setup:e2e:webkit, then retry.`);
    }
    await operation();
  });
}

const env = Object.fromEntries(
  ["PATH", "HOME", "LANG", "LC_ALL", "TMPDIR"].filter(key => process.env[key]).map(key => [key, process.env[key]])
);
await withSelectedRuntime(runJourneys).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

async function runJourneys() {
const root = await mkdtemp(path.join(tmpdir(), "resilience-e2e-"));
if (productionBuild) env.E2E_PRODUCTION_BUILD = "1";
Object.assign(env, {
  NODE_ENV: "development",
  DOTENV_CONFIG_PATH: path.join(root, "no-dotenv"),
  SESSION_SECRET: "synthetic-e2e-only",
  AI_INTEGRATIONS_OPENAI_API_KEY: "synthetic-not-a-real-key",
  OPENAI_API_KEY: "synthetic-not-a-real-key",
  AI_INTEGRATIONS_OPENAI_BASE_URL: "http://127.0.0.1:1",
  E2E_ISOLATED: root,
  E2E_BROWSERS: browsers,
  // Fixed local cache: never inherit a caller's browser-path override.
  PLAYWRIGHT_BROWSERS_PATH: browserCache,
});
async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
function run(command, args) {
  const result = spawnSync(command, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}`);
}
let app;
let testProcess;
let postgresStarted = false;
let stopping;
async function stopChild(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise(resolve => child.once("exit", resolve));
  child.kill("SIGTERM");
  const timeout = setTimeout(() => child.kill("SIGKILL"), 3000);
  timeout.unref();
  try { await exited; } finally { clearTimeout(timeout); }
}
async function cleanup() {
  if (stopping) return stopping;
  stopping = (async () => {
    await stopChild(testProcess);
    await stopChild(app);
    if (postgresStarted) {
      spawnSync("pg_ctl", ["-D", path.join(root, "pg"), "-m", "immediate", "-w", "stop"], { env, stdio: "ignore" });
    }
    await rm(root, { recursive: true, force: true });
  })();
  return stopping;
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => { await cleanup(); process.exit(1); });
}
try {
  const pgPort = await freePort();
  const appPort = await freePort();
  await mkdir(path.join(root, "socket"));
  run("initdb", ["-D", path.join(root, "pg"), "-A", "trust", "-U", "e2e", "--no-locale", "--encoding=UTF8"]);
  run("pg_ctl", ["-D", path.join(root, "pg"), "-l", path.join(root, "postgres.log"),
    "-o", `-h 127.0.0.1 -p ${pgPort} -k ${root}/socket`, "-w", "start"]);
  postgresStarted = true;
  run("createdb", ["-h", "127.0.0.1", "-p", String(pgPort), "-U", "e2e", "resilience_e2e"]);
  env.DATABASE_URL = `postgresql://e2e@127.0.0.1:${pgPort}/resilience_e2e`;
  env.E2E_BASE_URL = `http://127.0.0.1:${appPort}`;
  env.PORT = String(appPort);
  // Explicit config prevents accidentally targeting the workspace database.
  run("node_modules/.bin/drizzle-kit", ["push", "--config", "tests/e2e/drizzle.config.ts", "--force"]);
  app = spawn("node", ["--import", "./tests/e2e/network-guard.mjs", "--import", "tsx", "tests/e2e/server.ts"], { env, stdio: "inherit" });
  app.once("error", error => { console.error("Could not start isolated app:", error.message); });
  for (let attempt = 0; ; attempt++) {
    if (app.exitCode !== null) throw new Error("Isolated app exited before becoming ready");
    try {
      const response = await fetch(`${env.E2E_BASE_URL}/__e2e/ready`);
      if (response.ok) break;
    } catch {}
    if (attempt > 120) throw new Error("Isolated app did not become ready");
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.log(`Isolated E2E app ready on port ${appPort}`);
  const result = await new Promise((resolve, reject) => {
    testProcess = spawn("node_modules/.bin/playwright", ["test", "--config", "tests/e2e/playwright.config.ts", ...specs], {
      env, stdio: cacheLockFd === undefined ? "inherit" : ["inherit", "inherit", "inherit", cacheLockFd],
    });
    testProcess.once("error", reject);
    testProcess.once("exit", code => resolve(code ?? 1));
  });
  process.exitCode = result;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await cleanup();
}
}
