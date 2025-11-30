"use client";

import OCRBiomarkersModal from "@/components/protected/ocr-biomarkers-modal";
import { BiomarkersVerificationModal } from "@/components/protected/biomarkers-verification-modal";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { useBiomarkerReports, useBiomarkersOverview } from "@/lib/hooks";
import type { BiomarkersByStatusResponse } from "@/lib/types/biomarkers";
import {
  calculateThresholdVisualization,
  type ThresholdSegment,
} from "@/lib/utils/threshold-visualization";
import { HugeiconsIcon, HugeiconsIconProps } from "@hugeicons/react";
import {
  BloodFreeIcons,
  AidsFreeIcons,
  Cardiogram02FreeIcons,
  EarthFreeIcons,
  Dna01FreeIcons,
  BloodBottleFreeIcons,
  Fire03FreeIcons,
  MedicalFileFreeIcons,
  Leaf01FreeIcons,
  DigestionFreeIcons,
} from "@hugeicons/core-free-icons";
import { LabReportCard } from "@/components/protected/biomarkers/lab-report-card";

// Map database icon name strings to actual icon components
// Database stores icon names like "BloodFreelcons", "AidsFreelcons", etc.
const getCategoryIcon = (
  iconName: string | null | undefined
): HugeiconsIconProps["icon"] => {
  if (!iconName) return BloodFreeIcons;

  // Create mapping from database icon names to actual icon components
  // Handle both "Freelcons" typo and "FreeIcons" correct spelling
  const iconMap: Record<string, HugeiconsIconProps["icon"]> = {
    // Handle "Freelcons" typo (as stored in database)
    BloodFreelcons: BloodFreeIcons,
    AidsFreelcons: AidsFreeIcons,
    Cardiogram02Freelcons: Cardiogram02FreeIcons,
    EarthFreelcons: EarthFreeIcons,
    Dna01Freelcons: Dna01FreeIcons,
    BloodBottleFreelcons: BloodBottleFreeIcons,
    Fire03Freelcons: Fire03FreeIcons,
    MedicalFileFreelcons: MedicalFileFreeIcons,
    Leaf01Freelcons: Leaf01FreeIcons,
    DigestionFreelcons: DigestionFreeIcons,
    // Also handle correct "FreeIcons" spelling (in case it's fixed later)
    BloodFreeIcons,
    AidsFreeIcons,
    Cardiogram02FreeIcons,
    EarthFreeIcons,
    Dna01FreeIcons,
    BloodBottleFreeIcons,
    Fire03FreeIcons,
    MedicalFileFreeIcons,
    Leaf01FreeIcons,
    DigestionFreeIcons,
  };

  // Try exact match first
  if (iconMap[iconName]) {
    return iconMap[iconName];
  }

  // Try case-insensitive match
  const lowerIconName = iconName.toLowerCase();
  const matchingKey = Object.keys(iconMap).find(
    (key) => key.toLowerCase() === lowerIconName
  );

  return matchingKey ? iconMap[matchingKey] : BloodFreeIcons;
};

// Threshold Bar Component
interface ThresholdBarProps {
  thresholds: {
    unit: string;
    bands: Array<{
      name: string;
      min: number | null;
      max: number | null;
      status: "optimal" | "borderline" | "out_of_range";
    }>;
  };
  currentStatus: "optimal" | "borderline" | "out_of_range" | null;
  latestValue: number | null;
}

// Map width numbers to Tailwind classes
// Desktop calculations return: 16 (current), 8 (others normal), 4 (others bidirectional)
// Mobile calculations return: 8 (current), 4 (others normal), 2 (others bidirectional)
const widthClassMap: Record<number, { desktop: string; mobile: string }> = {
  2: { desktop: "md:w-4", mobile: "w-2" },
  4: { desktop: "md:w-4", mobile: "w-4" },
  8: { desktop: "md:w-8", mobile: "w-8" },
  16: { desktop: "md:w-16", mobile: "w-16" },
};

