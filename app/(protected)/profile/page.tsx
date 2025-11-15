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
    <div className="mx-auto min-h-screen flex items-center justify-center px-4">
      <div className="flex w-full max-w-xl flex-col md:flex-row gap-8 md:gap-4 items-start md:items-center justify-between bg-white p-6 md:p-8 rounded-[32px] shadow-sm">
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
    </div>
  );
}
