"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { NutrientStatusBar } from "./nutrient-status-bar";
import type { IntakeResult, AgeGroup, UserSex } from "@/lib/types/planner";

interface IntakeSummaryProps {
  intakeResults: IntakeResult[];
  demographics?: {
    ageGroup: AgeGroup;
    sex: UserSex;
  };
  isLoading: boolean;
}

/**
 * Live calculation display showing nutrient intake summary
 * Groups nutrients by category and shows status indicators
 */
export function IntakeSummary({
  intakeResults,
  demographics,
  isLoading,
}: IntakeSummaryProps) {
  // Group results by category
  const groupedResults = useMemo(() => {
    const groups = new Map<string, IntakeResult[]>();
    for (const result of intakeResults) {
      const existing = groups.get(result.category) || [];
      groups.set(result.category, [...existing, result]);
    }
    return groups;
  }, [intakeResults]);

  // Summary stats
  const stats = useMemo(() => {
    const ok = intakeResults.filter((r) => r.status === "ok").length;
    const warning = intakeResults.filter((r) => r.status === "warning").length;
    const danger = intakeResults.filter((r) => r.status === "danger").length;
    return { ok, warning, danger, total: intakeResults.length };
  }, [intakeResults]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="space-y-4">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse-gray" />
          <div className="w-full h-20 bg-gray-200 rounded-xl animate-pulse-gray" />
          <div className="w-full h-20 bg-gray-200 rounded-xl animate-pulse-gray" />
        </div>
      </div>
    );
  }

  if (intakeResults.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nutrient Intake Summary
        </h3>
        <p className="text-gray-500">
          {demographics
            ? "No active supplements found. Activate a plan to see intake calculations."
            : "Set your birthdate and sex in profile settings to see personalized nutrient limits."}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-3xl p-6 shadow-sm space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Nutrient Intake Summary
        </h3>
        {demographics && (
          <span className="text-sm text-gray-500">
            {demographics.sex === "male" ? "Male" : "Female"},{" "}
            {demographics.ageGroup}
          </span>
        )}
      </div>

      {/* Status summary badges */}
      <div className="flex items-center gap-4">
        {stats.ok > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">{stats.ok} OK</span>
          </div>
        )}
        {stats.warning > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-600">{stats.warning} Warning</span>
          </div>
        )}
        {stats.danger > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-600">{stats.danger} Over limit</span>
          </div>
        )}
      </div>

      {/* Nutrient bars grouped by category */}
      <div className="space-y-6">
        {Array.from(groupedResults.entries()).map(([category, results]) => (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {category}
            </h4>
            <div className="space-y-2">
              {results.map((result) => (
                <NutrientStatusBar key={result.nutrientId} result={result} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
