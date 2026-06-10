import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ApiService } from '../services/api';

export type UserRole = 'client' | 'therapist' | 'admin';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

interface SignInPayload {
  id: number | string;
  email: string;
  role?: string;
  token?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** Convenience accessor — numeric user id or null. */
  userId: number | null;
  role: UserRole | null;
  /** True until SecureStore has been read once on startup. */
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  /** Persist credentials, prime the API token, and update context. Returns the resolved role. */
  signIn: (payload: SignInPayload) => Promise<UserRole>;
  /** Revoke the session (best effort) and clear all persisted credentials. */
  signOut: () => Promise<void>;
}

const AUTH_KEYS = ['authToken', 'userId', 'userEmail', 'userRole'] as const;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeRole(role?: string): UserRole {
  return role === 'admin' || role === 'therapist' ? role : 'client';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Load persisted session once at startup and prime the API auth token.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [token, id, email, role] = await Promise.all(
          AUTH_KEYS.map((k) => SecureStore.getItemAsync(k))
        );
        if (!isMounted) return;
        if (token) ApiService.setAuthToken(token);
        if (id && email) {
          setUser({ id: Number(id), email, role: normalizeRole(role || undefined) });
        }
      } catch (e) {
        console.error('Auth bootstrap failed:', e);
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (payload: SignInPayload): Promise<UserRole> => {
    const role = normalizeRole(payload.role);
    const id = Number(payload.id);
    await Promise.all([
      SecureStore.setItemAsync('userId', String(id)),
      SecureStore.setItemAsync('userEmail', payload.email),
      SecureStore.setItemAsync('userRole', role),
      payload.token ? SecureStore.setItemAsync('authToken', payload.token) : Promise.resolve(),
    ]);
    if (payload.token) ApiService.setAuthToken(payload.token);
    setUser({ id, email: payload.email, role });
    return role;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      ApiService.clearAuthToken();
      await Promise.all(AUTH_KEYS.map((k) => SecureStore.deleteItemAsync(k)));
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userId: user?.id ?? null,
      role: user?.role ?? null,
      isBootstrapping,
      isAuthenticated: !!user,
      signIn,
      signOut,
    }),
    [user, isBootstrapping, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
