import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { compareReleases, requiredPublicAssets, verifyPublicBuild } from "./release-freshness";

export async function main(args: string[]): Promise<number> {
  try {
    const flags = new Map<string, string>();
    for (let i = 0; i < args.length; i += 2) {
      if (!["--deployment", "--custom", "--expected-html", "--build-manifest"].includes(args[i]) ||
          !args[i + 1] || args[i + 1].startsWith("--") || flags.has(args[i])) {
        throw new Error("Invalid arguments.");
      }
      flags.set(args[i], args[i + 1]);
    }
    if (!flags.has("--deployment") || !flags.has("--custom")) throw new Error("Missing URLs.");
    const manifest: unknown = flags.has("--build-manifest")
      ? JSON.parse(await readFile(flags.get("--build-manifest")!, "utf8")) : undefined;
    // Reject unsafe manifests before even requesting the entry HTML.
    if (flags.has("--build-manifest")) requiredPublicAssets(manifest);
    const report = await compareReleases({
      deploymentUrl: flags.get("--deployment")!,
      customUrl: flags.get("--custom")!,
      expectedHtml: flags.has("--expected-html")
        ? await readFile(flags.get("--expected-html")!, "utf8") : undefined,
    });
    const publicBuild = flags.has("--build-manifest") ? await verifyPublicBuild({
      deploymentUrl: flags.get("--deployment")!,
      customUrl: flags.get("--custom")!,
      manifest,
    }) : undefined;
    const statuses = [report.status, publicBuild?.status];
    const status = statuses.includes("unavailable") ? "unavailable"
      : statuses.includes("mismatch") ? "mismatch" : statuses.includes("stale") ? "stale" : "matching";
    console.log(JSON.stringify({
      ...report,
      status,
      ...(publicBuild ? {
        entryStatus: report.status,
        message: `${report.message} ${publicBuild.message}`,
        publicBuild,
      } : {
        chunkVerification: "Not checked: entry parity does not establish lazy chunk availability. Supply --build-manifest from the exact published build.",
      }),
    }, null, 2));
    return status === "unavailable" ? 2 : status === "matching" ? 0 : 1;
  } catch {
    console.error("Release check unavailable: supply two distinct public HTTPS origins and, optionally, readable production HTML and a valid build manifest. No response or private configuration details are logged.\nUsage: npm run check:release -- --deployment <verified-platform-origin> --custom <configured-custom-origin> [--expected-html dist/public/index.html] [--build-manifest dist/public/.vite/manifest.json]");
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
