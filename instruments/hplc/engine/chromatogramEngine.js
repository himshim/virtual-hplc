import { getDeadTime, getRetentionTime, getObservedRetentionFactor } from './retention.js';
import { getPeakSigma, getGaussianHeight } from './peak.js';
import { getBaselineNoise } from './detector.js';
import { UV_DETECTOR_PLUGIN } from '../../../chemistry/detectors/uvDetector.js';

/**
 * Calculates instantaneous combined detector signal at time t for a given sample composition.
 * Querying Compound entities, Solution Chemistry Engine, and UV Detector Plugin.
 */
export function synthesizeInstantSignal(t, sampleEntity, { flowRate, organicPercent, sensitivity, temperature = 25, wavelengthNm = 254, pH = 7.0, bufferEntity = null }) {
  const t0 = getDeadTime(flowRate);
  let totalPeakSignal = 0;
  const peakContributions = [];

  const components = sampleEntity && Array.isArray(sampleEntity.components)
    ? sampleEntity.components
    : (sampleEntity ? [{ compound: sampleEntity, concentration: 1.0 }] : []);

  for (const compDef of components) {
    const compound = compDef.compound;
    if (!compound || !compound.chromatography) continue;

    const k = getObservedRetentionFactor(compound, organicPercent, temperature, pH, bufferEntity);
    const tR = getRetentionTime(t0, k);
    const sigma = getPeakSigma(tR, flowRate, temperature);

    // Calculate height via UV Detector Plugin Beer-Lambert absorbance
    const nominalHeight = UV_DETECTOR_PLUGIN.detect(compound, { wavelengthNm, sensitivity, concentration: compDef.concentration || 1.0 });
    const peakVal = getGaussianHeight(t, tR, sigma, nominalHeight);

    totalPeakSignal += peakVal;
    peakContributions.push({
      compound: compound.name,
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
