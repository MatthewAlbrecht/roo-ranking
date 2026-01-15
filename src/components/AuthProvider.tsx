"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type User = {
  _id: Id<"users">;
  username: string;
  isAdmin: boolean;
  avatarColor: string;
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loginMutation = useMutation(api.users.login);
  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("roo-ranking-user");
    if (stored) {
      setUserId(stored as Id<"users">);
    }
    setIsInitialized(true);
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    const result = await loginMutation({ username, password });
    if (result) {
      setUserId(result._id);
      localStorage.setItem("roo-ranking-user", result._id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUserId(null);
    localStorage.removeItem("roo-ranking-user");
  };

  // Loading states:
  // 1. Not initialized yet (haven't checked localStorage)
  // 2. Have userId but user query hasn't returned yet
  const isLoading = !isInitialized || (userId !== null && user === undefined);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login,
        logout,
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
