"use client";

import { useState } from "react";
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

  const handleCreatePasskey = () => {
    router.push("/onboarding");
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
        router.push("/todos");
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
      <div className="p-4 md:p-0 max-w-md w-full space-y-8 mx-auto text-center">
        <div className="flex flex-col items-center gap-2">
          {/* Fingerprint icon */}
          <Fingerprint className="w-16 h-16 text-white mb-4" strokeWidth={1} />

          <h1 className="md:text-3xl text-2xl font-medium text-white">
            Easy Sign In
          </h1>
          <p className="text-zinc-200 md:text-lg text-base max-w-[220px] md:max-w-none">
            Passkeys offer a quick, secure way to log in.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Feature callouts */}
        <div className="flex lg:hidden flex-col gap-8 text-center ">
          <div className="flex items-center gap-4 text-white">
            <HugeiconsIcon icon={FaceIdFreeIcons} className="w-8 h-8" />
            <div className="text-left space-y-1">
              <h3 className="font-medium">No Passwords Needed</h3>
              <p className="text-sm text-zinc-200">
                Use Face ID to get in right away, no typing passwords or
                entering SMS codes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 max-w-md text-white">
            <HugeiconsIcon icon={LockPasswordFreeIcons} className="w-10 h-10" />
            <div className="text-left space-y-1">
              <h3 className="font-medium">Built-in Security</h3>
              <p className="text-sm text-zinc-200">
                Your passkeys stay safely on your device, shielding you from
                phishing and similar attacks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-white">
            <HugeiconsIcon
              icon={ComputerPhoneSyncFreeIcons}
              className="w-8 h-8"
            />
            <div className="text-left space-y-1">
              <h3 className="font-medium">Works Across Devices</h3>
              <p className="text-sm text-zinc-200">
                Passkeys sync across your devices so you can sign in from
                anywhere.
              </p>
            </div>
          </div>
        </div>

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
      </div>

      {/* Feature callouts */}
      <div className="hidden lg:flex lg:flex-row gap-12 text-center absolute bottom-8 mx-auto">
        <div className="flex items-center gap-6 max-w-md text-white">
          <HugeiconsIcon icon={FaceIdFreeIcons} className="w-10 h-10" />
          <div className="text-left space-y-1">
            <h3 className="text-lg font-medium">No Passwords Needed</h3>
            <p className=" text-zinc-200">
              Use Face ID to get in right away, no typing passwords or entering
              SMS codes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 max-w-md text-white">
          <HugeiconsIcon icon={LockPasswordFreeIcons} className="w-12 h-12" />
          <div className="text-left space-y-1">
            <h3 className="text-lg font-medium">Built-in Security</h3>
            <p className=" text-zinc-200">
              Your passkeys stay safely on your device, shielding you from
              phishing and similar attacks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 max-w-md text-white">
          <HugeiconsIcon
            icon={ComputerPhoneSyncFreeIcons}
            className="w-10 h-10"
          />
          <div className="text-left space-y-1">
            <h3 className="text-lg font-medium">Works Across Devices</h3>
            <p className=" text-zinc-200">
              Passkeys sync across your devices so you can sign in from
              anywhere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
