"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

  // Query current user from auth identity
  const user = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  // Loading states:
  // 1. Auth is still loading
  // 2. Authenticated but user query hasn't returned yet
  const isLoading = authLoading || (isAuthenticated && user === undefined);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated,
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
