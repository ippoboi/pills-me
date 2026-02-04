"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogoutSquare01FreeIcons } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear app session cookie
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/auth");
  };

  return (
    <Button
      onClick={logout}
      variant="destructive-secondary"
      className="w-full md:w-auto"
      icon={LogoutSquare01FreeIcons}
    >
      Logout
    </Button>
  );
}
