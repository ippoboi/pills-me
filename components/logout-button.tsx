"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { LogoutSquare01FreeIcons } from "@hugeicons/core-free-icons";

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
    >
      <HugeiconsIcon
        icon={LogoutSquare01FreeIcons}
        strokeWidth={2}
        className="w-4 h-4"
      />
      Logout
    </Button>
  );
}
