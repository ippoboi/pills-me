"use client";

import { usePathname } from "next/navigation";
import DotGrid from "./DotGrid";

export function ConditionalDotGrid() {
  const pathname = usePathname();
  const isSupplementDetail = /^\/protected\/supplements\/[^/]+$/.test(pathname);
  const isBiomarkers = /^\/profile\/biomarkers$/.test(pathname);

  return isSupplementDetail || isBiomarkers ? null : (
    <DotGrid fillViewport fixed zIndex={0} />
  );
}
