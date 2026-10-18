import { describe, expect, it, vi } from "vitest";
import { compareReleases, entryAssets, publicOrigin, requiredPublicAssets, verifyPublicBuild } from "../scripts/release-freshness";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../scripts/check-release-freshness";

const deploymentUrl = "https://deployment.example";
const customUrl = "https://custom.example";
const html = (version = "new") => `<script type="module" crossorigin src="/assets/index-${version}.js"></script>
<link rel="stylesheet" href="/assets/index-${version}.css">`;
const options = { deploymentUrl, customUrl };
const manifest = {
  "index.html": { file: "assets/index-new.js", isEntry: true, css: ["assets/index-new.css"],
    dynamicImports: ["src/pages/Lazy.tsx"] },
  "src/pages/Lazy.tsx": { file: "assets/Lazy-screen123.js", isDynamicEntry: true,
    imports: ["_shared.js"], css: ["assets/Lazy-style123.css"] },
  "_shared.js": { file: "assets/shared.es-dep123.js" },
  "logo.png": { file: "assets/logo-image123.png" },
};

function fixture(customVersion = "new", customBody = "public js") {
  return vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    const version = url.origin === customUrl ? customVersion : "new";
    if (url.pathname === "/") return new Response(html(version), { headers: { "content-type": "text/html" } });
    return new Response(url.pathname.endsWith(".css") ? "public css" : url.origin === customUrl ? customBody : "public js", {
      headers: { "content-type": url.pathname.endsWith(".css") ? "text/css" : "application/javascript" },
    });
  });
}

