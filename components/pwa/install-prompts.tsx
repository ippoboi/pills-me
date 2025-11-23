"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const STORAGE_KEY = "pills-me-install-prompt-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

function shouldShowPrompt(): boolean {
  if (typeof window === "undefined") return false;

  const dismissed = localStorage.getItem(STORAGE_KEY);
  if (!dismissed) return true;

  const dismissedTime = parseInt(dismissed, 10);
  const now = Date.now();
  const timeSinceDismissal = now - dismissedTime;

  // Show again if more than 7 days have passed
  return timeSinceDismissal > DISMISS_DURATION;
}

function dismissPrompt(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
}

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check if it's iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

    // Check if already installed
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Check if user has dismissed it recently
    const canShow = shouldShowPrompt();
    setShouldShow(canShow);

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (canShow) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show iOS prompt if applicable and not dismissed
    if (isIOS && canShow && !isStandalone) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [mounted, isIOS, isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      // User accepted, dismiss the prompt
      dismissPrompt();
      setShowPrompt(false);
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    dismissPrompt();
    setShowPrompt(false);
  };

  // Don't show if already installed
  if (isStandalone || !mounted) {
    return null;
  }

  // Don't show if no install prompt available and not iOS
  if (!showPrompt || !shouldShow) {
    return null;
  }

  const popupContent = (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 right-4 z-[9998] max-w-sm w-[calc(100%-2rem)] sm:w-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 space-y-4">
            {/* Header with close button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Install App
                </h3>
                <p className="text-sm text-gray-600">
                  Install Pills-Me for a better experience with offline access
                  and notifications.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Android/Chrome install button */}
            {deferredPrompt && (
              <Button
                onClick={handleInstallClick}
                className="w-full"
                size="default"
              >
                Add to Home Screen
              </Button>
            )}

            {/* iOS instructions */}
            {isIOS && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  To install on iOS:
                </p>
                <ol className="text-sm text-blue-800 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">1.</span>
                    <span>
                      Tap the share button{" "}
                      <span className="font-mono text-xs">⎋</span> in Safari
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">2.</span>
                    <span>
                      Scroll and tap &quot;Add to Home Screen&quot;{" "}
                      <span className="font-mono text-xs">➕</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Tap &quot;Add&quot; to confirm</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(popupContent, document.body) : null;
}
