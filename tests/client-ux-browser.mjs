// Fixture-based browser regression check. Does not authenticate or change real accounts.
// Run Chromium with --remote-debugging-port=9222, then node tests/client-ux-browser.mjs.
import WebSocket from "ws";
import assert from "node:assert/strict";

const origin = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://127.0.0.1:5000";
const target = await (await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.once("open", resolve));
let sequence = 0;
const pending = new Map();
let dialogs = 0;
let acceptDialog = false;
let saves = 0;
const user = { id: 999991, username: "ux-fixture", name: "UX Test", role: "client", status: "active", therapistId: 999992 };
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
ws.on("message", async raw => {
  const event = JSON.parse(raw.toString());
  if (event.id) {
    const callback = pending.get(event.id);
    pending.delete(event.id);
    if (event.error) callback?.reject(new Error(JSON.stringify(event.error)));
    else callback?.resolve(event.result);
    return;
  }
  if (event.method === "Page.javascriptDialogOpening") {
    dialogs++;
    await send("Page.handleJavaScriptDialog", { accept: acceptDialog });
  }
  if (event.method === "Fetch.requestPaused") {
    const { requestId, request } = event.params;
    const path = new URL(request.url).pathname;
    let body = [];
    let status = 200;
    if (path === "/api/auth/me") body = user;
    else if (path.includes("unread")) body = { count: 0 };
    else if (path.endsWith("/stats")) body = {};
    if (request.method !== "GET") {
      if (path.endsWith("/thoughts")) {
        saves++;
        status = saves === 1 ? 500 : 201;
        body = saves === 1 ? { message: "Test save failure" } : { id: 999993, userId: user.id, ...JSON.parse(request.postData), createdAt: new Date().toISOString() };
      } else {
        status = 400;
        body = { message: "Fixture test blocks all other writes" };
      }
    }
    await send("Fetch.fulfillRequest", { requestId, responseCode: status,
      responseHeaders: [{ name: "Content-Type", value: "application/json" }],
      body: Buffer.from(JSON.stringify(body)).toString("base64") });
  }
});
const evaluate = async expression => {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result?.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const wait = async expression => {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (await evaluate(expression)) return;
    await pause(100);
  }
  throw new Error(`Timed out: ${expression}\n${await evaluate("document.body.innerText")}`);
};
const clickText = async text => {
  const success = await evaluate(`(() => { const el = [...document.querySelectorAll('button,a')].find(el => el.offsetWidth && el.textContent.trim() === ${JSON.stringify(text)}); el?.click(); return !!el; })()`);
  assert(success, `Missing control: ${text}`);
  await pause(250);
};
const fill = async (selector, value) => {
  await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', {bubbles:true})); })()`);
  await pause(150);
};
const mouse = async selector => {
  const box = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...box });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...box });
  await pause(250);
};
try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }] });
  await send("Page.navigate", { url: `${origin}/thoughts` });
  await wait("!!document.querySelector('[data-testid=\"step-write-thought\"]') || document.body?.innerText.includes(\"What You'll Do Next\")");
  if (!await evaluate("!!document.querySelector('textarea')")) await clickText("Get Started");
  await wait("!!document.querySelector('textarea')");
  const thought = "I might struggle with tomorrow's presentation";
  await fill("textarea", thought);
  const history = '[role="tab"][value="history"],[role="tab"][id$="-trigger-history"]';
  await mouse(history);
  assert.equal(await evaluate("document.querySelector('textarea')?.value"), thought, "Cancelled pointer tab switch must preserve text");
  assert.equal(dialogs, 1, "One warning per cancelled pointer activation");
  await evaluate(`document.querySelector(${JSON.stringify(history)}).focus()`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await pause(200);
  assert.equal(await evaluate("document.querySelector('textarea')?.value"), thought);
  await evaluate("history.pushState({}, '', '/thoughts?test=back'); dispatchEvent(new PopStateEvent('popstate'))");
  await pause(200);
  assert.equal(await evaluate("document.querySelector('textarea')?.value"), thought);
  acceptDialog = true;
  await mouse(history);
  await wait("!document.querySelector('textarea')");
  console.log("PASS: pointer/keyboard/Back cancellation retains thought; accepted discard switches tab.");
  await send("Page.navigate", { url: `${origin}/thoughts` });
  await wait("!!document.querySelector('[data-testid=\"button-next-step\"]')");
  await evaluate("document.querySelector('[data-testid=\"button-next-step\"]').click()");
  await wait("!!document.querySelector('textarea')");
  await fill("textarea", thought);
  await clickText("Next Step");
  await clickText("Next Step");
  await wait("!!document.querySelector('[role=\"checkbox\"]')");
  await evaluate("document.querySelector('[role=\"checkbox\"]').click()");
  await clickText("Next Step");
  await wait("!!document.querySelector('textarea')");
  const situation = "Preparing slides for tomorrow's presentation at work";
  await fill("textarea", situation);
  await clickText("Next Step");
  await clickText("Next Step");
  await wait("!!document.querySelector('[data-testid=\"step-review-thought\"]')");
  assert((await evaluate("document.body.innerText")).includes(thought), "Review includes thought");
  assert((await evaluate("document.body.innerText")).includes(situation), "Review includes situation");
  await clickText("Save thought record");
  await pause(600);
  assert.equal(saves, 1, "First save request failed once");
  await wait("!document.querySelector('[data-testid=\"button-submit-wizard\"]').disabled");
  assert((await evaluate("document.body.innerText")).includes(thought), "Failed save retains review and writing");
  await clickText("Save thought record");
  await wait("document.body.innerText.includes('Thought Recorded Successfully!')");
  assert.equal(saves, 2, "One failed save and one deliberate retry");
  console.log("PASS: real review, failed save preserves writing, explicit retry succeeds.");
  await send("Page.navigate", { url: `${origin}/emotions` });
  await wait("!!document.querySelector('#emotion-search') || document.body.innerText.includes('Get Started')");
  if (!await evaluate("!!document.querySelector('#emotion-search')")) await clickText("Get Started");
  await wait("!!document.querySelector('#emotion-search')");
  await fill("#emotion-search", "Nervous");
  await wait("!!document.querySelector('[role=\"option\"]')");
  await evaluate("document.querySelector('[role=\"option\"]').click()");
  assert((await evaluate("document.body.innerText")).includes("Nervous"), "Search must select exact emotion");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await pause(200);
  assert(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Mobile must not overflow");
  console.log("PASS: exact Nervous search selection and mobile width.");
} finally {
  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
}
