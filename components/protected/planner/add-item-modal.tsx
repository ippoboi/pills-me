"use client";

import { useState, useEffect, useCallback } from "react";
import { BackdropPortal } from "@/components/ui/backdrop-portal";
import { Button } from "@/components/ui/button";
import { NutrientSearch } from "./nutrient-search";
import { NutrientEntryList } from "./nutrient-entry-list";
import { useAddPlanItem } from "@/lib/hooks/use-planner";
import { useDraftPlans } from "@/lib/hooks/use-draft-plans";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Loader2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01FreeIcons } from "@hugeicons/core-free-icons";
import useMeasure from "react-use-measure";
import { toast } from "sonner";
import type { NutrientEntry, NutrientWithCategory } from "@/lib/types/planner";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  /** For database plans - use useAddPlanItem mutation */
  planId?: string;
  /** For localStorage drafts - use useDraftPlans hook */
  localDraftId?: string;
  onSuccess?: () => void;
}

interface FormState {
  name: string;
  brand: string;
  servingsPerDay: number;
  nutrients: NutrientEntry[];
}

interface FormErrors {
  name?: string;
  nutrients?: string;
  general?: string;
}

const INITIAL_FORM_STATE: FormState = {
  name: "",
  brand: "",
  servingsPerDay: 1,
  nutrients: [],
};

/**
 * Modal for adding a new supplement item to a plan
 * Supports both database plans (via API) and localStorage drafts
 */
export function AddItemModal({
  open,
  onClose,
  planId,
  localDraftId,
  onSuccess,
}: AddItemModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [ref, bounds] = useMeasure();

  // Mutations
  const addPlanItemMutation = useAddPlanItem();
  const { addItem: addDraftItem } = useDraftPlans();

  const isPending = addPlanItemMutation.isPending;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM_STATE);
      setErrors({});
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

    // Name is required
    if (!form.name.trim()) {
      newErrors.name = "Supplement name is required";
    }

    // At least one nutrient required
    if (form.nutrients.length === 0) {
      newErrors.nutrients = "Add at least one nutrient";
    }

    // All nutrient amounts must be > 0
    const invalidNutrient = form.nutrients.find((n) => n.amount <= 0);
    if (invalidNutrient) {
      newErrors.nutrients = "All nutrient amounts must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  /**
   * Handle nutrient selection from search
   */
  const handleNutrientSelect = useCallback((nutrient: NutrientWithCategory) => {
    const newEntry: NutrientEntry = {
      nutrientId: nutrient.id,
      nutrientSlug: nutrient.slug,
      amount: 0, // User will enter amount
      unit: nutrient.default_unit,
    };

    setForm((prev) => ({
      ...prev,
      nutrients: [...prev.nutrients, newEntry],
    }));

    // Clear nutrient error when one is added
    setErrors((prev) => ({ ...prev, nutrients: undefined }));
  }, []);

  /**
   * Handle nutrient entry update (amount change by index)
   */
  const handleNutrientUpdate = useCallback((index: number, amount: number) => {
    setForm((prev) => ({
      ...prev,
      nutrients: prev.nutrients.map((n, i) =>
        i === index ? { ...n, amount } : n
      ),
    }));
  }, []);

  /**
   * Handle nutrient removal (by index)
   */
  const handleNutrientRemove = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      nutrients: prev.nutrients.filter((_, i) => i !== index),
    }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Must have either planId or localDraftId
    if (!planId && !localDraftId) {
      setErrors({ general: "Missing plan or draft ID" });
      return;
    }

    try {
      if (planId) {
        // Add to database plan via API
        await addPlanItemMutation.mutateAsync({
          planId,
          data: {
            name: form.name.trim(),
            brand: form.brand.trim() || undefined,
            servingsPerDay: form.servingsPerDay,
            nutrients: form.nutrients,
          },
        });
        toast.success(`Added "${form.name}" to plan`);
      } else if (localDraftId) {
        // Add to localStorage draft
        addDraftItem(localDraftId, {
          name: form.name.trim(),
          brand: form.brand.trim() || undefined,
          servingsPerDay: form.servingsPerDay,
          nutrients: form.nutrients,
        });
        toast.success(`Added "${form.name}" to draft`);
      }

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to add item:", error);
      setErrors({
        general:
          error instanceof Error ? error.message : "Failed to add supplement",
      });
      toast.error("Failed to add supplement. Please try again.");
    }
  };

  if (!shouldRender) return null;

  const selectedNutrientIds = form.nutrients.map((n) => n.nutrientId);

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
                  icon={Add01FreeIcons}
                  className="w-5 h-5 text-blue-600"
                  strokeWidth={2}
                />
              </div>
              <h2 className="font-medium text-gray-900">Add Supplement</h2>
            </motion.div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key="add-item-content"
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
                    htmlFor="supplement-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="supplement-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, name: e.target.value }));
                      if (errors.name) {
                        setErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    placeholder="e.g., Vitamin D3"
                    disabled={isPending}
                    className={`w-full px-3 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.name ? "border-red-300" : "border-gray-100"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Brand field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="supplement-brand"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Brand <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="supplement-brand"
                    type="text"
                    value={form.brand}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    placeholder="e.g., NOW Foods"
                    disabled={isPending}
                    className="w-full px-3 h-10 border border-gray-100 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Servings per day */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="servings-per-day"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Servings per day <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="servings-per-day"
                    type="number"
                    min={1}
                    max={10}
                    value={form.servingsPerDay}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value >= 1 && value <= 10) {
                        setForm((prev) => ({ ...prev, servingsPerDay: value }));
                      }
                    }}
                    disabled={isPending}
                    className="w-full px-3 h-10 border border-gray-100 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed tabular-nums"
                  />
                  <p className="text-xs text-gray-500">
                    How many servings do you take per day? (1-10)
                  </p>
                </div>

                {/* Nutrients section */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Nutrients <span className="text-red-500">*</span>
                  </label>

                  {/* Search to add nutrients */}
                  <NutrientSearch
                    selectedNutrientIds={selectedNutrientIds}
                    onSelect={handleNutrientSelect}
                    placeholder="Search and add nutrients..."
                    disabled={isPending}
                  />

                  {/* Nutrient entries list */}
                  {form.nutrients.length > 0 && (
                    <NutrientEntryList
                      entries={form.nutrients}
                      onUpdateEntry={handleNutrientUpdate}
                      onRemoveEntry={handleNutrientRemove}
                      disabled={isPending}
                    />
                  )}

                  {/* Empty state */}
                  {form.nutrients.length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-4">
                      No nutrients added yet. Use the search above to add
                      nutrients.
                    </p>
                  )}

                  {/* Nutrient error */}
                  {errors.nutrients && (
                    <p className="text-sm text-red-600">{errors.nutrients}</p>
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
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="default-no-icon"
                className="w-full"
                disabled={isPending}
                onClick={handleSubmit}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Supplement"
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </MotionConfig>
    </BackdropPortal>
  );
}
