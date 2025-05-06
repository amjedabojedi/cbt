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
  
  // Check if the user is already logged in on mount
  React.useEffect(() => {
    let isMounted = true; // Flag to prevent setting state after unmount
    
    async function checkAuth() {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Not logged in - expected behavior, not an error
            setUser(null);
            setError(null);
            setLoading(false);
            return;
          }
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const userData = await response.json();
        if (isMounted) {
          setUser(userData);
          setError(null);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        if (isMounted) {
          setError(err as Error);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    checkAuth();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
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
    status?: string;
  }) => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", data);
      const userData = await response.json();
      setUser(userData as User);
      navigate("/dashboard");
      return userData as User; // Return the user data for additional processing
    } catch (err) {
      console.error("Registration error:", err);
      setError(err as Error);
      throw err; // Rethrow the error to allow handling in the caller
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