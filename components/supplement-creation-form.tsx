"use client";

import { BackdropPortal } from "@/components/ui/backdrop-portal";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCreateSupplement } from "@/lib/hooks";
import { SupplementInput, TimeOfDay } from "@/lib/types";
import { formatDateShort } from "@/lib/utils";
import {
  Calendar04FreeIcons,
  Cancel01FreeIcons,
  Link05FreeIcons,
  Tick02FreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import useMeasure from "react-use-measure";

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
  inventory_total: number;
  period_type: string;
}

interface FormErrors {
  name?: string;
  capsules_per_take?: string;
  time_of_day?: string;
  start_date?: string;
  end_date?: string;
  source_url?: string;
  inventory_total?: string;
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
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [missedDays, setMissedDays] = useState<string[]>([]);
  const [addDayOpen, setAddDayOpen] = useState(false);

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
    inventory_total: 0,
    period_type: "Indefinitely",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // TanStack Query mutation
  const createSupplementMutation = useCreateSupplement();

  // Validation functions
  const validateFieldWithData = (
    field: keyof FormData,
    value: string | number | TimeOfDay[] | undefined,
    formData: FormData
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
      case "inventory_total":
        if (formData.period_type === "Indefinitely") {
          if (!value || typeof value !== "number" || value < 0) {
            return "Inventory must be a positive number";
          }
        }
        break;
    }
    return undefined;
  };

  const validateField = (
    field: keyof FormData,
    value: string | number | TimeOfDay[] | undefined
  ): string | undefined => {
    return validateFieldWithData(field, value, formData);
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

  // Check if we need backfill step
  const needsBackfillStep = (): boolean => {
    if (!formData.start_date) return false;

    // Compare using UTC-normalized midnights to avoid timezone offsets
    const startUtcMs = Date.parse(`${formData.start_date}T00:00:00Z`);
    if (Number.isNaN(startUtcMs)) return false;

    const now = new Date();
    const todayUtcMs = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    );

    return startUtcMs < todayUtcMs;
  };

  const getTotalSteps = (): number => {
    return needsBackfillStep() ? 3 : 2;
  };

  // Check if entire form is valid for final submission
  const isFormValid = (): boolean => {
    return isStep1Valid() && isStep2Valid();
  };

  const handleFieldChange = useCallback(
    (
      field: keyof FormData,
      value: string | number | TimeOfDay[] | undefined
    ) => {
      setFormData((prev) => {
        const newFormData = { ...prev, [field]: value };

        // Clear error for this field and validate inline
        const error = validateFieldWithData(field, value, newFormData);
        setFormErrors((prevErrors) => ({ ...prevErrors, [field]: error }));

        return newFormData;
      });
    },
    []
  );

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

  const handlePeriodTypeChange = useCallback(
    (periodType: string) => {
      handleFieldChange("period_type", periodType);

      if (periodType === "Indefinitely") {
        handleFieldChange("end_date", "");
        setEndDate(undefined);
      } else if (periodType !== "Custom" && startDate) {
        // Calculate end date based on period
        const endDate = new Date(startDate);
        switch (periodType) {
          case "1 week":
            endDate.setDate(endDate.getDate() + 7);
            break;
          case "2 weeks":
            endDate.setDate(endDate.getDate() + 14);
            break;
          case "1 month":
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case "2 months":
            endDate.setMonth(endDate.getMonth() + 2);
            break;
          case "3 months":
            endDate.setMonth(endDate.getMonth() + 3);
            break;
        }
        setEndDate(endDate);
        handleFieldChange("end_date", endDate.toISOString().split("T")[0]);
      }
    },
    [handleFieldChange, startDate]
  );

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
      inventory_total: 0,
      period_type: "Indefinitely",
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
        start_date: formData.start_date
          ? new Date(formData.start_date + "T00:00:00").toISOString()
          : "",
        end_date: formData.end_date
          ? new Date(formData.end_date + "T00:00:00").toISOString()
          : undefined,
        reason: formData.reason.trim() || undefined,
        inventory_total:
          formData.period_type === "Indefinitely"
            ? formData.inventory_total
            : undefined,
        missed_days: missedDays.length > 0 ? missedDays : undefined,
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

  // Sync dates with form data
  useEffect(() => {
    if (startDate) {
      const dateString =
        startDate.getFullYear() +
        "-" +
        String(startDate.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(startDate.getDate()).padStart(2, "0");
      handleFieldChange("start_date", dateString);

      // Recalculate end date if period type is set and not indefinite/custom
      if (
        formData.period_type !== "Indefinitely" &&
        formData.period_type !== "Custom"
      ) {
        handlePeriodTypeChange(formData.period_type);
      }
    }
  }, [
    startDate,
    formData.period_type,
    handleFieldChange,
    handlePeriodTypeChange,
  ]);

  useEffect(() => {
    if (endDate) {
      const dateString =
        endDate.getFullYear() +
        "-" +
        String(endDate.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(endDate.getDate()).padStart(2, "0");
      handleFieldChange("end_date", dateString);
    } else {
      handleFieldChange("end_date", "");
    }
  }, [endDate, handleFieldChange]);

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
    <BackdropPortal show={shouldRender} onClose={onClose}>
      {/* Dialog */}
      <MotionConfig transition={{ duration: 0.5, type: "spring", bounce: 0 }}>
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
              <h2 className="font-medium">Add a supplement</h2>
              {/* Progress indicator */}
              <div className="flex gap-2 w-1/5 md:w-1/3">
                <div
                  className={`h-1 flex-1 rounded-full ${
                    currentStep >= 1 ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full ${
                    currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
                {getTotalSteps() === 3 && (
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      currentStep >= 3 ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
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
                {currentStep === 1 && (
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
                        <label className="block mb-1">Start date</label>
                        <Popover
                          open={startDateOpen}
                          onOpenChange={setStartDateOpen}
                        >
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
                                  ? formatDateShort(startDate)
                                  : "Select a start date"}
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
                              onSelect={(date) => {
                                console.log("Calendar date selected:", date);
                                if (date) {
                                  const dateString =
                                    date.getFullYear() +
                                    "-" +
                                    String(date.getMonth() + 1).padStart(
                                      2,
                                      "0"
                                    ) +
                                    "-" +
                                    String(date.getDate()).padStart(2, "0");
                                  console.log(
                                    "Converted to date string:",
                                    dateString
                                  );
                                  handleFieldChange("start_date", dateString);
                                }
                                setStartDate(date);
                                setStartDateOpen(false);
                              }}
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
                        <label className="block mb-1">For</label>
                        <div className="relative">
                          <Popover
                            open={periodOpen}
                            onOpenChange={setPeriodOpen}
                          >
                            <PopoverTrigger asChild>
                              <button
                                disabled={createSupplementMutation.isPending}
                                className="w-full px-3 pr-10 h-10 border border-gray-100 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="text-gray-900">
                                  {formData.period_type}
                                </span>
                                <div className="pointer-events-none bg-white rounded-[10px] h-9 w-9 border border-gray-200 absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                  <ChevronsUpDown className="w-5 h-5 text-gray-400" />
                                </div>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0" align="start">
                              <div className="p-1 space-y-1">
                                {[
                                  "Indefinitely",
                                  "1 week",
                                  "2 weeks",
                                  "1 month",
                                  "2 months",
                                  "3 months",
                                  "Custom",
                                ].map((period) => (
                                  <button
                                    key={period}
                                    onClick={() => {
                                      handlePeriodTypeChange(period);
                                      setPeriodOpen(false);
                                    }}
                                    disabled={
                                      createSupplementMutation.isPending
                                    }
                                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {period}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        {formData.period_type !== "Indefinitely" &&
                          formData.period_type !== "Custom" &&
                          endDate && (
                            <p className="text-sm text-gray-500 mt-1">
                              End date: {formatDateShort(endDate)}
                            </p>
                          )}
                      </div>
                    </div>

                    {formData.period_type === "Custom" && (
                      <div>
                        <label className="block mb-1">End date</label>
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
                                  ? formatDateShort(endDate)
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
                              onSelect={(date) => {
                                if (date) {
                                  const dateString =
                                    date.getFullYear() +
                                    "-" +
                                    String(date.getMonth() + 1).padStart(
                                      2,
                                      "0"
                                    ) +
                                    "-" +
                                    String(date.getDate()).padStart(2, "0");
                                  handleFieldChange("end_date", dateString);
                                }
                                setEndDate(date);
                              }}
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
                    )}

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
                                    formData.time_of_day.map(
                                      (time: TimeOfDay) => {
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
                                            <div
                                              role="button"
                                              tabIndex={0}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (
                                                  !createSupplementMutation.isPending
                                                ) {
                                                  handleTimeOfDayRemove(time);
                                                }
                                              }}
                                              onKeyDown={(e) => {
                                                if (
                                                  e.key === "Enter" ||
                                                  e.key === " "
                                                ) {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  if (
                                                    !createSupplementMutation.isPending
                                                  ) {
                                                    handleTimeOfDayRemove(time);
                                                  }
                                                }
                                              }}
                                              className={`flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 transition-colors cursor-pointer ${
                                                createSupplementMutation.isPending
                                                  ? "opacity-50 cursor-not-allowed"
                                                  : ""
                                              }`}
                                            >
                                              <HugeiconsIcon
                                                icon={Cancel01FreeIcons}
                                                className="w-3 h-3 text-gray-400 hover:text-gray-600"
                                                strokeWidth={2}
                                              />
                                            </div>
                                          </span>
                                        );
                                      }
                                    )
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
                                      className={`flex items-center space-x-3 transition-colors duration-150 px-3 py-2 rounded-xl ${
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
                                          className={`w-5 h-5 rounded-lg border transition-colors duration-200 flex items-center justify-center ${
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

                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full">
                        <label className="block mb-1">Capsules per take</label>
                        <input
                          type="number"
                          placeholder="Number of capsules"
                          value={
                            formData.capsules_per_take === 0
                              ? ""
                              : formData.capsules_per_take
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              handleFieldChange("capsules_per_take", 0);
                              return;
                            }
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue >= 0) {
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

                      {formData.period_type === "Indefinitely" && (
                        <div className="w-full">
                          <label className="block mb-1">
                            Capsules inventory
                          </label>
                          <input
                            type="number"
                            placeholder="Number of capsules"
                            value={
                              formData.inventory_total === 0
                                ? ""
                                : formData.inventory_total
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                handleFieldChange("inventory_total", 0);
                                return;
                              }
                              const numValue = parseInt(value);
                              if (!isNaN(numValue) && numValue >= 0) {
                                handleFieldChange("inventory_total", numValue);
                              }
                            }}
                            min={0}
                            disabled={createSupplementMutation.isPending}
                            className={`w-full px-3 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                              formErrors.inventory_total
                                ? "border-red-300"
                                : "border-gray-100"
                            }`}
                          />
                          {formErrors.inventory_total && (
                            <p className="text-red-500 text-sm mt-1">
                              {formErrors.inventory_total}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
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
                          placeholder="Brand name"
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
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            !
                          </span>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Verify intake
                      </h3>
                    </div>
                    <Step3BackfillContent
                      formData={formData}
                      missedDays={missedDays}
                      setMissedDays={setMissedDays}
                      addDayOpen={addDayOpen}
                      setAddDayOpen={setAddDayOpen}
                    />
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
                  } else if (currentStep === 3) {
                    setDirection(-1);
                    setCurrentStep(2);
                  } else {
                    onClose();
                  }
                }}
                disabled={createSupplementMutation.isPending}
              >
                {currentStep === 2 || currentStep === 3 ? "Back" : "Cancel"}
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
                  } else if (currentStep === 2) {
                    if (needsBackfillStep()) {
                      setDirection(1);
                      setCurrentStep(3);
                    } else {
                      handleSubmit();
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
                ) : currentStep === 2 ? (
                  needsBackfillStep() ? (
                    "Verify intake"
                  ) : (
                    "Add"
                  )
                ) : (
                  "Confirm"
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </MotionConfig>
    </BackdropPortal>
  );
}

// Step 3 Backfill Content Component
interface Step3BackfillContentProps {
  formData: FormData;
  missedDays: string[];
  setMissedDays: (value: string[] | ((prev: string[]) => string[])) => void;
  addDayOpen: boolean;
  setAddDayOpen: (open: boolean) => void;
}

const Step3BackfillContent: React.FC<Step3BackfillContentProps> = ({
  formData,
  missedDays,
  setMissedDays,
  addDayOpen,
  setAddDayOpen,
}) => {
  if (!formData.start_date) return null;

  const startDate = new Date(formData.start_date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff <= 0) return null;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-gray-600">
          You have started <strong>{formData.name}</strong>{" "}
          {daysDiff === 1 ? "one day" : `${daysDiff} days`} ago, but didn&apos;t
          add it at that time. We have identified{" "}
          <strong>{daysDiff} untracked days</strong>.
        </p>
      </div>

      <div className="text-center">
        <p className="text-gray-600">
          Tell us which day you have missed. If you didn&apos;t miss any just
          press the confirm button.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Add ONLY missed days</h4>
        <div className="flex flex-wrap gap-2">
          {missedDays.map((day, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2"
            >
              <span className="text-sm text-gray-700">{day}</span>
              <button
                onClick={() => {
                  setMissedDays((prev) => prev.filter((_, i) => i !== index));
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label={`Remove ${day}`}
              >
                ×
              </button>
            </div>
          ))}
          <Popover open={addDayOpen} onOpenChange={setAddDayOpen}>
            <PopoverTrigger asChild>
              <button className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-2 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2">
                + Add day
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={(date) => {
                  if (date) {
                    const dateString = date.toLocaleDateString();
                    // Only add if not already in the list
                    if (!missedDays.includes(dateString)) {
                      setMissedDays((prev) => [...prev, dateString]);
                    }
                    setAddDayOpen(false);
                  }
                }}
                disabled={(date) => {
                  // Disable future dates and today
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date >= today;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

const variants = {
  initial: (direction: number) => {
    return { x: `${110 * direction}%`, opacity: 0 };
  },
  active: { x: "0%", opacity: 1 },
  exit: (direction: number) => {
    return { x: `${-110 * direction}%`, opacity: 0 };
  },
};
