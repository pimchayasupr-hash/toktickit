import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RequesterUser } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface RequesterContextType {
  selectedRequesterId: number | null;
  currentRequester: RequesterUser | null;
  requesters: RequesterUser[];
  isLoading: boolean;
  error: string | null;
  selectRequester: (id: number) => void;
  clearRequester: () => void;
  refetchRequesters: () => Promise<void>;
}

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export const RequesterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedRequesterId, setSelectedRequesterId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('X-Development-Requester-Id');
    return saved ? parseInt(saved, 10) : null;
  });

  const [requesters, setRequesters] = useState<RequesterUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequesters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/requesters`);
      if (!res.ok) {
        throw new Error(`Failed to load requesters (HTTP ${res.status})`);
      }
      const data = await res.json();
      const list: RequesterUser[] = data.requesters || [];
      setRequesters(list);

      // Validate saved requester still exists in active list
      if (selectedRequesterId) {
        const found = list.find((r) => r.id === selectedRequesterId);
        if (!found) {
          sessionStorage.removeItem('X-Development-Requester-Id');
          setSelectedRequesterId(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequesters();
  }, []);

  const selectRequester = (id: number) => {
    sessionStorage.setItem('X-Development-Requester-Id', String(id));
    setSelectedRequesterId(id);
  };

  const clearRequester = () => {
    sessionStorage.removeItem('X-Development-Requester-Id');
    setSelectedRequesterId(null);
  };

  const currentRequester = requesters.find((r) => r.id === selectedRequesterId) || null;

  return (
    <RequesterContext.Provider
      value={{
        selectedRequesterId,
        currentRequester,
        requesters,
        isLoading,
        error,
        selectRequester,
        clearRequester,
        refetchRequesters: fetchRequesters,
      }}
    >
      {children}
    </RequesterContext.Provider>
  );
};

export const useRequester = (): RequesterContextType => {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error('useRequester must be used within a RequesterProvider');
  }
  return context;
};
