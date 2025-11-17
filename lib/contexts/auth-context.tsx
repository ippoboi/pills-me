"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/user";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ReturnType<typeof useCurrentUser>["data"];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, error } = useCurrentUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  // Determine if user is authenticated
  const isAuthenticated = !!user && !error;

  // Check if current path is an auth route
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/error") ||
    pathname === "/";

  useEffect(() => {
    // Mark as initialized once we have a response (success or error)
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isInitialized) return;

    // If authenticated and on auth route, redirect to todos
    if (isAuthenticated && isAuthRoute) {
      router.push("/todos");
      return;
    }

    // If not authenticated and on protected route, redirect to login
    // Note: Server-side layout already handles this, but this is a fallback
    if (!isAuthenticated && !isAuthRoute && pathname !== "/") {
      router.push("/login");
      return;
    }

    // Hide loading screen after a brief delay to allow fade animation
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isAuthRoute, isInitialized, pathname, router]);

  // Show loading screen during initial auth check
  const shouldShowLoading = showLoading && (!isInitialized || isLoading);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading: shouldShowLoading,
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
