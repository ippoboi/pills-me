"use client";

import SupplementCreationForm from "@/components/supplement-creation-form";
import { Button } from "@/components/ui/button";
import { Add01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { useSupplementsList } from "@/lib/hooks/supplements";
import SupplementsListSection from "@/components/protected/supplements-list-section";

export default function SupplementsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data, isLoading, error } = useSupplementsList();

  return (
    <div>
      <div className="p-8">
        <div className="z-10 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-medium">Supplements</h1>
              <p className="text-lg text-gray-600">
                Manage all your supplements in one place
              </p>
            </div>
            <Button variant="default" onClick={() => setIsFormOpen(true)}>
              <HugeiconsIcon
                icon={Add01FreeIcons}
                strokeWidth={2}
                className="w-4 h-4"
              />
              Track new
            </Button>
          </div>

          <SupplementCreationForm
            open={isFormOpen}
            onClose={() => setIsFormOpen(false)}
          />

          {isLoading && <div className="text-gray-500">Loading...</div>}
          {error && (
            <div className="text-red-600">Failed to load supplements.</div>
          )}
          {data?.supplements && (
            <SupplementsListSection supplements={data.supplements} />
          )}
        </div>
      </div>
    </div>
  );
}
