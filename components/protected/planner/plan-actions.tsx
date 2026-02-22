"use client";

import { Loader2 } from "lucide-react";
import {
  Archive01FreeIcons,
  Delete02FreeIcons,
  PauseFreeIcons,
  PlayFreeIcons,
  Tick02FreeIcons,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useUpdatePlan } from "@/lib/hooks/use-planner";
import type {
  PlanWithItems,
  LocalDraftPlan,
  PlanStatus,
} from "@/lib/types/planner";

interface PlanActionsProps {
  plan: PlanWithItems | null;
  localDraft?: LocalDraftPlan;
  onActivate: () => void;
  onDelete: () => void;
  onStatusChange?: (status: PlanStatus) => void;
}

/**
 * PlanActions renders action buttons based on the current plan status.
 *
 * - Draft: Activate + Delete
 * - Active: Pause + Archive
 * - Paused: Resume + Archive
 * - Archived: Delete only
 */
export function PlanActions({
  plan,
  localDraft,
  onActivate,
  onDelete,
  onStatusChange,
}: PlanActionsProps) {
  const updatePlanMutation = useUpdatePlan();

  // Determine the current status
  const status: PlanStatus = localDraft ? "draft" : (plan?.status ?? "draft");
  const planId = plan?.id;

  // Check if any mutation is in progress
  const isUpdating = updatePlanMutation.isPending;

  /**
   * Handle status change via the mutation
   */
  function handleStatusChange(newStatus: PlanStatus) {
    if (!planId) return;

    updatePlanMutation.mutate(
      { planId, data: { status: newStatus } },
      {
        onSuccess: () => {
          onStatusChange?.(newStatus);
        },
      }
    );
  }

  /**
   * Render buttons based on plan status
   */
  function renderActions() {
    switch (status) {
      case "draft":
        return (
          <>
            <Button
              variant="default"
              size="default"
              icon={Tick02FreeIcons}
              onClick={onActivate}
              disabled={isUpdating}
            >
              Activate
            </Button>
            <Button
              variant="destructive"
              size="default"
              icon={Delete02FreeIcons}
              onClick={onDelete}
              disabled={isUpdating}
            >
              Delete
            </Button>
          </>
        );

      case "active":
        return (
          <>
            {isUpdating ? (
              <Button
                variant="outline"
                size="default-no-icon"
                disabled
                className="text-yellow-600 border-yellow-300"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="default"
                icon={PauseFreeIcons}
                onClick={() => handleStatusChange("paused")}
                className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
              >
                Pause
              </Button>
            )}
            {isUpdating ? (
              <Button
                variant="secondary"
                size="default-no-icon"
                disabled
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="default"
                icon={Archive01FreeIcons}
                onClick={() => handleStatusChange("archived")}
              >
                Archive
              </Button>
            )}
          </>
        );

      case "paused":
        return (
          <>
            {isUpdating ? (
              <Button
                variant="default"
                size="default-no-icon"
                disabled
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="default"
                icon={PlayFreeIcons}
                onClick={() => handleStatusChange("active")}
              >
                Resume
              </Button>
            )}
            {isUpdating ? (
              <Button
                variant="secondary"
                size="default-no-icon"
                disabled
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="default"
                icon={Archive01FreeIcons}
                onClick={() => handleStatusChange("archived")}
              >
                Archive
              </Button>
            )}
          </>
        );

      case "archived":
        return (
          <Button
            variant="destructive"
            size="default"
            icon={Delete02FreeIcons}
            onClick={onDelete}
            disabled={isUpdating}
          >
            Delete
          </Button>
        );

      default:
        return null;
    }
  }

  // Don't render if there's no plan or local draft
  if (!plan && !localDraft) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {renderActions()}
    </div>
  );
}
