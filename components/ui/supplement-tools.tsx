"use client";

import {
  Delete02FreeIcons,
  Edit04FreeIcons,
  PackageAddFreeIcons,
  RepeatFreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function SupplementTools() {
  return (
    <div className="z-50 shadow-2xl shadow-gray-200 fixed bottom-20 left-1/2 -translate-x-1/2 rounded-[22px] border border-gray-200 bg-gray-100 p-1">
      <div className="flex items-center gap-1">
        <div className="cursor-pointer gap-1 transition-all bg-white hover:bg-red-50 h-12 w-12 rounded-2xl text-gray-600 hover:text-red-600 flex items-center justify-center">
          <HugeiconsIcon
            strokeWidth={2}
            icon={Delete02FreeIcons}
            className="w-5 h-5"
          />
        </div>
        <div className="cursor-pointer gap-1 transition-all bg-white hover:bg-white/80 px-3 h-12 text-gray-600 rounded-2xl flex items-center">
          <HugeiconsIcon
            strokeWidth={2}
            icon={Edit04FreeIcons}
            className="w-5 h-5"
          />
          <span className="px-1 text-lg">Edit</span>
        </div>
        <div className="cursor-pointer gap-1 transition-all bg-white hover:bg-white/80 px-3 h-12 text-blue-600 rounded-2xl flex items-center ">
          <HugeiconsIcon
            strokeWidth={2}
            icon={PackageAddFreeIcons}
            className="w-5 h-5"
          />
          <span className="px-1 text-lg ">Refill</span>
        </div>
        <div className="cursor-pointer gap-1 transition-all bg-white hover:bg-white/80 px-3 h-12 text-blue-600 rounded-2xl flex items-center">
          <HugeiconsIcon
            strokeWidth={2}
            icon={RepeatFreeIcons}
            className="w-5 h-5"
          />
          <span className="px-1 text-lg ">New cycle</span>
        </div>
      </div>
    </div>
  );
}
