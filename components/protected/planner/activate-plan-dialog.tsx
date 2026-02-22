"use client";

import { useState, useEffect } from "react";
import { BackdropPortal } from "@/components/ui/backdrop-portal";
import { Button } from "@/components/ui/button";
import { useActivatePlan } from "@/lib/hooks/use-planner";
import { getUserTimezone } from "@/lib/utils/timezone";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Loader2, Check } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Rocket01FreeIcons } from "@hugeicons/core-free-icons";
import useMeasure from "react-use-measure";
import { toast } from "sonner";
import type { PlanWithItems, TimeOfDay } from "@/lib/types";

interface ActivatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  plan: PlanWithItems;
  onSuccess?: () => void;
}

interface ScheduleOption {
  value: TimeOfDay;
  label: string;
  time: string;
}

const SCHEDULE_OPTIONS: ScheduleOption[] = [
  { value: "MORNING", label: "Morning", time: "8:00 AM" },
  { value: "LUNCH", label: "Lunch", time: "12:00 PM" },
  { value: "DINNER", label: "Dinner", time: "6:00 PM" },
  { value: "BEFORE_SLEEP", label: "Before Sleep", time: "10:00 PM" },
];

/**
 * Dialog for activating a draft plan
 * Allows users to select schedules (time of day) for their supplements
 */
export function ActivatePlanDialog({
  open,
  onClose,
  plan,
  onSuccess,
}: ActivatePlanDialogProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState<TimeOfDay[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [ref, bounds] = useMeasure();

  // Auto-detect user timezone
  const timezone = getUserTimezone();

  // Mutation
  const activatePlanMutation = useActivatePlan();
  const isPending = activatePlanMutation.isPending;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSchedules([]);
      setShowSuccess(false);
      setCreatedCount(0);
    }
  }, [open]);

  // Handle mount/unmount and animations
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      // Trigger animation after mount
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      // Start exit animation
      setIsAnimating(false);
      // Delay unmount to allow exit animation to complete
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    if (open) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, isPending]);

  /**
   * Toggle schedule selection
   */
  function toggleSchedule(schedule: TimeOfDay) {
    setSelectedSchedules((prev) =>
      prev.includes(schedule)
        ? prev.filter((s) => s !== schedule)
        : [...prev, schedule]
    );
  }

  /**
   * Handle activation submission
   */
  async function handleActivate() {
    if (selectedSchedules.length === 0) {
      return;
    }

    try {
      const result = await activatePlanMutation.mutateAsync({
        planId: plan.id,
        data: {
          schedules: selectedSchedules,
          timezone,
        },
      });

      // Show success state
      setCreatedCount(result.supplements.length);
      setShowSuccess(true);

      toast.success(
        `Plan activated! Created ${result.supplements.length} supplement${result.supplements.length === 1 ? "" : "s"}.`
      );

      // Call success callback and close after brief delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Failed to activate plan:", error);
      toast.error("Failed to activate plan. Please try again.");
    }
  }

  if (!shouldRender) return null;

  const itemCount = plan.items?.length ?? 0;

  return (
    <BackdropPortal show={shouldRender} onClose={isPending ? undefined : onClose}>
      <MotionConfig transition={{ duration: 0.5, type: "spring", bounce: 0 }}>
        <motion.div
          animate={{ height: bounds.height }}
          className={`relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-xl transition-[opacity,transform] duration-300 ease-out ${
            isAnimating
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div ref={ref}>
            {/* Header */}
            <motion.div
              layout
              className="flex items-center gap-3 w-full min-w-80 p-5 py-4 bg-gray-50 border-b border-b-gray-200"
            >
              <div className="flex items-center justify-center p-2 rounded-xl bg-emerald-50">
                <HugeiconsIcon
                  icon={Rocket01FreeIcons}
                  className="w-5 h-5 text-emerald-600"
                  strokeWidth={2}
                />
              </div>
              <h2 className="font-medium text-gray-900">Activate Plan</h2>
            </motion.div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="success-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-8 flex flex-col items-center justify-center space-y-4"
                >
                  <div className="flex items-center justify-center p-4 rounded-full bg-emerald-100">
                    <Check className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      Plan Activated
                    </h3>
                    <p className="text-gray-600">
                      Created {createdCount} supplement{createdCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 space-y-5"
                >
                  {/* Plan summary */}
                  <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                    <h3 className="font-medium text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600">
                      {itemCount} supplement{itemCount === 1 ? "" : "s"} in this plan
                    </p>
                  </div>

                  {/* Schedule selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      When should you take these supplements?
                    </label>

                    <div className="space-y-2">
                      {SCHEDULE_OPTIONS.map((option) => {
                        const isSelected = selectedSchedules.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleSchedule(option.value)}
                            disabled={isPending}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <div
                              className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              )}
                            </div>
                            <span className="flex-1 text-left font-medium text-gray-900">
                              {option.label}
                            </span>
                            <span className="text-sm text-gray-500 tabular-nums">
                              {option.time}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedSchedules.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        Select at least one time to continue
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            {!showSuccess && (
              <motion.div
                layout
                className="flex items-center justify-between p-3 gap-2 bg-gray-50 border-t border-t-gray-200"
              >
                <Button
                  variant="outline"
                  size="default-no-icon"
                  className="w-full"
                  onClick={onClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="default-no-icon"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={isPending || selectedSchedules.length === 0}
                  onClick={handleActivate}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Activate Plan"
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </MotionConfig>
    </BackdropPortal>
  );
}
