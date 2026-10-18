import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { compareReleases } from "./release-freshness";

export async function main(args: string[]): Promise<number> {
  try {
    const flags = new Map<string, string>();
    for (let i = 0; i < args.length; i += 2) {
      if (!["--deployment", "--custom", "--expected-html"].includes(args[i]) ||
          !args[i + 1] || args[i + 1].startsWith("--") || flags.has(args[i])) {
        throw new Error("Invalid arguments.");
      }
      flags.set(args[i], args[i + 1]);
    }
    if (!flags.has("--deployment") || !flags.has("--custom")) throw new Error("Missing URLs.");
    const report = await compareReleases({
      deploymentUrl: flags.get("--deployment")!,
      customUrl: flags.get("--custom")!,
      expectedHtml: flags.has("--expected-html")
        ? await readFile(flags.get("--expected-html")!, "utf8") : undefined,
    });
    console.log(JSON.stringify(report, null, 2));
    return report.status === "matching" ? 0 : report.status === "unavailable" ? 2 : 1;
  } catch {
    console.error("Release check unavailable: supply two distinct public HTTPS origins and, optionally, readable production HTML. No response or private configuration details are logged.\nUsage: npm run check:release -- --deployment <verified-platform-origin> --custom <configured-custom-origin> [--expected-html dist/public/index.html]");
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
