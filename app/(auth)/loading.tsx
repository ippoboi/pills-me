"use client";

import { useEffect, useState, useRef } from "react";

export default function AuthLoading() {
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const duration = 1200; // 1.2 seconds to reach 100%
    const targetProgress = 100;

    const animate = () => {
      if (!startTimeRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(
        (elapsed / duration) * targetProgress,
        targetProgress
      );
      setProgress(newProgress);

      if (newProgress < targetProgress) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="text-8xl md:text-9xl font-medium text-blue-600 tabular-nums transition-all duration-75 ease-out">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
