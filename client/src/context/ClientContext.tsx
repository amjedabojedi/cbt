import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';

interface ClientContextType {
  viewingClientId: number | null;
  viewingClientName: string | null;
  setViewingClient: (id: number | null, name: string | null) => void;
  isViewingClient: boolean;
  loading: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Initialize from localStorage for backward compatibility and faster initial load
  // But only do this for therapists or admins to prevent confusion
  const storedClientId = localStorage.getItem('viewingClientId');
  const storedClientName = localStorage.getItem('viewingClientName');
  
  // Only initialize from localStorage if user is a therapist or admin
  // This prevents clients from seeing another client's data
  const shouldUseStoredValues = user?.role === 'therapist' || user?.role === 'admin';
  
  const [viewingClientId, setViewingClientId] = useState<number | null>(
    shouldUseStoredValues && storedClientId ? parseInt(storedClientId) : null
  );
  const [viewingClientName, setViewingClientName] = useState<string | null>(
    shouldUseStoredValues && storedClientName ? storedClientName : null
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch the current viewing client from the database when the component mounts
  useEffect(() => {
    let isMounted = true;
    
    // Skip viewing client fetch for admin users - they don't need viewing clients
    if (user?.role === "admin") {
      console.log("Admin user detected - skipping viewing client fetch");
      setLoading(false);
      return;
    }
    
    // Only attempt to fetch if user is a therapist
    if (user?.role === "therapist") {
      const fetchCurrentViewingClient = async () => {
        try {
          if (!isMounted) return;
          
          setLoading(true);
          
          // Add userId to headers as backup authentication method
          const backupHeaders: Record<string, string> = {
            "Content-Type": "application/json"
          };
          
          if (user?.id) {
            console.log("Adding backup auth headers:", { userId: user.id });
            backupHeaders["X-User-ID"] = user.id.toString();
          }
          
          // IMPORTANT: Use the fixed endpoint that always returns 200 status
          const url = `/api/users/viewing-client-fixed${user?.id ? `?userId=${user.id}` : ''}`;
          
          try {
            // Use the fixed endpoint with 200 status code guarantee
            const response = await fetch(url, {
              method: 'GET',
              headers: backupHeaders,
              credentials: 'include'
            });
            
            // Handle different response status codes gracefully
            let data;
            
            if (!response.ok) {
              console.log(`Server returned ${response.status} status - using default empty response`);
              data = { viewingClient: null, success: true };
            } else {
              try {
                data = await response.json();
              } catch (parseError) {
                console.log("Failed to parse response as JSON:", parseError);
                data = { viewingClient: null, success: true };
              }
            }
            
            // Only process if component is still mounted
            if (isMounted) {
              try {
                if (data?.viewingClient && 
                    typeof data.viewingClient.id === 'number' && 
                    typeof data.viewingClient.name === 'string') {
                  
                  // Valid client data found
                  setViewingClientId(data.viewingClient.id);
                  setViewingClientName(data.viewingClient.name);
                  
                  // Also update localStorage for persistence
                  localStorage.setItem('viewingClientId', data.viewingClient.id.toString());
                  localStorage.setItem('viewingClientName', data.viewingClient.name);
                  
                  console.log("Current viewing client set to:", data.viewingClient.name);
                } else {
                  // If using a therapist account and we have localStorage values but no valid response,
                  // keep using the localStorage values which are already in state
                  if (user?.role === 'therapist' || user?.role === 'admin') {
                    // If no viewing client is set in state but we have one in localStorage, restore it
                    if (!viewingClientId && storedClientId && storedClientName) {
                      const parsedId = parseInt(storedClientId);
                      if (!isNaN(parsedId)) {
                        setViewingClientId(parsedId);
                        setViewingClientName(storedClientName);
                        console.log("Restored viewing client from localStorage:", storedClientName);
                      }
                    } else {
                      console.log("No current viewing client from server, using stored values if available");
                    }
                  } else {
                    // For client users, we don't use localStorage values
                    console.log("No current viewing client from server for client user");
                  }
                }
              } catch (processError) {
                console.log("Error processing client data:", processError);
                // Fall back to existing state, don't change anything
              }
            }
          } catch (apiError) {
            console.error("Error fetching current viewing client:", apiError);
            // Just log and continue - we already have fallback values from localStorage
          }
        } catch (error) {
          // Outer try-catch for any other errors
          console.log("Error in current viewing client fetch:", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };
      
      fetchCurrentViewingClient();
    } else {
      // If not a therapist or admin, we're not loading anything
      setLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  // ClientContext initialized

  const setViewingClient = (id: number | null, name: string | null) => {
    setViewingClientId(id);
    setViewingClientName(name);
    
    // Keep localStorage updated for backwards compatibility
    if (id !== null && name !== null) {
      localStorage.setItem('viewingClientId', id.toString());
      localStorage.setItem('viewingClientName', name);
    } else {
      localStorage.removeItem('viewingClientId');
      localStorage.removeItem('viewingClientName');
    }
  };

  const value = {
    viewingClientId,
    viewingClientName,
    setViewingClient,
    isViewingClient: viewingClientId !== null,
    loading
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClientContext() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClientContext must be used within a ClientProvider');
  }
  return context;
}