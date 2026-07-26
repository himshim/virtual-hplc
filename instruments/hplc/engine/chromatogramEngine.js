import { getDeadTime, getRetentionFactor, getRetentionTime } from './retention.js';
import { getPeakSigma, getGaussianHeight } from './peak.js';
import { getBaselineNoise } from './detector.js';

/**
 * Calculates instantaneous combined detector signal at time t for a given sample composition.
 * @param {number} t - Current time in minutes
 * @param {Object} sampleObj - Sample schema object from database
 * @param {Object} params - { flowRate, organicPercent, sensitivity, temperature }
 */
export function synthesizeInstantSignal(t, sampleObj, { flowRate, organicPercent, sensitivity, temperature = 25 }) {
  const t0 = getDeadTime(flowRate);
  let totalPeakSignal = 0;
  const peakContributions = [];

  if (sampleObj && Array.isArray(sampleObj.peaks)) {
    for (const peakDef of sampleObj.peaks) {
      const k = getRetentionFactor(peakDef.kw, peakDef.S, organicPercent, temperature);
      const tR = getRetentionTime(t0, k);
      const sigma = getPeakSigma(tR, flowRate, temperature);
      const peakVal = getGaussianHeight(t, tR, sigma, peakDef.height) * sensitivity;

      totalPeakSignal += peakVal;
      peakContributions.push({
        compound: peakDef.compound,
        kw: peakDef.kw,
        S: peakDef.S,
        tR,
        sigma,
        signal: peakVal
      });
    }
  }

  const noise = getBaselineNoise(t, sensitivity);
  const rawSignal = totalPeakSignal + noise;

  return {
    signal: Math.max(0, rawSignal),
    peakContributions
  };
}
