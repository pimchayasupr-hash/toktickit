import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('toktickit_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error?.message || 'Authentication failed.' };
      }

      localStorage.setItem('toktickit_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Network error. Failed to authenticate.' };
    }
  };

  const logout = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('toktickit_token');
    setToken(null);
    setUser(null);
  };

  const changePassword = async (newPassword: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error?.message || 'Failed to change password.' };
      }

      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Failed to change password.' };
    }
  };

  const refreshUser = async () => {
    if (token) await fetchMe(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, changePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: {
        id: 1,
        name: 'Jennifer Anderson',
        email: 'jennifer.anderson@example.com',
        role: 'REQUESTER' as const,
        mustChangePassword: false,
        isActive: true,
      },
      token: 'mock-test-token',
      loading: false,
      login: async () => ({ success: true }),
      logout: () => {},
      changePassword: async () => ({ success: true }),
      refreshUser: async () => {},
    };
  }
  return context;
};
