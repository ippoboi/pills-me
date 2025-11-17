"use client";

import { useState, useEffect } from "react";
import {
  subscribeUser,
  sendTestNotification,
  type SerializablePushSubscription,
} from "@/app/actions/push-notifications";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  usePushSubscriptionStatus,
  useCleanupRevokedSubscriptions,
} from "@/lib/hooks";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get comprehensive subscription status
  const { data: subscriptionStatus, refetch: refetchSubscriptionStatus } =
    usePushSubscriptionStatus();
  const cleanupRevoked = useCleanupRevokedSubscriptions();

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  // Effect to cleanup database when browser permissions are revoked
  useEffect(() => {
    if (subscriptionStatus) {
      const { hasServerSubscription, browserPermission } = subscriptionStatus;

      // If we have server subscriptions but browser permission is denied,
      // cleanup the database to keep it in sync
      if (hasServerSubscription && browserPermission === "denied") {
        console.log(
          "Browser permissions denied, cleaning up database subscriptions"
        );
        cleanupRevoked.mutate();
      }
    }
  }, [subscriptionStatus, cleanupRevoked]);

  const clearMessages = () => {
    setError(null);
  };

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      console.log("Service worker registered successfully");
    } catch (error) {
      console.error("Failed to register service worker:", error);
      setError("Failed to register service worker");
    }
  }

  async function subscribeToPush() {
    if (isLoading) return;

    setIsLoading(true);
    clearMessages();

    try {
      // Check current permission status
      console.log("Current notification permission:", Notification.permission);

      // Check for notification permission
      const permission = await Notification.requestPermission();
      console.log("Permission after request:", permission);

      if (permission !== "granted") {
        throw new Error(
          `Notification permission ${permission}. Please enable notifications in your browser settings.`
        );
      }

      const registration = await navigator.serviceWorker.ready;
      console.log("Service worker ready:", registration);

      // Check if VAPID key is available
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      console.log("VAPID key available:", !!vapidKey);

      if (!vapidKey) {
        throw new Error("VAPID public key not configured");
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      console.log("Push subscription created:", sub);
      setSubscription(sub);

      // Convert PushSubscription to serializable format
      const serializableSubscription: SerializablePushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
          auth: arrayBufferToBase64(sub.getKey("auth")!),
        },
      };

      // Save subscription to database
      console.log("Saving subscription to database:", serializableSubscription);
      const result = await subscribeUser(serializableSubscription);
      console.log("Database save result:", result);

      if (result.success) {
        // Refetch subscription status to update the UI
        refetchSubscriptionStatus();
      } else {
        throw new Error(result.error || "Failed to save subscription");
      }
    } catch (error: unknown) {
      console.error("Failed to subscribe:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to subscribe to push notifications";
      setError(errorMessage);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendTestNotification() {
    if (isLoading || !subscription) return;

    setIsLoading(true);
    clearMessages();

    try {
      console.log("Sending test notification...");
      const result = await sendTestNotification(
        message || "Test notification from Pills-Me!"
      );
      console.log("Test notification result:", result);

      if (result.success) {
        setMessage("");
      } else {
        throw new Error(result.error || "Failed to send notification");
      }
    } catch (error: unknown) {
      console.error("Failed to send test notification:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send test notification";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  // Function to test local notification (bypasses server)
  async function testLocalNotification() {
    if (!subscription) return;

    try {
      console.log("Testing local notification...");

      // Test if we can show a local notification
      if (Notification.permission === "granted") {
        new Notification("Local Test", {
          body: "This is a local test notification to verify notifications work on your system",
          icon: "/icon-192x192.png",
        });
      } else {
        setError("Notification permission not granted");
      }
    } catch (error) {
      console.error("Local notification failed:", error);
      setError("Failed to send local notification");
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-[32px] ">
        <p className="text-yellow-800">
          Push notifications are not supported in this browser. Please use a
          modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  const isDevelopment = process.env.NODE_ENV === "development";

  // Use comprehensive subscription status
  const isFullyEnabled = subscriptionStatus?.isFullyEnabled ?? false;
  const needsResubscription = subscriptionStatus?.needsResubscription ?? false;

  // Only show this component when:
  // 1. Notifications are not fully enabled (missing permission or subscription)
  // 2. There's an error
  // 3. User needs to resubscribe due to browser/database mismatch
  const shouldShow = !isFullyEnabled || error || needsResubscription;

  if (!shouldShow) {
    return null; // Hide when everything is working fine
  }

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm space-y-4">
      <div className="space-y-2">
        <h2 className="uppercase text-gray-500">Allow Notifications</h2>
        <p className="text-gray-600 mb-4 max-w-md">
          {needsResubscription
            ? "Your browser notifications were disabled. Please re-enable them to continue receiving supplement reminders."
            : "Allow your browser to receive notifications for supplement reminders and updates."}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {subscription ? (
        <div className="space-y-4">
          {isDevelopment && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">
                Test Notifications (Development)
              </h4>
              <div className="space-y-2">
                <Button
                  onClick={testLocalNotification}
                  variant="outline"
                  className="w-full sm:w-auto mr-2"
                >
                  Test Local Notification
                </Button>
                <input
                  type="text"
                  placeholder="Enter test message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendTestNotification}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? "Sending..." : "Send Push Notification"}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Button
            onClick={subscribeToPush}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="animation-spin" />
            ) : (
              "Enable Notifications"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
