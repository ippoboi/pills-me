"use client";

import { usePathname } from "next/navigation";
import { ProgressiveBlur } from "./progressive-blur";

export function ConditionalProgressiveBlur() {
  const pathname = usePathname();
  const isSupplementDetail = /^\/supplements\/[^/]+$/.test(pathname);
  const isProfilePage = /^\/profile$/.test(pathname);
  const isBiomarkers = /^\/profile\/biomarkers$/.test(pathname);

  return isSupplementDetail || isBiomarkers ? null : (
    <>
      <ProgressiveBlur
        position="top"
        height="16%"
        className={`${
          isProfilePage ? "hidden md:block md:!fixed" : "fixed"
        } z-40`}
      />
      <ProgressiveBlur position="bottom" height="20%" className="fixed z-40" />
    </>
  );
}
