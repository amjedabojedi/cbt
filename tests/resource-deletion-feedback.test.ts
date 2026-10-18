import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(), invalidateQueries: vi.fn(), apiRequest: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => options,
  useMutation: (options: unknown) => options,
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock("../client/src/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("../client/src/lib/queryClient", () => ({ apiRequest: mocks.apiRequest }));

import { useDeleteResource, useResourceRecommendationReferences } from "../client/src/features/resources/hooks/useResources";

describe("resource deletion feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the saved recommendation conflict and never announces a successful deletion", async () => {
    const conflict = new Error("This resource is used by a saved recommendation and cannot be deleted.");
    mocks.apiRequest.mockRejectedValue(conflict);
    const options = useDeleteResource() as unknown as {
      retry: boolean;
      mutationFn: (id: number) => Promise<unknown>;
      onError: (error: Error) => void;
    };
    expect(options.retry).toBe(false);
    await expect(options.mutationFn(3)).rejects.toBe(conflict);
    options.onError(conflict);
    expect(mocks.toast).toHaveBeenCalledExactlyOnceWith({
      title: "Error", description: conflict.message, variant: "destructive",
    });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    const { predicate } = mocks.invalidateQueries.mock.calls.find(([options]) => options.predicate)![0];
    expect(predicate({ queryKey: ["/api/resources/3/recommendation-references"] })).toBe(true);
    expect(predicate({ queryKey: ["/api/users/17/recommendations"] })).toBe(false);
  });

  it("fetches references only for an open dialog with a resource, always refreshing", async () => {
    type Options = {
      enabled: boolean; staleTime: number; refetchOnMount: string;
      queryKey: readonly string[]; queryFn: () => Promise<unknown>;
    };
    expect((useResourceRecommendationReferences(undefined, true) as unknown as Options).enabled).toBe(false);
    expect((useResourceRecommendationReferences(3, false) as unknown as Options).enabled).toBe(false);
    const options = useResourceRecommendationReferences(3, true) as unknown as Options;
    expect(options).toMatchObject({
      enabled: true, staleTime: 0, refetchOnMount: "always",
      queryKey: ["/api/resources/3/recommendation-references"],
    });
    const summary = { hasReferences: true, references: [], hasMore: false };
    mocks.apiRequest.mockResolvedValue({ ok: true, json: async () => summary });
    expect(await options.queryFn()).toEqual(summary);
    expect(mocks.apiRequest).toHaveBeenCalledExactlyOnceWith("GET", "/api/resources/3/recommendation-references");
  });

  it("propagates summary failures for the dialog's retry state", async () => {
    const failure = new Error("Failed to fetch recommendation references");
    mocks.apiRequest.mockRejectedValue(failure);
    const options = useResourceRecommendationReferences(3, true) as unknown as { queryFn: () => Promise<unknown> };
    await expect(options.queryFn()).rejects.toBe(failure);
    expect(mocks.toast).not.toHaveBeenCalled();
  });
});
