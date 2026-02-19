"use client";

import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/utils";
import {
  Add01FreeIcons,
  ArrowLeft01FreeIcons,
  ArrowRight01FreeIcons,
  Calendar04FreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo } from "react";

interface TodosHeaderProps {
  date: string;
  onTrackNew: () => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  isToday: boolean;
}

const TodosHeader = memo(function TodosHeader({
  date,
  onTrackNew,
  onPreviousDay,
  onNextDay,
  isToday,
}: TodosHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 pt-6 md:p-8">
      <div className="max-w-4xl mx-auto flex justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="md:text-3xl text-2xl font-medium">To Do&apos;s</h1>
          <p className="md:text-lg text-gray-600">
            Mark your doses for{" "}
            <span className="text-gray-900">
              {formatDateShort(date) || date}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="tertiary"
              size="width-fit-default"
              onClick={onPreviousDay}
            >
              <HugeiconsIcon
                icon={ArrowLeft01FreeIcons}
                strokeWidth={2}
                className="w-4 h-4"
              />
            </Button>
            <div className="flex items-center gap-1 h-10 px-3 rounded-xl bg-gray-200 text-gray-600 font-medium">
              <HugeiconsIcon
                icon={Calendar04FreeIcons}
                strokeWidth={2}
                className="w-4 h-4"
              />
              <span className="px-1">{formatDateShort(date)}</span>
            </div>
            <Button
              variant="tertiary"
              size="width-fit-default"
              onClick={onNextDay}
              disabled={isToday}
            >
              <HugeiconsIcon
                icon={ArrowRight01FreeIcons}
                strokeWidth={2}
                className="w-4 h-4"
              />
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="tertiary"
              size="width-fit-default"
              onClick={onPreviousDay}
            >
              <HugeiconsIcon
                icon={ArrowLeft01FreeIcons}
                strokeWidth={2}
                className="w-4 h-4"
              />
            </Button>
            <Button
              variant="tertiary"
              size="width-fit-default"
              onClick={onNextDay}
              disabled={isToday}
            >
              <HugeiconsIcon
                icon={ArrowRight01FreeIcons}
                strokeWidth={2}
                className="w-4 h-4"
              />
            </Button>
          </div>

          <Button
            variant="default"
            className="hidden md:flex"
            onClick={onTrackNew}
            icon={Add01FreeIcons}
          >
            Track new
          </Button>
        </div>
      </div>
    </div>
  );
});

export default TodosHeader;
