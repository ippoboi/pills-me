"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar04FreeIcons,
  Link05FreeIcons,
  Tick01FreeIcons,
  Tick02FreeIcons,
  Cancel01FreeIcons,
} from "@hugeicons/core-free-icons";
import { useCreateSupplement } from "@/lib/hooks/use-supplements";
import { SupplementInput } from "@/lib/supplements";
import { Database } from "@/lib/supabase/database.types";
import { motion, MotionConfig, AnimatePresence } from "motion/react";
import useMeasure from "react-use-measure";

type TimeOfDay = Database["public"]["Enums"]["time_of_day"];

interface SupplementCreationFormProps {
  open: boolean;
  onClose: () => void;
}

// Form state interface
interface FormData {
  name: string;
  capsules_per_take: number;
  time_of_day: TimeOfDay[];
  recommendation: string;
  source_url: string;
  source_name: string;
  start_date: string;
  end_date: string;
  reason: string;
}

interface FormErrors {
  name?: string;
  capsules_per_take?: string;
  time_of_day?: string;
  start_date?: string;
  end_date?: string;
  source_url?: string;
}

export default function SupplementCreationForm({
  open,
  onClose,
}: SupplementCreationFormProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [direction, setDirection] = useState(1);
  const [ref, bounds] = useMeasure();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    capsules_per_take: 1,
    time_of_day: [],
    recommendation: "",
    source_url: "",
    source_name: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // TanStack Query mutation
  const createSupplementMutation = useCreateSupplement();

  // Helper function to format date as "Jan 15, 2025"
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Validation functions
  const validateField = (
    field: keyof FormData,
    value: any
  ): string | undefined => {
    switch (field) {
      case "name":
        if (!value || typeof value !== "string" || value.trim().length === 0) {
          return "Name is required";
        }
        break;
      case "capsules_per_take":
        if (!value || typeof value !== "number" || value < 1) {
          return "Capsules per take must be at least 1";
        }
        break;
      case "time_of_day":
        if (!value || !Array.isArray(value) || value.length === 0) {
          return "Please select at least one time of day";
        }
        break;
      case "start_date":
        if (!value || typeof value !== "string") {
          return "Start date is required";
        }
        const startDate = new Date(value);
        if (isNaN(startDate.getTime())) {
          return "Please select a valid start date";
        }
        break;
      case "end_date":
        if (value && typeof value === "string") {
          const endDate = new Date(value);
          const startDate = new Date(formData.start_date);
          if (isNaN(endDate.getTime())) {
            return "Please select a valid end date";
          }
          if (endDate <= startDate) {
            return "End date must be after start date";
          }
        }
        break;
      case "source_url":
        if (value && typeof value === "string" && value.trim()) {
          try {
            new URL(value);
          } catch {
            return "Please enter a valid URL";
          }
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    errors.name = validateField("name", formData.name);
    errors.capsules_per_take = validateField(
      "capsules_per_take",
      formData.capsules_per_take
    );
    errors.time_of_day = validateField("time_of_day", formData.time_of_day);
    errors.start_date = validateField("start_date", formData.start_date);
    errors.end_date = validateField("end_date", formData.end_date);
    errors.source_url = validateField("source_url", formData.source_url);

    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  // Check if step 1 is valid (required fields only)
  const isStep1Valid = (): boolean => {
    return (
      formData.name.trim().length > 0 &&
      formData.time_of_day.length > 0 &&
      formData.capsules_per_take >= 1 &&
      (!formData.source_url.trim() ||
        validateField("source_url", formData.source_url) === undefined)
    );
  };

  // Check if step 2 is valid (required fields only)
  const isStep2Valid = (): boolean => {
    return (
      formData.start_date.length > 0 &&
      validateField("start_date", formData.start_date) === undefined &&
      validateField("end_date", formData.end_date) === undefined
    );
  };

  // Check if entire form is valid for final submission
  const isFormValid = (): boolean => {
    return isStep1Valid() && isStep2Valid();
  };

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field and validate inline
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleTimeOfDayToggle = (time: TimeOfDay) => {
    const isCurrentlySelected = formData.time_of_day.includes(time);

    if (isCurrentlySelected) {
      // Remove the time if it's currently selected
      const newTimes = formData.time_of_day.filter((t) => t !== time);
      handleFieldChange("time_of_day", newTimes);
    } else {
      // Add the time (no limit anymore)
      const newTimes = [...formData.time_of_day, time];
      handleFieldChange("time_of_day", newTimes);
    }
  };

  const handleTimeOfDayRemove = (timeToRemove: TimeOfDay) => {
    const newTimes = formData.time_of_day.filter((t) => t !== timeToRemove);
    handleFieldChange("time_of_day", newTimes);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      capsules_per_take: 1,
      time_of_day: [],
      recommendation: "",
      source_url: "",
      source_name: "",
      start_date: "",
      end_date: "",
      reason: "",
    });
    setFormErrors({});
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    // Final validation check
    if (!isFormValid()) {
      // Run full validation to show all errors
      validateForm();
      return;
    }

    try {
      const supplementData: SupplementInput = {
        name: formData.name.trim(),
        capsules_per_take: formData.capsules_per_take,
        time_of_day: formData.time_of_day,
        recommendation: formData.recommendation.trim() || undefined,
        source_url: formData.source_url.trim() || undefined,
        source_name: formData.source_name.trim() || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        reason: formData.reason.trim() || undefined,
      };

      console.log("Submitting supplement:", supplementData);
      const result = await createSupplementMutation.mutateAsync(supplementData);
      console.log("Supplement created successfully:", result);

      // Success - close form and reset
      resetForm();
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook
      console.error("Failed to create supplement:", error);
    }
  };

  // Handle mount/unmount and animations
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      resetForm(); // Reset form when opening
      document.body.style.overflow = "hidden";
      // Trigger animation after mount
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      // Start exit animation
      setIsAnimating(false);
      // Delay unmount to allow exit animation to complete
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = "unset";
      }, 300); // Match transition duration
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Sync dates with form data
  useEffect(() => {
    if (startDate) {
      const dateString = startDate.toISOString().split("T")[0];
      handleFieldChange("start_date", dateString);
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      const dateString = endDate.toISOString().split("T")[0];
      handleFieldChange("end_date", dateString);
    } else {
      handleFieldChange("end_date", "");
    }
  }, [endDate]);

  // Ensure end date is never before the start date if user changes start after picking end
  useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      setEndDate(undefined);
    }
  }, [startDate, endDate]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (open) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop with black 20% opacity and backdrop blur */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Dialog */}
      <MotionConfig transition={{ duration: 0.5, type: "spring", bounce: 0 }}>
        <motion.div
          animate={{ height: bounds.height }}
          className={`relative z-50 w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ease-out ${
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
              className="flex items-center justify-between p-5 py-4 bg-gray-50 border-b border-b-gray-200"
            >
              <h2 className="font-medium">Add a supplement</h2>
              {/* Progress indicator */}
              <div className="flex gap-2 w-1/3">
                <div
                  className={`h-1 flex-1 rounded-full ${
                    currentStep >= 1 ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full ${
                    currentStep === 2 ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              </div>
            </motion.div>

            {/* Form Content */}
            <AnimatePresence
              mode="popLayout"
              initial={false}
              custom={direction}
            >
              <motion.div
                key={currentStep}
                variants={variants}
                initial="initial"
                animate="active"
                exit="exit"
                custom={direction}
                className="p-6"
              >
                {currentStep === 1 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1">Name</label>
                      <input
                        type="text"
                        placeholder="Name"
                        value={formData.name}
                        onChange={(e) =>
                          handleFieldChange("name", e.target.value)
                        }
                        disabled={createSupplementMutation.isPending}
                        className={`w-full px-3 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          formErrors.name ? "border-red-300" : "border-gray-100"
                        }`}
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full">
                        <label className="block mb-1">Time of take</label>
                        <div className="relative">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                disabled={createSupplementMutation.isPending}
                                className={`w-full px-[2px] pr-10 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                                  formErrors.time_of_day
                                    ? "border-red-300"
                                    : "border-gray-100"
                                }`}
                              >
                                <div className="flex flex-wrap gap-0.5 items-center">
                                  {formData.time_of_day.length > 0 ? (
                                    formData.time_of_day.map((time) => {
                                      const label = (() => {
                                        switch (time) {
                                          case "MORNING":
                                            return "Morning";
                                          case "LUNCH":
                                            return "Lunch";
                                          case "DINNER":
                                            return "Dinner";
                                          case "BEFORE_SLEEP":
                                            return "Before sleep";
                                          default:
                                            return time;
                                        }
                                      })();
                                      return (
                                        <span
                                          key={time}
                                          className="inline-flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-lg bg-white border border-gray-200"
                                        >
                                          <span>{label}</span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTimeOfDayRemove(time);
                                            }}
                                            disabled={
                                              createSupplementMutation.isPending
                                            }
                                            className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            <HugeiconsIcon
                                              icon={Cancel01FreeIcons}
                                              className="w-3 h-3 text-gray-400 hover:text-gray-600"
                                              strokeWidth={2}
                                            />
                                          </button>
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-gray-400 ml-3">
                                      Select time(s) of day
                                    </span>
                                  )}
                                </div>
                                <div className="pointer-events-none bg-white rounded-[10px] h-9 w-9 border border-gray-200 absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                  <ChevronsUpDown className="w-5 h-5 text-gray-400" />
                                </div>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-full p-0"
                              align="start"
                            >
                              <div className="p-1 space-y-1">
                                {[
                                  {
                                    value: "MORNING" as TimeOfDay,
                                    label: "Morning",
                                  },
                                  {
                                    value: "LUNCH" as TimeOfDay,
                                    label: "Lunch",
                                  },
                                  {
                                    value: "DINNER" as TimeOfDay,
                                    label: "Dinner",
                                  },
                                  {
                                    value: "BEFORE_SLEEP" as TimeOfDay,
                                    label: "Before sleep",
                                  },
                                ].map((time) => {
                                  const isSelected =
                                    formData.time_of_day.includes(time.value);
                                  const isDisabled =
                                    createSupplementMutation.isPending;

                                  return (
                                    <label
                                      key={time.value}
                                      className={`flex items-center space-x-3 transition-all duration-150 px-3 py-2 rounded-xl ${
                                        isDisabled
                                          ? "cursor-not-allowed opacity-50"
                                          : "cursor-pointer hover:bg-gray-100"
                                      }`}
                                    >
                                      <div className="relative">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() =>
                                            handleTimeOfDayToggle(time.value)
                                          }
                                          disabled={isDisabled}
                                          className="sr-only"
                                        />
                                        <div
                                          className={`w-5 h-5 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                                            isSelected
                                              ? "bg-blue-600 border-blue-600"
                                              : "bg-white border-gray-300 hover:border-gray-400"
                                          } ${isDisabled ? "opacity-50" : ""}`}
                                        >
                                          {isSelected && (
                                            <HugeiconsIcon
                                              icon={Tick02FreeIcons}
                                              strokeWidth={2}
                                              className="w-4 h-4 text-white"
                                            />
                                          )}
                                        </div>
                                      </div>
                                      <span className="select-none">
                                        {time.label}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        {formErrors.time_of_day && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.time_of_day}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1">Capsules per take</label>
                      <input
                        type="number"
                        value={formData.capsules_per_take}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            // Don't update if empty, keep current value
                            return;
                          }
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 1) {
                            handleFieldChange("capsules_per_take", numValue);
                          }
                        }}
                        onBlur={(e) => {
                          // Ensure we always have at least 1 when field loses focus
                          if (
                            e.target.value === "" ||
                            parseInt(e.target.value) < 1
                          ) {
                            handleFieldChange("capsules_per_take", 1);
                          }
                        }}
                        min={1}
                        disabled={createSupplementMutation.isPending}
                        className={`w-full px-3 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          formErrors.capsules_per_take
                            ? "border-red-300"
                            : "border-gray-100"
                        }`}
                      />
                      {formErrors.capsules_per_take && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors.capsules_per_take}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1">Recommendation</label>
                      <input
                        type="text"
                        placeholder="When/how should you take it?"
                        value={formData.recommendation}
                        onChange={(e) =>
                          handleFieldChange("recommendation", e.target.value)
                        }
                        disabled={createSupplementMutation.isPending}
                        className="w-full px-3 h-10 border border-gray-100 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block mb-1">Source</label>
                      <div className="space-y-2">
                        <div className="relative">
                          <div className="pointer-events-none bg-white rounded-[10px] h-9 w-9 border border-gray-200 absolute left-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                            <HugeiconsIcon
                              icon={Link05FreeIcons}
                              className="w-5 h-5 text-gray-400 "
                            />
                          </div>
                          <input
                            type="url"
                            placeholder="Paste link (website or other proof)"
                            value={formData.source_url}
                            onChange={(e) =>
                              handleFieldChange("source_url", e.target.value)
                            }
                            disabled={createSupplementMutation.isPending}
                            className={`w-full pl-11 pr-3 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                              formErrors.source_url
                                ? "border-red-300"
                                : "border-gray-100"
                            }`}
                          />
                        </div>
                        {formErrors.source_url && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.source_url}
                          </p>
                        )}
                        <input
                          type="text"
                          placeholder="Display name"
                          value={formData.source_name}
                          onChange={(e) =>
                            handleFieldChange("source_name", e.target.value)
                          }
                          disabled={createSupplementMutation.isPending}
                          className="w-full px-3 h-10 border border-gray-100 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full">
                        <label className="block mb-1">Start</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              disabled={createSupplementMutation.isPending}
                              className={`w-full px-3 pr-12 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left relative disabled:opacity-50 disabled:cursor-not-allowed ${
                                formErrors.start_date
                                  ? "border-red-300"
                                  : "border-gray-100"
                              }`}
                            >
                              <span
                                className={
                                  startDate ? "text-gray-900" : "text-gray-400"
                                }
                              >
                                {startDate
                                  ? formatDate(startDate)
                                  : "Select start date"}
                              </span>
                              <div className="pointer-events-none bg-white rounded-[10px] h-9 w-9 border border-gray-200 absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                <HugeiconsIcon
                                  icon={Calendar04FreeIcons}
                                  className="w-4 h-4 text-gray-400"
                                  strokeWidth={2}
                                />
                              </div>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {formErrors.start_date && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.start_date}
                          </p>
                        )}
                      </div>

                      <div className="w-full">
                        <label className="block mb-1">
                          End (optional, if any)
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              disabled={createSupplementMutation.isPending}
                              className={`w-full px-3 pr-12 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left relative disabled:opacity-50 disabled:cursor-not-allowed ${
                                formErrors.end_date
                                  ? "border-red-300"
                                  : "border-gray-100"
                              }`}
                            >
                              <span
                                className={
                                  endDate ? "text-gray-900" : "text-gray-400"
                                }
                              >
                                {endDate
                                  ? formatDate(endDate)
                                  : "Select end date"}
                              </span>
                              <div className="pointer-events-none bg-white rounded-[10px] h-9 w-9 border border-gray-200 absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                <HugeiconsIcon
                                  icon={Calendar04FreeIcons}
                                  className="w-4 h-4 text-gray-400"
                                  strokeWidth={2}
                                />
                              </div>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {formErrors.end_date && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.end_date}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1">Reason</label>
                      <textarea
                        placeholder="Write the reason you are supplementing"
                        rows={4}
                        value={formData.reason}
                        onChange={(e) =>
                          handleFieldChange("reason", e.target.value)
                        }
                        disabled={createSupplementMutation.isPending}
                        className="w-full px-3 py-2 border border-gray-100 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}
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
                onClick={() => {
                  if (currentStep === 2) {
                    setDirection(-1);
                    setCurrentStep(1);
                  } else {
                    onClose();
                  }
                }}
                disabled={createSupplementMutation.isPending}
              >
                {currentStep === 2 ? "Back" : "Cancel"}
              </Button>
              <Button
                variant="default"
                size="default-no-icon"
                className="w-full"
                disabled={
                  createSupplementMutation.isPending ||
                  (currentStep === 1 ? !isStep1Valid() : !isFormValid())
                }
                onClick={() => {
                  if (currentStep === 1) {
                    if (isStep1Valid()) {
                      setDirection(1);
                      setCurrentStep(2);
                    }
                  } else {
                    handleSubmit();
                  }
                }}
              >
                {createSupplementMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </>
                ) : currentStep === 1 ? (
                  "Next"
                ) : (
                  "Add"
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </MotionConfig>
    </div>
  );
}

const variants = {
  initial: (direction: number) => {
    return { x: `${110 * direction}%`, opacity: 0 };
  },
  active: { x: "0%", opacity: 1 },
  exit: (direction: number) => {
    return { x: `${-110 * direction}%`, opacity: 0 };
  },
};
