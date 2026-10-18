// Own the entire database lifecycle. Never accept a caller-supplied database URL.
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";

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

const root = await mkdtemp(path.join(tmpdir(), "resilience-e2e-"));
const env = Object.fromEntries(
  ["PATH", "HOME", "LANG", "LC_ALL", "TMPDIR"].filter(key => process.env[key]).map(key => [key, process.env[key]])
);
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
  PLAYWRIGHT_BROWSERS_PATH: path.resolve(".cache/ms-playwright"),
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
async function cleanup() {
  if (stopping) return stopping;
  stopping = (async () => {
    if (testProcess && testProcess.exitCode === null) testProcess.kill("SIGTERM");
    if (app && app.exitCode === null) {
      app.kill("SIGTERM");
      await Promise.race([
        new Promise(resolve => app.once("exit", resolve)),
        new Promise(resolve => setTimeout(() => { app.kill("SIGKILL"); resolve(); }, 3000)),
      ]);
    }
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
    testProcess = spawn("node_modules/.bin/playwright", ["test", "--config", "tests/e2e/playwright.config.ts", ...specs], { env, stdio: "inherit" });
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
