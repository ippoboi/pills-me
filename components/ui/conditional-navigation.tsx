"use client";

import { Navigation } from "@/components/ui/navigation";
import { SupplementTools } from "@/components/ui/supplement-tools";
import { usePathname } from "next/navigation";

export function ConditionalNavigation() {
  const pathname = usePathname();
  const isSupplementDetail = /^\/protected\/supplements\/[^/]+$/.test(pathname);

  return isSupplementDetail ? <SupplementTools /> : <Navigation />;
}
