"use client";

import { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNutrients } from "@/lib/hooks/use-planner";
import { cn } from "@/lib/utils";
import { Search, Loader2 } from "lucide-react";
import type { NutrientWithCategory } from "@/lib/types/planner";

interface NutrientSearchProps {
  /** IDs of already selected nutrients (to exclude from results) */
  selectedNutrientIds: string[];
  /** Called when user selects a nutrient */
  onSelect: (nutrient: NutrientWithCategory) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Searchable autocomplete for selecting nutrients
 * Groups results by category and excludes already selected nutrients
 */
export function NutrientSearch({
  selectedNutrientIds,
  onSelect,
  placeholder = "Search nutrients...",
  disabled = false,
}: NutrientSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, isError } = useNutrients();

  // Filter and group nutrients
  const { filteredNutrients, groupedNutrients } = useMemo(() => {
    if (!data?.nutrients) {
      return { filteredNutrients: [], groupedNutrients: {} };
    }

    const term = searchTerm.toLowerCase().trim();

    // Filter out already selected nutrients and match search term
    const filtered = data.nutrients.filter((nutrient) => {
      // Exclude already selected
      if (selectedNutrientIds.includes(nutrient.id)) {
        return false;
      }

      // Match search term against name or slug
      if (term) {
        const nameMatch = nutrient.name.toLowerCase().includes(term);
        const slugMatch = nutrient.slug.toLowerCase().includes(term);
        return nameMatch || slugMatch;
      }

      return true;
    });

    // Group by category
    const grouped: Record<string, NutrientWithCategory[]> = {};
    for (const nutrient of filtered) {
      const categoryKey = nutrient.category?.label ?? "Other";
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = [];
      }
      grouped[categoryKey].push(nutrient);
    }

    // Sort categories by their sort_order (if available) or alphabetically
    const sortedGrouped: Record<string, NutrientWithCategory[]> = {};
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const aOrder = grouped[a][0]?.category?.sort_order ?? 999;
      const bOrder = grouped[b][0]?.category?.sort_order ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.localeCompare(b);
    });

    for (const key of sortedKeys) {
      sortedGrouped[key] = grouped[key].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    return { filteredNutrients: filtered, groupedNutrients: sortedGrouped };
  }, [data?.nutrients, selectedNutrientIds, searchTerm]);

  function handleSelect(nutrient: NutrientWithCategory) {
    onSelect(nutrient);
    setSearchTerm("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || isLoading}
          className={cn(
            "flex items-center gap-2 w-full px-3 h-10 bg-gray-50 border border-gray-100 rounded-xl text-left",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "transition-shadow touch-manipulation",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            !searchTerm && "text-gray-400"
          )}
          onClick={() => setOpen(true)}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
          <span className="flex-1 truncate">
            {isLoading ? "Loading nutrients..." : placeholder}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                autoFocus
                className={cn(
                  "w-full pl-9 pr-3 h-9 bg-gray-50 border border-gray-100 rounded-xl",
                  "text-gray-900 placeholder:text-gray-400 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "transition-shadow"
                )}
              />
            </div>
          </div>

          {/* Results list */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-6 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading nutrients...
              </div>
            )}

            {isError && (
              <div className="py-6 px-3 text-center text-red-500 text-sm">
                Failed to load nutrients. Please try again.
              </div>
            )}

            {!isLoading && !isError && filteredNutrients.length === 0 && (
              <div className="py-6 px-3 text-center text-gray-500 text-sm">
                {searchTerm
                  ? "No nutrients found matching your search."
                  : "No nutrients available."}
              </div>
            )}

            {!isLoading &&
              !isError &&
              Object.entries(groupedNutrients).map(([category, nutrients]) => (
                <div key={category}>
                  {/* Category header */}
                  <div className="px-3 py-1.5 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide sticky top-0">
                    {category}
                  </div>

                  {/* Nutrient items */}
                  {nutrients.map((nutrient) => (
                    <button
                      key={nutrient.id}
                      type="button"
                      onClick={() => handleSelect(nutrient)}
                      className={cn(
                        "w-full px-3 py-2.5 text-left text-sm",
                        "flex items-center justify-between gap-2",
                        "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                        "transition-colors cursor-pointer"
                      )}
                    >
                      <span className="text-gray-900 truncate">
                        {nutrient.name}
                      </span>
                      <span className="text-gray-400 text-xs flex-shrink-0">
                        ({nutrient.default_unit})
                      </span>
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
