import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";

test("production serves the current build HTML and its hashed assets, including nested routes", async ({ request }) => {
  test.skip(process.env.E2E_PRODUCTION_BUILD !== "1", "Only applies to built production assets");
  const manifest = JSON.parse(await readFile("package.json", "utf8"));
  const serverEntry = manifest.scripts.start.match(/\bnode\s+(\S+)/)?.[1];
  const output = manifest.scripts.build.match(/--outdir=(\S+)/)?.[1];
  expect(serverEntry).toBeTruthy();
  expect(output).toBeTruthy();
  await access(path.resolve(serverEntry));
  expect(path.dirname(path.resolve(serverEntry))).toBe(path.resolve(output));
  // This is the default serveStatic location relative to the compiled entry.
  // A separate stale server-dist/public tree must never satisfy this check.
  expect(path.resolve(path.dirname(serverEntry), "public")).toBe(path.resolve("dist/public"));
  const builtHtml = await readFile(path.resolve("dist/public/index.html"), "utf8");
  for (const route of ["/", "/thoughts"]) {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.text()).toBe(builtHtml);
  }
  const entry = builtHtml.match(/<script[^>]+src="(\/assets\/[^"]+\.js)"/)?.[1];
  expect(entry).toBeTruthy();
  const asset = await request.get(entry!);
  expect(asset.status()).toBe(200);
  expect(asset.headers()["cache-control"]).toContain("immutable");
  expect(asset.headers()["content-type"]).toContain("javascript");
});
