/**
 * peakDetectionEngine.js - Detector-Agnostic CDS Digital Signal Processing Engine
 * 
 * STRICT ARCHITECTURAL BOUNDARY:
 * This engine NEVER imports chemistry entities or compound definitions.
 * It operates EXCLUSIVELY on digital signal time-series samples [{ time, intensity }].
 * 
 * Peak Lifecycle:
 * CANDIDATE -> VALIDATED -> INTEGRATED -> REPORTED
 */

export class PeakDetectionEngine {
  /**
   * Discovers and integrates chromatographic peaks from digital signal samples.
   * @param {Array<{time: number, intensity: number}>} samples - Digital time-series samples
   * @param {number} [noiseThreshold=0.003] - Minimum height threshold above baseline (AU)
   * @returns {Array<Object>} Array of reported peak objects
   */
  static detectPeaks(samples, noiseThreshold = 0.003) {
    if (!samples || samples.length < 5) return [];

    const candidates = [];
    const n = samples.length;

    // STEP 1: Candidate Detection — Find local maxima (apices) above noise threshold
    for (let i = 2; i < n - 2; i++) {
      const prev2 = samples[i - 2].intensity;
      const prev1 = samples[i - 1].intensity;
      const curr = samples[i].intensity;
      const next1 = samples[i + 1].intensity;
      const next2 = samples[i + 2].intensity;

      if (curr > noiseThreshold && curr >= prev1 && curr >= prev2 && curr >= next1 && curr >= next2) {
        candidates.push({
          apexIndex: i,
          tApex: samples[i].time,
          rawHeight: curr,
          status: "CANDIDATE"
        });
      }
    }

    if (candidates.length === 0) return [];

    const reportedPeaks = [];

    // STEP 2 & 3: Validation & Integration — Trace valley boundaries and compute area
    candidates.forEach((cand, idx) => {
      let leftIdx = cand.apexIndex;
      while (leftIdx > 0 && samples[leftIdx - 1].intensity <= samples[leftIdx].intensity && samples[leftIdx - 1].intensity > noiseThreshold * 0.1) {
        leftIdx--;
      }

      let rightIdx = cand.apexIndex;
      while (rightIdx < n - 1 && samples[rightIdx + 1].intensity <= samples[rightIdx].intensity && samples[rightIdx + 1].intensity > noiseThreshold * 0.1) {
        rightIdx++;
      }

      const tStart = samples[leftIdx].time;
      const tEnd = samples[rightIdx].time;
      const widthBase = Math.max(0.01, tEnd - tStart);
      const sigma = widthBase / 4;
      const widthHalf = 2.3548 * sigma;
      const baselineIntensity = (samples[leftIdx].intensity + samples[rightIdx].intensity) / 2;
      const netHeight = Math.max(0, cand.rawHeight - baselineIntensity);

      // Trapezoidal Area Integration
      let area = 0;
      for (let j = leftIdx; j < rightIdx; j++) {
        const dt = samples[j + 1].time - samples[j].time;
        const avgY = Math.max(0, ((samples[j].intensity + samples[j + 1].intensity) / 2) - baselineIntensity);
        area += avgY * dt;
      }

      // STEP 4: Classification of Peak Overlap
      let classification = "BASELINE_SEPARATED";
      if (idx > 0) {
        const prevPeak = reportedPeaks[idx - 1];
        const gap = cand.tApex - prevPeak.tR;
        const avgWidth = (widthBase + prevPeak.widthBase) / 2;
        if (gap < avgWidth * 0.5) {
          classification = "SHOULDER_MERGED";
          prevPeak.classification = "SHOULDER_MERGED";
        } else if (gap < avgWidth * 0.75) {
          classification = "PARTIALLY_RESOLVED";
          if (prevPeak.classification === "BASELINE_SEPARATED") {
            prevPeak.classification = "PARTIALLY_RESOLVED";
          }
        }
      }

      // Final Lifecycle State: REPORTED
      reportedPeaks.push({
        id: `peak_${idx + 1}`,
        status: "REPORTED",
        tR: cand.tApex,
        height: netHeight,
        area: area,
        widthBase: widthBase,
        widthHalf: widthHalf,
        widthFivePercent: 4.30 * sigma,
        sigma: sigma,
        tStart: tStart,
        tEnd: tEnd,
        classification: classification,
        compound: "Unidentified Peak" // Identification populated downstream
      });
    });

    return reportedPeaks;
  }
}
