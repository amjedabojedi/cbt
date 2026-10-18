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

const PUBLIC_ASSET = /^\/assets\/[A-Za-z0-9_-][A-Za-z0-9_.-]*-[A-Za-z0-9_-]+\.(?:js|css)$/;
const MAX_BUILD_ASSETS = 200;
const MAX_BUILD_BYTES = 48_000_000;
const BUILD_TIMEOUT_MS = 60_000;

// Read only a caller-supplied manifest from the intended Vite build. Never
// discover routes or follow URLs embedded in JavaScript or remote manifests.
export function requiredPublicAssets(manifest: unknown): string[] {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest) ||
      Object.keys(manifest).length === 0 || Object.keys(manifest).length > MAX_BUILD_ASSETS) {
    throw new Error("Unsupported public build manifest.");
  }
  const paths = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value !== "string" || !PUBLIC_ASSET.test(`/${value}`) || value.includes("..")) {
      throw new Error("Unsupported public build asset.");
    }
    paths.add(`/${value}`);
  };
  for (const entry of Object.values(manifest)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
        typeof entry.file !== "string") throw new Error("Unsupported public build manifest.");
    if (!/^assets\/[A-Za-z0-9_.-]+$/.test(entry.file) || entry.file.includes("..")) {
      throw new Error("Unsupported public build asset.");
    }
    // Images and fonts can also appear as Vite manifest entries. This check
    // deliberately covers executable chunks and their stylesheets only.
    if (/\.(?:js|css)$/i.test(entry.file)) add(entry.file);
    if (entry.css !== undefined) {
      if (!Array.isArray(entry.css) || entry.css.length > MAX_BUILD_ASSETS) {
        throw new Error("Unsupported public build manifest.");
      }
      for (const css of entry.css) {
        if (typeof css !== "string" || !css.endsWith(".css")) throw new Error("Unsupported stylesheet.");
        add(css);
      }
    }
  }
  if (paths.size > MAX_BUILD_ASSETS || ![...paths].some(path => path.endsWith(".js"))) {
    throw new Error("Unsupported public build manifest.");
  }
  return [...paths].sort();
}

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
  maxBytes = kind === "html" ? 512_000 : 12_000_000,
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
        if (size > maxBytes) {
          throw new Error("Public resource too large.");
        }
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    const bytes = Buffer.concat(chunks);
    // Some SPA fallbacks incorrectly preserve the requested asset MIME type.
    if (kind !== "html" && /^(?:\s|<!--[\s\S]*?-->)*(?:<!doctype\s+html\b|<html\b|<head\b|<body\b)/i.test(bytes.toString("utf8").replace(/^\uFEFF/, ""))) {
      throw new Error("Unexpected HTML fallback.");
    }
    return bytes;
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

// Separate from entry parity: matching homepage assets do not establish that
// lazy-loaded chunks exist. Download static bytes only; never execute screens.
export async function verifyPublicBuild(options: {
  deploymentUrl: string;
  customUrl: string;
  manifest: unknown;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}): Promise<ReleaseReport> {
  const origins = [publicOrigin(options.deploymentUrl), publicOrigin(options.customUrl)];
  if (origins[0] === origins[1]) throw new Error("Two distinct public origins are required.");
  const paths = requiredPublicAssets(options.manifest);
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("Invalid timeout.");
  const [deployment, custom] = await Promise.all(origins.map(async (origin): Promise<Probe> => {
    const deadline = Date.now() + BUILD_TIMEOUT_MS;
    let remainingBytes = MAX_BUILD_BYTES;
    try {
      const assets: Record<string, string> = {};
      for (const path of paths) {
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0 || remainingBytes <= 0) throw new Error("Build check budget exceeded.");
        const bytes = await publicBytes(new URL(path, origin), path.endsWith(".js") ? "js" : "css",
          options.fetcher ?? fetch, Math.min(timeoutMs, remainingMs), Math.min(12_000_000, remainingBytes));
        remainingBytes -= bytes.length;
        assets[path] = createHash("sha256").update(bytes).digest("hex");
      }
      return { ok: true, snapshot: { identity: identity(paths), assets } };
    } catch {
      return { ok: false, reason: "Required public chunks could not be verified (HTTP, network, timeout, redirect, invalid content, or size limit)." };
    }
  }));
  if (!deployment.ok || !custom.ok) {
    return { status: "unavailable", message: "Required public build chunks are not verified as available.", deployment, custom };
  }
  const matching = JSON.stringify(deployment.snapshot) === JSON.stringify(custom.snapshot);
  return {
    status: matching ? "matching" : "mismatch",
    message: matching
      ? "All required public JavaScript and CSS chunks from the supplied build manifest are available and match across both origins. This does not verify authenticated screen behavior."
      : "Required public build chunk bytes differ across the two origins.",
    deployment, custom,
  };
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
