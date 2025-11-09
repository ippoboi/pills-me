"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthButton() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // Check for authenticated user from Supabase Auth
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUserId(session.user.id);
        setDisplayName(session.user.user_metadata?.display_name || "User");
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserId(null);
    router.push("/auth");
  };

  return userId ? (
    <div className="flex items-center gap-4">
      <span className="text-sm">Hey, {displayName}!</span>
      <Button onClick={handleLogout} size="sm" variant={"outline"}>
        Sign out
      </Button>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth">Sign in with Passkey</Link>
      </Button>
    </div>
  );
}
