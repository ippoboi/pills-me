"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02FreeIcons,
  File02FreeIcons,
  FileValidationFreeIcons,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

type Report = Tables<"reports">;

interface LabReportCardProps {
  report: Report;
  onVerificationClick?: (reportId: string) => void;
}

export function LabReportCard({
  report,
  onVerificationClick,
}: LabReportCardProps) {
  const date = report.collected_at ?? report.created_at;
  const dt = date ? new Date(date) : null;
  const dateLabel = dt
    ? dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";

  const timeLabel = dt
    ? dt.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  const isVerifying = report.status === "VERIFYING";
  const isClickable = isVerifying && onVerificationClick;

  const handleClick = () => {
    if (isClickable) {
      onVerificationClick(report.id);
    }
  };

  return (
    <li
      className={cn(
        "flex items-center p-3 bg-white border border-gray-200 rounded-3xl transition-colors",
        {
          "hover:bg-gray-50/50 cursor-pointer": isClickable,
          "cursor-default": !isClickable,
        }
      )}
      onClick={handleClick}
    >
      <div className="flex flex-col gap-6 flex-1">
        <div className="flex items-center gap-3">
          <div
            className={cn("rounded-xl p-3 flex items-center justify-center", {
              "bg-amber-50 text-amber-600":
                report.status === "EXTRACTING" || report.status === "SAVING",
              "bg-blue-50 text-blue-600": report.status === "VERIFYING",
              "bg-gray-50 text-gray-500": report.status === "COMPLETED",
              "bg-red-50 text-red-600": report.status === "CANCELED",
            })}
          >
            {report.status === "EXTRACTING" || report.status === "SAVING" ? (
              <Loader2 className="h-6 w-6 animate-spin" strokeWidth={2} />
            ) : report.status === "VERIFYING" ? (
              <HugeiconsIcon
                icon={FileValidationFreeIcons}
                strokeWidth={2}
                className="h-6 w-6"
              />
            ) : report.status === "COMPLETED" ? (
              <HugeiconsIcon
                icon={File02FreeIcons}
                strokeWidth={2}
                className="h-6 w-6"
              />
            ) : (
              <HugeiconsIcon
                icon={Alert02FreeIcons}
                strokeWidth={2}
                className="h-6 w-6"
              />
            )}
          </div>
          <div className="flex flex-col w-full b">
            <span className="font-medium">{report.report_name}</span>
            <div className="text-gray-500 text-sm flex gap-1 items-center">
              {dateLabel} <div className="w-1 h-1 rounded-full bg-gray-300" />{" "}
              {timeLabel}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {report.status === "EXTRACTING" ? (
            <div className="bg-amber-100 text-amber-600 border border-amber-200 px-1 h-7 flex items-center rounded-lg">
              <span className="px-1 font-medium">Extracting</span>
            </div>
          ) : report.status === "VERIFYING" ? (
            <div className="bg-blue-50 text-blue-600 border border-blue-100 px-1 h-7  flex items-center rounded-lg">
              <span className="px-1 font-medium">Verify extracted data</span>
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </div>
          ) : report.status === "SAVING" ? (
            <div className="bg-amber-100 text-amber-600 border border-amber-200 px-1 h-7  flex items-center rounded-lg">
              <span className="px-1 font-medium">Saving</span>
            </div>
          ) : report.status === "COMPLETED" &&
            typeof report.biomarker_count === "number" &&
            report.biomarker_count > 0 ? (
            <div className="flex gap-1 items-center ">
              <div className="bg-gray-100 text-gray-500 border border-gray-200 px-1 h-7  flex items-center rounded-lg">
                <span className="px-1 font-medium">
                  {report.biomarker_count} biomarkers
                </span>
              </div>
              <div className="px-1 h-7  flex items-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <span className="px-1 font-medium">Completed</span>
              </div>
            </div>
          ) : report.status === "CANCELED" ? (
            <div className="bg-red-50 text-red-600 border-red-100 border px-1 h-7  flex items-center rounded-lg">
              <span className="px-1 font-medium">Canceled</span>
            </div>
          ) : report.status === "UNMATCHED" ? (
            <div className="bg-red-50 text-red-600 border-red-100 border px-1 h-7  flex items-center rounded-lg">
              <span className="px-1 font-medium">Verify entries</span>
            </div>
          ) : null}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
    </li>
  );
}
