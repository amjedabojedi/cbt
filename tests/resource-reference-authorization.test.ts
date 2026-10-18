import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { drizzle } from "drizzle-orm/node-postgres";
import { disposablePostgres } from "./helpers/disposable-postgres";

const state = vi.hoisted(() => ({ db: undefined as any }));
const storage = vi.hoisted(() => ({
  getSessionById: vi.fn(), getUser: vi.fn(), deleteSession: vi.fn(),
  getResourceById: vi.fn(), getResourceRecommendationReferences: vi.fn(), deleteResource: vi.fn(),
}));
const notify = vi.hoisted(() => vi.fn());
vi.mock("../server/storage", () => ({ storage }));
// Never load workspace database credentials or delivery services.
vi.mock("../server/db", () => ({
  db: new Proxy({}, { get: (_, key) => state.db[key].bind(state.db) }), pool: {},
}));
vi.mock("../server/services/websocket", () => ({ sendNotificationToUser: notify }));
vi.mock("../server/services/email", () => ({
  sendProfessionalWelcomeEmail: vi.fn(), sendClientInvitation: vi.fn(),
}));

import router from "../server/routes/resources.routes";
import { ResourcesRepository } from "../server/repositories/resources.repository";

describe("resource reference summaries (synthetic authorization, disposable PostgreSQL)", () => {
  let fixture: Awaited<ReturnType<typeof disposablePostgres>>;
  const repo = new ResourcesRepository();
  const app = express();
  app.use("/api", router);
  const path = "/api/resources/3/recommendation-references";
  let sequence = 0;
  let session: string;

  function signIn(role = "therapist", id = 42) {
    storage.getSessionById.mockResolvedValue({
      id: session, userId: id, expiresAt: new Date(Date.now() + 60_000),
    });
    storage.getUser.mockResolvedValue({ id, role });
    return `sessionId=${session}`;
  }

  beforeAll(async () => {
    fixture = await disposablePostgres();
    state.db = drizzle(fixture.pool);
    await fixture.pool.query(`
      CREATE TABLE users (id integer PRIMARY KEY, therapist_id integer);
      CREATE TABLE resources (id integer PRIMARY KEY);
      CREATE TABLE resource_assignments (id integer PRIMARY KEY, resource_id integer);
      CREATE TABLE resource_feedback (id integer PRIMARY KEY, resource_id integer);
      CREATE TABLE ai_recommendations (
        id serial PRIMARY KEY, user_id integer, therapist_id integer, status text,
        created_at timestamp DEFAULT '2026-01-01', suggested_resources jsonb,
        title text DEFAULT 'PRIVATE TITLE', content text DEFAULT 'PRIVATE CONTENT',
        therapist_notes text DEFAULT 'PRIVATE NOTES', ai_reasoning text DEFAULT 'PRIVATE REASONING'
      );
    `);
  }, 30_000);
  afterAll(async () => { await fixture?.close(); });
  beforeEach(async () => {
    vi.resetAllMocks();
    session = `synthetic-resource-reference-${++sequence}`;
    await fixture.pool.query(`
      TRUNCATE users, resources, resource_assignments, resource_feedback, ai_recommendations RESTART IDENTITY;
      INSERT INTO users VALUES (17,42), (18,43), (19,42);
      INSERT INTO resources VALUES (3), (9);
      INSERT INTO resource_assignments VALUES (1,3);
      INSERT INTO resource_feedback VALUES (1,3);
      INSERT INTO ai_recommendations(user_id,therapist_id,status,suggested_resources) VALUES
        (17,42,'pending','[3,3]'), (17,42,'approved','[3]'),
        (19,43,'rejected','[3]'), (19,43,'implemented','[3]'),
        (18,42,'pending','[3]'), (18,43,'approved','[9]'),
        (17,42,'approved',null), (17,42,'approved','[]');
    `);
    storage.getResourceById.mockImplementation(async id => id === 3 ? { id, createdBy: 42 } : undefined);
    storage.getResourceRecommendationReferences.mockImplementation((id, viewer) => repo.getResourceRecommendationReferences(id, viewer));
    storage.deleteResource.mockImplementation(id => repo.deleteResource(id));
  });

  it("rejects signed-out callers before storage access", async () => {
    expect((await request(app).get(path)).status).toBe(401);
    expect(storage.getResourceById).not.toHaveBeenCalled();
    expect(storage.getResourceRecommendationReferences).not.toHaveBeenCalled();
  });

  it.each(["client", "unknown"])("rejects %s callers without looking up resources", async role => {
    expect((await request(app).get(path).set("Cookie", signIn(role))).status).toBe(403);
    expect(storage.getResourceById).not.toHaveBeenCalled();
    expect(storage.getResourceRecommendationReferences).not.toHaveBeenCalled();
  });

  it("rejects a different resource creator before reading references", async () => {
    expect((await request(app).get(path).set("Cookie", signIn("therapist", 43))).status).toBe(403);
    expect(storage.getResourceRecommendationReferences).not.toHaveBeenCalled();
  });

  it.each(["3x", "0", "-1", "3.5", "2147483648"])("rejects malformed resource ID %s", async id => {
    expect((await request(app).get(`/api/resources/${id}/recommendation-references`).set("Cookie", signIn())).status).toBe(400);
    expect(storage.getResourceById).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing resource", async () => {
    expect((await request(app).get("/api/resources/404/recommendation-references").set("Cookie", signIn())).status).toBe(404);
    expect(storage.getResourceRecommendationReferences).not.toHaveBeenCalled();
  });

  it("uses current client assignment, includes all statuses, and exposes only safe metadata", async () => {
    const res = await request(app).get(path).set("Cookie", signIn());
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.body).toEqual({
      hasReferences: true, hasMore: false,
      references: ["implemented", "rejected", "approved", "pending"].map((status, index) => ({
        id: 4 - index, status, createdAt: "2026-01-01T00:00:00.000Z",
      })),
    });
    expect(JSON.stringify(res.body)).not.toContain("PRIVATE");
    expect(notify).not.toHaveBeenCalled();
  });

  it("lets admins see all referencing recommendations but still no clinical content", async () => {
    const res = await request(app).get(path).set("Cookie", signIn("admin", 99));
    expect(res.status).toBe(200);
    expect(res.body.references.map((r: any) => r.id)).toEqual([5, 4, 3, 2, 1]);
    expect(res.body.references.every((r: any) => Object.keys(r).sort().join() === "createdAt,id,status")).toBe(true);
  });

  it("keeps hidden references anonymous and blocks deletion without changing history", async () => {
    await fixture.pool.query("UPDATE users SET therapist_id = 43");
    const cookie = signIn();
    const res = await request(app).get(path).set("Cookie", cookie);
    expect(res.body).toEqual({ hasReferences: true, references: [], hasMore: false });
    const before = (await fixture.pool.query("SELECT * FROM ai_recommendations ORDER BY id")).rows;
    expect((await request(app).delete("/api/resources/3").set("Cookie", cookie)).status).toBe(409);
    expect((await fixture.pool.query("SELECT * FROM ai_recommendations ORDER BY id")).rows).toEqual(before);
    expect((await fixture.pool.query("SELECT * FROM resource_assignments")).rowCount).toBe(1);
    expect((await fixture.pool.query("SELECT * FROM resource_feedback")).rowCount).toBe(1);
    expect(notify).not.toHaveBeenCalled();
  });

  it("refreshes scope after client reassignment", async () => {
    const cookie = signIn();
    expect((await request(app).get(path).set("Cookie", cookie)).body.references).toHaveLength(4);
    await fixture.pool.query("UPDATE users SET therapist_id = 43 WHERE id = 17");
    expect((await request(app).get(path).set("Cookie", cookie)).body.references.map((r: any) => r.id)).toEqual([4, 3]);
  });

  it("reports no references when only unrelated, null, or empty links remain", async () => {
    await fixture.pool.query("DELETE FROM ai_recommendations WHERE id <= 5");
    expect((await request(app).get(path).set("Cookie", signIn())).body)
      .toEqual({ hasReferences: false, references: [], hasMore: false });
  });

  it("limits visible metadata without counting hidden records", async () => {
    await fixture.pool.query(`INSERT INTO ai_recommendations(user_id,status,suggested_resources)
      SELECT 17,'approved','[3]'::jsonb FROM generate_series(1,60)`);
    const res = await request(app).get(path).set("Cookie", signIn());
    expect(res.body.references).toHaveLength(50);
    expect(res.body.hasMore).toBe(true);
    expect(Object.keys(res.body).sort()).toEqual(["hasMore", "hasReferences", "references"]);
  });

  it("fails safely without leaking private errors", async () => {
    storage.getResourceRecommendationReferences.mockRejectedValue(new Error("PRIVATE DATABASE DETAIL"));
    const res = await request(app).get(path).set("Cookie", signIn());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Failed to fetch recommendation references" });
    expect(notify).not.toHaveBeenCalled();
  });
});
