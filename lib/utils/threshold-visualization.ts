import type { Thresholds, ThresholdBand } from "@/lib/types/biomarkers";

export interface ThresholdSegment {
  status: "optimal" | "borderline" | "out_of_range";
  width: number; // Tailwind width class number (e.g., 8, 16, 4)
  bgColor: string;
  borderColor: string;
  bandIndex: number; // Index of the band this segment represents
}

export interface ThresholdVisualizationConfig {
  segments: ThresholdSegment[];
  dotPosition: number | null; // Percentage (0-100) or null if no value
  isBidirectional: boolean;
}

/**
 * Determines if thresholds are bidirectional (out_of_range on both ends)
 */
function isBidirectional(thresholds: Thresholds): boolean {
  const bands = thresholds.bands;
  if (bands.length < 2) return false;

  const firstBand = bands[0];
  const lastBand = bands[bands.length - 1];

  // Bidirectional if first and last bands are out_of_range
  return (
    firstBand.status === "out_of_range" && lastBand.status === "out_of_range"
  );
}

/**
 * Gets the status color configuration
 */
function getStatusColors(status: "optimal" | "borderline" | "out_of_range"): {
  bgColor: string;
  borderColor: string;
} {
  switch (status) {
    case "optimal":
      return {
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-500",
      };
    case "borderline":
      return {
        bgColor: "bg-amber-50",
        borderColor: "border-amber-500",
      };
    case "out_of_range":
      return {
        bgColor: "bg-fuchsia-50",
        borderColor: "border-fuchsia-500",
      };
  }
}

/**
 * Finds which band a value falls into
 */
function findBandForValue(
  value: number,
  bands: ThresholdBand[]
): { band: ThresholdBand; index: number } | null {
  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    const min = band.min ?? Number.NEGATIVE_INFINITY;
    const max = band.max ?? Number.POSITIVE_INFINITY;

    // Check if value falls within this band
    if (band.min === null && band.max === null) {
      return { band, index: i };
    } else if (band.min === null) {
      // Open-ended on the left: value < max
      if (value < max) {
        return { band, index: i };
      }
    } else if (band.max === null) {
      // Open-ended on the right: value >= min
      if (value >= min) {
        return { band, index: i };
      }
    } else {
      // Both bounds defined: min <= value < max
      if (value >= min && value < max) {
        return { band, index: i };
      }
    }
  }

  return null;
}

/**
 * Calculates the position of a value within a band
 * Returns a value between 0 and 1 representing position within the segment
 */
function calculatePositionInBand(value: number, band: ThresholdBand): number {
  // If band has both bounds, calculate linear position
  if (band.min !== null && band.max !== null) {
    const range = band.max - band.min;
    if (range === 0) return 0.5; // Edge case: zero range
    return Math.max(0, Math.min(1, (value - band.min) / range));
  }

  // For unbounded segments, use proportional estimate based on distance from boundary
  if (band.min === null && band.max !== null) {
    // Unbounded on left: use distance from max boundary
    // Estimate: if value is far below max, position near 0; if close to max, position near 1
    const distanceFromMax = band.max - value;
    // Use a reasonable estimate: if value is at 50% of max, position at 0.5
    // Clamp to prevent extreme positions
    const estimatedPosition = Math.max(
      0,
      Math.min(1, 1 - distanceFromMax / (band.max * 1.5))
    );
    return estimatedPosition;
  }

  if (band.max === null && band.min !== null) {
    // Unbounded on right: use distance from min boundary
    const distanceFromMin = value - band.min;
    // Estimate: if value is at min + 50% of min, position at 0.5
    const estimatedPosition = Math.max(
      0,
      Math.min(1, distanceFromMin / (band.min * 1.5 || 1))
    );
    return estimatedPosition;
  }

  // Both null (shouldn't happen, but default to center)
  return 0.5;
}

/**
 * Calculates threshold visualization configuration
 */
export function calculateThresholdVisualization(
  thresholds: Thresholds,
  currentStatus: "optimal" | "borderline" | "out_of_range" | null,
  latestValue: number | null,
  isMobile = false
): ThresholdVisualizationConfig {
  const bands = thresholds.bands;
  const bidirectional = isBidirectional(thresholds);

  // Base widths (desktop)
  const currentStatusWidth = 16;
  const otherStatusWidthOneDirection = 8;
  const otherStatusWidthBidirectional = 4;

  // Mobile: divide by 2
  const currentWidth = isMobile ? currentStatusWidth / 2 : currentStatusWidth;
  const otherWidth = isMobile
    ? (bidirectional
        ? otherStatusWidthBidirectional
        : otherStatusWidthOneDirection) / 2
    : bidirectional
    ? otherStatusWidthBidirectional
    : otherStatusWidthOneDirection;

  // Build segments by iterating through bands in order
  // Each band becomes a segment, but we need to handle bidirectional out_of_range specially
  const segments: ThresholdSegment[] = [];

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    const isCurrentStatus = currentStatus === band.status;

    // For bidirectional out_of_range, check if this is the first or last occurrence
    let segmentWidth: number;
    if (bidirectional && band.status === "out_of_range") {
      // Determine if this specific out_of_range segment is the current status
      // For bidirectional, we need to check if the value falls in this specific band
      let isThisBandCurrent = false;
      if (latestValue !== null && currentStatus === "out_of_range") {
        const valueBandResult = findBandForValue(latestValue, bands);
        if (valueBandResult && valueBandResult.index === i) {
          isThisBandCurrent = true;
        }
      }

      segmentWidth = isThisBandCurrent ? currentWidth : otherWidth;
    } else {
      // Regular segment
      segmentWidth = isCurrentStatus ? currentWidth : otherWidth;
    }

    segments.push({
      status: band.status,
      width: segmentWidth,
      ...getStatusColors(band.status),
      bandIndex: i,
    });
  }

  // Calculate dot position
  let dotPosition: number | null = null;

  if (latestValue !== null && typeof latestValue === "number") {
    const valueBandResult = findBandForValue(latestValue, bands);
    if (valueBandResult) {
      const { band: valueBand, index: bandIndex } = valueBandResult;

      // Find the segment that corresponds to this band
      const segmentIndex = segments.findIndex(
        (seg) => seg.bandIndex === bandIndex
      );

      if (segmentIndex !== -1) {
        // Calculate position within this segment
        const positionInBand = calculatePositionInBand(latestValue, valueBand);
        const segment = segments[segmentIndex];

        // Calculate total width for percentage calculation
        const totalWidth = segments.reduce((sum, s) => sum + s.width, 0);

        // Calculate accumulated width before this segment
        const accumulatedWidth = segments
          .slice(0, segmentIndex)
          .reduce((sum, s) => sum + s.width, 0);

        // Calculate position as percentage
        const segmentStartPercent = (accumulatedWidth / totalWidth) * 100;
        const segmentWidthPercent = (segment.width / totalWidth) * 100;
        const positionInSegmentPercent =
          segmentStartPercent + positionInBand * segmentWidthPercent;

        dotPosition = Math.max(0, Math.min(100, positionInSegmentPercent));
      }
    }
  }

  return {
    segments,
    dotPosition,
    isBidirectional: bidirectional,
  };
}
