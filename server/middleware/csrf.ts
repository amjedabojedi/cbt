import { Request, Response, NextFunction } from "express";

/**
 * CSRF defense via Origin / Referer verification.
 *
 * The session cookie uses `SameSite=None` so it can be sent from the Replit
 * preview iframe. That makes the app vulnerable to CSRF unless we explicitly
 * verify the request origin on every state-changing call.
 *
 * Rules:
 *   - Safe methods (GET, HEAD, OPTIONS) are not checked.
 *   - For POST/PUT/PATCH/DELETE, the Origin (or Referer) host must match the
 *     request's own Host header (or x-forwarded-host), OR be in the allowlist.
 *   - Requests with no Origin AND no Referer are rejected (browser-issued CSRF
 *     attacks always include at least Referer).
 *
 * Allowlist sources (checked at startup):
 *   - CSRF_ALLOWED_ORIGINS env var (comma-separated full origins or hosts)
 *   - REPLIT_DOMAINS env var (the Replit-provided deployment domain(s))
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getAllowedHosts(): Set<string> {
  const fromEnv = (process.env.CSRF_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).host;
      } catch {
        return origin;
      }
    });

  // Always include Replit-provided domains so the deployed production app
  // can make authenticated requests (the public domain differs from the
  // internal Host header which Express sees as localhost:5000).
  const replitDomains = (process.env.REPLIT_DOMAINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return new Set([...fromEnv, ...replitDomains]);
}

const allowlist = getAllowedHosts();

export function verifyOrigin(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  // Bypass CSRF check for native mobile app requests (not in a browser context)
  if (
    req.headers["x-requested-with"] === "ResilienceHub-Mobile" ||
    req.headers["x-app-platform"] === "mobile"
  ) {
    return next();
  }

  const origin = (req.headers.origin as string | undefined) || "";
  const referer = (req.headers.referer as string | undefined) || "";
  const source = origin || referer;

  if (!source) {
    return res.status(403).json({ message: "Origin header required" });
  }

  let sourceHost: string;
  try {
    sourceHost = new URL(source).host;
  } catch {
    return res.status(403).json({ message: "Invalid origin" });
  }

  // x-forwarded-host may be comma-separated; take the first (client-facing) value.
  const rawForwardedHost = req.headers["x-forwarded-host"] as string | undefined;
  const forwardedHost = rawForwardedHost?.split(",")[0]?.trim() || "";
  const expectedHost = forwardedHost || req.headers.host || "";

  if (sourceHost === expectedHost) return next();
  if (allowlist.has(sourceHost)) return next();

  console.warn(`[CSRF] Blocked: source=${sourceHost} expected=${expectedHost}`);
  return res.status(403).json({ message: "Cross-origin request blocked" });
}
