"use client";

import { useMemo } from "react";
import { LogoutButton } from "@/components/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit04FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useCurrentUser } from "@/lib/hooks";
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
  usePushSubscriptionStatus,
} from "@/lib/hooks";
import PushNotificationManager from "@/components/pwa/push-notification-manager";
import { DeleteAccountButton } from "@/components/ui/delete-account-button";

export default function ProfilePage() {
  const { data: user, isLoading, error, isFetching } = useCurrentUser();

  const { data: preferences, isLoading: preferencesLoading } =
    useNotificationPreferences();

  const updatePreference = useUpdateNotificationPreference();

  const { data: subscriptionStatus } = usePushSubscriptionStatus();

  const initials = useMemo(() => {
    const source = user?.displayName;
    if (!source) return "U";
    const parts = source
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
    return parts || "U";
  }, [user?.displayName]);

  const showLoading = isLoading || isFetching;
  const showPreferencesLoading =
    preferencesLoading || updatePreference.isPending;

  const handleTogglePreference = (
    field:
      | "supplement_reminders_enabled"
      | "refill_reminders_enabled"
      | "app_updates_enabled"
      | "system_notifications_enabled",
    value: boolean
  ) => {
    updatePreference.mutate({ field, value });
  };

  // Check if user has fully enabled notifications (both database and browser)
  const hasFullyEnabledNotifications =
    subscriptionStatus?.isFullyEnabled === true;

  return (
    <div className="mx-auto min-h-screen pb-40 pt-4 md:py-32 md:pb-48 px-4 ">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Profile Header */}
        <div className="flex w-full flex-col  gap-4 items-start bg-white p-6 md:p-8 rounded-[32px] shadow-sm">
          <h2 className="uppercase text-gray-500">Profile</h2>
          <div className="flex w-full flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-center justify-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.avatarUrl || ""} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-gray-500">Hey</p>
                <h1 className="text-2xl font-medium">
                  {showLoading ? (
                    <div className="w-20 h-8 rounded-lg bg-gray-200 animate-pulse-gray" />
                  ) : error ? (
                    "We couldn't load your name"
                  ) : (
                    user?.displayName
                  )}
                </h1>
              </div>
            </div>
            <div className="flex md:flex-row md:w-fit flex-col items-center justify-center w-full gap-2">
              <Button variant="secondary" className="w-full">
                <HugeiconsIcon
                  icon={Edit04FreeIcons}
                  strokeWidth={2}
                  className="w-4 h-4"
                />
                Edit Profile
              </Button>
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className="flex w-full flex-col  gap-4 items-start bg-white p-6 md:p-8 rounded-[32px] shadow-sm">
          <h2 className="uppercase text-gray-500">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="bg-white w-fit rounded-3xl p-4 border-2 border-blue-600 shadow-sm scale-75 md:scale-100">
                <div
                  className="bg-blue-600 w-10 h-10"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)",
                  }}
                />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-medium text-blue-600">
                  {user?.dayStreak ?? 0}{" "}
                  <span className="text-lg text-gray-900">d</span>
                </h3>
                <p className="text-gray-500">tracking history</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="bg-white w-fit rounded-3xl p-4 border-2 border-blue-600 shadow-sm scale-75 md:scale-100">
                <div
                  className="bg-blue-600 w-10 h-10"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)",
                  }}
                />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-medium text-blue-600">
                  {user?.supplementsCount ?? 0}
                </h3>
                <p className="text-gray-500">supplements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section - Only show when user has fully enabled notifications */}
        {hasFullyEnabledNotifications && (
          <div className="flex w-full flex-col gap-4 items-start bg-white p-6 md:p-8 rounded-[32px] shadow-sm">
            <h2 className="uppercase text-gray-500">Notifications</h2>
            <div className="flex w-full flex-col gap-4 items-start">
              <div className="flex justify-between items-center w-full">
                <p className="text-gray-600 md:text-xl">All</p>
                <Switch
                  checked={preferences?.system_notifications_enabled ?? true}
                  onChange={(checked) =>
                    handleTogglePreference(
                      "system_notifications_enabled",
                      checked
                    )
                  }
                  disabled={showPreferencesLoading}
                />
              </div>
              <div className="w-full h-px bg-gray-100 my-2" />
              <div className="flex justify-between items-center w-full">
                <p
                  className={`md:text-xl ${
                    !preferences?.system_notifications_enabled
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  Supplements reminders
                </p>
                <Switch
                  checked={preferences?.supplement_reminders_enabled ?? true}
                  onChange={(checked) =>
                    handleTogglePreference(
                      "supplement_reminders_enabled",
                      checked
                    )
                  }
                  disabled={
                    showPreferencesLoading ||
                    !preferences?.system_notifications_enabled
                  }
                />
              </div>
              <div className="flex justify-between items-center w-full">
                <p
                  className={`md:text-xl ${
                    !preferences?.system_notifications_enabled
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  Refill reminder
                </p>
                <Switch
                  checked={preferences?.refill_reminders_enabled ?? true}
                  onChange={(checked) =>
                    handleTogglePreference("refill_reminders_enabled", checked)
                  }
                  disabled={
                    showPreferencesLoading ||
                    !preferences?.system_notifications_enabled
                  }
                />
              </div>
              <div className="flex justify-between items-center w-full">
                <p
                  className={`md:text-xl ${
                    !preferences?.system_notifications_enabled
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  App updates
                </p>
                <Switch
                  checked={preferences?.app_updates_enabled ?? true}
                  onChange={(checked) =>
                    handleTogglePreference("app_updates_enabled", checked)
                  }
                  disabled={
                    showPreferencesLoading ||
                    !preferences?.system_notifications_enabled
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Browser Notifications Section - Only show when there are browser-level issues */}
        <PushNotificationManager />

        <div className="w-full py-4 flex justify-center">
          <div className="h-px w-4/5 bg-gray-200 rounded-full" />
        </div>

        {/* Danger zone section */}
        <div className="flex w-full flex-col md:flex-row gap-6 md:gap-32 md:items-center bg-white p-6 md:p-8 rounded-[32px] shadow-sm">
          <div className="space-y-2">
            <h2 className="text-red-600 text-lg">Danger zone</h2>
            <p className="text-gray-600 ">
              You will delete all your data like tracked supplements, user
              information and passkey. This action cannot be undone.
            </p>
          </div>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
