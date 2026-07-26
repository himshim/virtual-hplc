/**
 * peakDetectionEngine.js - Detector-Agnostic CDS Digital Signal Processing Engine
 *
 * STRICT ARCHITECTURAL BOUNDARY:
 * This engine NEVER imports chemistry entities or compound definitions.
 * It operates EXCLUSIVELY on digital signal time-series samples [{ time, intensity }] or [{ x, y }].
 *
 * Peak Lifecycle:
 * CANDIDATE -> VALIDATED -> INTEGRATED -> REPORTED
 *
 * v1.2:
 * - Adaptive peak detection threshold: max(3 * baselineNoiseRMS, minDetectablePeak)
 * - Inter-apex minimum search replaces greedy valley walk
 * - Safe property extraction (getTime/getIntensity)
 */

function getTime(p) {
  if (!p) return 0;
  return p.time !== undefined ? p.time : (p.x !== undefined ? p.x : 0);
}

function getIntensity(p) {
  if (!p) return 0;
  return p.intensity !== undefined ? p.intensity : (p.y !== undefined ? p.y : 0);
}

export class PeakDetectionEngine {
  /**
   * Estimates baseline noise RMS from digital signal sample time-series.
   * Computes standard deviation of lowest 30% intensity samples.
   */
  static estimateBaselineNoiseRMS(samples) {
    if (!samples || samples.length < 10) return 0.0003;
    const sorted = samples.map(s => getIntensity(s)).sort((a, b) => a - b);
    const baselineSubset = sorted.slice(0, Math.max(5, Math.floor(sorted.length * 0.3)));
    const mean = baselineSubset.reduce((sum, v) => sum + v, 0) / baselineSubset.length;
    const variance = baselineSubset.reduce((sum, v) => sum + (v - mean) ** 2, 0) / baselineSubset.length;
    return Math.sqrt(variance);
  }

