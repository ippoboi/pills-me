"use client";

import { Navigation } from "@/components/ui/navigation";
import { SupplementTools } from "@/components/ui/supplement-tools";
import { usePathname } from "next/navigation";
import { AddSupplementMobileButton } from "./add-supplement-mobile";

export function ConditionalNavigation() {
  const pathname = usePathname();
  const isSupplementDetail = /^\/supplements\/[^/]+$/.test(pathname);

  return isSupplementDetail ? (
    <SupplementTools />
  ) : (
    <div className="z-50 fixed bottom-12 md:bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-8">
      <Navigation />
      <AddSupplementMobileButton />
    </div>
  );
}
