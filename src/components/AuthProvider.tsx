"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const TOKEN_STORAGE_KEY = "roo_ranking_session_token";

type Questionnaire = {
  favoriteYear?: string;
  memorableSet?: string;
  worstSet?: string;
  favoriteVendor?: string;
  campEssential?: string;
};

type User = {
  _id: Id<"users">;
  username: string;
  isAdmin: boolean;
  avatarColor: string;
  yearsAttended?: number[];
  questionnaire?: Questionnaire;
  onboardingComplete?: boolean;
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setToken: (token: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      setTokenState(storedToken);
    }
    setIsInitialized(true);
  }, []);

  // Query current user when we have a token
  const user = useQuery(
    api.users.getCurrentUser,
    token ? { token } : "skip"
  );

  // Auth mutations
  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);

  const setToken = useCallback((newToken: string) => {
    setTokenState(newToken);
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
  }, []);

  const clearToken = useCallback(() => {
    setTokenState(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginMutation({ username, password });
    if (result.success && result.token) {
      setToken(result.token);
      return { success: true };
    }
    return { success: false, error: result.error || "Login failed" };
  }, [loginMutation, setToken]);

  const logout = useCallback(async () => {
    if (token) {
      await logoutMutation({ token });
    }
    clearToken();
  }, [token, logoutMutation, clearToken]);

  // If user query returns null with a valid token, clear it (invalid session)
  useEffect(() => {
    if (isInitialized && token && user === null) {
      clearToken();
    }
  }, [isInitialized, token, user, clearToken]);

  // Loading states:
  // 1. Not initialized (reading from localStorage)
  // 2. Have token but user query hasn't returned yet
  const isLoading = !isInitialized || (token !== null && user === undefined);
  const isAuthenticated = user !== null && user !== undefined;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated,
        token,
        login,
        logout,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
