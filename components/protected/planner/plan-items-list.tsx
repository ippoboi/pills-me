"use client";

import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01FreeIcons,
  MedicineBottle01FreeIcons,
} from "@hugeicons/core-free-icons";
import { PlanItemCard } from "./plan-item-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanItem, LocalPlanItem } from "@/lib/types/planner";

interface PlanItemsListProps {
  /** List of plan items to display */
  items: (PlanItem | LocalPlanItem)[];
  /** Database plan ID (for mutations) */
  planId?: string;
  /** Local draft ID (for localStorage operations) */
  localDraftId?: string;
  /** Whether the list is loading */
  isLoading?: boolean;
  /** Whether the plan is editable (draft status) */
  isEditable?: boolean;
  /** Callback to add a new item */
  onAddItem: () => void;
  /** Callback to edit an item */
  onEditItem?: (item: PlanItem | LocalPlanItem) => void;
  /** Callback when an item is deleted */
  onDeleteItem?: (item: PlanItem | LocalPlanItem) => void;
}

/**
 * Skeleton card for loading state
 */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-100 rounded" />
        </div>
        <div className="h-6 w-16 bg-blue-100 rounded-lg" />
      </div>

      {/* Nutrients skeleton */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <div className="h-7 w-24 bg-gray-100 rounded-lg" />
        <div className="h-7 w-28 bg-gray-100 rounded-lg" />
        <div className="h-7 w-20 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ onAddItem }: { onAddItem: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="mb-4 p-4 rounded-full bg-gray-100">
        <HugeiconsIcon
          icon={MedicineBottle01FreeIcons}
          className="w-8 h-8 text-gray-400"
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        No supplements yet
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        Add your first supplement to this plan
      </p>
      <Button icon={Add01FreeIcons} onClick={onAddItem}>
        Add supplement
      </Button>
    </motion.div>
  );
}

/**
 * List component for displaying plan items (supplements)
 * Supports loading state, empty state, and animated add/remove
 */
export function PlanItemsList({
  items,
  planId,
  isLoading = false,
  isEditable = false,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: PlanItemsListProps) {
  // Loading state - show skeleton cards
  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return <EmptyState onAddItem={onAddItem} />;
  }

  return (
    <div className="space-y-3">
      {/* Items list with animations */}
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <PlanItemCard
              item={item}
              planId={planId}
              isEditable={isEditable}
              onEdit={onEditItem ? () => onEditItem(item) : undefined}
              onDelete={onDeleteItem ? () => onDeleteItem(item) : undefined}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add supplement button */}
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        <Button
          variant="secondary"
          icon={Add01FreeIcons}
          onClick={onAddItem}
          className={cn(
            "w-full justify-center",
            "border border-dashed border-blue-200 bg-blue-50/50"
          )}
        >
          Add supplement
        </Button>
      </motion.div>
    </div>
  );
}