describe("public post-publish release freshness", () => {
  it("confirms matching public assets and the intended build without requesting private routes", async () => {
    const fetcher = fixture();
    const result = await compareReleases({ ...options, fetcher, expectedHtml: html() });
    expect(result.status).toBe("matching");
    expect(result.message).toContain("expected build");
    expect(fetcher).toHaveBeenCalledTimes(6);
    const nonces = new Set();
    for (const [input, init] of fetcher.mock.calls) {
      const url = new URL(String(input));
      expect(["/", "/assets/index-new.js", "/assets/index-new.css"]).toContain(url.pathname);
      expect(url.searchParams.has("__release_check")).toBe(true);
      nonces.add(url.searchParams.get("__release_check"));
      expect(init).toMatchObject({
        redirect: "error", credentials: "omit",
        headers: { "Cache-Control": "no-cache, no-store", Pragma: "no-cache" },
      });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
    expect(nonces.size).toBe(6);
  });

  it("does not claim latest-release freshness when only URL parity is known", async () => {
    const result = await compareReleases({ ...options, fetcher: fixture() });
    expect(result.status).toBe("matching");
    expect(result.message).toContain("freshness is unknown");
  });

  it("warns when custom and platform serve differing releases without guessing which is newer", async () => {
    const result = await compareReleases({ ...options, fetcher: fixture("old"), expectedHtml: html() });
    expect(result.status).toBe("mismatch");
    expect(result.message).toContain("does not establish which is newer");
  });

  it("detects differing asset bytes even with identical filenames", async () => {
    expect((await compareReleases({ ...options, fetcher: fixture("new", "different js") })).status).toBe("mismatch");
  });

  it("detects stale parity when both URLs miss the intended build", async () => {
    const result = await compareReleases({ ...options, fetcher: fixture(), expectedHtml: html("expected") });
    expect(result.status).toBe("stale");
  });

  it.each([401, 403, 404, 500, 503])("reports HTTP %i as unavailable, never matching", async status => {
    const normal = fixture();
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      if (new URL(String(input)).origin === customUrl) return new Response("private response must not be logged", { status });
      return normal(input, init);
    });
    const result = await compareReleases({ ...options, fetcher });
    expect(result.status).toBe("unavailable");
    expect(JSON.stringify(result)).not.toContain("private response");
  });

  it("reports network/redirect failures safely", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("secret-network-details"));
    const result = await compareReleases({ ...options, fetcher });
    expect(result.status).toBe("unavailable");
    expect(JSON.stringify(result)).not.toContain("secret-network-details");
  });

  it("times out stalled requests", async () => {
    const fetcher = vi.fn<typeof fetch>((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("timeout")), { once: true });
    }));
    expect((await compareReleases({ ...options, fetcher, timeoutMs: 5 })).status).toBe("unavailable");
  });

  it("also times out a stalled response body", async () => {
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => new Response(new ReadableStream({
      start(controller) {
        init?.signal?.addEventListener("abort", () => controller.error(new Error("timeout")), { once: true });
      },
    }), { headers: { "content-type": "text/html" } }));
    expect((await compareReleases({ ...options, fetcher, timeoutMs: 5 })).status).toBe("unavailable");
  });

  it("rejects login HTML, development HTML, oversized responses and missing asset fallbacks", async () => {
    for (const body of ["<html>Sign in</html>", '<script type="module" src="/src/main.tsx"></script>', "x".repeat(512_001)]) {
      const fetcher = vi.fn<typeof fetch>(async () => new Response(body, { headers: { "content-type": "text/html" } }));
      expect((await compareReleases({ ...options, fetcher })).status).toBe("unavailable");
    }
    const fetcher = vi.fn<typeof fetch>(async () => new Response(html(), { headers: { "content-type": "text/html" } }));
    expect((await compareReleases({ ...options, fetcher })).status).toBe("unavailable");
  });

  it("supports attribute order/quotes and ignores external resources and API paths", () => {
    expect(entryAssets(`<script src='/assets/index-abc.js' type='module'></script>
      <link href='/assets/index-abc.css' rel='stylesheet'>
      <script src='/api/private' type='module'></script>
      <script src='https://other.example/track.js'></script>`)).toEqual(["/assets/index-abc.css", "/assets/index-abc.js"]);
  });

  it.each(["http://custom.example", "https://user:password@custom.example", "https://custom.example/api",
    "https://custom.example?token=private", "https://custom.example#private", "https://localhost",
    "https://127.0.0.1", "https://[::1]", "https://service.internal", "https://custom.example:8443"])("rejects unsafe origin %s", url => {
    expect(() => publicOrigin(url)).toThrow();
  });

  it("rejects a same-origin comparison before any requests", async () => {
    const fetcher = fixture();
    await expect(compareReleases({ ...options, customUrl: deploymentUrl, fetcher })).rejects.toThrow("distinct");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("validates expected build HTML before making any requests", async () => {
    const fetcher = fixture();
    await expect(compareReleases({ ...options, fetcher, expectedHtml: "<html>invalid</html>" })).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses failure exit codes and does not log raw arguments, response bodies or errors", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetcher = fixture();
    vi.stubGlobal("fetch", fetcher);
    try {
      expect(await main(["--deployment", deploymentUrl, "--custom", customUrl])).toBe(0);
      vi.stubGlobal("fetch", fixture("old"));
      expect(await main(["--deployment", deploymentUrl, "--custom", customUrl])).toBe(1);
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private error")));
      expect(await main(["--deployment", deploymentUrl, "--custom", customUrl])).toBe(2);
      expect(await main(["--deployment", "https://user:private-password@deployment.example", "--custom", customUrl])).toBe(2);
      expect(await main(["--unknown", "private-argument"])).toBe(2);
      expect(await main(["--deployment", deploymentUrl, "--custom", customUrl, "--expected-html", "/missing/private-file"])).toBe(2);
      expect(JSON.stringify([...log.mock.calls, ...error.mock.calls])).not.toMatch(/private-(?:password|argument|file)|private error/);
    } finally {
      vi.unstubAllGlobals();
      log.mockRestore();
      error.mockRestore();
    }
  });
});

