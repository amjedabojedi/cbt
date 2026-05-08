import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Parse error responses cleanly (JSON or text) and surface a useful message.
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = "";
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const clonedRes = res.clone();
        const errorData = await clonedRes.json();
        errorMessage = errorData.details
          ? `${errorData.message || "Error"} — ${errorData.details}`
          : errorData.message || JSON.stringify(errorData);
      } else {
        errorMessage = await res.text();
      }
    } catch {
      errorMessage = res.statusText;
    }
    throw new Error(errorMessage || `Request failed with status ${res.status}`);
  }
}

/**
 * Standard API request helper.
 *
 * Authentication is handled exclusively via the httpOnly `sessionId` cookie
 * (sent automatically because of `credentials: "include"`). We do NOT send any
 * fallback identity headers from the client — the server must never trust
 * client-supplied user IDs.
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  additionalHeaders?: Record<string, string>,
): Promise<Response> {
  const baseHeaders: Record<string, string> = data
    ? { "Content-Type": "application/json" }
    : {};
  const headers = { ...baseHeaders, ...(additionalHeaders || {}) };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Default query function used by react-query. Same auth model as `apiRequest`.
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") return null as any;
      throw new Error("Unauthorized");
    }

    await throwIfResNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 300_000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
    },
  },
});
