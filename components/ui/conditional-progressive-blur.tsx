"use client";

import { usePathname } from "next/navigation";
import { ProgressiveBlur } from "./progressive-blur";

export function ConditionalProgressiveBlur() {
  const pathname = usePathname();
  const isSupplementDetail = /^\/supplements\/[^/]+$/.test(pathname);

  return isSupplementDetail ? null : (
    <>
      <ProgressiveBlur position="top" height="20%" className="fixed z-40" />
      <ProgressiveBlur position="bottom" height="20%" className="fixed z-40" />
    </>
  );
}