describe("required public build chunks (separate from entry parity)", () => {
  it("checks lazy JS, shared chunks and CSS without executing screens or requesting routes", async () => {
    const fetcher = fixture();
    const result = await verifyPublicBuild({ ...options, manifest, fetcher });
    expect(result.status).toBe("matching");
    expect(result.message).toContain("does not verify authenticated screen behavior");
    expect(fetcher).toHaveBeenCalledTimes(10);
    for (const [input, init] of fetcher.mock.calls) {
      const url = new URL(String(input));
      expect(requiredPublicAssets(manifest)).toContain(url.pathname);
      expect(url.pathname).not.toBe("/");
      expect(init).toMatchObject({ redirect: "error", credentials: "omit" });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      expect(url.searchParams.has("__release_check")).toBe(true);
    }
  });

  it.each([
    ["missing lazy JS", 404, "application/javascript", "private missing body", "/assets/Lazy-screen123.js"],
    ["HTML fallback", 200, "text/html", "<html>private sign-in body</html>", "/assets/Lazy-screen123.js"],
    ["HTML with incorrect JS MIME", 200, "application/javascript", "\uFEFF <!doctype html><html>private body</html>", "/assets/Lazy-screen123.js"],
    ["HTML after a comment", 200, "application/javascript", "<!-- fallback -->\n<html>private body</html>", "/assets/Lazy-screen123.js"],
    ["missing lazy CSS", 404, "text/css", "private missing body", "/assets/Lazy-style123.css"],
    ["HTML with incorrect CSS MIME", 200, "text/css", "<html>private body</html>", "/assets/Lazy-style123.css"],
  ])("fails %s even when the homepage and entry assets match", async (_label, status, contentType, body, path) => {
    const normal = fixture();
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const url = new URL(String(input));
      return url.origin === customUrl && url.pathname === path
        ? new Response(body, { status: Number(status), headers: { "content-type": String(contentType) } })
        : normal(input, init);
    });
    expect((await compareReleases({ ...options, fetcher })).status).toBe("matching");
    const result = await verifyPublicBuild({ ...options, manifest, fetcher });
    expect(result.status).toBe("unavailable");
    expect(result.custom.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("private");
  });

  it("detects different lazy chunk bytes under the same filenames", async () => {
    const normal = fixture();
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const url = new URL(String(input));
      return url.origin === customUrl && url.pathname === "/assets/Lazy-screen123.js"
        ? new Response("different chunk", { headers: { "content-type": "application/javascript" } })
        : normal(input, init);
    });
    expect((await verifyPublicBuild({ ...options, manifest, fetcher })).status).toBe("mismatch");
  });

  it.each([
    "/api/private.js", "https://other.example/assets/private-hash.js",
    "//other.example/assets/private-hash.js", "assets/../private-hash.js",
    "assets/private-hash.js?token=private", "assets/private-hash.js#fragment",
    "assets/%2e%2e/private-hash.js", "assets/nested/private-hash.js",
  ])("rejects unverified asset path %s before requests", async path => {
    const fetcher = fixture();
    await expect(verifyPublicBuild({
      ...options, fetcher, manifest: { ...manifest, evil: { file: path } },
    })).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([null, [], {}, { broken: {} }, { broken: { file: "assets/index-new.js", css: "bad" } },
    { broken: { file: "assets/index-new.js", css: ["/api/private.css"] } }])("rejects malformed manifests", manifest => {
    expect(() => requiredPublicAssets(manifest)).toThrow();
  });

  it("deduplicates chunks and rejects manifests exceeding the request limit", () => {
    expect(requiredPublicAssets({ ...manifest, duplicate: manifest["index.html"] })).toHaveLength(5);
    const oversized = Object.fromEntries(Array.from({ length: 201 }, (_, i) =>
      [`chunk${i}`, { file: `assets/chunk-hash${i}.js` }]));
    expect(() => requiredPublicAssets(oversized)).toThrow();
    expect(() => requiredPublicAssets({ entry: { file: "assets/index-new.js",
      css: Array.from({ length: 201 }, (_, i) => `assets/style-hash${i}.css`) } })).toThrow();
  });

  it("bounds body size and safely handles failed requests", async () => {
    for (const fetcher of [
      vi.fn<typeof fetch>().mockRejectedValue(new Error("private network details")),
      vi.fn<typeof fetch>(async () => new Response("x".repeat(12_000_001),
        { headers: { "content-type": "application/javascript" } })),
    ]) {
      const result = await verifyPublicBuild({
        ...options, manifest: { chunk: { file: "assets/Lazy-screen123.js" } }, fetcher,
      });
      expect(result.status).toBe("unavailable");
      expect(JSON.stringify(result)).not.toContain("private");
    }
  });

  it("bounds total bytes across chunks per origin", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response("x".repeat(12_000_000),
      { headers: { "content-type": "application/javascript" } }));
    const manifest = Object.fromEntries(Array.from({ length: 5 }, (_, i) =>
      [`chunk${i}`, { file: `assets/chunk-hash${i}.js` }]));
    expect((await verifyPublicBuild({ ...options, manifest, fetcher })).status).toBe("unavailable");
    expect(fetcher).toHaveBeenCalledTimes(8);
  });

  it("times out stalled chunk bodies", async () => {
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => new Response(new ReadableStream({
      start(controller) {
        init?.signal?.addEventListener("abort", () => controller.error(new Error("private timeout")), { once: true });
      },
    }), { headers: { "content-type": "application/javascript" } }));
    expect((await verifyPublicBuild({
      ...options, manifest: { chunk: { file: "assets/Lazy-screen123.js" } }, fetcher, timeoutMs: 5,
    })).status).toBe("unavailable");
  });

  it("stops the whole chunk check at its time budget rather than resetting it for each request", async () => {
    let now = 0;
    const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
    const normal = fixture();
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      now += 60_001;
      return normal(input, init);
    });
    try {
      expect((await verifyPublicBuild({ ...options, manifest, fetcher })).status).toBe("unavailable");
      expect(fetcher).toHaveBeenCalledTimes(2);
    } finally {
      clock.mockRestore();
    }
  });

  it("uses the CLI manifest flag, fails on a missing chunk, and rejects unsafe manifests without requests", async () => {
    const dir = await mkdtemp(join(tmpdir(), "public-build-test-"));
    const path = join(dir, "manifest.json");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const args = ["--deployment", deploymentUrl, "--custom", customUrl, "--build-manifest", path];
    try {
      await writeFile(path, JSON.stringify(manifest));
      vi.stubGlobal("fetch", fixture());
      expect(await main(args)).toBe(0);
      expect(JSON.parse(log.mock.calls.at(-1)![0]).publicBuild.status).toBe("matching");
      const normal = fixture();
      const missing = vi.fn<typeof fetch>(async (input, init) =>
        new URL(String(input)).pathname === "/assets/Lazy-screen123.js"
          ? new Response("private response", { status: 404 }) : normal(input, init));
      vi.stubGlobal("fetch", missing);
      expect(await main(args)).toBe(2);
      expect(JSON.parse(log.mock.calls.at(-1)![0]).status).toBe("unavailable");
      expect(JSON.parse(log.mock.calls.at(-1)![0]).entryStatus).toBe("matching");
      expect(JSON.parse(log.mock.calls.at(-1)![0]).publicBuild.status).toBe("unavailable");
      await writeFile(path, JSON.stringify({ evil: { file: "/api/private-hash.js" } }));
      missing.mockClear();
      expect(await main(args)).toBe(2);
      expect(missing).not.toHaveBeenCalled();
      expect(JSON.stringify([...log.mock.calls, ...error.mock.calls])).not.toContain("private response");
    } finally {
      vi.unstubAllGlobals();
      log.mockRestore();
      error.mockRestore();
      await rm(dir, { recursive: true, force: true });
    }
  });
});
