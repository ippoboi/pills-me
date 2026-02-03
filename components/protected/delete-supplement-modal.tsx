"use client";

import { useState, useEffect } from "react";
import { BackdropPortal } from "@/components/ui/backdrop-portal";
import { Button } from "@/components/ui/button";
import { useSoftDeleteSupplement } from "@/lib/hooks";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02FreeIcons } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Loader2 } from "lucide-react";
import useMeasure from "react-use-measure";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteSupplementModalProps {
  open: boolean;
  onClose: () => void;
  supplementId: string;
  supplementName: string;
}

export default function DeleteSupplementModal({
  open,
  onClose,
  supplementId,
  supplementName,
}: DeleteSupplementModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [ref, bounds] = useMeasure();
  const router = useRouter();

  // TanStack Query mutation
  const deleteSupplementMutation = useSoftDeleteSupplement();

  const REQUIRED_CONFIRMATION_TEXT = `Yes, I want to delete ${supplementName}`;

  const isConfirmationValid =
    confirmation.trim() === REQUIRED_CONFIRMATION_TEXT;

  const handleSubmit = async () => {
    if (!isConfirmationValid) {
      return;
    }

    try {
      await deleteSupplementMutation.mutateAsync(supplementId);
      // Show success toast
      toast.success(`"${supplementName}" has been deleted successfully`);
      // On success, close modal and navigate back to previous page
      onClose();
      router.back();
    } catch (error) {
      // Error is handled by the mutation hook
      console.error("Failed to delete supplement:", error);
      toast.error("Failed to delete supplement. Please try again.");
    }
  };

  // Handle mount/unmount and animations
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setConfirmation("");
      // Trigger animation after mount
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      // Start exit animation
      setIsAnimating(false);
      // Delay unmount to allow exit animation to complete
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteSupplementMutation.isPending) {
        onClose();
      }
    };
    if (open) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, deleteSupplementMutation.isPending]);

  if (!shouldRender) return null;

  return (
    <BackdropPortal show={shouldRender} onClose={onClose}>
      {/* Dialog */}
      <MotionConfig transition={{ duration: 0.5, type: "spring", bounce: 0 }}>
        <motion.div
          animate={{ height: bounds.height }}
          className={`relative w-full md:max-w-lg bg-white rounded-2xl overflow-hidden shadow-xl transition-[opacity,transform] duration-300 ease-out ${
            isAnimating
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div ref={ref}>
            {/* Header */}
            <motion.div
              layout
              className="flex items-center w-full min-w-80 justify-between p-5 py-4 bg-gray-50 border-b border-b-gray-200"
            >
              <h2 className="font-medium">Delete supplement</h2>
            </motion.div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key="delete-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-10 flex flex-col items-center justify-center"
              >
                {/* Warning Icon */}
                <div className="flex items-center justify-center p-5 rounded-3xl bg-red-50 w-fit">
                  <HugeiconsIcon
                    icon={Alert02FreeIcons}
                    className="w-12 h-12 text-red-600"
                  />
                </div>

                {/* Warning Message */}
                <div className="space-y-2 text-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    You are going to delete &quot;{supplementName}&quot;
                  </h3>
                  <p className="text-gray-600">
                    <span className="text-red-600">All data</span> related to
                    this supplement like tracking history and adherence records{" "}
                    <span className="text-red-600">will be lost</span>. This
                    action cannot be undone. Are you sure you want to proceed?
                  </p>
                </div>

                {/* Confirmation Input */}
                <div className="space-y-2 w-full">
                  <label className="block text-gray-700">
                    To confirm the deletion, type:{" "}
                    <span className="text-red-600 font-medium">
                      &quot;{REQUIRED_CONFIRMATION_TEXT}&quot;
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Type the verification"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      toast.error(
                        "Pasting is not allowed. Please type the confirmation text."
                      );
                    }}
                    onCopy={(e) => e.preventDefault()}
                    disabled={deleteSupplementMutation.isPending}
                    className={`w-full px-3 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      confirmation &&
                      confirmation.trim() !== REQUIRED_CONFIRMATION_TEXT
                        ? "border-red-300"
                        : "border-gray-100"
                    }`}
                  />
                  {confirmation &&
                    confirmation.trim() !== REQUIRED_CONFIRMATION_TEXT && (
                      <p className="text-red-600 text-sm">
                        Please type the exact confirmation text
                      </p>
                    )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <motion.div
              layout
              className="flex items-center justify-between p-3 gap-2 bg-gray-50 border-t border-t-gray-200"
            >
              <Button
                variant="outline"
                size="default-no-icon"
                className="w-full"
                onClick={onClose}
                disabled={deleteSupplementMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="default-no-icon"
                className="w-full"
                disabled={
                  deleteSupplementMutation.isPending || !isConfirmationValid
                }
                onClick={handleSubmit}
              >
                {deleteSupplementMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </MotionConfig>
    </BackdropPortal>
  );
}
