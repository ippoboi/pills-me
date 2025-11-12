"use client";

import { useSupplementById } from "@/lib/hooks";
import React from "react";
import { BackButton } from "../ui/back-button";
import { StatusBadge } from "../ui/status-badge";
import { formatDate } from "date-fns";
import {
  formatTimeOfDayList,
  getAdherenceColorClass,
} from "@/lib/utils/supplements";
// Day buckets are provided by the API response
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  ArrowUpRight03FreeIcons,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Tooltip } from "../ui/tooltip";

export default function SupplementDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data, isLoading, error } = useSupplementById(id);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data found</div>;

  const supplement = data.supplement;
  const adherencePercentage =
    typeof supplement.adherence_progress?.percentage === "number"
      ? supplement.adherence_progress.percentage
      : 0;
  const safeAdherencePercentage = Number.isFinite(adherencePercentage)
    ? adherencePercentage
    : 0;
  const adherenceColorClass = getAdherenceColorClass(safeAdherencePercentage);

  console.log(data);

  const dayBuckets = data.day_buckets || [];

  return (
    <div className="flex flex-col items-center gap-4 min-h-screen p-12 bg-white">
      <div className="flex flex-col gap-8 max-w-4xl w-full">
        <div className="flex justify-start mb-4">
          <BackButton title="supplements" />
        </div>
        <div>
          <div className="flex justify-between items-center gap-4">
            <h1 className="text-3xl font-medium">{supplement.name}</h1>
            <StatusBadge status={supplement.status} showIcon={true} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium">Adherence</h2>
              <Badge
                label={`${safeAdherencePercentage.toFixed(0)} %`}
                colorClass={adherenceColorClass.textColor}
                backgroundClass={adherenceColorClass.backgroundColor}
              />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {dayBuckets.map((bucket, index: number) => {
                const label = bucket.isFuture
                  ? "Scheduled"
                  : bucket.isTaken
                  ? "Taken"
                  : "Missed";
                const barClass = bucket.isFuture
                  ? "bg-gray-100"
                  : bucket.isTaken
                  ? "bg-blue-600"
                  : "bg-gray-200";
                const labelClass = bucket.isFuture
                  ? "text-gray-300"
                  : bucket.isTaken
                  ? "text-blue-400"
                  : "text-gray-300";
                return (
                  <Tooltip
                    key={bucket.date + index}
                    content={
                      <div className="min-w-[180px]">
                        <div className="text-white text-base">
                          {formatDate(bucket.date, "MMMM d, yyyy")}
                        </div>
                        <div className={`mt-1 ${labelClass}`}>{label}</div>
                      </div>
                    }
                  >
                    <div className={`w-8 h-3 rounded ${barClass}`} />
                  </Tooltip>
                );
              })}
            </div>
          </div>
          <div className="col-span-1 space-y-6">
            <h2 className="text-xl font-medium">Details</h2>
            <div className="flex flex-col gap-8">
              {supplement.end_date ? (
                <div className="text-gray-700 h-12 flex flex-col justify-between self-start whitespace-nowrap">
                  <span className="text-gray-500 uppercase text-sm">
                    Period
                  </span>
                  <span className="flex items-center gap-1">
                    {formatDate(supplement.start_date, "MMM d, yyyy")}
                    <HugeiconsIcon
                      icon={ArrowRight02FreeIcons}
                      className="w-4 h-4 text-gray-500"
                    />
                    {formatDate(supplement.end_date, "MMM d, yyyy")}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 uppercase text-sm">
                    Started
                  </span>
                  <span>
                    {formatDate(supplement.start_date, "MMM d, yyyy")}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 uppercase text-sm">
                  Take time
                </span>
                <span>{formatTimeOfDayList(supplement.schedules)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 uppercase text-sm">
                  Capsules per take
                </span>
                <span>{supplement.capsules_per_take}</span>
              </div>
              {supplement.end_date ||
              !supplement.inventory_total ||
              !supplement.low_inventory_threshold ? null : (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 uppercase text-sm">
                    Inventory
                  </span>
                  <span
                    className={
                      supplement.inventory_total <
                      supplement.low_inventory_threshold
                        ? "text-red-500"
                        : "text-gray-900"
                    }
                  >
                    {supplement.inventory_total}
                  </span>
                </div>
              )}
              {supplement.recommendation ? (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 uppercase text-sm">
                    Recommendation
                  </span>
                  <span>{supplement.recommendation}</span>
                </div>
              ) : null}
              {supplement.source_name ? (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 uppercase text-sm">
                    Source
                  </span>
                  {supplement.source_url ? (
                    <Link
                      href={supplement.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <span>{supplement.source_name}</span>
                      <HugeiconsIcon
                        icon={ArrowUpRight03FreeIcons}
                        width={16}
                        height={16}
                        strokeWidth={2}
                        className="text-blue-600"
                      />
                    </Link>
                  ) : (
                    <span className="text-sm">{supplement.source_name}</span>
                  )}
                </div>
              ) : null}
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 uppercase text-sm">Reason</span>
                <span>{supplement.reason}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
