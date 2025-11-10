"use client";

import { Supplement } from "@/lib/types";
import { getUserTimezone } from "@/lib/utils/timezone";
import {
  Moon02FreeIcons,
  Sun01FreeIcons,
  SunriseFreeIcons,
  SunsetFreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
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
  const [userTimezone, setUserTimezone] = useState<string>("UTC");

  // Detect user timezone on mount
  useEffect(() => {
    setUserTimezone(getUserTimezone());
  }, []);
  // Group supplements by time of day, allowing multiple schedules per supplement
  const groupedSupplements = supplements.reduce((acc, supplement) => {
    supplement.supplement_schedules.forEach((schedule) => {
      const timeOfDay = schedule.time_of_day as TimeOfDay;
      if (!acc[timeOfDay]) {
        acc[timeOfDay] = [];
      }
      // Create a supplement entry for each schedule (allows multiple doses per time period)
      acc[timeOfDay].push({
        ...supplement,
        currentSchedule: schedule, // Add current schedule to distinguish multiple doses
      });
    });
    return acc;
  }, {} as Record<TimeOfDay, (Supplement & { currentSchedule: any })[]>);

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
              <div className="flex items-center gap-2 text-gray-600">
                <HugeiconsIcon
                  icon={config.icon}
                  className="w-5 h-5"
                  strokeWidth={2}
                />
                <h2 className="font-medium">{config.label}</h2>
              </div>
              <div className="text-blue-600">
                {taken > 0 ? `${left} left ${taken} taken` : `${left} left`}
              </div>
            </div>

            {/* Supplement Cards */}
            <div className="space-y-1">
              {supplementsForTime.map((supplement, index) => (
                <SupplementCard
                  key={`${supplement.id}-${supplement.currentSchedule.id}`}
                  supplement={supplement}
                  scheduleId={supplement.currentSchedule.id}
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
