"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit04FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/lib/hooks";
import PushNotificationManager from "@/components/pwa/push-notification-manager";

export default function ProfilePage() {
  const router = useRouter();
  const {
    data: user,
    isLoading,
    error,

    isFetching,
  } = useCurrentUser();

  useEffect(() => {
    if (error?.message === "Unauthorized") {
      router.push("/auth");
    }
  }, [error, router]);

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

  return (
    <div className="mx-auto min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="flex w-full flex-col md:flex-row gap-8 md:gap-4 items-start md:items-center justify-between bg-white p-6 md:p-8 rounded-[32px] shadow-sm">
          <div className="flex items-center justify-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-gray-500">Hey</p>
              <h1 className="text-2xl font-medium">
                {showLoading ? (
                  <span className="flex items-center gap-2 text-base text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                ) : error ? (
                  "We couldn't load your name"
                ) : (
                  user?.displayName
                )}
              </h1>
            </div>
          </div>
          <div className="flex flex-rows items-center justify-center gap-4">
            <Button variant="secondary">
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

        {/* Notifications Section */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm">
          <PushNotificationManager />
        </div>

        {/* Additional Settings Placeholder */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Notification Preferences</p>
                <p className="text-sm text-gray-600">
                  Customize your notification settings
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Data Export</p>
                <p className="text-sm text-gray-600">
                  Export your supplement data
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Privacy Settings</p>
                <p className="text-sm text-gray-600">
                  Manage your privacy preferences
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
