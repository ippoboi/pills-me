"use client";

import { Button } from "@/components/ui/button";
import { Add01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PlannerHeaderProps {
  onCreatePlan: () => void;
}

/**
 * Header for the planner page with title and create action
 */
export function PlannerHeader({ onCreatePlan }: PlannerHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Supplement Planner
        </h1>
        <p className="text-gray-500 mt-1">
          Plan and monitor your daily nutrient intake
        </p>
      </div>
      <Button variant="default" onClick={onCreatePlan} className="gap-2">
        <HugeiconsIcon icon={Add01FreeIcons} strokeWidth={2} className="w-4 h-4" />
        New Plan
      </Button>
    </div>
  );
}
