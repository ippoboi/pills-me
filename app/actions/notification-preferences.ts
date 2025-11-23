"use server";

import { createClient } from "@supabase/supabase-js";
import { getEnvVar } from "@/lib/env-validation";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";
import type { Database } from "@/lib/supabase/database.types";
import type { NotificationPreferences } from "@/lib/types/user";

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

export interface GetNotificationPreferencesResult {
  success: boolean;
  data?: NotificationPreferences;
  error?: string;
}

export interface UpdateNotificationPreferenceResult {
  success: boolean;
  data?: NotificationPreferences;
  error?: string;
}

/**
 * Get notification preferences for the current user
 */
export async function getNotificationPreferences(): Promise<GetNotificationPreferencesResult> {
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

    // Get notification preferences
    const { data: preferences, error: dbError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (dbError) {
      console.error("Database error:", dbError);
      return { success: false, error: "Failed to fetch preferences" };
    }

    // If no preferences exist, create default ones
    if (!preferences) {
      const { data: newPreferences, error: createError } = await supabase
        .from("notification_preferences")
        .insert({
          user_id: userId,
          supplement_reminders_enabled: true,
          refill_reminders_enabled: true,
          app_updates_enabled: true,
          system_notifications_enabled: true,
          timezone: "UTC", // Default timezone, will be updated by user
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating preferences:", createError);
        return { success: false, error: "Failed to create preferences" };
      }

      return { success: true, data: newPreferences };
    }

    return { success: true, data: preferences };
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Update a specific notification preference field
 */
export async function updateNotificationPreference(
  field: keyof Pick<
    NotificationPreferences,
    | "supplement_reminders_enabled"
    | "refill_reminders_enabled"
    | "app_updates_enabled"
    | "system_notifications_enabled"
    | "timezone"
  >,
  value: boolean | string
): Promise<UpdateNotificationPreferenceResult> {
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

    // Validate field
    const validFields = [
      "supplement_reminders_enabled",
      "refill_reminders_enabled",
      "app_updates_enabled",
      "system_notifications_enabled",
      "timezone",
    ];

    if (!validFields.includes(field)) {
      return { success: false, error: "Invalid preference field" };
    }

    // Additional validation for timezone field
    if (field === "timezone" && typeof value !== "string") {
      return { success: false, error: "Timezone must be a string" };
    }

    if (
      field === "timezone" &&
      typeof value === "string" &&
      value.trim() === ""
    ) {
      return { success: false, error: "Timezone cannot be empty" };
    }

    // Update the preference
    const { data: updatedPreferences, error: dbError } = await supabase
      .from("notification_preferences")
      .update({ [field]: value })
      .eq("user_id", userId)
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return { success: false, error: "Failed to update preference" };
    }

    console.log(`Updated ${field} to ${value} for user:`, userId);
    return { success: true, data: updatedPreferences };
  } catch (error) {
    console.error("Error updating notification preference:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Update multiple notification preferences at once
 */
export async function updateNotificationPreferences(
  updates: Partial<
    Pick<
      NotificationPreferences,
      | "supplement_reminders_enabled"
      | "refill_reminders_enabled"
      | "app_updates_enabled"
      | "system_notifications_enabled"
      | "timezone"
    >
  >
): Promise<UpdateNotificationPreferenceResult> {
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

    // Update the preferences
    const { data: updatedPreferences, error: dbError } = await supabase
      .from("notification_preferences")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return { success: false, error: "Failed to update preferences" };
    }

    console.log(`Updated preferences for user:`, userId, updates);
    return { success: true, data: updatedPreferences };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
