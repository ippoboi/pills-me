"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface BackdropPortalProps {
  children: ReactNode;
  show: boolean;
  onClose?: () => void;
  className?: string;
}

export function BackdropPortal({
  children,
  show,
  onClose,
  className = "",
}: BackdropPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (show) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  if (!mounted || !show) {
    return null;
  }

  const backdropContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${className}`}
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative z-10 max-h-[90vh] max-w-[90vw] overflow-auto">
        {children}
      </div>
    </div>
  );

  // Use portal to render at document.body level
  return createPortal(backdropContent, document.body);
}
