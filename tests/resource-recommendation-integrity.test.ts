import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import type { Request, Response } from "express";
import { disposablePostgres } from "./helpers/disposable-postgres";
import { recommendationInput } from "./fixtures/ai-recommendation";

const state = vi.hoisted(() => ({ db: undefined as any }));
const services = vi.hoisted(() => ({
  getResourceById: vi.fn(), getUser: vi.fn(),
  createAiRecommendation: vi.fn(), deleteResource: vi.fn(), notify: vi.fn(),
}));
// The workspace database and delivery services are never loaded.
vi.mock("../server/db", () => ({
  db: new Proxy({}, { get: (_, key) => state.db[key].bind(state.db) }), pool: {},
}));
vi.mock("../server/storage", () => ({ storage: services }));
vi.mock("../server/services/websocket", () => ({ sendNotificationToUser: services.notify }));
vi.mock("../server/services/email", () => ({
  sendProfessionalWelcomeEmail: vi.fn(), sendClientInvitation: vi.fn(),
}));
vi.mock("../server/services/openai", () => ({ analyzeJournalEntry: vi.fn() }));

import { AdminRepository } from "../server/repositories/admin.repository";
import { ResourcesRepository } from "../server/repositories/resources.repository";
import { ResourceReferencedError } from "../server/repositories/resource-reference-errors";
import { createAiRecommendation } from "../server/controllers/users.controller";
import { deleteResource } from "../server/controllers/resources.controller";

