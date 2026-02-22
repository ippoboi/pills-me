"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { IntakeResult } from "@/lib/types/planner";

interface NutrientStatusBarProps {
  result: IntakeResult;
}

/**
 * Visual RDA/UL indicator for a single nutrient
 * Shows progress bar with markers for RDA and Upper Limit
 */
export function NutrientStatusBar({ result }: NutrientStatusBarProps) {
  const {
    nutrientName,
    total,
    unit,
    rda,
    upperLimit,
    percentOfRda,
    status,
  } = result;

  // Calculate bar widths and marker positions
  const barConfig = useMemo(() => {
    // If we have UL, use it as 100%; otherwise use RDA * 1.5 or just total
    const maxValue = upperLimit ?? (rda ? rda * 1.5 : total);
    const totalPercent = Math.min((total / maxValue) * 100, 100);

    // RDA marker position
    const rdaPercent = rda ? Math.min((rda / maxValue) * 100, 100) : null;

    // UL is always at the end if it exists
    const ulPercent = upperLimit ? 100 : null;

    return { totalPercent, rdaPercent, ulPercent };
  }, [total, rda, upperLimit]);

  const statusColors = {
    ok: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-900">{nutrientName}</span>
        <span className="text-gray-600">
          {total.toFixed(1)} {unit}
          {rda && percentOfRda !== null && (
            <span className="text-gray-400 ml-1">
              ({percentOfRda.toFixed(0)}% RDA)
            </span>
          )}
        </span>
      </div>

      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        {/* Filled bar */}
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            statusColors[status]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${barConfig.totalPercent}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        {/* RDA marker line */}
        {barConfig.rdaPercent !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-600"
            style={{ left: `${barConfig.rdaPercent}%` }}
            title={`RDA: ${rda} ${unit}`}
          />
        )}

        {/* UL marker line */}
        {barConfig.ulPercent !== null && upperLimit && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-600"
            style={{ left: `calc(${barConfig.ulPercent}% - 2px)` }}
            title={`Upper Limit: ${upperLimit} ${unit}`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        {rda && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-blue-600" />
            RDA: {rda} {unit}
          </span>
        )}
        {upperLimit && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-red-600" />
            UL: {upperLimit} {unit}
          </span>
        )}
      </div>
    </div>
  );
}
