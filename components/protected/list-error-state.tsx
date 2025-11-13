"use client";

import { Button } from "@/components/ui/button";
import { RefreshFreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface ListErrorStateProps {
  error: Error;
  onRefetch: () => void;
  message?: string;
}

export default function ListErrorState({
  error,
  onRefetch,
  message = "Error loading data",
}: ListErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center space-y-4">
        <p className="text-red-600">
          {message}: {error?.message || "Unknown error"}
        </p>
        <Button variant="default" onClick={onRefetch}>
          <HugeiconsIcon
            icon={RefreshFreeIcons}
            strokeWidth={2}
            className="w-4 h-4"
          />
          Refresh
        </Button>
      </div>
    </div>
  );
}
