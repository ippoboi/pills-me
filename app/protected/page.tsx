"use client";

import { Button } from "@/components/ui/button";
import { startRegistration } from "@simplewebauthn/browser";
import { Key, Monitor, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DotGrid from "@/components/ui/DotGrid";
import { createClient } from "@/lib/supabase/client";
import { Add01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";

interface Passkey {
  id: string;
  credentialId: string;
  userId: string;
  userName?: string;
  userDisplayName?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    deviceType?: string;
    nickname?: string;
  };
  createdAt: string;
  lastUsedAt?: string;
}

export default function ProtectedPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Determine auth via app cookie
    const checkSession = async () => {
      try {
        const meResp = await fetch("/api/auth/me");
        if (!meResp.ok) {
          router.push("/auth");
          return;
        }
        const me = await meResp.json();
        setUserId(me.id);
        setDisplayName(me.displayName || "User");
        fetchPasskeys(me.id);
      } catch {
        router.push("/auth");
      }
    };

    checkSession();
  }, [router]);

  const fetchPasskeys = async (uid: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/passkey/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });

      if (response.ok) {
        const data = await response.json();
        setPasskeys(data.passkeys || []);
      }
    } catch (error) {
      console.error("Failed to fetch passkeys:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black flex flex-col items-center justify-center">
      <DotGrid fillViewport absolute zIndex={0} />
      <div className="z-10 flex flex-col items-center justify-center gap-8">
        <div className="space-y-1">
          <Image
            src="/empty-illustration-true.svg"
            alt="Logo"
            width={400}
            height={100}
            className="opacity-50"
          />
          <Image
            src="/empty-illustration-false.svg"
            alt="Logo"
            width={400}
            height={100}
          />
        </div>
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-medium">
              Welcome to your supplement space!
            </h1>
            <p className="text-lg text-gray-600">
              Press the button below to track your first supplement.
            </p>
          </div>
          <Button variant="default">
            <HugeiconsIcon
              icon={Add01FreeIcons}
              strokeWidth={2}
              className="w-4 h-4"
            />
            Track new
          </Button>
        </div>
      </div>
    </div>
  );
}
