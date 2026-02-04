"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Selector } from "@/components/ui/selector";
import { Switch } from "@/components/ui/switch";
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from "@/lib/hooks";
import { Globe02FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

// Common timezones for the dropdown
const commonTimezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "Europe/London", label: "GMT (London)" },
  { value: "Europe/Paris", label: "GMT+1 - Brussels, Copenhagen, Madrid, Paris" },
  { value: "Europe/Berlin", label: "CET (Berlin)" },
  { value: "Asia/Tokyo", label: "JST (Tokyo)" },
  { value: "Asia/Shanghai", label: "CST (Shanghai)" },
  { value: "Asia/Kolkata", label: "IST (India)" },
  { value: "Asia/Bangkok", label: "ICT (Bangkok)" },
  { value: "Australia/Sydney", label: "AEDT (Sydney)" },
];

export function NotificationsTab() {
  const { data: preferences, isLoading: preferencesLoading } =
    useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();

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

  // Add detected timezone if it's not in the common list
  const allTimezones = useMemo(() => {
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

  // Build selector options with globe icon
  const timezoneOptions = useMemo(() => {
    return allTimezones.map((tz) => ({
      value: tz.value,
      label: tz.label,
      icon: (
        <HugeiconsIcon
          icon={Globe02FreeIcons}
          size={18}
          strokeWidth={1.5}
          className="text-gray-400"
        />
      ),
    }));
  }, [allTimezones]);

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

  const isLoading = preferencesLoading || updatePreference.isPending;

  return (
    <div className="space-y-10 flex flex-col items-end">
      {/* Timezone */}
      <div className="grid grid-cols-1 sm:grid-cols-5 w-full">
        <div className="sm:col-span-2 pr-8">
          <label className="text-gray-900 font-medium">Timezone</label>
        </div>
        <div className="sm:col-span-3 flex flex-col gap-4">
          {/* Map placeholder */}
          <div className="w-full h-[180px] bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
            <span className="text-gray-300 text-sm">Map placeholder</span>
          </div>

          {/* Timezone selector */}
          <Selector
            value={preferences?.timezone || "UTC"}
            onValueChange={handleTimezoneChange}
            options={timezoneOptions}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="h-px w-3/5 bg-gray-100" />

      {/* Notification preferences */}
      <div className="grid grid-cols-1 sm:grid-cols-5 items-start w-full">
        <div className="sm:col-span-2 pr-8">
          <label className="text-gray-900 font-medium">
            Notification preferences
          </label>
        </div>
        <div className="sm:col-span-3 flex flex-col gap-4">
          {/* All notifications */}
          <div className="flex items-center justify-between">
            <span className="text-gray-900">All</span>
            <Switch
              checked={preferences?.system_notifications_enabled ?? true}
              onChange={(checked) =>
                handleTogglePreference("system_notifications_enabled", checked)
              }
              disabled={isLoading}
            />
          </div>

          {/* Supplements reminders */}
          <div className="flex items-center justify-between">
            <span
              className={
                !preferences?.system_notifications_enabled
                  ? "text-gray-400"
                  : "text-gray-900"
              }
            >
              Supplements reminders
            </span>
            <Switch
              checked={preferences?.supplement_reminders_enabled ?? true}
              onChange={(checked) =>
                handleTogglePreference("supplement_reminders_enabled", checked)
              }
              disabled={isLoading || !preferences?.system_notifications_enabled}
            />
          </div>

          {/* Refill reminder */}
          <div className="flex items-center justify-between">
            <span
              className={
                !preferences?.system_notifications_enabled
                  ? "text-gray-400"
                  : "text-gray-900"
              }
            >
              Refill reminder
            </span>
            <Switch
              checked={preferences?.refill_reminders_enabled ?? true}
              onChange={(checked) =>
                handleTogglePreference("refill_reminders_enabled", checked)
              }
              disabled={isLoading || !preferences?.system_notifications_enabled}
            />
          </div>

          {/* App updates */}
          <div className="flex items-center justify-between">
            <span
              className={
                !preferences?.system_notifications_enabled
                  ? "text-gray-400"
                  : "text-gray-900"
              }
            >
              App updates
            </span>
            <Switch
              checked={preferences?.app_updates_enabled ?? true}
              onChange={(checked) =>
                handleTogglePreference("app_updates_enabled", checked)
              }
              disabled={isLoading || !preferences?.system_notifications_enabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
