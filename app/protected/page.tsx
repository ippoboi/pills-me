"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import SupplementCreationForm from "@/components/supplement-creation-form";
import SupplementsSection from "@/components/protected/supplements-section";
import { useTodaySupplements } from "@/lib/hooks";
import { formatDisplayDate } from "@/lib/utils";
import type { TodaySupplementsResponse } from "@/lib/types";
import { Add01FreeIcons, RefreshFreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

// Reusable centered layout wrapper
interface SupplementLayoutProps {
  children: React.ReactNode;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
}

function SupplementLayout({
  children,
  isFormOpen,
  setIsFormOpen,
}: SupplementLayoutProps) {
  return (
    <>
      {children}
      <SupplementCreationForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </>
  );
}

// Loading state
function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

// Error state
function ErrorState({
  error,
  onRefetch,
}: {
  error: Error;
  onRefetch: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-red-600">
          Error loading supplements: {error?.message || "Unknown error"}
        </p>
        <Button variant="default" onClick={onRefetch}>
          <HugeiconsIcon
            icon={RefreshFreeIcons}
            strokeWidth={2}
            className="w-4 h-4"
          />
          Refresh
        </Button>
      </div>
    </div>
  );
}

// Empty state
function EmptyState({ onTrackNew }: { onTrackNew: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-8">
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
          <Button variant="default" onClick={onTrackNew}>
            <HugeiconsIcon
              icon={Add01FreeIcons}
              strokeWidth={2}
              className="w-4 h-4"
            />
            Track new
          </Button>
        </div>
      </div>
    </div>
  );
}

// Default state with supplements
function SupplementsContent({
  todayData,
  onTrackNew,
}: {
  todayData: TodaySupplementsResponse;
  onTrackNew: () => void;
}) {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
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
          <Button variant="default" onClick={onTrackNew}>
            <HugeiconsIcon
              icon={Add01FreeIcons}
              strokeWidth={2}
              className="w-4 h-4"
            />
            Track new
          </Button>
        </div>

        <SupplementsSection
          supplements={todayData!.supplements}
          date={todayData!.date}
        />
      </div>
    </div>
  );
}

export default function ProtectedPage() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    data: todayData,
    isLoading: supplementsLoading,
    error: supplementsError,
    refetch: refetchSupplements,
  } = useTodaySupplements();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const meResp = await fetch("/api/auth/me");
        if (!meResp.ok) {
          router.push("/auth");
        }
      } catch {
        router.push("/auth");
      }
    };

    checkSession();
  }, [router]);

  const hasSupplements = todayData && todayData.supplements.length > 0;

  return (
    <SupplementLayout isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen}>
      {supplementsLoading && <LoadingState />}
      {supplementsError && (
        <ErrorState
          error={supplementsError}
          onRefetch={() => refetchSupplements()}
        />
      )}
      {!supplementsLoading && !supplementsError && hasSupplements && (
        <SupplementsContent
          todayData={todayData}
          onTrackNew={() => setIsFormOpen(true)}
        />
      )}
      {!supplementsLoading && !supplementsError && !hasSupplements && (
        <EmptyState onTrackNew={() => setIsFormOpen(true)} />
      )}
    </SupplementLayout>
  );
}
