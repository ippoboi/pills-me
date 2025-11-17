"use client";

import { useEffect, useState, useRef } from "react";

interface AuthLoadingScreenProps {
  isLoading: boolean;
  onComplete?: () => void;
}

export function AuthLoadingScreen({
  isLoading,
  onComplete,
}: AuthLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [shouldRender, setShouldRender] = useState(true);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let fadeStartTimer: NodeJS.Timeout;
    let fadeCompleteTimer: NodeJS.Timeout;

    if (!isLoading) {
      // Animate to 100% quickly
      setProgress(100);

      // Wait a moment, then start fade out
      fadeStartTimer = setTimeout(() => {
        setOpacity(0);

        // After fade completes, unmount and call onComplete
        fadeCompleteTimer = setTimeout(() => {
          setShouldRender(false);
          onComplete?.();
        }, 700); // Match the transition duration
      }, 200);

      return () => {
        clearTimeout(fadeStartTimer);
        clearTimeout(fadeCompleteTimer);
      };
    } else {
      // Reset and start animation
      setProgress(0);
      setOpacity(1);
      setShouldRender(true);
      startTimeRef.current = Date.now();

      const duration = 2000; // 2 seconds to reach ~90%
      const targetProgress = 90;

      const animate = () => {
        if (!startTimeRef.current) return;

        const elapsed = Date.now() - startTimeRef.current;
        const newProgress = Math.min(
          (elapsed / duration) * targetProgress,
          targetProgress
        );
        setProgress(newProgress);

        if (newProgress < targetProgress && isLoading) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isLoading, onComplete]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-100 transition-opacity duration-700 ease-out pointer-events-none"
      style={{ opacity }}
    >
      <div className="text-center">
        <div className="text-8xl md:text-9xl font-medium text-blue-600 tabular-nums transition-all duration-150 ease-out">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
