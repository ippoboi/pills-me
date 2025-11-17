"use server";

import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { getEnvVar } from "@/lib/env-validation";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";
import type { Database } from "@/lib/supabase/database.types";

// Type for web-push library subscription (different from browser PushSubscription)
type WebPushSubscription = webpush.PushSubscription;

// Helper function to create service role client (bypasses RLS for WebAuthn users)
function createServiceRoleClient() {
  return createClient<Database>(
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

// Initialize VAPID details
webpush.setVapidDetails(
  // TODO GET REAL EMAIL
  "mailto:idimitak@gmail.com", // Replace with your actual email
  getEnvVar("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
  getEnvVar("VAPID_PRIVATE_KEY")
);

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
}

export interface SubscribeUserResult {
  success: boolean;
  error?: string;
}

export interface UnsubscribeUserResult {
  success: boolean;
  error?: string;
}

export interface SendNotificationResult {
  success: boolean;
  error?: string;
  sentCount?: number;
}

// Serializable version of PushSubscription for Server Actions
export interface SerializablePushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Subscribe a user to push notifications
 * Stores the subscription in the database with proper user association
 */
export async function subscribeUser(
  subscriptionData: SerializablePushSubscription
): Promise<SubscribeUserResult> {
  try {
    // Get user from session cookie (WebAuthn auth)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("pm_session")?.value;

    if (!sessionToken) {
      return { success: false, error: "User not authenticated" };
    }

    const sessionPayload = await verifySessionToken(sessionToken);
    if (!sessionPayload?.uid) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionPayload.uid;
    const supabase = createServiceRoleClient();

    // Get user agent for debugging purposes
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";

    // Prepare subscription data (cast to Json for database)
    const dbSubscriptionData = {
      user_id: userId,
      subscription_data:
        subscriptionData as unknown as Database["public"]["Tables"]["push_subscriptions"]["Insert"]["subscription_data"],
      endpoint: subscriptionData.endpoint,
      user_agent: userAgent,
    };

    // Insert or update subscription (upsert based on unique constraint)
    const { error: dbError } = await supabase
      .from("push_subscriptions")
      .upsert(dbSubscriptionData, {
        onConflict: "user_id,endpoint",
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return { success: false, error: "Failed to save subscription" };
    }

    console.log("Push subscription saved successfully for user:", userId);
    return { success: true };
  } catch (error) {
    console.error("Error subscribing user:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Unsubscribe a user from push notifications
 * Removes the subscription from the database
 */
export async function unsubscribeUser(
  endpoint?: string
): Promise<UnsubscribeUserResult> {
  try {
    // Get user from session cookie (WebAuthn auth)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("pm_session")?.value;

    if (!sessionToken) {
      return { success: false, error: "User not authenticated" };
    }

    const sessionPayload = await verifySessionToken(sessionToken);
    if (!sessionPayload?.uid) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionPayload.uid;
    const supabase = createServiceRoleClient();

    let query = supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId);

    // If endpoint is provided, only delete that specific subscription
    if (endpoint) {
      query = query.eq("endpoint", endpoint);
    }

    const { error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return { success: false, error: "Failed to remove subscription" };
    }

    console.log("Push subscription removed successfully for user:", userId);
    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing user:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Send a push notification to a specific user
 * Retrieves all subscriptions for the user and sends the notification
 */
export async function sendNotification(
  userId: string,
  payload: NotificationPayload
): Promise<SendNotificationResult> {
  try {
    const supabase = createServiceRoleClient();

    // Get all active subscriptions for the user
    const { data: subscriptions, error: dbError } = await supabase
      .from("push_subscriptions")
      .select("subscription_data, endpoint")
      .eq("user_id", userId);

    if (dbError) {
      console.error("Database error:", dbError);
      return { success: false, error: "Failed to retrieve subscriptions" };
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions found for user:", userId);
      return { success: true, sentCount: 0 };
    }

    // Determine default URL based on notification type
    let defaultUrl = "/todos"; // Default to todos for reminder notifications
    if (payload.tag && payload.tag.includes("refill")) {
      // Refill notification - use supplement ID if available
      const supplementId = payload.data?.supplementId;
      defaultUrl = supplementId ? `/supplements/${supplementId}` : "/todos";
    } else if (payload.tag && payload.tag.includes("app-update")) {
      // App update notification - redirect to todos
      defaultUrl = "/todos";
    } else if (payload.data?.supplementId && !payload.url) {
      // Has supplement ID but no explicit URL - likely a refill notification
      defaultUrl = `/supplements/${payload.data.supplementId}`;
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/icon-192x192.png",
      url: payload.url || defaultUrl,
      data: payload.data || {},
      actions: payload.actions || [],
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      tag: payload.tag || "pills-me-notification",
    });

    // Send notifications to all user subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        // Convert stored subscription data to format expected by web-push library
        const subscriptionData =
          sub.subscription_data as unknown as SerializablePushSubscription;
        const webPushSubscription: WebPushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: subscriptionData.keys.p256dh,
            auth: subscriptionData.keys.auth,
          },
        };

        await webpush.sendNotification(
          webPushSubscription,
          notificationPayload
        );
        return { success: true, endpoint: sub.endpoint };
      } catch (error: unknown) {
        console.error(`Failed to send notification to ${sub.endpoint}:`, error);

        // If subscription is invalid (410 Gone), remove it from database
        if (
          error &&
          typeof error === "object" &&
          "statusCode" in error &&
          error.statusCode === 410
        ) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
          console.log("Removed invalid subscription:", sub.endpoint);
        }

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return { success: false, endpoint: sub.endpoint, error: errorMessage };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter((r) => r.success).length;

    console.log(
      `Sent ${successCount}/${subscriptions.length} notifications for user:`,
      userId
    );

    return {
      success: true,
      sentCount: successCount,
    };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Send a test notification to the current user
 * Convenience function for testing push notifications
 */
export async function sendTestNotification(
  message: string
): Promise<SendNotificationResult> {
  try {
    // Get user from session cookie (WebAuthn auth)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("pm_session")?.value;

    if (!sessionToken) {
      return { success: false, error: "User not authenticated" };
    }

    const sessionPayload = await verifySessionToken(sessionToken);
    if (!sessionPayload?.uid) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionPayload.uid;

    const payload: NotificationPayload = {
      title: "Test Notification",
      body: message || "This is a test notification from Pills-Me",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      url: "/supplements",
      tag: "test-notification",
    };

    return await sendNotification(userId, payload);
  } catch (error) {
    console.error("Error sending test notification:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get push subscription status for the current user
 * Returns information about active subscriptions
 */
export async function getSubscriptionStatus() {
  try {
    // Get user from session cookie (WebAuthn auth)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("pm_session")?.value;

    if (!sessionToken) {
      return { subscribed: false, count: 0 };
    }

    const sessionPayload = await verifySessionToken(sessionToken);
    if (!sessionPayload?.uid) {
      return { subscribed: false, count: 0 };
    }

    const userId = sessionPayload.uid;
    const supabase = createServiceRoleClient();

    // Count active subscriptions
    const { count, error: dbError } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (dbError) {
      console.error("Database error:", dbError);
      return { subscribed: false, count: 0 };
    }

    return {
      subscribed: (count || 0) > 0,
      count: count || 0,
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return { subscribed: false, count: 0 };
  }
}

/**
 * Clean up database subscriptions when browser permissions are revoked
 * This helps keep the database in sync with actual browser state
 */
export async function cleanupRevokedSubscriptions() {
  try {
    // Get user from session cookie (WebAuthn auth)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("pm_session")?.value;

    if (!sessionToken) {
      return { success: false, error: "User not authenticated" };
    }

    const sessionPayload = await verifySessionToken(sessionToken);
    if (!sessionPayload?.uid) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionPayload.uid;
    const supabase = createServiceRoleClient();

    // Remove all subscriptions for this user
    const { error: dbError } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId);

    if (dbError) {
      console.error("Database error:", dbError);
      return { success: false, error: "Failed to cleanup subscriptions" };
    }

    console.log("Cleaned up revoked subscriptions for user:", userId);
    return { success: true };
  } catch (error) {
    console.error("Error cleaning up subscriptions:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