function ThresholdBar({
  thresholds,
  currentStatus,
  latestValue,
}: ThresholdBarProps) {
  // Calculate visualization for desktop
  const desktopConfig = calculateThresholdVisualization(
    thresholds,
    currentStatus,
    latestValue,
    false
  );

  // Calculate visualization for mobile
  const mobileConfig = calculateThresholdVisualization(
    thresholds,
    currentStatus,
    latestValue,
    true
  );

  // Helper to get dot color based on current status
  const getDotColor = () => {
    switch (currentStatus) {
      case "optimal":
        return "border-emerald-500 bg-emerald-500";
      case "borderline":
        return "border-amber-500 bg-amber-500";
      case "out_of_range":
        return "border-fuchsia-500 bg-fuchsia-500";
      default:
        return "border-gray-500 bg-gray-500";
    }
  };

  return (
    <div className="flex gap-px relative h-8 max-w-40">
      {/* Desktop segments */}
      <div className="hidden md:flex gap-px w-full">
        {desktopConfig.segments.map(
          (segment: ThresholdSegment, index: number) => {
            const widthClasses = widthClassMap[segment.width] || {
              desktop: "md:w-16",
              mobile: "w-8",
            };
            return (
              <div
                key={`desktop-${index}`}
                className={`${widthClasses.desktop} h-8 rounded-t-lg ${segment.bgColor} border-b ${segment.borderColor}`}
              />
            );
          }
        )}
        {desktopConfig.dotPosition !== null && (
          <div
            className="absolute top-1/2 w-2 h-2 rounded-full z-10 hidden md:block"
            style={{
              left: `${desktopConfig.dotPosition}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className={`w-full h-full rounded-full ${getDotColor()}`}>
              <div className="w-1 h-1 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>

      {/* Mobile segments */}
      <div className="flex md:hidden gap-px w-full">
        {mobileConfig.segments.map(
          (segment: ThresholdSegment, index: number) => {
            const widthClasses = widthClassMap[segment.width] || {
              desktop: "md:w-16",
              mobile: "w-8",
            };
            return (
              <div
                key={`mobile-${index}`}
                className={`${widthClasses.mobile} h-8 rounded-t-lg ${segment.bgColor} border-b ${segment.borderColor}`}
              />
            );
          }
        )}
        {mobileConfig.dotPosition !== null && (
          <div
            className="absolute top-1/2 w-2 h-2 rounded-full z-10 md:hidden"
            style={{
              left: `${mobileConfig.dotPosition}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className={`w-full h-full rounded-full ${getDotColor()}`}>
              <div className="w-1 h-1 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Biomarkers() {
  const [open, setOpen] = useState(false);
  const [verificationReportId, setVerificationReportId] = useState<
    string | null
  >(null);
  const { data: reports, isLoading, error, refetch } = useBiomarkerReports();

  const {
    data: biomarkersOverview,
    isLoading: isLoadingOverview,
    error: errorOverview,
  } = useBiomarkersOverview();

  console.log(biomarkersOverview);

  const hasReports = useMemo(() => (reports?.length ?? 0) > 0, [reports]);

  return (
    <>
      <OCRBiomarkersModal
        open={open}
        onClose={() => {
          setOpen(false);
          // Refresh reports when the modal closes in case a new report was uploaded.
          refetch();
        }}
      />
      <BiomarkersVerificationModal
        reportId={verificationReportId}
        open={verificationReportId !== null}
        onClose={() => {
          setVerificationReportId(null);
          // Refresh reports when the modal closes to reflect status changes
          refetch();
        }}
      />
      <div className="flex flex-col items-center gap-4 min-h-screen p-4 py-12 md:p-12 bg-white">
        <div className="flex flex-col gap-8 md:max-w-7xl w-full">
          <div className="flex justify-between items-center mb-4">
            <BackButton title="profile" />
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Upload report
            </Button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 h-[calc(100vh-20rem)]">
              <div className="h-4 w-40 rounded-full bg-gray-100" />
              <div className="h-3 w-64 rounded-full bg-gray-100" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 h-[calc(100vh-20rem)]">
              <p className="text-red-500 text-sm">
                {error instanceof Error
                  ? error.message
                  : "Failed to load lab reports."}
              </p>
            </div>
          ) : !hasReports ? (
            <div className="flex flex-col items-center justify-center gap-8 h-[calc(100vh-20rem)]">
              <Image
                src="/illustration-empty-biomarkers.png"
                alt="Biomarkers"
                width={426}
                height={181}
              />
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="flex flex-col items-center justify-center gap-2">
                  <h1 className="text-xl font-medium">
                    You currently track 0 biomarkers
                  </h1>
                  <p className="text-gray-500 text-xl">
                    Upload a <span className="text-blue-600">lab report</span>{" "}
                    to start tracking.
                  </p>
                </div>
                <Button onClick={() => setOpen(true)}>
                  <Plus />
                  Upload Report
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              <section className="lg:col-span-3 space-y-3">
                <span className="font-medium text-lg">Your biomarkers</span>
                {isLoadingOverview ? (
                  <div className="flex flex-col items-center justify-center gap-4 h-[calc(100vh-20rem)]">
                    <div className="h-4 w-40 rounded-full bg-gray-100" />
                    <div className="h-3 w-64 rounded-full bg-gray-100" />
                  </div>
                ) : errorOverview ? (
                  <div className="flex flex-col items-center justify-center gap-4 h-[calc(100vh-20rem)]">
                    <p className="text-red-500 text-sm">
                      {errorOverview instanceof Error
                        ? errorOverview.message
                        : "Failed to load biomarkers."}
                    </p>
                  </div>
                ) : !biomarkersOverview?.biomarkers ||
                  biomarkersOverview.biomarkers.length === 0 ? (
                  <div className="bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="flex flex-col items-center justify-center gap-8 h-[calc(100vh-20rem)]">
                      <Image
                        src="/illustration-empty-biomarkers.png"
                        alt="Biomarkers"
                        width={426}
                        height={181}
                      />
                      <div className="flex flex-col items-center justify-center gap-6">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <h1 className="text-xl font-medium">
                            You currently track 0 biomarkers
                          </h1>
                          <p className="text-gray-500 text-xl">
                            Upload a{" "}
                            <span className="text-blue-600">lab report</span> to
                            start tracking.
                          </p>
                        </div>
                        <Button onClick={() => setOpen(true)}>
                          <Plus />
                          Upload Report
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {biomarkersOverview?.biomarkers.map((group) => {
                      // Type guard: check if it's a status group (default sort is STATUS)
                      const statusGroup = group as BiomarkersByStatusResponse;
                      if (!("status" in statusGroup)) return null;

                      const statusConfig = {
                        out_of_range: {
                          label: "Out of range",
                          color: "text-fuchsia-600",
                          bgColor: "bg-fuchsia-50",
                          borderColor: "border-fuchsia-200",
                        },
                        borderline: {
                          label: "Borderline",
                          color: "text-amber-600",
                          bgColor: "bg-amber-50",
                          borderColor: "border-amber-200",
                        },
                        optimal: {
                          label: "Optimal",
                          color: "text-green-600",
                          bgColor: "bg-green-50",
                          borderColor: "border-green-200",
                        },
                        null: {
                          label: "No Data",
                          color: "text-gray-600",
                          bgColor: "bg-gray-50",
                          borderColor: "border-gray-200",
                        },
                      };

                      const config = statusConfig[statusGroup.status ?? "null"];

                      if (statusGroup.biomarkers.length === 0) return null;

                      return (
                        <div
                          key={statusGroup.status ?? "null"}
                          className="space-y-3"
                        >
                          {/* Status Header */}
                          <h2 className={`text-sm font-medium ${config.color}`}>
                            {config.label}
                          </h2>

                          {/* Biomarker Items */}
                          <div className="space-y-2">
                            {statusGroup.biomarkers.map((biomarker) => (
                              <div
                                key={biomarker.id}
                                className="grid grid-cols-[1fr_120px_200px_80px_auto] items-center gap-4 p-4 bg-white border border-gray-200 rounded-3xl hover:bg-gray-50/50 transition-colors"
                              >
                                {/* Biomarker name/category - flex-1 */}
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`rounded-xl p-3 flex items-center justify-center flex-shrink-0 ${config.bgColor} ${config.color}`}
                                  >
                                    <HugeiconsIcon
                                      icon={getCategoryIcon(
                                        biomarker.category.icon
                                      )}
                                      className="w-6 h-6"
                                      strokeWidth={2}
                                    />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium truncate">
                                      {biomarker.name}
                                    </span>
                                    <span className="text-sm text-gray-500 truncate">
                                      {biomarker.category.label}
                                    </span>
                                  </div>
                                </div>

                                {/* Status badge - equal width */}
                                <div className="flex justify-center">
                                  <div
                                    className={`px-3 py-1 rounded-xl font-medium whitespace-nowrap ${config.bgColor} ${config.color}`}
                                  >
                                    {config.label}
                                  </div>
                                </div>

                                {/* Threshold bar - equal width */}
                                <div className="flex justify-center">
                                  <ThresholdBar
                                    thresholds={biomarker.thresholds}
                                    currentStatus={biomarker.status}
                                    latestValue={biomarker.latestValue}
                                  />
                                </div>

                                {/* Value/unit - equal width */}
                                <div className="text-right whitespace-nowrap">
                                  <span className="text-sm font-medium">
                                    {biomarker.latestValue?.toLocaleString() ??
                                      "—"}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-1">
                                    {biomarker.unit}
                                  </span>
                                </div>

                                {/* Chevron icon - auto width */}
                                <div className="flex justify-center">
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
              <section className="col-span-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg">Latest labs</span>
                  <button className="text-gray-500 hover:text-gray-700 flex items-center">
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <ul className="space-y-3">
                  {reports!.map((report) => (
                    <LabReportCard
                      key={report.id}
                      report={report}
                      onVerificationClick={setVerificationReportId}
                    />
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
