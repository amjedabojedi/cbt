import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(), invalidateQueries: vi.fn(), apiRequest: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (options: unknown) => options,
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock("../client/src/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("../client/src/lib/queryClient", () => ({ apiRequest: mocks.apiRequest }));

import { useDeleteResource } from "../client/src/features/resources/hooks/useResources";

describe("resource deletion feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the saved recommendation conflict and never announces a successful deletion", async () => {
    const conflict = new Error("This resource is used by a saved recommendation and cannot be deleted.");
    mocks.apiRequest.mockRejectedValue(conflict);
    const options = useDeleteResource() as unknown as {
      mutationFn: (id: number) => Promise<unknown>;
      onError: (error: Error) => void;
    };
    await expect(options.mutationFn(3)).rejects.toBe(conflict);
    options.onError(conflict);
    expect(mocks.toast).toHaveBeenCalledExactlyOnceWith({
      title: "Error", description: conflict.message, variant: "destructive",
    });
    expect(mocks.invalidateQueries).not.toHaveBeenCalled();
  });
});
