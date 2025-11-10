"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Medicine02FreeIcons } from "@hugeicons/core-free-icons";
import type { SupplementsListItem } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SupplementListCardProps {
  item: SupplementsListItem;
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function SupplementListCard({ item }: SupplementListCardProps) {
  const periodLabel = item.period_type === "PERIOD" ? "PERIOD" : "STARTED";
  const leftDate = formatDate(item.start_date);
  const rightDate =
    item.period_type === "PERIOD" && item.end_date
      ? formatDate(item.end_date)
      : null;

  const percentage = Math.max(0, Math.min(100, item.adherence.percentage || 0));

  return (
    <div className="bg-white flex items-center gap-4 p-4 rounded-3xl">
      <div className="bg-blue-50 p-3 rounded-xl">
        <HugeiconsIcon
          icon={Medicine02FreeIcons}
          strokeWidth={2}
          className="w-6 h-6 text-blue-600"
        />
      </div>
      <div className="grid grid-cols-[1fr_max-content_max-content_max-content_max-content] justify-items-start w-full items-center gap-4">
        {/* Left: Icon */}
        <h3 className="font-medium text-gray-900 truncate min-w-0">
          {item.name}
        </h3>

        {/* Middle: Title + Period */}
        <div className="min-w-[250px]">
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {periodLabel}
          </div>
          <div className="text-gray-700">
            {leftDate}
            {rightDate ? <span> → {rightDate}</span> : null}
          </div>
        </div>

        {/* Right: Day badge + progress */}
        <span className="px-1.5 bg-blue-600 justify-self-center text-white font-medium rounded-lg">
          Day {item.day_number}
        </span>

        <div className="flex items-center justify-center gap-3 min-w-[180px]">
          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-blue-600 font-medium">{percentage}%</span>
        </div>

        {/* Right side: Checkbox */}
        <div className="p-3 flex items-center col-span-1 justify-end">
          <ChevronRight className="w-6 h-6 text-gray-500" />
        </div>
      </div>
    </div>
  );
}
