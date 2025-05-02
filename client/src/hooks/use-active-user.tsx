import { useClientContext } from "@/context/ClientContext";
import { useAuth } from "@/lib/auth";

/**
 * Hook that provides the active user ID for data retrieval.
 * 
 * When a therapist is viewing a client's data, returns the client's ID.
 * Otherwise returns the current user's ID.
 * 
 * Prioritizes the ClientContext (which is loaded from the database)
 * but falls back to localStorage for backward compatibility.
 */
export default function useActiveUser() {
  const { user } = useAuth();
  const { viewingClientId, loading } = useClientContext();
  
  // Read from localStorage as fallback for backward compatibility
  const storedClientId = localStorage.getItem('viewingClientId');
  const storedClientName = localStorage.getItem('viewingClientName');
  
  // Add some debug logging
  console.log("useActiveUser - Current auth user:", user?.id, user?.username, user?.role);
  console.log("useActiveUser - viewingClientId from context:", viewingClientId);
  console.log("useActiveUser - viewingClientId from localStorage:", storedClientId);
  
  // Use client ID from context or localStorage, falling back to current user ID
  // This ensures we don't lose the client selection after page refreshes
  const storedClientIdNumber = storedClientId ? parseInt(storedClientId) : null;
  const activeUserId = viewingClientId || storedClientIdNumber || user?.id;
  
  // Is the therapist viewing a client's data
  const isViewingClientData = Boolean(viewingClientId || storedClientIdNumber);
  
  // Is the current user a therapist and can switch views
  const canSwitchUser = user?.role === "therapist" || user?.role === "admin";
  
  // Get the appropriate pathPrefix for API calls
  const getPathPrefix = () => {
    if (!activeUserId) return null;
    
    // If viewing a client, use the client ID; otherwise use the authenticated user ID
    let targetUserId = activeUserId;
    
    // Debug the actual ID being used
    if (viewingClientId) {
      console.log("useActiveUser - Using client ID for API calls:", viewingClientId);
    } else {
      console.log("useActiveUser - Using own ID for API calls:", user?.id);
    }
    
    const prefix = `/api/users/${targetUserId}`;
    console.log("useActiveUser - Final API path prefix:", prefix);
    
    return prefix;
  };
  
  return {
    activeUserId,
    isViewingClientData,
    canSwitchUser,
    getPathPrefix,
    currentUser: user
  };
}