describe("saved recommendation resource integrity (disposable PostgreSQL)", () => {
  let fixture: Awaited<ReturnType<typeof disposablePostgres>>;
  const admin = new AdminRepository();
  const resources = new ResourcesRepository();
  const response = () => ({
    status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis(),
  });
  const request = () => ({
    params: { userId: "17", id: "3" }, user: { id: 42, role: "therapist" },
    body: recommendationInput,
  }) as unknown as Request;

  beforeAll(async () => {
    fixture = await disposablePostgres();
    state.db = drizzle(fixture.pool);
    // Only synthetic tables in our own cluster; no shared schema/data touched.
    await fixture.pool.query(`
      CREATE TABLE resources (id integer PRIMARY KEY, title text);
      CREATE TABLE resource_assignments (id serial PRIMARY KEY, resource_id integer);
      CREATE TABLE resource_feedback (id serial PRIMARY KEY, resource_id integer);
      CREATE TABLE ai_recommendations (
        id serial PRIMARY KEY, user_id integer NOT NULL, therapist_id integer NOT NULL,
        title text NOT NULL, content text NOT NULL, type text NOT NULL,
        status text NOT NULL DEFAULT 'pending', therapist_notes text, ai_reasoning text NOT NULL,
        related_data_type text DEFAULT 'none', related_data_id integer, suggested_resources jsonb,
        implementation_steps jsonb, created_at timestamp DEFAULT now(), approved_at timestamp,
        rejected_at timestamp, implemented_at timestamp
      );
      CREATE FUNCTION pause_write() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN PERFORM pg_advisory_xact_lock(551); RETURN NEW; END $$;
      CREATE FUNCTION pause_delete() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN PERFORM pg_advisory_xact_lock(551); RETURN OLD; END $$;
    `);
  }, 30_000);

  afterAll(async () => { await fixture?.close(); });

  beforeEach(async () => {
    vi.resetAllMocks();
    await fixture.pool.query(`
      DROP TRIGGER IF EXISTS pause_insert ON ai_recommendations;
      DROP TRIGGER IF EXISTS pause_resource_delete ON resources;
      TRUNCATE ai_recommendations, resource_assignments, resource_feedback, resources RESTART IDENTITY;
      INSERT INTO resources VALUES (3, 'Synthetic resource'), (9, 'Other synthetic resource');
      INSERT INTO resource_assignments(resource_id) VALUES (3), (9);
      INSERT INTO resource_feedback(resource_id) VALUES (3), (9);
    `);
    services.getUser.mockResolvedValue({ id: 17, role: "client", therapistId: 42, name: "Synthetic Client" });
    services.getResourceById.mockImplementation(async (id) => ({ id, createdBy: 42 }));
    services.createAiRecommendation.mockImplementation(data => admin.createAiRecommendation(data));
    services.deleteResource.mockImplementation(id => resources.deleteResource(id));
    services.notify.mockResolvedValue(undefined);
  });

  async function rows(table: string) {
    // Callers use only hardcoded fixture table names.
    return (await fixture.pool.query(`SELECT * FROM ${table} ORDER BY id`)).rows;
  }

  it.each(["pending", "approved", "rejected", "implemented"])(
    "blocks deletion for %s recommendations without changing any data", async status => {
      await admin.createAiRecommendation({ ...recommendationInput, status: status as any, suggestedResources: [3, 9, 3] });
      const tables = ["resources", "resource_assignments", "resource_feedback", "ai_recommendations"];
      const before = await Promise.all(tables.map(rows));
      await expect(resources.deleteResource(3)).rejects.toBeInstanceOf(ResourceReferencedError);
      expect(await Promise.all(tables.map(rows))).toEqual(before);
    },
  );

  it("returns a clear 409 from deletion instead of a generic server error", async () => {
    await admin.createAiRecommendation(recommendationInput);
    const res = response();
    await deleteResource(request(), res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining("saved recommendation") });
    expect(services.notify).not.toHaveBeenCalled();
  });

  it.each([null, [], [9], undefined])("allows deletion when references are unrelated or absent: %j", async suggestedResources => {
    const saved = await admin.createAiRecommendation({ ...recommendationInput, suggestedResources });
    await resources.deleteResource(3);
    expect((await rows("resources")).map(row => row.id)).toEqual([9]);
    expect((await rows("resource_assignments")).map(row => row.resource_id)).toEqual([9]);
    expect((await rows("resource_feedback")).map(row => row.resource_id)).toEqual([9]);
    expect((await rows("ai_recommendations"))[0].suggested_resources).toEqual(saved.suggestedResources);
  });

  it("allows deletion once the referencing recommendation is removed", async () => {
    const saved = await admin.createAiRecommendation(recommendationInput);
    await admin.deleteAiRecommendation(saved.id);
    await resources.deleteResource(3);
    await expect(resources.deleteResource(3)).resolves.toBeUndefined();
    expect((await rows("resources")).map(row => row.id)).toEqual([9]);
  });

  it("rejects missing resources even through a direct repository write", async () => {
    await expect(admin.createAiRecommendation({ ...recommendationInput, suggestedResources: [9, 404] }))
      .rejects.toMatchObject({ resourceId: 404 });
    expect(await rows("ai_recommendations")).toEqual([]);
  });

  it("rolls back assignment and feedback cleanup if resource deletion fails", async () => {
    await fixture.pool.query(`CREATE FUNCTION fail_delete() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Synthetic delete failure'; END $$;
      CREATE TRIGGER pause_resource_delete BEFORE DELETE ON resources FOR EACH ROW EXECUTE FUNCTION fail_delete();`);
    const tables = ["resources", "resource_assignments", "resource_feedback"];
    const before = await Promise.all(tables.map(rows));
    await expect(resources.deleteResource(3)).rejects.toThrow();
    expect(await Promise.all(tables.map(rows))).toEqual(before);
  });

  // Poll actual PostgreSQL lock state, not timing assumptions about promises.
  async function waitForLocks(count: number) {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const result = await fixture.pool.query(`SELECT count(*)::int AS count FROM pg_stat_activity
        WHERE application_name = 'synthetic-resource-integrity' AND wait_event_type = 'Lock'`);
      if (result.rows[0].count >= count) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`Expected ${count} blocked test operations`);
  }

  it.each(["creation", "deletion"] as const)("keeps integrity when %s acquires the resource lock first", async winner => {
    const gate = await fixture.pool.connect();
    const operations: Promise<unknown>[] = [];
    try {
      await gate.query("SELECT pg_advisory_lock(551)");
      await fixture.pool.query(winner === "creation"
        ? `CREATE TRIGGER pause_insert BEFORE INSERT ON ai_recommendations FOR EACH ROW EXECUTE FUNCTION pause_write()`
        : `CREATE TRIGGER pause_resource_delete BEFORE DELETE ON resources FOR EACH ROW EXECUTE FUNCTION pause_delete()`);
      const res = response();
      if (winner === "creation") {
        const saving = createAiRecommendation(request(), res as unknown as Response);
        operations.push(saving);
        await waitForLocks(1);
        const deleting = resources.deleteResource(3).catch(error => error);
        operations.push(deleting);
        await waitForLocks(2);
        await gate.query("SELECT pg_advisory_unlock(551)");
        await saving;
        expect(await deleting).toBeInstanceOf(ResourceReferencedError);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(services.notify).toHaveBeenCalledTimes(1);
        expect(await rows("ai_recommendations")).toHaveLength(1);
        expect((await rows("resources")).map(row => row.id)).toContain(3);
      } else {
        const deleting = resources.deleteResource(3);
        operations.push(deleting);
        await waitForLocks(1);
        // The controller's initial resource lookups still succeed (mocked).
        // Its real repository revalidation must reject after the delete commits.
        const saving = createAiRecommendation(request(), res as unknown as Response);
        operations.push(saving);
        await waitForLocks(2);
        await gate.query("SELECT pg_advisory_unlock(551)");
        await Promise.all([deleting, saving]);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "A suggested resource does not exist", resourceId: 3 });
        expect(services.notify).not.toHaveBeenCalled();
        expect(await rows("ai_recommendations")).toEqual([]);
        expect((await rows("resources")).map(row => row.id)).not.toContain(3);
      }
    } finally {
      await gate.query("SELECT pg_advisory_unlock_all()");
      gate.release();
      await Promise.allSettled(operations);
    }
  }, 15_000);
});
