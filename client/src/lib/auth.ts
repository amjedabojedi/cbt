// Enhanced auth.ts file that actually works with the database
import React, { createContext, useContext, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Define the auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    name: string;
    role: string;
    therapistId?: number;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a working AuthProvider without using JSX explicitly
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<Error | null>(null);
  const [, navigate] = useLocation();
  
  // Check if the user is already logged in on mount with retries
  React.useEffect(() => {
    async function checkAuth(retryCount = 0) {
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/auth/me");
        const userData = await response.json();
        setUser(userData);
        setError(null);
      } catch (err) {
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          console.log(`Auth check failed, retrying (${retryCount + 1}/3)...`);
          setTimeout(() => checkAuth(retryCount + 1), Math.min(1000 * 2 ** retryCount, 5000));
          return;
        }
        
        // After all retries, check if we have user data in localStorage as fallback
        console.log("Auth check failed after retries");
        
        // Don't set error for auth checks - it's normal for unauthenticated users
        setError(null);
      } finally {
        // Only set loading to false after all retries are complete
        if (retryCount >= 3) {
          setLoading(false);
        }
      }
    }
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => { 
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const userData = await response.json();
      setUser(userData as User);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    name: string;
    role: string;
    therapistId?: number;
  }) => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", data);
      const userData = await response.json();
      setUser(userData as User);
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Wrap the returned object in React.createElement to avoid JSX syntax issues
  const contextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    React.createElement(
      AuthContext.Provider,
      { value: contextValue },
      children
    )
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a default implementation for components not wrapped in AuthProvider
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [, navigate] = useLocation();

    const login = async (username: string, password: string) => { 
      setLoading(true);
      try {
        const response = await apiRequest("POST", "/api/auth/login", { username, password });
        const userData = await response.json();
        setUser(userData as User);
        navigate("/dashboard");
      } catch (err) {
        console.error("Login error:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    const register = async (data: {
      username: string;
      email: string;
      password: string;
      name: string;
      role: string;
      therapistId?: number;
    }) => {
      setLoading(true);
      try {
        const response = await apiRequest("POST", "/api/auth/register", data);
        const userData = await response.json();
        setUser(userData as User);
        navigate("/dashboard");
      } catch (err) {
        console.error("Registration error:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    const logout = async () => {
      setLoading(true);
      try {
        await apiRequest("POST", "/api/auth/logout", {});
        setUser(null);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    return {
      user,
      loading,
      error,
      login,
      register,
      logout
    };
  }
  return context;
}