"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null); // ✅ Define token state

  useEffect(() => {
    // Check for existing token on mount and validate it
    const validateAndSetUser = async () => {
      const storedToken = localStorage.getItem("access_token");
      const userData = localStorage.getItem("user_data");

      if (storedToken && userData) {
        try {
          const response = await fetch("http://localhost:8000/api/health/", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            setUser(JSON.parse(userData));
            setToken(storedToken); // ✅ Set token on valid session
          } else {
            localStorage.clear();
            setUser(null);
            setToken(null);
          }
        } catch (error) {
          localStorage.clear();
          setUser(null);
          setToken(null);
        }
      }

      setIsLoading(false);
    };

    validateAndSetUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        const { user: userData, tokens }: any = response.data;

        localStorage.setItem("access_token", tokens.access);
        localStorage.setItem("refresh_token", tokens.refresh);
        localStorage.setItem("user_data", JSON.stringify(userData));

        setUser(userData);
        setToken(tokens.access);
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiService.register(name, email, password);

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        const { user: userData, tokens }: any = response.data;

        localStorage.setItem("access_token", tokens.access);
        localStorage.setItem("refresh_token", tokens.refresh);
        localStorage.setItem("user_data", JSON.stringify(userData));

        setUser(userData);
        setToken(tokens.access);

        // ✅ Log user details in browser console
        console.log("✅ Logged in user:");
        console.table(userData); // cleaner format

        return { success: true };
      }

      return { success: false, error: "Registration failed" };
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const clearAuth = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
    setUser(null);
    setToken(null); // ✅ Clear token
  };

  const logout = () => {
    clearAuth();
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        token,
        login,
        register,
        logout,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
