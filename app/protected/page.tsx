"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import SupplementCreationForm from "@/components/supplement-creation-form";
import DotGrid from "@/components/ui/DotGrid";
import SupplementsSection from "@/components/protected/supplements-section";
import { useTodaySupplements } from "@/lib/hooks/use-supplements";
import { formatDisplayDate } from "@/lib/utils";
import { Add01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface Passkey {
  id: string;
  credentialId: string;
  userId: string;
  userName?: string;
  userDisplayName?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    deviceType?: string;
    nickname?: string;
  };
  createdAt: string;
  lastUsedAt?: string;
}

export default function ProtectedPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // TanStack Query for today's supplements
  const {
    data: todayData,
    isLoading: supplementsLoading,
    error: supplementsError,
    refetch: refetchSupplements,
  } = useTodaySupplements();

  // Debug logging
  useEffect(() => {
    console.log("Today's supplements data:", todayData);
    console.log("Loading:", supplementsLoading);
    console.log("Error:", supplementsError);
  }, [todayData, supplementsLoading, supplementsError]);

  useEffect(() => {
    // Determine auth via app cookie
    const checkSession = async () => {
      try {
        const meResp = await fetch("/api/auth/me");
        if (!meResp.ok) {
          router.push("/auth");
          return;
        }
        const me = await meResp.json();
        setUserId(me.id);
        setDisplayName(me.displayName || "User");
        fetchPasskeys(me.id);
      } catch {
        router.push("/auth");
      }
    };

    checkSession();
  }, [router]);

  const fetchPasskeys = async (uid: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/passkey/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });

      if (response.ok) {
        const data = await response.json();
        setPasskeys(data.passkeys || []);
      }
    } catch (error) {
      console.error("Failed to fetch passkeys:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return null;
  }

  // Check if we have supplements data
  const hasSupplements = todayData && todayData.supplements.length > 0;

  // Show loading state
  if (supplementsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-center">
        <DotGrid fillViewport absolute zIndex={0} />
        <div className="z-10">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Show error state
  if (supplementsError) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-center">
        <DotGrid fillViewport absolute zIndex={0} />
        <div className="z-10 text-center">
          <p className="text-red-600">
            Error loading supplements: {supplementsError.message}
          </p>
          <Button
            variant="default"
            onClick={() => setIsFormOpen(true)}
            className="mt-4"
          >
            <HugeiconsIcon
              icon={Add01FreeIcons}
              strokeWidth={2}
              className="w-4 h-4"
            />
            Track new
          </Button>
        </div>
        <SupplementCreationForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />
      </div>
    );
  }

  // Show supplements list if we have data
  if (hasSupplements) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900 p-8">
        <div className="z-10 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-medium">Today</h1>
              <p className="text-lg text-gray-600">
                Mark your doses for{" "}
                <span className="text-gray-900">
                  {formatDisplayDate(todayData?.date) || todayData?.date}
                </span>
              </p>
            </div>
            <Button variant="default" onClick={() => setIsFormOpen(true)}>
              <HugeiconsIcon
                icon={Add01FreeIcons}
                strokeWidth={2}
                className="w-4 h-4"
              />
              Track new
            </Button>
          </div>

          {/* Supplements organized by time of day */}
          <SupplementsSection
            supplements={todayData!.supplements}
            date={todayData!.date}
          />

          <SupplementCreationForm
            open={isFormOpen}
            onClose={() => setIsFormOpen(false)}
          />
        </div>
      </div>
    );
  }

  // Show empty state if no supplements
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-center">
      <DotGrid fillViewport absolute zIndex={0} />
      <div className="z-10 flex flex-col items-center justify-center gap-8">
        <div className="space-y-1">
          <Image
            src="/empty-illustration-true.svg"
            alt="Logo"
            width={400}
            height={100}
            className="opacity-50"
          />
          <Image
            src="/empty-illustration-false.svg"
            alt="Logo"
            width={400}
            height={100}
          />
        </div>
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-medium">
              Welcome to your supplement space!
            </h1>
            <p className="text-lg text-gray-600">
              Press the button below to track your first supplement.
            </p>
          </div>
          <Button variant="default" onClick={() => setIsFormOpen(true)}>
            <HugeiconsIcon
              icon={Add01FreeIcons}
              strokeWidth={2}
              className="w-4 h-4"
            />
            Track new
          </Button>
        </div>
      </div>
      <SupplementCreationForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}
