import type { Database } from "@/lib/supabase/database.types";

export interface NotificationPreferences {
  id: string;
  user_id: string;
  supplement_reminders_enabled: boolean;
  refill_reminders_enabled: boolean;
  app_updates_enabled: boolean;
  system_notifications_enabled: boolean;
  reminder_times: Database["public"]["Tables"]["notification_preferences"]["Row"]["reminder_times"];
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface CurrentUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  notificationPreferences: NotificationPreferences | null;
  dayStreak: number | null;
  supplementsCount: number | null;
}
