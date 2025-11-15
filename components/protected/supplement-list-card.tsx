"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import type { SupplementsListItem } from "@/lib/types";
import {
  ArrowRight01FreeIcons,
  ArrowUpRight03FreeIcons,
  Medicine02FreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateShort } from "@/lib/utils";

type SupplementListItem = SupplementsListItem["items"][0];

interface SupplementListCardProps {
  item: SupplementListItem;
}

export default function SupplementListCard({ item }: SupplementListCardProps) {
  const router = useRouter();
  const hasEndDate = item.end_date !== null;
  const startDate = formatDateShort(item.start_date);
  const endDate = item.end_date ? formatDateShort(item.end_date) : null;

  const navigateToSupplement = () => {
    router.push(`/supplements/${item.id}`);
  };

  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a, button")) {
      return;
    }
    navigateToSupplement();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "Spacebar"
    ) {
      event.preventDefault();
      if (!(event.target as HTMLElement).closest("a, button")) {
        navigateToSupplement();
      }
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="bg-white flex items-center gap-3 p-2 md:p-3 rounded-3xl hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <div className="bg-blue-50 p-3 rounded-2xl md:rounded-xl flex-shrink-0">
        <HugeiconsIcon
          icon={Medicine02FreeIcons}
          strokeWidth={2}
          className="w-6 h-6 text-blue-600"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-[200px_250px_auto_auto] items-center gap-6 w-full min-w-0">
        {/* Name */}
        <h3 className="font-medium text-gray-900 min-w-0 text-[15px] md:text-base">
          {item.name}
        </h3>

        {/* Period/Start Date */}
        <div className="hidden md:flex text-gray-700 h-12 flex-col justify-between self-start whitespace-nowrap">
          <p className="uppercase text-sm text-gray-500">
            {hasEndDate && endDate ? "Period" : "Started on"}
          </p>
          {hasEndDate && endDate ? (
            <span>
              {startDate} → {endDate}
            </span>
          ) : (
            <span>{startDate}</span>
          )}
        </div>

        {/* Source */}
        {item.source_name ? (
          <div className="h-12 hidden lg:flex flex-col justify-between text-gray-600 whitespace-nowrap">
            <p className="uppercase text-sm text-gray-500">Source</p>
            {item.source_url ? (
              <Link
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <span>{item.source_name}</span>
                <HugeiconsIcon
                  icon={ArrowUpRight03FreeIcons}
                  width={16}
                  height={16}
                  strokeWidth={2}
                  className="text-blue-600"
                />
              </Link>
            ) : (
              <span className="text-sm">{item.source_name}</span>
            )}
          </div>
        ) : (
          <div></div>
        )}

        {/* Right Arrow */}
        <div className="flex items-center pr-2 justify-end">
          <HugeiconsIcon icon={ArrowRight01FreeIcons} width={20} height={20} />
        </div>
      </div>
    </div>
  );
}
