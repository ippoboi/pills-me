"use client";

import { useEffect, useState, useRef } from "react";

export default function AuthLoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [isVisible, setIsVisible] = useState(true);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasStartedFadeRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const progressDuration = 1200; // 1.2 seconds to reach 100%
    const fadeDuration = 500; // 0.5 seconds to fade out
    const targetProgress = 100;

    const animate = () => {
      if (!startTimeRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;

      // Always ensure we reach 100% progress
      if (elapsed < progressDuration) {
        // Still animating progress
        const newProgress = Math.min(
          (elapsed / progressDuration) * targetProgress,
          targetProgress
        );
        setProgress(newProgress);
        animationRef.current = requestAnimationFrame(animate);
      } else if (elapsed < progressDuration + fadeDuration) {
        // Progress is at 100%, now fade out
        setProgress(100);

        if (!hasStartedFadeRef.current) {
          hasStartedFadeRef.current = true;
        }

        const fadeElapsed = elapsed - progressDuration;
        const fadeProgress = Math.min(fadeElapsed / fadeDuration, 1);
        setOpacity(1 - fadeProgress);

        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setProgress(100);
        setOpacity(0);
        setIsVisible(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!isVisible && opacity === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-100 transition-opacity duration-300 ease-out"
      style={{ opacity }}
    >
      <div className="text-center">
        <div className="text-8xl md:text-9xl font-medium text-blue-600 tabular-nums transition-all duration-75 ease-out">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
