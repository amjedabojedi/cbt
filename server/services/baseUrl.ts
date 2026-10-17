import type { Request } from "express";

/** Token-bearing email links must never trust an arbitrary request host. */
export function getSafeBaseUrl(req: Request): string {
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) return appUrl;

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (domain) return `https://${domain}`;

  const allowedHosts = (process.env.ALLOWED_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  const forwarded = req.headers["x-forwarded-host"];
  const forwardedHost = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : "";
  const candidates = [forwardedHost, req.get("host") || ""];

  for (const host of candidates) {
    if (!host || !/^[a-zA-Z0-9.-]+(:\d+)?$/.test(host)) continue;
    const hostname = host.split(":")[0].toLowerCase();
    if (allowedHosts.includes(hostname)) return `https://${host}`;
    if (
      process.env.NODE_ENV !== "production" &&
      (hostname === "localhost" || hostname === "127.0.0.1")
    ) {
      return `http://${host}`;
    }
  }

  throw new Error("Set APP_URL or configure an allowed host for email links");
}
