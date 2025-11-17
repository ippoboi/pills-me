"use client";

import SupplementCreationForm from "@/components/supplement-creation-form";
import { useSupplementsList } from "@/lib/hooks/supplements";
import SupplementsListSection from "@/components/protected/supplements-list-section";
import ListLoadingState from "@/components/protected/list-loading-state";
import ListErrorState from "@/components/protected/list-error-state";
import ListEmptyState from "@/components/protected/list-empty-state";
import type { SupplementsListResponse } from "@/lib/types/supplements";
import { useDateContext } from "@/lib/contexts/date-context";

// Render supplement list content based on state
function renderSupplementListContent(
  isLoading: boolean,
  error: Error | null,
  data: SupplementsListResponse | undefined,
  onTrackNew: () => void,
  onRefetch: () => void
) {
  if (isLoading) {
    return <ListLoadingState numberOfCards={6} />;
  }

  if (error) {
    return (
      <ListErrorState
        error={error}
        onRefetch={onRefetch}
        message="Error loading supplements"
      />
    );
  }

  if (!data?.supplements || data.supplements.length === 0) {
    return (
      <ListEmptyState
        title="No supplements yet"
        description="Start tracking your first supplement to get organized."
        actionLabel="Track new"
        onAction={onTrackNew}
        showIllustration={true}
      />
    );
  }

  return <SupplementsListSection supplements={data.supplements} />;
}

export default function SupplementsPage() {
  const { isFormOpen, setIsFormOpen } = useDateContext();
  const { data, isLoading, error, refetch } = useSupplementsList();

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto overflow-visible px-4 md:px-8 lg:px-0">
        <div className="h-32" />

        <SupplementCreationForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />

        {renderSupplementListContent(
          isLoading,
          error,
          data,
          () => setIsFormOpen(true),
          () => refetch()
        )}

        <div className="h-40" />
      </div>
    </div>
  );
}
