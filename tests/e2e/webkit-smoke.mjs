// Offline rendering, not just browser-process startup. No app or database involved.
import assert from "node:assert/strict";
import { webkit } from "@playwright/test";
import { browserCache } from "./setup-webkit.mjs";

assert.equal(process.env.PLAYWRIGHT_BROWSERS_PATH, browserCache, "Use npm run setup:e2e:webkit");
const browser = await webkit.launch({ headless: true, timeout: 30_000 });
try {
  const page = await browser.newPage();
  await page.route("**/*", route => route.abort("blockedbyclient"));
  page.setDefaultTimeout(15_000);
  await page.setContent(`<style>body { background: white } #proof { width: 160px; height: 60px; background: rgb(10, 80, 160) }</style>
    <div id="proof">WebKit rendering</div><canvas id="canvas" width="2" height="2"></canvas>`);
  assert.equal(await page.locator("#proof").innerText(), "WebKit rendering");
  assert.equal((await page.locator("#proof").boundingBox()).width, 160);
  assert.equal(await page.evaluate(() => {
    const context = document.querySelector("canvas").getContext("2d");
    context.fillStyle = "#ff0000";
    context.fillRect(0, 0, 2, 2);
    return context.getImageData(0, 0, 1, 1).data[0];
  }), 255);
  const screenshot = await page.screenshot({ timeout: 15_000 });
  assert.ok(screenshot.length > 1000, "WebKit must paint a nonempty page");
  console.log("WebKit page creation, layout, canvas and PNG rendering passed (offline).");
} finally {
  await browser.close();
}
