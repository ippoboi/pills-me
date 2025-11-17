"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { AuthLoadingScreen } from "./auth-loading-screen";

export function AuthLoadingWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();

  return (
    <>
      <AuthLoadingScreen isLoading={isLoading} />
      {children}
    </>
  );
}
