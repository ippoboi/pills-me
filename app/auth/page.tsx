"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, Loader2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ComputerPhoneSyncFreeIcons,
  FaceIdFreeIcons,
  Key01FreeIcons,
  LockPasswordFreeIcons,
} from "@hugeicons/core-free-icons";

export default function AuthPage() {
  const router = useRouter();
  const [lookingUpUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in (via app cookie, not Supabase auth)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.id) {
            router.push("/protected");
          }
        }
      } catch {}
    };
    checkSession();
  }, [router]);

  const handleCreatePasskey = () => {
    router.push("/auth/onboarding");
  };

  const handleUseExistingPasskey = async () => {
    // Default: try discoverable (usernameless) first
    setError(null);
    setLoading(true);
    try {
      const startResp = await fetch("/api/passkey/authenticate/start", {
        method: "POST",
      });
      if (!startResp.ok) {
        const { error: err } = await startResp.json();
        throw new Error(err || "Failed to start authentication");
      }
      const { options, challengeToken } = await startResp.json();
      const assertion = await startAuthentication({ optionsJSON: options });
      const finishResp = await fetch("/api/passkey/authenticate/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, credential: assertion }),
      });
      if (!finishResp.ok) {
        const { error: err } = await finishResp.json();
        throw new Error(err || "Failed to finish authentication");
      }
      const result = await finishResp.json();
      if (result.verified) {
        router.push("/protected");
        return;
      }
      throw new Error("Passkey authentication failed");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(errorMessage || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/auth-illustration.jpg')] bg-cover bg-center relative overflow-hidden">
      <div className="max-w-md w-full space-y-8 mx-auto text-center">
        <div className="flex flex-col items-center gap-2">
          {/* Fingerprint icon */}
          <Fingerprint className="w-16 h-16 text-white mb-6" strokeWidth={1} />

          <h1 className="text-3xl font-medium text-white">Simple Sign In</h1>
          <p className="text-zinc-200 text-lg">
            Passkeys are a fast and secure way to sign in.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleCreatePasskey}
            disabled={loading || lookingUpUser}
            className="w-full h-10 rounded-xl bg-white text-slate-900 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create passkey"
            )}
          </button>

          <button
            onClick={handleUseExistingPasskey}
            disabled={loading || lookingUpUser}
            className="w-full h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white font-medium hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Key01FreeIcons} className="w-4 h-4" />
                Use existing passkey
              </>
            )}
          </button>
        </div>

        {loading && (
          <p className="text-sm text-white/80">
            Confirm the prompt on your device to finish signing in.
          </p>
        )}
      </div>

      {/* Feature callouts */}
      <div className="flex flex-col md:flex-row gap-12 text-center absolute bottom-8 mx-auto">
        <div className="flex items-center gap-6 max-w-md text-white">
          <HugeiconsIcon icon={FaceIdFreeIcons} className="w-10 h-10" />
          <div className="text-left space-y-1">
            <h3 className="text-lg font-medium">Go Password-Free</h3>
            <p className=" text-zinc-200">
              Sign in instantly using Face ID, without needing to enter a
              password or SMS code.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 max-w-md text-white">
          <HugeiconsIcon icon={LockPasswordFreeIcons} className="w-12 h-12" />
          <div className="text-left space-y-1">
            <h3 className="text-lg font-medium">Built-in Security</h3>
            <p className=" text-zinc-200">
              Passkeys are securely stored on-device, protecting you against
              threats like phishing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 max-w-md text-white">
          <HugeiconsIcon
            icon={ComputerPhoneSyncFreeIcons}
            className="w-12 h-12"
          />
          <div className="text-left space-y-1">
            <h3 className="text-lg font-medium">Works Across Devices</h3>
            <p className=" text-zinc-200">
              The system seamlessly syncs passkeys across devices, letting you
              sign in from anywhere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
