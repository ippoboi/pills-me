"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { LogoutButton } from "@/components/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Edit04FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronsUpDown } from "lucide-react";

import { useCurrentUser } from "@/lib/hooks";
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
  usePushSubscriptionStatus,
} from "@/lib/hooks";
import PushNotificationManager from "@/components/pwa/push-notification-manager";
import { DeleteAccountButton } from "@/components/ui/delete-account-button";
import DeleteAccountModal from "@/components/protected/delete-account-modal";

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

  const [timezoneOpen, setTimezoneOpen] = useState(false);

  const [detectedTimezone, setDetectedTimezone] = useState<string>("");

  // Detect user's timezone on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setDetectedTimezone(timezone);
      } catch (error) {
        console.warn("Could not detect timezone:", error);
        setDetectedTimezone("UTC");
      }
    }
  }, []);

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

  const handleTimezoneChange = useCallback(
    (timezone: string) => {
      updatePreference.mutate({ field: "timezone", value: timezone });
    },
    [updatePreference]
  );

  // Automatically set detected timezone if user still has UTC and we've detected a different timezone
  useEffect(() => {
    if (
      detectedTimezone &&
      detectedTimezone !== "UTC" &&
      preferences?.timezone === "UTC" &&
      !preferencesLoading &&
      !updatePreference.isPending
    ) {
      console.log(`Auto-setting timezone to detected: ${detectedTimezone}`);
      handleTimezoneChange(detectedTimezone);
    }
  }, [
    detectedTimezone,
    preferences?.timezone,
    preferencesLoading,
    updatePreference.isPending,
    handleTimezoneChange,
  ]);

  // Add detected timezone if it's not in the common list
  const allTimezones = useMemo(() => {
    // Common timezones for the dropdown
    const commonTimezones = [
      { value: "UTC", label: "UTC (Coordinated Universal Time)" },
      { value: "America/New_York", label: "Eastern Time (New York)" },
      { value: "America/Chicago", label: "Central Time (Chicago)" },
      { value: "America/Denver", label: "Mountain Time (Denver)" },
      { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
      { value: "Europe/London", label: "GMT (London)" },
      { value: "Europe/Paris", label: "CET (Paris)" },
      { value: "Europe/Berlin", label: "CET (Berlin)" },
      { value: "Asia/Tokyo", label: "JST (Tokyo)" },
      { value: "Asia/Shanghai", label: "CST (Shanghai)" },
      { value: "Asia/Kolkata", label: "IST (India)" },
      { value: "Asia/Bangkok", label: "ICT (Bangkok)" },
      { value: "Australia/Sydney", label: "AEDT (Sydney)" },
    ];

    if (
      detectedTimezone &&
      !commonTimezones.some((tz) => tz.value === detectedTimezone)
    ) {
      return [
        { value: detectedTimezone, label: `${detectedTimezone} (Detected)` },
        ...commonTimezones,
      ];
    }
    return commonTimezones;
  }, [detectedTimezone]);

  // Check if user has fully enabled notifications (both database and browser)
  const hasFullyEnabledNotifications =
    subscriptionStatus?.isFullyEnabled === true;

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

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
                <AvatarFallback>{initials || "U"}</AvatarFallback>
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
                <p className="text-gray-600 md:text-lg">All</p>
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
                  className={`md:text-lg ${
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
                  className={`md:text-lg ${
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
                  className={`md:text-lg ${
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

        {/* Timezone Settings Section */}
        {preferences && (
          <div className="flex w-full flex-col gap-4 bg-white p-6 md:p-8 rounded-[32px] shadow-sm">
            <div className="space-y-2">
              <h2 className="uppercase text-gray-500">Timezone Settings</h2>
              <p className="text-gray-600 text-sm">
                Set your local timezone for accurate notification timing.
                Reminders will be sent at your local time.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                    <PopoverTrigger asChild>
                      <button
                        disabled={showPreferencesLoading}
                        className="w-full px-3 pr-10 h-10 border border-gray-100 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-gray-900">
                          {allTimezones.find(
                            (tz) => tz.value === (preferences.timezone || "UTC")
                          )?.label || "UTC (Coordinated Universal Time)"}
                        </span>
                        <div className="pointer-events-none bg-white rounded-[10px] h-9 w-9 border border-gray-200 absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                          <ChevronsUpDown className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-0 w-full max-w-sm"
                      align="start"
                    >
                      <div className="p-1 space-y-1 max-h-60 overflow-y-auto">
                        {allTimezones.map((tz) => (
                          <button
                            key={tz.value}
                            onClick={() => {
                              handleTimezoneChange(tz.value);
                              setTimezoneOpen(false);
                            }}
                            disabled={showPreferencesLoading}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {tz.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Current timezone:{" "}
                <strong>{preferences.timezone || "UTC"}</strong>
                {preferences.timezone && preferences.timezone !== "UTC" && (
                  <span className="ml-2">
                    (Local time:{" "}
                    {new Date().toLocaleString("en-US", {
                      timeZone: preferences.timezone,
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZoneName: "short",
                    })}
                    )
                  </span>
                )}
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
          <DeleteAccountButton onClick={() => setDeleteModalOpen(true)} />
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
