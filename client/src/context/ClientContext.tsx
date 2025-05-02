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
  
  // Still initialize from localStorage for backward compatibility and faster initial load
  const storedClientId = localStorage.getItem('viewingClientId');
  const storedClientName = localStorage.getItem('viewingClientName');
  
  const [viewingClientId, setViewingClientId] = useState<number | null>(
    storedClientId ? parseInt(storedClientId) : null
  );
  const [viewingClientName, setViewingClientName] = useState<string | null>(
    storedClientName || null
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch the current viewing client from the database when the component mounts
  useEffect(() => {
    // Only attempt to fetch if user is a therapist
    if (user?.role === "therapist") {
      const fetchCurrentViewingClient = async () => {
        try {
          setLoading(true);
          const response = await apiRequest("GET", "/api/users/current-viewing-client");
          const data = await response.json();
          
          if (data.viewingClient) {
            setViewingClientId(data.viewingClient.id);
            setViewingClientName(data.viewingClient.name);
            console.log("Loaded viewing client from database:", data.viewingClient);
            
            // Also update localStorage for backwards compatibility
            localStorage.setItem('viewingClientId', data.viewingClient.id.toString());
            localStorage.setItem('viewingClientName', data.viewingClient.name);
          }
        } catch (error) {
          console.error("Error fetching current viewing client:", error);
          // If DB fetch fails, fallback to localStorage values (already set in state)
        } finally {
          setLoading(false);
        }
      };
      
      fetchCurrentViewingClient();
    } else {
      // If not a therapist, we're not loading anything
      setLoading(false);
    }
  }, [user]);

  console.log("ClientContext initialized with:", { viewingClientId, viewingClientName });

  const setViewingClient = (id: number | null, name: string | null) => {
    console.log("Setting viewing client:", { id, name });
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