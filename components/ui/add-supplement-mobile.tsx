"use client";

import { Add01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import SupplementCreationForm from "@/components/supplement-creation-form";

export function AddSupplementMobileButton() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <div className="block md:hidden shadow-2xl shadow-gray-200 rounded-[22px] border border-gray-200 bg-gray-100 p-1">
        <button
          onClick={() => setIsFormOpen(true)}
          className="rounded-[16px] p-3 transition-colors flex items-center justify-center bg-blue-600 text-white"
        >
          <HugeiconsIcon icon={Add01FreeIcons} className="h-8 w-8" />
        </button>
      </div>

      <SupplementCreationForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </>
  );
}
