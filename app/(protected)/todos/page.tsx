"use client";

import ListEmptyState from "@/components/protected/list-empty-state";
import ListErrorState from "@/components/protected/list-error-state";
import ListLoadingState from "@/components/protected/list-loading-state";
import SupplementsSection from "@/components/protected/supplements-section";
import SupplementCreationForm from "@/components/supplement-creation-form";
import { useTodaySupplements } from "@/lib/hooks";
import type { TodaySupplementsResponse } from "@/lib/types";
import { useDateContext } from "@/lib/contexts/date-context";
import InstallPrompt from "@/components/pwa/install-prompts";

// Reusable centered layout wrapper
interface SupplementLayoutProps {
  children: React.ReactNode;
}

function SupplementLayout({ children }: SupplementLayoutProps) {
  const { isFormOpen, setIsFormOpen } = useDateContext();

  return (
    <>
      {children}
      <InstallPrompt />
      <SupplementCreationForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </>
  );
}

// Render supplement list content based on state
function renderSupplementListContent(
  supplementsLoading: boolean,
  supplementsError: Error | null,
  todayData: TodaySupplementsResponse | undefined,
  onTrackNew: () => void,
  onRefetch: () => void
) {
  if (supplementsLoading) {
    return <ListLoadingState numberOfCards={6} />;
  }

  if (supplementsError) {
    return (
      <ListErrorState
        error={supplementsError}
        onRefetch={onRefetch}
        message="Error loading supplements"
      />
    );
  }

  if (!todayData || todayData.supplements.length === 0) {
    return (
      <ListEmptyState
        title="Welcome to your supplement space!"
        description="Press the button below to track your first supplement."
        actionLabel="Track new"
        onAction={onTrackNew}
      />
    );
  }

  return (
    <SupplementsSection
      supplements={todayData.supplements}
      date={todayData.date}
    />
  );
}

export default function ProtectedPage() {
  const { date, timezone, setIsFormOpen } = useDateContext();

  const {
    data: todayData,
    isLoading: supplementsLoading,
    error: supplementsError,
    refetch: refetchSupplements,
  } = useTodaySupplements(date, timezone);

  return (
    <SupplementLayout>
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto overflow-visible px-4 md:px-8 lg:px-0">
          <div className="h-32" />
          {renderSupplementListContent(
            supplementsLoading,
            supplementsError,
            todayData,
            () => setIsFormOpen(true),
            () => refetchSupplements()
          )}
          <div className="h-56" />
        </div>
      </div>
    </SupplementLayout>
  );
}
