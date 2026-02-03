"use client";

import { useEffect, useRef, useState } from "react";
import { Supplement, SupplementSchedule, TimeOfDay } from "@/lib/types";
import { motion } from "motion/react";
import {
  Moon02FreeIcons,
  Sun01FreeIcons,
  SunriseFreeIcons,
  SunsetFreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, HugeiconsIconProps } from "@hugeicons/react";
import SupplementCard from "./supplement-card";

interface SupplementsSectionProps {
  supplements: Supplement[];
  date: string;
}

interface TimeOfDayConfig {
  label: string;
  icon: HugeiconsIconProps["icon"];
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
  // Session storage key for tracking animation state
  const ANIMATION_SESSION_KEY = "supplements-animation-played";

  // Check if animation has been played in this session
  const [hasAnimatedOnce, setHasAnimatedOnce] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize animation state from session storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasPlayed =
        sessionStorage.getItem(ANIMATION_SESSION_KEY) === "true";
      setHasAnimatedOnce(hasPlayed);
      setIsInitialized(true);
    }
  }, []);

  // Function to mark animation as completed and store in session storage
  const markAnimatedDone = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(ANIMATION_SESSION_KEY, "true");
      setHasAnimatedOnce(true);
    }
  };

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
  }, {} as Record<TimeOfDay, (Supplement & { currentSchedule: SupplementSchedule })[]>);

  // Only render sections sequentially: Section 1 + its cards, then Section 2, etc.
  const availableSections = timeOfDayConfigs.filter(
    (cfg) => (groupedSupplements[cfg.value] || []).length > 0
  );
  // Index of the section currently being revealed (animation-first-load only)
  const [visibleSection, setVisibleSection] = useState(0);
  // Track completed sections to avoid double-advance
  const completedSectionsRef = useRef<Set<number>>(new Set());

  // Update visibleSection when hasAnimatedOnce changes from session storage
  useEffect(() => {
    if (isInitialized && hasAnimatedOnce) {
      setVisibleSection(availableSections.length);
    }
  }, [isInitialized, hasAnimatedOnce, availableSections.length]);

  // Don't render until we've checked session storage
  if (!isInitialized) {
    return null;
  }

  return (
    <div className="space-y-6">
      {availableSections.map((config, sectionIdx) => {
        const supplementsForTime = groupedSupplements[config.value] || [];
        if (supplementsForTime.length === 0) return null;

        // Calculate taken/left counts based on actual adherence data
        const taken = supplementsForTime.filter(
          (supplement) => supplement.currentSchedule.adherence_status
        ).length;
        const left = supplementsForTime.length - taken;

        // Only show the section if it's currently visible or we've already animated once
        if (!hasAnimatedOnce && sectionIdx > visibleSection) return null;

        return (
          <motion.div
            key={config.value}
            className="space-y-3 "
            initial={
              hasAnimatedOnce
                ? false
                : { opacity: 0, y: -10, filter: "blur(6px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.25 }}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between pl-4 pr-6 md:px-6">
              <div className="flex items-center gap-2 text-gray-600">
                <HugeiconsIcon
                  icon={config.icon}
                  className="w-5 h-5"
                  strokeWidth={2}
                />
                <h2 className="font-medium">{config.label}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-blue-600">{left} left</span>
              </div>
            </div>

            {/* Supplement Cards */}
            <div className="space-y-1">
              {supplementsForTime.map((supplement, i) => (
                <motion.div
                  key={`${supplement.id}-${supplement.currentSchedule.id}`}
                  initial={
                    hasAnimatedOnce
                      ? false
                      : { opacity: 0, y: -8, filter: "blur(6px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.18,
                    delay: hasAnimatedOnce ? 0 : i * 0.12, // faster per-card stagger
                  }}
                  onAnimationComplete={() => {
                    // If this is the last card of the section and we're in first-load mode,
                    // advance to the next section. Only trigger once per section.
                    const isLastCard = i === supplementsForTime.length - 1;
                    if (hasAnimatedOnce || !isLastCard) return;
                    if (completedSectionsRef.current.has(sectionIdx)) return;
                    completedSectionsRef.current.add(sectionIdx);

                    const next = sectionIdx + 1;
                    if (next < availableSections.length) {
                      setVisibleSection(next);
                    } else {
                      // All sections revealed - persist flag to avoid re-animating
                      markAnimatedDone();
                    }
                  }}
                >
                  <SupplementCard
                    supplement={supplement}
                    scheduleId={supplement.currentSchedule.id}
                    date={date}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
