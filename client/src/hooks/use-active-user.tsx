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
  const { viewingClientId } = useClientContext();
  
  // Determine the active user ID to use for API calls
  function determineActiveUserId(): number | undefined {
    // If no user logged in yet, return undefined
    if (!user?.id) return undefined;
    
    // For clients, always use their own ID
    if (user.role === "client") {
      // Clear any localStorage values if present to prevent confusion
      if (localStorage.getItem('viewingClientId')) {
        localStorage.removeItem('viewingClientId');
        localStorage.removeItem('viewingClientName');

      }
      return user.id;
    }
    
    // For therapists/admins viewing a client
    if ((user.role === "therapist" || user.role === "admin") && viewingClientId) {
      return viewingClientId;
    }
    
    // As a last resort, check localStorage (for backward compatibility)
    const storedClientId = localStorage.getItem('viewingClientId');
    if ((user.role === "therapist" || user.role === "admin") && storedClientId) {
      const storedClientIdNumber = parseInt(storedClientId);
      return storedClientIdNumber;
    }
    
    // Otherwise, use the user's own ID
    return user.id;
  }
  
  const activeUserId = determineActiveUserId();
  
  // Is the user a therapist viewing a client's data
  const isViewingClientData = (user?.role === "therapist" || user?.role === "admin") && 
    (viewingClientId !== null || localStorage.getItem('viewingClientId') !== null);
  
  // Can the user switch to view other users
  const canSwitchUser = user?.role === "therapist" || user?.role === "admin";
  
  // Get the appropriate path prefix for API calls
  function getPathPrefix(): string | null {
    if (!activeUserId) return null;
    const prefix = `/api/users/${activeUserId}`;
    return prefix;
  }
  
  return {
    activeUserId,
    isViewingClientData,
    canSwitchUser,
    getPathPrefix,
    currentUser: user
  };
}