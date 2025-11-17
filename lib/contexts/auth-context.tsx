"use client";

import { createContext, useContext, ReactNode } from "react";
import { useCurrentUser } from "@/lib/hooks/user";

interface AuthContextType {
  isAuthenticated: boolean;
  user: ReturnType<typeof useCurrentUser>["data"];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, error } = useCurrentUser();

  // Determine if user is authenticated
  const isAuthenticated = !!user && !error;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
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