  /**
   * Discovers and integrates chromatographic peaks from digital signal samples.
   * @param {Array<{time: number, intensity: number}>} samples - Digital time-series samples
   * @param {number} [userThreshold=null] - Optional user override height threshold (AU)
   * @returns {Array<Object>} Array of reported peak objects
   */
  static detectPeaks(samples, userThreshold = null) {
    if (!samples || samples.length < 5) return [];

    // Adaptive threshold: max(3 * noiseRMS, instrument.minimumDetectablePeak)
    const noiseRMS = PeakDetectionEngine.estimateBaselineNoiseRMS(samples);
    const minDetectablePeak = 0.001; // 1 mAU
    const effectiveThreshold = (userThreshold !== null && userThreshold > 0 && userThreshold !== 0.025)
      ? Math.max(3 * noiseRMS, userThreshold)
      : Math.max(3 * noiseRMS, minDetectablePeak);

    const n = samples.length;

    // ─── STEP 1: Candidate Detection — local maxima above threshold ───────────
    const rawCandidates = [];

    for (let i = 2; i < n - 2; i++) {
      const prev2 = getIntensity(samples[i - 2]);
      const prev1 = getIntensity(samples[i - 1]);
      const curr  = getIntensity(samples[i]);
      const next1 = getIntensity(samples[i + 1]);
      const next2 = getIntensity(samples[i + 2]);

      if (
        curr > effectiveThreshold &&
        curr >= prev1 && curr >= prev2 &&
        curr >= next1 && curr >= next2
      ) {
        rawCandidates.push({ apexIndex: i, tApex: getTime(samples[i]), rawHeight: curr });
      }
    }

    if (rawCandidates.length === 0) return [];

    // ─── STEP 1b: Merge candidates that are indistinguishably close ──────────
    const candidates = [];
    for (let i = 0; i < rawCandidates.length; i++) {
      if (i === 0) { candidates.push(rawCandidates[i]); continue; }
      const prev = candidates[candidates.length - 1];
      const curr = rawCandidates[i];
      const indexGap    = curr.apexIndex - prev.apexIndex;
      const heightRatio = Math.min(prev.rawHeight, curr.rawHeight) / Math.max(prev.rawHeight, curr.rawHeight);
      if (indexGap < 3 && heightRatio > 0.95) {
        if (curr.rawHeight > prev.rawHeight) candidates[candidates.length - 1] = curr;
      } else {
        candidates.push(curr);
      }
    }

    // ─── STEP 2: Boundary Assignment via Inter-Apex Minimum Search ───────────
    function findValleyBetween(leftApex, rightApex) {
      let minVal = Infinity, minIdx = leftApex;
      for (let i = leftApex; i <= rightApex; i++) {
        const val = getIntensity(samples[i]);
        if (val < minVal) {
          minVal = val;
          minIdx = i;
        }
      }
      return minIdx;
    }

    const valleys = [];
    for (let i = 0; i < candidates.length - 1; i++) {
      valleys.push(findValleyBetween(candidates[i].apexIndex, candidates[i + 1].apexIndex));
    }

    const reportedPeaks = [];

    candidates.forEach((cand, idx) => {
      // Left boundary
      let leftIdx;
      if (idx === 0) {
        leftIdx = cand.apexIndex;
        while (leftIdx > 0 && getIntensity(samples[leftIdx - 1]) < getIntensity(samples[leftIdx]) && getIntensity(samples[leftIdx - 1]) > effectiveThreshold * 0.1) {
          leftIdx--;
        }
      } else {
        leftIdx = valleys[idx - 1];
      }

      // Right boundary
      let rightIdx;
      if (idx === candidates.length - 1) {
        rightIdx = cand.apexIndex;
        while (rightIdx < n - 1 && getIntensity(samples[rightIdx + 1]) < getIntensity(samples[rightIdx]) && getIntensity(samples[rightIdx + 1]) > effectiveThreshold * 0.1) {
          rightIdx++;
        }
      } else {
        rightIdx = valleys[idx];
      }

      const tStart    = getTime(samples[leftIdx]);
      const tEnd      = getTime(samples[rightIdx]);
      const widthBase = Math.max(0.01, tEnd - tStart);
      const sigma     = widthBase / 4;

      const baselineIntensity = (getIntensity(samples[leftIdx]) + getIntensity(samples[rightIdx])) / 2;
      const netHeight         = Math.max(0, cand.rawHeight - baselineIntensity);

      if (netHeight < effectiveThreshold * 0.5) return;

      // ─── Trapezoidal Area Integration ────────────────────────────────────
      let area = 0;
      for (let j = leftIdx; j < rightIdx; j++) {
        const dt   = getTime(samples[j + 1]) - getTime(samples[j]);
        const avgY = Math.max(0, ((getIntensity(samples[j]) + getIntensity(samples[j + 1])) / 2) - baselineIntensity);
        area += avgY * dt;
      }

      // ─── Peak Overlap Classification ──────────────────────────────────────
      let classification = 'BASELINE_SEPARATED';
      if (reportedPeaks.length > 0) {
        const prevPeak = reportedPeaks[reportedPeaks.length - 1];
        const gap      = cand.tApex - prevPeak.tR;
        const avgWidth = (widthBase + prevPeak.widthBase) / 2;
        if (gap < avgWidth * 0.5) {
          classification = 'SHOULDER_MERGED';
          prevPeak.classification = 'SHOULDER_MERGED';
        } else if (gap < avgWidth * 0.75) {
          classification = 'PARTIALLY_RESOLVED';
          if (prevPeak.classification === 'BASELINE_SEPARATED') {
            prevPeak.classification = 'PARTIALLY_RESOLVED';
          }
        }
      }

      reportedPeaks.push({
        id: `peak_${idx + 1}`,
        status: 'REPORTED',
        tR: cand.tApex,
        height: netHeight,
        area,
        widthBase,
        widthHalf: 2.3548 * sigma,
        widthFivePercent: 4.30 * sigma,
        sigma,
        tStart,
        tEnd,
        classification,
        compound: 'Unidentified Peak'
      });
    });

    return reportedPeaks;
  }
}
