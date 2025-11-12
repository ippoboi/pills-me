"use client";

import { usePathname } from "next/navigation";
import DotGrid from "./DotGrid";

export function ConditionalDotGrid() {
  const pathname = usePathname();
  const isSupplementDetail = /^\/protected\/supplements\/[^/]+$/.test(pathname);

  return isSupplementDetail ? null : (
    <DotGrid fillViewport absolute zIndex={0} />
  );
}
