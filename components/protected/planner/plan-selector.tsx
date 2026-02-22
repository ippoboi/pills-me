"use client";

import { useMemo } from "react";
import { Selector } from "@/components/ui/selector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Add01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SupplementPlan, PlanStatus } from "@/lib/types/planner";

interface PlanSelectorProps {
  plans: SupplementPlan[];
  selectedPlanId: string | null;
  onSelectPlan: (planId: string | null) => void;
  onCreatePlan: () => void;
}

const statusBadgeConfig: Record<
  PlanStatus,
  { colorClass: string; backgroundClass: string }
> = {
  draft: { colorClass: "text-gray-600", backgroundClass: "bg-gray-100" },
  active: { colorClass: "text-green-600", backgroundClass: "bg-green-100" },
  paused: { colorClass: "text-yellow-600", backgroundClass: "bg-yellow-100" },
  archived: { colorClass: "text-gray-400", backgroundClass: "bg-gray-50" },
};

/**
 * Dropdown for selecting and managing supplement plans
 */
export function PlanSelector({
  plans,
  selectedPlanId,
  onSelectPlan,
  onCreatePlan,
}: PlanSelectorProps) {
  const options = useMemo(() => {
    return plans.map((plan) => {
      const status = plan.status ?? "draft";
      const config = statusBadgeConfig[status];
      return {
        value: plan.id,
        label: plan.name,
        icon: (
          <Badge
            label={status}
            colorClass={config.colorClass}
            backgroundClass={config.backgroundClass}
          />
        ),
      };
    });
  }, [plans]);

  // Find active plan if no selection
  const activePlan = plans.find((p) => p.status === "active");
  const effectiveSelectedId =
    selectedPlanId || activePlan?.id || plans[0]?.id || "";

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Plan
          </label>
          <Selector
            value={effectiveSelectedId}
            onValueChange={(value) => onSelectPlan(value)}
            options={options}
            placeholder="Select a plan"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onCreatePlan}
          className="mt-6 gap-1"
        >
          <HugeiconsIcon
            icon={Add01FreeIcons}
            strokeWidth={2}
            className="w-4 h-4"
          />
          New
        </Button>
      </div>
    </div>
  );
}
