"use client";

import { useState, useEffect } from "react";
import { BackdropPortal } from "@/components/ui/backdrop-portal";
import { Button } from "@/components/ui/button";
import { useDeletePlan } from "@/lib/hooks/use-planner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02FreeIcons } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Loader2 } from "lucide-react";
import useMeasure from "react-use-measure";
import { toast } from "sonner";
import type { SupplementPlan } from "@/lib/types";

interface DeletePlanModalProps {
  open: boolean;
  onClose: () => void;
  plan: SupplementPlan;
  onSuccess?: () => void;
}

export function DeletePlanModal({
  open,
  onClose,
  plan,
  onSuccess,
}: DeletePlanModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [ref, bounds] = useMeasure();

  const deletePlanMutation = useDeletePlan();

  const isActivePlan = plan.status === "active";

  const handleDelete = async () => {
    try {
      await deletePlanMutation.mutateAsync(plan.id);
      toast.success(`"${plan.name}" has been deleted successfully`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to delete plan:", error);
      toast.error("Failed to delete plan. Please try again.");
    }
  };

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
      }, 300); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deletePlanMutation.isPending) {
        onClose();
      }
    };
    if (open) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, deletePlanMutation.isPending]);

  if (!shouldRender) return null;

  return (
    <BackdropPortal show={shouldRender} onClose={onClose}>
      <MotionConfig transition={{ duration: 0.3, type: "spring", bounce: 0 }}>
        <motion.div
          animate={{ height: bounds.height }}
          className={`relative w-full md:max-w-lg bg-white rounded-2xl overflow-hidden shadow-xl transition-[opacity,transform] duration-300 ease-out ${
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
              className="flex items-center w-full min-w-80 justify-between p-5 py-4 bg-gray-50 border-b border-b-gray-200"
            >
              <h2 className="font-medium">Delete plan</h2>
            </motion.div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key="delete-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-6 flex flex-col items-center justify-center"
              >
                {/* Warning Icon */}
                <div className="flex items-center justify-center p-5 rounded-3xl bg-red-50 w-fit">
                  <HugeiconsIcon
                    icon={Alert02FreeIcons}
                    className="w-12 h-12 text-red-600"
                  />
                </div>

                {/* Warning Message */}
                <div className="space-y-3 text-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete &quot;{plan.name}&quot;?
                  </h3>
                  <p className="text-gray-600">
                    This will permanently delete this plan and all its items.
                  </p>
                  {isActivePlan && (
                    <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                      This will NOT delete the supplements that were created
                      from this plan.
                    </p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <motion.div
              layout
              className="flex items-center justify-between p-3 gap-2 bg-gray-50 border-t border-t-gray-200"
            >
              <Button
                variant="outline"
                size="default-no-icon"
                className="w-full"
                onClick={onClose}
                disabled={deletePlanMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="default-no-icon"
                className="w-full"
                disabled={deletePlanMutation.isPending}
                onClick={handleDelete}
              >
                {deletePlanMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </MotionConfig>
    </BackdropPortal>
  );
}
