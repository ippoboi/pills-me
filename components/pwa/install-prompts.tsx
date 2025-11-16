"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

// Extend Window interface to include MSStream property
declare global {
  interface Window {
    MSStream?: unknown;
  }
}

// BeforeInstallPromptEvent interface (not standard, so we define it)
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

    // Check if already installed
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  // Don't show if no install prompt available and not iOS
  if (!showPrompt && !isIOS) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Install App</h3>
        <p className="text-sm text-gray-600 mb-4">
          Install Pills-Me for a better experience with offline access and
          notifications.
        </p>
      </div>

      {/* Android/Chrome install button */}
      {showPrompt && (
        <Button onClick={handleInstallClick} className="w-full sm:w-auto">
          Add to Home Screen
        </Button>
      )}

      {/* iOS instructions */}
      {isIOS && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            To install this app on your iOS device:
          </p>
          <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
            <li>
              Tap the share button <span className="font-mono">⎋</span> in
              Safari
            </li>
            <li>
              Scroll down and tap &quot;Add to Home Screen&quot;{" "}
              <span className="font-mono">➕</span>
            </li>
            <li>Tap &quot;Add&quot; to confirm</li>
          </ol>
        </div>
      )}
    </div>
  );
}
