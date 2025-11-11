"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Medicine02FreeIcons } from "@hugeicons/core-free-icons";
import { Supplement } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { getUserTimezone, createTimestampForDate } from "@/lib/utils/timezone";
import { cn } from "@/lib/utils";
import { getAdherenceColorClass } from "@/lib/utils/supplements";

interface SupplementCardProps {
  supplement: Supplement;
  scheduleId: string;
  date: string;
}

export default function SupplementCard({
  supplement,
  scheduleId,
  date,
}: SupplementCardProps) {
  // Find the current schedule's adherence status
  const currentSchedule = supplement.supplement_schedules.find(
    (schedule) => schedule.id === scheduleId
  );
  const initialTakenStatus = currentSchedule?.adherence_status || false;

  const [isTaken, setIsTaken] = useState(initialTakenStatus);
  const [userTimezone, setUserTimezone] = useState<string>("UTC");

  // Detect user timezone on mount
  useEffect(() => {
    setUserTimezone(getUserTimezone());
  }, []);

  // Update isTaken state when adherence status changes
  useEffect(() => {
    setIsTaken(initialTakenStatus);
  }, [initialTakenStatus]);

  const handleToggle = async () => {
    // Optimistic update - update UI immediately
    const previousState = isTaken;
    setIsTaken(!isTaken);

    try {
      // Convert date string to timestamp for the user's timezone
      const takenAtTimestamp = createTimestampForDate(date, userTimezone);

      const response = await fetch("/api/supplements/adherence/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplement_id: supplement.id,
          schedule_id: scheduleId,
          taken_at: takenAtTimestamp,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update with server response to ensure sync
        setIsTaken(data.is_taken);
      } else {
        // Revert on error
        setIsTaken(previousState);
        console.error("Failed to toggle adherence");
      }
    } catch (error) {
      // Revert on error
      setIsTaken(previousState);
      console.error("Failed to toggle adherence:", error);
    }
  };

  return (
    <div
      className={cn(
        "bg-white p-3 rounded-3xl lg:cursor-pointer lg:hover:bg-gray-50 transition-colors",
        isTaken && "opacity-60"
      )}
    >
      <div
        className="flex items-center justify-between gap-4"
        onClick={(e) => {
          // Only trigger on desktop (lg+) and not when clicking links
          if (
            window.innerWidth >= 1024 &&
            !(e.target as HTMLElement).closest("a")
          ) {
            handleToggle();
          }
        }}
      >
        {/* Left side: Icon, Name, Quantity */}
        <div className="flex items-center gap-3  flex-1 min-w-0">
          <div className="bg-blue-50 p-3 rounded-xl">
            <HugeiconsIcon
              icon={Medicine02FreeIcons}
              strokeWidth={2}
              className="w-6 h-6 text-blue-600"
            />
          </div>
          <div className="flex-1 grid grid-cols-4 justify-items-start items-center gap-1 min-w-0">
            <div className="flex flex-col">
              <h3 className="font-medium text-gray-900 truncate">
                {supplement.name}
              </h3>
              {/* Show schedule indicator if supplement has multiple schedules for this time */}
              {supplement.supplement_schedules &&
                supplement.supplement_schedules.length > 1 && (
                  <span className="text-xs text-gray-500">
                    Dose{" "}
                    {supplement.supplement_schedules.findIndex(
                      (s) => s.id === scheduleId
                    ) + 1}{" "}
                    of {supplement.supplement_schedules.length}
                  </span>
                )}
            </div>

            {/* Quantity Badge */}
            <span className="px-1.5 bg-blue-600 justify-self-center text-white font-medium rounded-lg">
              x{supplement.capsules_per_take}
            </span>

            {/* Recommendation */}
            <div className="flex flex-col">
              <span className="text-xs text-gray-600 uppercase tracking-wide">
                Recommendation
              </span>
              <span>{supplement.recommendation || "—"}</span>
            </div>

            {/* Adherence */}
            <div className="flex flex-col">
              <span className="text-xs text-gray-600 uppercase tracking-wide">
                Adherence
              </span>
              <span
                className={getAdherenceColorClass(
                  supplement.adherence_progress.percentage
                )}
              >
                {supplement.adherence_progress.percentage} %
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Checkbox */}
        <div className="p-3 flex items-center justify-center">
          <Checkbox checked={isTaken} onCheckedChange={handleToggle} />
        </div>
      </div>
    </div>
  );
}
