import { useClientContext } from "@/context/ClientContext";
import { useAuth } from "@/lib/auth";

/**
 * Hook that provides the active user ID for data retrieval.
 * 
 * When a therapist is viewing a client's data, returns the client's ID.
 * Otherwise returns the current user's ID.
 */
export default function useActiveUser() {
  const { user } = useAuth();
  const { viewingClientId } = useClientContext();
  
  // Active ID is either the client being viewed (for therapists) or the current user
  const activeUserId = viewingClientId || user?.id;
  
  // Is the therapist viewing a client's data
  const isViewingClientData = Boolean(viewingClientId);
  
  // Is the current user a therapist and can switch views
  const canSwitchUser = user?.role === "therapist" || user?.role === "admin";
  
  // Get the appropriate pathPrefix for API calls
  const getPathPrefix = () => {
    if (!activeUserId) return null;
    return `/api/users/${activeUserId}`;
  };
  
  return {
    activeUserId,
    isViewingClientData,
    canSwitchUser,
    getPathPrefix,
    currentUser: user
  };
}