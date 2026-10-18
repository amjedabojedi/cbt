import { createHash, randomUUID } from "node:crypto";

export type ReleaseStatus = "matching" | "mismatch" | "stale" | "unavailable";
type Snapshot = { identity: string; assets: Record<string, string> };
type Probe = { ok: true; snapshot: Snapshot } | { ok: false; reason: string };
export type ReleaseReport = {
  status: ReleaseStatus;
  message: string;
  deployment: Probe;
  custom: Probe;
};

// Only public origins are accepted. Never read credentials or application APIs.
export function publicOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password ||
      url.search || url.hash || url.pathname !== "/" || url.port ||
      !/^(?:[a-z0-9-]+\.)+[a-z][a-z0-9-]*$/i.test(url.hostname) ||
      /\.(?:localhost|local|internal)$/i.test(url.hostname)) {
    throw new Error("Use a public HTTPS origin without credentials, path, query, or port.");
  }
  return url.origin;
}

// An allowlist avoids requesting arbitrary links, tracking URLs, or API routes.
// Identity includes entry JS and entry CSS, but not volatile HTML markup.
export function entryAssets(html: string): string[] {
  const assets = new Set<string>();
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi) ?? []) {
    const attrs = Object.fromEntries(
      [...tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)]
        .map(match => [match[1].toLowerCase(), match[2]]),
    );
    const script = /^<script\b/i.test(tag) && attrs.type === "module";
    const style = /^<link\b/i.test(tag) && attrs.rel === "stylesheet";
    const asset = script ? attrs.src : style ? attrs.href : undefined;
    if (asset && /^\/assets\/[A-Za-z0-9_-]+-[A-Za-z0-9_-]+\.(?:js|css)$/.test(asset)) {
      assets.add(asset);
    }
  }
  if (![...assets].some(asset => asset.endsWith(".js")) || assets.size > 20) {
    throw new Error("No supported production frontend identity.");
  }
  return [...assets].sort();
}

function identity(assets: string[]): string {
  return createHash("sha256").update(assets.join("\n")).digest("hex");
}

async function publicBytes(
  url: URL, kind: "html" | "js" | "css", fetcher: typeof fetch, timeoutMs: number,
): Promise<Uint8Array> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    url.searchParams.set("__release_check", randomUUID());
    const response = await fetcher(url, {
      redirect: "error",
      credentials: "omit",
      headers: { "Cache-Control": "no-cache, no-store", Pragma: "no-cache" },
      signal: controller.signal,
    });
    if (response.status !== 200) throw new Error("Public resource unavailable.");
    const contentType = response.headers.get("content-type") ?? "";
    const valid = kind === "html" ? /text\/html/i.test(contentType)
      : kind === "js" ? /(?:application|text)\/(?:javascript|ecmascript)/i.test(contentType)
      : /text\/css/i.test(contentType);
    if (!valid || !response.body) throw new Error("Unexpected public resource.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > (kind === "html" ? 512_000 : 12_000_000)) {
          throw new Error("Public resource too large.");
        }
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

async function probe(origin: string, fetcher: typeof fetch, timeoutMs: number): Promise<Probe> {
  try {
    const html = await publicBytes(new URL("/", origin), "html", fetcher, timeoutMs);
    const paths = entryAssets(Buffer.from(html).toString("utf8"));
    const assets: Record<string, string> = {};
    for (const asset of paths) {
      const bytes = await publicBytes(new URL(asset, origin), asset.endsWith(".js") ? "js" : "css", fetcher, timeoutMs);
      assets[asset] = createHash("sha256").update(bytes).digest("hex");
    }
    return { ok: true, snapshot: { identity: identity(paths), assets } };
  } catch {
    // Do not emit response bodies, redirect locations, or network error details.
    return { ok: false, reason: "Public frontend could not be verified (HTTP, network, timeout, redirect, or unsupported assets)." };
  }
}

export async function compareReleases(options: {
  deploymentUrl: string;
  customUrl: string;
  expectedHtml?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}): Promise<ReleaseReport> {
  const deploymentOrigin = publicOrigin(options.deploymentUrl);
  const customOrigin = publicOrigin(options.customUrl);
  if (deploymentOrigin === customOrigin) throw new Error("Two distinct public origins are required.");
  const expectedIdentity = options.expectedHtml === undefined ? undefined : identity(entryAssets(options.expectedHtml));
  const [deployment, custom] = await Promise.all(
    [deploymentOrigin, customOrigin].map(origin => probe(origin, options.fetcher ?? fetch, options.timeoutMs ?? 10_000)),
  );
  const result = (status: ReleaseStatus, message: string): ReleaseReport => ({ status, message, deployment, custom });
  if (!deployment.ok || !custom.ok) {
    return result("unavailable", "Release freshness is unknown: at least one public endpoint or frontend asset is unavailable. Do not treat publish success as domain verification.");
  }
  if (JSON.stringify(deployment.snapshot) !== JSON.stringify(custom.snapshot)) {
    return result("mismatch", "WARNING: the deployment and custom website serve different frontend releases/assets. The custom website is not verified as updated; the difference alone does not establish which is newer.");
  }
  if (expectedIdentity && deployment.snapshot.identity !== expectedIdentity) {
    return result("stale", "WARNING: both URLs match each other but do not serve the expected frontend build. The intended release is not verified.");
  }
  return result("matching", expectedIdentity
    ? "Both public URLs serve matching frontend assets and the expected build identity."
    : "Both public URLs serve matching frontend assets. Latest-release freshness is unknown without --expected-html from the published build.");
}
