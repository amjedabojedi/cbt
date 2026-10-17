import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { aiRecommendations } from "@shared/schema";
import { recommendation, recommendationInput } from "./fixtures/ai-recommendation";

const db = vi.hoisted(() => ({
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

// The real database module is never evaluated, so no credentials or connection
// are needed, even when DATABASE_URL is absent.
vi.mock("../server/db", () => ({ db }));

import { AdminRepository } from "../server/repositories/admin.repository";

describe("AdminRepository AI recommendation persistence contract", () => {
  const dialect = new PgDialect();
  const now = new Date("2026-02-03T04:05:06Z");
  let repository: AdminRepository;
  let query: {
    values: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    returning: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(console, "log").mockImplementation(() => {});
    repository = new AdminRepository();
    query = {
      values: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    };
    for (const operation of Object.values(db)) operation.mockReturnValue(query);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function expectWhere(sql: string, params: unknown[]) {
    expect(query.where).toHaveBeenCalledTimes(1);
    expect(dialect.sqlToQuery(query.where.mock.calls[0][0] as SQL)).toMatchObject({ sql, params });
  }

  function expectNewestFirst() {
    expect(query.orderBy).toHaveBeenCalledTimes(1);
    expect(query.orderBy.mock.calls[0]).toHaveLength(1);
    expect(dialect.sqlToQuery(query.orderBy.mock.calls[0][0] as SQL)).toMatchObject({
      sql: '"ai_recommendations"."created_at" desc',
      params: [],
    });
  }

  it("inserts the original payload and returns the first created row unchanged", async () => {
    query.returning.mockResolvedValue([recommendation, { ...recommendation, id: 82 }]);

    expect(await repository.createAiRecommendation(recommendationInput)).toBe(recommendation);
    expect(db.insert).toHaveBeenCalledExactlyOnceWith(aiRecommendations);
    expect(query.values).toHaveBeenCalledExactlyOnceWith(recommendationInput);
    expect(query.values.mock.calls[0][0]).toBe(recommendationInput);
    expect(query.returning).toHaveBeenCalledExactlyOnceWith();
  });

  it.each([true, false])("looks up by recommendation ID (found: %s)", async (found) => {
    query.where.mockResolvedValue(found ? [recommendation, { ...recommendation, id: 82 }] : []);

    expect(await repository.getAiRecommendationById(81)).toBe(found ? recommendation : undefined);
    expect(db.select).toHaveBeenCalledExactlyOnceWith();
    expect(query.from).toHaveBeenCalledExactlyOnceWith(aiRecommendations);
    expectWhere('"ai_recommendations"."id" = $1', [81]);
  });

  for (const method of [
    "getAiRecommendationsByUser",
    "getPendingAiRecommendationsByProfessional",
    "getPendingAiRecommendationsByTherapist",
  ] as const) {
    it.each([true, false])(`${method} filters, sorts, and preserves rows (empty: %s)`, async (empty) => {
      const rows = empty ? [] : [recommendation, { ...recommendation, id: 82 }];
      query.orderBy.mockResolvedValue(rows);
      const isUserListing = method === "getAiRecommendationsByUser";

      expect(await repository[method](isUserListing ? 17 : 42)).toBe(rows);
      expect(db.select).toHaveBeenCalledExactlyOnceWith();
      expect(query.from).toHaveBeenCalledExactlyOnceWith(aiRecommendations);
      expectWhere(
        isUserListing
          ? '"ai_recommendations"."user_id" = $1'
          : '("ai_recommendations"."therapist_id" = $1 and "ai_recommendations"."status" = $2)',
        isUserListing ? [17] : [42, "pending"],
      );
      expectNewestFirst();
    });
  }

  it("the therapist listing delegates to the professional listing and preserves its result", async () => {
    const rows = [recommendation];
    const professional = vi.spyOn(repository, "getPendingAiRecommendationsByProfessional")
      .mockResolvedValue(rows);

    expect(await repository.getPendingAiRecommendationsByTherapist(42)).toBe(rows);
    expect(professional).toHaveBeenCalledExactlyOnceWith(42);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("the therapist listing preserves the professional listing's original error", async () => {
    const error = new Error("Professional listing failed");
    const professional = vi.spyOn(repository, "getPendingAiRecommendationsByProfessional")
      .mockRejectedValue(error);

    await expect(repository.getPendingAiRecommendationsByTherapist(42)).rejects.toBe(error);
    expect(professional).toHaveBeenCalledExactlyOnceWith(42);
    expect(db.select).not.toHaveBeenCalled();
  });

  for (const [status, timestamp] of [
    ["pending", undefined],
    ["approved", "approvedAt"],
    ["rejected", "rejectedAt"],
    ["implemented", "implementedAt"],
  ] as const) {
    it.each([undefined, "Discussed in session", ""])(
      `updates ${status} with notes %j and only its applicable timestamp`,
      async (notes) => {
        const updated = { ...recommendation, status, therapistNotes: notes ?? null };
        query.returning.mockResolvedValue([updated, recommendation]);

        const result = notes === undefined
          ? await repository.updateAiRecommendationStatus(81, status)
          : await repository.updateAiRecommendationStatus(81, status, notes);

        expect(result).toBe(updated);
        expect(db.update).toHaveBeenCalledExactlyOnceWith(aiRecommendations);
        // Existing semantics: omitted or empty notes leave stored notes untouched.
        expect(query.set).toHaveBeenCalledExactlyOnceWith({
          status,
          ...(timestamp ? { [timestamp]: now } : {}),
          ...(notes ? { therapistNotes: notes } : {}),
        });
        expectWhere('"ai_recommendations"."id" = $1', [81]);
        expect(query.returning).toHaveBeenCalledExactlyOnceWith();
      },
    );
  }

  it("deletes by ID, awaits completion, and returns void rather than the database result", async () => {
    let finish!: (result: unknown) => void;
    query.where.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const completed = vi.fn();
    const deletion = repository.deleteAiRecommendation(81).then(completed);

    await Promise.resolve();
    expect(completed).not.toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalledExactlyOnceWith(aiRecommendations);
    expectWhere('"ai_recommendations"."id" = $1', [81]);
    finish({ rowCount: 1 });
    await deletion;
    expect(completed).toHaveBeenCalledExactlyOnceWith(undefined);
  });

  const errorCases = [
    { name: "create", terminal: "returning", invoke: (repo: AdminRepository) => repo.createAiRecommendation(recommendationInput) },
    { name: "lookup", terminal: "where", invoke: (repo: AdminRepository) => repo.getAiRecommendationById(81) },
    { name: "user listing", terminal: "orderBy", invoke: (repo: AdminRepository) => repo.getAiRecommendationsByUser(17) },
    { name: "professional pending listing", terminal: "orderBy", invoke: (repo: AdminRepository) => repo.getPendingAiRecommendationsByProfessional(42) },
    { name: "therapist pending listing", terminal: "orderBy", invoke: (repo: AdminRepository) => repo.getPendingAiRecommendationsByTherapist(42) },
    { name: "status update", terminal: "returning", invoke: (repo: AdminRepository) => repo.updateAiRecommendationStatus(81, "rejected", "Review notes") },
    { name: "delete", terminal: "where", invoke: (repo: AdminRepository) => repo.deleteAiRecommendation(81) },
  ] as const;

  for (const { name, terminal, invoke } of errorCases) {
    it(`${name} propagates the original database error`, async () => {
      const error = new Error("Database operation failed");
      query[terminal].mockRejectedValue(error);

      await expect(invoke(repository)).rejects.toBe(error);
    });
  }
});
