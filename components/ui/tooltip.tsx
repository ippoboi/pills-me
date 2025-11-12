import React from "react";

export function Tooltip({
  content,
  children,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative inline-block group ${className || ""}`}>
      {children}
      <div className="pointer-events-none absolute z-50 -bottom-2 left-1/2 translate-y-full -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div className="rounded-2xl bg-gray-900 text-white px-4 py-3 shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
          {content}
        </div>
      </div>
    </div>
  );
}
