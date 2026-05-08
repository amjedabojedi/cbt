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
 *     request's own Host header, OR be in the `CSRF_ALLOWED_ORIGINS` allowlist.
 *   - Requests with no Origin AND no Referer are rejected (browser-issued CSRF
 *     attacks always include at least Referer).
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
  return new Set(fromEnv);
}

const allowlist = getAllowedHosts();

export function verifyOrigin(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

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

  const expectedHost = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";

  if (sourceHost === expectedHost) return next();
  if (allowlist.has(sourceHost)) return next();

  return res.status(403).json({ message: "Cross-origin request blocked" });
}
