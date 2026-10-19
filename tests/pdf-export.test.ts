import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { spawnSync } from "node:child_process";

const storage = vi.hoisted(() => ({
  getSessionById: vi.fn(), getUser: vi.fn(), deleteSession: vi.fn(),
  getEmotionRecordsByUser: vi.fn(), getThoughtRecordsByUser: vi.fn(),
  getJournalEntriesByUser: vi.fn(), getGoalsByUser: vi.fn(),
}));
// No database or delivery module is loaded: all accounts and records are disposable.
vi.mock("../server/storage", () => ({ storage }));
import router from "../server/routes/export.routes";

const app = express();
app.use("/api/export", router);
// Simulate the real SPA fallback, which must never answer the PDF entry point.
app.use((_req, res) => res.type("html").send("<html>app shell</html>"));
const users = new Map<number, any>();
let sequence = 0;
function signIn(id = 17) {
  const session = `synthetic-pdf-${++sequence}`;
  storage.getSessionById.mockResolvedValue({ id: session, userId: id, expiresAt: new Date(Date.now() + 60_000) });
  return `sessionId=${session}`;
}
function pdfText(bytes: Buffer) {
  const result = spawnSync("pdftotext", ["-", "-"], { input: bytes });
  if (result.error || result.status !== 0) throw new Error("PDF text extraction failed");
  return result.stdout.toString();
}
function download(query = "", cookie = signIn()) {
  return request(app).get(`/api/export/pdf${query}`).set("Cookie", cookie)
    .buffer(true).parse((res, done) => {
      const chunks: Buffer[] = [];
      res.on("data", chunk => chunks.push(Buffer.from(chunk)));
      res.on("end", () => done(null, Buffer.concat(chunks)));
    });
}
const getters = [
  "getEmotionRecordsByUser", "getThoughtRecordsByUser",
  "getJournalEntriesByUser", "getGoalsByUser",
] as const;
beforeEach(() => {
  vi.resetAllMocks();
  users.clear();
  for (const user of [
    { id: 17, name: "Synthetic owner", role: "client", therapistId: 42 },
    { id: 18, name: "Synthetic other client", role: "client", therapistId: 43 },
    { id: 42, name: "Synthetic assigned", role: "therapist" },
    { id: 43, name: "Synthetic unrelated", role: "therapist" },
    { id: 99, name: "Synthetic admin", role: "admin" },
    { id: 100, name: "Synthetic unknown", role: "unknown" },
  ]) users.set(user.id, user);
  storage.getUser.mockImplementation(async id => users.get(id));
  for (const getter of getters) storage[getter].mockResolvedValue([]);
});

