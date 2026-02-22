"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BackdropPortal } from "@/components/ui/backdrop-portal";
import { Button } from "@/components/ui/button";
import { useCreatePlan } from "@/lib/hooks/use-planner";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Loader2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { NoteAddFreeIcons } from "@hugeicons/core-free-icons";
import useMeasure from "react-use-measure";
import { toast } from "sonner";
import type { SupplementPlan } from "@/lib/types/planner";

interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (plan: SupplementPlan) => void;
}

interface FormState {
  name: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  general?: string;
}

const INITIAL_FORM_STATE: FormState = {
  name: "",
  notes: "",
};

/**
 * Dialog for creating a new supplement plan
 * Simple form with name (required) and notes (optional)
 */
export function CreatePlanDialog({
  open,
  onClose,
  onSuccess,
}: CreatePlanDialogProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [ref, bounds] = useMeasure();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Mutation
  const createPlanMutation = useCreatePlan();
  const isPending = createPlanMutation.isPending;

  // Reset form when modal opens and auto-focus name input
  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM_STATE);
      setErrors({});
      // Focus name input after animation starts
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
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
   * Validate form before submission
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const trimmedName = form.name.trim();

    // Name is required
    if (!trimmedName) {
      newErrors.name = "Plan name is required";
    } else if (trimmedName.length < 1) {
      newErrors.name = "Plan name must be at least 1 character";
    } else if (trimmedName.length > 100) {
      newErrors.name = "Plan name must be 100 characters or less";
    }

    // Notes validation (optional but max 500 chars)
    if (form.notes.length > 500) {
      newErrors.general = "Notes must be 500 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await createPlanMutation.mutateAsync({
        name: form.name.trim(),
        notes: form.notes.trim() || undefined,
      });

      toast.success(`Plan "${form.name.trim()}" created successfully`);
      onSuccess?.(result.plan);
      onClose();
    } catch (error) {
      console.error("Failed to create plan:", error);
      setErrors({
        general:
          error instanceof Error ? error.message : "Failed to create plan",
      });
      toast.error("Failed to create plan. Please try again.");
    }
  };

  /**
   * Handle Enter key to submit form
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isPending) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!shouldRender) return null;

  return (
    <BackdropPortal show={shouldRender} onClose={onClose}>
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
              <div className="flex items-center justify-center p-2 rounded-xl bg-blue-50">
                <HugeiconsIcon
                  icon={NoteAddFreeIcons}
                  className="w-5 h-5 text-blue-600"
                  strokeWidth={2}
                />
              </div>
              <h2 className="font-medium text-gray-900">Create New Plan</h2>
            </motion.div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key="create-plan-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-5 space-y-5"
              >
                {/* General error */}
                {errors.general && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-sm text-red-600">{errors.general}</p>
                  </div>
                )}

                {/* Name field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="plan-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    id="plan-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, name: e.target.value }));
                      if (errors.name) {
                        setErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., Morning Stack, Energy Boost"
                    maxLength={100}
                    disabled={isPending}
                    className={`w-full px-3 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.name ? "border-red-300" : "border-gray-100"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                  <p className="text-xs text-gray-400 text-right">
                    {form.name.length}/100
                  </p>
                </div>

                {/* Notes field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="plan-notes"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Notes <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="plan-notes"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Add any notes about this plan..."
                    maxLength={500}
                    rows={3}
                    disabled={isPending}
                    className="w-full px-3 py-2.5 border border-gray-100 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  />
                  <p className="text-xs text-gray-400 text-right">
                    {form.notes.length}/500
                  </p>
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
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="default-no-icon"
                className="w-full"
                disabled={isPending || !form.name.trim()}
                onClick={handleSubmit}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create Plan"
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </MotionConfig>
    </BackdropPortal>
  );
}
