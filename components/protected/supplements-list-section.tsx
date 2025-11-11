"use client";

import { SupplementsListItem, SupplementStatus } from "@/lib/types";
import { ArrowDown01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import SupplementListCard from "./supplement-list-card";

interface SupplementsListSectionProps {
  supplements: SupplementsListItem[];
}

interface StatusConfig {
  label: string;
  value: SupplementStatus;
}

const statusConfigs: StatusConfig[] = [
  {
    label: "Active",
    value: "ACTIVE",
  },
  {
    label: "Completed",
    value: "COMPLETED",
  },
  {
    label: "Cancelled",
    value: "CANCELLED",
  },
];

export default function SupplementsListSection({
  supplements,
}: SupplementsListSectionProps) {
  // Session storage key for tracking animation state
  const ANIMATION_SESSION_KEY = "supplements-list-animation-played";

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

  // Filter sections that have items
  const availableSections = statusConfigs.filter((config) => {
    const supplementGroup = supplements.find((s) => s.status === config.value);
    return supplementGroup && supplementGroup.items.length > 0;
  });

  // Index of the section currently being revealed (animation-first-load only)
  const [visibleSection, setVisibleSection] = useState(0);
  // Track completed sections to avoid double-advance
  const completedSectionsRef = useRef<Set<number>>(new Set());

  // Track which sections are open (accordion state)
  const [openSections, setOpenSections] = useState<Set<SupplementStatus>>(
    new Set(availableSections.map((s) => s.value))
  );
  // Track if this is the initial render
  const isInitialRenderRef = useRef(true);

  // Toggle section open/closed
  const toggleSection = (status: SupplementStatus) => {
    isInitialRenderRef.current = false;
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  // Mark initial render as complete after first render
  useEffect(() => {
    if (isInitialized) {
      isInitialRenderRef.current = false;
    }
  }, [isInitialized]);

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
        const supplementGroup = supplements.find(
          (s) => s.status === config.value
        );
        if (!supplementGroup || supplementGroup.items.length === 0) return null;

        // Only show the section if it's currently visible or we've already animated once
        if (!hasAnimatedOnce && sectionIdx > visibleSection) return null;

        return (
          <motion.div
            key={config.value}
            className="space-y-3"
            initial={
              hasAnimatedOnce
                ? false
                : { opacity: 0, y: -10, filter: "blur(6px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.25 }}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(config.value)}
              className="flex items-center justify-between px-6 w-full text-left hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-1 text-gray-600">
                <h2 className="font-medium">{config.label}</h2>
                <motion.div
                  animate={{
                    rotate: openSections.has(config.value) ? 0 : -90,
                  }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <HugeiconsIcon
                    icon={ArrowDown01FreeIcons}
                    width={20}
                    height={20}
                    strokeWidth={2}
                  />
                </motion.div>
              </div>
            </button>

            {/* Supplement Cards */}
            <AnimatePresence>
              {openSections.has(config.value) && (
                <motion.div
                  initial={
                    hasAnimatedOnce && isInitialRenderRef.current
                      ? false
                      : { height: 0, opacity: 0 }
                  }
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1">
                    {supplementGroup.items.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={
                          hasAnimatedOnce
                            ? false
                            : { opacity: 0, y: -8, filter: "blur(6px)" }
                        }
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{
                          duration: 0.18,
                          delay: hasAnimatedOnce ? 0 : i * 0.12,
                        }}
                        onAnimationComplete={() => {
                          // If this is the last card of the section and we're in first-load mode,
                          // advance to the next section. Only trigger once per section.
                          const isLastCard =
                            i === supplementGroup.items.length - 1;
                          if (hasAnimatedOnce || !isLastCard) return;
                          if (completedSectionsRef.current.has(sectionIdx))
                            return;
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
                        <SupplementListCard item={item} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