describe("PDF response and authorized subject", () => {
  it("does not send the SPA to an unauthenticated caller", async () => {
    const result = await request(app).get("/api/export/pdf?type=all");
    expect(result.status).toBe(401);
    expect(result.type).toBe("application/json");
    expect(result.headers["cache-control"]).toContain("no-store");
    for (const getter of getters) expect(storage[getter]).not.toHaveBeenCalled();
  });
  it.each([17, 42, 99])("allows owner/assigned therapist/admin %s for a client", async id => {
    const result = await download("?clientId=17&type=all&period=month", signIn(id));
    expect(result.status).toBe(200);
    expect(result.type).toBe("application/pdf");
    expect(result.headers["content-disposition"]).toContain('resiliencehub-all-month.pdf');
    expect(result.headers["cache-control"]).toContain("no-store");
    expect(result.body.subarray(0, 5).toString()).toBe("%PDF-");
    expect(result.body.subarray(-6).toString()).toContain("%%EOF");
    const text = pdfText(result.body);
    expect(text).toContain("Subject: Synthetic owner (ID: 17)");
    expect(text).toContain("Past Month (30 days)");
    expect(text).not.toContain("Synthetic assigned");
    expect(text).not.toContain("Synthetic admin");
    for (const getter of getters) expect(storage[getter]).toHaveBeenCalledExactlyOnceWith(17);
  });
  it.each([
    [17, 18], [43, 17], [42, 43], [99, 42], [100, 17],
  ])("denies actor %s access to subject %s before reading records", async (actor, subject) => {
    expect((await download(`?clientId=${subject}`, signIn(actor))).status).toBe(403);
    for (const getter of getters) expect(storage[getter]).not.toHaveBeenCalled();
  });
  it("defaults to the authenticated owner, not an implicit viewing-client setting", async () => {
    users.get(42).currentViewingClientId = 17;
    const result = await download("", signIn(42));
    expect(pdfText(result.body)).toContain("Subject: Synthetic assigned (ID: 42)");
    for (const getter of getters) expect(storage[getter]).toHaveBeenCalledExactlyOnceWith(42);
  });
  it("rechecks current client assignment and actor role on every export", async () => {
    const cookie = signIn(42);
    expect((await download("?clientId=17", cookie)).status).toBe(200);
    users.get(17).therapistId = 43;
    expect((await download("?clientId=17", cookie)).status).toBe(403);
    users.get(17).therapistId = 42;
    users.set(42, { ...users.get(42), role: "client" });
    expect((await download("?clientId=17", cookie)).status).toBe(403);
  });
  it.each([
    "?type=unknown", "?period=year", "?clientId=17x", "?clientId=0",
    "?clientId=-1", "?clientId=1.5", "?clientId=2147483648",
    "?clientId=17&clientId=18", "?period=week&period=all",
    "?userId=18", "?targetUserId=18",
  ])("rejects malformed/ambiguous options %s", async query => {
    expect((await download(query)).status).toBe(400);
    for (const getter of getters) expect(storage[getter]).not.toHaveBeenCalled();
  });
  it("returns a non-PDF error for a missing client", async () => {
    expect((await download("?clientId=404", signIn(99))).status).toBe(404);
    for (const getter of getters) expect(storage[getter]).not.toHaveBeenCalled();
  });
  it("does not return a partial successful file or expose private errors on failure", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    storage.getJournalEntriesByUser.mockRejectedValue(new Error("PRIVATE synthetic journal contents"));
    const result = await download();
    expect(result.status).toBe(500);
    expect(result.type).toBe("application/json");
    expect(result.headers["content-disposition"]).toBeUndefined();
    expect(JSON.parse(result.body.toString())).toEqual({ message: "Failed to generate PDF report" });
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});

describe("readable report data and reporting periods", () => {
  beforeEach(() => {
    for (const [days, label] of [[2, "RECENT"], [12, "MONTH"], [45, "OLDER"]] as const) {
      const date = new Date(Date.now() - days * 86_400_000);
      // Each list deliberately contains different dates, so no section can skip filtering.
      for (const [getter, record] of [
        ["getEmotionRecordsByUser", { timestamp: date, coreEmotion: `Fear ${label}`, intensity: 4, situation: `Situation ${label}` }],
        ["getThoughtRecordsByUser", { createdAt: date, automaticThoughts: `Thought ${label}`, cognitiveDistortions: [], evidenceFor: `Evidence ${label}` }],
        ["getJournalEntriesByUser", { createdAt: date, title: `Journal ${label}`, content: `Readable journal ${label}` }],
        ["getGoalsByUser", { createdAt: date, title: `Goal ${label}`, status: "pending", specific: `Walk ${label}` }],
      ] as const) {
        const previous = storage[getter].getMockImplementation()!;
        storage[getter].mockImplementation(async () => [...await previous(), record]);
      }
    }
  });
  it.each(["week", "month", "all"])("includes only the promised %s records in every section", async period => {
    const result = await download(`?type=all&period=${period}`);
    expect(result.status).toBe(200);
    const text = pdfText(result.body);
    for (const prefix of ["Situation", "Thought", "Readable journal", "Goal"]) {
      expect(text).toContain(`${prefix} RECENT`);
      expect(text.includes(`${prefix} MONTH`)).toBe(period !== "week");
      expect(text.includes(`${prefix} OLDER`)).toBe(period === "all");
    }
  });
  it.each(["emotions", "thoughts", "journals", "goals"])("supports the existing %s data selection", async type => {
    const result = await download(`?type=${type}`);
    expect(result.status).toBe(200);
    expect(result.type).toBe("application/pdf");
    expect(getters.filter(getter => storage[getter].mock.calls.length > 0)).toHaveLength(1);
    expect(pdfText(result.body)).toContain("RECENT");
  });
  it("does not silently truncate records or long journal writing", async () => {
    storage.getJournalEntriesByUser.mockResolvedValue(
      Array.from({ length: 14 }, (_, index) => ({
        createdAt: new Date(), title: `Synthetic journal ${index}`,
        content: `${"Synthetic long journal paragraph. ".repeat(120)} END-OF-RECORD-${index}`,
      })),
    );
    const text = pdfText((await download("?type=journals")).body);
    for (let index = 0; index < 14; index++) expect(text).toContain(`END-OF-RECORD-${index}`);
  });
});
