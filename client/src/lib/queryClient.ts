import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Improved error handling function that properly parses JSON error responses
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = '';
    try {
      // Try to parse as JSON first
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // Clone the response since we can only read it once
        const clonedRes = res.clone();
        const errorData = await clonedRes.json();
        errorMessage = errorData.message || JSON.stringify(errorData);
      } else {
        // Fallback to plain text if not JSON
        errorMessage = await res.text();
      }
    } catch (e) {
      // If JSON parsing fails, fall back to status text
      errorMessage = res.statusText;
    }
    
    // Throw a more informative error
    throw new Error(errorMessage || `Request failed with status ${res.status}`);
  }
}

/**
 * Enhanced API request function with better error handling
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  additionalHeaders?: Record<string, string>,
): Promise<Response> {
  try {
    // Combine base headers with any additional headers
    const baseHeaders: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
    const headers = { ...baseHeaders, ...additionalHeaders };
    
    // Add security headers to help bypass antivirus warnings
    headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Try to include backup auth token if available
    try {
      const backupData = localStorage.getItem('auth_user_backup');
      if (backupData) {
        const userData = JSON.parse(backupData);
        // Include user ID in header for backup authentication
        headers['X-Auth-User-Id'] = String(userData.id);
        headers['X-Auth-Timestamp'] = String(Date.now());
        headers['X-Auth-Fallback'] = 'true';
        console.log("Adding backup auth headers:", { userId: userData.id });
      }
    } catch (e) {
      console.warn("Could not add backup auth headers:", e);
    }
    
    const res = await fetch(url, {
      method,
      headers: headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Log detailed error information with less alarming language
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (!errorMsg.includes('credentials')) {
      console.log(`Request issue for ${method} ${url}:`, errorMsg);
    } else {
      console.log(`Authentication needed for ${method} ${url}`);
    }
    throw error; // Re-throw for handling in components
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Enhanced query function with improved error handling
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Prepare headers with potential backup auth information
      const headers: Record<string, string> = {
        'X-Requested-With': 'XMLHttpRequest'
      };
      
      // Try to include backup auth token if available
      try {
        const backupData = localStorage.getItem('auth_user_backup');
        if (backupData) {
          const userData = JSON.parse(backupData);
          // Include user ID in header for backup authentication
          headers['X-Auth-User-Id'] = String(userData.id);
          headers['X-Auth-Timestamp'] = String(Date.now());
          headers['X-Auth-Fallback'] = 'true';
          console.log("Adding backup auth headers to query:", { userId: userData.id, url: queryKey[0] });
        }
      } catch (e) {
        console.warn("Could not add backup auth headers to query:", e);
      }
      
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: headers
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Log detailed error information for debugging
      console.error(`Query failed for ${queryKey[0]}:`, error);
      throw error; // Re-throw for handling in components
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refresh when window gets focus
      staleTime: 300000, // 5 minutes instead of Infinity to allow refreshing
      retry: 3, // Retry failed queries 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 2, // Retry failed mutations 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    },
  },
});
