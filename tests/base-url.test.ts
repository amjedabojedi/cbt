import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import { getSafeBaseUrl } from "../server/services/baseUrl";

function request(host = "attacker.example", forwardedHost?: string): Request {
  return {
    headers: { "x-forwarded-host": forwardedHost },
    get: () => host,
    protocol: "https",
  } as unknown as Request;
}

describe("trusted email link base URL", () => {
  beforeEach(() => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("REPLIT_DOMAINS", "");
    vi.stubEnv("ALLOWED_HOSTS", "");
    vi.stubEnv("NODE_ENV", "production");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("prefers the configured URL over request headers", () => {
    vi.stubEnv("APP_URL", " https://app.example ");
    expect(getSafeBaseUrl(request())).toBe("https://app.example");
  });

  it("uses the first configured Replit domain", () => {
    vi.stubEnv("REPLIT_DOMAINS", "app.example,other.example");
    expect(getSafeBaseUrl(request())).toBe("https://app.example");
  });

  it("rejects arbitrary Host and forwarded host headers", () => {
    expect(() => getSafeBaseUrl(request())).toThrow("Set APP_URL");
    expect(() => getSafeBaseUrl(request("attacker.example", "other-attacker.example"))).toThrow("Set APP_URL");
  });

  it("accepts only explicitly allowed hosts, including forwarded hosts", () => {
    vi.stubEnv("ALLOWED_HOSTS", "app.example");
    expect(getSafeBaseUrl(request("app.example", "attacker.example"))).toBe("https://app.example");
    expect(getSafeBaseUrl(request("internal.example", "app.example"))).toBe("https://app.example");
    expect(() => getSafeBaseUrl(request("app.example.attacker.example"))).toThrow("Set APP_URL");
  });

  it("does not accept localhost in production", () => {
    expect(() => getSafeBaseUrl(request("localhost:5000"))).toThrow("Set APP_URL");
  });

  it("keeps local development links working", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getSafeBaseUrl(request("localhost:5000"))).toBe("http://localhost:5000");
  });
});
