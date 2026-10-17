import { beforeEach, describe, expect, it, vi } from "vitest";
import { recommendation, recommendationInput } from "./fixtures/ai-recommendation";

const admin = vi.hoisted(() => ({
  createAiRecommendation: vi.fn(),
  getAiRecommendationById: vi.fn(),
  getAiRecommendationsByUser: vi.fn(),
  getPendingAiRecommendationsByProfessional: vi.fn(),
  getPendingAiRecommendationsByTherapist: vi.fn(),
  updateAiRecommendationStatus: vi.fn(),
  deleteAiRecommendation: vi.fn(),
}));

vi.mock("../server/repositories/admin.repository", () => ({
  AdminRepository: class { constructor() { return admin; } },
}));
vi.mock("../server/repositories/users.repository", () => ({ UsersRepository: class {} }));
vi.mock("../server/repositories/therapy.repository", () => ({ TherapyRepository: class {} }));
vi.mock("../server/repositories/goals.repository", () => ({ GoalsRepository: class {} }));
vi.mock("../server/repositories/journal.repository", () => ({ JournalRepository: class {} }));
vi.mock("../server/repositories/resources.repository", () => ({ ResourcesRepository: class {} }));
vi.mock("../server/repositories/billing.repository", () => ({ BillingRepository: class {} }));
vi.mock("../server/repositories/notifications.repository", () => ({ NotificationsRepository: class {} }));
// Fail immediately if the facade ever tries to bypass its repositories.
vi.mock("../server/db", () => ({
  db: new Proxy({}, { get() { throw new Error("Unexpected direct database access"); } }),
}));

import { DatabaseStorage } from "../server/storage";

const cases = [
  {
    method: "createAiRecommendation",
    args: [recommendationInput],
    invoke: (storage: DatabaseStorage) => storage.createAiRecommendation(recommendationInput),
    results: [recommendation],
  },
  {
    method: "getAiRecommendationById",
    args: [81],
    invoke: (storage: DatabaseStorage) => storage.getAiRecommendationById(81),
    results: [recommendation, undefined],
  },
  {
    method: "getAiRecommendationsByUser",
    args: [17],
    invoke: (storage: DatabaseStorage) => storage.getAiRecommendationsByUser(17),
    results: [[recommendation], []],
  },
  {
    method: "getPendingAiRecommendationsByProfessional",
    args: [42],
    invoke: (storage: DatabaseStorage) => storage.getPendingAiRecommendationsByProfessional(42),
    results: [[recommendation], []],
  },
  {
    method: "getPendingAiRecommendationsByTherapist",
    args: [42],
    invoke: (storage: DatabaseStorage) => storage.getPendingAiRecommendationsByTherapist(42),
    results: [[recommendation], []],
  },
  ...([undefined, "Reviewed with client", ""] as const).map((notes) => ({
    method: "updateAiRecommendationStatus" as const,
    args: [81, "approved", notes],
    invoke: (storage: DatabaseStorage) => notes === undefined
      ? storage.updateAiRecommendationStatus(81, "approved")
      : storage.updateAiRecommendationStatus(81, "approved", notes),
    results: [{ ...recommendation, status: "approved", therapistNotes: notes ?? null }],
  })),
  {
    method: "deleteAiRecommendation",
    args: [81],
    invoke: (storage: DatabaseStorage) => storage.deleteAiRecommendation(81),
    results: [undefined],
  },
] satisfies Array<{
  method: keyof typeof admin;
  args: unknown[];
  invoke: (storage: DatabaseStorage) => Promise<unknown>;
  results: unknown[];
}>;

describe("DatabaseStorage AI recommendation delegation", () => {
  let storage: DatabaseStorage;

  beforeEach(() => {
    vi.resetAllMocks();
    storage = new DatabaseStorage();
  });

  for (const testCase of cases) {
    describe(`${testCase.method}(${JSON.stringify(testCase.args)})`, () => {
      function expectOnlyExpectedCall() {
        expect(admin[testCase.method]).toHaveBeenCalledExactlyOnceWith(...testCase.args);
        for (const [name, mock] of Object.entries(admin)) {
          if (name !== testCase.method) expect(mock).not.toHaveBeenCalled();
        }
      }

      for (const [index, result] of testCase.results.entries()) {
        it(`forwards arguments and preserves result ${index + 1} by identity`, async () => {
          admin[testCase.method].mockResolvedValue(result);

          expect(await testCase.invoke(storage)).toBe(result);
          expectOnlyExpectedCall();
          if (testCase.method === "createAiRecommendation") {
            expect(admin.createAiRecommendation.mock.calls[0][0]).toBe(recommendationInput);
          }
        });
      }

      it("propagates the original repository error", async () => {
        const error = new Error("Repository unavailable");
        admin[testCase.method].mockRejectedValue(error);

        await expect(testCase.invoke(storage)).rejects.toBe(error);
        expectOnlyExpectedCall();
      });
    });
  }
});
