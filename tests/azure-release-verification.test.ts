import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { azureOrigins, main } from "../scripts/check-azure-release";
import { compareReleases } from "../scripts/release-freshness";

const appName = "configured-app";
const customUrl = "https://therapy.example";
const platformUrl = "https://from-metadata.azurewebsites.net";
const html = (version = "published") => `<script type="module" src="/assets/index-${version}.js"></script>`;
const metadata = () => [{
  name: appName, state: "Running", defaultHostName: new URL(platformUrl).hostname,
  hostNames: [new URL(platformUrl).hostname, new URL(customUrl).hostname],
}];
const args = ["--app-name", appName, "--custom", customUrl, "--expected-html", "exact-zip/index.html"];

afterEach(() => vi.restoreAllMocks());

function logs() {
  return vi.spyOn(console, "log").mockImplementation(() => {});
}

function fetchFixture(platformVersion = "published", customVersion = platformVersion) {
  return vi.fn<typeof fetch>(async input => {
    const url = new URL(String(input));
    return url.pathname === "/"
      ? new Response(html(url.origin === platformUrl ? platformVersion : customVersion),
        { headers: { "content-type": "text/html" } })
      : new Response("public frontend", { headers: { "content-type": "application/javascript" } });
  });
}

describe("Azure opt-in post-deploy verification", () => {
  it("obtains fresh metadata each time and uses the exact ZIP HTML, not a rebuilt workspace", async () => {
    logs();
    const events: string[] = [];
    const fetcher = fetchFixture();
    const loadMetadata = vi.fn(async () => { events.push("metadata"); return metadata(); });
    const loadHtml = vi.fn(async (path: string) => {
      expect(path).toBe("exact-zip/index.html");
      events.push("html");
      return html();
    });
    const compare = vi.fn(async (options: Parameters<typeof compareReleases>[0]) => {
      events.push("compare");
      return compareReleases({ ...options, fetcher });
    });
    for (let i = 0; i < 2; i++) {
      expect(await main(args, { metadata: loadMetadata, html: loadHtml, compare })).toBe(0);
    }
    expect(events).toEqual(["metadata", "html", "compare", "metadata", "html", "compare"]);
    expect(loadMetadata).toHaveBeenCalledTimes(2);
    expect(compare).toHaveBeenCalledWith({ deploymentUrl: platformUrl, customUrl, expectedHtml: html() });
    expect(fetcher.mock.calls.every(([url]) =>
      [platformUrl, customUrl].includes(new URL(String(url)).origin))).toBe(true);
  });

  it.each([
    ["published", "old", "mismatch", 1],
    ["old", "old", "stale", 1],
    ["published", "published", "matching", 0],
  ] as const)("reports %s / %s as %s separately from publish success", async (platform, custom, status, code) => {
    const log = logs();
    const result = await main(args, {
      metadata: async () => metadata(), html: async () => html(),
      compare: options => compareReleases({ ...options, fetcher: fetchFixture(platform, custom) }),
    });
    expect(result).toBe(code);
    const report = JSON.parse(log.mock.calls[0][0]);
    expect(report.status).toBe(status);
    if (status !== "matching") expect(log.mock.calls[1][0]).toContain(`code=release_${status}`);
  });

  it.each([
    null, [], [{ ...metadata()[0], state: "Stopped" }],
    [{ ...metadata()[0], hostNames: [] }],
    [{ ...metadata()[0], defaultHostName: "https://user:private-value@host.example" }],
    [...metadata(), ...metadata()],
    [{ ...metadata()[0], defaultHostName: "made-up.example" }],
  ])("fails closed without public requests when metadata is unusable", async value => {
    const log = logs();
    const compare = vi.fn();
    expect(await main(args, { metadata: async () => value, compare })).toBe(2);
    expect(compare).not.toHaveBeenCalled();
    expect(log.mock.calls[1][0]).toContain("release_unavailable");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-value");
  });

  it("reports metadata service errors and unreadable artifact HTML as unavailable without raw errors", async () => {
    const log = logs();
    const compare = vi.fn();
    const failed = async () => { throw new Error("private-value"); };
    expect(await main(args, { metadata: failed, compare })).toBe(2);
    expect(await main(args, { metadata: async () => metadata(), html: failed, compare })).toBe(2);
    expect(compare).not.toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-value");
  });

  it("never downgrades missing or unsupported expected HTML to parity-only success", async () => {
    logs();
    const fetcher = fetchFixture();
    expect(await main(args, {
      metadata: async () => metadata(), html: async () => "<html>not a build</html>",
      compare: options => compareReleases({ ...options, fetcher }),
    })).toBe(2);
    expect(fetcher).not.toHaveBeenCalled();
    expect(await main(args.slice(0, 4))).toBe(2);
  });

  it("returns unavailable for an unreachable or gated origin after a successful deploy", async () => {
    const log = logs();
    expect(await main(args, {
      metadata: async () => metadata(), html: async () => html(),
      compare: options => compareReleases({
        ...options, fetcher: vi.fn().mockRejectedValue(new Error("private-value")),
      }),
    })).toBe(2);
    expect(JSON.parse(log.mock.calls[0][0]).status).toBe("unavailable");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-value");
  });

  it("rejects unsafe, unbound, and same-origin inputs", () => {
    for (const origin of ["https://unbound.example", platformUrl, "http://therapy.example",
      "https://user:password@therapy.example", `${customUrl}/api`]) {
      expect(() => azureOrigins(metadata(), appName, origin)).toThrow();
    }
  });

  it("keeps opt-in verification after Deploy, on the same ZIP, without changes to publishing triggers", async () => {
    const pipeline = await readFile("azure-pipelines.yml", "utf8");
    expect(pipeline).toMatch(/name: verifyCustomOrigin[\s\S]*?type: boolean\s+default: false/);
    const [build, verify] = pipeline.split("- stage: VerifyRelease");
    expect(build).not.toMatch(/node "\$work\/check\.mjs"/);
    expect(verify).toMatch(/dependsOn: Deploy\s+condition: succeeded\(\)/);
    expect(verify).toContain("buildType: 'current'");
    expect(verify).toContain("dist/public/index.html");
    expect(verify).toContain("dist/check-azure-release.mjs");
    expect(verify).toContain('$(Pipeline.Workspace)/drop/$(Build.BuildId).zip');
    expect(verify).toContain('azureSubscription: \'$(azureSubscription)\'');
    expect(verify).toContain("visibleAzLogin: false");
    expect(verify).toContain("addSpnToEnvironment: false");
    expect(verify).not.toMatch(/npm run build|npm ci|AzureWebApp@1|appsettings|publish-profile/);
    expect(build).toContain("startUpCommand: 'npm start'");
  });
});
