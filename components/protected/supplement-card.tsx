"use client";

import { useState, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Medicine02FreeIcons } from "@hugeicons/core-free-icons";
import { Supplement, TodaySupplementsResponse } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { getUserTimezone } from "@/lib/utils/timezone";
import { cn } from "@/lib/utils";
import { getAdherenceColorClass } from "@/lib/utils/supplements";

import { supplementsKeys } from "@/lib/queries/keys";

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
  // Access the QueryClient from React context
  const queryClient = useQueryClient();

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
    const nextIsTaken = !isTaken;
    setIsTaken(nextIsTaken);

    try {
      // Optimistically update today's cache (checkbox + X left + adherence %)
      const updateTodayCache = (key: readonly unknown[]) => {
        queryClient.setQueryData(
          key,
          (oldData: TodaySupplementsResponse | undefined) => {
            if (!oldData) return oldData;

            // Calculate optimistic adherence percentage
            const delta = nextIsTaken ? 1 : -1;
            const nextCompleted = Math.max(
              0,
              Math.min(
                supplement.adherence_progress.total_possible,
                supplement.adherence_progress.completed + delta
              )
            );
            const nextPercentage = Math.round(
              (nextCompleted /
                Math.max(1, supplement.adherence_progress.total_possible)) *
                100
            );

            return {
              ...oldData,
              supplements: oldData.supplements.map((s) => {
                if (s.id !== supplement.id) return s;
                return {
                  ...s,
                  supplement_schedules: s.supplement_schedules.map((sc) =>
                    sc.id === scheduleId
                      ? { ...sc, adherence_status: nextIsTaken }
                      : sc
                  ),
                  adherence_progress: {
                    percentage: nextPercentage,
                    completed: nextCompleted,
                    total_possible:
                      supplement.adherence_progress.total_possible,
                  },
                };
              }),
            };
          }
        );
      };
      // Update both query variants: with date and without date (hook uses undefined date)
      updateTodayCache(supplementsKeys.today(date, userTimezone));
      updateTodayCache(supplementsKeys.today(undefined, userTimezone));

      // Note: We don't update list cache optimistically since the new structure
      // doesn't include adherence data - we'll rely on server invalidation

      const response = await fetch("/api/supplements/adherence/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplement_id: supplement.id,
          schedule_id: scheduleId,
          date: date, // Just send "YYYY-MM-DD"
          timezone: userTimezone, // "America/Los_Angeles"
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update with server response to ensure sync
        setIsTaken(data.is_taken);

        // Invalidate in background (no await) - refetch will reconcile with server
        queryClient.invalidateQueries({
          queryKey: supplementsKeys.today(date, userTimezone),
        });
        queryClient.invalidateQueries({
          queryKey: supplementsKeys.today(undefined, userTimezone),
        });

        // Invalidate supplement by ID
        queryClient.invalidateQueries({
          queryKey: supplementsKeys.byId(supplement.id),
        });

        // Also invalidate supplements list for consistency
        queryClient.invalidateQueries({
          queryKey: ["supplements", "list"],
        });
      } else {
        // Revert on error
        setIsTaken(previousState);
        // Rollback optimistic caches by invalidating (quick server-sync)
        queryClient.invalidateQueries({
          queryKey: supplementsKeys.today(date, userTimezone),
        });
        queryClient.invalidateQueries({
          queryKey: supplementsKeys.today(undefined, userTimezone),
        });
        queryClient.invalidateQueries({
          queryKey: ["supplements", "list"],
        });
        console.error("Failed to toggle adherence");
      }
    } catch (error) {
      // Revert on error
      setIsTaken(previousState);
      queryClient.invalidateQueries({
        queryKey: supplementsKeys.today(date, userTimezone),
      });
      queryClient.invalidateQueries({
        queryKey: supplementsKeys.today(undefined, userTimezone),
      });
      queryClient.invalidateQueries({
        queryKey: ["supplements", "list"],
      });
      console.error("Failed to toggle adherence:", error);
    }
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "Spacebar"
    ) {
      event.preventDefault();
      if (
        !(event.target as HTMLElement).closest(
          "a, button, input, [role='button'], [role='checkbox']"
        )
      ) {
        handleToggle();
      }
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (
          !(event.target as HTMLElement).closest(
            "a, button, input, [role='button'], [role='checkbox']"
          )
        ) {
          handleToggle();
        }
      }}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "bg-white p-2 md:p-3 rounded-3xl cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        isTaken && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left side: Icon, Name, Quantity */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-blue-50 p-3 rounded-2xl md:rounded-xl">
            <HugeiconsIcon
              icon={Medicine02FreeIcons}
              strokeWidth={2}
              className="w-6 h-6 text-blue-600"
            />
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 justify-items-start items-center gap-1 min-w-0">
            <div className="flex flex-col">
              <h3 className="text-[15px] md:text-base font-medium text-gray-900 truncate">
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
            <span className="px-1.5 bg-blue-600 justify-self-end md:justify-self-center text-white font-medium rounded-lg text-sm md:text-base">
              x{supplement.capsules_per_take}
            </span>

            {/* Recommendation */}
            <div className="hidden md:flex flex-col">
              <span className="text-xs text-gray-600 uppercase tracking-wide">
                Recommendation
              </span>
              <span>{supplement.recommendation || "—"}</span>
            </div>

            {/* Adherence */}
            <div className="hidden md:flex flex-col">
              <span className="text-xs text-gray-600 uppercase tracking-wide">
                Adherence
              </span>
              <span
                className={
                  getAdherenceColorClass(
                    supplement.adherence_progress.percentage
                  ).textColor
                }
              >
                {supplement.adherence_progress.percentage} %
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Checkbox */}
        <div
          className="p-3 flex items-center justify-center"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Checkbox checked={isTaken} onCheckedChange={handleToggle} />
        </div>
      </div>
    </div>
  );
}
