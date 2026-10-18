// This entry point never passes the workspace environment to downloads or browsers.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
export const browserCache = path.join(projectRoot, ".cache/ms-playwright");
export function cleanEnvironment(source = process.env) {
  return Object.fromEntries(["PATH", "HOME", "LANG", "LC_ALL", "TMPDIR"]
    .filter(key => source[key]).map(key => [key, source[key]]));
}
const require = createRequire(import.meta.url);
const core = path.dirname(require.resolve("playwright-core/package.json"));
export async function webkitRevision() {
  const { browsers } = JSON.parse(await readFile(path.join(core, "browsers.json"), "utf8"));
  const revision = browsers.find(browser => browser.name === "webkit")?.revision;
  if (!/^\d+$/.test(revision)) throw new Error("Cannot determine installed Playwright WebKit revision");
  return revision;
}
function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: projectRoot, env, encoding: "utf8", timeout: 600_000, maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(command)} failed:\n${result.stdout}\n${result.stderr}`);
  return result.stdout.trim();
}
export function assertElf64(bytes, label) {
  if (!bytes.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46])) ||
      bytes[4] !== 2 || bytes[5] !== 1 || bytes.readUInt16LE(18) !== 62) {
    throw new Error(`${label} must be an x86-64 ELF (not a 32-bit library)`);
  }
}
async function* files(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = path.join(directory, item.name);
    if (item.isDirectory()) yield* files(name);
    else if (item.isFile()) yield name;
  }
}
async function setup() {
  if (process.argv.length !== 2) throw new Error("setup-webkit accepts no URLs, paths or configuration overrides");
  if (process.platform !== "linux" || process.arch !== "x64") {
    throw new Error("This runtime setup supports x86_64 Linux/NixOS only");
  }
  const env = { ...cleanEnvironment(), PLAYWRIGHT_BROWSERS_PATH: browserCache };
  await mkdir(browserCache, { recursive: true });
  // Keep a GC root for native libraries, not browser executables.
  const runtimeFile = run("nix-build", ["tests/e2e/webkit-runtime.nix",
    "--out-link", path.join(browserCache, "nix-runtime")], env).split("\n").at(-1);
  const runtime = JSON.parse(await readFile(runtimeFile, "utf8"));
  const nativeLibraries = [runtime.eglLibrary, runtime.driLibrary, runtime.glesLibrary, runtime.x264Library];
  for (const name of [runtime.interpreter, ...nativeLibraries]) {
    assertElf64(await readFile(name), name);
  }
  const revision = await webkitRevision();
  const directory = path.join(browserCache, `webkit-${revision}`);
  const marker = path.join(directory, "resilience-runtime.json");
  // An interrupted setup must not be mistaken for a usable installation.
  await rm(marker, { force: true });
  await rm(path.join(directory, "DEPENDENCIES_VALIDATED"), { force: true });
  const cli = path.join(path.dirname(require.resolve("playwright/package.json")), "cli.js");
  run(process.execPath, [cli, "install", "webkit"], env);
  const elfFiles = [];
  for (const variant of ["minibrowser-wpe", "minibrowser-gtk"]) {
    const base = path.join(directory, variant);
    for await (const file of files(base)) {
      const bytes = await readFile(file);
      if (!bytes.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))) continue;
      assertElf64(bytes, file);
      elfFiles.push(file);
      run(runtime.patchelf, ["--set-rpath", `${base}/lib:${base}/sys/lib:${runtime.libraryPath}`, file], env);
      // Shared libraries have no interpreter; executable helpers do.
      const interpreter = spawnSync(runtime.patchelf, ["--print-interpreter", file], { env, encoding: "utf8" });
      if (interpreter.status === 0 && interpreter.stdout.trim()) {
        run(runtime.patchelf, ["--set-interpreter", runtime.interpreter, file], env);
      }
    }
  }
  for (const file of [...elfFiles, ...nativeLibraries]) {
    const dependencies = run(runtime.ldd, [file], env);
    if (dependencies.includes("not found")) {
      throw new Error(`Missing native dependencies for ${file}:\n${dependencies.split("\n").filter(line => line.includes("not found")).join("\n")}`);
    }
  }
  // Never search the global Nix store: that can select an i686 Mesa driver.
  const eglConfig = path.join(directory, "egl-vendor.json");
  await writeFile(eglConfig, JSON.stringify({
    file_format_version: "1.0.0", ICD: { library_path: runtime.eglLibrary },
  }));
  // This wrapper is used by both Playwright and the smoke check. No app env changes.
  const launcher = path.join(directory, "pw_run.sh");
  let original = await readFile(launcher, "utf8");
  original = original.replace(/# BEGIN RESILIENCE NIX RUNTIME[\s\S]*?# END RESILIENCE NIX RUNTIME\n/g, "");
  const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
  const block = [
    "# BEGIN RESILIENCE NIX RUNTIME",
    `export __EGL_VENDOR_LIBRARY_FILENAMES=${quote(eglConfig)}`,
    `export LIBGL_DRIVERS_PATH=${quote(runtime.driPath)}`,
    `export FONTCONFIG_FILE=${quote(runtime.fontConfig)}`,
    "# END RESILIENCE NIX RUNTIME",
  ].join("\n") + "\n";
  await writeFile(launcher, original.replace("\n", `\n${block}`), { mode: 0o755 });
  // Playwright's Ubuntu /sbin/ldconfig cache cannot see pinned Nix libraries.
  // Only the offline smoke child skips that heuristic, AFTER our ELF/ldd checks.
  // Neither the app nor the journey runner inherits this flag.
  run(process.execPath, ["tests/e2e/webkit-smoke.mjs"], {
    ...env, PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS: "1",
  });
  console.log("WebKit page creation, layout, canvas and PNG rendering passed (offline).");
  await writeFile(path.join(directory, "DEPENDENCIES_VALIDATED"), "");
  await writeFile(marker, JSON.stringify({ revision, runtimeFile, schema: 1 }) + "\n");
  console.log(`WebKit ${revision}: x86-64 dependencies and page rendering verified. Run npm run test:e2e -- --browser=webkit`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  setup().catch(error => { console.error(error.message); process.exitCode = 1; });
}
