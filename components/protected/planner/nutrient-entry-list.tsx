"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NutrientEntry } from "@/lib/types/planner";

interface NutrientEntryListProps {
  /** List of nutrient entries to display */
  entries: NutrientEntry[];
  /** Called when user updates the amount for an entry */
  onUpdateEntry: (index: number, amount: number) => void;
  /** Called when user removes an entry */
  onRemoveEntry: (index: number) => void;
  /** Validation errors keyed by entry index */
  errors?: Record<number, string>;
  /** Disabled state for all inputs */
  disabled?: boolean;
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
 * List component for displaying and editing selected nutrients
 * Used in the add/edit item form within the supplement planner
 */
export function NutrientEntryList({
  entries,
  onUpdateEntry,
  onRemoveEntry,
  errors = {},
  disabled = false,
}: NutrientEntryListProps) {
  // Empty state
  if (entries.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-400">
          No nutrients selected. Use the search above to add nutrients.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const hasError = Boolean(errors[index]);

        return (
          <div key={entry.nutrientId} className="flex items-start gap-3">
            {/* Nutrient name */}
            <div className="flex-1 min-w-0 pt-2">
              <span className="text-sm font-medium text-gray-900 truncate block">
                {formatNutrientName(entry.nutrientSlug)}
              </span>
            </div>

            {/* Amount input with unit */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={entry.amount || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsed = value === "" ? 0 : parseFloat(value);
                    if (!isNaN(parsed)) {
                      onUpdateEntry(index, parsed);
                    }
                  }}
                  disabled={disabled}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? `error-${index}` : undefined}
                  className={cn(
                    "w-24 px-3 h-10 bg-gray-50 border rounded-xl text-right tabular-nums",
                    "text-gray-900 placeholder:text-gray-400 text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "transition-shadow",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    hasError
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-100"
                  )}
                  placeholder="0"
                />

                {/* Unit label */}
                <span className="text-sm text-gray-500 w-10 flex-shrink-0">
                  {entry.unit}
                </span>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemoveEntry(index)}
                  disabled={disabled}
                  aria-label={`Remove ${formatNutrientName(entry.nutrientSlug)}`}
                  className={cn(
                    "p-2 rounded-lg text-gray-400",
                    "hover:text-gray-600 hover:bg-gray-100",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Error message */}
              {hasError && (
                <p
                  id={`error-${index}`}
                  className="text-xs text-red-500 mt-1 mr-14"
                >
                  {errors[index]}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
