import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ClientContextType {
  viewingClientId: number | null;
  viewingClientName: string | null;
  setViewingClient: (id: number | null, name: string | null) => void;
  isViewingClient: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [viewingClientId, setViewingClientId] = useState<number | null>(null);
  const [viewingClientName, setViewingClientName] = useState<string | null>(null);

  const setViewingClient = (id: number | null, name: string | null) => {
    setViewingClientId(id);
    setViewingClientName(name);
  };

  const value = {
    viewingClientId,
    viewingClientName,
    setViewingClient,
    isViewingClient: viewingClientId !== null
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