import { Peak } from '../models/Peak.js';

/**
 * peakDetectionEngine.js - CDS Signal Peak Detection & Integration Engine
 * Discovers peaks from the continuous detector signal time-series S(t).
 * Performs apex detection, valley boundary determination, trapezoidal integration,
 * and compound identification / co-elution classification.
 */
export class PeakDetectionEngine {
  /**
   * Detects chromatographic peaks from continuous signal time series.
   * @param {Array<{x: number, y: number}>} points - Time-series points [{x: timeMin, y: signalAU}]
   * @param {Array<{compound: Object, expectedTR: number, sigma: number}>} [expectedAnalytes=[]] - Expected retention windows
   * @param {number} [noiseThreshold=0.003] - Minimum peak height cutoff above baseline
   * @returns {Array<Peak>} Array of detected Peak models
   */
  static detectPeaks(points, expectedAnalytes = [], noiseThreshold = 0.003) {
    if (!points || points.length < 5) return [];

    const detectedPeaks = [];
    const n = points.length;

    // Step 1: Find local maxima (apices) above noise threshold
    for (let i = 2; i < n - 2; i++) {
      const prev2 = points[i - 2].y;
      const prev1 = points[i - 1].y;
      const curr = points[i].y;
      const next1 = points[i + 1].y;
      const next2 = points[i + 2].y;

      // Local maximum check
      if (curr > noiseThreshold && curr >= prev1 && curr >= prev2 && curr >= next1 && curr >= next2) {
        // Trace peak start (left valley)
        let leftIdx = i;
        while (leftIdx > 0 && points[leftIdx - 1].y <= points[leftIdx].y && points[leftIdx - 1].y > noiseThreshold * 0.1) {
          leftIdx--;
        }

        // Trace peak end (right valley)
        let rightIdx = i;
        while (rightIdx < n - 1 && points[rightIdx + 1].y <= points[rightIdx].y && points[rightIdx + 1].y > noiseThreshold * 0.1) {
          rightIdx++;
        }

        const tApex = points[i].x;
        const height = points[i].y;
        const tStart = points[leftIdx].x;
        const tEnd = points[rightIdx].x;
        const widthBase = Math.max(0.01, tEnd - tStart);
        const sigma = widthBase / 4;

        // Trapezoidal integration for peak area
        let area = 0;
        for (let j = leftIdx; j < rightIdx; j++) {
          const dt = points[j + 1].x - points[j].x;
          const avgY = (points[j].y + points[j + 1].y) / 2;
          area += avgY * dt;
        }

        // Identify compound match from expected analyte retention windows
        const matchingAnalytes = expectedAnalytes.filter(a => Math.abs(a.expectedTR - tApex) <= Math.max(0.15, 2.5 * a.sigma));

        let compoundName = "Unidentified Peak";
        if (matchingAnalytes.length === 1) {
          compoundName = matchingAnalytes[0].compound.name;
        } else if (matchingAnalytes.length > 1) {
          compoundName = matchingAnalytes.map(a => a.compound.name).join(" + ") + " (Co-elution)";
        }

        detectedPeaks.push(new Peak({
          compound: compoundName,
          tR: tApex,
          sigma,
          height,
          area,
          widthBase,
          widthHalf: 2.3548 * sigma,
          widthFivePercent: 4.30 * sigma
        }));

        // Move loop index past this peak's right valley to avoid duplicate detection
        i = rightIdx;
      }
    }

    return detectedPeaks;
  }
}
