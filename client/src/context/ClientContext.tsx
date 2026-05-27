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
  
  // Always start with no client selected — therapists must explicitly pick a client
  // from the Clients page each session. This prevents auto-restoring stale state.
  const [viewingClientId, setViewingClientId] = useState<number | null>(null);
  const [viewingClientName, setViewingClientName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // On mount, clear any server-side viewing client so the therapist always
  // starts at their own dashboard — never silently in a client's view.
  useEffect(() => {
    if (user?.role === "therapist") {
      // Clear localStorage immediately
      localStorage.removeItem('viewingClientId');
      localStorage.removeItem('viewingClientName');
      // Clear server-side state silently (fire-and-forget)
      fetch('/api/users/current-viewing-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ clientId: null }),
      }).catch(() => {});
    }
  }, [user?.id]);

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