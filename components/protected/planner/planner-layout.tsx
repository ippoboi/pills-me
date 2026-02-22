"use client";

import type { ReactNode } from "react";

interface PlannerLayoutProps {
  children: ReactNode;
}

/**
 * Responsive container for planner content
 * Provides consistent spacing between child components
 */
export function PlannerLayout({ children }: PlannerLayoutProps) {
  return <div className="flex flex-col gap-6">{children}</div>;
}
