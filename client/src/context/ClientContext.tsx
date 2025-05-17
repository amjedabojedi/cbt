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
    
    // Only attempt to fetch if user is a therapist or admin
    if (user?.role === "therapist" || user?.role === "admin") {
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
          
          const response = await fetch("/api/users/current-viewing-client", {
            method: "GET",
            credentials: "include",
            headers: backupHeaders
          });
          
          // Consider non-2xx responses as successful but empty
          let data;
          try {
            data = await response.json();
          } catch (e) {
            // If JSON parsing fails, create empty response
            data = { viewingClient: null };
          }
          
          if (isMounted) {
            // Check if data and viewingClient exist and have valid properties
            if (data?.viewingClient && 
                typeof data.viewingClient.id === 'number' && 
                typeof data.viewingClient.name === 'string') {
              
              setViewingClientId(data.viewingClient.id);
              setViewingClientName(data.viewingClient.name);
              
              // Also update localStorage for backwards compatibility
              localStorage.setItem('viewingClientId', data.viewingClient.id.toString());
              localStorage.setItem('viewingClientName', data.viewingClient.name);
            } else {
              // If no valid client data from API, keep using localStorage values if available
              // (already initialized in state constructor)
              console.log("No valid client data received from API, using localStorage if available");
            }
          }
        } catch (error) {
          console.error("Error fetching current viewing client:", error);
          // If fetch fails, fallback to localStorage values (already set in state)
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