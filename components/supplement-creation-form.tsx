"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar04FreeIcons,
  Link05FreeIcons,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import useMeasure from "react-use-measure";

interface SupplementCreationFormProps {
  open: boolean;
  onClose: () => void;
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
  const [dateError, setDateError] = useState<string | null>(null);
  const [direction, setDirection] = useState<number>(1);
  const [ref, bounds] = useMeasure();

  // Helper function to format date as "Jan 15, 2025"
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle mount/unmount and animations
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setCurrentStep(1); // Reset to first step when opening
      setStartDate(undefined); // Reset dates when opening
      setEndDate(undefined);
      setDateError(null);
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

  // Ensure end date is never before the start date if user changes start after picking end
  useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      setEndDate(undefined);
      setDateError(null);
    }
  }, [startDate, endDate]);

  const endBeforeStart =
    Boolean(startDate) && Boolean(endDate) && !!(endDate! < startDate!);

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
                        className="w-full px-3 h-10 border border-gray-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full">
                        <label className="block mb-1">Time of take</label>
                        <div className="relative">
                          <select className="w-full px-3 pr-10 h-10 border border-gray-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer">
                            <option>Select a time of day</option>
                            <option>Morning</option>
                            <option>Lunch</option>
                            <option>Dinner</option>
                            <option>Before sleep</option>
                          </select>
                          <div className="pointer-events-none bg-white rounded-[10px] h-9 w-9 border border-gray-200 absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                            <ChevronsUpDown className="w-5 h-5 text-gray-400 " />
                          </div>
                        </div>
                      </div>

                      <div className="max-w-xs">
                        <label className="block mb-1">Capsules per take</label>
                        <input
                          type="number"
                          defaultValue={1}
                          min={1}
                          className="w-full px-3 h-10 border border-gray-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1">Recommendation</label>
                      <input
                        type="text"
                        placeholder="When/how should you take it?"
                        className="w-full px-3 h-10 border border-gray-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full pl-11 pr-3 h-10 border border-gray-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Display name"
                          className="w-full px-3 h-10 border border-gray-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            <button className="w-full px-3 pr-12 h-10 border border-gray-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left relative">
                              <span
                                className={
                                  startDate ? "text-gray-900" : "text-gray-400"
                                }
                              >
                                {startDate
                                  ? formatDate(startDate)
                                  : "Select start date"}
                              </span>
                              <div className="pointer-events-none bg-white rounded-[10px] h-9 w-9 border border-gray-200 absolute right-px top-1/2 -translate-y-1/2 flex items-center justify-center">
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
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="w-full">
                        <label className="block mb-1">
                          End (optional, if any)
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="w-full px-3 pr-12 h-10 border border-gray-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left relative">
                              <span
                                className={
                                  endDate ? "text-gray-900" : "text-gray-400"
                                }
                              >
                                {endDate
                                  ? formatDate(endDate)
                                  : "Select end date"}
                              </span>
                              <div className="pointer-events-none bg-white rounded-[10px] h-9 w-9 border border-gray-200 absolute right-px top-1/2 -translate-y-1/2 flex items-center justify-center">
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
                                if (date && startDate && date < startDate) {
                                  setDateError(
                                    "End date must be after start date"
                                  );
                                  return;
                                }
                                setDateError(null);
                                setEndDate(date);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        {dateError ? (
                          <p className="text-sm text-red-600 mt-1">
                            {dateError}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1">Reason</label>
                      <textarea
                        placeholder="Write the reason you are supplementing"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                  if (currentStep === 1) {
                    onClose();
                  } else {
                    setDirection(-1);
                    setCurrentStep(1);
                  }
                }}
              >
                {currentStep === 1 ? "Cancel" : "Back"}
              </Button>
              <Button
                variant="default"
                size="default-no-icon"
                className="w-full"
                onClick={() => {
                  if (currentStep === 1) {
                    setDirection(1);
                    setCurrentStep(2);
                  } else {
                    // Handle form submission here
                    onClose();
                  }
                }}
                disabled={currentStep === 2 && endBeforeStart}
              >
                {currentStep === 1 ? "Next" : "Add"}
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
