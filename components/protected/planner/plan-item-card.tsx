"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit04FreeIcons,
  Delete02FreeIcons,
  Alert02FreeIcons,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PlanItem, LocalPlanItem, NutrientEntry } from "@/lib/types/planner";

interface PlanItemCardProps {
  /** The plan item data */
  item: PlanItem | LocalPlanItem;
  /** Database plan ID (for mutations) */
  planId?: string;
  /** Called after successful deletion */
  onDelete?: () => void;
  /** Callback to edit the item */
  onEdit?: () => void;
  /** Whether the plan is editable (draft status) */
  isEditable?: boolean;
}

/**
 * Type guard to check if item is a LocalPlanItem
 */
function isLocalPlanItem(
  item: PlanItem | LocalPlanItem
): item is LocalPlanItem {
  return "servingsPerDay" in item;
}

/**
 * Get nutrients from either PlanItem or LocalPlanItem
 */
function getNutrients(item: PlanItem | LocalPlanItem): NutrientEntry[] {
  if (isLocalPlanItem(item)) {
    return item.nutrients;
  }
  // PlanItem has nutrients as Json type, need to cast through unknown
  return (item.nutrients as unknown as NutrientEntry[]) || [];
}

/**
 * Get servings per day from either PlanItem or LocalPlanItem
 */
function getServingsPerDay(item: PlanItem | LocalPlanItem): number {
  if (isLocalPlanItem(item)) {
    return item.servingsPerDay;
  }
  return item.servings_per_day ?? 1;
}

/**
 * Get brand from either PlanItem or LocalPlanItem
 */
function getBrand(item: PlanItem | LocalPlanItem): string | undefined {
  if (isLocalPlanItem(item)) {
    return item.brand;
  }
  return item.brand ?? undefined;
}

/**
 * Format nutrient slug to display name
 * e.g., "vitamin-d" -> "Vitamin D"
 */
function formatNutrientName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Card component to display individual supplement items in a plan
 * Shows supplement name, brand, servings per day, and nutrient badges
 */
export function PlanItemCard({
  item,
  onDelete,
  onEdit,
  isEditable = false,
}: PlanItemCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const nutrients = getNutrients(item);
  const servingsPerDay = getServingsPerDay(item);
  const brand = getBrand(item);

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      layout
    >
      {/* Header: Name, Brand, Servings */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {item.name}
          </h3>
          {brand && (
            <p className="text-sm text-gray-500 truncate">{brand}</p>
          )}
        </div>

        {/* Servings badge */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
            {servingsPerDay}x/day
          </span>
        </div>
      </div>

      {/* Nutrients */}
      {nutrients.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {nutrients.map((nutrient, index) => (
            <span
              key={nutrient.nutrientId || index}
              className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs"
            >
              <span className="font-medium">
                {formatNutrientName(nutrient.nutrientSlug)}:
              </span>
              <span className="ml-1 tabular-nums">
                {nutrient.amount} {nutrient.unit}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Empty nutrients state */}
      {nutrients.length === 0 && (
        <p className="mt-3 text-sm text-gray-400 italic">
          No nutrients specified
        </p>
      )}

      {/* Actions (when editable) */}
      {isEditable && (
        <AnimatePresence mode="wait">
          {!showDeleteConfirm ? (
            <motion.div
              key="actions"
              className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit04FreeIcons}
                  onClick={onEdit}
                  className="flex-1"
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive-secondary"
                  size="sm"
                  icon={Delete02FreeIcons}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1"
                >
                  Delete
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              className="mt-4 pt-3 border-t border-gray-100"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Confirmation prompt */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-shrink-0 p-1.5 rounded-lg bg-red-50">
                  <HugeiconsIcon
                    icon={Alert02FreeIcons}
                    className="w-4 h-4 text-red-600"
                    strokeWidth={2}
                  />
                </div>
                <p className="text-sm text-gray-700">
                  Remove <span className="font-medium">{item.name}</span> from
                  this plan?
                </p>
              </div>

              {/* Confirmation buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={cn("flex-1", isDeleting && "opacity-70")}
                >
                  {isDeleting ? "Removing..." : "Remove"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
