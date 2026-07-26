import { getDeadTime, getRetentionFactor, getRetentionTime } from './retention.js';
import { getPeakSigma, getGaussianHeight } from './peak.js';
import { getBaselineNoise } from './detector.js';
import { UV_DETECTOR_PLUGIN } from '../../../chemistry/detectors/uvDetector.js';

/**
 * Calculates instantaneous combined detector signal at time t for a given sample composition.
 * Querying Compound entities and UV Detector Plugin.
 * @param {number} t - Current time in minutes
 * @param {Object} sampleEntity - Mixture or Compound entity from Chemistry Registry
 * @param {Object} params - { flowRate, organicPercent, sensitivity, temperature, wavelengthNm }
 */
export function synthesizeInstantSignal(t, sampleEntity, { flowRate, organicPercent, sensitivity, temperature = 25, wavelengthNm = 254 }) {
  const t0 = getDeadTime(flowRate);
  let totalPeakSignal = 0;
  const peakContributions = [];

  const components = sampleEntity && Array.isArray(sampleEntity.components)
    ? sampleEntity.components
    : (sampleEntity ? [{ compound: sampleEntity, concentration: 1.0 }] : []);

  for (const compDef of components) {
    const compound = compDef.compound;
    if (!compound || !compound.chromatography) continue;

    const kw = compound.chromatography.kw;
    const S = compound.chromatography.S;
    const k = getRetentionFactor(kw, S, organicPercent, temperature);
    const tR = getRetentionTime(t0, k);
    const sigma = getPeakSigma(tR, flowRate, temperature);

    // Calculate height via UV Detector Plugin Beer-Lambert absorbance
    const nominalHeight = UV_DETECTOR_PLUGIN.detect(compound, { wavelengthNm, sensitivity, concentration: compDef.concentration || 1.0 });
    const peakVal = getGaussianHeight(t, tR, sigma, nominalHeight);

    totalPeakSignal += peakVal;
    peakContributions.push({
      compound: compound.name,
      kw,
      S,
      tR,
      sigma,
      signal: peakVal
    });
  }

  const noise = getBaselineNoise(t, sensitivity, wavelengthNm);
  const rawSignal = totalPeakSignal + noise;

  return {
    signal: Math.max(0, rawSignal),
    peakContributions
  };
}
