"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showFakeLoading, setShowFakeLoading] = useState(false);
  const hasName = Boolean(name.trim());
  const [isConfirmHidden, setIsConfirmHidden] = useState(!hasName);
  const fakeLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (hasName) {
      setIsConfirmHidden(false);
      return;
    }

    const timeout = window.setTimeout(() => setIsConfirmHidden(true), 300);

    return () => window.clearTimeout(timeout);
  }, [hasName]);

  useEffect(() => {
    return () => {
      if (fakeLoadingTimeoutRef.current) {
        clearTimeout(fakeLoadingTimeoutRef.current);
      }
    };
  }, []);

  const handleConfirm = async () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsLoading(true);

    try {
      const displayName = name.trim();
      const supabase = createClient();

      // Create anonymous Supabase Auth user (no email needed!)
      const { data: authData, error: authError } =
        await supabase.auth.signInAnonymously({
          options: {
            data: {
              display_name: displayName,
            },
          },
        });

      if (authError || !authData.user) {
        throw new Error(authError?.message || "Failed to create user");
      }

      // Use the Supabase Auth UUID for the passkey
      const userId = authData.user.id;

      // Start registration
      const startResp = await fetch("/api/passkey/register/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userName: displayName,
          userDisplayName: displayName,
        }),
      });
      if (!startResp.ok) {
        const { error } = await startResp.json();
        throw new Error(error || "Failed to start registration");
      }
      const options = await startResp.json();
      const attResp = await startRegistration({ optionsJSON: options });

      const finishResp = await fetch("/api/passkey/register/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          credential: attResp,
          userName: displayName,
          userDisplayName: displayName,
          deviceInfo: {},
        }),
      });
      if (!finishResp.ok) {
        const { error } = await finishResp.json();
        throw new Error(error || "Failed to finish registration");
      }
      const result = await finishResp.json();

      if (result.verified) {
        setShowFakeLoading(true);
        setIsLoading(false);
        fakeLoadingTimeoutRef.current = setTimeout(() => {
          router.push("/");
        }, 2000);
        return;
      } else {
        alert("Passkey registration failed. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterError(
        (error as Error)?.message || "Failed to create passkey."
      );
      alert("Failed to create passkey. Please try again.");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/auth-illustration.jpg')] bg-cover bg-center  relative overflow-hidden">
      <div className="relative z-10 w-full max-w-xl px-6">
        {!showFakeLoading ? (
          <div className="space-y-12 max-w-md">
            <div className="space-y-4">
              <h1 className="text-5xl text-white">Welcome!</h1>
              <p className="text-zinc-200 text-xl">
                How would you like to be called?
              </p>
            </div>

            {/* Name input */}

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Your name"
              disabled={isLoading}
              className="w-full px-6 py-4 text-center text-5xl font-medium bg-transparent rounded-2xl text-white placeholder-white/50 focus:outline-none  disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />

            {/* Error message */}
            {registerError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                {registerError}
              </div>
            )}

            {/* Confirm button */}

            <button
              onClick={handleConfirm}
              disabled={isLoading || !hasName}
              aria-hidden={!hasName}
              style={{ visibility: isConfirmHidden ? "hidden" : "visible" }}
              className={`${
                hasName
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none cursor-not-allowed"
              } w-full px-8 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30 text-white font-medium hover:bg-white/5 hover:border-white/40 transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Create passkey"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-white" />

            <div className="space-y-2">
              <h2 className="text-4xl text-white">
                Nice to meet you, {name.trim() || "User"}!
              </h2>
              <p className="text-zinc-200 text-lg">
                We are creating your supplement&apos;s space
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
