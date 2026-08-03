import { getDeadTime, getRetentionTime, getObservedRetentionFactor } from './retention.js';
import { getBaselineNoise } from './detector.js';
import { SolutionChemistryEngine } from '../../../chemistry/engine/solutionChemistryEngine.js';
import { ConcentrationProfileEngine } from './concentrationProfileEngine.js';
import { UV_DETECTOR_PLUGIN } from '../../../chemistry/detectors/uvDetector.js';

/**
 * Calculates instantaneous combined detector signal S(t) at time t.
 * Uses Phase B SolutionChemistryEngine + ConcentrationProfileEngine + Beer-Lambert Summation.
 */
export function synthesizeInstantSignal(t, sampleEntity, { flowRate, organicPercent, sensitivity, temperature = 25, wavelengthNm = 254, pH = 7.0, bufferEntity = null }) {
  const t0 = getDeadTime(flowRate);

  // Detect blank injection via entity type — BlankSample is a first-class entity (Priority 2)
  const isBlank = sampleEntity?.type === 'BLANK_SAMPLE';

  // 1. Solution Chemistry Speciation (Phase B) - Skip for Blank
  let totalAbsorbance = 0;
  const peakContributions = [];

  if (!isBlank) {
    const chemEngine = new SolutionChemistryEngine();
    const chemPatch = chemEngine.process({
      sampleEntity,
      pH,
      bufferEntity,
      wavelengthNm,
      temperature
    });

    const speciesDist = chemPatch.speciesDistribution || [];
    const speciesWithTR = speciesDist.map(spec => {
      const compound = spec.compoundEntity;
      const k = getObservedRetentionFactor(compound, organicPercent, temperature, pH, bufferEntity);
      const tR = getRetentionTime(t0, k);
      return {
        ...spec,
        tR
      };
    });

    // 2. Physical Concentration Profiles c_i(t)
    const concEngine = new ConcentrationProfileEngine();
    const concPatch = concEngine.process({
      time: t,
      speciesDistribution: speciesWithTR,
      flowRate,
      temperature
    });

    const speciesProfiles = concPatch.speciesProfiles || [];

    // 3. Detector Absorbance Superposition via Beer-Lambert: A_total = sum( A_i )
    speciesProfiles.forEach(sp => {
      const compound = sp.compoundEntity;
      const absPerUnitConc = UV_DETECTOR_PLUGIN.detect(compound, {
        wavelengthNm,
        sensitivity,
        concentration: 1.0
      });

      const absorbance = absPerUnitConc * sp.concentration;
      totalAbsorbance += absorbance;

      peakContributions.push({
        compound: sp.speciesName,
        tR: sp.tR,
        sigma: sp.sigma,
        signal: absorbance
      });
    });
  }

  // 4. Solvent Front / Void Volume Disturbance at t0 (Priority 6)
  let solventFrontDisturbance = 0;
  if (t0 > 0) {
    const dt = t - t0;
    const sigma0 = 0.02; // Sharp solvent front peak
    solventFrontDisturbance = 0.005 * Math.exp(-0.5 * Math.pow(dt / sigma0, 2));
  }

  // 5. Baseline Noise Injection
  const noise = getBaselineNoise(t, sensitivity, wavelengthNm);
  const rawSignal = totalAbsorbance + solventFrontDisturbance + noise;

  return {
    signal: Math.max(0, rawSignal),
    peakContributions,
    isSolventFront: Math.abs(t - t0) < 0.04
  };
}
