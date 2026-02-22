"use client";

import { useState, useEffect } from "react";
import { usePlans, usePlanById, useActiveIntake } from "@/lib/hooks/use-planner";
import { PlannerLayout } from "@/components/protected/planner/planner-layout";
import { PlannerHeader } from "@/components/protected/planner/planner-header";
import { PlanSelector } from "@/components/protected/planner/plan-selector";
import { IntakeSummary } from "@/components/protected/planner/intake-summary";
import { CreatePlanDialog } from "@/components/protected/planner/create-plan-dialog";
import { PlanDetailSection } from "@/components/protected/planner/plan-detail-section";
import { AddItemModal } from "@/components/protected/planner/add-item-modal";
import { PlanActions } from "@/components/protected/planner/plan-actions";
import { DeletePlanModal } from "@/components/protected/planner/delete-plan-modal";
import { ActivatePlanDialog } from "@/components/protected/planner/activate-plan-dialog";
import ListLoadingState from "@/components/protected/list-loading-state";
import ListErrorState from "@/components/protected/list-error-state";
import ListEmptyState from "@/components/protected/list-empty-state";
import type { PlansListResponse, SupplementPlan } from "@/lib/types/planner";

function renderPlannerContent(
  isLoading: boolean,
  error: Error | null,
  plansData: PlansListResponse | undefined,
  onCreatePlan: () => void,
  onRefetch: () => void
) {
  if (isLoading) {
    return <ListLoadingState numberOfCards={3} />;
  }

  if (error) {
    return (
      <ListErrorState
        error={error}
        onRefetch={onRefetch}
        message="Error loading plans"
      />
    );
  }

  if (!plansData?.plans || plansData.plans.length === 0) {
    return (
      <ListEmptyState
        title="No supplement plans"
        description="Create a plan to organize and track your daily nutrient intake."
        actionLabel="Create plan"
        onAction={onCreatePlan}
        showIllustration={true}
      />
    );
  }

  return null;
}

export default function PlannerPage() {
  // Plan selection state
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Modal/dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);

  // Queries
  const {
    data: plansData,
    isLoading: plansLoading,
    error: plansError,
    refetch,
  } = usePlans();

  const { data: selectedPlan, isLoading: planLoading } = usePlanById(
    selectedPlanId ?? "",
    !!selectedPlanId
  );

  const { data: intakeData, isLoading: intakeLoading } = useActiveIntake(true);

  const hasPlans = plansData?.plans && plansData.plans.length > 0;

  // Auto-select first plan when plans load and none is selected
  useEffect(() => {
    if (hasPlans && !selectedPlanId) {
      setSelectedPlanId(plansData.plans[0].id);
    }
  }, [hasPlans, selectedPlanId, plansData?.plans]);

  // Clear selection if selected plan is deleted
  useEffect(() => {
    if (selectedPlanId && plansData?.plans) {
      const planStillExists = plansData.plans.some((p) => p.id === selectedPlanId);
      if (!planStillExists) {
        // Select first available plan or clear selection
        setSelectedPlanId(plansData.plans.length > 0 ? plansData.plans[0].id : null);
      }
    }
  }, [plansData?.plans, selectedPlanId]);

  // Handlers
  const handleCreatePlan = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreatePlanSuccess = (plan: SupplementPlan) => {
    setSelectedPlanId(plan.id);
  };

  const handleAddItem = () => {
    setIsAddItemOpen(true);
  };

  const handleActivate = () => {
    setIsActivateOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Selection will be handled by the useEffect above
    setIsDeleteOpen(false);
  };

  const content = renderPlannerContent(
    plansLoading,
    plansError,
    plansData,
    handleCreatePlan,
    () => refetch()
  );

  // Get the plan data for modals (with items for ActivatePlanDialog, basic for DeletePlanModal)
  const planForDelete: SupplementPlan | null = selectedPlanId && plansData?.plans
    ? plansData.plans.find((p) => p.id === selectedPlanId) ?? null
    : null;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto overflow-visible px-4 md:px-8 lg:px-0">
        <div className="h-32" />

        <PlannerLayout>
          <PlannerHeader onCreatePlan={handleCreatePlan} />

          {content}

          {hasPlans && (
            <>
              <PlanSelector
                plans={plansData.plans}
                selectedPlanId={selectedPlanId}
                onSelectPlan={setSelectedPlanId}
                onCreatePlan={handleCreatePlan}
              />

              {/* Plan details and items */}
              <PlanDetailSection
                plan={selectedPlan?.plan ?? null}
                isLoading={planLoading && !!selectedPlanId}
                onAddItem={handleAddItem}
              />

              {/* Plan action buttons */}
              {selectedPlan?.plan && (
                <PlanActions
                  plan={selectedPlan.plan}
                  onActivate={handleActivate}
                  onDelete={handleDelete}
                />
              )}

              {/* Intake summary */}
              <IntakeSummary
                intakeResults={intakeData?.intakeResults || []}
                demographics={intakeData?.demographics}
                isLoading={intakeLoading}
              />
            </>
          )}
        </PlannerLayout>

        <div className="h-40" />
      </div>

      {/* Modals and dialogs */}
      <CreatePlanDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreatePlanSuccess}
      />

      {selectedPlanId && (
        <AddItemModal
          open={isAddItemOpen}
          onClose={() => setIsAddItemOpen(false)}
          planId={selectedPlanId}
          onSuccess={() => setIsAddItemOpen(false)}
        />
      )}

      {planForDelete && (
        <DeletePlanModal
          open={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          plan={planForDelete}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {selectedPlan?.plan && (
        <ActivatePlanDialog
          open={isActivateOpen}
          onClose={() => setIsActivateOpen(false)}
          plan={selectedPlan.plan}
          onSuccess={() => setIsActivateOpen(false)}
        />
      )}
    </div>
  );
}
