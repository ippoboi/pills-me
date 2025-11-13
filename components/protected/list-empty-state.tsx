"use client";

import { Button } from "@/components/ui/button";
import { Add01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";

interface ListEmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  showIllustration?: boolean;
}

export default function ListEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  showIllustration = true,
}: ListEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="flex flex-col items-center justify-center gap-8">
        {showIllustration && (
          <div className="space-y-1">
            <Image
              src="/empty-illustration-true.svg"
              alt="Logo"
              width={400}
              height={100}
              className="opacity-50"
            />
            <Image
              src="/empty-illustration-false.svg"
              alt="Logo"
              width={400}
              height={100}
            />
          </div>
        )}
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-xl font-medium">{title}</h2>
            <p className="text-gray-600">{description}</p>
          </div>
          <Button variant="default" onClick={onAction}>
            <HugeiconsIcon
              icon={Add01FreeIcons}
              strokeWidth={2}
              className="w-4 h-4"
            />
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
