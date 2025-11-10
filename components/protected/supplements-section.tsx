"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sun01FreeIcons,
  Moon01FreeIcons,
  SunriseFreeIcons,
  SunsetFreeIcons,
  Moon02FreeIcons,
} from "@hugeicons/core-free-icons";
import { Supplement } from "@/lib/api/supplements";
import SupplementCard from "./supplement-card";

type TimeOfDay = "MORNING" | "LUNCH" | "DINNER" | "BEFORE_SLEEP";

interface SupplementsSectionProps {
  supplements: Supplement[];
  date: string;
}

interface TimeOfDayConfig {
  label: string;
  icon: any;
  value: TimeOfDay;
}

const timeOfDayConfigs: TimeOfDayConfig[] = [
  {
    label: "Morning",
    icon: SunriseFreeIcons,
    value: "MORNING",
  },
  {
    label: "Lunch",
    icon: Sun01FreeIcons,
    value: "LUNCH",
  },
  {
    label: "Dinner",
    icon: SunsetFreeIcons,
    value: "DINNER",
  },
  {
    label: "Before sleep",
    icon: Moon02FreeIcons,
    value: "BEFORE_SLEEP",
  },
];

export default function SupplementsSection({
  supplements,
  date,
}: SupplementsSectionProps) {
  // Group supplements by time of day
  const groupedSupplements = supplements.reduce((acc, supplement) => {
    supplement.supplement_schedules.forEach((schedule) => {
      const timeOfDay = schedule.time_of_day as TimeOfDay;
      if (!acc[timeOfDay]) {
        acc[timeOfDay] = [];
      }
      // Only add if not already added (supplement can have multiple schedules)
      if (!acc[timeOfDay].find((s) => s.id === supplement.id)) {
        acc[timeOfDay].push(supplement);
      }
    });
    return acc;
  }, {} as Record<TimeOfDay, Supplement[]>);

  return (
    <div className="space-y-6">
      {timeOfDayConfigs.map((config) => {
        const supplementsForTime = groupedSupplements[config.value] || [];
        if (supplementsForTime.length === 0) return null;

        // Calculate taken/left counts
        // TODO: This will need to be updated when adherence data is available
        const taken = 0; // Placeholder
        const left = supplementsForTime.length;

        return (
          <div key={config.value} className="space-y-3 ">
            {/* Section Header */}
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={config.icon} className="w-5 h-5" />
                <h2 className="font-medium">{config.label}</h2>
              </div>
              <div className="text-blue-600">
                {taken > 0 ? `${left} left ${taken} taken` : `${left} left`}
              </div>
            </div>

            {/* Supplement Cards */}
            <div className="space-y-3">
              {supplementsForTime.map((supplement) => (
                <SupplementCard
                  key={supplement.id}
                  supplement={supplement}
                  scheduleId={
                    supplement.supplement_schedules.find(
                      (s) => s.time_of_day === config.value
                    )?.id || ""
                  }
                  date={date}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
