"use client";

import { useState, useEffect } from "react";
import {
  subscribeUser,
  unsubscribeUser,
  sendTestNotification,
  type SerializablePushSubscription,
} from "@/app/actions/push-notifications";
import { Button } from "@/components/ui/button";

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
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
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
        setSuccess("Successfully subscribed to push notifications!");
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

  async function unsubscribeFromPush() {
    if (isLoading) return;

    setIsLoading(true);
    clearMessages();

    try {
      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const result = await unsubscribeUser(subscription.endpoint);

        if (result.success) {
          setSuccess("Successfully unsubscribed from push notifications");
        } else {
          throw new Error(result.error || "Failed to remove subscription");
        }
      }

      setSubscription(null);
    } catch (error: unknown) {
      console.error("Failed to unsubscribe:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to unsubscribe from push notifications";
      setError(errorMessage);
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
        setSuccess(
          `Test notification sent successfully! (${result.sentCount} devices)`
        );
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
        setSuccess(
          "Local notification sent! If you didn't see it, check your system notification settings."
        );
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
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Push notifications are not supported in this browser. Please use a
          modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Push Notifications</h3>
        <p className="text-sm text-gray-600 mb-4">
          Get notified about your supplement reminders and important updates.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {subscription ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-gray-700">
              You are subscribed to push notifications
            </p>
          </div>

          <Button
            onClick={unsubscribeFromPush}
            variant="outline"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Unsubscribing..." : "Unsubscribe"}
          </Button>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Test Notifications</h4>
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
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <p className="text-sm text-gray-700">
              You are not subscribed to push notifications
            </p>
          </div>

          <Button
            onClick={subscribeToPush}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Subscribing..." : "Enable Notifications"}
          </Button>

          <p className="text-xs text-gray-500">
            We&apos;ll ask for your permission to send notifications. You can
            change this anytime in your browser settings.
          </p>
        </div>
      )}
    </div>
  );
}
