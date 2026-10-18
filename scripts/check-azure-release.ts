import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { compareReleases, publicOrigin, type ReleaseReport } from "./release-freshness";

const exec = promisify(execFile);

// AzureCLI@2 supplies the existing service connection. Query only public
// deployment metadata: never application settings, keys, or publishing profiles.
export async function azureMetadata(): Promise<unknown> {
  const { stdout } = await exec("az", [
    "webapp", "list", "--query",
    "[].{name:name,state:state,defaultHostName:defaultHostName,hostNames:hostNames}",
    "--output", "json", "--only-show-errors",
  ], { timeout: 30_000, maxBuffer: 1_000_000 });
  return JSON.parse(stdout);
}

export function azureOrigins(metadata: unknown, appName: string, customUrl: string) {
  const customOrigin = publicOrigin(customUrl);
  if (!Array.isArray(metadata)) throw new Error("Metadata unavailable.");
  const apps = metadata.filter(app => app?.name === appName);
  if (apps.length !== 1) throw new Error("App unavailable or ambiguous.");
  const app = apps[0];
  if (app.state !== "Running" || typeof app.defaultHostName !== "string" ||
      !Array.isArray(app.hostNames)) throw new Error("App not ready.");
  const deploymentUrl = publicOrigin(`https://${app.defaultHostName}`);
  // Do not guess the Azure hostname or accept a platform URL as the custom URL.
  if (!new URL(deploymentUrl).hostname.endsWith(".azurewebsites.net") ||
      deploymentUrl === customOrigin ||
      !app.hostNames.includes(new URL(customOrigin).hostname)) {
    throw new Error("Configured custom hostname unavailable.");
  }
  return { deploymentUrl, customUrl: customOrigin };
}

type Dependencies = {
  metadata?: () => Promise<unknown>;
  html?: (path: string) => Promise<string>;
  compare?: typeof compareReleases;
};

export async function main(args: string[], dependencies: Dependencies = {}): Promise<number> {
  try {
    const flags = new Map<string, string>();
    for (let i = 0; i < args.length; i += 2) {
      if (!["--app-name", "--custom", "--expected-html"].includes(args[i]) ||
          !args[i + 1] || args[i + 1].startsWith("--") || flags.has(args[i])) {
        throw new Error("Invalid arguments.");
      }
      flags.set(args[i], args[i + 1]);
    }
    if (flags.size !== 3) throw new Error("Missing required inputs.");
    // This command is called only by the post-Deploy stage. Fetch metadata anew
    // on every invocation; a cached metadata file is not accepted.
    const origins = azureOrigins(
      await (dependencies.metadata ?? azureMetadata)(),
      flags.get("--app-name")!, flags.get("--custom")!,
    );
    const expectedHtml = await (dependencies.html ?? (path => readFile(path, "utf8")))(
      flags.get("--expected-html")!,
    );
    const report = await (dependencies.compare ?? compareReleases)({ ...origins, expectedHtml });
    return output(report);
  } catch {
    // CLI errors can contain credentials or private configuration. Never print them.
    return output({
      status: "unavailable",
      message: "Freshness is unknown: Azure metadata, a running app with the configured custom hostname, or the exact published HTML is unavailable. Deployment success is separate from verification.",
    });
  }
}

function output(report: Pick<ReleaseReport, "status" | "message">): number {
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "matching") {
    console.log(`##vso[task.logissue type=error;code=release_${report.status};]${report.message}`);
  }
  return report.status === "matching" ? 0 : report.status === "unavailable" ? 2 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
