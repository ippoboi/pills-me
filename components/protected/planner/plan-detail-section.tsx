"use client";

import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01FreeIcons, NoteEditFreeIcons } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlanItemCard } from "./plan-item-card";
import type {
  PlanWithItems,
  PlanItem,
  LocalPlanItem,
  LocalDraftPlan,
  PlanStatus,
} from "@/lib/types/planner";

interface PlanDetailSectionProps {
  plan: PlanWithItems | null;
  localDraft?: LocalDraftPlan;
  isLoading?: boolean;
  onAddItem: () => void;
  onEditItem?: (item: PlanItem | LocalPlanItem) => void;
}

/**
 * Status badge configuration for plan statuses
 */
const statusBadgeConfig: Record<
  PlanStatus,
  { colorClass: string; backgroundClass: string; label: string }
> = {
  draft: {
    colorClass: "text-gray-700",
    backgroundClass: "bg-gray-100",
    label: "Draft",
  },
  active: {
    colorClass: "text-green-700",
    backgroundClass: "bg-green-100",
    label: "Active",
  },
  paused: {
    colorClass: "text-yellow-700",
    backgroundClass: "bg-yellow-100",
    label: "Paused",
  },
  archived: {
    colorClass: "text-gray-500",
    backgroundClass: "bg-gray-100",
    label: "Archived",
  },
};

/**
 * Loading skeleton for the plan detail section
 */
function PlanDetailSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="h-6 bg-gray-200 rounded-lg w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded-lg w-64" />
        </div>
        <div className="h-8 w-16 bg-gray-100 rounded-xl" />
      </div>

      {/* Items skeleton */}
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded-lg w-32 mb-2" />
                <div className="h-4 bg-gray-100 rounded-lg w-24" />
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-lg" />
            </div>
            <div className="mt-3 flex gap-2">
              <div className="h-6 w-20 bg-gray-100 rounded-lg" />
              <div className="h-6 w-24 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Empty state when no plan is selected
 */
function NoPlanSelected() {
  return (
    <motion.div
      className="bg-white rounded-3xl p-8 shadow-sm text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
        <HugeiconsIcon
          icon={NoteEditFreeIcons}
          className="w-8 h-8 text-gray-400"
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Plan Selected
      </h3>
      <p className="text-sm text-gray-500 max-w-xs mx-auto">
        Select a plan from the dropdown above or create a new one to start
        building your supplement stack.
      </p>
    </motion.div>
  );
}

/**
 * Get items from either PlanWithItems or LocalDraftPlan
 */
function getItems(
  plan: PlanWithItems | null,
  localDraft?: LocalDraftPlan
): (PlanItem | LocalPlanItem)[] {
  if (localDraft) {
    return localDraft.items;
  }
  return plan?.items ?? [];
}

/**
 * Get plan name from either PlanWithItems or LocalDraftPlan
 */
function getPlanName(
  plan: PlanWithItems | null,
  localDraft?: LocalDraftPlan
): string {
  if (localDraft) {
    return localDraft.name;
  }
  return plan?.name ?? "";
}

/**
 * Get plan notes from either PlanWithItems or LocalDraftPlan
 */
function getPlanNotes(
  plan: PlanWithItems | null,
  localDraft?: LocalDraftPlan
): string | undefined {
  if (localDraft) {
    return localDraft.notes;
  }
  return plan?.notes ?? undefined;
}

/**
 * Get plan status from PlanWithItems (LocalDraftPlan is always "draft")
 */
function getPlanStatus(
  plan: PlanWithItems | null,
  localDraft?: LocalDraftPlan
): PlanStatus {
  if (localDraft) {
    return "draft";
  }
  return plan?.status ?? "draft";
}

/**
 * Check if the plan is editable (only draft plans can be edited)
 */
function isPlanEditable(
  plan: PlanWithItems | null,
  localDraft?: LocalDraftPlan
): boolean {
  if (localDraft) {
    return true;
  }
  return plan?.status === "draft";
}

/**
 * PlanDetailSection displays the selected plan's details and items.
 * Shows plan name, status badge, optional notes, and a list of plan items.
 */
export function PlanDetailSection({
  plan,
  localDraft,
  isLoading = false,
  onAddItem,
  onEditItem,
}: PlanDetailSectionProps) {
  // Show loading skeleton
  if (isLoading) {
    return <PlanDetailSkeleton />;
  }

  // Show null state when no plan selected
  if (!plan && !localDraft) {
    return <NoPlanSelected />;
  }

  const planName = getPlanName(plan, localDraft);
  const planNotes = getPlanNotes(plan, localDraft);
  const planStatus = getPlanStatus(plan, localDraft);
  const items = getItems(plan, localDraft);
  const isEditable = isPlanEditable(plan, localDraft);
  const statusConfig = statusBadgeConfig[planStatus];

  return (
    <motion.div
      className="bg-white rounded-3xl p-6 shadow-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header: Plan name and status */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="text-xl font-semibold text-gray-900 truncate flex-1 min-w-0">
          {planName}
        </h2>
        <Badge
          label={statusConfig.label}
          colorClass={statusConfig.colorClass}
          backgroundClass={statusConfig.backgroundClass}
        />
      </div>

      {/* Plan notes */}
      {planNotes && (
        <p className="text-sm text-gray-500 mt-1 mb-4">{planNotes}</p>
      )}

      {/* Items list */}
      <div className={cn("mt-6", !planNotes && "mt-4")}>
        {items.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <motion.div className="space-y-3" layout>
              {items.map((item) => (
                <PlanItemCard
                  key={item.id}
                  item={item}
                  planId={plan?.id}
                  isEditable={isEditable}
                  onEdit={onEditItem ? () => onEditItem(item) : undefined}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            className="py-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <p className="text-sm text-gray-500 mb-4">
              No supplements in this plan yet.
            </p>
          </motion.div>
        )}

        {/* Add supplement button */}
        {isEditable && (
          <motion.div
            className={cn("mt-4", items.length === 0 && "mt-0")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            <Button
              variant="secondary"
              size="default"
              icon={Add01FreeIcons}
              onClick={onAddItem}
              className="w-full"
            >
              Add Supplement
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
