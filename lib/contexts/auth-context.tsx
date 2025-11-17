"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useCurrentUser } from "@/lib/hooks/user";
import AuthLoadingScreen from "@/components/auth-loading-screen";

interface AuthContextType {
  isAuthenticated: boolean;
  user: ReturnType<typeof useCurrentUser>["data"];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Fetch user data once and cache it globally
  const { data: user, error, isLoading } = useCurrentUser();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Determine if user is authenticated
  const isAuthenticated = !!user && !error;

  // Track initial auth check - only show loading on first mount when checking auth
  useEffect(() => {
    if (!isLoading) {
      // Once loading is complete (whether successful or not), mark as checked
      setHasCheckedAuth(true);
    }
  }, [isLoading]);

  // Show loading screen only during initial auth verification (no cached data yet)
  // Don't show if we've already checked auth or if we have cached data
  if (!hasCheckedAuth && isLoading && !user && !error) {
    return <AuthLoadingScreen />;
  }

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
