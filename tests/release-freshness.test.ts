import { describe, expect, it, vi } from "vitest";
import { compareReleases, entryAssets, publicOrigin } from "../scripts/release-freshness";
import { main } from "../scripts/check-release-freshness";

const deploymentUrl = "https://deployment.example";
const customUrl = "https://custom.example";
const html = (version = "new") => `<script type="module" crossorigin src="/assets/index-${version}.js"></script>
<link rel="stylesheet" href="/assets/index-${version}.css">`;
const options = { deploymentUrl, customUrl };

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
