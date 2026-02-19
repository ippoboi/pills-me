"use client";

import { Button } from "@/components/ui/button";
import { Add01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo } from "react";

interface SupplementsHeaderProps {
  onTrackNew: () => void;
}

const SupplementsHeader = memo(function SupplementsHeader({
  onTrackNew,
}: SupplementsHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 pt-6 md:p-8">
      <div className="max-w-4xl mx-auto flex justify-between items-center gap-4 mb-8">
        <div className="max-w-[250px] md:max-w-none">
          <h1 className="md:text-3xl text-2xl font-medium">Supplements</h1>
          <p className="md:text-lg text-gray-600">
            Manage all your supplements in one place
          </p>
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
  );
});

export default SupplementsHeader;
