import { useAuth } from "@/lib/auth";
import { useClientContext } from "@/context/ClientContext";

// Named export
export function useActiveUser() {
  const { user } = useAuth();
  const { viewingClientId } = useClientContext();
  
  // If the user is a therapist and is viewing a client, use the client's ID
  // Otherwise, use the current user's ID
  const activeUserId = (user?.role === "therapist" && viewingClientId) 
    ? viewingClientId 
    : user?.id;
  
  // Construct the API path for the active user
  const apiPath = `/api/users/${activeUserId}`;
  
  // Determine if the current user is viewing their own data or someone else's
  const isViewingSelf = (activeUserId === user?.id);
  
  // Check if the user is a therapist or admin (roles with elevated permissions)
  const hasElevatedPermissions = user?.role === "therapist" || user?.role === "admin";
  
  console.log("useActiveUser - Current auth user:", user?.id, user?.username, user?.role);
  console.log("useActiveUser - Final API path prefix:", apiPath);
  
  // For backward compatibility
  const isViewingClientData = !isViewingSelf;
  
  return {
    user,
    activeUserId,
    apiPath,
    isViewingSelf,
    isViewingClientData,
    hasElevatedPermissions,
    isTherapist: user?.role === "therapist",
    isAdmin: user?.role === "admin",
    isClient: user?.role === "client",
  };
}

// Also export as default for backward compatibility
export default useActiveUser;