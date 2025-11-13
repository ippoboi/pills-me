"use client";

import { Loader2 } from "lucide-react";

interface ListLoadingStateProps {
  message?: string;
}

export default function ListLoadingState({
  message = "Loading...",
}: ListLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-gray-500 mt-2">{message}</p>
    </div>
  );
}
