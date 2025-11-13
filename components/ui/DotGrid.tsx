"use client";

import React, { useEffect, useState, useRef } from "react";

interface DotGridProps {
  dotSize?: number;
  padding?: number;
  fill?: string;
  containerWidth?: number | string;
  containerHeight?: number | string;
  absolute?: boolean;
  fixed?: boolean;
  zIndex?: number;
  fillViewport?: boolean;
}

const DotGrid: React.FC<DotGridProps> = ({
  dotSize = 1,
  padding = 20,
  fill = "#e5e7eb",
  containerWidth = "100%",
  containerHeight = "100%",
  absolute = false,
  fixed = false,
  zIndex = -1000,
  fillViewport = false,
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (fillViewport || fixed) {
      const updateDimensions = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    } else if (absolute && svgRef.current) {
      // For absolute positioning, get the parent container dimensions
      const parent = svgRef.current.parentElement;
      if (parent) {
        const updateDimensions = () => {
          const rect = parent.getBoundingClientRect();
          setDimensions({
            width: rect.width,
            height: rect.height,
          });
        };

        updateDimensions();

        // Use ResizeObserver to watch for parent size changes
        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(parent);

        return () => resizeObserver.disconnect();
      }
    }
  }, [fillViewport, absolute, fixed]);

  // Calculate number of columns and rows based on container size
  const actualWidth =
    fillViewport || fixed
      ? dimensions.width
      : typeof containerWidth === "number"
      ? containerWidth
      : containerWidth === "100%" && dimensions.width > 0
      ? dimensions.width
      : 800;
  const actualHeight =
    fillViewport || fixed
      ? dimensions.height
      : typeof containerHeight === "number"
      ? containerHeight
      : containerHeight === "100%" && dimensions.height > 0
      ? dimensions.height
      : 600;

  const columns = Math.ceil(actualWidth / padding);
  const rows = Math.ceil(actualHeight / padding);

  const dots: React.ReactElement[] = [];

  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < rows; row++) {
      dots.push(
        <circle
          key={`${col}-${row}`}
          cx={padding / 2 + col * padding}
          cy={padding / 2 + row * padding}
          r={dotSize}
        />
      );
    }
  }

  const viewWidth = columns * padding;
  const viewHeight = rows * padding;

  const svgStyle: React.CSSProperties = {
    display: "block",
    ...(absolute && {
      position: "absolute",
      top: 0,
      left: 0,
      zIndex: zIndex,
      pointerEvents: "none",
    }),
    ...(fixed && {
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: zIndex,
      pointerEvents: "none",
    }),
    ...((fillViewport || fixed) && {
      width: "100vw",
      height: "100vh",
    }),
  };

  return (
    <svg
      ref={svgRef}
      width={fillViewport || fixed ? "100vw" : containerWidth}
      height={fillViewport || fixed ? "100vh" : containerHeight}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      version="1.1"
      style={svgStyle}
    >
      <g fill={fill}>{dots}</g>
    </svg>
  );
};

export default DotGrid;
